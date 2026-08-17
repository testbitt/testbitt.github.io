(()=>{
  const btn=document.querySelector('#adminExportCsv');
  if(!btn)return;

  const ddmmyyyy=v=>{const s=String(v||'');const [y,m,d]=s.split('-');return d&&m&&y?`${d}/${m}/${y}`:s};
  const csvEscape=v=>{const s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};

  function selectedSchedules(){
    const w=document.querySelector('#adminWeek')?.value;
    if(!w)throw Error('กรุณาเลือกสัปดาห์');
    const codes=[...document.querySelectorAll('.adminBranchCheck:checked')].map(x=>x.value);
    if(!codes.length)throw Error('กรุณาเลือกอย่างน้อย 1 สาขา');
    const out=codes.map(code=>db.schedules[key(code,w)]).filter(Boolean);
    if(!out.length)throw Error('ไม่พบตารางในสาขาและสัปดาห์ที่เลือก');
    return out;
  }

  function exportCsvWithDateRow(){
    try{
      const schedules=selectedSchedules();
      const week=document.querySelector('#adminWeek').value;
      const rows=[];
      const dayHeader=['BranchCode','BranchName','Week','EmployeeCode','EmployeeName','Position',...SHORT];
      rows.push(dayHeader);

      // วันที่อยู่ใต้ชื่อวัน MON-SUN
      const dates=weekDates(week).map(iso);
      rows.push(['','','','','','',...dates.map(ddmmyyyy)]);

      schedules.forEach(s=>{
        const scheduleDates=weekDates(s.week_start).map(iso);
        grouped(s).forEach(r=>{
          rows.push([
            s.branch_code,
            s.branch_name||'',
            s.week_start,
            r.code,
            r.name,
            r.position||'',
            ...scheduleDates.map(d=>dayCode((r.days[d]||{}).normal_time)||'')
          ]);
        });
      });

      const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='KAMU_DAY_Schedule_'+week+'.csv';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),500);
      toast('Export CSV พร้อมวันที่ใต้ชื่อวันแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  btn.onclick=exportCsvWithDateRow;
  btn.title='CSV แสดงชื่อวัน MON-SUN และวันที่ในแถวถัดลงมา';
  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 1.10 · Cute Green Anime';
})();
