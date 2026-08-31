const cols=['RM','Description','Unit','T.Out','WIP Out','Damage','Adj.Out','BOM Raw Usage','BOM Stock Usage','Movement Sales Usage','Usage Var','Waste','Calc Theory','Report Theory','Report Actual','Actual Count','Count Diff','Diff %','Std.Cost','Variance Cost','Status'];
function filteredAnalysis(){const st=$('#status').value;return S.analysis.filter(x=>(!selectedRM.size||selectedRM.has(x.rm))&&(!st||x.status===st))}
function render(){
 const a=filteredAnalysis();$('#tbl thead').innerHTML='<tr>'+cols.map(x=>'<th>'+x+'</th>').join('');
 $('#tbl tbody').innerHTML=a.map(x=>`<tr><td>${x.rm}</td><td>${x.desc}</td><td>${x.unit}</td>${['tout','wipout','damage','adjout'].map(k=>`<td class="num">${F(x[k])}</td>`).join('')}<td class="bom-raw">${x.bomRaw||''}${x.missingConv?` <span class="needs-tag">ต้องแปลง ${x.missingConv}</span>`:''}</td><td class="num">${x.bom==null?'—':F(x.bom)}</td><td class="num">${F(x.mov)}</td><td class="num">${x.uv==null?'—':F(x.uv)}</td><td class="num">${F(x.waste)}</td><td class="num">${x.calc==null?'—':F(x.calc)}</td><td class="num">${F(x.reportTheory)}</td><td class="num">${F(x.reportActual)}</td><td><input class="count" data-rm="${x.rm}" type="number" step="any" value="${x.count??''}"></td><td class="num">${x.diff==null?'':F(x.diff)}</td><td class="num">${x.diffp==null?'':F(x.diffp)+'%'}</td><td class="num">${F(x.cost)}</td><td class="num">${F(x.vc)}</td><td class="${x.status==='Short'?'bad':x.status==='Over'?'warn':x.status==='OK'?'ok':''}">${x.status}</td></tr>`).join('');
 $$('.count').forEach(i=>i.onchange=()=>{const b=$('#branch').value,row=S.analysis.find(x=>x.rm===i.dataset.rm);if(!row)return;if(i.value===''){localStorage.removeItem(countsKey(b,row.rm));row.count=null;row.diff=null;row.diffp=null;row.vc=0;row.status=row.missingConv?'Needs conversion':'Not counted'}else{localStorage.setItem(countsKey(b,row.rm),i.value);row.count=Number(i.value);row.diff=row.calc==null?null:row.count-row.calc;row.diffp=row.diff==null||Math.abs(row.calc)<1e-9?null:row.diff/row.calc*100;row.vc=row.diff==null?0:row.diff*row.cost;row.status=row.missingConv?'Needs conversion':Math.abs(row.diff)<0.0005?'OK':row.diff<0?'Short':'Over'}render()});
 const exp=S.currentExpected||new Map(),bomUsed=[...exp.keys()].filter(code=>S.analysis.some(x=>x.rm===code)).length;
 $('#kItems').textContent=S.analysis.length;$('#kUsage').textContent=bomUsed;$('#kShort').textContent=S.analysis.filter(x=>x.status==='Short').length;$('#kOver').textContent=S.analysis.filter(x=>x.status==='Over').length;const kc=$('#kConv');if(kc)kc.textContent=new Set(S.needs.map(x=>x.rm)).size;$('#kCost').textContent=F(S.analysis.reduce((z,x)=>z+x.vc,0));
 const d=$('#date').value,sales=d?IDX.salesByDate.get($('#branch').value+'\u0001'+d):IDX.salesAll.get($('#branch').value),soldSku=sales?.size||0,matched=sales?[...sales.keys()].filter(x=>IDX.recipeCodes.has(x)).length:0,rawRm=exp.size,stockRows=IDX.stockByBranch.get($('#branch').value)?.length||0;
 let notices=[];if(!stockRows)notices.push('สาขานี้ไม่มี Stock Movement จึงไม่สามารถทำ Inventory Audit ได้');if(!soldSku)notices.push('ไม่พบ Item Sale ของสาขา/วันที่ที่เลือก');if(soldSku&&matched===0)notices.push('Item Sale ไม่ Match กับ RecCode ใน BOM');if(S.needs.length)notices.push(`BOM มีการใช้แล้ว แต่ ${new Set(S.needs.map(x=>x.rm)).size} RM ยังต้องกำหนด/ตรวจ Unit Conversion`);if(S.stockDate&&d&&!String(d).includes(S.stockDate))notices.push(`Stock Date ${S.stockDate} และ Item Sale Date ${d} เป็นคนละวัน`);
 $('#dateNotice').innerHTML=notices.length?`<div class="notice">${notices.join(' • ')}</div>`:'';
 const diag=$('#bomDiag');if(diag)diag.innerHTML=`<div class="diag">Item Sale SKU<b>${soldSku}</b></div><div class="diag">Match Recipe<b>${matched}</b></div><div class="diag">BOM RM ที่แตกได้<b>${rawRm}</b></div><div class="diag ${S.needs.length?'warn':''}">Need Conversion<b>${new Set(S.needs.map(x=>x.rm)).size}</b></div>`;
 renderConv();const shown=$('#shownCount');if(shown)shown.textContent=`แสดง ${a.length.toLocaleString()} / ${S.analysis.length.toLocaleString()} รายการ`;
}
function recon(){const b=$('#branch').value,rows=[],soldMap=$('#date').value?IDX.salesByDate.get(b+'\u0001'+$('#date').value):IDX.salesAll.get(b),sold=soldMap?[...soldMap.keys()]:[];sold.filter(x=>!IDX.recipeCodes.has(x)).forEach(x=>rows.push(['Item without Recipe',b,x,'','','','','ไม่มี Recipe']));const stock=new Set((IDX.stockByBranch.get(b)||[]).map(r=>T(V(r,'rm'))));const exp=S.currentExpected||new Map();for(const [code,units] of exp){if(!stock.has(code)){let total=0;for(const q of units.values())total+=q;rows.push(['BOM RM not in Stock',b,code,'',F(total),'','','ไม่พบ RM ใน Stock Movement'])}}S.needs.forEach(x=>rows.push(['Needs conversion',b,x.rm,'','','','',`${x.bu} -> ${x.su}`]));S.analysis.filter(x=>x.uv!=null&&Math.abs(x.uv)>0.0005).forEach(x=>rows.push(['Usage variance',b,x.rm,x.desc,F(x.bom),F(x.mov),F(x.uv),'Movement Sales Usage - BOM Expected']));S.recon=rows;$('#reconTbl tbody').innerHTML=rows.slice(0,1500).map(r=>'<tr>'+r.map((x,i)=>`<td class="${i>=4&&i<=6?'num':''}">${x}</td>`).join('')+'</tr>').join('')}
function renderConv(){let uniq={};for(const n of S.needs)uniq[n.rm+'|'+n.bu+'|'+n.su]=n;$('#convTbl tbody').innerHTML=Object.values(uniq).map(n=>`<tr><td>${n.rm}<div class="subtle">${n.desc||''}</div></td><td>${n.bu}</td><td>${n.su}</td><td><input type="number" step="any" class="cf" data-k="${n.rm}|${n.bu}|${n.su}" value="${localStorage.getItem('conv:'+n.rm+':'+n.bu+':'+n.su)||''}"></td><td>Needs conversion${n.raw?`<div class="subtle">Raw ${F(n.raw)} ${n.bu}</div>`:''}</td></tr>`).join('');$$('.cf').forEach(i=>i.onchange=()=>{let [rm,bu,su]=i.dataset.k.split('|');if(Number(i.value)>0)localStorage.setItem('conv:'+rm+':'+bu+':'+su,i.value);else localStorage.removeItem('conv:'+rm+':'+bu+':'+su);invalidateCalcCache();compute()})}
$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.page').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#'+t.dataset.p).classList.add('active')});
async function uploadEvent(e,type){const f=e.target.files&&e.target.files[0];if(!f)return;try{await read(f,type)}catch(x){alert(x.message||x)}finally{e.target.value=''}}
$('#fStock').onchange=e=>uploadEvent(e,'stock');$('#fItem').onchange=e=>uploadEvent(e,'item');$('#fBom').onchange=e=>uploadEvent(e,'bom');
$('#branch').onchange=()=>{if(!activeCustomCheck)selectedRM.clear();compute()};$('#date').onchange=compute;$('#status').onchange=render;$('#calc').onclick=compute;
$('#rmFilterBtn').onclick=e=>{e.stopPropagation();toggleRMPopup()};$('#rmSearch').oninput=renderRMOptions;$('#rmAll').onclick=()=>{selectedRM=new Set(rmChoices().map(x=>x.code));markCustomDirty();renderRMFilter(true);render()};$('#rmClear').onclick=()=>{selectedRM.clear();markCustomDirty();renderRMFilter(true);render()};$('#rmPopup').onclick=e=>e.stopPropagation();document.addEventListener('click',()=>toggleRMPopup(false));
$('#customCheckSelect').onchange=e=>{const name=e.target.value;if(name)applyCustomCheck(name);else{activeCustomCheck='';customDirty=false;localStorage.removeItem('inventory:lastCustomCheck');renderCustomChecks();setCustomMessage('')}};$('#saveCustom').onclick=saveCustomCheckAs;$('#updateCustom').onclick=updateCustomCheck;$('#deleteCustom').onclick=deleteCustomCheck;
$('#useReport').onclick=()=>{let b=$('#branch').value;for(const x of S.analysis)localStorage.setItem(countsKey(b,x.rm),x.reportActual);compute()};$('#clearCount').onclick=()=>{let b=$('#branch').value;for(const x of S.analysis)localStorage.removeItem(countsKey(b,x.rm));compute()};

