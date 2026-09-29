/* KSL V6.3 — Admin Media Builder V1
   A4 training media from uploaded Drink / Production / Holding Time data.
   Supports multiple menus per A4, images, autosave, print/PDF, JPG and PNG.
*/
(()=>{
'use strict';
if(window.__KSL_MEDIA_BUILDER_V1__)return;
window.__KSL_MEDIA_BUILDER_V1__=1;

const STORE='KSL_MEDIA_BUILDER_V1';
const PROJECTS='KSL_MEDIA_PROJECTS_V1';
const MAX_IMG=900;
const MEDIA_SUPA_URL='https://hcswjuemjluozmyejhnu.supabase.co';
const MEDIA_SUPA_KEY='sb_publishable_C4yHaRSzzgln3d9lplwIpg_QaWlG4ne';
const MEDIA_BUCKET='ksl-media';
let onlineImages={};
let remoteProjects=[];
const text=v=>String(v??'').trim();
const esc=v=>text(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};
const uid=()=> 'MEDIA-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const now=()=>new Date().toISOString();
const app=()=>{try{return typeof appState!=='undefined'&&appState?appState:window.appState}catch(_){return window.appState}};
const unique=a=>[...new Set((a||[]).map(text).filter(Boolean))];

const defaults=()=>({
  id:uid(),name:'สื่อการสอน',type:'drink',template:'branch-grid',orientation:'landscape',
  perPage:4,theme:'1',bgRemovalMode:'detail',title:'',subtitle:'',selected:[],images:{},overrides:{},createdAt:now(),updatedAt:now()
});
let draft=defaults(), search='', targetImage='';
let saveTimer=null;

function loadDraft(){
  try{
    const s=app();
    const v=s?.mediaBuilderV1 || JSON.parse(localStorage.getItem(STORE)||'null');
    if(v&&typeof v==='object')draft={...defaults(),...v,images:v.images||{},overrides:v.overrides||{},selected:Array.isArray(v.selected)?v.selected:[]};
  }catch(_){}
}
function persistDraft(immediate=false){
  draft.updatedAt=now();
  try{localStorage.setItem(STORE,JSON.stringify(draft))}catch(_){}
  clearTimeout(saveTimer);
  const run=async()=>{
    try{
      const s=app();if(!s)return;
      s.mediaBuilderV1=clone(draft);
      if(typeof dbSet==='function')await Promise.resolve(dbSet(s));
      try{await syncProjectOnline(projectSnapshot())}catch(e){console.warn('[KSL Media] project autosave online',e)}
      setSaveStatus('บันทึกอัตโนมัติ Online ✓');
    }catch(e){console.warn('[KSL Media] autosave',e);setSaveStatus('บันทึกในเครื่องแล้ว');}
  };
  if(immediate)run();else saveTimer=setTimeout(run,550);
  setSaveStatus('กำลังบันทึก...');
}
function setSaveStatus(t){const el=document.getElementById('kslMediaSaveState');if(el)el.textContent=t}


function mediaHeaders(extra={}){
  return {
    'apikey':MEDIA_SUPA_KEY,
    'Authorization':'Bearer '+MEDIA_SUPA_KEY,
    ...extra
  };
}
async function mediaFetch(path,opts={}){
  const res=await fetch(MEDIA_SUPA_URL+path,{...opts,headers:mediaHeaders(opts.headers||{})});
  if(!res.ok){
    const msg=await res.text().catch(()=>res.statusText);
    throw new Error('Media Online '+res.status+': '+msg);
  }
  const ct=res.headers.get('content-type')||'';
  return ct.includes('application/json')?res.json():res.text();
}
function dataUrlToBlob(data){
  const [head,body]=String(data||'').split(',');
  if(!body)throw new Error('รูปไม่ถูกต้อง');
  const mime=(head.match(/data:([^;]+)/)||[])[1]||'image/png';
  const bin=atob(body),arr=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type:mime});
}
function mediaPathFor(id){
  const bytes=new TextEncoder().encode(String(id));
  let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
  const key=btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return 'menus/'+key+'.png';
}
function publicMediaUrl(path,stamp=''){
  return MEDIA_SUPA_URL+'/storage/v1/object/public/'+MEDIA_BUCKET+'/'+path+(stamp?'?v='+encodeURIComponent(stamp):'');
}
async function uploadImageOnline(id,data){
  const path=mediaPathFor(id),blob=dataUrlToBlob(data),stamp=Date.now();
  await mediaFetch('/storage/v1/object/'+MEDIA_BUCKET+'/'+path,{
    method:'POST',
    headers:{'Content-Type':'image/png','x-upsert':'true'},
    body:blob
  });
  const url=publicMediaUrl(path,stamp);
  await mediaFetch('/rest/v1/ksl_media_images?on_conflict=menu_id',{
    method:'POST',
    headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify([{menu_id:id,object_path:path,public_url:url,updated_at:new Date().toISOString()}])
  });
  onlineImages[id]=url;
  return url;
}
async function deleteImageOnline(id){
  const path=mediaPathFor(id);
  try{await mediaFetch('/storage/v1/object/'+MEDIA_BUCKET+'/'+path,{method:'DELETE'})}catch(e){console.warn('[KSL Media] storage delete',e)}
  try{await mediaFetch('/rest/v1/ksl_media_images?menu_id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:{'Prefer':'return=minimal'}})}catch(e){console.warn('[KSL Media] image row delete',e)}
  delete onlineImages[id];
}
async function syncProjectOnline(project){
  const p=clone(project);
  await mediaFetch('/rest/v1/ksl_media_projects?on_conflict=id',{
    method:'POST',
    headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify([{
      id:p.id,
      name:p.name||'สื่อการสอน',
      media_type:p.type||'drink',
      orientation:p.orientation||'landscape',
      theme:String(p.theme||'1'),
      item_count:Array.isArray(p.selected)?p.selected.length:0,
      data:p,
      created_at:p.createdAt||new Date().toISOString(),
      updated_at:p.updatedAt||new Date().toISOString()
    }])
  });
  const i=remoteProjects.findIndex(x=>x.id===p.id);
  if(i>=0)remoteProjects[i]=p;else remoteProjects.unshift(p);
}
async function loadOnlineMediaState(){
  try{
    const [imgs,projects]=await Promise.all([
      mediaFetch('/rest/v1/ksl_media_images?select=menu_id,public_url,updated_at&order=updated_at.desc'),
      mediaFetch('/rest/v1/ksl_media_projects?select=id,data,updated_at&order=updated_at.desc')
    ]);
    onlineImages={};
    (Array.isArray(imgs)?imgs:[]).forEach(x=>{if(x?.menu_id&&x?.public_url)onlineImages[x.menu_id]=x.public_url+(String(x.public_url).includes('?')?'&':'?')+'v='+encodeURIComponent(x.updated_at||Date.now())});
    remoteProjects=(Array.isArray(projects)?projects:[]).map(x=>{
      const p=x?.data&&typeof x.data==='object'?clone(x.data):{};
      if(x?.id&&!p.id)p.id=x.id;
      if(x?.updated_at)p.updatedAt=x.updated_at;
      return p;
    }).filter(x=>x?.id);
  }catch(e){
    console.warn('[KSL Media] load online state',e);
  }
}
async function migrateLocalImagesOnline(){
  const entries=Object.entries(draft.images||{}).filter(([id,v])=>String(v||'').startsWith('data:image')&&!onlineImages[id]);
  for(const [id,data] of entries){
    try{await uploadImageOnline(id,data)}catch(e){console.warn('[KSL Media] migrate image',id,e)}
  }
  if(entries.length){renderPreview();renderImageThumb()}
}

function imageFor(id){
  if(onlineImages[id])return onlineImages[id];
  if(draft.images?.[id])return draft.images[id];
  try{
    const s=app();
    if(s?.mediaImages?.[id])return s.mediaImages[id];
  }catch(_){}
  return '';
}
async function persistImageAuto(id,data){
  if(!id)return;
  setSaveStatus(data?'กำลังบันทึกรูป Online...':'กำลังลบรูป Online...');
  draft.images=draft.images&&typeof draft.images==='object'?draft.images:{};
  if(data)draft.images[id]=data;else delete draft.images[id];
  draft.updatedAt=now();

  try{localStorage.setItem(STORE,JSON.stringify(draft))}catch(_){}

  try{
    if(data){
      const url=await uploadImageOnline(id,data);
      // Keep only URL in runtime state after successful permanent upload.
      draft.images[id]=url;
    }else{
      await deleteImageOnline(id);
    }
    const s=app();
    if(s){
      s.mediaImages=s.mediaImages&&typeof s.mediaImages==='object'?s.mediaImages:{};
      if(data)s.mediaImages[id]=onlineImages[id]||draft.images[id];else delete s.mediaImages[id];
    }
    setSaveStatus(data?'บันทึกรูป Online แล้ว ✓':'ลบรูป Online แล้ว ✓');
  }catch(e){
    console.warn('[KSL Media] online image save',e);
    setSaveStatus('Online ไม่สำเร็จ • เก็บรูปในเครื่องไว้ก่อน');
    throw e;
  }
}


function overrideFor(id){
  if(draft.overrides?.[id])return draft.overrides[id];
  try{
    const s=app();
    if(s?.mediaOverrides?.[id])return s.mediaOverrides[id];
  }catch(_){}
  return null;
}
function defaultOverride(item){
  const o={title:item.name,headers:[],rows:[],note:''};
  if(draft.type==='drink'){
    let variants=unique(item.rows.map(r=>r.Variant||r.variant).filter(Boolean));
    if(!variants.length)variants=['STD'];
    variants=variants.slice(0,4);
    o.headers=variants;
    const map=new Map();
    item.rows.forEach(r=>{
      const label=text(r.Ingredient||r.ingredient);if(!label)return;
      const variant=text(r.Variant||r.variant)||variants[0];
      if(!map.has(label))map.set(label,{label,values:Array(variants.length).fill(''),unit:text(r.Unit||r.unit)});
      const rec=map.get(label),ix=variants.indexOf(variant);
      if(ix>=0)rec.values[ix]=text(r.Quantity||r.quantity);
      if(!rec.unit)rec.unit=text(r.Unit||r.unit);
    });
    o.rows=[...map.values()];
    o.note=unique(item.rows.map(r=>r.Notes||r.notes||r.Instructions||r.instructions)).filter(Boolean)[0]||'';
  }else if(draft.type==='production'){
    o.rows=item.rows.slice(0,12).map((r,i)=>({
      label:text(r.ingredients)||text(r.variant)||('ขั้นตอน '+(i+1)),
      values:[text(r.yield_amount)],
      unit:text(r.yield_unit)
    }));
    const f=item.rows[0]||{};
    o.note=[text(f.temperature_c)?'อุณหภูมิ '+text(f.temperature_c)+'°C':'',text(f.shelf_life)?'อายุ '+text(f.shelf_life):'',text(f.storage_condition)].filter(Boolean).join(' • ');
  }else{
    o.headers=['Holding Time'];
    o.rows=item.rows.slice(0,12).map(r=>({
      label:text(r['สถานะ'])||'-',
      values:[text(r['อายุการจัดเก็บ'])],
      unit:text(r['อุณหภูมิ/สถานที่จัดเก็บ'])
    }));
  }
  return o;
}
function effectiveOverride(item){
  const base=defaultOverride(item),o=overrideFor(item.id);
  if(!o)return base;
  return {
    title:text(o.title)||base.title,
    headers:Array.isArray(o.headers)?o.headers:base.headers,
    rows:Array.isArray(o.rows)?o.rows:base.rows,
    note:o.note!==undefined?text(o.note):base.note
  };
}
async function persistOverrideAuto(id,o){
  if(!id)return;
  draft.overrides=draft.overrides&&typeof draft.overrides==='object'?draft.overrides:{};
  draft.overrides[id]=clone(o);
  draft.updatedAt=now();
  try{localStorage.setItem(STORE,JSON.stringify(draft))}catch(_){}
  setSaveStatus('กำลังบันทึกข้อมูล...');
  try{
    const s=app();
    if(s){
      s.mediaOverrides=s.mediaOverrides&&typeof s.mediaOverrides==='object'?s.mediaOverrides:{};
      s.mediaOverrides[id]=clone(o);
      s.mediaBuilderV1=clone(draft);
      if(Array.isArray(s.mediaProjects)){
        const i=s.mediaProjects.findIndex(x=>x?.id===draft.id);
        if(i>=0){
          const p=clone(s.mediaProjects[i]);
          p.overrides=p.overrides&&typeof p.overrides==='object'?p.overrides:{};
          p.overrides[id]=clone(o);
          p.updatedAt=draft.updatedAt;
          s.mediaProjects[i]=p;
        }
      }
      if(typeof dbSet==='function')await Promise.resolve(dbSet(s));
    }
    try{await syncProjectOnline(projectSnapshot())}catch(e){console.warn('[KSL Media] override online sync',e)}
    setSaveStatus('บันทึกข้อมูล Online อัตโนมัติ ✓');
  }catch(e){
    console.warn('[KSL Media] override autosave',e);
    setSaveStatus('บันทึกข้อมูลในเครื่องแล้ว');
  }
}

function stableId(type,name){return type+'::'+text(name).toLowerCase()}
function sourceItems(type=draft.type){
  const s=app()||{};
  const groups=new Map();
  if(type==='drink'){
    const rows=s.drinkData||s.drinkRecipes||s.beverageRecipes||[];
    rows.forEach(r=>{const name=text(r.Menu||r.menu);if(!name)return;const id=stableId(type,name);if(!groups.has(id))groups.set(id,{id,name,en:'',rows:[]});groups.get(id).rows.push(r)});
  }else if(type==='production'){
    const rows=s.productionData||s.productionRecipes||s.production||[];
    rows.forEach(r=>{const name=text(r.recipe_name_th||r.recipe_name_en);if(!name)return;const id=stableId(type,name);if(!groups.has(id))groups.set(id,{id,name,en:text(r.recipe_name_en),rows:[]});const g=groups.get(id);if(!g.en)g.en=text(r.recipe_name_en);g.rows.push(r)});
  }else{
    const rows=s.data||s.holdingTime||s.holdingData||[];
    rows.forEach(r=>{const name=text(r['ชื่อวัตถุดิบ']);if(!name)return;const id=stableId(type,name);if(!groups.has(id))groups.set(id,{id,name,en:'',rows:[]});groups.get(id).rows.push(r)});
  }
  return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'th'));
}
function selectedItems(){
  const map=new Map(sourceItems().map(x=>[x.id,x]));
  return draft.selected.map(id=>map.get(id)).filter(Boolean);
}
function cleanSelection(){
  const valid=new Set(sourceItems().map(x=>x.id));
  draft.selected=draft.selected.filter(x=>valid.has(x));
  if(targetImage&&!valid.has(targetImage))targetImage='';
}

function pageTitle(){
  if(draft.title)return draft.title;
  if(draft.type==='drink')return 'สูตรการชงเครื่องดื่ม';
  if(draft.type==='production')return 'สูตรการผลิต';
  return 'ตารางวันหมดอายุ';
}
function typeLabel(t=draft.type){return t==='drink'?'สูตรการชงเครื่องดื่ม':t==='production'?'สูตรการผลิต':'ตารางวันหมดอายุ'}
function chunk(arr,n){const out=[];for(let i=0;i<arr.length;i+=n)out.push(arr.slice(i,i+n));return out.length?out:[[]]}

function lineList(values,max=6){
  const vals=values.map(text).filter(Boolean);
  return vals.slice(0,max).map(v=>'<li>'+esc(v)+'</li>').join('')+(vals.length>max?'<li class="mb-more">+'+(vals.length-max)+' รายการ</li>':'');
}
function drinkCard(item){
  const img=imageFor(item.id),o=effectiveOverride(item);
  let variants=(o.headers||[]).map(text).filter(Boolean);if(!variants.length)variants=['STD'];variants=variants.slice(0,6);
  const rows=(o.rows||[]).slice(0,14).map(rec=>{
    const vals=Array.isArray(rec.values)?rec.values:[text(rec.value)];
    const qs=variants.map((v,i)=>'<td class="mb-cup-qty">'+esc(vals[i]||'-')+'</td>').join('');
    return '<tr><td class="mb-r-name">'+esc(rec.label||'-')+'</td>'+qs+'<td class="mb-r-unit">'+esc(rec.unit||'')+'</td></tr>';
  }).join('');
  const head='<thead><tr><th class="mb-cup-label">วัตถุดิบ</th>'+variants.map(v=>'<th class="mb-cup-type">'+esc(v)+'</th>').join('')+'<th class="mb-cup-unit">หน่วย</th></tr></thead>';
  return '<article class="mb-card mb-table-card">'+
    '<div class="mb-black-title">'+esc(o.title||item.name)+'</div>'+
    '<div class="mb-table-body">'+
      '<div class="mb-left-photo"><div class="mb-photo-frame">'+(img?'<img src="'+img+'" alt="">':'<div class="mb-photo-placeholder">🧋</div>')+'</div></div>'+
      '<div class="mb-table-side"><div class="mb-cup-title">ประเภทแก้ว</div><table class="mb-recipe-table mb-drink-table">'+head+'<tbody>'+rows+'</tbody></table>'+
      (o.note?'<div class="mb-note-line">'+esc(o.note)+'</div>':'')+'</div>'+
    '</div></article>';
}
function productionCard(item){
  const img=imageFor(item.id),o=effectiveOverride(item);
  const rows=(o.rows||[]).slice(0,14).map(rec=>'<tr><td class="mb-r-name">'+esc(rec.label||'-')+'</td><td class="mb-r-qty">'+esc((rec.values||[])[0]||'')+'</td><td class="mb-r-unit">'+esc(rec.unit||'')+'</td></tr>').join('');
  return '<article class="mb-card mb-table-card"><div class="mb-black-title">'+esc(o.title||item.name)+'</div><div class="mb-table-body">'+
    '<div class="mb-left-photo"><div class="mb-photo-frame">'+(img?'<img src="'+img+'" alt="">':'<div class="mb-photo-placeholder">🧑‍🍳</div>')+'</div></div>'+
    '<div class="mb-table-side"><table class="mb-recipe-table"><tbody>'+rows+'</tbody></table>'+(o.note?'<div class="mb-note-line">'+esc(o.note)+'</div>':'')+'</div></div></article>';
}
function holdingCard(item){
  const img=imageFor(item.id),o=effectiveOverride(item);
  const rows=(o.rows||[]).slice(0,14).map(rec=>'<tr><td class="mb-r-name">'+esc(rec.label||'-')+'</td><td class="mb-r-qty">'+esc((rec.values||[])[0]||'')+'</td><td class="mb-r-unit">'+esc(rec.unit||'')+'</td></tr>').join('');
  return '<article class="mb-card mb-table-card"><div class="mb-black-title">'+esc(o.title||item.name)+'</div><div class="mb-table-body">'+
    '<div class="mb-left-photo"><div class="mb-photo-frame">'+(img?'<img src="'+img+'" alt="">':'<div class="mb-photo-placeholder">⏳</div>')+'</div></div>'+
    '<div class="mb-table-side"><table class="mb-recipe-table"><tbody>'+rows+'</tbody></table>'+(o.note?'<div class="mb-note-line">'+esc(o.note)+'</div>':'')+'</div></div></article>';
}
function itemCard(item){return draft.type==='drink'?drinkCard(item):draft.type==='production'?productionCard(item):holdingCard(item)}

