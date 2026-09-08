/* Version 3.3 — Clean Login / Register / Admin layout */
(()=>{
  const css=document.createElement('style');
  css.textContent=`
  .cloud-auth{overflow:auto!important;align-items:center!important;justify-items:center!important;padding:24px 14px!important}
  .cloud-login{width:min(500px,calc(100vw - 28px))!important;max-width:500px!important;padding:24px!important;border-radius:24px!important;box-sizing:border-box!important;overflow:visible!important}
  .cloud-logo{display:grid!important;grid-template-columns:52px minmax(0,1fr)!important;gap:12px!important;align-items:center!important;margin:0 0 20px!important}
  .cloud-logo i{width:52px!important;height:52px!important;min-width:52px!important}
  .cloud-logo h2{font-size:21px!important;line-height:1.25!important;margin:0!important;white-space:normal!important;overflow-wrap:anywhere!important}
  .cloud-logo p{font-size:12px!important;line-height:1.4!important;margin:4px 0 0!important;white-space:normal!important}
  .cloud-modes{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important;margin:0 0 18px!important}
  .cloud-mode{width:100%!important;min-width:0!important;min-height:44px!important;height:auto!important;padding:9px 8px!important;border-radius:12px!important;line-height:1.25!important;font-size:12px!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:center!important;display:flex!important;align-items:center!important;justify-content:center!important}
  .cloud-form{display:grid!important;grid-template-columns:1fr!important;gap:13px!important;width:100%!important;margin:0!important;padding:0!important}
  .cloud-form[hidden]{display:none!important}
  .cloud-form label{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;margin:0!important;padding:0!important;font-size:12px!important;line-height:1.3!important;white-space:normal!important}
  .cloud-form input{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:46px!important;min-height:46px!important;margin:0!important;padding:10px 12px!important;line-height:24px!important;font-size:16px!important;border-radius:12px!important;box-sizing:border-box!important}
  .cloud-submit{width:100%!important;min-height:46px!important;margin:2px 0 0!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:normal!important}
  .cloud-auth-msg{width:100%!important;min-height:0!important;margin:10px 0 0!important;line-height:1.45!important;white-space:normal!important;overflow-wrap:anywhere!important}
  .cloud-auth-msg:empty{display:none!important}
  .cloud-note{display:none!important}
  @media(max-width:520px){
    .cloud-auth{padding:12px 8px!important;align-items:start!important}
    .cloud-login{width:calc(100vw - 16px)!important;padding:16px!important;border-radius:18px!important;margin:8px 0!important}
    .cloud-logo{grid-template-columns:44px minmax(0,1fr)!important;gap:9px!important;margin-bottom:15px!important}
    .cloud-logo i{width:44px!important;height:44px!important;min-width:44px!important;font-size:20px!important}
    .cloud-logo h2{font-size:17px!important}
    .cloud-logo p{font-size:10.5px!important}
    .cloud-modes{grid-template-columns:1fr!important;gap:6px!important;margin-bottom:14px!important}
    .cloud-mode{min-height:42px!important;font-size:13px!important;padding:9px 10px!important}
    .cloud-form{gap:11px!important}
    .cloud-form input{height:45px!important;min-height:45px!important}
  }
  `;
  document.head.appendChild(css);
  const apply=()=>{
    const reg=document.querySelector('.cloud-mode[data-mode="register"]');
    if(reg)reg.textContent='ลงทะเบียนเข้าใช้งาน';
    const form=document.querySelector('#cloudRegisterForm');
    const submit=form?.querySelector('button[type="submit"]');
    if(submit)submit.textContent='ลงทะเบียนและเข้าใช้งาน';
    document.querySelectorAll('.cloud-note').forEach(el=>el.remove());
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();
