/* KSL V4.8 — lock Data Management using the admin code already present in the base app. */
(() => {
  'use strict';

  let pendingControl = null;
  let bypassOnce = false;

  function readAdminCodeFromBaseApp(){
    try{
      const fn = typeof window.confirmClear === 'function' ? window.confirmClear : null;
      if(!fn) return '';
      const src = Function.prototype.toString.call(fn);
      const nearClear = src.match(/clearCode[\s\S]{0,220}?(\d{4})/);
      if(nearClear) return nearClear[1];
      const anyFour = src.match(/['"](\d{4})['"]/);
      return anyFour ? anyFour[1] : '';
    }catch(_){ return ''; }
  }

  const style=document.createElement('style');
  style.textContent=`
    #kslManageGate{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(12,45,35,.42);backdrop-filter:blur(7px)}
    #kslManageGate.show{display:flex}
    #kslManageGate .gate-card{width:min(430px,100%);background:#fff;border:1px solid #d8e8e1;border-radius:22px;padding:24px;box-shadow:0 26px 80px rgba(8,46,34,.24);box-sizing:border-box}
    #kslManageGate .gate-icon{width:52px;height:52px;border-radius:16px;background:#eaf8f2;display:grid;place-items:center;font-size:25px;margin-bottom:13px}
    #kslManageGate h3{margin:0 0 6px;color:#12372b;font-size:20px}
    #kslManageGate p{margin:0 0 16px;color:#62786f;font-size:13px;line-height:1.6}
    #kslManageGate label{display:block;margin-bottom:7px;color:#294d40;font-size:12px;font-weight:800}
    #kslManageInput{width:100%;height:48px;border:1.5px solid #cfe3db;border-radius:13px;padding:0 14px;box-sizing:border-box;font:inherit;font-size:18px;letter-spacing:.18em;outline:none;background:#fbfdfc;color:#12372b}
    #kslManageInput:focus{border-color:#16835f;box-shadow:0 0 0 4px rgba(22,131,95,.10)}
    #kslManageError{min-height:19px;margin-top:7px;color:#b4232c;font-size:12px;font-weight:800}
    #kslManageGate .gate-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:13px}
    #kslManageGate button{min-height:42px;border-radius:12px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer}
    #kslManageCancel{background:#fff;border:1px solid #d7e5df;color:#31584a}
    #kslManageOK{background:#0f7a58;border:1px solid #0f7a58;color:#fff}
  `;
  document.head.appendChild(style);

  const modal=document.createElement('div');
  modal.id='kslManageGate';
  modal.innerHTML=`<div class="gate-card"><div class="gate-icon">🔐</div><h3>ยืนยันสิทธิ์เข้าหน้าจัดการข้อมูล</h3><p>กรอกรหัสผ่านเพื่อเปิดหน้าจัดการข้อมูล</p><label for="kslManageInput">รหัสผ่าน</label><input id="kslManageInput" type="password" inputmode="numeric" autocomplete="off" placeholder="••••"><div id="kslManageError"></div><div class="gate-actions"><button id="kslManageCancel" type="button">ยกเลิก</button><button id="kslManageOK" type="button">ยืนยัน</button></div></div>`;
  document.body.appendChild(modal);

  const input=modal.querySelector('#kslManageInput');
  const error=modal.querySelector('#kslManageError');

  function isManageControl(el){
    const c=el?.closest?.('button,a,[role="button"],[data-page],[data-section]');
    if(!c) return false;
    const page=(c.getAttribute('data-page')||c.getAttribute('data-section')||'').toLowerCase();
    const href=c.getAttribute('href')||'';
    const label=(c.textContent||'').replace(/\s+/g,' ').trim();
    return page==='manage'||page==='management'||page==='admin'||/#manage(?:$|\b)/i.test(href)||label.includes('จัดการข้อมูล');
  }

  function openGate(control){
    pendingControl=control||null;
    input.value=''; error.textContent='';
    modal.classList.add('show');
    setTimeout(()=>input.focus(),40);
  }
  function closeGate(){ modal.classList.remove('show'); input.value=''; error.textContent=''; }
  function approve(){
    const expected=readAdminCodeFromBaseApp();
    if(!expected){ error.textContent='ไม่พบรหัสผู้ดูแลในระบบ'; return; }
    if(input.value!==expected){ error.textContent='รหัสผ่านไม่ถูกต้อง'; input.select(); return; }
    const c=pendingControl; pendingControl=null; closeGate();
    if(c){ bypassOnce=true; c.click(); setTimeout(()=>{bypassOnce=false},0); }
  }

  modal.querySelector('#kslManageOK').addEventListener('click',approve);
  modal.querySelector('#kslManageCancel').addEventListener('click',()=>{pendingControl=null;closeGate()});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();approve()}else if(e.key==='Escape'){pendingControl=null;closeGate()}});

  document.addEventListener('click',e=>{
    if(!isManageControl(e.target)) return;
    if(bypassOnce) return;
    const c=e.target.closest('button,a,[role="button"],[data-page],[data-section]');
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    openGate(c);
  },true);

  function scrub(){
    document.querySelectorAll('p,small,span,label,div,strong,b').forEach(el=>{
      if(el.closest('#kslManageGate')) return;
      const txt=(el.textContent||'').replace(/\s+/g,' ').trim();
      const code=readAdminCodeFromBaseApp();
      if(code&&txt.includes(code)&&txt.length<=80&&!el.querySelector('input,button,select,textarea')) el.style.display='none';
    });
  }
  scrub(); setTimeout(scrub,300); setTimeout(scrub,1000);
  new MutationObserver(scrub).observe(document.documentElement,{childList:true,subtree:true});
})();
