/* Version 3.37 — Login only; disable public registration */
(()=>{
  function enforceLoginOnly(){
    const auth=document.querySelector('#cloudAuth');
    if(!auth)return;

    const regTab=auth.querySelector('.cloud-mode[data-mode="register"]');
    if(regTab)regTab.remove();

    const regForm=auth.querySelector('#cloudRegisterForm');
    if(regForm)regForm.remove();

    const modes=auth.querySelector('.cloud-modes');
    if(modes){
      modes.style.gridTemplateColumns='1fr 1fr';
      const login=modes.querySelector('.cloud-mode[data-mode="login"]');
      const admin=modes.querySelector('.cloud-mode[data-mode="admin"]');
      if(login)login.textContent='User Login';
      if(admin)admin.textContent='Admin';
    }

    const note=auth.querySelector('.cloud-note');
    if(note)note.innerHTML='บัญชีผู้ใช้งานสร้างและจัดการโดย Admin เท่านั้น • User แต่ละคนเห็นเฉพาะข้อมูลของตนเอง';

    const active=auth.querySelector('.cloud-mode.active');
    if(active?.dataset.mode==='register'){
      auth.querySelector('.cloud-mode[data-mode="login"]')?.click();
    }
  }

  const css=document.createElement('style');
  css.textContent='    #cloudAuth .cloud-modes{grid-template-columns:1fr 1fr!important}    #cloudAuth .cloud-mode[data-mode="register"],    #cloudAuth #cloudRegisterForm{display:none!important}    @media(max-width:640px){#cloudAuth .cloud-modes{grid-template-columns:1fr 1fr!important}}  ';
  document.head.appendChild(css);

  enforceLoginOnly();
  setTimeout(enforceLoginOnly,120);
  setTimeout(enforceLoginOnly,600);
  const obs=new MutationObserver(enforceLoginOnly);
  obs.observe(document.body,{childList:true,subtree:true});

  const v=document.querySelector('.version');
  if(v){
    const fresh=v.cloneNode(false);
    fresh.textContent='Version 3.37 • Public Multi‑User Cloud';
    v.replaceWith(fresh);
  }
})();