/* Version 2.0 — Convert Master Upload */
if(!Array.isArray(S.convert))S.convert=[];
const _saveBeforeConvert=save;
save=async function(){await dbPut('state',{stock:S.stock,item:S.item,recipe:S.recipe,wip:S.wip,convert:S.convert,stockDate:S.stockDate,meta:S.meta})};
const _buildIndexesBeforeConvert=buildIndexes;
buildIndexes=function(){_buildIndexesBeforeConvert();IDX.convertByCode=new Map();for(const r of S.convert||[]){if(r&&r.code&&Number(r.factor)>0)IDX.convertByCode.set(T(r.code),r)}};
const _convFactorBeforeConvert=convFactor;
convFactor=function(code,bu,su,desc=''){
 const manual=Number(localStorage.getItem('conv:'+code+':'+bu+':'+su));if(manual>0)return manual;
 const row=IDX.convertByCode?.get(T(code));
 if(row&&Number(row.factor)>0){const stockOk=K(row.unit)===K(su),bomOk=unitKind(row.convertUnit)===unitKind(bu)||K(row.convertUnit)===K(bu);if(stockOk&&bomOk)return Number(row.factor)}
 return _convFactorBeforeConvert(code,bu,su,desc);
};
function convertPick(r,key){for(const k of Object.keys(r||{}))if(K(k)===key)return r[k];return''}
const _readBeforeConvert=read;
read=async function(file,type){
 if(type!=='convert')return _readBeforeConvert(file,type);
 const metaEl=$('#mConvert');metaEl.textContent=`กำลังอ่าน ${file.name} ...`;
 try{
  if(!window.XLSX)throw Error('ตัวอ่าน Excel ยังโหลดไม่สำเร็จ กรุณา Refresh หน้าเว็บแล้วลองใหม่');
  const b=await file.arrayBuffer(),wb=XLSX.read(b,{type:'array',cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]],a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
  let h=-1;for(let i=0;i<Math.min(80,a.length);i++){const set=new Set((a[i]||[]).map(K));if(['code','unit','convert','convertunit'].every(x=>set.has(x))){h=i;break}}
  if(h<0)throw Error('ไม่พบ Header Convert: Code / Unit / Convert / Convert Unit');
  const raw=XLSX.utils.sheet_to_json(ws,{range:h,defval:''});
  const parsed=raw.map(r=>({code:T(convertPick(r,'code')),desc:T(convertPick(r,'detailrawmaterial')),unit:T(convertPick(r,'unit')),factor:N(convertPick(r,'convert')),convertUnit:T(convertPick(r,'convertunit'))})).filter(r=>r.code&&r.unit&&r.factor>0&&r.convertUnit);
  if(!parsed.length)throw Error('ไม่พบข้อมูล Convert ที่ใช้งานได้');
  const map=new Map();for(const r of parsed)map.set(r.code,r);S.convert=[...map.values()];S.meta.convert=file.name;
  buildIndexes();invalidateCalcCache();await save();refresh();compute();
  metaEl.insertAdjacentHTML('beforeend',' <span class="ok">✓ บันทึกสำเร็จ</span>');
 }catch(e){metaEl.innerHTML=`<span class="bad">Upload ไม่สำเร็จ: ${String(e.message||e)}</span>`;throw e}
};
const _refreshBeforeConvert=refresh;
refresh=function(){_refreshBeforeConvert();const el=$('#mConvert');if(el)el.textContent=S.convert?.length?`${S.meta.convert||''} • ${S.convert.length.toLocaleString()} conversion rows`:'ยังไม่มีข้อมูล';const info=$('#convertMasterInfo');if(info)info.textContent=S.convert?.length?`Convert Master: ${S.convert.length.toLocaleString()} รายการ • ใช้ก่อน Auto Conversion`:'ยังไม่ได้ Upload Convert Master'};
const uploadGrid=document.querySelector('#upload .grid');
if(uploadGrid&&!document.querySelector('#fConvert'))uploadGrid.insertAdjacentHTML('beforeend','<div class="card upload-card"><div class="upload-icon">🔄</div><b>4. Convert</b><input type="file" id="fConvert" accept=".xlsx,.xls,.xlsm"><div id="mConvert" class="subtle">ยังไม่มีข้อมูล</div></div>');
const convNotice=document.querySelector('#conversion .notice');if(convNotice&&!document.querySelector('#convertMasterInfo'))convNotice.insertAdjacentHTML('afterend','<div id="convertMasterInfo" class="subtle" style="margin-top:8px"></div>');
const st=document.createElement('style');st.textContent='#upload .grid{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:1199px){#upload .grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){#upload .grid{grid-template-columns:1fr}}';document.head.appendChild(st);
const ver=document.querySelector('.version');if(ver)ver.textContent='Version 2.0 • Convert Master Upload';
if($('#fConvert'))$('#fConvert').onchange=e=>uploadEvent(e,'convert');
