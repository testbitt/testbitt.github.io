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
const text=v=>String(v??'').trim();
const esc=v=>text(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};
const uid=()=> 'MEDIA-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const now=()=>new Date().toISOString();
const app=()=>{try{return typeof appState!=='undefined'&&appState?appState:window.appState}catch(_){return window.appState}};
const unique=a=>[...new Set((a||[]).map(text).filter(Boolean))];

const defaults=()=>({
  id:uid(),name:'สื่อการสอน',type:'drink',template:'modern',orientation:'portrait',
  perPage:4,title:'',subtitle:'',selected:[],images:{},createdAt:now(),updatedAt:now()
});
let draft=defaults(), search='', targetImage='';
let saveTimer=null;

function loadDraft(){
  try{
    const s=app();
    const v=s?.mediaBuilderV1 || JSON.parse(localStorage.getItem(STORE)||'null');
    if(v&&typeof v==='object')draft={...defaults(),...v,images:v.images||{},selected:Array.isArray(v.selected)?v.selected:[]};
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
      setSaveStatus('บันทึกอัตโนมัติ ✓');
    }catch(e){console.warn('[KSL Media] autosave',e);setSaveStatus('บันทึกในเครื่องแล้ว');}
  };
  if(immediate)run();else saveTimer=setTimeout(run,550);
  setSaveStatus('กำลังบันทึก...');
}
function setSaveStatus(t){const el=document.getElementById('kslMediaSaveState');if(el)el.textContent=t}

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
  const variants=unique(item.rows.map(r=>r.Variant||r.variant));
  const ingredients=item.rows.map(r=>{
    const ing=text(r.Ingredient||r.ingredient),q=text(r.Quantity||r.quantity),u=text(r.Unit||r.unit);
    return ing?(ing+(q?' — '+q+(u?' '+u:''):'')):'';
  }).filter(Boolean);
  const instructions=unique(item.rows.map(r=>r.Instructions||r.instructions));
  return cardShell(item,
    (variants.length?'<div class="mb-pills">'+variants.slice(0,4).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>':'')+
    '<div class="mb-section"><b>🥤 วัตถุดิบ</b><ul>'+lineList(ingredients,6)+'</ul></div>'+
    (instructions.length?'<div class="mb-section mb-method"><b>✨ ขั้นตอน</b><ol>'+lineList(instructions,3)+'</ol></div>':'')
  );
}
function productionCard(item){
  const first=item.rows[0]||{};
  const variants=unique(item.rows.map(r=>r.variant));
  const ingredients=unique(item.rows.map(r=>r.ingredients));
  const methods=unique(item.rows.map(r=>r.method));
  const meta=[
    text(first.yield_amount)?'Yield '+text(first.yield_amount)+' '+text(first.yield_unit):'',
    text(first.shelf_life)?'⏳ '+text(first.shelf_life):'',
    text(first.storage_condition)?'❄️ '+text(first.storage_condition):''
  ].filter(Boolean);
  return cardShell(item,
    (variants.length?'<div class="mb-pills">'+variants.slice(0,4).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>':'')+
    (meta.length?'<div class="mb-meta">'+meta.map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>':'')+
    (ingredients.length?'<div class="mb-section"><b>🥣 ส่วนผสม</b><ul>'+lineList(ingredients,4)+'</ul></div>':'')+
    (methods.length?'<div class="mb-section mb-method"><b>🔥 วิธีผลิต</b><ol>'+lineList(methods,3)+'</ol></div>':'')
  );
}
function holdingCard(item){
  const rows=item.rows.slice(0,7);
  const body=rows.map(r=>'<tr><td>'+esc(r['สถานะ']||'-')+'</td><td><b>'+esc(r['อายุการจัดเก็บ']||'-')+'</b></td><td>'+esc(r['อุณหภูมิ/สถานที่จัดเก็บ']||'-')+'</td></tr>').join('');
  return cardShell(item,
    '<div class="mb-section"><table class="mb-holding"><thead><tr><th>สถานะ</th><th>Holding Time</th><th>จัดเก็บ</th></tr></thead><tbody>'+body+'</tbody></table>'+
    (item.rows.length>7?'<div class="mb-more">+'+(item.rows.length-7)+' เงื่อนไข</div>':'')+'</div>'
  );
}
function cardShell(item,body){
  const img=draft.images?.[item.id];
  const en=item.en&&item.en!==item.name?'<div class="mb-en">'+esc(item.en)+'</div>':'';
  return '<article class="mb-card">'+
    '<div class="mb-card-head"><div class="mb-icon">'+(draft.type==='drink'?'🧋':draft.type==='production'?'🧑‍🍳':'⏳')+'</div><div class="mb-title-wrap"><h2>'+esc(item.name)+'</h2>'+en+'</div>'+
    (img?'<div class="mb-img"><img src="'+img+'" alt=""></div>':'')+
    '</div>'+body+'</article>';
}
function itemCard(item){return draft.type==='drink'?drinkCard(item):draft.type==='production'?productionCard(item):holdingCard(item)}

function columnsFor(count){
  if(count<=1)return 1;
  if(draft.orientation==='landscape'){
    if(count<=4)return 2;
    if(count<=9)return 3;
    if(count<=16)return 4;
    return 5;
  }
  if(count<=4)return 2;
  if(count<=9)return 3;
  return 4;
}
function densityFor(count){
  if(count<=4)return 'mb-density-roomy';
  if(count<=8)return 'mb-density-medium';
  if(count<=12)return 'mb-density-compact';
  return 'mb-density-max';
}
function buildPage(items,index,total){
  const cols=columnsFor(items.length);
  const size=draft.orientation==='landscape'?'mb-landscape':'mb-portrait';
  const density=densityFor(items.length);
  return '<section class="ksl-media-page '+size+' '+density+' mb-template-'+esc(draft.template)+'" data-page="'+index+'">'+
    '<header class="mb-page-head"><div><div class="mb-kamu">KAMU KAMU • TRAINING</div><h1>'+esc(pageTitle())+'</h1>'+
    (draft.subtitle?'<p>'+esc(draft.subtitle)+'</p>':'')+'</div><div class="mb-page-no">'+(index+1)+' / '+total+'</div></header>'+
    '<div class="mb-grid" style="--mb-cols:'+cols+'">'+items.map(itemCard).join('')+'</div>'+
    '<footer class="mb-footer"><span>'+esc(typeLabel())+'</span><span>ข้อมูลจาก KSL • '+new Intl.DateTimeFormat('th-TH',{dateStyle:'medium'}).format(new Date())+'</span></footer>'+
    '</section>';
}
function previewHtml(){
  const items=selectedItems(),per=Math.min(20,Math.max(1,Number(draft.perPage)||4)),pages=chunk(items,per);
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
@media(max-width:900px){.mb-shell{grid-template-columns:1fr;height:auto}.mb-controls{border-right:0;border-bottom:1px solid #d4e7dc}.mb-preview-wrap{align-items:flex-start}.ksl-media-page{transform-origin:top left;transform:scale(.72);margin-bottom:-300px}}
@media print{body>*{display:none!important}#kslMediaPrintRoot{display:block!important}.ksl-media-page{box-shadow:none;page-break-after:always;margin:0}.ksl-media-page:last-child{page-break-after:auto}}
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
  renderImageThumb();
}
function renderImageThumb(){
  const box=document.getElementById('kslMediaImageThumb');if(!box)return;
  const src=targetImage&&draft.images?.[targetImage];
  box.innerHTML=src?'<img src="'+src+'" alt="">':'<span class="mb-note">ยังไม่มีรูปประกอบ</span>';
}
function renderPreview(){
  const wrap=document.getElementById('kslMediaPreview');if(!wrap)return;
  wrap.innerHTML=previewHtml();
  const pages=wrap.querySelectorAll('.ksl-media-page').length;
  const badge=document.getElementById('kslMediaPageCount');if(badge)badge.textContent=pages+' หน้า A4';
}

function syncUI(){
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v};
  set('kslMediaType',draft.type);set('kslMediaTemplate',draft.template);set('kslMediaOrientation',draft.orientation);
  set('kslMediaPerPage',String(draft.perPage));set('kslMediaTitle',draft.title);set('kslMediaSubtitle',draft.subtitle);
  renderControls();renderPreview();persistDraft();
}
function onTypeChange(v){draft.type=v;draft.selected=[];draft.images={};targetImage='';draft.title='';search='';const q=document.getElementById('kslMediaSearch');if(q)q.value='';syncUI()}

async function compressImage(file){
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((ok,fail)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=fail;im.src=url});
    const scale=Math.min(1,MAX_IMG/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
    return c.toDataURL('image/jpeg',.8);
  }finally{URL.revokeObjectURL(url)}
}

function builderHtml(){
 return '<div id="kslMediaOverlay">'+
 '<div class="mb-topbar"><div><h2>🎨 สร้างสื่อการสอน</h2><small id="kslMediaSaveState">บันทึกอัตโนมัติ ✓</small></div>'+
 '<div class="mb-actions"><span class="mb-count" id="kslMediaPageCount">1 หน้า A4</span><button class="mb-btn" id="kslMediaSaveProject">💾 บันทึกงาน</button><button class="mb-btn" id="kslMediaPrint">📄 PDF / Print</button><button class="mb-btn" id="kslMediaJpg">🖼 JPG</button><button class="mb-btn" id="kslMediaPng">PNG</button><button class="mb-btn danger" id="kslMediaClose">✕ ปิด</button></div></div>'+
 '<div class="mb-shell"><aside class="mb-controls">'+
 '<div class="mb-block"><h3>1. ประเภทสื่อ</h3><div class="mb-field"><select class="mb-select" id="kslMediaType"><option value="drink">🧋 สูตรการชงเครื่องดื่ม</option><option value="production">🧑‍🍳 สูตรการผลิต</option><option value="holding">⏳ ตารางวันหมดอายุ</option></select></div>'+
 '<div class="mb-inline"><div class="mb-field"><label>Template</label><select class="mb-select" id="kslMediaTemplate"><option value="modern">KAMU Modern</option><option value="visual">Visual Training</option><option value="compact">Compact SOP</option></select></div><div class="mb-field"><label>แนวกระดาษ</label><select class="mb-select" id="kslMediaOrientation"><option value="portrait">A4 แนวตั้ง</option><option value="landscape">A4 แนวนอน</option></select></div></div>'+
 '<div class="mb-field"><label>จำนวนเมนูต่อ A4 (สูงสุด 20)</label><select class="mb-select" id="kslMediaPerPage"><option value="1">1 เมนู</option><option value="2">2 เมนู</option><option value="3">3 เมนู</option><option value="4">4 เมนู</option><option value="5">5 เมนู</option><option value="6">6 เมนู</option><option value="7">7 เมนู</option><option value="8">8 เมนู</option><option value="9">9 เมนู</option><option value="10">10 เมนู</option><option value="11">11 เมนู</option><option value="12">12 เมนู</option><option value="13">13 เมนู</option><option value="14">14 เมนู</option><option value="15">15 เมนู</option><option value="16">16 เมนู</option><option value="17">17 เมนู</option><option value="18">18 เมนู</option><option value="19">19 เมนู</option><option value="20">20 เมนู</option></select><div class="mb-note">1 หน้า A4 เลือกได้สูงสุด 20 เมนู ระบบจะลดขนาด Grid / ตัวอักษร / รูปประกอบให้พอดีอัตโนมัติ และถ้าเลือกเกินจำนวนต่อหน้าจะสร้าง A4 หน้าถัดไป</div></div></div>'+
 '<div class="mb-block"><h3>2. เลือกเมนูจากฐานข้อมูล <span class="mb-count" id="kslMediaSelectedCount">0 เมนู</span></h3><div class="mb-field"><input class="mb-input" id="kslMediaSearch" placeholder="ค้นหาเมนู..."></div><div class="mb-list-tools"><button class="mb-link" id="kslMediaSelectAll">เลือกทั้งหมดที่ค้นหา</button><button class="mb-link" id="kslMediaClearSel">ล้างการเลือก</button></div><div id="kslMediaItemList"></div></div>'+
 '<div class="mb-block"><h3>3. หัวเรื่อง</h3><div class="mb-field"><label>หัวเรื่องหลัก</label><input class="mb-input" id="kslMediaTitle" placeholder="ใช้ชื่อประเภทสื่ออัตโนมัติ"></div><div class="mb-field"><label>ข้อความรอง</label><input class="mb-input" id="kslMediaSubtitle" placeholder="เช่น สำหรับพนักงานใหม่ / Updated..."></div></div>'+
 '<div class="mb-block"><h3>4. รูปประกอบ</h3><div class="mb-field"><label>เมนูที่จะใส่รูป</label><select class="mb-select" id="kslMediaImageTarget"></select></div><div class="mb-image-row"><button class="mb-btn" id="kslMediaChooseImage">＋ เพิ่ม/เปลี่ยนรูป</button><button class="mb-btn danger" id="kslMediaRemoveImage">ลบรูป</button><input type="file" id="kslMediaImageInput" accept="image/*" hidden></div><div class="mb-thumb" id="kslMediaImageThumb"></div><div class="mb-note">ระบบย่อรูปก่อนบันทึกเพื่อให้เปิดสื่อและ Export ได้เร็ว</div></div>'+
 '</aside><main class="mb-preview-wrap" id="kslMediaPreview"></main></div></div>';
}

function installBuilder(){
  ensureStyles();
  if(!document.getElementById('kslMediaOverlay'))document.body.insertAdjacentHTML('beforeend',builderHtml());
  const ov=document.getElementById('kslMediaOverlay');if(ov.dataset.bound)return;ov.dataset.bound='1';

  const bind=(id,ev,fn)=>document.getElementById(id)?.addEventListener(ev,fn);
  bind('kslMediaClose','click',()=>ov.classList.remove('show'));
  bind('kslMediaType','change',e=>onTypeChange(e.target.value));
  bind('kslMediaTemplate','change',e=>{draft.template=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaOrientation','change',e=>{draft.orientation=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaPerPage','change',e=>{draft.perPage=Math.min(20,Math.max(1,Number(e.target.value)||4));renderPreview();persistDraft()});
  bind('kslMediaTitle','input',e=>{draft.title=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaSubtitle','input',e=>{draft.subtitle=e.target.value;renderPreview();persistDraft()});
  bind('kslMediaSearch','input',e=>{search=e.target.value;renderControls()});
  bind('kslMediaItemList','change',e=>{const cb=e.target.closest('[data-mb-item]');if(!cb)return;const id=cb.dataset.mbItem;if(cb.checked&&!draft.selected.includes(id))draft.selected.push(id);if(!cb.checked)draft.selected=draft.selected.filter(x=>x!==id);renderControls();renderPreview();persistDraft()});
  bind('kslMediaSelectAll','click',()=>{const q=search.toLowerCase();sourceItems().filter(x=>!q||(x.name+' '+x.en).toLowerCase().includes(q)).forEach(x=>{if(!draft.selected.includes(x.id))draft.selected.push(x.id)});renderControls();renderPreview();persistDraft()});
  bind('kslMediaClearSel','click',()=>{draft.selected=[];targetImage='';renderControls();renderPreview();persistDraft()});
  bind('kslMediaImageTarget','change',e=>{targetImage=e.target.value;renderImageThumb()});
  bind('kslMediaChooseImage','click',()=>document.getElementById('kslMediaImageInput')?.click());
  bind('kslMediaImageInput','change',async e=>{const f=e.target.files?.[0];if(!f||!targetImage)return;try{draft.images[targetImage]=await compressImage(f);renderImageThumb();renderPreview();persistDraft()}catch(err){alert('เพิ่มรูปไม่สำเร็จ: '+err.message)}e.target.value=''});
  bind('kslMediaRemoveImage','click',()=>{if(targetImage){delete draft.images[targetImage];renderImageThumb();renderPreview();persistDraft()}});
  bind('kslMediaSaveProject','click',saveProject);
  bind('kslMediaPrint','click',printPdf);
  bind('kslMediaJpg','click',()=>exportImages('jpeg'));
  bind('kslMediaPng','click',()=>exportImages('png'));
}

async function saveProject(){
  const suggested=draft.name&&draft.name!=='สื่อการสอน'?draft.name:pageTitle()+' '+new Intl.DateTimeFormat('th-TH',{dateStyle:'short'}).format(new Date());
  const name=prompt('ชื่อสื่อสำหรับบันทึก',suggested);if(!name)return;
  draft.name=name;draft.updatedAt=now();
  try{
    const s=app();if(s){
      s.mediaProjects=Array.isArray(s.mediaProjects)?s.mediaProjects:[];
      const i=s.mediaProjects.findIndex(x=>x.id===draft.id);
      const copy=clone(draft);if(i>=0)s.mediaProjects[i]=copy;else s.mediaProjects.unshift(copy);
      s.mediaProjects=s.mediaProjects.slice(0,50);
      if(typeof dbSet==='function')await Promise.resolve(dbSet(s));
    }
    let local=[];try{local=JSON.parse(localStorage.getItem(PROJECTS)||'[]')}catch(_){}
    const i=local.findIndex(x=>x.id===draft.id);if(i>=0)local[i]=clone(draft);else local.unshift(clone(draft));local=local.slice(0,50);localStorage.setItem(PROJECTS,JSON.stringify(local));
    persistDraft(true);setSaveStatus('บันทึกงานแล้ว ✓');
  }catch(e){console.warn(e);alert('บันทึกงานไม่สำเร็จ')}
}

function printCss(){
 const landscape=draft.orientation==='landscape';
 return CSS+'\n@page{size:A4 '+(landscape?'landscape':'portrait')+';margin:0}html,body{margin:0!important;background:#fff!important}.ksl-media-page{width:'+(landscape?'297mm':'210mm')+'!important;height:'+(landscape?'210mm':'297mm')+'!important;box-shadow:none!important;page-break-after:always}.ksl-media-page:last-child{page-break-after:auto}';
}
function printPdf(){
 if(!draft.selected.length){alert('กรุณาเลือกอย่างน้อย 1 เมนู');return}
 const w=window.open('','_blank');if(!w){alert('Browser ปิดกั้นหน้าต่าง Export');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(pageTitle())+'</title><style>'+printCss()+'</style></head><body>'+previewHtml()+'<script>window.onload=()=>setTimeout(()=>window.print(),350)<\/script></body></html>');w.document.close();
}

async function exportImages(format){
 if(!draft.selected.length){alert('กรุณาเลือกอย่างน้อย 1 เมนู');return}
 const pages=[...document.querySelectorAll('#kslMediaPreview .ksl-media-page')];
 if(!pages.length)return;
 for(let i=0;i<pages.length;i++){
   try{await exportPageImage(pages[i],format,i+1)}catch(e){console.error(e);alert('Export รูปไม่สำเร็จ: '+e.message);break}
   await new Promise(r=>setTimeout(r,180));
 }
}
function exportPageImage(page,format,index){
 return new Promise((resolve,reject)=>{
   const landscape=draft.orientation==='landscape',w=landscape?1123:794,h=landscape?794:1123;
   const xml='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>'+CSS.replace(/#kslMediaOverlay[^}]*}/g,'')+'</style>'+page.outerHTML+'</div></foreignObject></svg>';
   const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();
   img.onload=()=>{
     try{
       const scale=2,c=document.createElement('canvas');c.width=w*scale;c.height=h*scale;const ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
       const mime=format==='png'?'image/png':'image/jpeg',ext=format==='png'?'png':'jpg';
       c.toBlob(b=>{if(!b)return reject(new Error('สร้างไฟล์ไม่สำเร็จ'));const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(pageTitle().replace(/[\\/:*?"<>|]+/g,'-')||'KSL-Media')+'-A4-'+index+'.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);resolve()},mime,.93);
     }catch(e){reject(e)}
   };
   img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Render A4 ไม่สำเร็จ'))};img.src=url;
 });
}

function openBuilder(type){
 installBuilder();loadDraft();
 if(type&&['drink','production','holding'].includes(type)){draft.type=type;cleanSelection()}
 const ov=document.getElementById('kslMediaOverlay');ov.classList.add('show');
 syncUI();setTimeout(()=>document.getElementById('kslMediaPreview')?.scrollTo(0,0),30);
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

loadDraft();ensureStyles();installBuilder();installAdminCard();
let tries=0;const timer=setInterval(()=>{tries++;installAdminCard();if(tries>180)clearInterval(timer)},1000);
console.info('[KSL] Admin Media Builder V1 ready • multi-menu A4 export');
})();