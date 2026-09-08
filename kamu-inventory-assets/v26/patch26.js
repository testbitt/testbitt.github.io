/* Version 3.1 — Admin Full Upload + Cup Usage for Every User */
(()=>{
const ADMIN_DATA_API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-admin-data';
const ROLE_KEY='kamuInvCloudRole',TOKEN_KEY='kamuInvCloudToken';
let adminOwnLoaded=false,loadingAdminOwn=false,lastAdminSelect=null;
function role(){return localStorage.getItem(ROLE_KEY)||''}
function token(){return localStorage.getItem(TOKEN_KEY)||''}
async function adminData(action,data={}){const r=await fetch(ADMIN_DATA_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},body:JSON.stringify({action,...data})});let x={};try{x=await r.json()}catch{}if(!r.ok||x.ok===false)throw Error(x.error||`HTTP ${r.status}`);return x}
function adminDatasetMeta(type,file){if(type==='stock')return{file_name:file.name,rows:S.stock.length,branches:new Set(S.stock.map(r=>T(V(r,'wh'))).filter(Boolean)).size,stock_date:S.stockDate||''};return{file_name:file.name,rows:S.item.length,branches:new Set(S.item.map(r=>T(V(r,'wh'))).filter(Boolean)).size}}
function applyAdminOwn(x){const ds=x?.datasets||{},md=x?.metadata||{};S.stock=Array.isArray(ds.stock)?ds.stock:[];S.item=Array.isArray(ds.item)?ds.item:[];S.stockDate=T(md.stock?.stock_date||md.stock?.stockDate||'');S.meta.stock=T(md.stock?.file_name||md.stock?.name||'');S.meta.item=T(md.item?.file_name||md.item?.name||'');selectedRM.clear();S.analysis=[];S.needs=[];S.recon=[];S.currentExpected=new Map();buildIndexes();refresh();renderCustomChecks();compute();const sel=$('#adminUserSelect');if(sel)sel.value='';adminOwnLoaded=true}
async function loadAdminOwn(force=false){if(role()!=='admin'||loadingAdminOwn||(!force&&adminOwnLoaded))return;loadingAdminOwn=true;try{const x=await adminData('load');applyAdminOwn(x)}catch(e){console.warn('Admin Stock/Item load',e)}finally{loadingAdminOwn=false}}
function showCup(){const c=$('#cupUsageCard');if(c)c.style.display=''}
function enforceRoleUI(){const r=role(),cards=$$('#upload .upload-card');if(!r)return;if(r==='admin'){cards.forEach(c=>c.style.display='');const rt=$('.tab[data-p="recon"]'),ct=$('.tab[data-p="conversion"]');if(rt)rt.style.display='';if(ct)ct.style.display='';const sel=$('#adminUserSelect');if(sel&&!sel.dataset.v31){sel.dataset.v31='1';sel.addEventListener('change',()=>{lastAdminSelect=sel.value;adminOwnLoaded=false;if(!sel.value)setTimeout(()=>loadAdminOwn(true),450)})}if(sel&&!sel.value&&!adminOwnLoaded)loadAdminOwn()}else{cards.forEach((c,i)=>c.style.display=i<2?'':'none');const rt=$('.tab[data-p="recon"]'),ct=$('.tab[data-p="conversion"]');if(rt)rt.style.display='none';if(ct)ct.style.display='none'}showCup();const v=document.querySelector('.version');if(v)v.textContent='Version 3.1 • Admin Full Upload + Cup Usage'}
const readV30=read;
read=async function(file,type){
 if(role()!=='admin'||!['stock','item'].includes(type))return readV30(file,type);
 if(!file)throw Error('ไม่พบไฟล์');if(!window.XLSX)throw Error('ตัวอ่าน Excel ยังโหลดไม่สำเร็จ กรุณา Refresh แล้วลองใหม่');
 const el=type==='stock'?$('#mStock'):$('#mItem');if(el)el.textContent=`กำลังอ่าน ${file.name} ...`;
 try{
  const current=await adminData('load');
  if(type==='stock'){S.item=Array.isArray(current?.datasets?.item)?current.datasets.item:[];S.meta.item=T(current?.metadata?.item?.file_name||'')}
  else{S.stock=Array.isArray(current?.datasets?.stock)?current.datasets.stock:[];S.stockDate=T(current?.metadata?.stock?.stock_date||'');S.meta.stock=T(current?.metadata?.stock?.file_name||'')}
  const b=await file.arrayBuffer(),wb=XLSX.read(b,{type:'array',cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]];
  if(type==='stock'){const parsed=rows(ws,'stock');if(!parsed.length)throw Error('ไม่พบข้อมูล Stock Movement หลังหัวตาราง');S.stock=parsed;S.stockDate=reportDate(wb,ws);S.meta.stock=file.name}
  else{const parsed=rows(ws,'item');if(!parsed.length)throw Error('ไม่พบข้อมูล Item Sale หลังหัวตาราง');S.item=parsed;S.meta.item=file.name}
  buildIndexes();await save();refresh();compute();if(el)el.insertAdjacentHTML('beforeend',' <span class="warn">☁ กำลังบันทึก Cloud...</span>');
  await adminData('save',{dataset_type:type,payload:type==='stock'?S.stock:S.item,metadata:adminDatasetMeta(type,file)});
  adminOwnLoaded=true;const sel=$('#adminUserSelect');if(sel)sel.value='';if(el){el.querySelectorAll('.warn').forEach(x=>x.remove());el.insertAdjacentHTML('beforeend',' <span class="ok">☁ Cloud Saved</span>')}showCup();
 }catch(e){if(el)el.innerHTML=`<span class="bad">Upload ไม่สำเร็จ: ${String(e.message||e)}</span>`;throw e}
}
const renderV30=render;render=function(){renderV30();showCup()};
const mo=new MutationObserver(()=>enforceRoleUI());mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class']});
setInterval(enforceRoleUI,900);setTimeout(enforceRoleUI,100);
})();