function rowsFor(){
  return draft.orientation==='landscape' ? 4 : 2;
}
function columnsFor(count){
  return Math.max(1,Math.ceil(Math.min(20,Math.max(1,count))/rowsFor()));
}
function densityFor(count){
  if(count<=4)return 'mb-density-roomy';
  if(count<=8)return 'mb-density-medium';
  if(count<=12)return 'mb-density-compact';
  return 'mb-density-max';
}
function fitFor(count,cols){
  const rows=Math.max(1,Math.ceil(Math.max(1,count)/Math.max(1,cols)));
  if(rows<=2)return 'mb-fit-xl';
  if(rows<=3)return 'mb-fit-lg';
  if(rows<=4)return 'mb-fit-md';
  if(rows<=6)return 'mb-fit-sm';
  return 'mb-fit-xs';
}
function buildPage(items,index,total){
  const cols=columnsFor(items.length);
  const size=draft.orientation==='landscape'?'mb-landscape':'mb-portrait';
  const density=densityFor(items.length);

  const displayCols=draft.orientation==='portrait'?2:Math.max(1,cols);
  const rowGroups=[];
  for(let i=0;i<items.length;i+=displayCols)rowGroups.push(items.slice(i,i+displayCols));
  const fit=fitFor(items.length,displayCols);
  const targetPerPage=Math.min(20,Math.max(1,Number(draft.perPage)||4));
  const isFullLayout=items.length===targetPerPage;
  const layoutClass=isFullLayout?'mb-layout-full':'mb-layout-partial';
  const rowsHtml=rowGroups.map(group=>
    '<div class="mb-equal-row" style="--mb-row-cols:'+displayCols+'">'+group.map(itemCard).join('')+'</div>'
  ).join('');

  return '<section class="ksl-media-page '+size+' '+density+' '+fit+' '+layoutClass+' mb-template-'+esc(draft.template)+' mb-theme-'+esc(draft.theme||'1')+' mb-count-'+items.length+'" style="--mb-fit-rows:'+rowGroups.length+';--mb-fit-cols:'+displayCols+'" data-page="'+index+'">'+
    '<header class="mb-page-head"><div><div class="mb-kamu">KAMU KAMU • TRAINING</div><h1>'+esc(pageTitle())+'</h1>'+
    (draft.subtitle?'<p>'+esc(draft.subtitle)+'</p>':'')+'</div><div class="mb-page-no">'+(index+1)+' / '+total+'</div></header>'+
    '<div class="mb-equal-rows">'+rowsHtml+'</div>'+
    '<footer class="mb-footer"><span>'+esc(typeLabel())+'</span><span>ข้อมูลจาก KSL • '+new Intl.DateTimeFormat('th-TH',{dateStyle:'medium'}).format(new Date())+'</span></footer>'+
    '</section>';
}
function previewHtml(){
  const items=selectedItems();
  const requested=Math.min(20,Math.max(1,Number(draft.perPage)||4));
  const per=requested;
  const pages=chunk(items,per);
  return pages.map((p,i)=>buildPage(p,i,pages.length)).join('');
}

