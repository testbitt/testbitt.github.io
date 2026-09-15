/* Version 3.25 — Reserved Standard Custom Check group with all RM */
(()=>{
  const STANDARD='Standard';
  let persistTimer=null;

  function allRmCodes(){
    const set=new Set();
    for(const r of Array.isArray(S?.stock)?S.stock:[]){
      const code=T(V(r,'rm'));
      if(code&&code!=='รหัสวัตถุดิบ')set.add(code);
    }
    return [...set].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
  }
  function sameList(a,b){
    if(!Array.isArray(a)||a.length!==b.length)return false;
    for(let i=0;i<b.length;i++)if(a[i]!==b[i])return false;
    return true;
  }
  function queuePersist(){
    clearTimeout(persistTimer);
    persistTimer=setTimeout(()=>{
      Promise.resolve(persistCustomChecks()).catch(e=>console.warn('Standard Custom Check cloud sync',e));
    },180);
  }
  function ensureStandard(save=true){
    if(!customChecks||typeof customChecks!=='object')customChecks={};
    const codes=allRmCodes();
    if(!sameList(customChecks[STANDARD],codes)){
      customChecks[STANDARD]=codes;
      if(save&&localStorage.getItem('kamuInvCloudRole')==='user')queuePersist();
      return true;
    }
    return false;
  }
  function selectedNames(){
    return String(activeCustomCheck||'').split(' + ').map(T).filter(Boolean);
  }

  const baseRenderCustom=renderCustomChecks;
  renderCustomChecks=function(){
    ensureStandard(true);
    const out=baseRenderCustom.apply(this,arguments);
    const opts=document.querySelectorAll('#customCheckMultiOptions .cc-multi-opt');
    opts.forEach(label=>{
      const input=label.querySelector('input[type=checkbox]');
      if(input?.value===STANDARD){
        label.classList.add('cc-standard');
        const small=label.querySelector('small');
        if(small)small.textContent=`ทั้งหมด ${(customChecks[STANDARD]||[]).length.toLocaleString('th-TH')} รายการ`;
      }
    });
    const u=$('#updateCustom'),d=$('#deleteCustom'),arr=selectedNames();
    if(arr.includes(STANDARD)){
      if(u){u.disabled=true;u.title='Standard ซิงก์ทุกรายการอัตโนมัติ ไม่ต้องบันทึกทับ'}
      if(d){d.disabled=true;d.title='Standard เป็น Group ระบบ ไม่สามารถลบได้'}
    }
    return out;
  };

  const baseUpdate=updateCustomCheck;
  updateCustomCheck=async function(){
    if(selectedNames().includes(STANDARD)){
      alert('Standard เป็น Group ระบบและซิงก์ RM ทุกรายการอัตโนมัติ ไม่ต้องบันทึกทับ');
      ensureStandard(true);renderCustomChecks();return;
    }
    return baseUpdate.apply(this,arguments);
  };

  const baseDelete=deleteCustomCheck;
  deleteCustomCheck=async function(){
    if(selectedNames().includes(STANDARD)){
      alert('Standard เป็น Group ระบบ ไม่สามารถลบได้ กรุณาเอาเครื่องหมายเลือก Standard ออกก่อน');
      return;
    }
    return baseDelete.apply(this,arguments);
  };

  function rebindReserved(){
    ensureStandard(true);
    const u=$('#updateCustom'),d=$('#deleteCustom');
    if(u)u.onclick=updateCustomCheck;
    if(d)d.onclick=deleteCustomCheck;
    renderCustomChecks();
  }

  const css=document.createElement('style');
  css.textContent=`
    .cc-multi-opt.cc-standard{background:#edf9f1;border:1px solid #b9dec7}
    .cc-multi-opt.cc-standard b::after{content:' • ทั้งหมด';font-size:10px;color:#238a55;font-weight:800}
  `;
  document.head.appendChild(css);

  ensureStandard(false);
  setTimeout(rebindReserved,550);
  setTimeout(rebindReserved,1500);
  document.addEventListener('kamu:data-ready',()=>setTimeout(rebindReserved,100));
})();
