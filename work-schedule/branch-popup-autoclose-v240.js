(()=>{
  function bindAutoClose(detailsId, optionsId){
    const details=document.querySelector(detailsId);
    const options=document.querySelector(optionsId);
    if(!details||!options||options.dataset.autoCloseV240==='1')return;
    options.dataset.autoCloseV240='1';
    options.addEventListener('change',e=>{
      const t=e.target;
      if(!(t instanceof HTMLInputElement)||t.type!=='checkbox')return;
      requestAnimationFrame(()=>{details.open=false});
    },true);
  }

  function bindAll(){
    bindAutoClose('#adminBranchPicker','#adminBranchOptions');
    bindAutoClose('#shiftTimeBranchPicker','#shiftTimeBranchOptions');
  }

  bindAll();
  const panel=document.querySelector('#adminPanel');
  if(panel){
    const mo=new MutationObserver(()=>bindAll());
    mo.observe(panel,{childList:true,subtree:true});
  }

  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 2.4 · Online Database';
})();
