(()=>{
  const q=s=>document.querySelector(s);

  // Brand subtitle
  const brandSmall=q('.brand small');
  if(brandSmall)brandSmall.textContent='Kamu Schedule Planer';

  // History Week filter UI
  const historyPage=q('#page-history');
  const filters=historyPage?.querySelector('.filters');
  let weekInput=q('#historyWeek');
  if(filters&&!weekInput){
    const label=document.createElement('label');
    label.id='historyWeekFilter';
    label.innerHTML='Week<input id="historyWeek" type="date" aria-label="Filter Week">';
    const searchBtn=q('#historyLoad');
    filters.insertBefore(label,searchBtn||null);
    weekInput=q('#historyWeek');
  }

  function applyHistoryWeekFilter(){
    const root=q('#history');
    if(!root)return;
    const selected=q('#historyWeek')?.value||'';
    root.querySelector('#historyWeekEmpty')?.remove();
    const rows=[...root.querySelectorAll('.hist')];
    let visible=0;
    rows.forEach(row=>{
      const btn=row.querySelector('[data-w]');
      const week=btn?.dataset?.w||'';
      const show=!selected||week===selected;
      row.style.display=show?'':'none';
      if(show)visible++;
    });
    if(rows.length&&visible===0){
      const empty=document.createElement('div');
      empty.id='historyWeekEmpty';
      empty.className='empty';
      empty.innerHTML=`ไม่พบตารางใน Week ${selected}`;
      root.appendChild(empty);
    }
  }

  const historyLoad=q('#historyLoad');
  if(historyLoad){
    const old=historyLoad.onclick;
    historyLoad.onclick=function(e){
      if(typeof old==='function')old.call(this,e);
      setTimeout(applyHistoryWeekFilter,10);
    };
  }
  if(weekInput){
    weekInput.addEventListener('change',()=>{
      if(typeof window.renderHistory==='function')window.renderHistory();
      setTimeout(applyHistoryWeekFilter,10);
    });
  }
  const historyBranch=q('#historyBranch');
  if(historyBranch)historyBranch.addEventListener('change',()=>setTimeout(applyHistoryWeekFilter,20));

  // Re-apply after cloud bootstrap/history redraws.
  const historyRoot=q('#history');
  if(historyRoot){
    const mo=new MutationObserver(()=>setTimeout(applyHistoryWeekFilter,0));
    mo.observe(historyRoot,{childList:true});
  }

  const style=document.createElement('style');
  style.id='historyWeekFilterV201Style';
  style.textContent=`
    #historyWeekFilter{min-width:180px}
    #historyWeekFilter input{width:100%}
    @media(max-width:700px){#historyWeekFilter{min-width:100%;width:100%}}
  `;
  document.head.appendChild(style);

  const footer=q('.side footer');
  if(footer)footer.textContent='Version 2.1 · Online Database';
})();