const CSS=`
#kslMediaOverlay{position:fixed;inset:0;z-index:2147483000;background:#edf6f1;display:none;font-family:system-ui,-apple-system,"Noto Sans Thai",Tahoma,sans-serif;color:#173e30}
#kslMediaOverlay.show{display:block}
#kslMediaOverlay *{box-sizing:border-box}
.mb-topbar{height:64px;background:#fff;border-bottom:1px solid #d4e7dc;display:flex;align-items:center;justify-content:space-between;padding:0 18px;gap:12px;position:sticky;top:0;z-index:4}
.mb-topbar h2{margin:0;font-size:18px;color:#164d39}.mb-topbar small{color:#678579}
.mb-actions{display:flex;gap:8px;flex-wrap:wrap}.mb-btn{border:1px solid #bfdccc;background:#fff;color:#175941;border-radius:11px;padding:9px 13px;font-weight:800;cursor:pointer}.mb-btn.primary{background:#176b4d;color:#fff;border-color:#176b4d}.mb-btn.danger{color:#a33;border-color:#e3bcbc}
.mb-shell{display:grid;grid-template-columns:355px minmax(0,1fr);height:calc(100vh - 64px)}
.mb-controls{overflow:auto;background:#fff;border-right:1px solid #d4e7dc;padding:16px}.mb-preview-wrap{overflow:auto;padding:22px;display:flex;flex-direction:column;align-items:center;gap:22px}
.mb-block{border:1px solid #d9e9e0;border-radius:15px;padding:13px;margin-bottom:12px;background:#fbfdfc}.mb-block h3{margin:0 0 10px;font-size:14px;color:#215b46}
.mb-field{display:grid;gap:5px;margin:9px 0}.mb-field label{font-size:11px;font-weight:800;color:#597569}.mb-input,.mb-select{width:100%;border:1px solid #c9ded3;border-radius:9px;padding:9px;background:#fff;color:#234}
.mb-inline{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mb-list-tools{display:flex;gap:6px;margin:7px 0}.mb-link{border:0;background:#eaf5ef;color:#176649;border-radius:8px;padding:6px 8px;font-weight:800;cursor:pointer;font-size:11px}
#kslMediaItemList{max-height:270px;overflow:auto;border:1px solid #e0ece6;border-radius:10px;padding:5px;background:#fff}.mb-check{display:flex;gap:8px;align-items:flex-start;padding:7px;border-bottom:1px solid #edf4f0;font-size:12px}.mb-check:last-child{border-bottom:0}.mb-check input{margin-top:2px}.mb-check span{display:block}.mb-check small{display:block;color:#789085;margin-top:2px}
.mb-image-row{display:grid;grid-template-columns:1fr auto;gap:7px}.mb-thumb{margin-top:8px;border:1px dashed #bdd7ca;border-radius:10px;min-height:70px;display:grid;place-items:center;overflow:hidden;background:#f8fcfa}.mb-thumb img{width:100%;max-height:130px;object-fit:cover}
.mb-note{font-size:10px;color:#718a7f;line-height:1.45}.mb-count{display:inline-flex;background:#e5f4ec;color:#176448;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}
.ksl-media-page{background:#fff;box-shadow:0 16px 45px #16473326;position:relative;overflow:hidden;flex:none;padding:30px;display:grid;grid-template-rows:auto 1fr auto}
.ksl-media-page.mb-portrait{width:794px;height:1123px}.ksl-media-page.mb-landscape{width:1123px;height:794px}
.mb-page-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #176b4d;padding-bottom:13px;margin-bottom:14px}.mb-page-head h1{font-size:27px;margin:2px 0;color:#174b39}.mb-page-head p{margin:2px 0;color:#678}.mb-kamu{font-size:10px;font-weight:900;letter-spacing:1.4px;color:#1b7353}.mb-page-no{font-size:10px;font-weight:800;color:#789}
.mb-grid{display:grid;grid-template-columns:repeat(var(--mb-cols),minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:12px;min-height:0}
.mb-card{border:1px solid #cfe3d8;border-radius:16px;padding:12px;background:#fbfefc;overflow:hidden;min-height:0;display:flex;flex-direction:column}.mb-card-head{display:flex;gap:8px;align-items:center;margin-bottom:8px;min-width:0}.mb-title-wrap{min-width:0;flex:1}.mb-icon{width:34px;height:34px;border-radius:10px;background:#e5f4ec;display:grid;place-items:center;font-size:18px;flex:none}.mb-card h2{font-size:16px;line-height:1.22;margin:0;color:#164b38}.mb-en{font-size:9px;color:#738a80;margin-top:2px}.mb-img{width:58px;height:46px;margin-left:auto;border-radius:9px;overflow:hidden;background:#eef6f2;flex:0 0 58px;border:1px solid #d8e9e0}.mb-img img{width:100%;height:100%;object-fit:cover}
.mb-pills{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}.mb-pills span,.mb-meta span{font-size:8px;background:#e7f4ed;color:#205f49;border-radius:999px;padding:3px 6px}.mb-meta{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px}
.mb-section{font-size:10px;line-height:1.35;margin-top:4px;min-height:0}.mb-section>b{display:block;color:#205843;margin-bottom:3px}.mb-section ul,.mb-section ol{margin:2px 0 0;padding-left:18px}.mb-section li{margin:1px 0}.mb-more{color:#6c857a;font-size:8px;font-weight:700}
.mb-holding{width:100%;border-collapse:collapse;font-size:8px}.mb-holding th,.mb-holding td{border-bottom:1px solid #e4eee9;text-align:left;padding:4px 3px}.mb-holding th{color:#4c7060;background:#edf7f2}
.mb-footer{border-top:1px solid #dce9e2;margin-top:12px;padding-top:7px;display:flex;justify-content:space-between;color:#779086;font-size:8px}
.mb-template-compact .mb-card{border-radius:9px;padding:9px}.mb-template-compact .mb-card h2{font-size:14px}.mb-template-compact .mb-img{width:48px;height:38px;flex-basis:48px}.mb-template-compact .mb-section{font-size:9px}
.mb-template-visual .mb-card{background:linear-gradient(145deg,#f8fffb,#eef8f3);border:2px solid #bcdcca}.mb-template-visual .mb-card h2{color:#0f6b4f}.mb-template-visual .mb-img{width:64px;height:50px;flex-basis:64px}
.mb-density-medium .mb-grid{gap:8px}.mb-density-medium .mb-card{padding:9px;border-radius:12px}.mb-density-medium .mb-card h2{font-size:13px}.mb-density-medium .mb-icon{width:28px;height:28px;font-size:15px}.mb-density-medium .mb-img{width:46px;height:36px;flex-basis:46px}.mb-density-medium .mb-section{font-size:8.5px}.mb-density-medium .mb-en{font-size:8px}
.mb-density-compact .mb-page-head{padding-bottom:8px;margin-bottom:8px}.mb-density-compact .mb-page-head h1{font-size:22px}.mb-density-compact .mb-grid{gap:6px}.mb-density-compact .mb-card{padding:7px;border-radius:9px}.mb-density-compact .mb-card-head{gap:5px;margin-bottom:4px}.mb-density-compact .mb-card h2{font-size:11px}.mb-density-compact .mb-icon{width:24px;height:24px;border-radius:7px;font-size:13px}.mb-density-compact .mb-img{width:38px;height:30px;flex-basis:38px;border-radius:6px}.mb-density-compact .mb-section{font-size:7px;line-height:1.2}.mb-density-compact .mb-en{font-size:7px}.mb-density-compact .mb-pills span,.mb-density-compact .mb-meta span{font-size:6px;padding:2px 4px}.mb-density-compact .mb-holding{font-size:6.5px}.mb-density-compact .mb-footer{margin-top:6px}
.mb-density-max{padding:22px}.mb-density-max .mb-page-head{padding-bottom:6px;margin-bottom:6px}.mb-density-max .mb-page-head h1{font-size:19px}.mb-density-max .mb-kamu,.mb-density-max .mb-page-no{font-size:8px}.mb-density-max .mb-grid{gap:4px}.mb-density-max .mb-card{padding:5px;border-radius:7px}.mb-density-max .mb-card-head{gap:4px;margin-bottom:3px}.mb-density-max .mb-card h2{font-size:9px;line-height:1.1}.mb-density-max .mb-icon{width:19px;height:19px;border-radius:6px;font-size:10px}.mb-density-max .mb-en{font-size:5.8px}.mb-density-max .mb-img{width:30px;height:24px;flex-basis:30px;border-radius:4px}.mb-density-max .mb-pills,.mb-density-max .mb-meta{gap:2px;margin-bottom:2px}.mb-density-max .mb-pills span,.mb-density-max .mb-meta span{font-size:5.5px;padding:1px 3px}.mb-density-max .mb-section{font-size:5.8px;line-height:1.1;margin-top:2px}.mb-density-max .mb-section>b{margin-bottom:1px}.mb-density-max .mb-section ul,.mb-density-max .mb-section ol{padding-left:10px;margin-top:1px}.mb-density-max .mb-holding{font-size:5.4px}.mb-density-max .mb-holding th,.mb-density-max .mb-holding td{padding:2px}.mb-density-max .mb-footer{font-size:6px;margin-top:4px;padding-top:4px}.mb-density-max .mb-more{font-size:5.5px}

.mb-grid.mb-two-rows{grid-template-columns:repeat(var(--mb-cols),minmax(0,1fr));grid-template-rows:repeat(2,max-content);grid-auto-flow:row;align-items:start;align-content:start;gap:10px}
.mb-template-branch-grid{padding:18px}.mb-template-branch-grid .mb-page-head{padding-bottom:7px;margin-bottom:8px;border-bottom:1px solid #222}.mb-template-branch-grid .mb-page-head h1{font-size:18px}.mb-template-branch-grid .mb-kamu{font-size:8px}.mb-template-branch-grid .mb-footer{margin-top:7px;padding-top:4px}
.mb-template-branch-grid .mb-card{border:2px solid #111;border-radius:0;padding:0;background:#fff;min-height:0;height:max-content;align-self:start}
.mb-black-title{min-height:25px;height:auto;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:11px;line-height:1.15;padding:4px 6px;white-space:normal;overflow:visible;overflow-wrap:anywhere;flex:none}
.mb-table-body{display:grid;grid-template-columns:62px minmax(0,1fr);min-height:0;height:auto;align-items:stretch}
.mb-left-photo{display:flex;align-items:center;justify-content:center;border-right:1px solid #d6d6d6;overflow:hidden;background:#fff;padding:3px}
.mb-left-photo img{max-width:54px;max-height:120px;width:auto;height:auto;object-fit:contain}
.mb-photo-placeholder{font-size:25px;opacity:.35}
.mb-table-side{min-width:0;overflow:hidden;display:flex;flex-direction:column}
.mb-variant-head{display:flex;justify-content:center;gap:12px;min-height:17px;border-bottom:1px solid #d5d5d5;color:#e22;font-size:7px;font-weight:800;padding:2px 4px}
.mb-recipe-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.5px;line-height:1.15}
.mb-recipe-table td{border-bottom:1px solid #e3e3e3;border-right:1px solid #ededed;padding:2px 3px;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:16px}
.mb-recipe-table td:last-child{border-right:0}.mb-r-name{width:auto;text-align:left}.mb-r-qty{width:30px;text-align:center;color:#111}.mb-r-unit{width:32px;text-align:left}.mb-r-var{width:36px;text-align:center;color:#d22}
.mb-cup-title{text-align:center;color:#d22;font-weight:900;font-size:7px;line-height:1;padding:2px 2px 1px;border-bottom:1px solid #ddd;background:#fff}
.mb-drink-table thead th{font-size:6.8px;font-weight:900;border-bottom:1px solid #d0d0d0;border-right:1px solid #e3e3e3;padding:2px 2px;text-align:center;background:#fff;height:16px}
.mb-drink-table thead th:last-child{border-right:0}.mb-cup-label{text-align:left!important;color:#333}.mb-cup-type{color:#e22}.mb-cup-unit{color:#555;width:30px}.mb-cup-qty{text-align:center;color:#111;width:28px}
.mb-note-line{margin-top:auto;background:#fff36b;color:#d00;font-weight:800;font-size:6.5px;padding:2px 4px;min-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mb-template-branch-grid.mb-density-medium .mb-table-body{grid-template-columns:52px minmax(0,1fr)}.mb-template-branch-grid.mb-density-medium .mb-left-photo img{max-width:46px;max-height:95px}.mb-template-branch-grid.mb-density-medium .mb-recipe-table{font-size:6.8px}
.mb-template-branch-grid.mb-density-compact .mb-table-body{grid-template-columns:43px minmax(0,1fr)}.mb-template-branch-grid.mb-density-compact .mb-left-photo img{max-width:38px;max-height:78px}.mb-template-branch-grid.mb-density-compact .mb-black-title{min-height:21px;height:auto;font-size:8px;padding:3px 4px}.mb-template-branch-grid.mb-density-compact .mb-table-body{height:auto}.mb-template-branch-grid.mb-density-compact .mb-recipe-table{font-size:5.9px}.mb-template-branch-grid.mb-density-compact .mb-cup-title{font-size:5.8px}.mb-template-branch-grid.mb-density-compact .mb-drink-table thead th{font-size:5.4px;height:12px;padding:1px}.mb-template-branch-grid.mb-density-compact .mb-recipe-table td{height:13px;padding:1px 2px}.mb-template-branch-grid.mb-density-compact .mb-r-qty{width:23px}.mb-template-branch-grid.mb-density-compact .mb-r-unit{width:25px}
.mb-template-branch-grid.mb-density-max{padding:12px}.mb-template-branch-grid.mb-density-max .mb-page-head{margin-bottom:5px;padding-bottom:4px}.mb-template-branch-grid.mb-density-max .mb-page-head h1{font-size:14px}.mb-template-branch-grid.mb-density-max .mb-grid{gap:4px}.mb-template-branch-grid.mb-density-max .mb-table-body{grid-template-columns:30px minmax(0,1fr)}.mb-template-branch-grid.mb-density-max .mb-left-photo{padding:1px}.mb-template-branch-grid.mb-density-max .mb-left-photo img{max-width:27px;max-height:54px}.mb-template-branch-grid.mb-density-max .mb-photo-placeholder{font-size:14px}.mb-template-branch-grid.mb-density-max .mb-black-title{min-height:17px;height:auto;font-size:5.8px;padding:2px 3px}.mb-template-branch-grid.mb-density-max .mb-table-body{height:auto}.mb-template-branch-grid.mb-density-max .mb-variant-head{font-size:4.8px;min-height:11px;padding:1px 2px;gap:4px}.mb-template-branch-grid.mb-density-max .mb-recipe-table{font-size:4.7px}.mb-template-branch-grid.mb-density-max .mb-cup-title{font-size:4.4px;padding:1px}.mb-template-branch-grid.mb-density-max .mb-drink-table thead th{font-size:4.1px;height:9px;padding:1px}.mb-template-branch-grid.mb-density-max .mb-cup-unit{width:18px}.mb-template-branch-grid.mb-density-max .mb-cup-qty{width:16px}.mb-template-branch-grid.mb-density-max .mb-recipe-table td{height:10px;padding:1px;line-height:1}.mb-template-branch-grid.mb-density-max .mb-r-qty{width:17px}.mb-template-branch-grid.mb-density-max .mb-r-unit{width:19px}.mb-template-branch-grid.mb-density-max .mb-r-var{width:20px}.mb-template-branch-grid.mb-density-max .mb-note-line{font-size:4.5px;min-height:10px;padding:1px 2px}


/* V6.3.7 readability + orientation rows */
.mb-grid.mb-dynamic-rows{
  display:grid;
  grid-template-columns:repeat(var(--mb-cols),minmax(0,1fr));
  grid-template-rows:repeat(var(--mb-rows),max-content);
  grid-auto-flow:row;
  align-items:start;
  align-content:start;
  gap:9px;
}
.mb-template-branch-grid .mb-card{overflow:visible}
.mb-template-branch-grid .mb-black-title{
  font-size:13px;
  line-height:1.22;
  padding:5px 7px;
  min-height:30px;
  white-space:normal;
  overflow:visible;
  text-overflow:clip;
  overflow-wrap:anywhere;
}
.mb-template-branch-grid .mb-table-side{overflow:visible}
.mb-template-branch-grid .mb-recipe-table{
  table-layout:auto;
  font-size:10px;
  line-height:1.22;
}
.mb-template-branch-grid .mb-recipe-table td,
.mb-template-branch-grid .mb-drink-table thead th{
  white-space:normal;
  overflow:visible;
  text-overflow:clip;
  overflow-wrap:anywhere;
  word-break:normal;
}
.mb-template-branch-grid .mb-recipe-table td{
  padding:4px 4px;
  height:auto;
  min-height:22px;
}
.mb-template-branch-grid .mb-r-name{font-size:10px;font-weight:700}
.mb-template-branch-grid .mb-r-qty,
.mb-template-branch-grid .mb-r-unit,
.mb-template-branch-grid .mb-cup-qty{font-size:10px}
.mb-template-branch-grid .mb-cup-title{
  font-size:10px;
  line-height:1.15;
  padding:4px 3px 3px;
}
.mb-template-branch-grid .mb-drink-table thead th{
  font-size:9px;
  line-height:1.15;
  padding:4px 3px;
  height:auto;
}
.mb-template-branch-grid .mb-note-line{
  font-size:9px;
  line-height:1.2;
  padding:4px 5px;
  white-space:normal;
  overflow:visible;
  text-overflow:clip;
  overflow-wrap:anywhere;
}
.mb-template-branch-grid .mb-table-body{
  grid-template-columns:82px minmax(0,1fr);
  align-items:stretch;
}
.mb-template-branch-grid .mb-left-photo{
  padding:5px;
  overflow:visible;
}
.mb-template-branch-grid .mb-photo-frame{
  width:70px;
  height:105px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#fff;
  overflow:hidden;
  flex:none;
}
.mb-template-branch-grid .mb-photo-frame img{
  width:100%;
  height:100%;
  max-width:none;
  max-height:none;
  object-fit:contain;
  object-position:center;
  display:block;
}
.mb-template-branch-grid.mb-density-medium .mb-black-title{font-size:12px}
.mb-template-branch-grid.mb-density-medium .mb-recipe-table{font-size:9px}
.mb-template-branch-grid.mb-density-medium .mb-r-name,
.mb-template-branch-grid.mb-density-medium .mb-r-qty,
.mb-template-branch-grid.mb-density-medium .mb-r-unit,
.mb-template-branch-grid.mb-density-medium .mb-cup-qty{font-size:9px}
.mb-template-branch-grid.mb-density-medium .mb-table-body{grid-template-columns:70px minmax(0,1fr)}
.mb-template-branch-grid.mb-density-medium .mb-photo-frame{width:58px;height:88px}

.mb-template-branch-grid.mb-density-compact .mb-black-title{font-size:10px}
.mb-template-branch-grid.mb-density-compact .mb-recipe-table{font-size:8px}
.mb-template-branch-grid.mb-density-compact .mb-r-name,
.mb-template-branch-grid.mb-density-compact .mb-r-qty,
.mb-template-branch-grid.mb-density-compact .mb-r-unit,
.mb-template-branch-grid.mb-density-compact .mb-cup-qty{font-size:8px}
.mb-template-branch-grid.mb-density-compact .mb-cup-title{font-size:8px}
.mb-template-branch-grid.mb-density-compact .mb-drink-table thead th{font-size:7.5px}
.mb-template-branch-grid.mb-density-compact .mb-table-body{grid-template-columns:58px minmax(0,1fr)}
.mb-template-branch-grid.mb-density-compact .mb-photo-frame{width:48px;height:72px}

.mb-template-branch-grid.mb-density-max .mb-black-title{font-size:9px;line-height:1.15}
.mb-template-branch-grid.mb-density-max .mb-recipe-table{font-size:7px;line-height:1.12}
.mb-template-branch-grid.mb-density-max .mb-r-name,
.mb-template-branch-grid.mb-density-max .mb-r-qty,
.mb-template-branch-grid.mb-density-max .mb-r-unit,
.mb-template-branch-grid.mb-density-max .mb-cup-qty{font-size:7px}
.mb-template-branch-grid.mb-density-max .mb-cup-title{font-size:7px}
.mb-template-branch-grid.mb-density-max .mb-drink-table thead th{font-size:6.5px;height:auto}
.mb-template-branch-grid.mb-density-max .mb-note-line{font-size:6.5px}
.mb-template-branch-grid.mb-density-max .mb-table-body{grid-template-columns:46px minmax(0,1fr)}
.mb-template-branch-grid.mb-density-max .mb-photo-frame{width:38px;height:58px}


.mb-edit-list{display:grid;gap:6px;margin:7px 0}.mb-edit-row{display:grid;grid-template-columns:auto minmax(0,1.7fr) minmax(0,1.2fr) minmax(0,1fr) auto;gap:5px;align-items:center}.mb-edit-row .mb-input{padding:7px;font-size:10px}.mb-row-move{display:grid;grid-template-columns:1fr 1fr;gap:3px}.mb-row-move .mb-link{padding:6px 7px;font-size:13px;line-height:1}
.ksl-media-page{--mb-theme-bg:#fff;--mb-theme-card:#fff;--mb-theme-title:#050505;--mb-theme-title-text:#fff;--mb-theme-accent:#176b4d;--mb-theme-soft:#eef8f3;background:var(--mb-theme-bg)}
.ksl-media-page .mb-black-title{background:var(--mb-theme-title);color:var(--mb-theme-title-text)}
.ksl-media-page .mb-card{background:var(--mb-theme-card);border-color:var(--mb-theme-title)}
.ksl-media-page .mb-page-head{border-color:var(--mb-theme-accent)}
.ksl-media-page .mb-kamu,.ksl-media-page .mb-page-head h1{color:var(--mb-theme-accent)}
.ksl-media-page .mb-cup-title,.ksl-media-page .mb-cup-type{color:var(--mb-theme-accent)}
.mb-theme-1{--mb-theme-bg:#fff;--mb-theme-card:#fff;--mb-theme-title:#0c4f38;--mb-theme-title-text:#fff;--mb-theme-accent:#176b4d;--mb-theme-soft:#eaf6ef}
.mb-theme-2{--mb-theme-bg:#fff;--mb-theme-card:#fff;--mb-theme-title:#050505;--mb-theme-title-text:#fff;--mb-theme-accent:#111;--mb-theme-soft:#eee}
.mb-theme-3{--mb-theme-bg:#fbfff8;--mb-theme-card:#fff;--mb-theme-title:#46752f;--mb-theme-title-text:#fff;--mb-theme-accent:#6f9d45;--mb-theme-soft:#eef7e8}
.mb-theme-4{--mb-theme-bg:#f7fffc;--mb-theme-card:#fff;--mb-theme-title:#2b806d;--mb-theme-title-text:#fff;--mb-theme-accent:#49a58e;--mb-theme-soft:#e8f7f2}
.mb-theme-5{--mb-theme-bg:#f8fcf8;--mb-theme-card:#fff;--mb-theme-title:#183d2b;--mb-theme-title-text:#fff;--mb-theme-accent:#285b3d;--mb-theme-soft:#e8f0eb}
.mb-theme-6{--mb-theme-bg:#fffdf4;--mb-theme-card:#fffef8;--mb-theme-title:#75622e;--mb-theme-title-text:#fff;--mb-theme-accent:#9b823d;--mb-theme-soft:#f7f0d9}
.mb-theme-7{--mb-theme-bg:#fffaf5;--mb-theme-card:#fff;--mb-theme-title:#694a37;--mb-theme-title-text:#fff;--mb-theme-accent:#8a6249;--mb-theme-soft:#f4e9df}
.mb-theme-8{--mb-theme-bg:#fdf9ff;--mb-theme-card:#fff;--mb-theme-title:#69427d;--mb-theme-title-text:#fff;--mb-theme-accent:#8d61a4;--mb-theme-soft:#f0e7f5}
.mb-theme-9{--mb-theme-bg:#fff9f3;--mb-theme-card:#fff;--mb-theme-title:#a14f22;--mb-theme-title-text:#fff;--mb-theme-accent:#c96c36;--mb-theme-soft:#faeadf}
.mb-theme-10{--mb-theme-bg:#f7fbff;--mb-theme-card:#fff;--mb-theme-title:#2e6f9c;--mb-theme-title-text:#fff;--mb-theme-accent:#458dbd;--mb-theme-soft:#e5f2fb}
.mb-theme-11{--mb-theme-bg:#f8f9fc;--mb-theme-card:#fff;--mb-theme-title:#183354;--mb-theme-title-text:#fff;--mb-theme-accent:#294f79;--mb-theme-soft:#e8eef5}
.mb-theme-12{--mb-theme-bg:#fff8fa;--mb-theme-card:#fff;--mb-theme-title:#94455e;--mb-theme-title-text:#fff;--mb-theme-accent:#b7647d;--mb-theme-soft:#f7e8ed}
.mb-theme-13{--mb-theme-bg:#fffafb;--mb-theme-card:#fff;--mb-theme-title:#a85f73;--mb-theme-title-text:#fff;--mb-theme-accent:#cf8297;--mb-theme-soft:#f9e8ee}
.mb-theme-14{--mb-theme-bg:#fafafa;--mb-theme-card:#fff;--mb-theme-title:#555;--mb-theme-title-text:#fff;--mb-theme-accent:#777;--mb-theme-soft:#eee}
.mb-theme-15{--mb-theme-bg:#fff;--mb-theme-card:#fff;--mb-theme-title:#000;--mb-theme-title-text:#fff;--mb-theme-accent:#000;--mb-theme-soft:#fff}
.mb-theme-16{--mb-theme-bg:#f5fff9;--mb-theme-card:#fff;--mb-theme-title:#047857;--mb-theme-title-text:#fff;--mb-theme-accent:#059669;--mb-theme-soft:#dff7ea}
.mb-theme-17{--mb-theme-bg:#fbfff4;--mb-theme-card:#fff;--mb-theme-title:#5f7f21;--mb-theme-title-text:#fff;--mb-theme-accent:#84a936;--mb-theme-soft:#eef7d9}
.mb-theme-18{--mb-theme-bg:#fcfcf6;--mb-theme-card:#fff;--mb-theme-title:#626b2f;--mb-theme-title-text:#fff;--mb-theme-accent:#808a3e;--mb-theme-soft:#f0f1df}
.mb-theme-19{--mb-theme-bg:#f3fffe;--mb-theme-card:#fff;--mb-theme-title:#0f766e;--mb-theme-title-text:#fff;--mb-theme-accent:#0d9488;--mb-theme-soft:#dff7f4}
.mb-theme-20{--mb-theme-bg:#f4fdff;--mb-theme-card:#fff;--mb-theme-title:#0e7490;--mb-theme-title-text:#fff;--mb-theme-accent:#0891b2;--mb-theme-soft:#def7fb}
.mb-theme-21{--mb-theme-bg:#f7faff;--mb-theme-card:#fff;--mb-theme-title:#1d4ed8;--mb-theme-title-text:#fff;--mb-theme-accent:#2563eb;--mb-theme-soft:#e6eeff}
.mb-theme-22{--mb-theme-bg:#f8f7ff;--mb-theme-card:#fff;--mb-theme-title:#4338ca;--mb-theme-title-text:#fff;--mb-theme-accent:#4f46e5;--mb-theme-soft:#ebe9ff}
.mb-theme-23{--mb-theme-bg:#fbf7ff;--mb-theme-card:#fff;--mb-theme-title:#6d28d9;--mb-theme-title-text:#fff;--mb-theme-accent:#7c3aed;--mb-theme-soft:#f0e7ff}
.mb-theme-24{--mb-theme-bg:#fff7fd;--mb-theme-card:#fff;--mb-theme-title:#7e225f;--mb-theme-title-text:#fff;--mb-theme-accent:#a03582;--mb-theme-soft:#f6e3ef}
.mb-theme-25{--mb-theme-bg:#fff6fd;--mb-theme-card:#fff;--mb-theme-title:#a21caf;--mb-theme-title-text:#fff;--mb-theme-accent:#c026d3;--mb-theme-soft:#f7e2fa}
.mb-theme-26{--mb-theme-bg:#fff8f6;--mb-theme-card:#fff;--mb-theme-title:#c2413a;--mb-theme-title-text:#fff;--mb-theme-accent:#e05a4f;--mb-theme-soft:#fae7e3}
.mb-theme-27{--mb-theme-bg:#fff7f7;--mb-theme-card:#fff;--mb-theme-title:#b91c1c;--mb-theme-title-text:#fff;--mb-theme-accent:#dc2626;--mb-theme-soft:#fde5e5}
.mb-theme-28{--mb-theme-bg:#fffaf1;--mb-theme-card:#fff;--mb-theme-title:#b45309;--mb-theme-title-text:#fff;--mb-theme-accent:#d97706;--mb-theme-soft:#faecd2}
.mb-theme-29{--mb-theme-bg:#fff9f4;--mb-theme-card:#fff;--mb-theme-title:#78350f;--mb-theme-title-text:#fff;--mb-theme-accent:#92400e;--mb-theme-soft:#f2e4d8}
.mb-theme-30{--mb-theme-bg:#f8fafc;--mb-theme-card:#fff;--mb-theme-title:#334155;--mb-theme-title-text:#fff;--mb-theme-accent:#475569;--mb-theme-soft:#e8edf3}


/* V6.3.10 polished export layout */
.mb-template-branch-grid{
  padding:14px 18px 12px;
  grid-template-rows:auto minmax(0,1fr) auto;
}
.mb-template-branch-grid .mb-page-head{
  margin-bottom:9px;
  padding-bottom:7px;
}
.mb-template-branch-grid .mb-page-head h1{
  font-size:20px;
  line-height:1.12;
}
.mb-template-branch-grid .mb-footer{
  position:relative;
  z-index:2;
  margin-top:8px;
  padding-top:5px;
  background:var(--mb-theme-bg);
  font-size:7.5px;
}
.mb-export-rows{
  min-height:0;
  display:flex;
  flex-direction:column;
  gap:10px;
  align-items:stretch;
  justify-content:flex-start;
}
.mb-export-row{
  width:var(--row-width);
  max-width:100%;
  margin-inline:auto;
  display:grid;
  grid-template-columns:repeat(var(--row-cols),minmax(0,1fr));
  gap:10px;
  align-items:stretch;
}
.mb-export-row .mb-card{
  width:100%;
  min-width:0;
  height:100%;
  align-self:stretch;
  overflow:hidden;
}
.mb-template-branch-grid .mb-table-body{
  grid-template-columns:64px minmax(0,1fr);
  min-width:0;
  height:100%;
}
.mb-template-branch-grid .mb-left-photo{
  min-width:0;
  padding:5px 4px;
  align-items:center;
  justify-content:center;
}
.mb-template-branch-grid .mb-photo-frame{
  width:52px;
  height:82px;
  max-width:100%;
  flex:none;
}
.mb-template-branch-grid .mb-table-side{
  min-width:0;
  overflow:hidden;
}
.mb-template-branch-grid .mb-recipe-table{
  width:100%;
  table-layout:fixed;
  border-collapse:collapse;
}
.mb-template-branch-grid .mb-recipe-table td,
.mb-template-branch-grid .mb-drink-table thead th{
  min-width:0;
  max-width:100%;
  white-space:normal;
  overflow:visible;
  text-overflow:clip;
  overflow-wrap:anywhere;
  word-break:normal;
}
.mb-template-branch-grid .mb-r-name{width:auto}
.mb-template-branch-grid .mb-r-unit{
  width:18%;
  text-align:left;
}
.mb-template-branch-grid .mb-r-qty{
  width:18%;
  text-align:center;
}
.mb-template-branch-grid .mb-cup-label{width:46%}
.mb-template-branch-grid .mb-cup-unit{width:16%}
.mb-template-branch-grid .mb-cup-qty{
  width:auto;
  text-align:center;
}
.mb-template-branch-grid .mb-black-title{
  width:100%;
  min-width:0;
}
.mb-template-branch-grid .mb-note-line{
  margin-top:auto;
  border-top:1px solid #eadb57;
}
.mb-template-branch-grid.mb-density-medium .mb-export-rows{gap:8px}
.mb-template-branch-grid.mb-density-medium .mb-export-row{gap:8px}
.mb-template-branch-grid.mb-density-medium .mb-table-body{grid-template-columns:56px minmax(0,1fr)}
.mb-template-branch-grid.mb-density-medium .mb-photo-frame{width:46px;height:72px}
.mb-template-branch-grid.mb-density-medium .mb-recipe-table{font-size:8.8px;line-height:1.15}
.mb-template-branch-grid.mb-density-medium .mb-recipe-table td{padding:3px 4px}
.mb-template-branch-grid.mb-density-medium .mb-black-title{font-size:11.5px;min-height:29px}
.mb-template-branch-grid.mb-density-compact .mb-export-rows{gap:7px}
.mb-template-branch-grid.mb-density-compact .mb-export-row{gap:7px}
.mb-template-branch-grid.mb-density-compact .mb-table-body{grid-template-columns:50px minmax(0,1fr)}
.mb-template-branch-grid.mb-density-compact .mb-photo-frame{width:40px;height:64px}
.mb-template-branch-grid.mb-density-compact .mb-recipe-table{font-size:7.7px}
.mb-template-branch-grid.mb-density-max .mb-export-rows{gap:5px}
.mb-template-branch-grid.mb-density-max .mb-export-row{gap:5px}
.mb-template-branch-grid.mb-density-max .mb-table-body{grid-template-columns:42px minmax(0,1fr)}
.mb-template-branch-grid.mb-density-max .mb-photo-frame{width:33px;height:52px}
.mb-template-branch-grid.mb-density-max .mb-recipe-table{font-size:6.6px}
.mb-template-branch-grid.mb-density-max .mb-black-title{font-size:8.5px;min-height:23px}


/* V6.3.15 portrait layout fix: 2 columns, content-driven rows */
.mb-template-branch-grid.mb-portrait{
  padding:14px 16px 10px;
}
.mb-template-branch-grid.mb-portrait .mb-page-head{
  margin-bottom:8px;
  padding-bottom:6px;
}
.mb-template-branch-grid.mb-portrait .mb-export-rows{
  display:flex;
  flex-direction:column;
  gap:7px;
  min-height:0;
  height:auto;
  align-items:stretch;
}
.mb-template-branch-grid.mb-portrait .mb-export-row{
  width:100%!important;
  max-width:100%;
  margin:0;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:7px;
  align-items:start;
}
.mb-template-branch-grid.mb-portrait .mb-export-row:has(.mb-card:only-child){
  width:50%!important;
  margin-inline:auto;
  grid-template-columns:1fr;
}
.mb-template-branch-grid.mb-portrait .mb-card{
  min-height:0;
  height:auto;
  overflow:hidden;
}
.mb-template-branch-grid.mb-portrait .mb-black-title{
  min-height:24px;
  height:auto;
  font-size:10px;
  line-height:1.12;
  padding:4px 6px;
}
.mb-template-branch-grid.mb-portrait .mb-table-body{
  grid-template-columns:48px minmax(0,1fr);
  height:auto;
  min-height:0;
}
.mb-template-branch-grid.mb-portrait .mb-left-photo{
  padding:3px;
}
.mb-template-branch-grid.mb-portrait .mb-photo-frame{
  width:38px;
  height:56px;
}
.mb-template-branch-grid.mb-portrait .mb-recipe-table{
  width:100%;
  table-layout:fixed;
  font-size:7px;
  line-height:1.1;
}
.mb-template-branch-grid.mb-portrait .mb-recipe-table td{
  padding:2px 3px;
  height:auto;
}
.mb-template-branch-grid.mb-portrait .mb-cup-title{
  font-size:6.8px;
  padding:2px 3px;
}
.mb-template-branch-grid.mb-portrait .mb-drink-table thead th{
  font-size:6.6px;
  padding:2px 3px;
  height:auto;
}
.mb-template-branch-grid.mb-portrait .mb-note-line{
  font-size:6.3px;
  line-height:1.08;
  padding:2px 4px;
}
.mb-template-branch-grid.mb-portrait .mb-footer{
  margin-top:6px;
  font-size:6px;
}



/* V6.3.32 ingredient header only + single-line cup type */
.mb-template-branch-grid .mb-drink-table thead th.mb-cup-label,
.ksl-media-page .mb-drink-table thead th.mb-cup-label{
  text-align:center!important;
  color:#0b57d0!important;
  font-size:10px!important;
  font-weight:900!important;
}

/* restore ingredient detail cells */
.mb-template-branch-grid .mb-drink-table tbody td:first-child,
.ksl-media-page .mb-drink-table tbody td:first-child,
.mb-template-branch-grid .mb-r-name,
.ksl-media-page .mb-r-name{
  text-align:left!important;
  color:inherit!important;
  font-size:10px!important;
  font-weight:700!important;
  line-height:1.15!important;
}

/* cup labels such as M(IB) stay on one line */
.mb-template-branch-grid .mb-cup-type,
.ksl-media-page .mb-cup-type{
  font-size:7.5px!important;
  line-height:1!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  word-break:normal!important;
  overflow-wrap:normal!important;
  min-width:28px!important;
  max-width:46px!important;
}

/* V6.3.31 ingredient / unit / cup-type tuning */
.mb-template-branch-grid .mb-r-name,
.ksl-media-page .mb-r-name{
  text-align:center!important;
  color:#0b57d0!important;
  font-size:11.5px!important;
  font-weight:800!important;
  line-height:1.15!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
}
.mb-template-branch-grid .mb-r-unit,
.ksl-media-page .mb-r-unit,
.mb-template-branch-grid .mb-cup-unit,
.ksl-media-page .mb-cup-unit{
  text-align:center!important;
  color:#1f2937!important;
  font-size:11px!important;
  font-weight:700!important;
  line-height:1.1!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
}
.mb-template-branch-grid .mb-cup-title,
.ksl-media-page .mb-cup-title{
  font-size:9px!important;
  line-height:1.05!important;
  font-weight:800!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
}
.mb-template-branch-grid .mb-cup-type,
.ksl-media-page .mb-cup-type{
  font-size:9px!important;
  line-height:1.05!important;
  font-weight:800!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
  text-align:center!important;
}
.mb-template-branch-grid .mb-drink-table thead th,
.ksl-media-page .mb-drink-table thead th{
  text-align:center!important;
  vertical-align:middle!important;
}
.mb-template-branch-grid .mb-r-unit,
.ksl-media-page .mb-r-unit{
  vertical-align:middle!important;
}
.mb-template-branch-grid .mb-drink-table tbody td:first-child,
.ksl-media-page .mb-drink-table tbody td:first-child{
  text-align:center!important;
  color:#0b57d0!important;
  font-size:11.5px!important;
  font-weight:800!important;
}

/* V6.3.30 responsive builder — mobile / tablet / desktop */
#kslMediaOverlay{
  width:100vw!important;
  max-width:100vw!important;
  overflow:hidden!important;
}
.mb-topbar{
  min-width:0!important;
}
.mb-actions{
  min-width:0!important;
}
.mb-shell{
  min-width:0!important;
}
.mb-controls,
.mb-preview-wrap{
  min-width:0!important;
}
.mb-preview-wrap{
  width:100%!important;
}
#kslMediaPreview{
  width:100%!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  gap:22px!important;
}
.ksl-media-page{
  transform-origin:top center!important;
}

/* Desktop */
@media (min-width:1200px){
  .mb-shell{grid-template-columns:355px minmax(0,1fr)!important}
  .mb-controls{display:block!important}
  .mb-preview-wrap{padding:22px!important}
}

/* Tablet */
@media (min-width:768px) and (max-width:1199px){
  .mb-topbar{
    height:auto!important;
    min-height:64px!important;
    padding:10px 12px!important;
    align-items:flex-start!important;
    flex-wrap:wrap!important;
  }
  .mb-topbar>div:first-child{min-width:180px}
  .mb-actions{
    width:100%!important;
    justify-content:flex-start!important;
    overflow-x:auto!important;
    flex-wrap:nowrap!important;
    padding-bottom:4px!important;
  }
  .mb-actions .mb-btn,
  .mb-actions .mb-count{
    flex:0 0 auto!important;
    white-space:nowrap!important;
  }
  .mb-shell{
    height:calc(100vh - 112px)!important;
    grid-template-columns:300px minmax(0,1fr)!important;
  }
  .mb-controls{padding:12px!important}
  .mb-preview-wrap{padding:14px!important}
  #kslMediaPreview{
    --mb-preview-scale:calc((100vw - 338px) / 1123);
  }
  #kslMediaPreview .ksl-media-page.mb-landscape{
    transform:scale(min(1,var(--mb-preview-scale)))!important;
    margin-bottom:calc((794px * (min(1,var(--mb-preview-scale)) - 1)))!important;
  }
  #kslMediaPreview .ksl-media-page.mb-portrait{
    --mb-preview-scale-p:calc((100vw - 338px) / 794);
    transform:scale(min(1,var(--mb-preview-scale-p)))!important;
    margin-bottom:calc((1123px * (min(1,var(--mb-preview-scale-p)) - 1)))!important;
  }
}

/* Mobile */
@media (max-width:767px){
  #kslMediaOverlay{
    overflow:auto!important;
    background:#edf6f1!important;
  }
  .mb-topbar{
    position:sticky!important;
    top:0!important;
    height:auto!important;
    min-height:0!important;
    padding:8px 10px!important;
    display:block!important;
  }
  .mb-topbar h2{
    font-size:16px!important;
  }
  .mb-topbar small{
    display:block!important;
    margin-top:2px!important;
    font-size:10px!important;
  }
  .mb-actions{
    margin-top:7px!important;
    width:100%!important;
    display:flex!important;
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
    gap:6px!important;
    padding-bottom:4px!important;
    -webkit-overflow-scrolling:touch!important;
  }
  .mb-actions .mb-btn{
    flex:0 0 auto!important;
    padding:8px 10px!important;
    font-size:11px!important;
    white-space:nowrap!important;
  }
  .mb-actions .mb-count{
    flex:0 0 auto!important;
    white-space:nowrap!important;
  }
  .mb-shell{
    display:flex!important;
    flex-direction:column!important;
    height:auto!important;
    min-height:calc(100vh - 94px)!important;
    overflow:visible!important;
  }
  .mb-controls{
    width:100%!important;
    max-height:none!important;
    overflow:visible!important;
    border-right:0!important;
    border-bottom:1px solid #d4e7dc!important;
    padding:10px!important;
  }
  .mb-preview-wrap{
    width:100%!important;
    overflow:hidden!important;
    padding:10px 4px 22px!important;
    gap:10px!important;
  }
  .mb-block{
    border-radius:11px!important;
    padding:10px!important;
    margin-bottom:9px!important;
  }
  .mb-inline{
    grid-template-columns:1fr!important;
    gap:4px!important;
  }
  .mb-list-tools{
    flex-wrap:wrap!important;
  }
  #kslMediaItemList{
    max-height:220px!important;
  }
  #kslMediaPreview{
    width:100%!important;
    overflow:visible!important;
    gap:10px!important;
  }
  #kslMediaPreview .ksl-media-page.mb-portrait{
    transform:scale(calc((100vw - 16px) / 794))!important;
    margin-top:calc((1123px * (((100vw - 16px) / 794) - 1) / 2))!important;
    margin-bottom:calc((1123px * (((100vw - 16px) / 794) - 1) / 2))!important;
  }
  #kslMediaPreview .ksl-media-page.mb-landscape{
    transform:scale(calc((100vw - 16px) / 1123))!important;
    margin-top:calc((794px * (((100vw - 16px) / 1123) - 1) / 2))!important;
    margin-bottom:calc((794px * (((100vw - 16px) / 1123) - 1) / 2))!important;
  }
  .mb-field label{font-size:11px!important}
  .mb-input,.mb-select{
    min-height:40px!important;
    font-size:14px!important;
  }
  .mb-link{
    min-height:36px!important;
    font-size:11px!important;
  }
}

/* Small phone */
@media (max-width:430px){
  .mb-topbar{padding:7px 8px!important}
  .mb-controls{padding:8px!important}
  .mb-preview-wrap{padding-left:2px!important;padding-right:2px!important}
  #kslMediaPreview .ksl-media-page.mb-portrait{
    transform:scale(calc((100vw - 8px) / 794))!important;
  }
  #kslMediaPreview .ksl-media-page.mb-landscape{
    transform:scale(calc((100vw - 8px) / 1123))!important;
  }
}

/* Export/print must always use exact A4 size, never responsive transforms */
@media print{
  #kslMediaPrintRoot .ksl-media-page{
    transform:none!important;
    margin:0!important;
  }
}

/* V6.3.29 full-page theme, always clipped inside A4 */
.ksl-media-page,
.ksl-media-page *{
  box-sizing:border-box!important;
}
.ksl-media-page{
  background:var(--mb-theme-bg,#fff)!important;
  background-clip:border-box!important;
  overflow:hidden!important;
}
.ksl-media-page.mb-portrait{
  width:794px!important;
  height:1123px!important;
  min-width:794px!important;
  max-width:794px!important;
  min-height:1123px!important;
  max-height:1123px!important;
}
.ksl-media-page.mb-landscape{
  width:1123px!important;
  height:794px!important;
  min-width:1123px!important;
  max-width:1123px!important;
  min-height:794px!important;
  max-height:794px!important;
}
.ksl-media-page .mb-page-head,
.ksl-media-page .mb-equal-rows,
.ksl-media-page .mb-equal-row,
.ksl-media-page .mb-card,
.ksl-media-page .mb-table-body,
.ksl-media-page .mb-table-side,
.ksl-media-page .mb-recipe-table,
.ksl-media-page .mb-footer{
  min-width:0!important;
  max-width:100%!important;
}
.ksl-media-page .mb-equal-rows{
  overflow:hidden!important;
}
.ksl-media-page .mb-equal-row{
  width:100%!important;
}
.ksl-media-page .mb-card{
  width:100%!important;
  overflow:hidden!important;
}
.ksl-media-page .mb-table-body,
.ksl-media-page .mb-table-side{
  overflow:hidden!important;
}
.ksl-media-page .mb-recipe-table{
  width:100%!important;
  table-layout:fixed!important;
}
.ksl-media-page img{
  max-width:100%!important;
}

/* V6.3.28 wider ingredient column + compact cup/unit columns */
.mb-template-branch-grid .mb-cup-label,
.ksl-media-page .mb-cup-label{
  width:58%!important;
  min-width:0!important;
  text-align:left!important;
}
.mb-template-branch-grid .mb-cup-type,
.ksl-media-page .mb-cup-type{
  width:auto!important;
  min-width:34px!important;
  max-width:54px!important;
  padding:3px 2px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
  line-height:1.08!important;
}
.mb-template-branch-grid .mb-cup-qty,
.ksl-media-page .mb-cup-qty{
  width:auto!important;
  min-width:30px!important;
  max-width:48px!important;
  padding:3px 2px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
}
.mb-template-branch-grid .mb-cup-unit,
.ksl-media-page .mb-cup-unit{
  width:13%!important;
  min-width:34px!important;
  max-width:52px!important;
  padding:3px 2px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
}
.mb-template-branch-grid .mb-r-name,
.ksl-media-page .mb-r-name{
  width:auto!important;
  min-width:0!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
}
.mb-template-branch-grid .mb-r-unit,
.ksl-media-page .mb-r-unit{
  width:13%!important;
  min-width:34px!important;
  max-width:52px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:anywhere!important;
}
.mb-template-branch-grid .mb-r-qty,
.ksl-media-page .mb-r-qty{
  width:14%!important;
  min-width:34px!important;
  max-width:52px!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
}
.mb-template-branch-grid .mb-drink-table,
.ksl-media-page .mb-drink-table{
  table-layout:fixed!important;
  width:100%!important;
}

/* V6.3.27 — 30 templates. Template changes never reduce typography */
.ksl-media-page .mb-black-title{font-size:15px!important;line-height:1.18!important;font-weight:900!important;min-height:34px!important;padding:6px 8px!important}
.ksl-media-page .mb-cup-title{font-size:12px!important;line-height:1.15!important;font-weight:900!important;color:#d60000!important}
.ksl-media-page .mb-cup-type{font-size:12px!important;font-weight:900!important;color:#d60000!important}
.ksl-media-page .mb-recipe-table{font-size:10px!important;line-height:1.18!important}
.ksl-media-page .mb-recipe-table td{font-size:10px!important}
.ksl-media-page .mb-drink-table thead th{font-size:9px!important}
.ksl-media-page .mb-note-line{font-size:9px!important;line-height:1.15!important}

/* template geometry/decor only — no font-size rules below */
.mb-template-modern .mb-card{border-radius:14px;border:1px solid var(--mb-theme-accent);box-shadow:0 3px 10px rgba(0,0,0,.08)}
.mb-template-modern .mb-black-title{border-radius:12px 12px 0 0}
.mb-template-visual .mb-card{border:3px solid var(--mb-theme-accent);border-radius:10px}
.mb-template-visual .mb-black-title{background:linear-gradient(90deg,var(--mb-theme-title),var(--mb-theme-accent))}
.mb-template-compact .mb-card{border:1px solid var(--mb-theme-title);border-radius:0}
.mb-template-clean .mb-card{border:1px solid #dce7e2;border-radius:8px}.mb-template-clean .mb-black-title{background:var(--mb-theme-soft);color:var(--mb-theme-title)}
.mb-template-outline .mb-card{border:3px solid var(--mb-theme-title);border-radius:0}.mb-template-outline .mb-black-title{background:#fff;color:var(--mb-theme-title);border-bottom:3px solid var(--mb-theme-title)}
.mb-template-soft .mb-card{border:0;border-radius:18px;background:var(--mb-theme-soft);box-shadow:0 2px 8px rgba(0,0,0,.07)}
.mb-template-stripe .mb-card{border:1px solid var(--mb-theme-accent);border-radius:6px}.mb-template-stripe .mb-black-title{border-top:7px solid var(--mb-theme-accent)}
.mb-template-double .mb-card{border:4px double var(--mb-theme-title);border-radius:0}
.mb-template-rounded .mb-card{border:2px solid var(--mb-theme-accent);border-radius:22px;overflow:hidden}.mb-template-rounded .mb-black-title{border-radius:18px 18px 0 0}
.mb-template-square .mb-card{border:2px solid var(--mb-theme-title);border-radius:0}
.mb-template-minimal .mb-card{border:0;border-top:2px solid var(--mb-theme-accent);border-bottom:1px solid #ddd;border-radius:0}.mb-template-minimal .mb-black-title{background:transparent;color:var(--mb-theme-title)}
.mb-template-classic .mb-card{border:2px solid var(--mb-theme-title);border-radius:4px}.mb-template-classic .mb-black-title{border-bottom:2px solid var(--mb-theme-title)}
.mb-template-poster .mb-card{border:0;border-radius:0;box-shadow:0 0 0 1px #ddd}.mb-template-poster .mb-black-title{background:linear-gradient(135deg,var(--mb-theme-title) 0 78%,var(--mb-theme-accent) 78%)}
.mb-template-label .mb-card{border:1px solid #ddd;border-radius:7px}.mb-template-label .mb-black-title{margin:5px;border-radius:7px}
.mb-template-shadow .mb-card{border:0;border-radius:10px;box-shadow:0 5px 14px rgba(0,0,0,.16)}
.mb-template-frame .mb-card{border:6px solid var(--mb-theme-soft);outline:2px solid var(--mb-theme-title);outline-offset:-4px;border-radius:0}
.mb-template-topline .mb-card{border:1px solid #ddd;border-top:6px solid var(--mb-theme-accent);border-radius:0}
.mb-template-bottomline .mb-card{border:1px solid #ddd;border-bottom:6px solid var(--mb-theme-accent);border-radius:0}
.mb-template-leftline .mb-card{border:1px solid #ddd;border-left:7px solid var(--mb-theme-accent);border-radius:0}
.mb-template-rightline .mb-card{border:1px solid #ddd;border-right:7px solid var(--mb-theme-accent);border-radius:0}
.mb-template-capsule .mb-card{border:1px solid var(--mb-theme-accent);border-radius:16px}.mb-template-capsule .mb-black-title{margin:5px 8px;border-radius:999px}
.mb-template-ticket .mb-card{border:2px dashed var(--mb-theme-accent);border-radius:10px}
.mb-template-notebook .mb-card{border:1px solid #d7e2dc;border-left:12px solid var(--mb-theme-soft);border-radius:3px;background:repeating-linear-gradient(#fff,#fff 25px,#f4f7f5 26px)}
.mb-template-gridlight .mb-card{border:1px solid var(--mb-theme-accent);border-radius:0;background-image:linear-gradient(#eef3f0 1px,transparent 1px),linear-gradient(90deg,#eef3f0 1px,transparent 1px);background-size:18px 18px}
.mb-template-boldbar .mb-card{border:2px solid var(--mb-theme-title);border-radius:0}.mb-template-boldbar .mb-black-title{border-bottom:8px solid var(--mb-theme-accent)}
.mb-template-split .mb-black-title{background:linear-gradient(90deg,var(--mb-theme-title) 0 50%,var(--mb-theme-accent) 50% 100%)}
.mb-template-simple .mb-card{border:1px solid #cfd8d4;border-radius:2px}.mb-template-simple .mb-black-title{background:#fff;color:var(--mb-theme-title);border-bottom:2px solid var(--mb-theme-accent)}
.mb-template-training .mb-card{border:3px solid var(--mb-theme-title);border-radius:8px;background:var(--mb-theme-card)}.mb-template-training .mb-black-title{box-shadow:inset 0 -4px 0 var(--mb-theme-accent)}
.mb-template-premium .mb-card{border:2px solid var(--mb-theme-title);border-radius:12px;box-shadow:inset 0 0 0 3px var(--mb-theme-soft),0 4px 12px rgba(0,0,0,.1)}
.mb-template-premium .mb-black-title{background:linear-gradient(90deg,var(--mb-theme-title),var(--mb-theme-accent),var(--mb-theme-title))}

/* V6.3.26 larger red cup-type labels */
.mb-template-branch-grid .mb-cup-title{
  color:#d60000!important;
  font-size:12px!important;
  font-weight:900!important;
  line-height:1.15!important;
}
.mb-template-branch-grid .mb-cup-type{
  color:#d60000!important;
  font-size:12px!important;
  font-weight:900!important;
}
.mb-template-branch-grid.mb-density-medium .mb-cup-title,
.mb-template-branch-grid.mb-density-medium .mb-cup-type{
  font-size:11px!important;
}
.mb-template-branch-grid.mb-density-compact .mb-cup-title,
.mb-template-branch-grid.mb-density-compact .mb-cup-type{
  font-size:10px!important;
}
.mb-template-branch-grid.mb-density-max .mb-cup-title,
.mb-template-branch-grid.mb-density-max .mb-cup-type{
  font-size:9px!important;
}

/* V6.3.25 larger menu titles */
.mb-template-branch-grid .mb-black-title{
  font-size:15px!important;
  line-height:1.18!important;
  font-weight:900!important;
  min-height:34px!important;
  padding:6px 8px!important;
}
.mb-template-branch-grid.mb-density-medium .mb-black-title{
  font-size:14px!important;
  min-height:32px!important;
}
.mb-template-branch-grid.mb-density-compact .mb-black-title{
  font-size:12.5px!important;
  min-height:29px!important;
}
.mb-template-branch-grid.mb-density-max .mb-black-title{
  font-size:11px!important;
  min-height:27px!important;
}

/* V6.3.21 equal-height paired rows, no blank placeholders */
.mb-empty-slot{display:none!important}
.mb-export-columns,.mb-export-col{display:none!important}

.mb-equal-rows{
  display:flex;
  flex-direction:column;
  gap:7px;
  min-height:0;
  align-items:stretch;
  align-content:start;
}
.mb-equal-row{
  display:grid;
  grid-template-columns:repeat(var(--mb-row-cols),minmax(0,1fr));
  gap:7px;
  align-items:stretch;
}
.mb-equal-row>.mb-card{
  height:100%!important;
  align-self:stretch!important;
  margin:0!important;
}
.mb-equal-row>.mb-card:only-child{
  grid-column:auto!important;
  width:100%;
  max-width:100%;
}
.mb-equal-row .mb-table-body{
  flex:1;
}
.mb-template-branch-grid.mb-portrait .mb-equal-row{
  grid-template-columns:repeat(var(--mb-row-cols),minmax(0,1fr));
}
.mb-template-branch-grid.mb-landscape .mb-equal-rows,
.mb-template-branch-grid.mb-landscape .mb-equal-row{gap:8px}

/* V6.3.20 balanced blank slots */
.mb-empty-slot{
  min-height:72px;
  border:2px dashed #d8e7df;
  background:rgba(248,252,250,.62);
  border-radius:0;
}
.mb-template-branch-grid.mb-portrait .mb-empty-slot{min-height:72px}
.mb-template-branch-grid.mb-landscape .mb-empty-slot{min-height:64px}
.mb-density-compact .mb-empty-slot{min-height:54px}
.mb-density-max .mb-empty-slot{min-height:44px}

/* V6.3.19 packed card columns */
.mb-export-columns{
  display:grid;
  grid-template-columns:repeat(var(--mb-export-cols),minmax(0,1fr));
  gap:7px;
  min-height:0;
  align-items:start;
  align-content:start;
}
.mb-export-col{
  display:flex;
  flex-direction:column;
  gap:7px;
  min-width:0;
  align-items:stretch;
}
.mb-export-col .mb-card{
  height:auto!important;
  align-self:stretch;
  margin:0!important;
}
.mb-template-branch-grid.mb-portrait .mb-export-columns{
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:7px;
}
.mb-template-branch-grid.mb-portrait .mb-export-col{gap:7px}
.mb-template-branch-grid.mb-landscape .mb-export-columns{gap:8px}
.mb-template-branch-grid.mb-landscape .mb-export-col{gap:8px}

/* V6.3.17 full-A4 export + saved history */
#kslMediaHistoryPage{display:none;position:absolute;inset:64px 0 0;background:#f2f7f4;z-index:8;overflow:auto;padding:22px}
#kslMediaHistoryPage.show{display:block}
.mb-history-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;max-width:1200px;margin:0 auto 18px;background:#fff;border:1px solid #d5e7de;border-radius:16px;padding:18px}.mb-history-head h2{margin:3px 0 4px;color:#174c39}.mb-history-head p{margin:0;color:#6d8178}
.mb-history-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.mb-history-card{background:#fff;border:1px solid #d4e5dc;border-radius:14px;padding:15px}.mb-history-card-top{display:flex;justify-content:space-between;gap:10px}.mb-history-card h3{margin:0;color:#174b39;font-size:16px}.mb-history-meta,.mb-history-date{font-size:11px;color:#71877d;margin-top:5px}.mb-history-actions{display:flex;gap:8px;margin-top:13px}.mb-history-empty{max-width:1200px;margin:auto;background:#fff;border:1px dashed #bfd8ca;border-radius:14px;padding:32px;text-align:center;color:#71877d}
.ksl-media-page{box-sizing:border-box}
.ksl-media-page.mb-portrait{width:794px;height:1123px;min-width:794px;min-height:1123px;max-width:794px;max-height:1123px}
.ksl-media-page.mb-landscape{width:1123px;height:794px;min-width:1123px;min-height:794px;max-width:1123px;max-height:794px}

@media(max-width:900px){.mb-shell{grid-template-columns:1fr;height:auto}.mb-controls{border-right:0;border-bottom:1px solid #d4e7dc}.mb-preview-wrap{align-items:flex-start}.ksl-media-page{transform-origin:top left;transform:scale(.72);margin-bottom:-300px}}
@media print{body>*{display:none!important}#kslMediaPrintRoot{display:block!important}.ksl-media-page{box-shadow:none;page-break-after:always;margin:0}.ksl-media-page:last-child{page-break-after:auto}}

/* V6.3.33 FINAL precedence fix — ingredient header/details + cup label nowrap */
.ksl-media-page .mb-drink-table thead th.mb-cup-label,
.mb-template-branch-grid .mb-drink-table thead th.mb-cup-label{
  text-align:center!important;
  color:#0b57d0!important;
  font-size:10px!important;
  font-weight:900!important;
}

/* Ingredient detail rows: restore original left alignment / inherited color and typography */
.ksl-media-page .mb-drink-table tbody td.mb-r-name,
.mb-template-branch-grid .mb-drink-table tbody td.mb-r-name{
  text-align:left!important;
  color:inherit!important;
  font-size:inherit!important;
  font-weight:inherit!important;
  line-height:inherit!important;
}

/* Cup type headers such as M(IB), PP(B) must stay on one line */
.ksl-media-page .mb-drink-table thead th.mb-cup-type,
.mb-template-branch-grid .mb-drink-table thead th.mb-cup-type{
  font-size:7.2px!important;
  line-height:1!important;
  font-weight:900!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:normal!important;
  word-break:normal!important;
  padding-left:1px!important;
  padding-right:1px!important;
}

/* V6.3.34 quantity values stay on one line */
.ksl-media-page .mb-drink-table td.mb-cup-qty,
.mb-template-branch-grid .mb-drink-table td.mb-cup-qty{
  font-size:8.2px!important;
  line-height:1!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:normal!important;
  word-break:normal!important;
  padding-left:1px!important;
  padding-right:1px!important;
  text-align:center!important;
  min-width:0!important;
}
.ksl-media-page .mb-r-qty,
.mb-template-branch-grid .mb-r-qty{
  font-size:8.2px!important;
  line-height:1!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  overflow-wrap:normal!important;
  word-break:normal!important;
  padding-left:1px!important;
  padding-right:1px!important;
  text-align:center!important;
}

/* V6.3.35 A4 auto-fit + Review reorder controls */
.ksl-media-page .mb-equal-rows{
  display:grid!important;
  grid-template-rows:repeat(var(--mb-fit-rows),minmax(0,1fr))!important;
  gap:var(--mb-fit-gap,7px)!important;
  min-height:0!important;
  height:100%!important;
  overflow:hidden!important;
}
.ksl-media-page .mb-equal-row{
  min-height:0!important;
  height:100%!important;
  align-items:stretch!important;
}
.ksl-media-page .mb-equal-row>.mb-card{
  min-height:0!important;
  height:100%!important;
  max-height:100%!important;
  overflow:hidden!important;
}
.ksl-media-page.mb-fit-xl{--mb-fit-gap:10px}
.ksl-media-page.mb-fit-lg{--mb-fit-gap:8px}
.ksl-media-page.mb-fit-md{--mb-fit-gap:7px}
.ksl-media-page.mb-fit-sm{--mb-fit-gap:5px}
.ksl-media-page.mb-fit-xs{--mb-fit-gap:4px}

/* Layout-based sizing only; template choice does not change these values */
.ksl-media-page.mb-fit-xl .mb-black-title{font-size:15px!important;min-height:34px!important}
.ksl-media-page.mb-fit-lg .mb-black-title{font-size:13px!important;min-height:30px!important}
.ksl-media-page.mb-fit-md .mb-black-title{font-size:11.5px!important;min-height:27px!important}
.ksl-media-page.mb-fit-sm .mb-black-title{font-size:10px!important;min-height:23px!important}
.ksl-media-page.mb-fit-xs .mb-black-title{font-size:8.5px!important;min-height:20px!important}

.ksl-media-page.mb-fit-xl .mb-recipe-table td{font-size:10px!important;padding:3px 3px!important}
.ksl-media-page.mb-fit-lg .mb-recipe-table td{font-size:9px!important;padding:2.5px 3px!important}
.ksl-media-page.mb-fit-md .mb-recipe-table td{font-size:8px!important;padding:2px!important}
.ksl-media-page.mb-fit-sm .mb-recipe-table td{font-size:7px!important;padding:1.5px 2px!important}
.ksl-media-page.mb-fit-xs .mb-recipe-table td{font-size:6.3px!important;padding:1px!important}

.ksl-media-page.mb-fit-xl .mb-cup-title{font-size:10px!important}
.ksl-media-page.mb-fit-lg .mb-cup-title{font-size:9px!important}
.ksl-media-page.mb-fit-md .mb-cup-title{font-size:8px!important}
.ksl-media-page.mb-fit-sm .mb-cup-title{font-size:7px!important}
.ksl-media-page.mb-fit-xs .mb-cup-title{font-size:6.3px!important}

.ksl-media-page.mb-fit-xl .mb-drink-table thead th{font-size:8.5px!important}
.ksl-media-page.mb-fit-lg .mb-drink-table thead th{font-size:8px!important}
.ksl-media-page.mb-fit-md .mb-drink-table thead th{font-size:7.3px!important}
.ksl-media-page.mb-fit-sm .mb-drink-table thead th{font-size:6.6px!important}
.ksl-media-page.mb-fit-xs .mb-drink-table thead th{font-size:6px!important}

.ksl-media-page.mb-fit-xl .mb-photo-frame{max-height:88px!important}
.ksl-media-page.mb-fit-lg .mb-photo-frame{max-height:76px!important}
.ksl-media-page.mb-fit-md .mb-photo-frame{max-height:64px!important}
.ksl-media-page.mb-fit-sm .mb-photo-frame{max-height:52px!important}
.ksl-media-page.mb-fit-xs .mb-photo-frame{max-height:42px!important}

.mb-review-tools{
  position:absolute!important;
  top:3px!important;
  right:4px!important;
  z-index:20!important;
  display:flex!important;
  align-items:center!important;
  gap:3px!important;
  padding:2px 3px!important;
  border-radius:7px!important;
  background:rgba(255,255,255,.94)!important;
  box-shadow:0 1px 4px rgba(0,0,0,.18)!important;
}
.mb-card{position:relative!important}
.mb-review-tools button{
  width:22px!important;
  height:22px!important;
  min-width:22px!important;
  padding:0!important;
  border:1px solid #a9cdbd!important;
  border-radius:5px!important;
  background:#fff!important;
  color:#176b4d!important;
  font-size:13px!important;
  line-height:1!important;
  font-weight:900!important;
  cursor:pointer!important;
}
.mb-review-tools button:disabled{opacity:.3!important;cursor:default!important}
.mb-review-tools span{font-size:8px!important;font-weight:900!important;color:#456!important;min-width:13px!important;text-align:center!important}
@media print{
  .mb-review-tools{display:none!important}
}

/* V6.3.36 hide Review reorder arrows */
.mb-review-tools{
  display:none!important;
}

/* V6.3.37 only stretch rows when selected data fills chosen layout */
.ksl-media-page.mb-layout-full .mb-equal-rows{
  display:grid!important;
  grid-template-rows:repeat(var(--mb-fit-rows),minmax(0,1fr))!important;
  height:100%!important;
  align-content:stretch!important;
}
.ksl-media-page.mb-layout-full .mb-equal-row{
  height:100%!important;
  align-items:stretch!important;
}
.ksl-media-page.mb-layout-full .mb-equal-row>.mb-card{
  height:100%!important;
  max-height:100%!important;
  align-self:stretch!important;
}

/* Partial layout: keep natural row/card height; do not expand blank space */
.ksl-media-page.mb-layout-partial .mb-equal-rows{
  display:flex!important;
  flex-direction:column!important;
  height:auto!important;
  min-height:0!important;
  align-content:flex-start!important;
  justify-content:flex-start!important;
  gap:var(--mb-fit-gap,7px)!important;
  overflow:hidden!important;
}
.ksl-media-page.mb-layout-partial .mb-equal-row{
  height:auto!important;
  min-height:0!important;
  align-items:stretch!important;
}
.ksl-media-page.mb-layout-partial .mb-equal-row>.mb-card{
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  align-self:stretch!important;
}

/* V6.3.38 theme-safe text visibility */
.ksl-media-page .mb-card,
.ksl-media-page .mb-table-body,
.ksl-media-page .mb-table-side,
.ksl-media-page .mb-recipe-table,
.ksl-media-page .mb-recipe-table tbody,
.ksl-media-page .mb-recipe-table tr,
.ksl-media-page .mb-recipe-table td,
.ksl-media-page .mb-drink-table thead,
.ksl-media-page .mb-drink-table th,
.ksl-media-page .mb-black-title,
.ksl-media-page .mb-note-line{
  text-overflow:clip!important;
}

/* Never hide recipe text because of a theme */
.ksl-media-page .mb-table-side,
.ksl-media-page .mb-recipe-table,
.ksl-media-page .mb-recipe-table tbody,
.ksl-media-page .mb-recipe-table tr,
.ksl-media-page .mb-recipe-table td,
.ksl-media-page .mb-drink-table th{
  overflow:visible!important;
}

/* Allow content to wrap naturally where needed */
.ksl-media-page .mb-r-name,
.ksl-media-page .mb-r-unit,
.ksl-media-page .mb-cup-unit,
.ksl-media-page .mb-cup-label,
.ksl-media-page .mb-note-line,
.ksl-media-page .mb-black-title{
  white-space:normal!important;
  overflow-wrap:anywhere!important;
  word-break:normal!important;
}

/* Values and cup labels that must stay single-line */
.ksl-media-page .mb-cup-qty,
.ksl-media-page .mb-r-qty,
.ksl-media-page .mb-cup-type{
  white-space:nowrap!important;
  overflow-wrap:normal!important;
  word-break:normal!important;
}

/* Card itself clips only decorative overflow, not inner text */
.ksl-media-page .mb-card{
  overflow:hidden!important;
}
.ksl-media-page .mb-table-side{
  min-width:0!important;
}
.ksl-media-page .mb-recipe-table{
  width:100%!important;
  table-layout:fixed!important;
}

/* Theme decorations may not cover text */
.ksl-media-page .mb-black-title,
.ksl-media-page .mb-table-body,
.ksl-media-page .mb-note-line{
  position:relative!important;
  z-index:2!important;
}


/* V6.3.40 table text visibility — portrait + landscape */
.ksl-media-page .mb-recipe-table tr,
.ksl-media-page .mb-recipe-table td,
.ksl-media-page .mb-drink-table th{
  height:auto!important;
  min-height:0!important;
}
.ksl-media-page .mb-recipe-table td{
  vertical-align:middle!important;
  text-overflow:clip!important;
}
.ksl-media-page .mb-r-name,
.ksl-media-page .mb-r-unit,
.ksl-media-page .mb-cup-unit,
.ksl-media-page .mb-note-line{
  white-space:normal!important;
  overflow:visible!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
  line-height:1.2!important;
}
.ksl-media-page .mb-cup-label{
  white-space:normal!important;
  overflow:visible!important;
  overflow-wrap:anywhere!important;
  line-height:1.1!important;
}
.ksl-media-page .mb-cup-type,
.ksl-media-page .mb-cup-qty,
.ksl-media-page .mb-r-qty{
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
}
.ksl-media-page .mb-table-body,
.ksl-media-page .mb-table-side,
.ksl-media-page .mb-recipe-table,
.ksl-media-page .mb-recipe-table tbody,
.ksl-media-page .mb-recipe-table tr{
  min-height:0!important;
  max-height:none!important;
}

/* Do not use clipping as a way to fit table content. Auto-fit classes below
   reduce typography first so every value remains readable inside A4. */
.ksl-media-page .mb-card{
  text-overflow:clip!important;
}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-recipe-table td{font-size:6.4px!important;padding:1px 1.5px!important;line-height:1.08!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-drink-table thead th{font-size:5.8px!important;padding:1px!important;line-height:1!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-cup-type{font-size:5.8px!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-cup-qty,
.ksl-media-page .mb-card.mb-table-fit-tight .mb-r-qty{font-size:6.4px!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-note-line{font-size:5.8px!important;padding:1px 2px!important;line-height:1.08!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-black-title{font-size:8px!important;min-height:18px!important;padding:2px 3px!important}

.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-recipe-table td{font-size:5.3px!important;padding:.5px 1px!important;line-height:1.03!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-drink-table thead th{font-size:4.9px!important;padding:.5px!important;line-height:1!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-cup-type{font-size:4.9px!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-cup-qty,
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-r-qty{font-size:5.3px!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-note-line{font-size:4.9px!important;padding:.5px 1px!important;line-height:1.02!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-black-title{font-size:7px!important;min-height:16px!important;padding:1px 2px!important}

/* Last safety level for very dense 16–20 item A4 layouts. */
.ksl-media-page .mb-card.mb-table-fit-max .mb-recipe-table td{font-size:4.6px!important;padding:0 1px!important;line-height:1!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-drink-table thead th{font-size:4.3px!important;padding:0 1px!important;line-height:1!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-cup-type{font-size:4.3px!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-cup-qty,
.ksl-media-page .mb-card.mb-table-fit-max .mb-r-qty{font-size:4.6px!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-note-line{font-size:4.3px!important;padding:0 1px!important;line-height:1!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-black-title{font-size:6.2px!important;min-height:14px!important;padding:1px!important}


/* V6.3.41 larger readable table typography */
.ksl-media-page.mb-fit-xl .mb-recipe-table td{font-size:12px!important;line-height:1.25!important}
.ksl-media-page.mb-fit-lg .mb-recipe-table td{font-size:11px!important;line-height:1.23!important}
.ksl-media-page.mb-fit-md .mb-recipe-table td{font-size:10px!important;line-height:1.20!important}
.ksl-media-page.mb-fit-sm .mb-recipe-table td{font-size:9px!important;line-height:1.16!important}
.ksl-media-page.mb-fit-xs .mb-recipe-table td{font-size:8px!important;line-height:1.12!important}
.ksl-media-page.mb-fit-xl .mb-drink-table thead th{font-size:10.5px!important}
.ksl-media-page.mb-fit-lg .mb-drink-table thead th{font-size:9.8px!important}
.ksl-media-page.mb-fit-md .mb-drink-table thead th{font-size:9px!important}
.ksl-media-page.mb-fit-sm .mb-drink-table thead th{font-size:8.2px!important}
.ksl-media-page.mb-fit-xs .mb-drink-table thead th{font-size:7.4px!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-recipe-table td{font-size:8px!important}
.ksl-media-page .mb-card.mb-table-fit-tight .mb-drink-table thead th{font-size:7.4px!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-recipe-table td{font-size:7px!important}
.ksl-media-page .mb-card.mb-table-fit-x-tight .mb-drink-table thead th{font-size:6.5px!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-recipe-table td{font-size:6.2px!important}
.ksl-media-page .mb-card.mb-table-fit-max .mb-drink-table thead th{font-size:5.8px!important}

/* V6.3.39 free drag-and-drop reorder in Review */
.mb-review-draggable{
  cursor:grab!important;
  user-select:none!important;
}
.mb-review-draggable:active{
  cursor:grabbing!important;
}
.mb-review-draggable.mb-dragging{
  opacity:.45!important;
}
.mb-review-draggable.mb-drop-target{
  outline:3px dashed var(--mb-theme-accent,#176b4d)!important;
  outline-offset:-3px!important;
}
`;

