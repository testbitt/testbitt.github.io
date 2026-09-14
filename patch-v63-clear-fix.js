/* KSL V6.3 — reliable clear current expiry audit */
(()=>{
  'use strict';
  if(window.__KSL_EXPIRY_CLEAR_FIX_V63__)return;
  window.__KSL_EXPIRY_CLEAR_FIX_V63__=true;

  const AUDIT_KEY='KSL_EXPIRY_AUDIT_V63';
  const FLOW_KEY='KSL_EXPIRY_FLOW_MULTI_V63';
  const SELECTED_KEY='KSL_EXPIRY_SELECTED_V632';
  const START_KEY='KSL_EXPIRY_START_V631';
  const META_KEY='KSL_EXPIRY_INSPECTION_META_V63';
  let bypass=false;

  const state=()=>{try{if(typeof appState!=='undefined'&&appState)return appState}catch(_){}return window.appState||null};
  const notify=(m,t='')=>{try{if(typeof toast==='function')return toast(m,t)}catch(_){}alert(m)};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function clearMetaDraft(){
    try{
      const m=JSON.parse(localStorage.getItem(META_KEY)||'{}')||{};
      delete m.__draft;
      delete m.__draftKey;
      localStorage.setItem(META_KEY,JSON.stringify(m));
    }catch(_){}
    const s=state();
    if(s?.expiryAuditMeta&&typeof s.expiryAuditMeta==='object'){
      delete s.expiryAuditMeta.__draft;
      delete s.expiryAuditMeta.__draftKey;
    }
  }

  function clearExtraCurrentState(){
    try{localStorage.setItem(FLOW_KEY,'{}')}catch(_){}
    try{localStorage.setItem(SELECTED_KEY,'[]')}catch(_){}
    try{localStorage.setItem(START_KEY,'{}')}catch(_){}
    clearMetaDraft();

    const s=state();
    if(s){
      s.expiryAudit={branch:'',checkedAt:'',entries:{},savedAt:''};
      s.expiryAuditCurrentInspection={};
    }

    document.getElementById('eaClearSelected')?.click();
    document.querySelectorAll('#eaFlowTplList input[type="checkbox"]:checked').forEach(el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}))});
    ['eaBranch','eaCheckedAt','eaShiftEmployee','eaInspector'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
    window.dispatchEvent(new CustomEvent('ksl-expiry-cleared'));
  }

  async function syncAndReload(){
    const s=state();
    if(s&&typeof dbSet==='function'){
      try{await Promise.resolve(dbSet(s));}catch(err){console.warn('[KSL] expiry clear online sync failed',err)}
    }
    await sleep(80);
    clearExtraCurrentState();
    notify('ล้างข้อมูลการตรวจปัจจุบันแล้ว','success');
    setTimeout(()=>location.reload(),120);
  }

  document.addEventListener('click',async e=>{
    const btn=e.target.closest?.('#eaClear');
    if(!btn||bypass)return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if(!window.confirm('ล้างข้อมูลผลตรวจวันหมดอายุทั้งหมดของหน้านี้หรือไม่?'))return;

    const originalConfirm=window.confirm;
    try{
      bypass=true;
      window.confirm=()=>true;
      btn.click();
    }finally{
      window.confirm=originalConfirm;
      bypass=false;
    }

    await sleep(30);
    clearExtraCurrentState();
    await syncAndReload();
  },true);

  console.info('[KSL] V6.3 expiry clear fix ready');
})();
