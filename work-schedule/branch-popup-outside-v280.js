(()=>{
  const isBranchDetails=d=>{
    if(!(d instanceof HTMLDetailsElement))return false;
    const id=String(d.id||'').toLowerCase();
    if(id.includes('branch'))return true;
    return !!d.querySelector('.adminBranchCheck,.shiftTimeBranchCheck,[class*="BranchCheck"],[id*="BranchOptions"],[id*="branchOptions"]');
  };

  const branchPopups=()=>[...document.querySelectorAll('details[open]')].filter(isBranchDetails);

  function closeOutside(target){
    branchPopups().forEach(d=>{
      if(!d.contains(target))d.open=false;
    });
  }

  document.addEventListener('pointerdown',e=>closeOutside(e.target),true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')branchPopups().forEach(d=>d.open=false);
  },true);

  // When a new branch popup opens, close every other branch popup.
  document.addEventListener('toggle',e=>{
    const d=e.target;
    if(!isBranchDetails(d)||!d.open)return;
    [...document.querySelectorAll('details[open]')].forEach(other=>{
      if(other!==d&&isBranchDetails(other))other.open=false;
    });
  },true);

  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 2.8 · Popup UX';
})();
