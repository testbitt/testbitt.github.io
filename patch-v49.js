/* KSL V4.9 — Banner + Balanced Theme */
(() => {
  'use strict';
  const BANNER_SRC='assets/kamu-banner.jpg?v=49';
  const css=`
  :root{
    --ksl-bg:#f6faf7;--ksl-surface:#fff;--ksl-primary:#2f8a66;
    --ksl-primary-dark:#194f3b;--ksl-text:#203a31;--ksl-muted:#6d8379;
    --ksl-border:#d2e7dc;--ksl-pink:#fff1f4;--ksl-yellow:#fff9df;
    --ksl-mint:#edf8f2;--ksl-shadow:0 10px 28px rgba(31,91,68,.08);
  }
  html,body{
    background:
      radial-gradient(circle at 8% 8%,rgba(245,213,220,.22),transparent 20%),
      radial-gradient(circle at 90% 5%,rgba(244,230,165,.22),transparent 22%),
      linear-gradient(180deg,#fbfdfb 0%,var(--ksl-bg) 100%)!important;
    color:var(--ksl-text)!important;
  }
  #home .ksl-v49-banner-wrap{width:100%;margin:0 0 18px}
  #home .ksl-v49-banner{
    width:100%;overflow:hidden;border-radius:26px;border:1px solid #cfe4d9;
    box-shadow:0 16px 36px rgba(30,84,56,.12);background:#79a842
  }
  #home .ksl-v49-banner img{
    display:block;width:100%;height:auto;aspect-ratio:2048/682;object-fit:cover
  }
  #home .ksl-v49-actions{
    display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:12px
  }
  #home .ksl-v49-actions .btn{
    min-height:46px;padding:10px 17px;border-radius:15px!important;font-weight:900!important;
    background:#fff!important;color:var(--ksl-primary-dark)!important;
    border:1px solid #b9dbc9!important;box-shadow:0 6px 18px rgba(31,91,68,.06)!important
  }
  #home .ksl-v49-actions .btn.primary{
    background:linear-gradient(135deg,var(--ksl-primary-dark),var(--ksl-primary))!important;
    color:#fff!important;border-color:transparent!important
  }
  #home .hero.ksl-v49-hidden,
  #home .hero-card.ksl-v49-hidden,
  #home .manga-hero.ksl-v49-hidden,
  #home > .card.hero.ksl-v49-hidden{display:none!important}

  .card,.panel,.manga-card,.lesson-card,.stat-card,.upload-card,.course-card{
    background:rgba(255,255,255,.95)!important;border-color:var(--ksl-border)!important;
    box-shadow:var(--ksl-shadow)!important
  }
  h1,h2,h3,h4,.page-title,.section-title{color:var(--ksl-primary-dark)!important}
  .muted,.page-subtitle,.small-note{color:var(--ksl-muted)!important}
  input,select,textarea,.input,.select{
    background:#fff!important;color:var(--ksl-text)!important;border-color:var(--ksl-border)!important
  }
  .btn-primary,button.btn-primary{
    background:linear-gradient(135deg,var(--ksl-primary-dark),var(--ksl-primary))!important;
    color:#fff!important;border-color:transparent!important
  }
  .btn-outline,button.btn-outline{
    background:#fff!important;color:var(--ksl-primary-dark)!important;border-color:#b9dbc9!important
  }
  .sidebar{background:linear-gradient(180deg,#154f3d,#0f6b4f 58%,#287c5e)!important}
  .nav button.active{background:rgba(255,255,255,.17)!important;color:#fff!important}
  #home .stat-card:nth-of-type(4n+1){background:linear-gradient(145deg,#fff,#f1faf5)!important}
  #home .stat-card:nth-of-type(4n+2){background:linear-gradient(145deg,#fff,#fff1f4)!important}
  #home .stat-card:nth-of-type(4n+3){background:linear-gradient(145deg,#fff,#eff8fc)!important}
  #home .stat-card:nth-of-type(4n+4){background:linear-gradient(145deg,#fff,#fff9df)!important}
  #expiryLabel,.expiry-paper,#expiryLabel .ep-mascot,.expiry-paper>.ep-mascot{background:#fff!important}
  @media(max-width:600px){
    #home .ksl-v49-banner{border-radius:16px}
    #home .ksl-v49-actions{display:grid;grid-template-columns:1fr}
    #home .ksl-v49-actions .btn{width:100%}
  }`;
  const style=document.createElement('style');style.id='ksl-v49-theme';style.textContent=css;document.head.appendChild(style);

  function callCourse(){
    if(typeof window.openCurriculum==='function') return window.openCurriculum('holding');
    if(typeof window.openLearningCourse==='function') return window.openLearningCourse('holding');
    if(typeof goPage==='function') goPage('data');
  }
  function callFlash(){
    if(typeof window.openFlashCenter==='function') return window.openFlashCenter('holding');
    if(typeof goPage==='function') goPage('learn');
  }
  function callQuiz(){ if(typeof goPage==='function') goPage('quiz'); }

  function makeBtn(html,cls,fn){
    const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');
    b.innerHTML=html;b.addEventListener('click',fn);return b;
  }
  function findHero(home){
    return home.querySelector(':scope > .hero,:scope > .hero-card,:scope > .manga-hero,:scope > .card.hero,.hero,.hero-card');
  }
  function install(){
    const home=document.getElementById('home');if(!home)return;
    if(home.querySelector('.ksl-v49-banner-wrap'))return;
    const wrap=document.createElement('section');wrap.className='ksl-v49-banner-wrap';
    const banner=document.createElement('div');banner.className='ksl-v49-banner';
    const img=document.createElement('img');img.src=BANNER_SRC;img.alt='Kamu Kamu';img.loading='eager';
    banner.appendChild(img);
    const actions=document.createElement('div');actions.className='ksl-v49-actions';
    actions.append(
      makeBtn('📚 เลือกหลักสูตร','primary',callCourse),
      makeBtn('🃏 Flash Card','',callFlash),
      makeBtn('📝 แบบทดสอบ 50 ข้อ','',callQuiz)
    );
    wrap.append(banner,actions);
    const hero=findHero(home);
    if(hero){hero.classList.add('ksl-v49-hidden');hero.before(wrap);}
    else home.prepend(wrap);
  }
  install();setTimeout(install,180);setTimeout(install,800);
})();