function ensureStyles(){if(document.getElementById('kslMediaCss'))return;const s=document.createElement('style');s.id='kslMediaCss';s.textContent=CSS;document.head.appendChild(s)}

function renderControls(){
  const items=sourceItems();
  cleanSelection();
  const q=search.toLowerCase();
  const filtered=items.filter(x=>!q||(x.name+' '+x.en).toLowerCase().includes(q));
  const list=document.getElementById('kslMediaItemList');
  if(list)list.innerHTML=filtered.length?filtered.map(x=>{
    const checked=draft.selected.includes(x.id)?'checked':'';
    return '<label class="mb-check"><input type="checkbox" data-mb-item="'+esc(x.id)+'" '+checked+'><span><b>'+esc(x.name)+'</b>'+(x.en?'<small>'+esc(x.en)+'</small>':'')+'<small>'+x.rows.length+' รายการข้อมูล</small></span></label>';
  }).join(''):'<div class="mb-note" style="padding:10px">ไม่พบข้อมูล</div>';
  const count=document.getElementById('kslMediaSelectedCount');if(count)count.textContent=draft.selected.length+' เมนูที่เลือก';
  const imgSel=document.getElementById('kslMediaImageTarget');
  if(imgSel){
    const sels=selectedItems();if(!targetImage||!sels.some(x=>x.id===targetImage))targetImage=sels[0]?.id||'';
    imgSel.innerHTML=sels.length?sels.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===targetImage?'selected':'')+'>'+esc(x.name)+'</option>').join(''):'<option value="">เลือกเมนูก่อน</option>';
  }
  const editSel=document.getElementById('kslMediaEditTarget');
  if(editSel){
    const sels=selectedItems();
    const current=editSel.value&&sels.some(x=>x.id===editSel.value)?editSel.value:(targetImage||sels[0]?.id||'');
    editSel.innerHTML=sels.length?sels.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===current?'selected':'')+'>'+esc(x.name)+'</option>').join(''):'<option value="">เลือกเมนูก่อน</option>';
  }
  renderSavedProjects();
  renderMediaEditor();
  renderImageThumb();
}
function editorItem(){
  const id=document.getElementById('kslMediaEditTarget')?.value||'';
  return selectedItems().find(x=>x.id===id)||null;
}
function renderMediaEditor(){
  const box=document.getElementById('kslMediaEditor');if(!box)return;
  const item=editorItem();if(!item){box.innerHTML='<div class="mb-note">เลือกเมนูที่ต้องการแก้ไขก่อน</div>';return}
  const o=effectiveOverride(item),headers=(o.headers||[]).join(', ');
  box.innerHTML='<div class="mb-field"><label>ชื่อที่แสดง</label><input class="mb-input" id="mbEditTitle" value="'+esc(o.title||item.name)+'"></div>'+
    (draft.type==='drink'?'<div class="mb-field"><label>ประเภทแก้ว (คั่นด้วย ,)</label><input class="mb-input" id="mbEditHeaders" value="'+esc(headers)+'"></div>':'')+
    '<div class="mb-edit-list" id="mbEditRows">'+(o.rows||[]).map((r,i)=>editRowHtml(r,i)).join('')+'</div>'+
    '<button class="mb-link" id="mbAddDetail" type="button">＋ เพิ่มรายละเอียด</button>'+
    '<div class="mb-field"><label>หมายเหตุ</label><textarea class="mb-input" id="mbEditNote" rows="2">'+esc(o.note||'')+'</textarea></div>';
}
function editRowHtml(r,i){
  const vals=Array.isArray(r.values)?r.values.join(' | '):text(r.value);
  return '<div class="mb-edit-row" data-edit-row="'+i+'">'+
    '<div class="mb-row-move"><button class="mb-link mb-er-up" type="button" title="เลื่อนขึ้น">↑</button><button class="mb-link mb-er-down" type="button" title="เลื่อนลง">↓</button></div>'+
    '<input class="mb-input mb-er-label" value="'+esc(r.label||'')+'" placeholder="รายละเอียด / วัตถุดิบ">'+
    '<input class="mb-input mb-er-value" value="'+esc(vals)+'" placeholder="'+(draft.type==='drink'?'ค่าตามประเภทแก้ว คั่นด้วย |':'ค่า / ปริมาณ')+'">'+
    '<input class="mb-input mb-er-unit" value="'+esc(r.unit||'')+'" placeholder="หน่วย / ข้อมูลเสริม">'+
    '<button class="mb-link mb-er-del" type="button">ลบ</button></div>';
}
function collectEditorOverride(){
  const item=editorItem();if(!item)return null;
  const title=text(document.getElementById('mbEditTitle')?.value)||item.name;
  const headers=draft.type==='drink'?text(document.getElementById('mbEditHeaders')?.value).split(',').map(text).filter(Boolean):(effectiveOverride(item).headers||[]);
  const rows=[...document.querySelectorAll('#mbEditRows .mb-edit-row')].map(el=>({
    label:text(el.querySelector('.mb-er-label')?.value),
    values:text(el.querySelector('.mb-er-value')?.value).split('|').map(text),
    unit:text(el.querySelector('.mb-er-unit')?.value)
  })).filter(r=>r.label||r.values.some(Boolean)||r.unit);
  return {title,headers,rows,note:text(document.getElementById('mbEditNote')?.value)};
}
let editSaveTimer=null;
function scheduleEditorSave(){
  clearTimeout(editSaveTimer);
  editSaveTimer=setTimeout(async()=>{
    const item=editorItem(),o=collectEditorOverride();if(!item||!o)return;
    await persistOverrideAuto(item.id,o);
    renderPreview();
  },450);
}

