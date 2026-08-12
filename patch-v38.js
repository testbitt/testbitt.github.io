/* KSL V3.8 — no employee login before using the library. Employee details only at quiz start. */
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
  style.textContent = `#loginGate,#userPill,#resultProfileStrip{display:none!important}.quiz-learner-form{margin:18px 0 14px;padding:16px;background:linear-gradient(135deg,#f5fcf8,#fff);border:2px solid #d9eee5;border-radius:18px;text-align:left}`;
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

  const baseFinishQuiz = window.finishQuiz;
  window.finishQuiz = async function(){
    await baseFinishQuiz();
    appState.profile = null;
    if (typeof dbSet === 'function') await dbSet(appState);
    hideLegacyLogin();
    const resultBox = document.getElementById('quizResult');
    if (resultBox) {
      [...resultBox.querySelectorAll('button')].forEach(btn => {
        if ((btn.textContent || '').includes('ทำข้อสอบชุดใหม่')) {
          btn.onclick = window.prepareNewQuiz;
        }
      });
    }
  };

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

  const cleanup = async () => {
    hideLegacyLogin();
    ensureQuizForm();
    if (typeof appState !== 'undefined' && appState?.profile) {
      appState.profile = null;
      if (typeof dbSet === 'function') await dbSet(appState);
    }
    window.renderProfileUI?.();
  };
  setTimeout(cleanup, 100);
  setTimeout(cleanup, 700);
})();
