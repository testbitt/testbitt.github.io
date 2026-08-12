/* KSL V4.0 — make the 3 home learning cards open their matching courses. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #home .lesson-card.manga-card.ksl-course-link{
      cursor:pointer;
      position:relative;
      transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      outline:none;
    }
    #home .lesson-card.manga-card.ksl-course-link:hover,
    #home .lesson-card.manga-card.ksl-course-link:focus-visible{
      transform:translateY(-4px);
      border-color:#7fd0ae;
      box-shadow:0 16px 34px rgba(15,107,79,.14);
    }
    #home .lesson-card.manga-card.ksl-course-link::after{
      content:'เข้าเรียน →';
      display:inline-flex;
      align-items:center;
      margin-top:14px;
      padding:7px 11px;
      border-radius:999px;
      background:#effaf5;
      color:#0f6b4f;
      font-size:11px;
      font-weight:900;
      border:1px solid #cdeadd;
    }
  `;
  document.head.appendChild(style);

  window.openLearningCourse = function(type){
    if (type === 'holding') {
      if (typeof goPage === 'function') goPage('learn');
      if (typeof setFlashMode === 'function') setFlashMode('holding');
      return;
    }
    const mode = type === 'drink' ? 'drink' : 'production';
    if (typeof window.openCourseMenu === 'function') {
      window.openCourseMenu(mode);
    } else {
      if (typeof setCourseMode === 'function') setCourseMode(mode);
      if (typeof goPage === 'function') goPage('courses');
    }
  };

  function installHomeCourseLinks(){
    const cards = [...document.querySelectorAll('#home .lesson-card.manga-card')];
    cards.forEach(card => {
      const title = (card.querySelector('h4')?.textContent || '').trim();
      let type = '';
      if (/Holding\s*Time/i.test(title)) type = 'holding';
      else if (title.includes('สูตรการผลิต')) type = 'production';
      else if (title.includes('สูตรชงเครื่องดื่ม')) type = 'drink';
      if (!type || card.dataset.courseLinkReady === '1') return;
      card.dataset.courseLinkReady = '1';
      card.classList.add('ksl-course-link');
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`เข้าเรียน ${title}`);
      card.addEventListener('click', () => window.openLearningCourse(type));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.openLearningCourse(type);
        }
      });
    });
  }

  installHomeCourseLinks();
  setTimeout(installHomeCourseLinks, 200);
  setTimeout(installHomeCourseLinks, 800);
})();
