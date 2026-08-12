/* KSL V4.3 — Flash Card is a main menu; Holding Time opens the Holding Time database, not Flash Card. */
(() => {
  const style=document.createElement('style');
  style.textContent=`
    .nav-section-label{padding:12px 13px 5px;font-size:10px;font-weight:1000;letter-spacing:.9px;color:rgba(255,255,255,.58);text-transform:uppercase}
    .nav button[data-course-mode].active,.nav button[data-flash-center="1"].active{background:rgba(255,255,255,.16)!important;color:#fff!important}
    .flash-mode-switch{grid-template-columns:repeat(3,1fr)!important}
    @media(max-width:760px){.flash-mode-switch{grid-template-columns:1fr!important}.nav-section-label{display:none}}
  `;
  document.head.appendChild(style);

  function makeCourseButton(mode,icon,label){
    const b=document.createElement('button');
    b.type='button';b.dataset.courseMode=mode;
    b.innerHTML=`<span class="ico">${icon}</span><span class="label">${label}</span>`;
    b.addEventListener('click',()=>window.openCurriculum(mode));
    return b;
  }

  window.openCurriculum=function(mode){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.nav button[data-course-mode="${mode}"]`)?.classList.add('active');
    if(mode==='holding'){
      if(typeof goPage==='function') goPage('data');
      const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
      if(t)t.textContent='Holding Time';
      if(s)s.textContent='ค้นหาและตรวจสอบวันหมดอายุ สถานะ และจุดจัดเก็บของวัตถุดิบ';
      return;
    }
    if(typeof window.openCourseMenu==='function') window.openCourseMenu(mode==='drink'?'drink':'production');
    else{
      if(typeof goPage==='function')goPage('courses');
      if(typeof setCourseMode==='function')setCourseMode(mode==='drink'?'drink':'production');
    }
  };

  window.openFlashCenter=function(mode='holding'){
    if(typeof goPage==='function')goPage('learn');
    if(typeof setFlashMode==='function')setFlashMode(mode);
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('.nav button[data-flash-center="1"]')?.classList.add('active');
    const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
    if(t)t.textContent='Flash Card';
    if(s)s.textContent='เลือกทบทวน Holding Time, สูตรการผลิต หรือสูตรชงเครื่องดื่ม';
  };
  window.openFlashCourse=window.openFlashCenter;

  function installCurriculumNav(){
    const nav=document.querySelector('.nav');if(!nav)return;
    let prod=nav.querySelector('button[data-course-mode="production"]');
    let drink=nav.querySelector('button[data-course-mode="drink"]');
    let holding=nav.querySelector('button[data-course-mode="holding"]');
    if(!holding){
      holding=makeCourseButton('holding','⏳','Holding Time');
      (prod||drink||nav.querySelector('button[data-page="data"]')||nav.firstChild).before(holding);
    }
    let label=nav.querySelector('.nav-section-label');
    if(!label){label=document.createElement('div');label.className='nav-section-label';label.textContent='หลักสูตร';holding.before(label);}

    const dataBtn=nav.querySelector('button[data-page="data"]');
    if(dataBtn) dataBtn.style.display='none';

    const learn=nav.querySelector('button[data-page="learn"]');
    if(learn){
      learn.dataset.flashCenter='1';
      const ico=learn.querySelector('.ico'),lab=learn.querySelector('.label');
      if(ico)ico.textContent='🃏';if(lab)lab.textContent='Flash Card';
      const anchor=drink||prod||holding;
      if(anchor&&learn.previousElementSibling!==anchor)anchor.after(learn);
      if(learn.dataset.flashBound!=='43'){
        learn.dataset.flashBound='43';
        learn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.openFlashCenter(window.flashMode||'holding');},true);
      }
    }
  }

  function installThreeFlashModes(){
    const wrap=document.querySelector('.flash-mode-switch');if(!wrap)return;
    wrap.innerHTML=`
      <button id="flashModeHolding" type="button" onclick="openFlashCenter('holding')">⏳ Holding Time</button>
      <button id="flashModeProduction" type="button" onclick="openFlashCenter('production')">🧑‍🍳 สูตรการผลิต</button>
      <button id="flashModeDrink" type="button" onclick="openFlashCenter('drink')">🧋 สูตรชงเครื่องดื่ม</button>`;
    const desc=document.querySelector('.flash-head p');
    if(desc)desc.textContent='Flash Card แยก 3 เมนู • Holding Time • สูตรการผลิต • สูตรชงเครื่องดื่ม';
    if(typeof renderFlashCards==='function')renderFlashCards();
  }

  function removeInlineFlash(){
    document.querySelectorAll('.course-flash-actions').forEach(el=>el.remove());
    document.querySelectorAll('#data button,#data a').forEach(el=>{
      if(/Flash\s*Card/i.test(el.textContent||''))el.remove();
    });
  }

  function updateHome(){
    const btn=[...document.querySelectorAll('#home .hero-actions button')].find(b=>(b.textContent||'').includes('เลือกหลักสูตร'));
    if(btn){btn.onclick=()=>window.openCurriculum('holding');btn.innerHTML='📚 เลือกหลักสูตร';}
  }

  function boot(){installCurriculumNav();installThreeFlashModes();removeInlineFlash();updateHome();}
  boot();setTimeout(boot,180);setTimeout(boot,750);
})();