function renderImageThumb(){
  const box=document.getElementById('kslMediaImageThumb');if(!box)return;
  const src=targetImage?imageFor(targetImage):'';
  box.innerHTML=src?'<img src="'+src+'" alt="">':'<span class="mb-note">ยังไม่มีรูปประกอบ</span>';
}
function moveReviewItem(from,to){
  const a=Number(from),b=Number(to);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=draft.selected.length||b>=draft.selected.length||a===b)return;
  const next=[...draft.selected];
  const [id]=next.splice(a,1);
  next.splice(b,0,id);
  draft.selected=next;
  renderControls();
  renderPreview();
  persistDraft(true);
  setSaveStatus('ปรับลำดับ Review และบันทึกแล้ว ✓');
}
function decorateReviewControls(){
  const wrap=document.getElementById('kslMediaPreview');if(!wrap)return;
  const cards=[...wrap.querySelectorAll('.ksl-media-page .mb-card')];
  cards.forEach((card,i)=>{
    card.dataset.reviewIndex=String(i);
    card.draggable=true;
    card.classList.add('mb-review-draggable');
  });
}
function fitVisibleTableText(root=document.getElementById('kslMediaPreview')){
  if(!root)return;
  const cards=[...root.querySelectorAll('.ksl-media-page .mb-card')];
  const levels=['mb-table-fit-tight','mb-table-fit-x-tight','mb-table-fit-max'];
  const overflowing=card=>{
    const page=card.closest('.ksl-media-page');
    const cardOverflow=card.scrollHeight>card.clientHeight+1 || card.scrollWidth>card.clientWidth+1;
    const table=card.querySelector('.mb-table-side');
    const tableOverflow=table&&(table.scrollHeight>table.clientHeight+1 || table.scrollWidth>table.clientWidth+1);
    const pageBottom=page?card.getBoundingClientRect().bottom-page.getBoundingClientRect().bottom:0;
    return cardOverflow||tableOverflow||pageBottom>1;
  };
  cards.forEach(card=>{
    card.classList.remove(...levels);
    // Only compress when content actually exceeds its allocated card/page area.
    for(const level of levels){
      if(!overflowing(card))break;
      card.classList.add(level);
      // Force layout before checking the next level.
      void card.offsetHeight;
    }
  });
}

