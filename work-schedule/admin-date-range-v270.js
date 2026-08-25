(()=>{
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const DAY_NAMES=['SUN','MON','TUE','WED','THU','FRI','SAT'];

  const fmtDate=s=>{const [y,m,d]=String(s||'').split('-');return d&&m&&y?`${d}/${m}/${y}`:String(s||'')};
  const csvEscape=v=>{const s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const addDays=(s,n)=>{const d=new Date(String(s)+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
  const dayName=s=>DAY_NAMES[new Date(String(s)+'T12:00:00').getDay()];
  const dateRange=(start,end)=>{const out=[];let cur=start;while(cur<=end){out.push(cur);cur=addDays(cur,1)}return out};

  function addRangeFields(sectionId,weekId,prefix,loadId){
    const section=q(sectionId),week=q(weekId),load=q(loadId);
    const card=load?.closest('.card.filters')||section?.querySelector('.card.filters');
    if(!section||!week||!load||!card||q(`#${prefix}DateStart`))return;
    const weekLabel=week.closest('label');
    const start=document.createElement('label');start.innerHTML=`วันที่เริ่มต้น<input id="${prefix}DateStart" type="date">`;
    const end=document.createElement('label');end.innerHTML=`วันที่สิ้นสุด<input id="${prefix}DateEnd" type="date">`;
    if(weekLabel){weekLabel.insertAdjacentElement('afterend',end);weekLabel.insertAdjacentElement('afterend',start)}
    else{card.insertBefore(start,load);card.insertBefore(end,load)}
    const sync=()=>{
      if(!week.value)return;
      q(`#${prefix}DateStart`).value=week.value;
      q(`#${prefix}DateEnd`).value=addDays(week.value,6);
    };
    week.addEventListener('change',sync);
    sync();
  }

  addRangeFields('#admin-adminschedule','#adminWeek','adminRange','#adminLoad');
  addRangeFields('#admin-shifttime','#shiftTimeWeek','shiftRange','#shiftTimeLoad');

  const shiftTab=q('[data-admin="shifttime"]');
  if(shiftTab)shiftTab.addEventListener('click',()=>setTimeout(()=>{
    const w=q('#shiftTimeWeek');
    if(w?.value){q('#shiftRangeDateStart').value=w.value;q('#shiftRangeDateEnd').value=addDays(w.value,6)}
  },0));

  function rangeValues(prefix){
    const start=q(`#${prefix}DateStart`)?.value,end=q(`#${prefix}DateEnd`)?.value;
    if(!start||!end)throw new Error('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด');
    if(start>end)throw new Error('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
    return {start,end,dates:dateRange(start,end)};
  }

  function selectedCodes(mode){
    const selector=mode==='day'?'.adminBranchCheck:checked':'.shiftTimeBranchCheck:checked';
    const codes=qa(selector).map(x=>x.value);
    if(!codes.length)throw new Error('กรุณาเลือกอย่างน้อย 1 สาขา');
    return new Set(codes);
  }

  function collect(mode){
    const prefix=mode==='day'?'adminRange':'shiftRange';
    const {start,end,dates}=rangeValues(prefix);
    const codes=selectedCodes(mode);
    const schedules=Object.values(db?.schedules||{}).filter(s=>{
      if(!codes.has(s.branch_code)||!s.week_start)return false;
      const se=addDays(s.week_start,6);
      return s.week_start<=end&&se>=start;
    });
    if(!schedules.length)throw new Error('ไม่พบตารางในสาขาและช่วงวันที่เลือก');

    const groups=new Map();
    schedules.sort((a,b)=>String(a.branch_code).localeCompare(String(b.branch_code))||String(a.week_start).localeCompare(String(b.week_start)));
    schedules.forEach(s=>{
      if(!groups.has(s.branch_code))groups.set(s.branch_code,{branch_code:s.branch_code,branch_name:s.branch_name||s.branch_code,rows:new Map()});
      const g=groups.get(s.branch_code);
      (s.entries||[]).forEach(e=>{
        if(!e.work_date||e.work_date<start||e.work_date>end)return;
        const code=e.employee_code||'';
        if(!g.rows.has(code))g.rows.set(code,{code,name:e.employee_name||code,position:e.position||'',days:{}});
        const r=g.rows.get(code);
        if(e.employee_name)r.name=e.employee_name;if(e.position)r.position=e.position;
        r.days[e.work_date]=e;
      });
    });
    const out=[...groups.values()].map(g=>({...g,rows:[...g.rows.values()].sort((a,b)=>String(a.code).localeCompare(String(b.code)))}));
    if(!out.some(g=>g.rows.length))throw new Error('ไม่พบข้อมูลพนักงานในช่วงวันที่เลือก');
    return {start,end,dates,groups:out};
  }

  function dayCell(e){return e?dayCode(e.normal_time)||e.normal_time||'-':'-'}
  function shiftCell(e){
    if(!e)return '-';
    let t=e.normal_time||'-';
    if(e.ot_start&&e.ot_end){
      const otName=db.otTypes?.find(o=>o.code===e.ot_type)?.name||'';
      t+=` | OT ${String(e.ot_start).slice(0,5)}-${String(e.ot_end).slice(0,5)}${otName?' · '+otName:''}`;
    }
    return t;
  }

  function renderDayRange(){
    try{
      const {start,end,dates,groups}=collect('day'),table=q('#adminTable');
      table.innerHTML='';
      groups.forEach((g,idx)=>{
        const tb=document.createElement('tbody'),colspan=2+dates.length;
        if(idx)tb.innerHTML+=`<tr><td colspan="${colspan}" style="height:16px;background:#f7faf9"></td></tr>`;
        tb.innerHTML+=`<tr><th colspan="${colspan}" style="background:#e7f2ee;font-size:13px;text-align:left">${esc(g.branch_code)}${g.branch_name&&g.branch_name!==g.branch_code?' — '+esc(g.branch_name):''} <small style="font-weight:500">· ${fmtDate(start)}–${fmtDate(end)}</small></th></tr>`;
        tb.innerHTML+=`<tr><th>รหัส</th><th>พนักงาน</th>${dates.map(d=>`<th>${dayName(d)}<br><small>${fmtDate(d)}</small></th>`).join('')}</tr>`;
        tb.innerHTML+=g.rows.map(r=>`<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td>${dates.map(d=>`<td><b>${esc(dayCell(r.days[d]))}</b></td>`).join('')}</tr>`).join('');
        table.appendChild(tb);
      });
      toast(`แสดงข้อมูล ${fmtDate(start)}–${fmtDate(end)} แล้ว`);
    }catch(e){toast(e.message,'error')}
  }

  function renderShiftRange(){
    try{
      const {start,end,dates,groups}=collect('shift'),table=q('#shiftTimeTable');
      table.innerHTML='';
      groups.forEach((g,idx)=>{
        const tb=document.createElement('tbody'),colspan=2+dates.length;
        if(idx)tb.innerHTML+=`<tr><td colspan="${colspan}" style="height:16px;background:#f7faf9"></td></tr>`;
        tb.innerHTML+=`<tr><th colspan="${colspan}" style="background:#e7f2ee;font-size:13px;text-align:left">${esc(g.branch_code)}${g.branch_name&&g.branch_name!==g.branch_code?' — '+esc(g.branch_name):''} <small style="font-weight:500">· ${fmtDate(start)}–${fmtDate(end)}</small></th></tr>`;
        tb.innerHTML+=`<tr><th>รหัส</th><th>พนักงาน</th>${dates.map(d=>`<th>${dayName(d)}<br><small>${fmtDate(d)}</small></th>`).join('')}</tr>`;
        tb.innerHTML+=g.rows.map(r=>`<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td>${dates.map(d=>{
          const e=r.days[d],n=norm(e?.normal_time||''),cls=n==='H'?'state-h':n==='VL'?'state-vl':n==='EX'?'state-ex':'';
          const ot=e?.ot_start&&e?.ot_end?`<span class="ot-time">OT ${esc(String(e.ot_start).slice(0,5))}-${esc(String(e.ot_end).slice(0,5))}</span>`:'';
          return `<td class="${cls}"><span class="work-time">${esc(e?.normal_time||'-')}</span>${ot}</td>`
        }).join('')}</tr>`).join('');
        table.appendChild(tb);
      });
      toast(`แสดงข้อมูล ${fmtDate(start)}–${fmtDate(end)} แล้ว`);
    }catch(e){toast(e.message,'error')}
  }

  function exportExcel(mode){
    try{
      const {start,end,dates,groups}=collect(mode),wb=XLSX.utils.book_new();
      groups.forEach(g=>{
        const title=mode==='day'?'KAMU WORK SCHEDULE - DAY':'KAMU WORK SCHEDULE - SHIFT TIME';
        const aoa=[[title,g.branch_code,g.branch_name||'',`ช่วงวันที่`,`${fmtDate(start)} - ${fmtDate(end)}`],[],['รหัส','ชื่อพนักงาน','ตำแหน่ง',...dates.map(dayName)],['','','',...dates.map(fmtDate)]];
        g.rows.forEach(r=>aoa.push([r.code,r.name,r.position||'',...dates.map(d=>mode==='day'?dayCell(r.days[d]):shiftCell(r.days[d]))]));
        const ws=XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols']=[{wch:14},{wch:28},{wch:18},...dates.map(()=>({wch:mode==='day'?14:24}))];
        XLSX.utils.book_append_sheet(wb,ws,String(g.branch_code).slice(0,31));
      });
      const kind=mode==='day'?'DAY':'SHIFT_TIME';
      XLSX.writeFile(wb,`KAMU_${kind}_${start}_to_${end}.xlsx`);
      toast(`Export Excel ${fmtDate(start)}–${fmtDate(end)} แล้ว`);
    }catch(e){toast(e.message,'error')}
  }

  function exportCsv(mode){
    try{
      const {start,end,dates,groups}=collect(mode),rows=[['BranchCode','BranchName','DateStart','DateEnd','EmployeeCode','EmployeeName','Position',...dates.map(dayName)],['','','','','','','',...dates.map(fmtDate)]];
      groups.forEach(g=>g.rows.forEach(r=>rows.push([g.branch_code,g.branch_name||'',start,end,r.code,r.name,r.position||'',...dates.map(d=>mode==='day'?dayCell(r.days[d]):shiftCell(r.days[d]))])));
      const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');
      const kind=mode==='day'?'DAY':'SHIFT_TIME';
      a.href=url;a.download=`KAMU_${kind}_${start}_to_${end}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
      toast(`Export CSV ${fmtDate(start)}–${fmtDate(end)} แล้ว`);
    }catch(e){toast(e.message,'error')}
  }

  if(q('#adminLoad'))q('#adminLoad').onclick=renderDayRange;
  if(q('#adminExportExcel'))q('#adminExportExcel').onclick=()=>exportExcel('day');
  if(q('#adminExportCsv'))q('#adminExportCsv').onclick=()=>exportCsv('day');
  if(q('#shiftTimeLoad'))q('#shiftTimeLoad').onclick=renderShiftRange;
  if(q('#shiftTimeExportExcel'))q('#shiftTimeExportExcel').onclick=()=>exportExcel('shift');
  if(q('#shiftTimeExportCsv'))q('#shiftTimeExportCsv').onclick=()=>exportCsv('shift');

  const style=document.createElement('style');
  style.id='adminDateRangeV270Style';
  style.textContent=`
    #admin-adminschedule .card.filters label,#admin-shifttime .card.filters label{min-width:132px}
    #admin-adminschedule .card.filters input[type=date],#admin-shifttime .card.filters input[type=date]{min-width:132px}
    @media(max-width:700px){
      #admin-adminschedule .card.filters,#admin-shifttime .card.filters{align-items:stretch!important}
      #admin-adminschedule .card.filters label,#admin-shifttime .card.filters label{flex:1 1 145px;min-width:130px}
    }
  `;
  document.head.appendChild(style);
  const footer=q('.side footer');if(footer)footer.textContent='Version 2.7 · Date Range Export';
})();