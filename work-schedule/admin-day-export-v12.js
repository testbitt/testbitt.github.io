(()=>{
  const adminBranchSelect=document.querySelector('#adminBranch');
  const adminWeek=document.querySelector('#adminWeek');
  const adminLoad=document.querySelector('#adminLoad');
  const adminTable=document.querySelector('#adminTable');
  if(!adminBranchSelect||!adminWeek||!adminLoad||!adminTable)return;

  const filterCard=adminBranchSelect.closest('.card.filters');
  const branchLabel=adminBranchSelect.closest('label');
  if(branchLabel)branchLabel.style.display='none';

  const picker=document.createElement('div');
  picker.className='field';
  picker.style.minWidth='260px';
  picker.innerHTML=`<span style="font-size:12px;color:var(--muted)">สาขา</span><details id="adminBranchPicker" style="position:relative"><summary style="list-style:none;cursor:pointer;border:1px solid #cad8d3;border-radius:10px;background:#fff;padding:9px 10px;min-height:40px;display:flex;align-items:center;justify-content:space-between"><span id="adminBranchSummary">เลือกสาขา</span><span>▾</span></summary><div id="adminBranchOptions" style="position:absolute;z-index:30;top:44px;left:0;min-width:310px;max-height:320px;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:10px"></div></details>`;
  if(branchLabel)filterCard.insertBefore(picker,branchLabel); else filterCard.insertBefore(picker,adminWeek.closest('label'));

  const exportWrap=document.createElement('div');
  exportWrap.style.display='flex';exportWrap.style.gap='8px';exportWrap.style.marginLeft='auto';exportWrap.style.flexWrap='wrap';
  exportWrap.innerHTML='<button class="btn ghost" id="adminExportExcel" type="button">Export Excel</button><button class="btn ghost" id="adminExportCsv" type="button">Export CSV</button>';
  filterCard.appendChild(exportWrap);

  const summary=document.querySelector('#adminBranchSummary');
  const options=document.querySelector('#adminBranchOptions');
  let selected=new Set();

  function branchList(){return (db.branches||[]).slice().sort((a,b)=>String(a.code).localeCompare(String(b.code)))}
  function renderPicker(){
    const all=branchList();
    const allChecked=all.length>0&&selected.size===all.length;
    options.innerHTML=`<label style="display:flex;gap:8px;align-items:center;padding:7px 4px;border-bottom:1px solid var(--line);font-weight:700"><input type="checkbox" id="adminAllBranches" ${allChecked?'checked':''}> ทุกสาขา</label>`+all.map(b=>`<label style="display:flex;gap:8px;align-items:flex-start;padding:7px 4px"><input type="checkbox" class="adminBranchCheck" value="${esc(b.code)}" ${selected.has(b.code)?'checked':''}><span><b>${esc(b.code)}</b>${b.name&&b.name!==b.code?`<br><small style="color:var(--muted)">${esc(b.name)}</small>`:''}</span></label>`).join('');
    const count=selected.size;
    summary.textContent=count===0?'เลือกสาขา':count===all.length&&all.length?'ทุกสาขา':count===1?[...selected][0]:`เลือกแล้ว ${count} สาขา`;
    const allBox=document.querySelector('#adminAllBranches');
    if(allBox)allBox.onchange=()=>{selected=allBox.checked?new Set(all.map(b=>b.code)):new Set();renderPicker()};
    document.querySelectorAll('.adminBranchCheck').forEach(c=>c.onchange=()=>{c.checked?selected.add(c.value):selected.delete(c.value);renderPicker()});
  }

  const originalRefresh=window.refreshMeta;
  if(typeof originalRefresh==='function'){
    window.refreshMeta=function(){const r=originalRefresh.apply(this,arguments);renderPicker();return r};
  }
  renderPicker();

  function selectedSchedules(){
    const w=adminWeek.value;
    if(!w)throw Error('กรุณาเลือกสัปดาห์');
    if(!selected.size)throw Error('กรุณาเลือกอย่างน้อย 1 สาขา');
    const out=[];
    [...selected].forEach(code=>{const s=db.schedules[key(code,w)];if(s)out.push(s)});
    if(!out.length)throw Error('ไม่พบตารางในสาขาและสัปดาห์ที่เลือก');
    return out;
  }

  function renderAdminDayOnly(){
    try{
      const schedules=selectedSchedules();
      adminTable.innerHTML='';
      schedules.forEach((s,idx)=>{
        const dates=weekDates(s.week_start).map(iso);
        const section=document.createElement('tbody');
        if(idx>0)section.innerHTML+='<tr><td colspan="9" style="height:18px;background:#f7faf9"></td></tr>';
        section.innerHTML+=`<tr><th colspan="9" style="background:#e7f2ee;font-size:13px">${esc(s.branch_code)}${s.branch_name&&s.branch_name!==s.branch_code?' — '+esc(s.branch_name):''}</th></tr>`;
        section.innerHTML+=`<tr><th>รหัส</th><th>พนักงาน</th>${dates.map((d,i)=>`<th>${SHORT[i]}<br>${d}</th>`).join('')}</tr>`;
        section.innerHTML+=grouped(s).map(r=>`<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td>${dates.map(d=>{const e=r.days[d]||{};return `<td><b>${esc(dayCode(e.normal_time)||'-')}</b></td>`}).join('')}</tr>`).join('');
        adminTable.appendChild(section);
      });
    }catch(e){toast(e.message,'error')}
  }

  function exportDayExcel(){
    try{
      const schedules=selectedSchedules(),wb=XLSX.utils.book_new();
      schedules.forEach(s=>{
        const dates=weekDates(s.week_start).map(iso),aoa=[[`KAMU WORK SCHEDULE - DAY`,s.branch_code,s.branch_name||'',`Week`,s.week_start],[],['รหัส','ชื่อพนักงาน','ตำแหน่ง',...dates.map((d,i)=>SHORT[i]+' '+d)]];
        grouped(s).forEach(r=>aoa.push([r.code,r.name,r.position,...dates.map(d=>dayCode((r.days[d]||{}).normal_time)||'')]));
        const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[{wch:14},{wch:28},{wch:18},...Array(7).fill({wch:15})];
        XLSX.utils.book_append_sheet(wb,ws,String(s.branch_code).slice(0,31));
      });
      XLSX.writeFile(wb,'KAMU_DAY_Schedule_'+adminWeek.value+'.xlsx');toast('Export Excel DAY แล้ว');
    }catch(e){toast(e.message,'error')}
  }

  function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
  function exportDayCsv(){
    try{
      const schedules=selectedSchedules();
      const rows=[['BranchCode','BranchName','Week','EmployeeCode','EmployeeName','Position','MON','TUE','WED','THU','FRI','SAT','SUN']];
      schedules.forEach(s=>{const dates=weekDates(s.week_start).map(iso);grouped(s).forEach(r=>rows.push([s.branch_code,s.branch_name||'',s.week_start,r.code,r.name,r.position,...dates.map(d=>dayCode((r.days[d]||{}).normal_time)||'')]))});
      const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='KAMU_DAY_Schedule_'+adminWeek.value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('Export CSV DAY แล้ว');
    }catch(e){toast(e.message,'error')}
  }

  adminLoad.onclick=renderAdminDayOnly;
  document.querySelector('#adminExportExcel').onclick=exportDayExcel;
  document.querySelector('#adminExportCsv').onclick=exportDayCsv;

  const adminHeading=document.querySelector('#admin-adminschedule .section-head h2');
  const adminSub=document.querySelector('#admin-adminschedule .section-head p');
  if(adminHeading)adminHeading.textContent='ตาราง Admin / DAY Code';
  if(adminSub)adminSub.textContent='แสดงเฉพาะรหัสกะ DAY ตาม Shift Master';
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.2 · Public Web';
})();
