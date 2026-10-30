/* Version 3.36 — KAMU KAMU brand logo */
(()=>{
  const LOGO='https://www.jobbkk.com/upload/employer/0A/ADA/00DADA/images/56026.png';

  function installLogo(){
    const brand=document.querySelector('.brand-icon');
    if(brand&&!brand.querySelector('.kamu-brand-logo')){
      brand.innerHTML='';
      const img=document.createElement('img');
      img.className='kamu-brand-logo';
      img.src=LOGO;
      img.alt='KAMU KAMU';
      img.referrerPolicy='no-referrer';
      img.loading='eager';
      brand.appendChild(img);
    }

    const loginIcon=document.querySelector('.cloud-logo i');
    if(loginIcon&&!loginIcon.querySelector('.kamu-login-logo')){
      loginIcon.textContent='';
      const img=document.createElement('img');
      img.className='kamu-login-logo';
      img.src=LOGO;
      img.alt='KAMU KAMU';
      img.referrerPolicy='no-referrer';
      loginIcon.appendChild(img);
    }

    let favicon=document.querySelector('link[rel="icon"]');
    if(!favicon){
      favicon=document.createElement('link');
      favicon.rel='icon';
      document.head.appendChild(favicon);
    }
    favicon.type='image/png';
    favicon.href=LOGO;
  }

  const css=document.createElement('style');
  css.textContent=`
    .brand-icon{
      width:78px!important;
      height:78px!important;
      padding:5px!important;
      border-radius:18px!important;
      background:#fff!important;
      overflow:hidden!important;
      display:grid!important;
      place-items:center!important;
      box-shadow:0 8px 24px rgba(0,0,0,.16)!important;
      flex:0 0 78px!important;
    }
    .brand-icon .kamu-brand-logo{
      display:block;
      width:100%;
      height:100%;
      object-fit:contain;
      border-radius:12px;
      background:#fff;
    }
    .cloud-logo i{
      width:62px!important;
      height:62px!important;
      padding:4px!important;
      background:#fff!important;
      border:1px solid #d5eadc;
      border-radius:16px!important;
      overflow:hidden;
      box-shadow:0 5px 16px rgba(23,101,62,.10);
    }
    .cloud-logo .kamu-login-logo{
      width:100%;
      height:100%;
      display:block;
      object-fit:contain;
      border-radius:11px;
    }
    @media(max-width:640px){
      .brand-icon{
        width:58px!important;
        height:58px!important;
        flex-basis:58px!important;
        border-radius:15px!important;
        padding:4px!important;
      }
      .cloud-logo i{
        width:54px!important;
        height:54px!important;
      }
    }
  `;
  document.head.appendChild(css);

  installLogo();
  setTimeout(installLogo,150);
  setTimeout(installLogo,700);
  setTimeout(installLogo,1500);
  document.addEventListener('kamu:data-ready',()=>setTimeout(installLogo,80));

  const v=document.querySelector('.version');
  if(v){
    const fresh=v.cloneNode(false);
    fresh.textContent='Version 3.36 • Public Multi‑User Cloud';
    v.replaceWith(fresh);
  }
})();