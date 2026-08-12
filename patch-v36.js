/* KSL V3.6 — employee details are collected only at exam start. */
(() => {
  const addQuizForm = () => {
    const box = document.getElementById('quizLearnerInfo');
    if (!box) return;
    box.className = 'quiz-learner-form';
    box.style.textAlign = 'left';
    box.innerHTML = `
      <div class="section-head" style="margin-bottom:10px">
        <div><h3>👤 ข้อมูลผู้เข้าสอบ</h3><p>กรอกเฉพาะก่อนเริ่มทำแบบทดสอบ ข้อมูลนี้ใช้สำหรับผลสอบและใบประกาศของรอบสอบนี้เท่านั้น</p></div>
      </div>
      <div class="form-grid">
        <div class="field"><label>รหัสพนักงาน *</label><input id="quizEmpId" class="input" autocomplete="off" placeholder="รหัสพนักงาน"></div>
        <div class="field"><label>สาขา *</label><input id="quizBranch" class="input" autocomplete="organization" placeholder="เช่น TBN"></div>
        <div class="field full"><label>ชื่อ-นามสกุล *</label><input id="quizName" class="input" autocomplete="name" placeholder="ชื่อผู้เข้าสอบ"></div>
        <div class="field full"><label>ตำแหน่ง</label><select id="quizPosition" class="select"><option value="">เลือกตำแหน่ง</option><option>Supervisor</option><option>Teamlead</option><option>Full Time</option><option>DVT</option><option>3 ม.</option><option>Part Time</option><option>อื่นๆ</option></select></div>
      </div>`;
  };

  const style = document.createElement('style');
  style.textContent = `.quiz-learner-form{margin:18px 0 14px;padding:16px;background:linear-gradient(135deg,#f5fcf8,#fff);border:2px solid #d9eee5;border-radius:18px;text-align:left}#resultProfileStrip{display:none!important}`;
  document.head.appendChild(style);

  document.getElementById('userPill')?.remove();
  document.getElementById('loginGate')?.classList.remove('show');
  addQuizForm();

  // Prevent the legacy global login/profile gate from appearing anywhere.
  window.openLogin = function(){ document.getElementById('loginGate')?.classList.remove('show'); };
  window.closeLogin = function(){ document.getElementById('loginGate')?.classList.remove('show'); };

  window.renderProfileUI = function(){
    const chip=document.getElementById('passChip');
    if(chip) chip.textContent=`ผ่าน ≥ ${Number(appState.settings?.passScore||80)}%`;
    const rp=document.getElementById('resultProfileStrip');
    if(rp){rp.innerHTML='';rp.style.display='none'}
    if(!document.getElementById('quizEmpId')) addQuizForm();
  };

  // Clear any learner profile saved by older versions. Exam history is preserved.
  const originalRefreshAll = window.refreshAll;
  if(typeof originalRefreshAll === 'function'){
    window.refreshAll = function(){
      const hadProfile = !!appState.profile;
      appState.profile = null;
      const out = originalRefreshAll();
      document.getElementById('userPill')?.remove();
      document.getElementById('loginGate')?.classList.remove('show');
      addQuizForm();
      if(hadProfile && typeof dbSet === 'function') dbSet(appState);
      return out;
    };
  }

  const originalStartQuiz = window.startQuiz;
  window.startQuiz = function(){
    const employeeId=safe(document.getElementById('quizEmpId')?.value);
    const name=safe(document.getElementById('quizName')?.value);
    const branch=safe(document.getElementById('quizBranch')?.value);
    const position=safe(document.getElementById('quizPosition')?.value);
    if(!employeeId||!name||!branch){
      toast('กรุณากรอกรหัสพนักงาน ชื่อ-นามสกุล และสาขาให้ครบก่อนเริ่มสอบ','warn');
      return;
    }
    appState.profile={employeeId,name,branch,position};
    const out=originalStartQuiz();
    setTimeout(()=>{
      const game=document.getElementById('quizGame');
      if(!game || game.style.display==='none') appState.profile=null;
    },0);
    return out;
  };

  window.prepareNewQuiz = function(){
    appState.profile=null;
    ['quizEmpId','quizName','quizBranch'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
    const pos=document.getElementById('quizPosition'); if(pos)pos.value='';
    const intro=document.getElementById('quizIntro'), game=document.getElementById('quizGame'), result=document.getElementById('quizResult');
    if(intro)intro.style.display='block'; if(game)game.style.display='none'; if(result)result.style.display='none';
    document.getElementById('quizEmpId')?.focus();
  };

  const originalFinishQuiz = window.finishQuiz;
  window.finishQuiz = async function(){
    await originalFinishQuiz();
    // Result has already copied the learner details. Do not retain a global employee profile.
    appState.profile=null;
    if(typeof dbSet==='function') await dbSet(appState);
    const resultBox=document.getElementById('quizResult');
    if(resultBox){
      [...resultBox.querySelectorAll('button')].forEach(btn=>{
        if((btn.textContent||'').includes('ทำข้อสอบชุดใหม่')){
          btn.setAttribute('onclick','prepareNewQuiz()');
        }
      });
    }
    document.getElementById('userPill')?.remove();
    document.getElementById('loginGate')?.classList.remove('show');
  };

  // If init() from the base app resumes after this patch, openLogin is already disabled.
  setTimeout(()=>{
    document.getElementById('userPill')?.remove();
    document.getElementById('loginGate')?.classList.remove('show');
    if(appState.profile){appState.profile=null;if(typeof dbSet==='function')dbSet(appState)}
    addQuizForm();
    window.renderProfileUI();
  },250);
})();
