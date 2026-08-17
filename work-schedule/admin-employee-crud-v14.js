(()=>{
  if(document.querySelector('#employeeCrudModal'))return;
  const empTable=document.querySelector('#empTable');
  const branchFilter=document.querySelector('#adminEmpBranch');
  const section=document.querySelector('#admin-employees .card');
  if(!empTable||!branchFilter||!section)return;

  const style=document.createElement('style');
  style.textContent=`
  .emp-actions{display:flex;gap:6px;white-space:nowrap}.emp-actions .btn{padding:6px 9px;font-size:11px}
  .crud-modal{position:fixed;inset:0;background:rgba(7,28,23,.48);display:none;align-items:center;justify-content:center;z-index:999;padding:18px}.crud-modal.show{display:flex}.crud-box{width:min(640px,100%);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.22);padding:20px}.crud-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.crud-head h3{margin:0}.crud-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.crud-grid label{display:grid;gap:6px;font-size:12px;color:var(--muted)}.crud-grid .wide{grid-column:1/-1}.crud-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}@media(max-width:700px){.crud-grid{grid-template-columns:1fr}.crud-grid .wide{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const head=section.querySelector('.section-head');
  const addBtn=document.createElement('button');
  addBtn.type='button';addBtn.className='btn primary';addBtn.id='addEmployeeBtn';addBtn.textContent='+ เพิ่มพนักงาน';
  if(head){const right=head.querySelector('select')?.parentElement||head;head.appendChild(addBtn)}

  const modal=document.createElement('div');
  modal.id='employeeCrudModal';modal.className='crud-modal';
  modal.innerHTML=`<div class="crud-box"><div class="crud-head"><h3 id="empModalTitle">เพิ่มพนักงาน</h3><button type="button" class="btn ghost" id="empModalClose">✕</button></div><form id="employeeCrudForm"><div class="crud-grid"><label>รหัสพนักงาน<input id="crudEmpCode" required></label><label>ชื่อพนักงาน<input id="crudEmpName" required></label><label>รหัสสาขา<input id="crudBranchCode" required></label><label>ชื่อสาขา<input id="crudBranchName"></label><label>ตำแหน่ง<input id="crudPosition"></label><label>ประเภทพนักงาน<select id="crudEmpType"><option value="">-</option><option value="FT">FT</option><option value="PT">PT</option><option value="Full Time">Full Time</option><option value="Part Time">Part Time</option></select></label></div><div class="crud-foot"><button type="button" class="btn ghost" id="empModalCancel">ยกเลิก</button><button type="submit" class="btn primary">บันทึกข้อมูล</button></div></form></div>`;
  document.body.appendChild(modal);

  const $=s=>document.querySelector(s);
  let editingCode=null;
  const fields={code:$('#crudEmpCode'),name:$('#crudEmpName'),branch:$('#crudBranchCode'),branchName:$('#crudBranchName'),position:$('#crudPosition'),type:$('#crudEmpType')};

  function openModal(emp=null){
    editingCode=emp?.employee_code||null;
    $('#empModalTitle').textContent=emp?'แก้ไขข้อมูลพนักงาน':'เพิ่มพนักงาน';
    fields.code.value=emp?.employee_code||'';fields.name.value=emp?.name||'';fields.branch.value=emp?.branch_code||'';fields.branchName.value=emp?.branch_name||'';fields.position.value=emp?.position||'';fields.type.value=emp?.employment_type||'';
    modal.classList.add('show');setTimeout(()=>fields.code.focus(),0);
  }
  function closeModal(){modal.classList.remove('show');editingCode=null;$('#employeeCrudForm').reset()}

  function renderEmployeesCrud(){
    const b=branchFilter.value||'ALL';
    const a=(db.employees||[]).filter(e=>e.active!==false&&(b==='ALL'||e.branch_code===b)).sort((x,y)=>String(x.branch_code).localeCompare(String(y.branch_code))||String(x.name).localeCompare(String(y.name)));
    empTable.innerHTML=`<thead><tr><th>รหัส</th><th>ชื่อ</th><th>สาขา</th><th>ตำแหน่ง</th><th>ประเภท</th><th>จัดการ</th></tr></thead><tbody>${a.map(e=>`<tr><td>${esc(e.employee_code)}</td><td>${esc(e.name)}</td><td>${esc(e.branch_code)}</td><td>${esc(e.position||'-')}</td><td>${esc(e.employment_type||'-')}</td><td><div class="emp-actions"><button type="button" class="btn secondary editEmployee" data-code="${esc(e.employee_code)}">แก้ไข</button><button type="button" class="btn ghost deleteEmployee" data-code="${esc(e.employee_code)}">ลบ</button></div></td></tr>`).join('')}</tbody>`;
    document.querySelectorAll('.editEmployee').forEach(btn=>btn.onclick=()=>{const e=db.employees.find(x=>x.employee_code===btn.dataset.code);if(e)openModal(e)});
    document.querySelectorAll('.deleteEmployee').forEach(btn=>btn.onclick=()=>{
      const emp=db.employees.find(x=>x.employee_code===btn.dataset.code);if(!emp)return;
      if(!confirm(`ยืนยันลบพนักงาน ${emp.name} (${emp.employee_code}) ?\nข้อมูลตารางย้อนหลังที่บันทึกไว้จะยังคงอยู่`))return;
      db.employees=db.employees.filter(x=>x.employee_code!==emp.employee_code);
      saveDB();refreshMeta();renderEmployeesCrud();toast('ลบข้อมูลพนักงานแล้ว');
    });
  }

  $('#employeeCrudForm').onsubmit=e=>{
    e.preventDefault();
    const code=fields.code.value.trim(),name=fields.name.value.trim(),branch=fields.branch.value.trim();
    if(!code||!name||!branch)return toast('กรุณากรอกรหัส ชื่อ และสาขา','error');
    const duplicate=db.employees.find(x=>x.employee_code===code&&x.employee_code!==editingCode);
    if(duplicate)return toast('รหัสพนักงานนี้มีอยู่แล้ว','error');
    const old=editingCode?db.employees.find(x=>x.employee_code===editingCode):null;
    const record={...(old||{}),employee_code:code,name,branch_code:branch,branch_name:fields.branchName.value.trim()||branch,position:fields.position.value.trim(),employment_type:fields.type.value,active:true};
    if(old){
      const idx=db.employees.findIndex(x=>x.employee_code===editingCode);db.employees[idx]=record;
      if(editingCode!==code){
        Object.values(db.schedules||{}).forEach(s=>(s.entries||[]).forEach(en=>{if(en.employee_code===editingCode){en.employee_code=code;en.employee_name=name;en.position=record.position}}));
      }else{
        Object.values(db.schedules||{}).forEach(s=>(s.entries||[]).forEach(en=>{if(en.employee_code===code){en.employee_name=name;en.position=record.position}}));
      }
    }else db.employees.push(record);
    saveDB();refreshMeta();closeModal();renderEmployeesCrud();toast(old?'แก้ไขข้อมูลพนักงานแล้ว':'เพิ่มพนักงานแล้ว');
  };

  addBtn.onclick=()=>openModal();$('#empModalClose').onclick=closeModal;$('#empModalCancel').onclick=closeModal;modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
  branchFilter.onchange=renderEmployeesCrud;

  const oldRender=window.renderEmployees;window.renderEmployees=renderEmployeesCrud;
  const oldAdminTab=window.adminTab;if(typeof oldAdminTab==='function')window.adminTab=function(n){const r=oldAdminTab.apply(this,arguments);if(n==='employees')renderEmployeesCrud();return r};
  const oldOpenAdmin=window.openAdmin;if(typeof oldOpenAdmin==='function')window.openAdmin=function(){const r=oldOpenAdmin.apply(this,arguments);if(document.querySelector('#admin-employees.active'))renderEmployeesCrud();return r};

  renderEmployeesCrud();
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.4 · Public Web';
})();
