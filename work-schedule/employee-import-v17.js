(()=>{
  const FORMAT=['สาขา','รหัส','ชื่อ','นามสกุล'];
  const normalizeHeader=v=>String(v??'').trim().replace(/^\uFEFF/,'');
  const asText=v=>String(v??'').trim();

  function splitBranch(raw){
    const s=asText(raw);
    const i=s.indexOf('-');
    if(i<0)return {code:s,name:s};
    const code=s.slice(0,i).trim();
    const name=s.slice(i+1).trim();
    return {code:code||s,name:name||code||s};
  }

  function ensureImportStatus(){
    const card=document.querySelector('#admin-upload .card');
    if(!card)return null;
    let box=document.querySelector('#autoImportStatus');
    if(!box){
      box=document.createElement('div');
      box.id='autoImportStatus';
      box.style.cssText='margin-top:12px;padding:11px 13px;border-radius:12px;background:#eefaf5;border:1px solid #bee6d6;color:#356d5d;font-size:12px;line-height:1.55';
      const drop=document.querySelector('#drop');
      if(drop)drop.insertAdjacentElement('afterend',box);else card.appendChild(box);
    }
    return box;
  }

  function updateUploadUI(){
    const h=document.querySelector('#admin-upload .section-head h2');
    const p=document.querySelector('#admin-upload .section-head p');
    const dropH=document.querySelector('#drop h3');
    const dropP=document.querySelector('#drop p');
    const choose=document.querySelector('#choose');
    const manual=document.querySelector('#importBtn');
    if(h)h.textContent='Upload ฐานข้อมูลพนักงาน — บันทึกอัตโนมัติ';
    if(p)p.textContent='รูปแบบมาตรฐาน: สาขา | รหัส | ชื่อ | นามสกุล';
    if(dropH)dropH.textContent='⇧ เลือกไฟล์ฐานพนักงานล่าสุด';
    if(dropP)dropP.textContent='รองรับ CSV / Excel โดยใช้ 4 คอลัมน์: สาขา, รหัส, ชื่อ, นามสกุล';
    if(choose)choose.textContent='เลือกไฟล์และอัปเดตฐานข้อมูล';
    if(manual)manual.classList.add('hidden');
    const s=ensureImportStatus();
    if(s && !db.employee_import_meta){
      s.innerHTML='<b>โครงสร้างใหม่พร้อมใช้งาน</b><br>ตัวอย่างสาขา: <code>ABBN-มหาวิทยาลัยเอแบค บางนา</code> ระบบจะแยกเป็นรหัสสาขา <b>ABBN</b> และชื่อสาขาอัตโนมัติ';
    }
  }

  function renderPreview(rows,fileName){
    const preview=document.querySelector('#preview');
    const label=document.querySelector('#previewText');
    const table=document.querySelector('#previewTable');
    if(preview)preview.classList.remove('hidden');
    if(label)label.textContent=`${fileName} · บันทึกอัตโนมัติแล้ว ${rows.length.toLocaleString()} รายการ`;
    if(table){
      table.innerHTML=`<thead><tr><th>สาขา</th><th>รหัส</th><th>ชื่อ</th><th>นามสกุล</th></tr></thead><tbody>${rows.slice(0,80).map(r=>`<tr><td>${esc(r.branch_display)}</td><td>${esc(r.employee_code)}</td><td>${esc(r.first_name)}</td><td>${esc(r.last_name)}</td></tr>`).join('')}</tbody>`;
    }
  }

  function refreshVisibleSchedule(){
    const branch=document.querySelector('#branch')?.value;
    if(!branch)return;
    currentEmployees=db.employees.filter(e=>e.active!==false&&e.branch_code===branch);
    const wrap=document.querySelector('#scheduleWrap');
    if(wrap && !wrap.classList.contains('hidden') && typeof renderSchedule==='function')renderSchedule();
  }

  window.parseFile=async function(file){
    const status=ensureImportStatus();
    if(status)status.innerHTML='<b>กำลังตรวจสอบไฟล์…</b> ระบบจะบันทึกอัตโนมัติเมื่อโครงสร้างถูกต้อง';
    const buffer=await file.arrayBuffer();
    const wb=XLSX.read(buffer,{type:'array'});
    const sheetName=wb.SheetNames.includes('DATA Staff')?'DATA Staff':wb.SheetNames[0];
    if(!sheetName)throw new Error('ไม่พบ Sheet ในไฟล์');
    const ws=wb.Sheets[sheetName];
    const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
    if(!matrix.length)throw new Error('ไฟล์ไม่มีข้อมูล');

    const headers=(matrix[0]||[]).map(normalizeHeader);
    const missing=FORMAT.filter(h=>!headers.includes(h));
    if(missing.length){
      if(status)status.innerHTML=`<b>โครงสร้างไฟล์ไม่ตรง</b><br>ต้องมีคอลัมน์: ${FORMAT.join(' | ')}<br>ขาด: ${missing.join(', ')}`;
      throw new Error('Header ไม่ตรงรูปแบบใหม่: ขาด '+missing.join(', '));
    }
    const col=Object.fromEntries(FORMAT.map(h=>[h,headers.indexOf(h)]));
    const parsed=[];
    const invalid=[];
    for(let i=1;i<matrix.length;i++){
      const row=matrix[i]||[];
      const branchDisplay=asText(row[col['สาขา']]);
      const employeeCode=asText(row[col['รหัส']]).replace(/\.0$/,'');
      const firstName=asText(row[col['ชื่อ']]);
      const lastName=asText(row[col['นามสกุล']]);
      if(!branchDisplay&&!employeeCode&&!firstName&&!lastName)continue;
      if(!branchDisplay||!employeeCode||!firstName){ invalid.push(i+1); continue; }
      const branch=splitBranch(branchDisplay);
      parsed.push({
        employee_code:employeeCode,
        first_name:firstName,
        last_name:lastName,
        name:[firstName,lastName].filter(Boolean).join(' '),
        branch_code:branch.code,
        branch_name:branch.name,
        branch_display:branchDisplay,
        position:'',
        employment_type:'',
        active:true
      });
    }
    if(!parsed.length){
      if(status)status.innerHTML='<b>ไม่พบข้อมูลพนักงานที่นำเข้าได้</b>';
      throw new Error('ไม่พบข้อมูลพนักงานที่นำเข้าได้');
    }

    const unique=new Map();
    parsed.forEach(e=>unique.set(e.employee_code,e));
    const next=[...unique.values()];
    const duplicateCount=parsed.length-next.length;
    const branchCount=new Set(next.map(e=>e.branch_code).filter(Boolean)).size;
    const previousCount=db.employees.length;

    db.employees=next;
    uploadRows=next;
    db.employee_import_meta={
      filename:file.name,
      structure:'สาขา | รหัส | ชื่อ | นามสกุล',
      imported_at:new Date().toISOString(),
      employee_count:next.length,
      branch_count:branchCount,
      replaced_employee_count:previousCount,
      duplicate_codes_removed:duplicateCount,
      invalid_rows_skipped:invalid.length
    };
    saveDB();
    if(typeof overview==='function')overview();
    if(typeof renderEmployees==='function')renderEmployees();
    refreshVisibleSchedule();
    renderPreview(next,file.name);

    const meta=db.employee_import_meta;
    if(status)status.innerHTML=`<b>✓ อัปเดตฐานพนักงานอัตโนมัติสำเร็จ</b><br>${esc(meta.filename)} · ${meta.employee_count.toLocaleString()} พนักงาน · ${meta.branch_count.toLocaleString()} สาขา<br><span style="color:#6d9789">ใช้ข้อมูลจากไฟล์ล่าสุดแทนฐานพนักงานเดิมแล้ว${duplicateCount?` · ตัดรหัสซ้ำ ${duplicateCount} รายการ`:''}${invalid.length?` · ข้ามแถวไม่ครบ ${invalid.length} แถว`:''} · ตารางย้อนหลังยังคงอยู่</span>`;
    const manual=document.querySelector('#importBtn');if(manual)manual.classList.add('hidden');
    const input=document.querySelector('#file');if(input)input.value='';
    toast(`อัปเดตฐานพนักงาน ${next.length.toLocaleString()} คน / ${branchCount.toLocaleString()} สาขาแล้ว`);
  };

  const oldAdminTab=window.adminTab;
  if(typeof oldAdminTab==='function')window.adminTab=function(n){const r=oldAdminTab.apply(this,arguments);if(n==='upload')updateUploadUI();return r};
  const oldOpenAdmin=window.openAdmin;
  if(typeof oldOpenAdmin==='function')window.openAdmin=function(){const r=oldOpenAdmin.apply(this,arguments);updateUploadUI();return r};
  const manual=document.querySelector('#importBtn');if(manual){manual.onclick=e=>{e.preventDefault();toast('ระบบบันทึกอัตโนมัติแล้ว');};manual.classList.add('hidden');}
  updateUploadUI();
})();
