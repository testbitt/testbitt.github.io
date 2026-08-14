/* KSL V4.7 — the 3 home course cards link directly to their own curriculum. */
(() => {
  'use strict';

  if (window.__KSL_HOME_DIRECT_V47__) return;
  window.__KSL_HOME_DIRECT_V47__ = true;

  const style = document.createElement('style');
  style.id = 'ksl-home-direct-v47-style';
  style.textContent = `
    #home .lesson-card.manga-card.ksl-course-link{
      cursor:pointer!important;
      position:relative;
      outline:none;
      transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
      user-select:none;
    }
    #home .lesson-card.manga-card.ksl-course-link:hover,
    #home .lesson-card.manga-card.ksl-course-link:focus-visible{
      transform:translateY(-4px);
      border-color:#65c69f!important;
      box-shadow:0 16px 34px rgba(15,107,79,.14)!important;
    }
    #home .lesson-card.manga-card.ksl-course-link::after{
      content:'เข้าเรียน →';
      display:inline-flex;
      align-items:center;
      margin-top:12px;
      padding:7px 11px;
      border-radius:999px;
      background:#effaf5;
      color:#0f6b4f;
      font-size:11px;
      font-weight:900;
      border:1px solid #cdeadd;
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);

  function detectType(card){
    if (!card) return '';
    if (card.dataset.courseTarget) return card.dataset.courseTarget;

    const heading = card.querySelector('h1,h2,h3,h4,h5,h6');
    const title = (heading?.textContent || card.textContent || '').replace(/\s+/g,' ').trim();

    if (/Holding\s*Time/i.test(title)) return 'holding';
    if (title.includes('สูตรการผลิต')) return 'production';
    if (title.includes('สูตรชงเครื่องดื่ม')) return 'drink';
    return '';
  }

  function route(type){
    const mode = type === 'drink' ? 'drink' : type === 'production' ? 'production' : 'holding';

    // openCurriculum is the canonical router installed by patch-v41.
    if (typeof window.openCurriculum === 'function') {
      window.openCurriculum(mode);
      return;
    }

    // Fallbacks keep the cards functional even if curriculum patch loads a moment later.
    if (mode === 'holding') {
      if (typeof goPage === 'function') goPage('data');
      return;
    }

    if (typeof window.openCourseMenu === 'function') {
      window.openCourseMenu(mode);
      return;
    }

    if (typeof goPage === 'function') goPage('courses');
    if (typeof setCourseMode === 'function') setCourseMode(mode);
  }

  window.openLearningCourse = route;

  function decorateCards(){
    const cards = [...document.querySelectorAll('#home .lesson-card.manga-card')];

    cards.forEach(card => {
      const type = detectType(card);
      if (!type) return;

      card.dataset.courseTarget = type;
      card.classList.add('ksl-course-link');
      card.setAttribute('role','link');
      card.setAttribute('tabindex','0');

      const names = {
        holding:'Holding Time',
        production:'สูตรการผลิต',
        drink:'สูตรชงเครื่องดื่ม'
      };
      card.setAttribute('aria-label',`เข้าเรียน ${names[type]}`);
    });
  }

  // Capture phase deliberately wins over any legacy click listener on these cards.
  document.addEventListener('click', event => {
    const card = event.target.closest?.('#home .lesson-card.manga-card.ksl-course-link');
    if (!card) return;

    const type = detectType(card);
    if (!type) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    route(type);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const card = event.target.closest?.('#home .lesson-card.manga-card.ksl-course-link');
    if (!card) return;

    const type = detectType(card);
    if (!type) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    route(type);
  }, true);

  decorateCards();
  setTimeout(decorateCards, 150);
  setTimeout(decorateCards, 600);
  setTimeout(decorateCards, 1400);

  console.info('[KSL] Home direct course links V4.7 ready');
})();
