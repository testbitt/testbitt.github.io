/* KSL V4.3 — home cards open their matching main curriculum immediately. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #home .lesson-card.manga-card.ksl-course-link{
      cursor:pointer;position:relative;outline:none;
      transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
    }
    #home .lesson-card.manga-card.ksl-course-link:hover,
    #home .lesson-card.manga-card.ksl-course-link:focus-visible{
      transform:translateY(-4px);border-color:#65c69f;
      box-shadow:0 16px 34px rgba(15,107,79,.14);
    }
    #home .lesson-card.manga-card.ksl-course-link::after{
      content:'เข้าเมนู →';display:inline-flex;align-items:center;margin-top:12px;
      padding:7px 11px;border-radius:999px;background:#effaf5;color:#0f6b4f;
      font-size:11px;font-weight:900;border:1px solid #cdeadd;
    }
  `;
  document.head.appendChild(style);

  window.openLearningCourse = function(type){
    if (typeof window.openCurriculum === 'function') {
      window.openCurriculum(type === 'drink' ? 'drink' : type === 'production' ? 'production' : 'holding');
      return;
    }
    if (type === 'holding') {
      if (typeof goPage === 'function') goPage('data');
      return;
    }
    const mode = type === 'drink' ? 'drink' : 'production';
    if (typeof window.openCourseMenu === 'function') window.openCourseMenu(mode);
    else {
      if (typeof goPage === 'function') goPage('courses');
      if (typeof setCourseMode === 'function') setCourseMode(mode);
    }
  };

  function installHomeCourseLinks(){
    [...document.querySelectorAll('#home .lesson-card.manga-card')].forEach(card => {
      const title=(card.querySelector('h4')?.textContent||'').trim();
      let type='';
      if (/Holding\s*Time/i.test(title)) type='holding';
      else if (title.includes('สูตรการผลิต')) type='production';
      else if (title.includes('สูตรชงเครื่องดื่ม')) type='drink';
      if(!type) return;
      card.classList.add('ksl-course-link');
      card.setAttribute('role','button');card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`เปิด ${title}`);
      if(card.dataset.courseLinkReady==='43') return;
      card.dataset.courseLinkReady='43';
      card.addEventListener('click',()=>window.openLearningCourse(type));
      card.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();window.openLearningCourse(type);}
      });
    });
  }
  installHomeCourseLinks();
  setTimeout(installHomeCourseLinks,180);
  setTimeout(installHomeCourseLinks,700);
})();
