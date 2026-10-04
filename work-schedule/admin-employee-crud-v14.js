(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/ksp-api';
  const q=s=>document.querySelector(s);
  const esc350=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const empTable=q('#empTable');
  const branchFilter=q('#adminEmpBranch');
  const employeeSection=q('#admin-employees .card');
  const employeeAdmin=q('#admin-employees');
  if(!empTable||!branchFilter||!employeeSection||!employeeAdmin)return;

  let adminPin350='';
  let editingEmployee350=null;
  let editingBranch350=null;

  q('#login')?.addEventListener('submit',()=>{adminPin350=q('#pin')?.value||''},true);

  function setSync350(text,bad=false){
    const el=q('#sync');
    if(el){el.textContent=text;el.style.color=bad?'#9d2c2c':''}
  }

  async function api350(action,payload=null){
    const url=payload===null?`${API}?action=${encodeURIComponent(action)}&_=${Date.now()}`:API;
    const options=payload===null?{cache:'no-store'}:{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,pin:adminPin350,...payload}),cache:'no-store'
    };
    const response=await fetch(url,options);
    let json={};try{json=await response.json()}catch{}
    if(!response.ok||!json.ok){
      if(json.error==='INVALID_PIN')adminPin350='';
      throw new Error(json.error==='INVALID_PIN'?'สิทธิ์ Admin หมดอายุ กรุณาออกแล้วเข้าสู่ Admin ใหม่':json.error||`HTTP ${response.status}`);
    }
    return json.data||{};
  }

  function applyBootstrap350(x){
    const branches=x.branches||[];
    const branchMap=new Map(branches.map(b=>[String(b.code),b]));
    const schedules={};
    Object.entries(x.schedules||{}).forEach(([k,s])=>{
      schedules[k]={...s,entries:(s.entries||[]).map(e=>({...e,ot_start:e.ot_start?String(e.ot_start).slice(0,5):'',ot_end:e.ot_end?String(e.ot_end).slice(0,5):''}))};
    });
    db={
      employees:(x.employees||[]).map(e=>({...e,name:e.display_name||e.name||e.employee_code,branch_name:branchMap.get(String(e.branch_code))?.name||e.branch_code,active:e.active!==false})),
      branches,shifts:x.shifts||[],otTypes:x.otTypes||[],schedules,versions:x.versions||[]
    };
    if(typeof refreshMeta==='function')refreshMeta();
    if(typeof overview==='function')overview();
  }

  async function refreshCloud350(){
    const data=await api350('bootstrap');
    applyBootstrap350(data);fillBranchControls350();renderEmployees350();renderBranches350();
  }

  const style=document.createElement('style');
  style.id='employeeBranchAdminV350';
  style.textContent=`
    .emp-actions350{display:flex;gap:6px;white-space:nowrap}.emp-actions350 .btn{padding:6px 9px;font-size:11px}
    .crud-modal350{position:fixed;inset:0;background:rgba(7,28,23,.5);display:none;align-items:center;justify-content:center;z-index:1100;padding:18px}.crud-modal350.show{display:flex}
    .crud-box350{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.24);padding:20px}
    .crud-head350{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.crud-head350 h3{margin:0;color:#174f40}
    .crud-grid350{display:grid;grid-template-columns:1fr 1fr;gap:12px}.crud-grid350 label{display:grid;gap:6px;font-size:12px;color:var(--muted)}.crud-grid350 .wide{grid-column:1/-1}
    .crud-foot350{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.field-note350{font-size:11px;color:var(--muted);margin-top:-4px}
    .branch-card350{margin-bottom:14px}.branch-table350{min-width:720px}.branch-code350{font-weight:900;color:#145b48}.branch-name350{font-weight:800}
    .branch-display350{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.branch-display350 small{font-weight:700}.branch-inline350{border:0;background:#e5f7f0;color:#147255;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:900;cursor:pointer}.branch-inline350:hover{background:#cceee2}
    .admin-api350{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#e5f7f0;color:#147255;font-size:11px;font-weight:900}
    @media(max-width:700px){.crud-grid350{grid-template-columns:1fr}.crud-grid350 .wide{grid-column:auto}.crud-box350{padding:14px}.crud-foot350{flex-direction:column-reverse}.crud-foot350 .btn{width:100%}}
  `;
  document.head.appendChild(style);

  const head=employeeSection.querySelector('.section-head');
  const addBtn=document.createElement('button');
  addBtn.type='button';addBtn.className='btn primary';addBtn.id='addEmployeeBtn';addBtn.textContent='+ เพิ่มพนักงาน';
  head?.appendChild(addBtn);

  const branchCard=document.createElement('div');
  branchCard.className='card branch-card350';
  branchCard.innerHTML=`
    <div class="section-head">
      <div><h2>ฐานข้อมูลสาขา</h2><p>แก้ไขชื่อสาขาส่วนกลางโดยคงรหัสสาขาเดิม</p></div>
      <span class="admin-api350">Cloud · ksp-api V6</span>
    </div>
    <div class="scroll"><table class="data branch-table350" id="branchTable350"></table></div>`;
  employeeAdmin.insertBefore(branchCard,employeeSection);

  const employeeModal=document.createElement('div');
  employeeModal.id='employeeCrudModal';employeeModal.className='crud-modal350';
  employeeModal.innerHTML=`
    <div class="crud-box350">
      <div class="crud-head350"><h3 id="empModalTitle350">เพิ่มพนักงาน</h3><button type="button" class="btn ghost" id="empModalClose350">ปิด</button></div>
      <form id="employeeCrudForm350">
        <div class="crud-grid350">
          <label>รหัสพนักงาน<input id="crudEmpCode350" required><span class="field-note350" id="empCodeNote350"></span></label>
          <label>ชื่อที่แสดง<input id="crudEmpName350" required></label>
          <label>ชื่อจริง<input id="crudFirstName350"></label>
          <label>นามสกุล<input id="crudLastName350"></label>
          <label>สาขา<select id="crudBranchCode350" required></select></label>
          <label>ตำแหน่ง<input id="crudPosition350"></label>
          <label>ประเภทพนักงาน<select id="crudEmpType350"><option value="">-</option><option value="FT">FT</option><option value="PT">PT</option><option value="Full Time">Full Time</option><option value="Part Time">Part Time</option></select></label>
        </div>
        <div class="crud-foot350"><button type="button" class="btn ghost" id="empModalCancel350">ยกเลิก</button><button type="submit" class="btn primary" id="empSave350">บันทึกข้อมูล</button></div>
      </form>
    </div>`;
  document.body.appendChild(employeeModal);

  const branchModal=document.createElement('div');
  branchModal.id='branchCrudModal350';branchModal.className='crud-modal350';
  branchModal.innerHTML=`
    <div class="crud-box350" style="width:min(540px,100%)">
      <div class="crud-head350"><h3>แก้ไขชื่อสาขา</h3><button type="button" class="btn ghost" id="branchModalClose350">ปิด</button></div>
      <form id="branchCrudForm350">
        <div class="crud-grid350">
          <label>รหัสสาขา<input id="crudBranchCode350" readonly></label>
          <label>ชื่อสาขา<input id="crudBranchName350" required></label>
        </div>
        <p class="field-note350">ชื่อใหม่จะอัปเดตใน Filter ตารางงาน ประวัติ Version และไฟล์ Export โดยไม่เปลี่ยนรหัสสาขา</p>
        <div class="crud-foot350"><button type="button" class="btn ghost" id="branchModalCancel350">ยกเลิก</button><button type="submit" class="btn primary" id="branchSave350">บันทึกชื่อสาขา</button></div>
      </form>
    </div>`;
  document.body.appendChild(branchModal);

  const fields350={
    code:q('#crudEmpCode350'),name:q('#crudEmpName350'),first:q('#crudFirstName350'),last:q('#crudLastName350'),
    branch:q('#crudBranchCode350'),position:q('#crudPosition350'),type:q('#crudEmpType350')
  };

  function fillBranchControls350(){
    const branches=(db.branches||[]).slice().sort((a,b)=>String(a.code).localeCompare(String(b.code)));
    const selectedFilter=branchFilter.value||'ALL',selectedEditor=fields350.branch.value||'';
    branchFilter.innerHTML='<option value="ALL">ทุกสาขา</option>'+branches.map(b=>`<option value="${esc350(b.code)}">${esc350(b.code)} — ${esc350(b.name||b.code)}</option>`).join('');
    fields350.branch.innerHTML='<option value="">เลือกสาขา</option>'+branches.map(b=>`<option value="${esc350(b.code)}">${esc350(b.code)} — ${esc350(b.name||b.code)}</option>`).join('');
    if([...branchFilter.options].some(o=>o.value===selectedFilter))branchFilter.value=selectedFilter;
    if([...fields350.branch.options].some(o=>o.value===selectedEditor))fields350.branch.value=selectedEditor;
  }

  function renderEmployees350(){
    const branch=branchFilter.value||'ALL';
    const rows=(db.employees||[]).filter(e=>e.active!==false&&(branch==='ALL'||String(e.branch_code)===branch)).sort((a,b)=>String(a.branch_code).localeCompare(String(b.branch_code))||String(a.name||a.display_name).localeCompare(String(b.name||b.display_name),'th'));
    empTable.innerHTML=`<thead><tr><th>รหัส</th><th>ชื่อ</th><th>สาขา</th><th>ตำแหน่ง</th><th>ประเภท</th><th>จัดการ</th></tr></thead><tbody>${rows.map(e=>`<tr>
      <td>${esc350(e.employee_code)}</td>
      <td><b>${esc350(e.name||e.display_name)}</b>${e.first_name||e.last_name?`<br><small>${esc350([e.first_name,e.last_name].filter(Boolean).join(' '))}</small>`:''}</td>
      <td><b>${esc350(e.branch_code)}</b><div class="branch-display350"><small>${esc350(e.branch_name||e.branch_code)}</small><button type="button" class="branch-inline350 editDisplayedBranch350" data-branch-code="${esc350(e.branch_code)}" title="แก้ไขชื่อสาขาที่แสดง">แก้ชื่อที่แสดง</button></div></td>
      <td>${esc350(e.position||'-')}</td><td>${esc350(e.employment_type||'-')}</td>
      <td><div class="emp-actions350"><button type="button" class="btn secondary editEmployee350" data-code="${esc350(e.employee_code)}">แก้ไข</button><button type="button" class="btn ghost deleteEmployee350" data-code="${esc350(e.employee_code)}">ลบ</button></div></td>
    </tr>`).join('')}</tbody>`;
    empTable.querySelectorAll('.editEmployee350').forEach(btn=>btn.onclick=()=>openEmployee350((db.employees||[]).find(e=>String(e.employee_code)===btn.dataset.code)));
    empTable.querySelectorAll('.deleteEmployee350').forEach(btn=>btn.onclick=()=>deleteEmployee350(btn.dataset.code));
    empTable.querySelectorAll('.editDisplayedBranch350').forEach(btn=>btn.onclick=()=>openBranch350((db.branches||[]).find(b=>String(b.code)===btn.dataset.branchCode)));
  }

  function renderBranches350(){
    const rows=(db.branches||[]).slice().sort((a,b)=>String(a.code).localeCompare(String(b.code)));
    const counts=new Map();
    (db.employees||[]).filter(e=>e.active!==false).forEach(e=>counts.set(String(e.branch_code),(counts.get(String(e.branch_code))||0)+1));
    q('#branchTable350').innerHTML=`<thead><tr><th>รหัสสาขา</th><th>ชื่อสาขา</th><th>พนักงาน</th><th>จัดการ</th></tr></thead><tbody>${rows.map(b=>`<tr>
      <td class="branch-code350">${esc350(b.code)}</td><td class="branch-name350">${esc350(b.name||b.code)}</td><td>${Number(counts.get(String(b.code))||0).toLocaleString()} คน</td>
      <td><button type="button" class="btn secondary editBranch350" data-code="${esc350(b.code)}">แก้ไขชื่อสาขา</button></td>
    </tr>`).join('')}</tbody>`;
    q('#branchTable350').querySelectorAll('.editBranch350').forEach(btn=>btn.onclick=()=>openBranch350((db.branches||[]).find(b=>String(b.code)===btn.dataset.code)));
  }

  function openEmployee350(employee=null){
    editingEmployee350=employee||null;
    q('#empModalTitle350').textContent=employee?'แก้ไขข้อมูลพนักงาน':'เพิ่มพนักงาน';
    fields350.code.value=employee?.employee_code||'';fields350.code.readOnly=!!employee;
    q('#empCodeNote350').textContent=employee?'รหัสพนักงานเดิมถูกล็อกเพื่อรักษาประวัติตารางงาน':'';
    fields350.name.value=employee?.name||employee?.display_name||'';fields350.first.value=employee?.first_name||'';fields350.last.value=employee?.last_name||'';
    fillBranchControls350();fields350.branch.value=employee?.branch_code||'';fields350.position.value=employee?.position||'';fields350.type.value=employee?.employment_type||'';
    employeeModal.classList.add('show');setTimeout(()=>employee?fields350.name.focus():fields350.code.focus(),0);
  }
  function closeEmployee350(){employeeModal.classList.remove('show');editingEmployee350=null;q('#employeeCrudForm350').reset();fields350.code.readOnly=false}

  function openBranch350(branch){
    if(!branch)return;editingBranch350=branch;q('#crudBranchCode350').value=branch.code||'';q('#crudBranchName350').value=branch.name||branch.code||'';
    branchModal.classList.add('show');setTimeout(()=>q('#crudBranchName350').focus(),0);
  }
  function closeBranch350(){branchModal.classList.remove('show');editingBranch350=null;q('#branchCrudForm350').reset()}

  q('#employeeCrudForm350').onsubmit=async event=>{
    event.preventDefault();
    if(!adminPin350)return toast('กรุณาออกจาก Admin แล้วเข้าสู่ระบบใหม่ เพื่อยืนยันสิทธิ์','error');
    const wasEditing=!!editingEmployee350;
    const employee={employee_code:fields350.code.value.trim(),display_name:fields350.name.value.trim(),first_name:fields350.first.value.trim(),last_name:fields350.last.value.trim(),branch_code:fields350.branch.value,position:fields350.position.value.trim(),employment_type:fields350.type.value};
    if(!employee.employee_code||!employee.display_name||!employee.branch_code)return toast('กรุณากรอกรหัส ชื่อ และสาขา','error');
    if(!wasEditing&&(db.employees||[]).some(e=>String(e.employee_code)===employee.employee_code))return toast('รหัสพนักงานนี้มีอยู่แล้ว','error');
    const button=q('#empSave350');button.disabled=true;button.textContent='กำลังบันทึก...';setSync350('กำลังบันทึกข้อมูลพนักงาน...');
    try{await api350('adminEmployeeSave',{employee});await refreshCloud350();closeEmployee350();toast(wasEditing?'แก้ไขข้อมูลพนักงานออนไลน์แล้ว':'เพิ่มพนักงานออนไลน์แล้ว');setSync350('ออนไลน์ · Sync แล้ว')}
    catch(error){setSync350('บันทึกพนักงานไม่สำเร็จ',true);toast('บันทึกไม่สำเร็จ: '+(error?.message||String(error)),'error')}
    finally{button.disabled=false;button.textContent='บันทึกข้อมูล'}
  };

  async function deleteEmployee350(code){
    const employee=(db.employees||[]).find(e=>String(e.employee_code)===String(code));if(!employee)return;
    if(!confirm(`ยืนยันลบพนักงาน ${employee.name||employee.display_name} (${employee.employee_code}) ?\nข้อมูลตารางย้อนหลังจะยังคงอยู่`))return;
    try{setSync350('กำลังลบข้อมูลพนักงาน...');await api350('adminEmployeeDelete',{employee_code:employee.employee_code});await refreshCloud350();toast('ลบพนักงานออกจากฐานข้อมูลปัจจุบันแล้ว');setSync350('ออนไลน์ · Sync แล้ว')}
    catch(error){setSync350('ลบพนักงานไม่สำเร็จ',true);toast('ลบไม่สำเร็จ: '+(error?.message||String(error)),'error')}
  }

  q('#branchCrudForm350').onsubmit=async event=>{
    event.preventDefault();if(!editingBranch350)return;
    if(!adminPin350)return toast('กรุณาออกจาก Admin แล้วเข้าสู่ระบบใหม่ เพื่อยืนยันสิทธิ์','error');
    const name=q('#crudBranchName350').value.trim();if(!name)return toast('กรุณากรอกชื่อสาขา','error');
    const button=q('#branchSave350');button.disabled=true;button.textContent='กำลังบันทึก...';setSync350('กำลังบันทึกชื่อสาขา...');
    try{await api350('adminBranchUpdate',{branch_code:editingBranch350.code,branch_name:name});await refreshCloud350();if(typeof renderHistoryCloud==='function')renderHistoryCloud();closeBranch350();toast('แก้ไขชื่อสาขาที่แสดงทุกจุดแล้ว');setSync350('ออนไลน์ · Sync แล้ว')}
    catch(error){setSync350('บันทึกชื่อสาขาไม่สำเร็จ',true);toast('บันทึกไม่สำเร็จ: '+(error?.message||String(error)),'error')}
    finally{button.disabled=false;button.textContent='บันทึกชื่อสาขา'}
  };

  addBtn.onclick=()=>openEmployee350();branchFilter.onchange=renderEmployees350;
  q('#empModalClose350').onclick=closeEmployee350;q('#empModalCancel350').onclick=closeEmployee350;
  q('#branchModalClose350').onclick=closeBranch350;q('#branchModalCancel350').onclick=closeBranch350;
  employeeModal.addEventListener('click',e=>{if(e.target===employeeModal)closeEmployee350()});branchModal.addEventListener('click',e=>{if(e.target===branchModal)closeBranch350()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(employeeModal.classList.contains('show'))closeEmployee350();if(branchModal.classList.contains('show'))closeBranch350()}});

  window.renderEmployees=()=>{fillBranchControls350();renderEmployees350();renderBranches350()};
  const previousAdminTab=window.adminTab;
  if(typeof previousAdminTab==='function')window.adminTab=function(name){const result=previousAdminTab.apply(this,arguments);if(name==='employees')window.renderEmployees();return result};
  const previousOpenAdmin=window.openAdmin;
  if(typeof previousOpenAdmin==='function')window.openAdmin=function(){const result=previousOpenAdmin.apply(this,arguments);if(q('#admin-employees.active'))window.renderEmployees();return result};

  fillBranchControls350();renderEmployees350();renderBranches350();
  const footer=q('.side footer');if(footer)footer.textContent='Version 3.6 · Displayed Branch Name Editor';
})();
