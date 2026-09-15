/* Version 3.26 — Rename Custom Check group */
(()=>{
  const STANDARD='Standard';
  const multiKey='inventory:lastCustomChecks';
  const selectedNames=()=>String(activeCustomCheck||'').split(' + ').map(T).filter(Boolean).filter(n=>customChecks&&customChecks[n]);

  async function renameCustomGroup(){
    const arr=selectedNames();
    if(arr.length!==1){alert('กรุณาเลือก Custom Check เพียง 1 Group เพื่อแก้ไขชื่อ');return}
    const oldName=arr[0];
    if(oldName===STANDARD){alert('Standard เป็น Group ระบบ จึงไม่สามารถเปลี่ยนชื่อได้');return}
    let newName=prompt('แก้ไขชื่อ Group',oldName);
    if(newName===null)return;
    newName=T(newName);
    if(!newName){alert('กรุณาระบุชื่อ Group');return}
    if(newName===STANDARD){alert('ชื่อ Standard สงวนไว้สำหรับ Group ระบบ');return}
    if(newName===oldName)return;
    if(customChecks[newName]){alert(`มี Group “${newName}” อยู่แล้ว กรุณาใช้ชื่ออื่น`);return}

    const rows=Array.isArray(customChecks[oldName])?[...customChecks[oldName]]:[];
    delete customChecks[oldName];
    customChecks[newName]=rows;
    try{
      await persistCustomChecks();
      localStorage.setItem('inventory:lastCustomCheck',newName);
      localStorage.setItem(multiKey,JSON.stringify([newName]));
      applyCustomCheck(newName,false);
      renderCustomChecks();
      setCustomMessage(`เปลี่ยนชื่อ Group “${oldName}” เป็น “${newName}” แล้ว • ${rows.length.toLocaleString('th-TH')} รายการ`,'ok');
    }catch(e){
      delete customChecks[newName];customChecks[oldName]=rows;
      alert('เปลี่ยนชื่อ Group ไม่สำเร็จ: '+(e?.message||e));
      renderCustomChecks();
    }
  }

  function ensureRenameButton(){
    if($('#renameCustom'))return $('#renameCustom');
    const update=$('#updateCustom'),save=$('#saveCustom'),del=$('#deleteCustom');
    const anchor=update||del||save;
    if(!anchor)return null;
    const b=document.createElement('button');
    b.id='renameCustom';b.type='button';b.className='btn alt small';b.textContent='✏️ แก้ชื่อ Group';
    if(update)update.insertAdjacentElement('afterend',b);else anchor.insertAdjacentElement('beforebegin',b);
    b.onclick=renameCustomGroup;
    return b;
  }

  const baseRender=renderCustomChecks;
  renderCustomChecks=function(){
    const out=baseRender.apply(this,arguments);
    const b=ensureRenameButton(),arr=selectedNames();
    if(b){
      const blocked=arr.length!==1||arr[0]===STANDARD;
      b.disabled=blocked;
      b.title=arr.length===0?'เลือก 1 Group เพื่อแก้ชื่อ':arr.length>1?'เลือกเพียง 1 Group เพื่อแก้ชื่อ':arr[0]===STANDARD?'Standard เป็น Group ระบบ ไม่สามารถเปลี่ยนชื่อได้':'';
    }
    return out;
  };

  const css=document.createElement('style');
  css.textContent='#renameCustom{white-space:nowrap}';
  document.head.appendChild(css);
  ensureRenameButton();renderCustomChecks();
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{ensureRenameButton();renderCustomChecks()},100));
  const v=document.querySelector('.version');if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.26 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();
