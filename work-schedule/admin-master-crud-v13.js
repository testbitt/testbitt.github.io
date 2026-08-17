(()=>{
  const shiftList=document.querySelector('#shiftList');
  const otList=document.querySelector('#otList');
  const shiftForm=document.querySelector('#shiftForm');
  const otForm=document.querySelector('#otForm');
  const shiftCode=document.querySelector('#shiftCode');
  const shiftTime=document.querySelector('#shiftTime');
  const otCode=document.querySelector('#otCode');
  const otName=document.querySelector('#otName');
  if(!shiftList||!otList||!shiftForm||!otForm)return;

  let editingShift=null,editingOt=null;

  function button(text,cls='ghost'){
    return `<button type="button" class="btn ${cls}" style="padding:6px 9px;font-size:11px">${text}</button>`;
  }

  function renderMastersCrud(){
    shiftList.innerHTML=(db.shifts||[]).map(s=>`<div style="display:grid;grid-template-columns:90px 1fr auto;gap:10px;align-items:center;padding:9px 2px;border-bottom:1px solid var(--line)"><b>${esc(s.day_code)}</b><span>${esc(s.normal_time)}</span><span style="display:flex;gap:6px">${button('แก้ไข','secondary').replace('type="button"',`type="button" class="btn secondary editShift" data-code="${esc(s.day_code)}"`)}${button('ลบ').replace('type="button"',`type="button" class="btn ghost delShift" data-code="${esc(s.day_code)}"`)}</span></div>`).join('')||'<div class="empty" style="padding:20px">ยังไม่มี Shift</div>';

    otList.innerHTML=(db.otTypes||[]).map(o=>`<div style="display:grid;grid-template-columns:100px 1fr auto;gap:10px;align-items:center;padding:9px 2px;border-bottom:1px solid var(--line)"><b>${esc(o.code)}</b><span>${esc(o.name)}</span><span style="display:flex;gap:6px">${button('แก้ไข','secondary').replace('type="button"',`type="button" class="btn secondary editOt" data-code="${esc(o.code)}"`)}${button('ลบ').replace('type="button"',`type="button" class="btn ghost delOt" data-code="${esc(o.code)}"`)}</span></div>`).join('')||'<div class="empty" style="padding:20px">ยังไม่มีประเภท OT</div>';

    document.querySelectorAll('.editShift').forEach(b=>b.onclick=()=>{
      const s=db.shifts.find(x=>x.day_code===b.dataset.code);if(!s)return;
      editingShift=s.day_code;shiftCode.value=s.day_code;shiftTime.value=s.normal_time;shiftCode.focus();
      const btn=shiftForm.querySelector('button');if(btn)btn.textContent='บันทึกการแก้ไข';
    });
    document.querySelectorAll('.delShift').forEach(b=>b.onclick=()=>{
      const code=b.dataset.code;
      if(!confirm(`ยืนยันลบ ${code} ?`))return;
      db.shifts=db.shifts.filter(x=>x.day_code!==code);
      if(editingShift===code){editingShift=null;shiftCode.value='';shiftTime.value=''}
      saveDB();renderMastersCrud();refreshMeta();toast('ลบ Shift แล้ว');
    });
    document.querySelectorAll('.editOt').forEach(b=>b.onclick=()=>{
      const o=db.otTypes.find(x=>x.code===b.dataset.code);if(!o)return;
      editingOt=o.code;otCode.value=o.code;otName.value=o.name;otCode.focus();
      const btn=otForm.querySelector('button');if(btn)btn.textContent='บันทึกการแก้ไข';
    });
    document.querySelectorAll('.delOt').forEach(b=>b.onclick=()=>{
      const code=b.dataset.code;
      if(!confirm(`ยืนยันลบประเภท OT ${code} ?`))return;
      db.otTypes=db.otTypes.filter(x=>x.code!==code);
      if(editingOt===code){editingOt=null;otCode.value='';otName.value=''}
      saveDB();renderMastersCrud();toast('ลบประเภท OT แล้ว');
    });
  }

  shiftForm.onsubmit=e=>{
    e.preventDefault();
    const c=shiftCode.value.trim(),t=norm(shiftTime.value);
    if(!c||!t)return toast('กรุณากรอก DAY Code และเวลา','error');
    if(editingShift&&editingShift!==c)db.shifts=db.shifts.filter(x=>x.day_code!==editingShift);
    const i=db.shifts.findIndex(x=>x.day_code===c),o={day_code:c,normal_time:t};
    if(i>=0)db.shifts[i]=o;else db.shifts.push(o);
    db.shifts.sort((a,b)=>a.day_code.localeCompare(b.day_code));
    editingShift=null;shiftCode.value='';shiftTime.value='';const btn=shiftForm.querySelector('button');if(btn)btn.textContent='บันทึก';
    saveDB();renderMastersCrud();refreshMeta();toast('บันทึก Shift แล้ว');
  };

  otForm.onsubmit=e=>{
    e.preventDefault();
    const c=otCode.value.trim(),n=otName.value.trim();
    if(!c||!n)return toast('กรุณากรอกข้อมูล','error');
    if(editingOt&&editingOt!==c)db.otTypes=db.otTypes.filter(x=>x.code!==editingOt);
    const i=db.otTypes.findIndex(x=>x.code===c),o={code:c,name:n};
    if(i>=0)db.otTypes[i]=o;else db.otTypes.push(o);
    editingOt=null;otCode.value='';otName.value='';const btn=otForm.querySelector('button');if(btn)btn.textContent='บันทึก';
    saveDB();renderMastersCrud();toast('บันทึกประเภท OT แล้ว');
  };

  const oldAdminTab=window.adminTab;
  if(typeof oldAdminTab==='function')window.adminTab=function(n){const r=oldAdminTab.apply(this,arguments);if(n==='shifts')renderMastersCrud();return r};
  const oldOpenAdmin=window.openAdmin;
  if(typeof oldOpenAdmin==='function')window.openAdmin=function(){const r=oldOpenAdmin.apply(this,arguments);renderMastersCrud();return r};

  renderMastersCrud();
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.3 · Public Web';
})();