function renderPreview(){
  const wrap=document.getElementById('kslMediaPreview');if(!wrap)return;
  wrap.innerHTML=previewHtml();
  decorateReviewControls();
  fitVisibleTableText(wrap);
  requestAnimationFrame(()=>fitVisibleTableText(wrap));
  const pages=wrap.querySelectorAll('.ksl-media-page').length;
  const badge=document.getElementById('kslMediaPageCount');if(badge)badge.textContent=pages+' หน้า A4';
}

let reviewDragIndex=null;
function reorderSelectedByDrag(from,to){
  const a=Number(from),b=Number(to);
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=draft.selected.length||b>=draft.selected.length||a===b)return;
  const next=[...draft.selected];
  const [id]=next.splice(a,1);
  next.splice(b,0,id);
  draft.selected=next;
  renderControls();
  renderPreview();
  persistDraft(true);
  setSaveStatus('ย้ายลำดับเมนูและบันทึกแล้ว ✓');
}
function syncUI(){
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v};
  set('kslMediaType',draft.type);set('kslMediaTemplate',draft.template);set('kslMediaOrientation',draft.orientation);
  set('kslMediaPerPage',String(draft.perPage));set('kslMediaTheme',String(draft.theme||'1'));set('kslMediaBgRemovalMode',String(draft.bgRemovalMode||'detail'));set('kslMediaTitle',draft.title);set('kslMediaSubtitle',draft.subtitle);
  renderControls();renderPreview();persistDraft();
}
function onTypeChange(v){draft.type=v;draft.selected=[];draft.images={};targetImage='';draft.title='';search='';const q=document.getElementById('kslMediaSearch');if(q)q.value='';syncUI()}

const BG_REMOVE_MODULE='https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
let bgRemoveModulePromise=null;
async function getBackgroundRemover(){
  if(!bgRemoveModulePromise){
    bgRemoveModulePromise=import(BG_REMOVE_MODULE).then(mod=>({
      removeBackground:mod.removeBackground||mod.default,
      segmentForeground:mod.segmentForeground||mod.alphamask||null
    })).catch(err=>{
      bgRemoveModulePromise=null;
      throw err;
    });
  }
  return bgRemoveModulePromise;
}
async function imageSourceFromFile(file){
  const url=URL.createObjectURL(file);
  try{
    return await new Promise((ok,fail)=>{
      const im=new Image();
      im.onload=()=>ok(im);
      im.onerror=()=>fail(new Error('อ่านรูปไม่สำเร็จ'));
      im.src=url;
    });
  }finally{
    // The decoded image stays usable after load; release the temporary object URL.
    setTimeout(()=>URL.revokeObjectURL(url),0);
  }
}
function sampleCornerBackground(img){
  try{
    const s=document.createElement('canvas');s.width=32;s.height=32;
    const x=s.getContext('2d',{alpha:false});x.drawImage(img,0,0,32,32);
    const d=x.getImageData(0,0,32,32).data;
    const zones=[[0,0],[27,0],[0,27],[27,27]];
    let r=0,g=0,b=0,n=0;
    for(const [sx,sy] of zones){
      for(let yy=0;yy<5;yy++)for(let xx=0;xx<5;xx++){
        const i=((sy+yy)*32+(sx+xx))*4;
        r+=d[i];g+=d[i+1];b+=d[i+2];n++;
      }
    }
    return [Math.round(r/n),Math.round(g/n),Math.round(b/n)];
  }catch(_){return [248,248,248]}
}
async function prepareImageForRemoval(file,mode='detail'){
  const img=await imageSourceFromFile(file);
  const detailed=mode==='detail';
  const maxSide=detailed?1800:1400;
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
  const sw=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
  const sh=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
  const pad=Math.max(18,Math.round(Math.max(sw,sh)*(detailed?0.10:0.04)));
  const canvas=document.createElement('canvas');canvas.width=sw+pad*2;canvas.height=sh+pad*2;
  const ctx=canvas.getContext('2d',{alpha:false});
  const [r,g,b]=sampleCornerBackground(img);
  ctx.fillStyle='rgb('+r+','+g+','+b+')';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,pad,pad,sw,sh);
  return await new Promise((resolve,reject)=>canvas.toBlob(
    b=>b?resolve(b):reject(new Error('เตรียมรูปสำหรับลบพื้นหลังไม่สำเร็จ')),
    'image/png',1
  ));
}
function refineTransparentCanvas(canvas,mode='detail'){
  const ctx=canvas.getContext('2d',{alpha:true}),w=canvas.width,h=canvas.height;
  if(!w||!h)return canvas;
  const im=ctx.getImageData(0,0,w,h),d=im.data;
  const srcA=new Uint8ClampedArray(w*h);
  for(let i=0,p=0;i<d.length;i+=4,p++)srcA[p]=d[i+3];

  if(mode==='detail'){
    // Two conservative morphology passes. They close tiny holes and keep thin,
    // connected garnish/topping details without growing a visible halo.
    let current=srcA;
    for(let pass=0;pass<2;pass++){
      const next=new Uint8ClampedArray(current);
      for(let y=1;y<h-1;y++){
        for(let x=1;x<w-1;x++){
          const p=y*w+x,a=current[p];
          let maxA=0,sum=0,strong=0,visible=0;
          for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){
            const v=current[(y+yy)*w+(x+xx)];
            if(v>maxA)maxA=v;sum+=v;
            if(v>215)strong++;
            if(v>28)visible++;
          }
          const avg=sum/9;
          if(a===0&&strong>=4&&maxA>235)next[p]=14;
          else if(a<36&&visible>=4&&maxA>150)next[p]=Math.max(a,Math.min(72,Math.round(maxA*0.26)));
          else if(a>=36&&a<245)next[p]=Math.max(a,Math.min(248,Math.round(a*0.72+avg*0.38)));
        }
      }
      current=next;
    }
    for(let p=0,i=0;p<current.length;p++,i+=4)d[i+3]=current[p]<5?0:(current[p]>249?255:current[p]);
  }else{
    for(let p=0,i=0;p<srcA.length;p++,i+=4)d[i+3]=srcA[p]<7?0:(srcA[p]>248?255:srcA[p]);
  }

  // Edge colour decontamination: semi-transparent pixels borrow colour from
  // nearby opaque foreground, reducing white/bright fringes after compositing.
  const alpha=new Uint8ClampedArray(w*h);
  for(let i=0,p=0;i<d.length;i+=4,p++)alpha[p]=d[i+3];
  for(let y=2;y<h-2;y++){
    for(let x=2;x<w-2;x++){
      const p=y*w+x,a=alpha[p];
      if(a<8||a>246)continue;
      let rr=0,gg=0,bb=0,n=0;
      for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){
        const q=(y+yy)*w+(x+xx);
        if(alpha[q]>235){
          const qi=q*4;rr+=d[qi];gg+=d[qi+1];bb+=d[qi+2];n++;
        }
      }
      if(n){
        const i=p*4,f=(1-a/255)*(mode==='detail'?0.58:0.38);
        d[i]=Math.round(d[i]*(1-f)+(rr/n)*f);
        d[i+1]=Math.round(d[i+1]*(1-f)+(gg/n)*f);
        d[i+2]=Math.round(d[i+2]*(1-f)+(bb/n)*f);
      }
    }
  }
  ctx.putImageData(im,0,0);
  return canvas;
}
function cropTransparentCanvas(canvas,mode='detail'){
  const ctx=canvas.getContext('2d',{alpha:true}),w=canvas.width,h=canvas.height;
  const d=ctx.getImageData(0,0,w,h).data;
  let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(d[(y*w+x)*4+3]>7){
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
  }
  if(maxX<minX||maxY<minY)return canvas;
  const safe=Math.max(8,Math.round(Math.max(w,h)*(mode==='detail'?0.035:0.02)));
  minX=Math.max(0,minX-safe);minY=Math.max(0,minY-safe);
  maxX=Math.min(w-1,maxX+safe);maxY=Math.min(h-1,maxY+safe);
  const cw=maxX-minX+1,ch=maxY-minY+1;
  const out=document.createElement('canvas');out.width=cw;out.height=ch;
  const o=out.getContext('2d',{alpha:true});o.clearRect(0,0,cw,ch);o.drawImage(canvas,minX,minY,cw,ch,0,0,cw,ch);
  return out;
}
async function transparentBlobToDataURL(blob,mode='detail'){
  const url=URL.createObjectURL(blob);
  try{
    const img=await new Promise((ok,fail)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=fail;im.src=url});
    let canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    let ctx=canvas.getContext('2d',{alpha:true});ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);
    canvas=refineTransparentCanvas(canvas,mode);
    canvas=cropTransparentCanvas(canvas,mode);

    const scale=Math.min(1,MAX_IMG/Math.max(canvas.width,canvas.height));
    if(scale<1){
      const out=document.createElement('canvas');
      out.width=Math.max(1,Math.round(canvas.width*scale));out.height=Math.max(1,Math.round(canvas.height*scale));
      const o=out.getContext('2d',{alpha:true});o.clearRect(0,0,out.width,out.height);
      o.imageSmoothingEnabled=true;o.imageSmoothingQuality='high';o.drawImage(canvas,0,0,out.width,out.height);
      canvas=out;
    }
    return canvas.toDataURL('image/png');
  }finally{URL.revokeObjectURL(url)}
}
async function compressImage(file,mode=draft.bgRemovalMode||'detail'){
  const detailed=mode==='detail';
  setSaveStatus(detailed?'กำลังเตรียมรูปและเพิ่มพื้นที่ปลอดภัยรอบวัตถุ...':'กำลังโหลดระบบลบพื้นหลัง...');
  const prepared=await prepareImageForRemoval(file,mode);
  const bg=await getBackgroundRemover();
  if(typeof bg.removeBackground!=='function')throw new Error('ไม่พบระบบลบพื้นหลัง');
  const progress=(key,current,total)=>{
    if(!total)return;
    const pct=Math.max(0,Math.min(100,Math.round((current/total)*100)));
    if(key&&/model|wasm|onnx|asset|compute/i.test(String(key))){
      setSaveStatus((detailed?'AI กำลังรักษาแก้วและวัตถุประกอบ ':'AI กำลังลบพื้นหลัง ')+pct+'%');
    }
  };
  setSaveStatus(detailed?'กำลังตรวจจับ Product Composition ทั้งแก้ว ผลไม้ Topping และ Decoration...':'กำลังตรวจจับสินค้า...');
  let result;
  try{
    result=await bg.removeBackground(prepared,{
      model:detailed?'large':'medium',
      proxyToWorker:true,
      output:{format:'image/png',quality:1},
      progress
    });
  }catch(err){
    console.warn('[KSL Media] background model fallback',err);
    setSaveStatus('กำลังใช้โมเดลสำรองคุณภาพสูง...');
    result=await bg.removeBackground(prepared,{
      model:'medium',
      proxyToWorker:true,
      output:{format:'image/png',quality:1},
      progress
    });
  }
  setSaveStatus(detailed?'กำลังเก็บวัตถุเล็ก ปรับขอบแก้ว และล้างขอบสีขาว...':'กำลังปรับขอบรูป...');
  return transparentBlobToDataURL(result,mode);
}

