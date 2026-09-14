/* KSL V6.3 — inspection meta UX fix */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_INSPECTION_META_FIX_V63__) return;
  window.__KSL_EXPIRY_INSPECTION_META_FIX_V63__ = true;
  const txt=v=>String(v??'').trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const getMeta=()=>{try{return JSON.parse(localStorage.getItem('KSL_EXPIRY_INSPECTION_META_V63')||'{}')||{};}catch(_){return {};}};
  const setFields=(m={})=>{const a=document.getElementById('eaShiftEmployee'),b=document.getElementById('eaInspector');if(a)a.value=txt(m.shiftEmployee);if(b)b.value=txt(m.inspector);};
  const clearFields=()=>setFields({});
  function showPreviewMeta(){
    const modal=document.getElementById('eaHistoryModal');const id=txt(modal?.dataset.reportId);if(!modal||!id)return;
    const meta=getMeta()[id];if(!meta)return;
    const old=modal.querySelector('.eah-inspection-meta-preview');if(old)old.remove();
    const body=modal.querySelector('.eah-modal-body');if(!body)return;
    const box=document.createElement('div');box.className='eah-inspection-meta-preview';
    box.style.cssText='display:flex;gap:18px;flex-wrap:wrap;padding:9px 11px;margin:8px 0;border:1px solid #d8e8e0;border-radius:9px;background:#f8fcfa;font-size:11px;color:#526b60';
    box.innerHTML=`<span>พนักงานประจำกะ: <b>${esc(meta.shiftEmployee||'-')}</b></span><span>ชื่อผู้ตรวจ: <b>${esc(meta.inspector||'-')}</b></span>`;
    body.insertBefore(box,body.firstChild);
  }
  function installCustomCheckDeleteMenu(){
    const btn=document.getElementById('eaTemplateDelete');
    if(!btn)return false;
    btn.textContent='🗑 ลบข้อมูล';
    btn.title='ลบข้อมูล Custom Check ที่เลือก';
    btn.setAttribute('aria-label','ลบข้อมูล Custom Check ที่เลือก');
    return true;
  }
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaHistoryNew'))setTimeout(clearFields,80);
    if(e.target.closest?.('[data-eah-view]'))setTimeout(showPreviewMeta,120);
    if(e.target.closest?.('[data-eah-load]')){const id=e.target.closest('[data-eah-load]')?.dataset.eahLoad;setTimeout(()=>{const m=getMeta()[id];if(m)setFields(m);},450);}
    if(e.target.closest?.('#eaTemplateNew,#eaTemplateEdit,#eaTemplateApply,.nav button[data-page="expiryAudit"],#eaRefresh'))setTimeout(installCustomCheckDeleteMenu,120);
  },true);
  let tries=0;
  const timer=setInterval(()=>{tries++;if(installCustomCheckDeleteMenu()||tries>=40)clearInterval(timer);},150);
  console.info('[KSL] V6.3 inspection meta UX fix + Custom Check delete menu ready');
})();
