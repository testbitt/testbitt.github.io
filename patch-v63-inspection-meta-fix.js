/* KSL V6.3 — inspection meta UX fix */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_INSPECTION_META_FIX_V63__) return;
  window.__KSL_EXPIRY_INSPECTION_META_FIX_V63__ = true;
  const txt=v=>String(v??'').trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const HISTORY_KEY='KSL_EXPIRY_HISTORY_V635';
  const META_KEY='KSL_EXPIRY_INSPECTION_META_V63';
  const getMeta=()=>{try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{};}catch(_){return {};}};
  const setFields=(m={})=>{const a=document.getElementById('eaShiftEmployee'),b=document.getElementById('eaInspector');if(a)a.value=txt(m.shiftEmployee);if(b)b.value=txt(m.inspector);};
  const clearFields=()=>setFields({});
  const state=()=>{try{if(typeof appState!=='undefined'&&appState)return appState;}catch(_){}return window.appState||null;};
  const toastMsg=(msg,type='')=>{try{if(typeof toast==='function')return toast(msg,type);}catch(_){}alert(msg);};

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

  function ensureDeleteStyle(){
    if(document.getElementById('ksl-history-delete-v63-style'))return;
    const s=document.createElement('style');s.id='ksl-history-delete-v63-style';s.textContent=`
      #expiryAudit .eah-actions .eah-delete-btn{color:#9d2f2f!important;border-color:#e8bcbc!important;background:#fff8f8!important}
      #expiryAudit .eah-actions .eah-delete-btn:hover{background:#fff0f0!important;border-color:#d99191!important}
      #eaHistoryModal .eah-delete-btn{color:#9d2f2f!important;border-color:#e8bcbc!important;background:#fff8f8!important}
    `;document.head.appendChild(s);
  }

  function installHistoryDeleteButtons(){
    ensureDeleteStyle();
    const body=document.getElementById('eaHistoryBody');
    if(body){
      body.querySelectorAll('tr[data-history-id]').forEach(tr=>{
        const id=txt(tr.dataset.historyId);const actions=tr.querySelector('.eah-actions');
        if(!id||!actions||actions.querySelector('[data-eah-delete]'))return;
        const b=document.createElement('button');b.type='button';b.className='btn btn-outline eah-delete-btn';b.dataset.eahDelete=id;b.textContent='ลบ';b.title='ลบรายงานนี้';
        actions.appendChild(b);
      });
      if(!body.dataset.eahDeleteObserved){
        body.dataset.eahDeleteObserved='1';
        new MutationObserver(()=>queueMicrotask(installHistoryDeleteButtons)).observe(body,{childList:true,subtree:true});
      }
    }
    const modal=document.getElementById('eaHistoryModal');const actions=modal?.querySelector('.eah-modal-actions');
    if(actions&&!actions.querySelector('[data-eah-delete-modal]')){
      const b=document.createElement('button');b.type='button';b.className='btn btn-outline eah-delete-btn';b.setAttribute('data-eah-delete-modal','1');b.textContent='🗑 ลบรายงาน';
      actions.insertBefore(b,actions.firstChild);
    }
    return !!body;
  }

  function readHistory(){try{const v=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
  function removeFromLocal(id){
    const rows=readHistory().filter(r=>txt(r?.id)!==id);
    try{localStorage.setItem(HISTORY_KEY,JSON.stringify(rows));}catch(_){}
    try{const meta=getMeta();delete meta[id];localStorage.setItem(META_KEY,JSON.stringify(meta));}catch(_){}
  }
  function removeFromState(id){
    const s=state();if(!s)return null;
    if(Array.isArray(s.expiryAuditHistory))s.expiryAuditHistory=s.expiryAuditHistory.filter(r=>txt(r?.id)!==id);
    if(s.expiryAuditMeta&&typeof s.expiryAuditMeta==='object')delete s.expiryAuditMeta[id];
    return s;
  }
  function removeHistoryRow(id){
    document.querySelector(`#eaHistoryBody tr[data-history-id="${CSS.escape(id)}"]`)?.remove();
    const count=document.getElementById('eaHistoryCount');const n=document.querySelectorAll('#eaHistoryBody tr[data-history-id]').length;if(count)count.textContent=`${n} รายงาน`;
  }

  async function deleteHistoryReport(id){
    id=txt(id);if(!id)return;
    const all=readHistory();const report=all.find(r=>txt(r?.id)===id)||state()?.expiryAuditHistory?.find?.(r=>txt(r?.id)===id);
    const branch=txt(report?.branch)||'-';
    if(!window.confirm(`ยืนยันลบรายงานนี้หรือไม่?\n\nสาขา: ${branch}\nReport ID: ${id}\n\nเมื่อลบแล้วจะไม่แสดงในประวัติรายงานผลตรวจ`))return;
    removeFromLocal(id);const s=removeFromState(id);removeHistoryRow(id);
    const modal=document.getElementById('eaHistoryModal');if(modal?.dataset.reportId===id)modal.classList.remove('open');
    try{
      if(!s||typeof dbSet!=='function')throw new Error('ยังไม่พบการเชื่อมต่อฐานข้อมูล Online');
      const online=document.getElementById('eaHistoryOnline');if(online)online.textContent='↻ กำลังลบ Online...';
      await Promise.resolve(dbSet(s));
      removeFromLocal(id);removeFromState(id);
      toastMsg('ลบรายงานและ Sync Online แล้ว','success');
      setTimeout(()=>location.reload(),350);
    }catch(err){
      toastMsg('ลบออกจากเครื่องแล้ว แต่ Sync Online ยังไม่สำเร็จ: '+(err?.message||err),'warn');
      installHistoryDeleteButtons();
    }
  }

  document.addEventListener('click',e=>{
    const del=e.target.closest?.('[data-eah-delete]');if(del){e.preventDefault();e.stopPropagation();deleteHistoryReport(del.dataset.eahDelete);return;}
    const delModal=e.target.closest?.('[data-eah-delete-modal]');if(delModal){e.preventDefault();e.stopPropagation();const id=document.getElementById('eaHistoryModal')?.dataset.reportId;if(id)deleteHistoryReport(id);return;}
    if(e.target.closest?.('#eaHistoryNew'))setTimeout(clearFields,80);
    if(e.target.closest?.('[data-eah-view]'))setTimeout(()=>{showPreviewMeta();installHistoryDeleteButtons();},120);
    if(e.target.closest?.('[data-eah-load]')){const id=e.target.closest('[data-eah-load]')?.dataset.eahLoad;setTimeout(()=>{const m=getMeta()[id];if(m)setFields(m);},450);}
    if(e.target.closest?.('#eaTemplateNew,#eaTemplateEdit,#eaTemplateApply,.nav button[data-page="expiryAudit"],#eaRefresh,#eaHistorySync'))setTimeout(()=>{installCustomCheckDeleteMenu();installHistoryDeleteButtons();},120);
  },true);
  window.addEventListener('ksl-central-synced',()=>setTimeout(installHistoryDeleteButtons,100));

  let tries=0;
  const timer=setInterval(()=>{tries++;const a=installCustomCheckDeleteMenu(),b=installHistoryDeleteButtons();if((a&&b)||tries>=50)clearInterval(timer);},150);
  console.info('[KSL] V6.3 inspection meta UX fix + Custom Check delete + history delete ready');
})();
