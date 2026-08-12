/* KSL V4.4 — hide the visible clear-data password hint while preserving password validation. */
(() => {
  function hideVisiblePasswordHint(){
    const roots=[document.getElementById('clearModal'),document.body].filter(Boolean);
    roots.forEach(root=>{
      [...root.querySelectorAll('div,span,p,small,label,b,strong')].forEach(el=>{
        const txt=(el.textContent||'').replace(/\s+/g,' ').trim();
        if(!txt.includes('1310')) return;
        if(el.matches('button,input,textarea,select') || el.querySelector('button,input,textarea,select')) return;
        if(txt.length<=40){
          el.style.display='none';
          el.setAttribute('aria-hidden','true');
        }
      });
    });
    const code=document.getElementById('clearCode');
    if(code){
      code.placeholder='••••';
      code.autocomplete='off';
      code.setAttribute('aria-label','รหัสผ่าน');
    }
  }
  hideVisiblePasswordHint();
  setTimeout(hideVisiblePasswordHint,100);
  setTimeout(hideVisiblePasswordHint,500);
  new MutationObserver(hideVisiblePasswordHint).observe(document.documentElement,{subtree:true,childList:true});
})();
