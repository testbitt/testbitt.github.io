/* KSL V3.9 — sidebar curriculum menus + separate production/drink flash cards + quiz-only employee details. */
(() => {
  const hideLegacyLogin = () => {
    const gate = document.getElementById('loginGate');
    if (gate) gate.classList.remove('show');
    const pill = document.getElementById('userPill');
    if (pill) pill.style.display = 'none';
    const strip = document.getElementById('resultProfileStrip');
    if (strip) { strip.innerHTML = ''; strip.style.display = 'none'; }
  };

  const ensureQuizForm = () => {
    const box = document.getElementById('quizLearnerInfo');
    if (!box) return;
    box.className = 'quiz-learner-form';
    box.style.textAlign = 'left';
    box.innerHTML = `
      <div class="section-head" style="margin-bottom:10px">
        <div><h3>👤 ข้อมูลผู้เข้าสอบ</h3><p>กรอกข้อมูลเฉพาะก่อนเริ่มทำแบบทดสอบ ใช้สำหรับผลสอบและใบประกาศของรอบนี้เท่านั้น</p></div>
      </div>
      <div class="form-grid">
        <div class="field"><label>รหัสพนักงาน *</label><input id="quizEmpId" class="input" autocomplete="off" placeholder="เช่น 12345"></div>
        <div class="field"><label>สาขา *</label><input id="quizBranch" class="input" autocomplete="organization" placeholder="เช่น TBN"></div>
        <div class="field full"><label>ชื่อ-นามสกุล *</label><input id="quizName" class="input" autocomplete="name" placeholder="ชื่อผู้เข้าสอบ"></div>
        <div class="field full"><label>ตำแหน่ง</label><select id="quizPosition" class="select"><option value="">เลือกตำแหน่ง</option><option>Supervisor</option><option>Teamlead</option><option>Full Time</option><option>DVT</option><option>3 ม.</option><option>Part Time</option><option>อื่นๆ</option></select></div>
      </div>`;
  };

  const style = document.createElement('style');
  style.textContent = `
    #loginGate,#userPill,#resultProfileStrip{display:none!important}
    .quiz-learner-form{margin:18px 0 14px;padding:16px;background:linear-gradient(135deg,#f5fcf8,#fff);border:2px solid #d9eee5;border-radius:18px;text-align:left}
    .course-mode-tabs{display:none!important}
    .flash-mode-switch{grid-template-columns:repeat(3,1fr)!important}
    .nav button[data-course-mode].active{background:rgba(255,255,255,.16);color:#fff}
    @media(max-width:760px){.flash-mode-switch{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  hideLegacyLogin();
  ensureQuizForm();

  window.openLogin = function(){ hideLegacyLogin(); };
  window.closeLogin = function(){ hideLegacyLogin(); };
  window.renderProfileUI = function(){
    const chip = document.getElementById('passChip');
    if (chip) chip.textContent = `ผ่าน ≥ ${Number(appState?.settings?.passScore || 80)}%`;
    hideLegacyLogin();
    if (!document.getElementById('quizEmpId')) ensureQuizForm();
  };

  const baseStartQuiz = window.startQuiz;
  if (typeof baseStartQuiz === 'function') {
    window.startQuiz = function(){
      const employeeId = safe(document.getElementById('quizEmpId')?.value);
      const name = safe(document.getElementById('quizName')?.value);
      const branch = safe(document.getElementById('quizBranch')?.value);
      const position = safe(document.getElementById('quizPosition')?.value);
      if (!employeeId || !name || !branch) {
        toast('กรุณากรอกรหัสพนักงาน ชื่อ-นามสกุล และสาขาให้ครบก่อนเริ่มสอบ','warn');
        document.getElementById(!employeeId ? 'quizEmpId' : !name ? 'quizName' : 'quizBranch')?.focus();
        return;
      }
      appState.profile = {employeeId,name,branch,position};
      return baseStartQuiz();
    };
  }

  const baseFinishQuiz = window.finishQuiz;
  if (typeof baseFinishQuiz === 'function') {
    window.finishQuiz = async function(){
      await baseFinishQuiz();
      appState.profile = null;
      if (typeof dbSet === 'function') await dbSet(appState);
      hideLegacyLogin();
      const resultBox = document.getElementById('quizResult');
      if (resultBox) {
        [...resultBox.querySelectorAll('button')].forEach(btn => {
          if ((btn.textContent || '').includes('ทำข้อสอบชุดใหม่')) btn.onclick = window.prepareNewQuiz;
        });
      }
    };
  }

  window.prepareNewQuiz = function(){
    appState.profile = null;
    ['quizEmpId','quizName','quizBranch'].forEach(id => { const e=document.getElementById(id); if(e)e.value=''; });
    const pos=document.getElementById('quizPosition'); if(pos)pos.value='';
    const intro=document.getElementById('quizIntro'), game=document.getElementById('quizGame'), result=document.getElementById('quizResult');
    if(intro) intro.style.display='block';
    if(game) game.style.display='none';
    if(result) result.style.display='none';
    document.getElementById('quizEmpId')?.focus();
  };

  const installSidebarCourses = () => {
    const nav = document.querySelector('.nav');
    if (!nav || nav.querySelector('[data-course-mode="production"]')) return;
    const legacy = nav.querySelector('button[data-page="courses"]');
    const make = (mode, icon, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.courseMode = mode;
      b.innerHTML = `<span class="ico">${icon}</span><span class="label">${label}</span>`;
      b.addEventListener('click', () => window.openCourseMenu(mode));
      return b;
    };
    const prod = make('production','🧑‍🍳','สูตรการผลิต');
    const drink = make('drink','🧋','สูตรชงเครื่องดื่ม');
    if (legacy) {
      legacy.before(prod,drink);
      legacy.remove();
    } else {
      const dataBtn = nav.querySelector('button[data-page="data"]');
      if (dataBtn) dataBtn.before(prod,drink); else nav.append(prod,drink);
    }
  };

  window.openCourseMenu = function(mode){
    if (typeof goPage === 'function') goPage('courses');
    if (typeof setCourseMode === 'function') setCourseMode(mode === 'drink' ? 'drink' : 'production');
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav button[data-course-mode="${mode === 'drink' ? 'drink' : 'production'}"]`)?.classList.add('active');
    const title=document.getElementById('pageTitle'), sub=document.getElementById('pageSubtitle');
    if(title) title.textContent=mode==='drink'?'สูตรชงเครื่องดื่ม':'สูตรการผลิต';
    if(sub) sub.textContent=mode==='drink'?'เลือกหมวด → เมนู → Variant → เรียนสูตรชง':'เลือกเมนู → Variant → เรียนวัตถุดิบ วิธีผลิต และ Holding Time';
  };

  const baseBuildMenuFlashGroups = typeof buildMenuFlashGroups === 'function' ? buildMenuFlashGroups : null;
  if (baseBuildMenuFlashGroups) {
    buildMenuFlashGroups = window.buildMenuFlashGroups = function(){
      const all = baseBuildMenuFlashGroups();
      if (flashMode === 'production') {
        const out={};
        Object.entries(all).forEach(([cat,items])=>{ if(cat.startsWith('🧑‍🍳')) out[cat]=items; });
        return out;
      }
      if (flashMode === 'drink') {
        const out={};
        Object.entries(all).forEach(([cat,items])=>{ if(!cat.startsWith('🧑‍🍳')) out[cat]=items; });
        return out;
      }
      return all;
    };
  }

  const installFlashModes = () => {
    const wrap=document.querySelector('.flash-mode-switch');
    if(!wrap) return;
    wrap.innerHTML=`
      <button id="flashModeHolding" class="active" type="button" onclick="setFlashMode('holding')">⏳ Holding Time</button>
      <button id="flashModeProduction" type="button" onclick="setFlashMode('production')">🧑‍🍳 สูตรการผลิต</button>
      <button id="flashModeDrink" type="button" onclick="setFlashMode('drink')">🧋 สูตรชงเครื่องดื่ม</button>`;
    const desc=document.querySelector('.flash-head p');
    if(desc) desc.textContent='เลือกทบทวน Holding Time, สูตรการผลิต หรือสูตรชงเครื่องดื่ม • ลองจำก่อน แล้วเปิดเฉลยทีละการ์ด';
  };

  setFlashMode = window.setFlashMode = function(mode){
    flashMode = ['production','drink'].includes(mode) ? mode : 'holding';
    flashCategory=''; flashItem=''; flashFlipped=false;
    renderFlashCards();
  };

  renderFlashCards = window.renderFlashCards = function(){
    document.getElementById('flashModeHolding')?.classList.toggle('active',flashMode==='holding');
    document.getElementById('flashModeProduction')?.classList.toggle('active',flashMode==='production');
    document.getElementById('flashModeDrink')?.classList.toggle('active',flashMode==='drink');
    if(flashMode==='holding') renderHoldingFlashCards(); else renderMenuFlashCards();
  };

  toggleFlashCard = window.toggleFlashCard = function(){
    flashFlipped=!flashFlipped;
    if(flashMode==='holding') renderActiveFlashCard(); else renderActiveMenuFlashCard();
  };

  moveFlash = window.moveFlash = function(step){
    const groups=flashMode==='holding'?buildFlashGroups():buildMenuFlashGroups();
    const items=groups[flashCategory]||[]; if(!items.length)return;
    let idx=items.findIndex(x=>x.name===flashItem);
    idx=(idx+step+items.length)%items.length;
    flashItem=items[idx].name; flashFlipped=false; renderFlashCards();
  };
  flashPrev = window.flashPrev = ()=>moveFlash(-1);
  flashNext = window.flashNext = ()=>moveFlash(1);
  flashRandom = window.flashRandom = function(){
    const groups=flashMode==='holding'?buildFlashGroups():buildMenuFlashGroups();
    const items=groups[flashCategory]||[]; if(!items.length)return;
    let idx=Math.floor(Math.random()*items.length);
    if(items.length>1&&items[idx].name===flashItem) idx=(idx+1)%items.length;
    flashItem=items[idx].name; flashFlipped=false; renderFlashCards();
  };

  const cleanup = async () => {
    hideLegacyLogin();
    ensureQuizForm();
    installSidebarCourses();
    installFlashModes();
    if (typeof appState !== 'undefined' && appState?.profile) {
      appState.profile = null;
      if (typeof dbSet === 'function') await dbSet(appState);
    }
    window.renderProfileUI?.();
    renderFlashCards?.();
  };
  cleanup();
  setTimeout(cleanup,150);
  setTimeout(cleanup,700);
})();
