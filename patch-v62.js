/* KSL V6.2 — quiz entry fix + Standard Tea / Standard Coffee exam scope */
(() => {
  'use strict';
  if (window.__KSL_QUIZ_STORE_V62__) return;
  window.__KSL_QUIZ_STORE_V62__ = true;

  const STORE_TEA = 'Standard Tea';
  const STORE_COFFEE = 'Standard Coffee';
  window.__KSL_QUIZ_STORE_TYPE__ = '';

  const style = document.createElement('style');
  style.id = 'ksl-quiz-store-v62-style';
  style.textContent = `
    #quizLearnerInfo{display:block!important}
    .ksl-store-type-block{grid-column:1/-1;margin-top:2px}
    .ksl-store-type-title{font-size:12px;font-weight:900;color:#214b3b;margin:0 0 7px}
    .ksl-store-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .ksl-store-type-option{position:relative;display:block;cursor:pointer;margin:0!important}
    .ksl-store-type-option input{position:absolute;opacity:0;pointer-events:none}
    .ksl-store-type-card{display:block;min-height:82px;padding:12px 13px;border:2px solid #d9e8e1;border-radius:14px;background:#fff;transition:.16s ease;box-shadow:0 2px 8px rgba(25,87,62,.03)}
    .ksl-store-type-card strong{display:block;color:#174d38;font-size:13px;margin-bottom:3px}
    .ksl-store-type-card small{display:block;color:#6b8077;font-size:10.5px;line-height:1.45;font-weight:600}
    .ksl-store-type-option input:checked + .ksl-store-type-card{border-color:#188253;background:#eff9f4;box-shadow:0 0 0 3px rgba(24,130,83,.10)}
    .ksl-store-type-option input:checked + .ksl-store-type-card:after{content:'✓ เลือกแล้ว';display:inline-block;margin-top:6px;color:#137347;font-size:10px;font-weight:900}
    .ksl-quiz-rule-note{grid-column:1/-1;padding:9px 11px;border-radius:11px;background:#f7faf8;border:1px solid #e0ebe5;color:#60776d;font-size:10.5px;line-height:1.5}
    #kslQuizStoreBadge{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;background:#eef8f3;border:1px solid #d3e9df;color:#1e674b;font-size:10px;font-weight:900;margin:0 0 10px}
    @media(max-width:680px){.ksl-store-type-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function text(v){ return String(v ?? '').trim(); }
  function toastMsg(msg,type='warn'){
    try { if (typeof window.toast === 'function') return window.toast(msg,type); } catch (_) {}
    alert(msg);
  }

  function getState(){
    try { if (typeof appState !== 'undefined' && appState) return appState; } catch (_) {}
    return null;
  }

  function getDrinkRows(){
    const state = getState();
    if (!state) return [];
    const keys = ['beverageRecipes','drinkRecipes','beverageData','drinkData','drinks'];
    for (const key of keys) {
      if (Array.isArray(state[key]) && state[key].length) return state[key];
    }
    return [];
  }

  function coffeeMenuNames(){
    const set = new Set();
    for (const row of getDrinkRows()) {
      const cat = text(row?.Category ?? row?.category).toLowerCase();
      const menu = text(row?.Menu ?? row?.menu);
      if (menu && cat.includes('coffee')) set.add(menu.toLowerCase());
    }
    return [...set].sort((a,b)=>b.length-a.length);
  }

  const COFFEE_RE = /(กาแฟ|เอสเพรสโซ|คาปูชิโน|มอคค่า|มอคคา|มัคคิอาโต|ลอง\s*แบล็ค|ดัลโกนา|\bcoffee\b|\bespresso\b|\bcappuccino\b|\bmacchiato\b|\bmocha\b|\bmoccha\b|\blong\s*black\b|\bdalgona\b|\bawaken\s*sun\b|\bsignature\s*latte\b|\bthai\s*espresso\b)/i;

  function questionText(q){
    const opts = q?.options ?? q?.opts ?? q?.choices ?? q?.answers ?? [];
    const optionText = Array.isArray(opts) ? opts.map(o => {
      if (o && typeof o === 'object') return text(o.label ?? o.text ?? o.answer ?? o.value ?? o.name);
      return text(o);
    }).join(' ') : '';
    return [q?.q,q?.question,q?.correct,q?.answer,q?.kicker,q?.category,q?.menu,optionText].map(text).join(' ').toLowerCase();
  }

  function isCoffeeQuestion(q){
    const hay = questionText(q);
    if (!hay) return false;
    if (COFFEE_RE.test(hay)) return true;
    const names = coffeeMenuNames();
    return names.some(name => name.length >= 4 && hay.includes(name));
  }

  function filterForStore(rows){
    if (!Array.isArray(rows)) return [];
    if (window.__KSL_QUIZ_STORE_TYPE__ !== STORE_TEA) return rows;
    return rows.filter(q => !isCoffeeQuestion(q));
  }

  function wrapBank(name){
    const fn = window[name];
    if (typeof fn !== 'function' || fn.__kslStoreWrapped) return;
    const wrapped = function(){
      const rows = fn.apply(this, arguments);
      return filterForStore(rows);
    };
    wrapped.__kslStoreWrapped = true;
    wrapped.__kslStoreOriginal = fn;
    window[name] = wrapped;
    try { globalThis[name] = wrapped; } catch (_) {}
  }

  function wrapQuestionBanks(){
    ['buildHoldingQuestionBank','buildProductionQuestionBank','buildDrinkQuestionBank'].forEach(wrapBank);
  }

  function storeSelectorHtml(){
    return `
      <div class="ksl-store-type-block">
        <div class="ksl-store-type-title">ประเภทร้าน *</div>
        <div class="ksl-store-type-grid">
          <label class="ksl-store-type-option">
            <input type="radio" name="quizStoreType" value="${STORE_TEA}">
            <span class="ksl-store-type-card"><strong>1. Standard Tea</strong><small>แบบทดสอบมาตรฐานชา • ไม่รวมคำถามและเมนูกาแฟ</small></span>
          </label>
          <label class="ksl-store-type-option">
            <input type="radio" name="quizStoreType" value="${STORE_COFFEE}">
            <span class="ksl-store-type-card"><strong>2. Standard Coffee</strong><small>แบบทดสอบครบทุกหมวด • รวมชา สูตรผลิต สูตรชง และกาแฟ</small></span>
          </label>
        </div>
      </div>
      <div class="ksl-quiz-rule-note">เลือกประเภทร้านก่อนเริ่มทำแบบทดสอบ ระบบจะสร้างชุดข้อสอบตามมาตรฐานของร้านที่เลือกโดยอัตโนมัติ</div>`;
  }

  function installQuizForm(){
    const box = document.getElementById('quizLearnerInfo');
    if (!box) return false;

    // Build a clean form instead of depending on the old login gate.
    if (!document.getElementById('quizStoreTypeBlock')) {
      box.className = 'quiz-learner-form';
      box.style.textAlign = 'left';
      box.innerHTML = `
        <div class="section-head" style="margin-bottom:10px">
          <div><h3>👤 ข้อมูลผู้เข้าสอบ</h3><p>กรอกข้อมูลและเลือกประเภทร้านก่อนเริ่มทำแบบทดสอบ</p></div>
        </div>
        <div class="form-grid">
          <div class="field"><label>รหัสพนักงาน *</label><input id="quizEmpId" class="input" autocomplete="off" placeholder="เช่น 12345"></div>
          <div class="field"><label>สาขา *</label><input id="quizBranch" class="input" autocomplete="organization" placeholder="เช่น TBN"></div>
          <div class="field full"><label>ชื่อ-นามสกุล *</label><input id="quizName" class="input" autocomplete="name" placeholder="ชื่อผู้เข้าสอบ"></div>
          <div class="field full"><label>ตำแหน่ง</label><select id="quizPosition" class="select"><option value="">เลือกตำแหน่ง</option><option>Supervisor</option><option>Teamlead</option><option>Full Time</option><option>DVT</option><option>3 ม.</option><option>Part Time</option><option>อื่นๆ</option></select></div>
          <div id="quizStoreTypeBlock" class="ksl-store-type-block">${storeSelectorHtml()}</div>
        </div>`;
    }

    // Remove the nested duplicate class wrapper produced by the template above if any.
    const outer = document.getElementById('quizStoreTypeBlock');
    if (outer) {
      const inner = outer.querySelector(':scope > .ksl-store-type-block');
      if (inner) outer.replaceChildren(...inner.childNodes);
    }

    return true;
  }

  function selectedStoreType(){
    return text(document.querySelector('input[name="quizStoreType"]:checked')?.value);
  }

  function readLearner(){
    return {
      employeeId:text(document.getElementById('quizEmpId')?.value),
      name:text(document.getElementById('quizName')?.value),
      branch:text(document.getElementById('quizBranch')?.value),
      position:text(document.getElementById('quizPosition')?.value),
      storeType:selectedStoreType()
    };
  }

  function validateLearner(p){
    if (!p.employeeId) { toastMsg('กรุณากรอกรหัสพนักงาน'); document.getElementById('quizEmpId')?.focus(); return false; }
    if (!p.name) { toastMsg('กรุณากรอกชื่อ-นามสกุล'); document.getElementById('quizName')?.focus(); return false; }
    if (!p.branch) { toastMsg('กรุณากรอกสาขา'); document.getElementById('quizBranch')?.focus(); return false; }
    if (!p.storeType) { toastMsg('กรุณาเลือกประเภทร้าน Standard Tea หรือ Standard Coffee'); document.querySelector('input[name="quizStoreType"]')?.focus(); return false; }
    return true;
  }

  const existingStartQuiz = typeof window.startQuiz === 'function' ? window.startQuiz : null;

  window.startQuiz = function(){
    installQuizForm();
    wrapQuestionBanks();
    const p = readLearner();
    if (!validateLearner(p)) return false;

    window.__KSL_QUIZ_STORE_TYPE__ = p.storeType;
    const state = getState();
    if (state) state.profile = {...p};

    try {
      if (typeof existingStartQuiz !== 'function') throw new Error('ไม่พบฟังก์ชันเริ่มแบบทดสอบ');
      const out = existingStartQuiz.apply(this, arguments);
      if (out && typeof out.catch === 'function') {
        return out.catch(err => {
          console.error('[KSL V6.2] start quiz failed',err);
          toastMsg('เริ่มแบบทดสอบไม่สำเร็จ กรุณาลองอีกครั้ง','error');
          return false;
        });
      }
      setTimeout(showStoreBadge,80);
      return out;
    } catch (err) {
      console.error('[KSL V6.2] start quiz failed',err);
      toastMsg('เริ่มแบบทดสอบไม่สำเร็จ กรุณาลองอีกครั้ง','error');
      return false;
    }
  };
  window.startQuiz.__kslV62 = true;

  function showStoreBadge(){
    const game = document.getElementById('quizGame');
    if (!game || !window.__KSL_QUIZ_STORE_TYPE__) return;
    let badge = document.getElementById('kslQuizStoreBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'kslQuizStoreBadge';
      game.insertBefore(badge, game.firstChild);
    }
    badge.textContent = `ประเภทร้าน: ${window.__KSL_QUIZ_STORE_TYPE__}${window.__KSL_QUIZ_STORE_TYPE__ === STORE_TEA ? ' • ไม่รวมข้อสอบกาแฟ' : ' • ข้อสอบทุกหมวด'}`;
  }

  function fixQuizButtons(){
    const intro = document.getElementById('quizIntro');
    if (!intro) return;
    const buttons = [...intro.querySelectorAll('button')];
    buttons.forEach(btn => {
      const label = text(btn.textContent);
      const attr = text(btn.getAttribute('onclick'));
      if (/เข้าสู่ระบบ|เริ่ม.*ทดสอบ|เริ่ม.*สอบ/i.test(label) || /startQuiz|openLogin/i.test(attr)) {
        btn.textContent = 'เริ่มทำแบบทดสอบ';
        btn.removeAttribute('onclick');
        if (!btn.dataset.kslV62Start) {
          btn.dataset.kslV62Start = '1';
          btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            window.startQuiz();
          });
        }
      }
    });
  }

  // Any legacy "login" action from the quiz should return to the quiz form, not a hidden login modal.
  window.openLogin = function(){
    try { if (typeof goPage === 'function') goPage('quiz'); } catch (_) {}
    document.getElementById('loginGate')?.classList.remove('show');
    installQuizForm();
    fixQuizButtons();
    document.getElementById('quizEmpId')?.focus();
  };
  window.closeLogin = function(){ document.getElementById('loginGate')?.classList.remove('show'); };

  function resetStoreSelection(){
    window.__KSL_QUIZ_STORE_TYPE__ = '';
    document.querySelectorAll('input[name="quizStoreType"]').forEach(r => { r.checked = false; });
    document.getElementById('kslQuizStoreBadge')?.remove();
  }

  if (typeof window.prepareNewQuiz === 'function') {
    const basePrepare = window.prepareNewQuiz;
    window.prepareNewQuiz = function(){
      const out = basePrepare.apply(this,arguments);
      setTimeout(() => { installQuizForm(); resetStoreSelection(); fixQuizButtons(); },0);
      return out;
    };
  }

  function install(){
    document.getElementById('loginGate')?.classList.remove('show');
    installQuizForm();
    wrapQuestionBanks();
    fixQuizButtons();
  }

  install();
  [120,500,1200,3000].forEach(ms => setTimeout(install,ms));
  new MutationObserver(() => queueMicrotask(install)).observe(document.documentElement,{childList:true,subtree:true});

  console.info('[KSL] V6.2 quiz store type ready');
})();
