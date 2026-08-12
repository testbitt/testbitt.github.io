/* KSL V4.1 — move Holding Time into curriculum navigation + complete 3-mode Flash Card learning. */
(() => {
  const style=document.createElement('style');
  style.textContent=`
    .nav-section-label{padding:12px 13px 5px;font-size:10px;font-weight:1000;letter-spacing:.9px;color:rgba(255,255,255,.58);text-transform:uppercase}
    .nav button[data-course-mode].active{background:rgba(255,255,255,.16)!important;color:#fff!important}
    .course-flash-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}
    .course-flash-actions .btn{font-size:11px}
    .flash-mode-switch{grid-template-columns:repeat(3,1fr)!important}
    @media(max-width:760px){.flash-mode-switch{grid-template-columns:1fr!important}.nav-section-label{display:none}}
  `;
  document.head.appendChild(style);

  function makeCourseButton(mode,icon,label){
    const b=document.createElement('button');
    b.type='button'; b.dataset.courseMode=mode;
    b.innerHTML=`<span class="ico">${icon}</span><span class="label">${label}</span>`;
    b.addEventListener('click',()=>window.openCurriculum(mode));
    return b;
  }

  window.openCurriculum=function(mode){
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.nav button[data-course-mode="${mode}"]`)?.classList.add('active');
    if(mode==='holding'){
      if(typeof goPage==='function')goPage('learn');
      if(typeof setFlashMode==='function')setFlashMode('holding');
      const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
      if(t)t.textContent='หลักสูตร Holding Time';
      if(s)s.textContent='เรียนวันหมดอายุ สถานะ และจุดจัดเก็บของวัตถุดิบด้วย Flash Card';
      return;
    }
    if(typeof window.openCourseMenu==='function')window.openCourseMenu(mode);
    else{
      if(typeof goPage==='function')goPage('courses');
      if(typeof setCourseMode==='function')setCourseMode(mode==='drink'?'drink':'production');
    }
  };

  window.openFlashCourse=function(mode){
    if(typeof goPage==='function')goPage('learn');
    if(typeof setFlashMode==='function')setFlashMode(mode);
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('.nav button[data-flash-center="1"]')?.classList.add('active');
    const map={holding:['Flash Card • Holding Time','ทบทวนวันหมดอายุ สถานะ และจุดจัดเก็บ'],production:['Flash Card • สูตรการผลิต','ทบทวนวัตถุดิบ อุณหภูมิ เวลา Yield วิธีผลิต และอายุจัดเก็บ'],drink:['Flash Card • สูตรชงเครื่องดื่ม','ทบทวนส่วนผสม ปริมาณ ขั้นตอน และ Variant ของแต่ละเมนู']};
    const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
    if(t)t.textContent=map[mode]?.[0]||'Flash Card';
    if(s)s.textContent=map[mode]?.[1]||'เลือกประเภทการ์ดเพื่อทบทวน';
  };

  function installCurriculumNav(){
    const nav=document.querySelector('.nav'); if(!nav)return;
    const prod=nav.querySelector('button[data-course-mode="production"]');
    const drink=nav.querySelector('button[data-course-mode="drink"]');
    let holding=nav.querySelector('button[data-course-mode="holding"]');
    if(!holding){
      holding=makeCourseButton('holding','⏳','Holding Time');
      (prod||drink||nav.querySelector('button[data-page="data"]')||nav.firstChild).before(holding);
    }
    let label=nav.querySelector('.nav-section-label');
    if(!label){label=document.createElement('div');label.className='nav-section-label';label.textContent='หลักสูตร';holding.before(label);}

    const learn=nav.querySelector('button[data-page="learn"]');
    if(learn){
      learn.dataset.flashCenter='1';
      learn.querySelector('.ico')&&(learn.querySelector('.ico').textContent='🃏');
      learn.querySelector('.label')&&(learn.querySelector('.label').textContent='Flash Card');
      // Put Flash Card after the 3 curriculum buttons.
      const anchor=drink||prod||holding;
      if(anchor&&learn.previousElementSibling!==anchor)anchor.after(learn);
      learn.onclick=null;
      learn.addEventListener('click',()=>window.openFlashCourse(window.flashMode||'holding'));
    }

    // Holding Time database remains a reference/database page; rename to avoid duplicate curriculum meaning.
    const dataBtn=nav.querySelector('button[data-page="data"]');
    if(dataBtn){
      const lab=dataBtn.querySelector('.label'); if(lab)lab.textContent='ฐานข้อมูล Holding Time';
      const ico=dataBtn.querySelector('.ico'); if(ico)ico.textContent='🔎';
    }
  }

  function installThreeFlashModes(){
    const wrap=document.querySelector('.flash-mode-switch'); if(!wrap)return;
    wrap.innerHTML=`
      <button id="flashModeHolding" type="button" onclick="openFlashCourse('holding')">⏳ Holding Time</button>
      <button id="flashModeProduction" type="button" onclick="openFlashCourse('production')">🧑‍🍳 สูตรการผลิต</button>
      <button id="flashModeDrink" type="button" onclick="openFlashCourse('drink')">🧋 สูตรชงเครื่องดื่ม</button>`;
    const desc=document.querySelector('.flash-head p');
    if(desc)desc.textContent='Flash Card แยก 3 หลักสูตร • Holding Time • สูตรการผลิต • สูตรชงเครื่องดื่ม';
    if(typeof renderFlashCards==='function')renderFlashCards();
  }

  function addCourseFlashShortcut(){
    const hero=document.querySelector('#courses .course-hero'); if(!hero||hero.querySelector('.course-flash-actions'))return;
    const actions=document.createElement('div'); actions.className='course-flash-actions';
    actions.innerHTML=`<button class="btn btn-outline" type="button" onclick="openFlashCourse('production')">🃏 Flash Card สูตรการผลิต</button><button class="btn btn-outline" type="button" onclick="openFlashCourse('drink')">🃏 Flash Card สูตรชงเครื่องดื่ม</button>`;
    hero.querySelector('p')?.after(actions);
  }

  // Make the home course button open Holding Time as the first curriculum entry rather than the old combined page.
  function updateHome(){
    const courseHeroBtn=[...document.querySelectorAll('#home .hero-actions button')].find(b=>(b.textContent||'').includes('เลือกหลักสูตร'));
    if(courseHeroBtn){courseHeroBtn.onclick=()=>window.openCurriculum('holding');courseHeroBtn.innerHTML='📚 เลือกหลักสูตร';}
  }

  function boot(){installCurriculumNav();installThreeFlashModes();addCourseFlashShortcut();updateHome();}
  boot(); setTimeout(boot,180); setTimeout(boot,800);
})();