function builderHtml(){
 return '<div id="kslMediaOverlay">'+
 '<div class="mb-topbar"><div><h2>🎨 สร้างสื่อการสอน</h2><small id="kslMediaSaveState">บันทึกอัตโนมัติ ✓</small></div>'+
 '<div class="mb-actions"><span class="mb-count" id="kslMediaPageCount">1 หน้า A4</span><button class="mb-btn" id="kslMediaHistory">🕘 ประวัติการบันทึก</button><button class="mb-btn primary" id="kslMediaSaveNew">＋ บันทึกงานใหม่</button><button class="mb-btn" id="kslMediaSaveOverwrite">💾 บันทึกทับงานเดิม</button><button class="mb-btn" id="kslMediaPrint">📄 PDF / Print</button><button class="mb-btn" id="kslMediaJpg">🖼 JPG</button><button class="mb-btn" id="kslMediaPng">PNG</button><button class="mb-btn danger" id="kslMediaClose">✕ ปิด</button></div></div>'+
 '<div class="mb-shell"><aside class="mb-controls">'+
 '<div class="mb-block"><h3>1. ประเภทสื่อ</h3><div class="mb-field"><select class="mb-select" id="kslMediaType"><option value="drink">🧋 สูตรการชงเครื่องดื่ม</option><option value="production">🧑‍🍳 สูตรการผลิต</option><option value="holding">⏳ ตารางวันหมดอายุ</option></select></div>'+
 '<div class="mb-inline"><div class="mb-field"><label>Template</label><select class="mb-select" id="kslMediaTemplate"><option value="branch-grid">01 Branch Grid</option><option value="modern">02 KAMU Modern</option><option value="visual">03 Visual Training</option><option value="compact">04 Compact SOP</option><option value="clean">05 Clean White</option><option value="outline">06 Bold Outline</option><option value="soft">07 Soft Card</option><option value="stripe">08 Header Stripe</option><option value="double">09 Double Border</option><option value="rounded">10 Rounded Card</option><option value="square">11 Square Grid</option><option value="minimal">12 Minimal Line</option><option value="classic">13 Classic SOP</option><option value="poster">14 Poster Header</option><option value="label">15 Label Style</option><option value="shadow">16 Soft Shadow</option><option value="frame">17 Framed</option><option value="topline">18 Top Line</option><option value="bottomline">19 Bottom Line</option><option value="leftline">20 Left Accent</option><option value="rightline">21 Right Accent</option><option value="capsule">22 Capsule Header</option><option value="ticket">23 Ticket Card</option><option value="notebook">24 Notebook</option><option value="gridlight">25 Light Grid</option><option value="boldbar">26 Bold Bar</option><option value="split">27 Split Header</option><option value="simple">28 Simple Office</option><option value="training">29 Training Board</option><option value="premium">30 Premium Frame</option></select></div><div class="mb-field"><label>แนวกระดาษ</label><select class="mb-select" id="kslMediaOrientation"><option value="portrait">A4 แนวตั้ง</option><option value="landscape">A4 แนวนอน</option></select></div></div>'+
 '<div class="mb-field"><label>สีสำหรับ Preview / Export (30 สี)</label><select class="mb-select" id="kslMediaTheme"><option value="1">01 KAMU Green</option><option value="2">02 Classic Black</option><option value="3">03 Matcha</option><option value="4">04 Mint</option><option value="5">05 Forest</option><option value="6">06 Cream</option><option value="7">07 Latte</option><option value="8">08 Taro</option><option value="9">09 Thai Tea</option><option value="10">10 Sky</option><option value="11">11 Navy</option><option value="12">12 Rose</option><option value="13">13 Sakura</option><option value="14">14 Minimal Gray</option><option value="15">15 High Contrast</option><option value="16">16 Emerald</option><option value="17">17 Lime</option><option value="18">18 Olive</option><option value="19">19 Teal</option><option value="20">20 Cyan</option><option value="21">21 Royal Blue</option><option value="22">22 Indigo</option><option value="23">23 Violet</option><option value="24">24 Plum</option><option value="25">25 Magenta</option><option value="26">26 Coral</option><option value="27">27 Red</option><option value="28">28 Amber</option><option value="29">29 Chocolate</option><option value="30">30 Slate</option></select></div><div class="mb-field"><label>จำนวนเมนูต่อ A4 (สูงสุด 20)</label><select class="mb-select" id="kslMediaPerPage"><option value="1">1 เมนู</option><option value="2">2 เมนู</option><option value="3">3 เมนู</option><option value="4">4 เมนู</option><option value="5">5 เมนู</option><option value="6">6 เมนู</option><option value="7">7 เมนู</option><option value="8">8 เมนู</option><option value="9">9 เมนู</option><option value="10">10 เมนู</option><option value="11">11 เมนู</option><option value="12">12 เมนู</option><option value="13">13 เมนู</option><option value="14">14 เมนู</option><option value="15">15 เมนู</option><option value="16">16 เมนู</option><option value="17">17 เมนู</option><option value="18">18 เมนู</option><option value="19">19 เมนู</option><option value="20">20 เมนู</option></select><div class="mb-note">แนวตั้งแสดงสูงสุด 20 เมนูต่อหน้าแบบ 2×10 • แนวนอนเลือกได้สูงสุด 20 เมนู • ถ้าเกินจะสร้างหน้าถัดไปอัตโนมัติ</div></div></div>'+
 '<div class="mb-block"><h3>2. เลือกเมนูจากฐานข้อมูล <span class="mb-count" id="kslMediaSelectedCount">0 เมนู</span></h3><div class="mb-field"><input class="mb-input" id="kslMediaSearch" placeholder="ค้นหาเมนู..."></div><div class="mb-list-tools"><button class="mb-link" id="kslMediaSelectAll">เลือกทั้งหมดที่ค้นหา</button><button class="mb-link" id="kslMediaClearSel">ล้างการเลือก</button></div><div id="kslMediaItemList"></div></div>'+
 '<div class="mb-block"><h3>3. หัวเรื่อง</h3><div class="mb-field"><label>หัวเรื่องหลัก</label><input class="mb-input" id="kslMediaTitle" placeholder="ใช้ชื่อประเภทสื่ออัตโนมัติ"></div><div class="mb-field"><label>ข้อความรอง</label><input class="mb-input" id="kslMediaSubtitle" placeholder="เช่น สำหรับพนักงานใหม่ / Updated..."></div></div>'+
 '<div class="mb-block"><h3>4. งานที่บันทึกไว้</h3><div class="mb-field"><select class="mb-select" id="kslMediaSavedProjects"></select></div><div class="mb-list-tools"><button class="mb-link" id="kslMediaLoadProject" type="button">เปิดแก้ไข</button><button class="mb-link" id="kslMediaDeleteProject" type="button">ลบงาน</button></div><div class="mb-note">เปิดงานเดิมแล้วสามารถเพิ่ม/ลดเมนู แก้รายละเอียด เปลี่ยนรูป แล้วกด “บันทึกทับงานเดิม” • หากต้องการแยกเป็นอีกงานให้กด “บันทึกงานใหม่”</div></div>'+ 
 '<div class="mb-block"><h3>5. แก้ไขข้อมูลรายเมนู</h3><div class="mb-field"><label>เมนูที่จะแก้ไข</label><select class="mb-select" id="kslMediaEditTarget"></select></div><div id="kslMediaEditor"></div><div class="mb-note">แก้ไขแล้ว Auto Save เข้า Online Database • ไม่เปลี่ยนฐานสูตรต้นฉบับที่ Upload</div></div>'+ 
 '<div class="mb-block"><h3>6. รูปประกอบ</h3><div class="mb-field"><label>เมนูที่จะใส่รูป</label><select class="mb-select" id="kslMediaImageTarget"></select></div><div class="mb-field"><label>โหมดลบพื้นหลัง</label><select class="mb-select" id="kslMediaBgRemovalMode"><option value="detail">ละเอียด / เก็บวัตถุข้างแก้ว</option><option value="standard">มาตรฐาน / เร็วขึ้น</option></select></div><div class="mb-image-row"><button class="mb-btn" id="kslMediaChooseImage">＋ เพิ่ม/เปลี่ยนรูป</button><button class="mb-btn danger" id="kslMediaRemoveImage">ลบรูป</button><input type="file" id="kslMediaImageInput" accept="image/*" hidden></div><div class="mb-thumb" id="kslMediaImageThumb"></div><div class="mb-note">โหมดละเอียดจะเพิ่ม Padding ก่อน AI, รักษาผลไม้/Topping/Packaging รอบแก้ว, ปรับ Alpha และลดขอบขาว • บันทึกเป็น PNG โปร่งใส • Auto Save และ Upload รูปใหม่เมนูเดิมจะทับรูปเดิม</div></div>'+
 '</aside><main class="mb-preview-wrap" id="kslMediaPreview"></main></div>'+
 '<section id="kslMediaHistoryPage"><div class="mb-history-head"><div><div class="mb-kamu">KAMU KAMU • MEDIA</div><h2>ประวัติการบันทึกสื่อ</h2><p>เรียกงานเดิมกลับมาแก้ไข เพิ่ม/ลดรายการ เปลี่ยนรูป Theme และบันทึกทับได้</p></div><button class="mb-btn" id="kslMediaHistoryClose">← กลับหน้าสร้างสื่อ</button></div><div id="kslMediaHistoryList"></div></section></div>';
}

