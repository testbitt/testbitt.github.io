/* Version 3.6 — resilient cloud uploads with worker parsing and visible progress */
(()=>{
const API_V36='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-api';
const ROLE_KEY_V36='kamuInvCloudRole',TOKEN_KEY_V36='kamuInvCloudToken',CHUNK_SIZE_V36=500,UPLOAD_PARALLEL_V36=4;
const sleepV36=ms=>new Promise(r=>setTimeout(r,ms));
function roleV36(){return localStorage.getItem(ROLE_KEY_V36)||''}
function tokenV36(){return localStorage.getItem(TOKEN_KEY_V36)||''}
function statusElV36(type){return document.querySelector(type==='stock'?'#mStock':type==='item'?'#mItem':type==='bom'?'#mBom':'#mConvert')}
function escV36(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
function setStatusV36(type,text,pct,state){
 const el=statusElV36(type);if(!el)return;const n=Math.max(0,Math.min(100,Number(pct)||0));
 el.className='subtle upload-status-v36 '+(state||'');el.innerHTML='<div class="upload-status-line"><span>'+escV36(text)+'</span><b>'+Math.round(n)+'%</b></div><div class="upload-progress-v36"><i style="width:'+n+'%"></i></div>';
}
async function apiV36(action,data,retries){
 let last;for(let n=0;n<=(retries||0);n++){try{const r=await fetch(API_V36,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tokenV36()},body:JSON.stringify(Object.assign({action},data||{}))});let x={};try{x=await r.json()}catch{}if(!r.ok||x.ok===false){const e=new Error(x.message||x.error||('HTTP '+r.status));e.code=x.error;if(r.status<500)throw e;last=e}else return x}catch(e){last=e;if(e.code&&e.code!=='SERVER_ERROR')throw e}if(n<(retries||0))await sleepV36(350*Math.pow(2,n))}throw last||Error('Cloud upload failed')
}
function workerMainV36(){
 const T=v=>String(v??'').trim(),N=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0},K=v=>T(v).toLowerCase().replace(/\s+/g,'').replace(/[.\-_\/()]/g,'');
 const alias={wh:['warehousecode','shopcode'],rm:['rmcode'],item:['itemcode'],rec:['reccode'],comp:['itemcode'],mod:['modifdate','modifydate'],wipc:['wipcode'],rmitem:['rmitemcode']};
 function V(r,n){for(const a of alias[n]||[])for(const k of Object.keys(r||{}))if(K(k)===a)return r[k];return''}
 function findHeader(a,type){const sig={stock:['warehousecode','rmcode'],item:['shopcode','itemcode','totalqty'],recipe:['reccode','itemcode','quantity'],wip:['wipcode','fgqty','rmqty']}[type];for(let i=0;i<Math.min(80,a.length);i++){const s=new Set((a[i]||[]).map(K));if(sig.every(x=>s.has(x)))return i}return-1}
 function rows(ws,type){const a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}),h=findHeader(a,type);if(h<0)throw Error('ไม่พบ Header '+type);const out=XLSX.utils.sheet_to_json(ws,{range:h,defval:''}).filter(r=>Object.values(r).some(x=>T(x)));return out.filter(r=>{if(type==='stock'){const wh=T(V(r,'wh')),rm=T(V(r,'rm'));return wh&&rm&&wh!=='รหัสคลังสินค้า'&&rm!=='รหัสวัตถุดิบ'}if(type==='item'){const wh=T(V(r,'wh')),it=T(V(r,'item'));return wh&&it&&wh!=='รหัสสาขา'&&it!=='รหัสสินค้า'}if(type==='recipe')return T(V(r,'rec'))&&T(V(r,'comp'));if(type==='wip')return T(V(r,'wipc'))&&T(V(r,'rmitem'));return true})}
 function reportDate(wb,ws){const a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});for(let r=0;r<Math.min(15,a.length);r++)for(let c=0;c<(a[r]||[]).length;c++){const s=T(a[r][c]),m=s.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/);if(m)return m[1]}const m=(wb.SheetNames[0]||'').match(/(\d{4}-\d{2}-\d{2})/);return m?m[1]:''}
 function pick(r,key){for(const k of Object.keys(r||{}))if(K(k)===key)return r[k];return''}
 self.onmessage=e=>{try{
  self.postMessage({stage:'engine'});importScripts(e.data.xlsxUrl);
  self.postMessage({stage:'workbook'});const type=e.data.type,wb=XLSX.read(e.data.buffer,{type:'array',cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]];let payload,meta={};
  if(type==='stock'){payload=rows(ws,'stock');if(!payload.length)throw Error('ไม่พบข้อมูล Stock Movement หลังหัวตาราง');meta.stock_date=reportDate(wb,ws)}
  else if(type==='item'){payload=rows(ws,'item');if(!payload.length)throw Error('ไม่พบข้อมูล Item Sale หลังหัวตาราง')}
  else if(type==='bom'){let rr=[],ww=[];for(const sn of wb.SheetNames){const sheet=wb.Sheets[sn],a=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});if(findHeader(a,'recipe')>=0)rr.push(...rows(sheet,'recipe'));if(findHeader(a,'wip')>=0)ww.push(...rows(sheet,'wip'))}if(!rr.length)throw Error('ไม่พบ Sheet Recipe ที่มี RecCode / ItemCode / Quantity');const seen=new Set();rr=rr.filter(r=>{const k=JSON.stringify(r);if(seen.has(k))return false;seen.add(k);return true});const by={};for(const r of rr){const c=T(V(r,'rec'));if(!c)continue;const d=new Date(V(r,'mod')||0).getTime()||0;(by[c]??=[]).push([d,r])}rr=Object.values(by).flatMap(g=>{const md=Math.max(...g.map(x=>x[0]));return g.filter(x=>x[0]===md).map(x=>x[1])});payload=[...rr.map(row=>({section:'recipe',row})),...ww.map(row=>({section:'wip',row}))];meta.recipe_rows=rr.length;meta.wip_rows=ww.length}
  else{const a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});let h=-1;for(let i=0;i<Math.min(80,a.length);i++){const set=new Set((a[i]||[]).map(K));if(['code','unit','convert','convertunit'].every(x=>set.has(x))){h=i;break}}if(h<0)throw Error('ไม่พบ Header Convert: Code / Unit / Convert / Convert Unit');payload=XLSX.utils.sheet_to_json(ws,{range:h,defval:''}).map(r=>({code:T(pick(r,'code')),desc:T(pick(r,'detailrawmaterial')),unit:T(pick(r,'unit')),factor:N(pick(r,'convert')),convertUnit:T(pick(r,'convertunit'))})).filter(r=>r.code&&r.unit&&r.convertUnit&&r.factor>0);if(!payload.length)throw Error('ไม่พบข้อมูล Convert ที่ใช้งานได้')}
  self.postMessage({ok:true,payload,meta});
 }catch(err){self.postMessage({ok:false,error:String(err?.message||err)})}}
}
function parseV36(file,type){
 return new Promise(async(resolve,reject)=>{const url=URL.createObjectURL(new Blob(['('+workerMainV36.toString()+')()'],{type:'text/javascript'})),w=new Worker(url);w.onmessage=e=>{if(e.data.stage){setStatusV36(type,e.data.stage==='engine'?'กำลังโหลดตัวอ่าน Excel...':'กำลัง parse Excel...',e.data.stage==='engine'?8:18);return}w.terminate();URL.revokeObjectURL(url);e.data.ok?resolve(e.data):reject(Error(e.data.error))};w.onerror=e=>{w.terminate();URL.revokeObjectURL(url);reject(Error(e.message||'Excel worker error'))};try{const b=await file.arrayBuffer();setStatusV36(type,'อ่านไฟล์แล้ว กำลังส่งไปประมวลผล...',5);w.postMessage({buffer:b,type,xlsxUrl:'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'},[b])}catch(e){w.terminate();URL.revokeObjectURL(url);reject(e)}})
}
function metadataV36(type,file,parsed){
 const p=parsed.payload,m=Object.assign({file_name:file.name,rows:p.length},parsed.meta||{});
 if(type==='stock'||type==='item')m.branches=new Set(p.map(r=>T(V(r,'wh'))).filter(Boolean)).size;
 return m;
}
async function cloudUploadV36(type,file,parsed){
 const rows=parsed.payload,meta=metadataV36(type,file,parsed),chunks=Math.max(1,Math.ceil(rows.length/CHUNK_SIZE_V36));
 const begin=await apiV36('begin_upload',{dataset_type:type,expected_chunks:chunks,expected_rows:rows.length,metadata:meta},2),id=begin.upload_id;
 try{let next=0,done=0;async function sender(){while(next<chunks){const i=next++,part=rows.slice(i*CHUNK_SIZE_V36,(i+1)*CHUNK_SIZE_V36);await apiV36('upload_chunk',{upload_id:id,chunk_index:i,payload:part},2);done++;setStatusV36(type,'กำลังบันทึก Cloud '+done+'/'+chunks,30+Math.round(60*done/chunks))}}await Promise.all(Array.from({length:Math.min(UPLOAD_PARALLEL_V36,chunks)},sender));
  setStatusV36(type,'กำลังตรวจสอบและแทนที่ข้อมูลเดิม...',94);const committed=await apiV36('commit_upload',{upload_id:id},2);
  setStatusV36(type,'กำลังยืนยันข้อมูลที่บันทึกใน Cloud...',98);const verified=await apiV36('upload_status',{upload_id:id},2);
  if(verified.status!=='committed'||Number(verified.received_rows)!==rows.length||Number(committed.rows)!==rows.length)throw Error('ยืนยันข้อมูลหลังบันทึกไม่สำเร็จ');
  return Object.assign(meta,{saved_rows:Number(committed.rows),saved_chunks:Number(committed.chunks)});
 }catch(e){try{await apiV36('abort_upload',{upload_id:id},0)}catch{}throw e}
}
function applyParsedV36(type,parsed,file){
 if(type==='stock'){S.stock=parsed.payload;S.stockDate=parsed.meta.stock_date||'';S.meta.stock=file.name}
 else if(type==='item'){S.item=parsed.payload;S.meta.item=file.name}
 else if(type==='bom'){S.recipe=parsed.payload.filter(x=>x.section==='recipe').map(x=>x.row);S.wip=parsed.payload.filter(x=>x.section==='wip').map(x=>x.row);S.meta.bom=file.name}
 else{S.convert=parsed.payload;S.meta.convert=file.name}
 invalidateCalcCache();buildIndexes();refresh();compute();
}
async function uploadV36(file,type){
 if(!file)throw Error('ไม่พบไฟล์');const role=roleV36();if(!role||!tokenV36())throw Error('กรุณา Login ก่อนใช้งาน');if(role==='user'&&!['stock','item'].includes(type))throw Error('User Upload ได้เฉพาะ Stock Movement และ Item Sale');
 setStatusV36(type,'กำลังอ่าน '+file.name,2);
 try{const parsed=await parseV36(file,type);setStatusV36(type,'parse สำเร็จ '+parsed.payload.length.toLocaleString()+' rows',25);const meta=await cloudUploadV36(type,file,parsed);setStatusV36(type,'บันทึกอัตโนมัติแล้ว • '+meta.saved_rows.toLocaleString()+' rows • แทนที่ข้อมูลเดิมเรียบร้อย',100,'success');await new Promise(requestAnimationFrame);applyParsedV36(type,parsed,file);if(role==='admin'&&typeof refreshAdminOverview==='function')refreshAdminOverview().catch(console.warn)}
 catch(e){setStatusV36(type,'Upload ไม่สำเร็จ: '+String(e.message||e),100,'error');throw e}
}
function bindUploadsV36(){
 const map={fStock:'stock',fItem:'item',fBom:'bom',fConvert:'convert'};for(const [id,type] of Object.entries(map)){const input=document.getElementById(id);if(!input)continue;input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;input.disabled=true;try{await uploadV36(file,type)}catch(e){console.error(e)}finally{input.disabled=false;input.value=''}}}
}
save=async function(){
 if(roleV36()!=='admin'||!Array.isArray(S.convert))return;
 await apiV36('admin_save_master',{dataset_type:'convert',payload:S.convert,metadata:{file_name:S.meta?.convert||'Conversion Master Editor',rows:S.convert.length,source:'editor'},silent:true},2);
};
function cleanV36(){document.querySelectorAll('.notice,.cloud-note').forEach(el=>{if((el.textContent||'').includes('IndexedDB')||el.classList.contains('cloud-note'))el.remove()});bindUploadsV36();const v=document.querySelector('.version');if(v)v.textContent='Version 3.14 • Public Multi‑User Cloud'}
const css=document.createElement('style');css.textContent='#mStock,#mItem,#mBom,#mConvert{display:block!important;margin-top:10px}.upload-status-line{display:flex;justify-content:space-between;gap:8px;align-items:center}.upload-progress-v36{height:7px;background:#e3efe7;border-radius:99px;overflow:hidden;margin-top:6px}.upload-progress-v36 i{display:block;height:100%;background:#2f9a63;transition:width .2s ease}.upload-status-v36.error{color:#b42318}.upload-status-v36.error i{background:#d64545}.upload-status-v36.success{color:#147645;font-weight:700}.upload-card input:disabled{opacity:.55;cursor:wait}';document.head.appendChild(css);
read=uploadV36;cleanV36();setTimeout(cleanV36,150);setTimeout(cleanV36,800);document.addEventListener('submit',()=>setTimeout(cleanV36,600),true);
})();
