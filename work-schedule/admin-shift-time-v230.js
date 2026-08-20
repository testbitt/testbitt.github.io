(()=>{
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const tabs=q('#adminPanel .tabs');
  const dayBtn=tabs?.querySelector('[data-admin="adminschedule"]');
  if(!tabs||!dayBtn||q('[data-admin="shifttime"]'))return;

  const style=document.createElement('style');
  style.id='adminShiftTimeV230Style';
  style.textContent=`
    #admin-shifttime .shift-time-picker{position:relative;min-width:270px}
    #admin-shifttime .shift-time-picker summary{list-style:none;cursor:pointer;border:1px solid #cfe5dc;border-radius:10px;background:#fff;padding:9px 10px;min-height:40px;display:flex;align-items:center;justify-content:space-between}
    #admin-shifttime .shift-time-options{position:absolute;z-index:40;top:44px;left:0;min-width:330px;max-height:330px;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:10px}
    #admin-shifttime .shift-time-options label{display:flex;gap:8px;align-items:flex-start;padding:7px 4px;color:#315f52}
    #admin-shifttime .shift-time-table th{text-align:center;white-space:nowrap}
    #admin-shifttime .shift-time-table th:first-child,#admin-shifttime .shift-time-table th:nth-child(2){text-align:left}
    #admin-shifttime .shift-time-table td{text-align:center;vertical-align:middle;font-size:13px}
    #admin-shifttime .shift-time-table td:first-child,#admin-shifttime .shift-time-table td:nth-child(2){text-align:left}
    #admin-shifttime .work-time{font-weight:800;color:#174f40;font-size:13px;white-space:nowrap}
    #admin-shifttime .ot-time{display:block;margin-top:4px;font-size:10px;color:#8a6500;background:#fff3cd;border-radius:999px;padding:2px 6px;white-space:nowrap}
    #admin-shifttime .state-h{background:#eaf4ff;color:#315f8a}.state-vl{background:#f4eeff;color:#765b86}.state-ex{background:#ffeded;color:#934b4b}
    @media(max-width:760px){#admin-shifttime .shift-time-picker{min-width:100%;width:100%}.shift-time-options{min-width:min(330px,90vw)!important}}
  `;
  document.head.appendChild(style);

  const btn=document.createElement('button');
  btn.type='button';btn.dataset.admin='shifttime';btn.textContent='ตาราง + กะงาน';
  dayBtn.insertAdjacentElement('afterend',btn);

  const section=document.createElement('div');
  section.className='admin-sec';section.id='admin-shifttime';
  section.innerHTML=`
    <div class="card filters">
      <div class="field shift-time-picker"><span style="font-size:12px;color:var(--muted)">สาขา</span>
        <details id="shiftTimeBranchPicker"><summary><span id="shiftTimeBranchSummary">เลือกสาขา</span><span>▾</span></summary><div class="shift-time-options" id="shiftTimeBranchOptions"></div></details>
      </div>
      <label>สัปดาห์<input id="shiftTimeWeek" type="date"></label>
      <button class="btn secondary" id="shiftTimeLoad" type="button">แสดงข้อมูล</button>
      <div class="grow"></div>
      <button class="btn ghost" id="shiftTimeExportExcel" type="button">Export Excel</button>
      <button class="btn ghost" id="shiftTimeExportCsv" type="button">Export CSV</button>
    </div>
    <div class="card">
      <div class="section-head"><div><h2>ตาราง Admin / กะงาน</h2><p>แสดงเวลาทำงานจริงจากตารางที่บันทึกไว้</p></div></div>
      <div class="scroll"><table class="data shift-time-table" id="shiftTimeTable"><tbody><tr><td class="empty">เลือกสาขาและสัปดาห์ แล้วกด “แสดงข้อมูล”</td></tr></tbody></table></div>
    </div>`;
  const daySection=q('#admin-adminschedule');
  if(daySection)daySection.insertAdjacentElement('afterend',section);else q('#adminPanel')?.appendChild(section);

  let selected=new Set();
  const summary=q('#shiftTimeBranchSummary'),options=q('#shiftTimeBranchOptions'),picker=q('#shiftTimeBranchPicker'),week=q('#shiftTimeWeek'),table=q('#shiftTimeTable');
  const fmtDate=s=>{const [y,m,d]=String(s||'').split('-');return d&&m&&y?`${d}/${m}/${y}`:String(s||'')};
  const branches=()=>Array.isArray(db?.branches)?db.branches.filter(b=>b.active!==false).slice().sort((a,b)=>String(a.code).localeCompare(String(b.code))):[];
  const csvEscape=v=>{const s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};

  function renderPicker(){
    const all=branches();
    for(const code of [...selected])if(!all.some(b=>b.code===code))selected.delete(code);
    const allChecked=all.length>0&&selected.size===all.length;
    options.innerHTML=`<label style="border-bottom:1px solid var(--line);font-weight:800"><input type="checkbox" id="shiftTimeAllBranches" ${allChecked?'checked':''}> ทุกสาขา</label>`+
      all.map(b=>`<label><input type="checkbox" class="shiftTimeBranchCheck" value="${esc(b.code)}" ${selected.has(b.code)?'checked':''}><span><b>${esc(b.code)}</b>${b.name&&b.name!==b.code?`<br><small style="color:var(--muted)">${esc(b.name)}</small>`:''}</span></label>`).join('');
    summary.textContent=!selected.size?'เลือกสาขา':selected.size===all.length&&all.length?'ทุกสาขา':selected.size===1?[...selected][0]:`เลือกแล้ว ${selected.size} สาขา`;
    const allBox=q('#shiftTimeAllBranches');
    if(allBox)allBox.onchange=()=>{selected=allBox.checked?new Set(all.map(b=>b.code)):new Set();renderPicker();setTimeout(()=>picker.open=false,20)};
    qa('.shiftTimeBranchCheck').forEach(c=>c.onchange=()=>{c.checked?selected.add(c.value):selected.delete(c.value);renderPicker();setTimeout(()=>picker.open=false,20)});
  }

  function selectedSchedules(){
    const w=week.value;
    if(!w)throw new Error('กรุณาเลือกสัปดาห์');
    if(!selected.size)throw new Error('กรุณาเลือกอย่างน้อย 1 สาขา');
    const out=[...selected].map(code=>db.schedules?.[key(code,w)]).filter(Boolean);
    if(!out.length)throw new Error('ไม่พบตารางในสาขาและสัปดาห์ที่เลือก');
    return out;
  }

  function cellHtml(e){
    const n=norm(e?.normal_time||'');
    const cls=n==='H'?'state-h':n==='VL'?'state-vl':n==='EX'?'state-ex':'';
    const work=e?.normal_time||'-';
    const ot=e?.ot_start&&e?.ot_end?`<span class="ot-time">OT ${esc(String(e.ot_start).slice(0,5))}-${esc(String(e.ot_end).slice(0,5))}</span>`:'';
    return `<td class="${cls}"><span class="work-time">${esc(work)}</span>${ot}</td>`;
  }

  function renderTable(){
    try{
      const schedules=selectedSchedules();
      table.innerHTML='';
      schedules.forEach((s,idx)=>{
        const dates=weekDates(s.week_start).map(iso),rows=grouped(s),tbody=document.createElement('tbody');
        if(idx>0)tbody.innerHTML+='<tr><td colspan="9" style="height:18px;background:#f7faf9"></td></tr>';
        tbody.innerHTML+=`<tr><th colspan="9" style="background:#e7f2ee;font-size:13px;text-align:left">${esc(s.branch_code)}${s.branch_name&&s.branch_name!==s.branch_code?' — '+esc(s.branch_name):''}</th></tr>`;
        tbody.innerHTML+=`<tr><th>รหัส</th><th>พนักงาน</th>${dates.map((d,i)=>`<th>${SHORT[i]}<br><small>${fmtDate(d)}</small></th>`).join('')}</tr>`;
        tbody.innerHTML+=rows.map(r=>`<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td>${dates.map(d=>cellHtml(r.days[d]||{})).join('')}</tr>`).join('');
        table.appendChild(tbody);
      });
    }catch(e){toast(e.message,'error')}
  }

  function exportExcel(){
    try{
      const schedules=selectedSchedules(),wb=XLSX.utils.book_new();
      schedules.forEach(s=>{
        const dates=weekDates(s.week_start).map(iso),aoa=[
          [`KAMU WORK SCHEDULE - SHIFT TIME`,s.branch_code,s.branch_name||'',`Week`,s.week_start],
          [],
          ['รหัส','ชื่อพนักงาน','ตำแหน่ง',...SHORT],
          ['','','',...dates.map(fmtDate)]
        ];
        grouped(s).forEach(r=>aoa.push([r.code,r.name,r.position||'',...dates.map(d=>{
          const e=r.days[d]||{};let text=e.normal_time||'';
          if(e.ot_start&&e.ot_end)text+=(text?'\n':'')+`OT ${String(e.ot_start).slice(0,5)}-${String(e.ot_end).slice(0,5)}`;
          return text;
        })]));
        const ws=XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols']=[{wch:14},{wch:28},{wch:18},...Array(7).fill({wch:18})];
        XLSX.utils.book_append_sheet(wb,ws,String(s.branch_code).slice(0,31));
      });
      XLSX.writeFile(wb,'KAMU_SHIFT_TIME_'+week.value+'.xlsx');
      toast('Export Excel กะงานแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  function exportCsv(){
    try{
      const schedules=selectedSchedules(),dates=weekDates(week.value).map(iso),rows=[
        ['BranchCode','BranchName','Week','EmployeeCode','EmployeeName','Position',...SHORT],
        ['','','','','','',...dates.map(fmtDate)]
      ];
      schedules.forEach(s=>grouped(s).forEach(r=>rows.push([
        s.branch_code,s.branch_name||'',s.week_start,r.code,r.name,r.position||'',
        ...dates.map(d=>{
          const e=r.days[d]||{};let text=e.normal_time||'';
          if(e.ot_start&&e.ot_end)text+=(text?' | ':'')+`OT ${String(e.ot_start).slice(0,5)}-${String(e.ot_end).slice(0,5)}`;
          return text;
        })
      ])));
      const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
      const a=document.createElement('a');a.href=url;a.download='KAMU_SHIFT_TIME_'+week.value+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
      toast('Export CSV กะงานแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  btn.onclick=()=>{
    qa('#adminPanel .tabs button').forEach(x=>x.classList.toggle('active',x===btn));
    qa('#adminPanel .admin-sec').forEach(x=>x.classList.toggle('active',x===section));
    const adminWeek=q('#adminWeek')?.value;if(!week.value&&adminWeek)week.value=adminWeek;
    renderPicker();
  };
  q('#shiftTimeLoad').onclick=renderTable;
  q('#shiftTimeExportExcel').onclick=exportExcel;
  q('#shiftTimeExportCsv').onclick=exportCsv;

  const originalRefresh=window.refreshMeta;
  if(typeof originalRefresh==='function')window.refreshMeta=function(){const r=originalRefresh.apply(this,arguments);renderPicker();return r};
  renderPicker();
  const footer=q('.side footer');if(footer)footer.textContent='Version 2.3 · Online Database';
})();