function installBuilder(){
  ensureStyles();
  if(!document.getElementById('kslMediaOverlay'))document.body.insertAdjacentHTML('beforeend',builderHtml());
  const ov=document.getElementById('kslMediaOverlay');if(ov.dataset.bound)return;ov.dataset.bound='1';

  const bind=(id,ev,fn)=>document.getElementById(id)?.addEventListener(ev,fn);
  bind('kslMediaClose','click',()=>ov.classList.remove('show'));
  bind('kslMediaHistory','click',openHistoryPage);
  bind('kslMediaHistoryClose','click',closeHistoryPage);
  bind('kslMediaHistoryList','click',async e=>{
    const card=e.target.closest('[data-history-id]');if(!card)return;
    const id=card.dataset.historyId;
    if(e.target.closest('.mb-history-open')){
      loadSavedProject(id);
      closeHistoryPage();
      return;
    }
    if(e.target.closest('.mb-history-copy')){
      loadSavedProject(id);
      closeHistoryPage();
      setTimeout(()=>saveProjectNew(),50);
      return;
    }
    if(e.target.closest('.mb-history-delete')){
      if(confirm('ลบประวัติงานนี้หรือไม่?')){
        await deleteSavedProject(id);
        renderHistoryPage();
      }
    }
  });
  bind('kslMediaType','change',e=>onTypeChange(e.target.value));
  bind('kslMediaTemplate','change',e=>{draft.template=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaTheme','change',e=>{draft.theme=e.target.value;renderPreview();persistDraft(true)});
  bind('kslMediaOrientation','change',e=>{draft.orientation=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaPerPage','change',e=>{draft.perPage=Math.min(20,Math.max(1,Number(e.target.value)||4));renderPreview();persistDraft()});
  bind('kslMediaTitle','input',e=>{draft.title=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaSubtitle','input',e=>{draft.subtitle=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaSearch','input',e=>{search=e.target.value;renderControls()});
  bind('kslMediaItemList','change',e=>{const cb=e.target.closest('[data-mb-item]');if(!cb)return;const id=cb.dataset.mbItem;if(cb.checked&&!draft.selected.includes(id))draft.selected.push(id);if(!cb.checked)draft.selected=draft.selected.filter(x=>x!==id);renderControls();renderPreview();persistDraft()});
  bind('kslMediaPreview','dragstart',e=>{
    const card=e.target.closest('.mb-review-draggable');if(!card)return;
    reviewDragIndex=Number(card.dataset.reviewIndex);
    card.classList.add('mb-dragging');
    try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(reviewDragIndex))}catch(_){}
  });
  bind('kslMediaPreview','dragover',e=>{
    const card=e.target.closest('.mb-review-draggable');if(!card||reviewDragIndex===null)return;
    e.preventDefault();
    try{e.dataTransfer.dropEffect='move'}catch(_){}
    document.querySelectorAll('#kslMediaPreview .mb-drop-target').forEach(x=>x.classList.remove('mb-drop-target'));
    card.classList.add('mb-drop-target');
  });
  bind('kslMediaPreview','drop',e=>{
    const card=e.target.closest('.mb-review-draggable');if(!card||reviewDragIndex===null)return;
    e.preventDefault();
    const to=Number(card.dataset.reviewIndex),from=reviewDragIndex;
    reviewDragIndex=null;
    document.querySelectorAll('#kslMediaPreview .mb-dragging,#kslMediaPreview .mb-drop-target').forEach(x=>x.classList.remove('mb-dragging','mb-drop-target'));
    reorderSelectedByDrag(from,to);
  });
  bind('kslMediaPreview','dragend',()=>{
    reviewDragIndex=null;
    document.querySelectorAll('#kslMediaPreview .mb-dragging,#kslMediaPreview .mb-drop-target').forEach(x=>x.classList.remove('mb-dragging','mb-drop-target'));
  });

  bind('kslMediaSelectAll','click',()=>{const q=search.toLowerCase();sourceItems().filter(x=>!q||(x.name+' '+x.en).toLowerCase().includes(q)).forEach(x=>{if(!draft.selected.includes(x.id))draft.selected.push(x.id)});renderControls();renderPreview();persistDraft()});
  bind('kslMediaClearSel','click',()=>{draft.selected=[];targetImage='';renderControls();renderPreview();persistDraft()});
  bind('kslMediaLoadProject','click',()=>{
    const id=document.getElementById('kslMediaSavedProjects')?.value;if(id)loadSavedProject(id);
  });
  bind('kslMediaDeleteProject','click',async()=>{
    const id=document.getElementById('kslMediaSavedProjects')?.value;if(id&&confirm('ลบงานที่บันทึกนี้หรือไม่?'))await deleteSavedProject(id);
  });
  bind('kslMediaEditTarget','change',()=>renderMediaEditor());
  bind('kslMediaEditor','input',()=>scheduleEditorSave());
  bind('kslMediaEditor','click',e=>{
    if(e.target?.id==='mbAddDetail'){
      const item=editorItem();if(!item)return;
      const o=collectEditorOverride()||effectiveOverride(item);
      o.rows=o.rows||[];o.rows.push({label:'',values:[''],unit:''});
      draft.overrides[item.id]=clone(o);renderMediaEditor();scheduleEditorSave();return;
    }
    const row=e.target.closest('.mb-edit-row');
    if(e.target.closest('.mb-er-up')&&row){
      const prev=row.previousElementSibling;
      if(prev){row.parentElement.insertBefore(row,prev);scheduleEditorSave();}
      return;
    }
    if(e.target.closest('.mb-er-down')&&row){
      const next=row.nextElementSibling;
      if(next){row.parentElement.insertBefore(next,row);scheduleEditorSave();}
      return;
    }
    const del=e.target.closest('.mb-er-del');if(del){
      del.closest('.mb-edit-row')?.remove();scheduleEditorSave();
    }
  });
  bind('kslMediaImageTarget','change',e=>{targetImage=e.target.value;renderImageThumb()});
  bind('kslMediaBgRemovalMode','change',e=>{draft.bgRemovalMode=e.target.value==='standard'?'standard':'detail';persistDraft(true);setSaveStatus(draft.bgRemovalMode==='detail'?'โหมดละเอียด: เก็บวัตถุข้างแก้ว ✓':'โหมดมาตรฐาน ✓')});
  bind('kslMediaChooseImage','click',()=>document.getElementById('kslMediaImageInput')?.click());
  bind('kslMediaImageInput','change',async e=>{
    const f=e.target.files?.[0];if(!f||!targetImage)return;
    const id=targetImage;
    try{
      const data=await compressImage(f,draft.bgRemovalMode||'detail');
      setSaveStatus('กำลังบันทึกรูปที่ลบพื้นหลังแล้ว...');
      await persistImageAuto(id,data); // same menu id = overwrite previous transparent image automatically
      renderImageThumb();
      renderPreview();
      setSaveStatus('ลบพื้นหลังและบันทึกรูปอัตโนมัติ ✓');
    }catch(err){
      console.error('[KSL Media] image upload',err);
      alert('เพิ่มรูปไม่สำเร็จ: '+err.message);
    }
    e.target.value='';
  });
  bind('kslMediaRemoveImage','click',async()=>{
    if(!targetImage)return;
    const id=targetImage;
    await persistImageAuto(id,'');
    renderImageThumb();
    renderPreview();
  });
  bind('kslMediaSaveNew','click',saveProjectNew);
  bind('kslMediaSaveOverwrite','click',saveProjectOverwrite);
  bind('kslMediaPrint','click',printPdf);
  bind('kslMediaJpg','click',()=>exportImages('jpeg'));
  bind('kslMediaPng','click',()=>exportImages('png'));
}

function projectSnapshot(){
  return {
    id:draft.id,
    name:draft.name,
    type:draft.type,
    template:draft.template,
    orientation:draft.orientation,
    perPage:draft.perPage,
    theme:draft.theme,
    bgRemovalMode:draft.bgRemovalMode||'detail',
    title:draft.title,
    subtitle:draft.subtitle,
    selected:[...(draft.selected||[])],
    overrides:clone(draft.overrides||{}),
    createdAt:draft.createdAt,
    updatedAt:draft.updatedAt
  };
}
function localProjects(){
  try{
    const v=JSON.parse(localStorage.getItem(PROJECTS)||'[]');
    return Array.isArray(v)?v:[];
  }catch(_){return []}
}
function getSavedProjects(){
  const map=new Map();
  localProjects().forEach(p=>p?.id&&map.set(p.id,p));
  remoteProjects.forEach(p=>{
    if(!p?.id)return;
    const old=map.get(p.id);
    if(!old||String(p.updatedAt||'')>String(old.updatedAt||''))map.set(p.id,p);
  });
  try{
    const s=app();
    (Array.isArray(s?.mediaProjects)?s.mediaProjects:[]).forEach(p=>{
      if(!p?.id)return;
      const old=map.get(p.id);
      if(!old||String(p.updatedAt||'')>String(old.updatedAt||''))map.set(p.id,p);
    });
  }catch(_){}
  return [...map.values()].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
}
function renderSavedProjects(){
  const sel=document.getElementById('kslMediaSavedProjects');if(!sel)return;
  const list=getSavedProjects();
  sel.innerHTML=list.length?list.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name||'สื่อการสอน')+' • '+esc(typeLabel(p.type))+'</option>').join(''):'<option value="">ยังไม่มีงานที่บันทึก</option>';
}
function loadSavedProject(id){
  const p=getSavedProjects().find(x=>x.id===id);if(!p)return;
  const keepImages=draft.images||{};
  draft={...defaults(),...clone(p),images:keepImages,overrides:clone(p.overrides||{}),selected:Array.isArray(p.selected)?[...p.selected]:[]};
  targetImage='';
  cleanSelection();
  syncUI();
  setSaveStatus('กำลังแก้ไขงานเดิม: '+(draft.name||'สื่อการสอน')+' • ใช้ “บันทึกทับงานเดิม” เพื่ออัปเดต');
}
async function deleteSavedProject(id){
  if(!id)return;
  const local=localProjects().filter(p=>p?.id!==id);
  try{localStorage.setItem(PROJECTS,JSON.stringify(local))}catch(_){}
  try{
    await mediaFetch('/rest/v1/ksl_media_projects?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:{'Prefer':'return=minimal'}});
    remoteProjects=remoteProjects.filter(p=>p?.id!==id);
  }catch(e){console.warn('[KSL Media] delete online project',e)}
  try{
    const s=app();
    if(s&&Array.isArray(s.mediaProjects)){
      s.mediaProjects=s.mediaProjects.filter(p=>p?.id!==id);
      if(typeof dbSet==='function')await Promise.resolve(dbSet(s));
    }
  }catch(e){console.warn('[KSL Media] delete project sync',e)}
  if(draft.id===id)draft=defaults();
  renderSavedProjects();syncUI();
  setSaveStatus('ลบงานที่บันทึกแล้ว ✓');
}


function projectDate(v){
  try{return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch(_){return text(v)}
}
function renderHistoryPage(){
  const box=document.getElementById('kslMediaHistoryList');if(!box)return;
  const list=getSavedProjects();
  if(!list.length){
    box.innerHTML='<div class="mb-history-empty">ยังไม่มีประวัติการบันทึก</div>';
    return;
  }
  box.innerHTML='<div class="mb-history-grid">'+list.map(p=>{
    const count=Array.isArray(p.selected)?p.selected.length:0;
    const orient=p.orientation==='portrait'?'แนวตั้ง':'แนวนอน';
    return '<article class="mb-history-card" data-history-id="'+esc(p.id)+'">'+
      '<div class="mb-history-card-top"><div><h3>'+esc(p.name||'สื่อการสอน')+'</h3><div class="mb-history-meta">'+esc(typeLabel(p.type))+' • '+orient+' • Theme '+esc(p.theme||'1')+'</div></div><span class="mb-count">'+count+' เมนู</span></div>'+
      '<div class="mb-history-date">แก้ไขล่าสุด '+esc(projectDate(p.updatedAt||p.createdAt))+'</div>'+
      '<div class="mb-history-actions"><button class="mb-btn primary mb-history-open" type="button">เปิดแก้ไข</button><button class="mb-btn mb-history-copy" type="button">สร้างงานใหม่จากชุดนี้</button><button class="mb-btn danger mb-history-delete" type="button">ลบ</button></div>'+
    '</article>';
  }).join('')+'</div>';
}
async function openHistoryPage(){
  await loadOnlineMediaState();
  renderHistoryPage();
  renderSavedProjects();
  document.getElementById('kslMediaHistoryPage')?.classList.add('show');
}
function closeHistoryPage(){
  document.getElementById('kslMediaHistoryPage')?.classList.remove('show');
}

function currentSavedProject(){
  return getSavedProjects().find(p=>p?.id===draft.id)||null;
}
async function persistCurrentProject(){
  draft.updatedAt=now();
  const snap=projectSnapshot();
  let localOK=false,onlineOK=false;

  try{
    let local=localProjects();
    const i=local.findIndex(x=>x.id===snap.id);
    if(i>=0)local[i]=snap;else local.unshift(snap);
    local=local.slice(0,50);
    localStorage.setItem(PROJECTS,JSON.stringify(local));
    localStorage.setItem(STORE,JSON.stringify({...draft,images:{}}));
    localOK=true;
    setSaveStatus('บันทึกงานในเครื่องแล้ว • กำลัง Sync Online...');
  }catch(e){
    console.warn('[KSL Media] local project save',e);
  }

  try{
    await syncProjectOnline(snap);
    const s=app();
    if(s){
      s.mediaProjects=Array.isArray(s.mediaProjects)?s.mediaProjects:[];
      const i=s.mediaProjects.findIndex(x=>x.id===snap.id);
      if(i>=0)s.mediaProjects[i]=clone(snap);else s.mediaProjects.unshift(clone(snap));
      s.mediaProjects=s.mediaProjects.slice(0,50);
      s.mediaBuilderV1={...clone(snap),images:{}};
      try{if(typeof dbSet==='function')await Promise.resolve(dbSet(s))}catch(_){}
    }
    onlineOK=true;
  }catch(e){
    console.warn('[KSL Media] online project save',e);
  }

  renderSavedProjects();
  renderHistoryPage();
  if(localOK&&onlineOK){setSaveStatus('บันทึกและ Sync Online แล้ว ✓');return true}
  if(localOK){setSaveStatus('บันทึกงานแล้ว ✓ • รอ Sync Online');return true}
  if(onlineOK){setSaveStatus('บันทึกงาน Online แล้ว ✓');return true}
  alert('บันทึกงานไม่สำเร็จ กรุณาลองอีกครั้ง');
  return false;
}
async function saveProjectNew(){
  const suggested=(draft.name&&draft.name!=='สื่อการสอน'?draft.name+' - Copy':pageTitle()+' '+new Intl.DateTimeFormat('th-TH',{dateStyle:'short'}).format(new Date()));
  const inputName=prompt('ชื่อสำหรับงานใหม่',suggested);if(!inputName)return;
  const name=text(inputName);if(!name)return;

  // Always create a fresh project ID. Never overwrite an older project.
  draft.id=uid();
  draft.name=name;
  draft.createdAt=now();
  draft.updatedAt=now();

  const ok=await persistCurrentProject();
  if(ok)setSaveStatus('สร้างงานใหม่ “'+name+'” แล้ว ✓');
}
async function saveProjectOverwrite(){
  const existing=currentSavedProject();
  if(!existing){
    alert('งานนี้ยังไม่เคยบันทึก กรุณากด “บันทึกงานใหม่” ก่อน');
    return;
  }
  // Preserve the existing project identity/name; overwrite only this project.
  draft.id=existing.id;
  draft.name=existing.name||draft.name;
  draft.createdAt=existing.createdAt||draft.createdAt||now();
  draft.updatedAt=now();

  const ok=await persistCurrentProject();
  if(ok)setSaveStatus('บันทึกทับงานเดิม “'+draft.name+'” แล้ว ✓');
}

function printCss(){
  const landscape=draft.orientation==='landscape';
  const w=landscape?'297mm':'210mm',h=landscape?'210mm':'297mm';
  return CSS+'\n'+
    '@page{size:A4 '+(landscape?'landscape':'portrait')+';margin:0;}'+
    'html,body{margin:0!important;padding:0!important;background:#fff!important;width:'+w+';min-height:'+h+';}'+
    '#kslMediaPrintRoot{display:block!important;margin:0!important;padding:0!important;width:'+w+';}'+
    '#kslMediaPrintRoot .ksl-media-page{display:grid!important;transform:none!important;margin:0!important;width:'+w+'!important;height:'+h+'!important;min-width:'+w+'!important;min-height:'+h+'!important;max-width:'+w+'!important;max-height:'+h+'!important;box-shadow:none!important;page-break-after:always;break-after:page;overflow:hidden!important;}'+
    '#kslMediaPrintRoot .ksl-media-page:last-child{page-break-after:auto;break-after:auto;}'+
    '@media print{body>*{display:none!important}#kslMediaPrintRoot{display:block!important}#kslMediaPrintRoot *{visibility:visible!important}}';
}
async function printPdf(){
  if(!draft.selected.length){alert('กรุณาเลือกอย่างน้อย 1 เมนู');return}
  const source=[...document.querySelectorAll('#kslMediaPreview .ksl-media-page')];
  if(!source.length){alert('ไม่พบข้อมูลสำหรับ PDF');return}
  await Promise.all(source.map(waitForMediaReady));
  const w=window.open('','_blank');
  if(!w){alert('Browser ปิดกั้นหน้าต่าง Export');return}
  const pages=source.map(p=>p.outerHTML).join('');
  w.document.open();
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(pageTitle())+'</title><style>'+printCss()+'</style></head><body><div id="kslMediaPrintRoot">'+pages+'</div><script>window.onload=async()=>{try{if(document.fonts&&document.fonts.ready)await document.fonts.ready;const imgs=[...document.images];await Promise.all(imgs.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r})));setTimeout(()=>window.print(),250)}catch(e){setTimeout(()=>window.print(),400)}}<\/script></body></html>');
  w.document.close();
}

async function exportImages(format){
 if(!draft.selected.length){alert('กรุณาเลือกอย่างน้อย 1 เมนู');return}
 const pages=[...document.querySelectorAll('#kslMediaPreview .ksl-media-page')];
 if(!pages.length)return;
 for(let i=0;i<pages.length;i++){
   try{await exportPageImage(pages[i],format,i+1)}catch(e){console.error(e);alert('Export รูปไม่สำเร็จ: '+(e?.message||'Render A4 ไม่สำเร็จ'));break}
   await new Promise(r=>setTimeout(r,180));
 }
}
let html2canvasPromise=null;
async function getHtml2Canvas(){
  if(window.html2canvas)return window.html2canvas;
  if(!html2canvasPromise){
    html2canvasPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload=()=>window.html2canvas?resolve(window.html2canvas):reject(new Error('โหลดตัว Export ไม่สำเร็จ'));
      s.onerror=()=>reject(new Error('โหลดตัว Export ไม่สำเร็จ'));
      document.head.appendChild(s);
    }).catch(e=>{html2canvasPromise=null;throw e});
  }
  return html2canvasPromise;
}
async function waitForMediaReady(root){
  try{if(document.fonts?.ready)await document.fonts.ready}catch(_){}
  const imgs=[...root.querySelectorAll('img')];
  await Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r})));
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
}
async function exportPageImage(page,format,index){
  const h2c=await getHtml2Canvas();
  const landscape=draft.orientation==='landscape';
  const w=landscape?1123:794,h=landscape?794:1123;

  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-20000px;top:0;width:'+w+'px;height:'+h+'px;background:#fff;z-index:-1;overflow:hidden;';
  const clonePage=page.cloneNode(true);
  clonePage.querySelectorAll('.mb-review-tools').forEach(x=>x.remove());
  clonePage.querySelectorAll('.mb-review-draggable').forEach(x=>{x.removeAttribute('draggable');x.classList.remove('mb-review-draggable','mb-dragging','mb-drop-target')});
  clonePage.style.transform='none';
  clonePage.style.margin='0';
  clonePage.style.width=w+'px';
  clonePage.style.height=h+'px';
  clonePage.style.minWidth=w+'px';
  clonePage.style.minHeight=h+'px';
  clonePage.style.maxWidth=w+'px';
  clonePage.style.maxHeight=h+'px';
  clonePage.style.boxShadow='none';
  host.appendChild(clonePage);
  document.body.appendChild(host);

  try{
    await waitForMediaReady(clonePage);
    fitVisibleTableText(clonePage);
    await new Promise(r=>requestAnimationFrame(r));
    const canvas=await h2c(clonePage,{
      backgroundColor:'#ffffff',
      scale:2,
      useCORS:true,
      allowTaint:true,
      logging:false,
      imageTimeout:15000,
      width:w,
      height:h,
      windowWidth:w,
      windowHeight:h,
      scrollX:0,
      scrollY:0
    });
    const mime=format==='png'?'image/png':'image/jpeg',ext=format==='png'?'png':'jpg';
    await new Promise((resolve,reject)=>{
      canvas.toBlob(b=>{
        if(!b)return reject(new Error('สร้างไฟล์ไม่สำเร็จ'));
        const a=document.createElement('a');
        a.href=URL.createObjectURL(b);
        a.download=(pageTitle().replace(/[\\/:*?"<>|]+/g,'-')||'KSL-Media')+'-A4-'+index+'.'+ext;
        document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(a.href),1500);
        resolve();
      },mime,.93);
    });
  }finally{
    host.remove();
  }
}

async function openBuilder(type){
 installBuilder();loadDraft();
 if(type&&['drink','production','holding'].includes(type)){draft.type=type;cleanSelection()}
 draft.template='branch-grid';
 draft.orientation='landscape';
 const ov=document.getElementById('kslMediaOverlay');ov.classList.add('show');
 setSaveStatus('กำลังโหลดข้อมูล Media Online...');
 await loadOnlineMediaState();
 syncUI();
 migrateLocalImagesOnline().catch(e=>console.warn('[KSL Media] migrate local images',e));
 setSaveStatus('เชื่อม Media Online แล้ว ✓');
 setTimeout(()=>document.getElementById('kslMediaPreview')?.scrollTo(0,0),30);
}
window.KSL_OPEN_MEDIA_BUILDER=openBuilder;

function installAdminCard(){
 const manage=document.getElementById('manage');if(!manage||document.getElementById('kslMediaAdminCard'))return false;
 const card=document.createElement('div');card.id='kslMediaAdminCard';card.className='card';card.style.cssText='margin:0 0 16px;border:1px solid #cfe4d9;background:linear-gradient(135deg,#f8fffb,#eef8f3)';
 card.innerHTML='<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-size:11px;font-weight:900;color:#1a7453;letter-spacing:.5px">ADMIN MEDIA BUILDER</div><h3 style="margin:4px 0;color:#174c39">🎨 สร้างสื่อการสอนสำหรับติดหน้าสาขา</h3><p style="margin:0;color:#6b8178;font-size:12px">ใช้ข้อมูลล่าสุดที่ Upload • เพิ่มรูปประกอบ • 1 แผ่น A4 เลือกแสดงได้หลายเมนู • Auto Save</p></div><span style="background:#176b4d;color:#fff;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:900">A4 MULTI-MENU</span></div><div style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:10px;margin-top:14px"><button class="btn btn-outline" data-media-type="drink" style="min-height:58px">🧋 <b>สื่อสูตรการชง</b><br><small>เลือกหลายเมนูต่อ A4</small></button><button class="btn btn-outline" data-media-type="production" style="min-height:58px">🧑‍🍳 <b>สื่อสูตรการผลิต</b><br><small>Production Recipe</small></button><button class="btn btn-outline" data-media-type="holding" style="min-height:58px">⏳ <b>สื่อตารางวันหมดอายุ</b><br><small>Holding Time</small></button></div>';
 card.addEventListener('click',e=>{const b=e.target.closest('[data-media-type]');if(b)openBuilder(b.dataset.mediaType)});
 const anchor=document.getElementById('kslCentralSyncCard');if(anchor?.nextSibling)manage.insertBefore(card,anchor.nextSibling);else manage.insertBefore(card,manage.firstChild);
 return true;
}

loadDraft();ensureStyles();installBuilder();installAdminCard();loadOnlineMediaState().then(()=>{renderSavedProjects();renderPreview()}).catch(()=>{});
let tries=0;const timer=setInterval(()=>{tries++;installAdminCard();if(tries>180)clearInterval(timer)},1000);
console.info('[KSL] Admin Media Builder V1 ready • multi-menu A4 export');
})();