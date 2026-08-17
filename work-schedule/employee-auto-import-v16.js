(()=>{
  const originalParseFile=window.parseFile;
  if(typeof originalParseFile!=='function')return;

  function ensureStatus(){
    const upload=document.querySelector('#admin-upload .card');
    if(!upload)return null;
    let box=document.querySelector('#autoImportStatus');
    if(!box){
      box=document.createElement('div');
      box.id='autoImportStatus';
      box.style.cssText='margin-top:12px;padding:11px 13px;border-radius:12px;background:#eefaf5;border:1px solid #bee6d6;color:#356d5d;font-size:12px;line-height:1.5';
      const drop=document.querySelector('#drop');
      if(drop)drop.insertAdjacentElement('afterend',box);else upload.appendChild(box);
    }
    return box;
  }

  function updateUploadCopy(){
    const head=document.querySelector('#admin-upload .section-head h2');
    const desc=document.querySelector('#admin-upload .section-head p');
    const dropH=document.querySelector('#drop h3');
    const dropP=document.querySelector('#drop p');
    const choose=document.querySelector('#choose');
    const importBtn=document.querySelector('#importBtn');
    if(head)head.textContent='Upload ฐานข้อมูลพนักงาน — บันทึกอัตโนมัติ';
    if(desc)desc.textContent='เลือก Excel / CSV แล้วระบบจะใช้ข้อมูลจากไฟล์ล่าสุดแทนฐานพนักงานเดิมทันที';
    if(dropH)dropH.textContent='⇧ เลือกไฟล์พนักงานล่าสุด';
    if(dropP)dropP.textContent='เมื่ออ่านไฟล์สำเร็จ ระบบจะบันทึกและอัปเดตรายชื่อ/สาขาอัตโนมัติ';
    if(choose)choose.textContent='เลือกไฟล์และอัปเดตฐานข้อมูล';
    if(importBtn)importBtn.classList.add('hidden');
    const s=ensureStatus();
    if(s&&!db.employee_import_meta)s.innerHTML='<b>โหมดอัตโนมัติ:</b> ยังไม่มีการ Upload ในรอบนี้ — ไฟล์ล่าสุดที่นำเข้าสำเร็จจะเป็นฐานพนักงานที่ระบบใช้';
  }

  function refreshCurrentScheduleAfterImport(){
    const b=document.querySelector('#branch')?.value;
    if(!b)return;
    currentEmployees=db.employees.filter(e=>e.active!==false&&e.branch_code===b);
    const wrap=document.querySelector('#scheduleWrap');
    if(wrap&&!wrap.classList.contains('hidden')&&typeof renderSchedule==='function')renderSchedule();
  }

  window.parseFile=async function(f){
    const status=ensureStatus();
    if(status)status.innerHTML='<b>กำลังอ่านไฟล์…</b> กรุณารอสักครู่';
    await originalParseFile(f);
    if(!uploadRows.length){
      if(status)status.innerHTML='<b>ไม่พบข้อมูลที่นำเข้าได้</b> กรุณาตรวจสอบ Header และข้อมูลพนักงานในไฟล์';
      throw new Error('ไม่พบข้อมูลพนักงานที่นำเข้าได้');
    }

    const unique=new Map();
    uploadRows.forEach(e=>unique.set(String(e.employee_code),{...e,active:true}));
    const next=[...unique.values()];
    const previousCount=db.employees.length;
    const previousBranches=new Set(db.employees.map(e=>e.branch_code).filter(Boolean)).size;

    // Latest file is the source of truth for the active employee master.
    // Historical schedules are intentionally kept untouched.
    db.employees=next;
    db.employee_import_meta={
      filename:f.name,
      imported_at:new Date().toISOString(),
      employee_count:next.length,
      branch_count:new Set(next.map(e=>e.branch_code).filter(Boolean)).size,
      replaced_employee_count:previousCount,
      replaced_branch_count:previousBranches
    };
    saveDB();
    if(typeof overview==='function')overview();
    if(typeof renderEmployees==='function')renderEmployees();
    refreshCurrentScheduleAfterImport();

    const meta=db.employee_import_meta;
    if(status)status.innerHTML=`<b>✓ บันทึกอัตโนมัติสำเร็จ</b><br>${esc(meta.filename)} · ${meta.employee_count.toLocaleString()} พนักงาน · ${meta.branch_count.toLocaleString()} สาขา<br><span style="color:#6d9789">ข้อมูลพนักงานชุดเดิมถูกแทนด้วยไฟล์ล่าสุดแล้ว โดยตารางงานย้อนหลังยังคงอยู่</span>`;
    const p=document.querySelector('#previewText');if(p)p.textContent=f.name+' · บันทึกอัตโนมัติแล้ว '+next.length.toLocaleString()+' รายการ';
    const importBtn=document.querySelector('#importBtn');if(importBtn)importBtn.classList.add('hidden');
    const input=document.querySelector('#file');if(input)input.value='';
    toast('อัปเดตฐานพนักงานจากไฟล์ล่าสุด '+next.length.toLocaleString()+' คนแล้ว');
  };

  // Prevent the legacy manual import button from merging old data back in.
  const importBtn=document.querySelector('#importBtn');
  if(importBtn){importBtn.onclick=e=>{e.preventDefault();toast('ระบบบันทึกอัตโนมัติแล้ว ไม่ต้องกดนำเข้าซ้ำ');};importBtn.classList.add('hidden')}

  const oldAdminTab=window.adminTab;
  if(typeof oldAdminTab==='function')window.adminTab=function(n){const r=oldAdminTab.apply(this,arguments);if(n==='upload')updateUploadCopy();return r};
  const oldOpenAdmin=window.openAdmin;
  if(typeof oldOpenAdmin==='function')window.openAdmin=function(){const r=oldOpenAdmin.apply(this,arguments);updateUploadCopy();return r};

  updateUploadCopy();
})();