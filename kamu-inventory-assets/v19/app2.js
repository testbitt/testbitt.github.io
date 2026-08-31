async function read(file,type){
 if(!window.XLSX)throw Error('ตัวอ่าน Excel ยังโหลดไม่สำเร็จ กรุณา Refresh หน้าเว็บแล้วลองใหม่');
 const metaEl=type==='stock'?$('#mStock'):type==='item'?$('#mItem'):$('#mBom');
 metaEl.textContent=`กำลังอ่าน ${file.name} ...`;
 try{
  const b=await file.arrayBuffer(),wb=XLSX.read(b,{type:'array',cellDates:true});
  if(type==='stock'){
   const ws=wb.Sheets[wb.SheetNames[0]],parsed=rows(ws,'stock');if(!parsed.length)throw Error('ไม่พบข้อมูล Stock Movement หลังหัวตาราง');
   S.stock=parsed;S.stockDate=reportDate(wb,ws);S.meta.stock=file.name;
  }else if(type==='item'){
   const ws=wb.Sheets[wb.SheetNames[0]],parsed=rows(ws,'item');if(!parsed.length)throw Error('ไม่พบข้อมูล Item Sale หลังหัวตาราง');
   S.item=parsed;S.meta.item=file.name;
  }else{
   let rr=[],ww=[];
   for(const sn of wb.SheetNames){const ws=wb.Sheets[sn],a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});if(findHeader(a,'recipe')>=0)rr.push(...rows(ws,'recipe'));if(findHeader(a,'wip')>=0)ww.push(...rows(ws,'wip'))}
   if(!rr.length)throw Error('ไม่พบ Sheet Recipe ที่มี RecCode / ItemCode / Quantity');
   let seen=new Set();rr=rr.filter(r=>{const k=JSON.stringify(r);if(seen.has(k))return false;seen.add(k);return true});
   let by={};for(const r of rr){const c=T(V(r,'rec'));if(!c)continue;const d=new Date(V(r,'mod')||0).getTime()||0;(by[c]??=[]).push([d,r])}
   S.recipe=Object.values(by).flatMap(g=>{const md=Math.max(...g.map(x=>x[0]));return g.filter(x=>x[0]===md).map(x=>x[1])});S.wip=ww;S.meta.bom=file.name;
  }
  buildIndexes();await save();refresh();compute();
  metaEl.insertAdjacentHTML('beforeend',' <span class="ok">✓ บันทึกสำเร็จ</span>');
 }catch(e){metaEl.innerHTML=`<span class="bad">Upload ไม่สำเร็จ: ${String(e.message||e)}</span>`;throw e}
}
function unitKind(u){const x=K(u);if(x==='u004'||x==='g'||x.includes('กรัม'))return'g';if(x==='u051'||x==='ml'||x.includes('มิลลิลิตร'))return'ml';if(x==='kg'||x.includes('กิโลกรัม')||x==='กก')return'kg';if(x==='l'||x.includes('ลิตร'))return'l';return x}
function packFactorFromDescription(desc,bu){const d=T(desc).toLowerCase().replace(/,/g,''),kind=unitKind(bu);let m;if(kind==='g'){m=d.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|กก\.?|กิโลกรัม)/i);if(m)return Number(m[1])*1000;m=d.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|กรัม)/i);if(m)return Number(m[1])}if(kind==='ml'){m=d.match(/(\d+(?:\.\d+)?)\s*(?:ml|มล\.?|มิลลิลิตร)/i);if(m)return Number(m[1]);m=d.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|liter|litre|ลิตร)/i);if(m)return Number(m[1])*1000}return 0}
function convFactor(code,bu,su,desc=''){let custom=Number(localStorage.getItem('conv:'+code+':'+bu+':'+su));if(custom>0)return custom;let b=K(bu),s=K(su);if(b===s)return 1;const bk=unitKind(bu),sk=unitKind(su);if(bk==='g'&&sk==='kg')return 1000;if(bk==='ml'&&sk==='l')return 1000;const auto=packFactorFromDescription(desc,bu);if(auto>0&&!['g','ml','kg','l'].includes(sk))return auto;return 0}
function mergePart(map,code,unit,qty){const key=code+'\u0001'+unit;const old=map.get(key);if(old)old.qty+=qty;else map.set(key,{code,unit,qty})}
function wipUnitParts(code,trail=new Set()){
 if(IDX.wipUnitCache.has(code))return IDX.wipUnitCache.get(code);
 if(trail.has(code))return [];
 const rs=IDX.wipByCode.get(code)||[];if(!rs.length)return [{code,qty:1,unit:''}];
 const next=new Set(trail);next.add(code);const out=new Map();
 for(const r of rs){const fg=N(V(r,'fgq'))||1,c=T(V(r,'rmitem')),u=T(V(r,'rmu')),ratio=N(V(r,'rmq'))/fg;if(!c||!ratio)continue;
   if(c.startsWith('WP-')){for(const p of wipUnitParts(c,next))mergePart(out,p.code,p.unit||u,p.qty*ratio)}else mergePart(out,c,u,ratio)
 }
 const arr=[...out.values()];IDX.wipUnitCache.set(code,arr);return arr;
}
function expected(branch,date){
 const cacheKey=branch+'\u0001'+(date||'*');if(IDX.expectedCache.has(cacheKey))return IDX.expectedCache.get(cacheKey);
 const sales=date?IDX.salesByDate.get(branch+'\u0001'+date):IDX.salesAll.get(branch);const out=new Map();
 if(sales){for(const [item,qty] of sales){const rec=IDX.recipeByRec.get(item)||[];for(const r of rec){const c=T(V(r,'comp')),q=qty*N(V(r,'compq')),u=T(V(r,'unit'));if(!c||!q)continue;if(c.startsWith('WP-')){for(const p of wipUnitParts(c))mergePart(out,p.code,p.unit||u,p.qty*q)}else mergePart(out,c,u,q)}}}
 const grouped=new Map();for(const p of out.values()){if(!grouped.has(p.code))grouped.set(p.code,new Map());addQty(grouped.get(p.code),p.unit,p.qty)}
 IDX.expectedCache.set(cacheKey,grouped);return grouped;
}
function countsKey(b,rm){return 'count:'+b+':'+S.stockDate+':'+rm}
function rawBomText(bomUnits){return bomUnits.map(([u,q])=>`${F(q)} ${u||'unit'}`).join(' + ')}