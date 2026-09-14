/* KSL V6.3 — Custom inspection templates for Expiry Audit */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_CUSTOM_TEMPLATES_V637__) return;
  window.__KSL_EXPIRY_CUSTOM_TEMPLATES_V637__ = true;

  const STORE_KEY = 'KSL_EXPIRY_CUSTOM_TEMPLATES_V636';
  const SELECTED_KEY = 'KSL_EXPIRY_SELECTED_V632';
  let templates = [];
  let editingId = '';
  let draftItems = [];
  let installAttempts = 0;

  const txt = v => String(v ?? '').trim();
  const esc = v => txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone = v => JSON.parse(JSON.stringify(v));
  const uid = () => 'TPL-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const now = () => new Date().toISOString();
  const wait = ms => new Promise(r=>setTimeout(r,ms));

  function getState(){ try{ if(typeof appState!=='undefined' && appState) return appState; }catch(_){} return window.appState||null; }
  function toastMsg(msg,type=''){ try{ if(typeof toast==='function') return toast(msg,type); }catch(_){} try{ alert(msg); }catch(_){} }
  function readSelected(){ try{ const v=JSON.parse(localStorage.getItem(SELECTED_KEY)||'[]'); return Array.isArray(v)?v.map(txt).filter(Boolean):[]; }catch(_){ return []; } }
  function readLocal(){ try{ const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); return normalizeTemplates(v); }catch(_){ return []; } }
  function saveLocal(){ try{ localStorage.setItem(STORE_KEY,JSON.stringify(templates)); }catch(_){} }

  function normalizeTemplate(t){
    if(!t || typeof t!=='object') return null;
    const items = Array.isArray(t.items) ? [...new Set(t.items.map(txt).filter(Boolean))] : [];
    return { id:txt(t.id)||uid(), name:txt(t.name)||'Custom Template', items, createdAt:txt(t.createdAt)||txt(t.updatedAt)||now(), updatedAt:txt(t.updatedAt)||txt(t.createdAt)||now() };
  }
  function normalizeTemplates(v){ return (Array.isArray(v)?v:[]).map(normalizeTemplate).filter(Boolean); }
  function mergeTemplates(...sets){
    const map=new Map();
    sets.flat().forEach(raw=>{
      const t=normalizeTemplate(raw); if(!t)return;
      const old=map.get(t.id);
      if(!old || String(t.updatedAt)>=String(old.updatedAt)) map.set(t.id,t);
    });
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'th'));
  }

  function pullOnline(){
    const s=getState();
    templates=mergeTemplates(templates,readLocal(),normalizeTemplates(s?.expiryAuditTemplates));
    saveLocal();
    renderTemplateSelect();
  }
  async function pushOnline(){
    saveLocal();
    const s=getState();
    if(!s || typeof dbSet!=='function') return false;
    s.expiryAuditTemplates=clone(templates);
    await Promise.resolve(dbSet(s));
    return true;
  }

  const style=document.createElement('style');
  style.id='ksl-expiry-custom-templates-v637-style';
  style.textContent=`
    #expiryAudit .ea-custom-box{margin-top:10px;padding:10px;border:1px solid #cfe4da;border-radius:12px;background:#fff}
    #expiryAudit .ea-custom-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}
    #expiryAudit .ea-custom-head b{font-size:10px;color:#244f3e}
    #expiryAudit .ea-custom-head span{font-size:9px;color:#788c82}
    #expiryAudit .ea-custom-row{display:grid;grid-template-columns:minmax(210px,1fr) auto auto auto auto;gap:7px;align-items:center}
    #expiryAudit .ea-custom-row .btn{white-space:nowrap}
    #expiryAudit .ea-template-editor{margin-top:10px;padding-top:10px;border-top:1px dashed #d5e5dd}
    #expiryAudit .ea-template-editor[hidden]{display:none!important}
    #expiryAudit .ea-template-edit-row{display:grid;grid-template-columns:minmax(170px,.75fr) minmax(180px,.75fr) minmax(220px,1fr) auto;gap:7px;align-items:center}
    #expiryAudit .ea-template-search-wrap{position:relative}
    #expiryAudit .ea-template-search-wrap::before{content:'⌕';position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;color:#6f8379;pointer-events:none}
    #expiryAudit #eaTemplateItemSearch{padding-left:29px}
    #expiryAudit .ea-template-items{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;min-height:28px}
    #expiryAudit .ea-template-item-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #cfe2d8;border-radius:999px;background:#f8fcfa;padding:5px 8px;font-size:9px;font-weight:800;color:#315d4b}
    #expiryAudit .ea-template-item-chip button{border:0;background:transparent;color:#9c5757;font-weight:900;cursor:pointer;padding:0 2px}
    #expiryAudit .ea-template-actions{display:flex;gap:7px;justify-content:flex-end;margin-top:8px}
    #expiryAudit .ea-template-empty{font-size:9px;color:#87988f;padding:5px 0}
    @media(max-width:920px){#expiryAudit .ea-template-edit-row{grid-template-columns:1fr 1fr}#expiryAudit #eaTemplateName{grid-column:1/-1}}
    @media(max-width:820px){#expiryAudit .ea-custom-row{grid-template-columns:1fr 1fr}#expiryAudit #eaTemplateSelect{grid-column:1/-1}#expiryAudit .ea-template-edit-row{grid-template-columns:1fr}#expiryAudit #eaTemplateName{grid-column:auto}#expiryAudit .ea-template-actions{justify-content:stretch;flex-wrap:wrap}#expiryAudit .ea-template-actions .btn{flex:1}}
  `;
  document.head.appendChild(style);

  function pickerOptions(){
    const sel=document.getElementById('eaItemPicker');
    if(!sel) return [];
    return [...sel.options].filter(o=>o.value).map(o=>({key:txt(o.value),label:txt(o.textContent).replace(/^★\s*/, '')}));
  }
  function labelForKey(key){ return pickerOptions().find(x=>x.key===key)?.label || key; }

  function ensureUi(){
    const pickerPanel=document.getElementById('eaPickerPanel');
    if(!pickerPanel) return false;
    if(document.getElementById('eaCustomTemplates')) return true;
    const box=document.createElement('div');
    box.id='eaCustomTemplates';
    box.className='ea-custom-box';
    box.innerHTML=`
      <div class="ea-custom-head"><b>Custom Template</b><span>บันทึกชุดวัตถุดิบที่ใช้ตรวจเป็นประจำ</span></div>
      <div class="ea-custom-row">
        <select id="eaTemplateSelect" class="input"><option value="">เลือก Template</option></select>
        <button id="eaTemplateApply" type="button" class="btn btn-primary">ใช้ Template</button>
        <button id="eaTemplateNew" type="button" class="btn btn-outline">＋ Custom</button>
        <button id="eaTemplateEdit" type="button" class="btn btn-outline">แก้ไข</button>
        <button id="eaTemplateDelete" type="button" class="btn btn-outline">ลบ</button>
      </div>
      <div id="eaTemplateEditor" class="ea-template-editor" hidden>
        <div class="ea-template-edit-row">
          <input id="eaTemplateName" class="input" type="text" placeholder="ชื่อ Template เช่น Opening / Closing / Weekend">
          <div class="ea-template-search-wrap"><input id="eaTemplateItemSearch" class="input" type="search" placeholder="Search วัตถุดิบ / ประเภท / Holding Time" autocomplete="off"></div>
          <select id="eaTemplateItemSelect" class="input"><option value="">เลือกรายการเพื่อเพิ่ม</option></select>
          <button id="eaTemplateAddItem" type="button" class="btn btn-outline">＋ เพิ่มรายการ</button>
        </div>
        <div id="eaTemplateItems" class="ea-template-items"></div>
        <div class="ea-template-actions">
          <button id="eaTemplateCancel" type="button" class="btn btn-outline">ยกเลิก</button>
          <button id="eaTemplateSave" type="button" class="btn btn-primary">💾 บันทึก Template</button>
        </div>
      </div>`;
    const frequentGroup=pickerPanel.querySelector('.ea-picker-group');
    if(frequentGroup) pickerPanel.insertBefore(box,frequentGroup); else pickerPanel.appendChild(box);
    renderTemplateSelect();
    return true;
  }

  function renderTemplateSelect(){
    if(!ensureUi()) return;
    const sel=document.getElementById('eaTemplateSelect');
    if(!sel) return;
    const current=sel.value;
    sel.innerHTML='<option value="">เลือก Template</option>'+templates.map(t=>`<option value="${esc(t.id)}">${esc(t.name)} • ${t.items.length} รายการ</option>`).join('');
    if(current && templates.some(t=>t.id===current)) sel.value=current;
    updateButtons();
  }
  function updateButtons(){
    const id=document.getElementById('eaTemplateSelect')?.value||'';
    ['eaTemplateApply','eaTemplateEdit','eaTemplateDelete'].forEach(x=>{ const el=document.getElementById(x); if(el)el.disabled=!id; });
  }

  function renderItemSelect(){
    const itemSel=document.getElementById('eaTemplateItemSelect');
    if(!itemSel) return;
    const current=itemSel.value;
    const q=txt(document.getElementById('eaTemplateItemSearch')?.value).toLowerCase();
    const options=pickerOptions()
      .filter(o=>!draftItems.includes(o.key))
      .filter(o=>!q || o.label.toLowerCase().includes(q));
    itemSel.innerHTML=options.length
      ? '<option value="">เลือกรายการเพื่อเพิ่ม</option>'+options.map(o=>`<option value="${esc(o.key)}">${esc(o.label)}</option>`).join('')
      : '<option value="">ไม่พบรายการที่ค้นหา</option>';
    if(current && options.some(o=>o.key===current)) itemSel.value=current;
    else if(q && options.length===1) itemSel.value=options[0].key;
  }

  function renderEditorItems(){
    const wrap=document.getElementById('eaTemplateItems');
    if(!wrap) return;
    wrap.innerHTML=draftItems.length?draftItems.map(k=>`<span class="ea-template-item-chip">${esc(labelForKey(k))}<button type="button" data-template-remove="${esc(k)}">×</button></span>`).join(''):'<span class="ea-template-empty">ยังไม่มีรายการใน Template</span>';
    renderItemSelect();
  }
  function openEditor(template=null){
    editingId=template?.id||'';
    draftItems=template?.items?.slice()||readSelected();
    const editor=document.getElementById('eaTemplateEditor');
    const name=document.getElementById('eaTemplateName');
    const search=document.getElementById('eaTemplateItemSearch');
    if(editor) editor.hidden=false;
    if(name){ name.value=template?.name||''; setTimeout(()=>name.focus(),0); }
    if(search) search.value='';
    const save=document.getElementById('eaTemplateSave');
    if(save) save.textContent=editingId?'💾 บันทึกการแก้ไข':'💾 บันทึก Template';
    renderEditorItems();
  }
  function closeEditor(){
    editingId=''; draftItems=[];
    const editor=document.getElementById('eaTemplateEditor'); if(editor)editor.hidden=true;
    const name=document.getElementById('eaTemplateName'); if(name)name.value='';
    const search=document.getElementById('eaTemplateItemSearch'); if(search)search.value='';
  }
  function addDraftItem(){
    const itemSel=document.getElementById('eaTemplateItemSelect');
    let k=txt(itemSel?.value);
    if(!k && itemSel){
      const first=[...itemSel.options].find(o=>txt(o.value));
      k=txt(first?.value);
    }
    if(!k){ toastMsg('ไม่พบรายการสำหรับเพิ่ม','warn'); return; }
    if(!draftItems.includes(k)) draftItems.push(k);
    const search=document.getElementById('eaTemplateItemSearch'); if(search) search.value='';
    renderEditorItems();
    setTimeout(()=>search?.focus(),0);
  }

  async function saveTemplate(){
    const name=txt(document.getElementById('eaTemplateName')?.value);
    if(!name){ toastMsg('กรุณาใส่ชื่อ Template','warn'); return; }
    if(!draftItems.length){ toastMsg('กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ','warn'); return; }
    const old=templates.find(t=>t.id===editingId);
    const t={id:old?.id||uid(),name,items:[...new Set(draftItems)],createdAt:old?.createdAt||now(),updatedAt:now()};
    const idx=templates.findIndex(x=>x.id===t.id);
    if(idx>=0)templates[idx]=t; else templates.push(t);
    templates=mergeTemplates(templates);
    saveLocal(); renderTemplateSelect();
    const sel=document.getElementById('eaTemplateSelect'); if(sel)sel.value=t.id;
    updateButtons(); closeEditor();
    try{ const online=await pushOnline(); toastMsg(online?'บันทึก Custom Template Online แล้ว':'บันทึก Custom Template ในเครื่องแล้ว','success'); }
    catch(err){ toastMsg('บันทึก Template แล้ว แต่ Sync Online ยังไม่สำเร็จ','warn'); }
  }

  async function deleteTemplate(){
    const id=document.getElementById('eaTemplateSelect')?.value||'';
    const t=templates.find(x=>x.id===id); if(!t)return;
    if(!confirm(`ลบ Template “${t.name}” ?`))return;
    templates=templates.filter(x=>x.id!==id); saveLocal(); closeEditor(); renderTemplateSelect();
    try{ await pushOnline(); toastMsg('ลบ Template แล้ว','success'); }catch(_){ toastMsg('ลบในเครื่องแล้ว แต่ Sync Online ยังไม่สำเร็จ','warn'); }
  }

  async function applyTemplate(){
    const id=document.getElementById('eaTemplateSelect')?.value||'';
    const t=templates.find(x=>x.id===id); if(!t)return;
    document.getElementById('eaClearSelected')?.click();
    await wait(40);
    let applied=0;
    for(const key of t.items){
      const picker=document.getElementById('eaItemPicker');
      if(!picker || ![...picker.options].some(o=>o.value===key)) continue;
      picker.value=key;
      picker.dispatchEvent(new Event('change',{bubbles:true}));
      applied++;
      await wait(12);
    }
    toastMsg(`ใช้ Template “${t.name}” แล้ว ${applied}/${t.items.length} รายการ`,'success');
  }

  document.addEventListener('change',e=>{
    if(e.target?.id==='eaTemplateSelect'){ updateButtons(); return; }
  },true);

  document.addEventListener('input',e=>{
    if(e.target?.id==='eaTemplateItemSearch'){ renderItemSelect(); return; }
  },true);

  document.addEventListener('keydown',e=>{
    if(e.target?.id==='eaTemplateItemSearch' && e.key==='Enter'){
      e.preventDefault();
      addDraftItem();
    }
  },true);

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaTemplateNew')){ e.preventDefault(); openEditor(null); return; }
    if(e.target.closest?.('#eaTemplateEdit')){ e.preventDefault(); const id=document.getElementById('eaTemplateSelect')?.value||''; const t=templates.find(x=>x.id===id); if(t)openEditor(t); return; }
    if(e.target.closest?.('#eaTemplateDelete')){ e.preventDefault(); deleteTemplate(); return; }
    if(e.target.closest?.('#eaTemplateApply')){ e.preventDefault(); applyTemplate(); return; }
    if(e.target.closest?.('#eaTemplateAddItem')){ e.preventDefault(); addDraftItem(); return; }
    const rem=e.target.closest?.('[data-template-remove]');
    if(rem){ e.preventDefault(); draftItems=draftItems.filter(k=>k!==txt(rem.dataset.templateRemove)); renderEditorItems(); return; }
    if(e.target.closest?.('#eaTemplateSave')){ e.preventDefault(); saveTemplate(); return; }
    if(e.target.closest?.('#eaTemplateCancel')){ e.preventDefault(); closeEditor(); return; }
    if(e.target.closest?.('.nav button[data-page="expiryAudit"],#eaRefresh')) setTimeout(()=>{ensureUi();renderTemplateSelect();},180);
  },true);

  window.addEventListener('ksl-central-synced',()=>{ pullOnline(); setTimeout(()=>{ensureUi();renderTemplateSelect();},100); });

  function install(){
    installAttempts++;
    if(ensureUi()){
      pullOnline();
      renderTemplateSelect();
      return;
    }
    if(installAttempts<30) setTimeout(install,180);
  }

  templates=mergeTemplates(readLocal());
  install();
  console.info('[KSL] V6.3 Custom inspection templates + searchable item picker ready');
})();
