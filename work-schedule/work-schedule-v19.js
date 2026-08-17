(()=>{
  const ADMIN_HASH='28995a2c0d04b66d5c7c818536bb00cd1fc1ac422aea47627de0999782fee3f4';
  const ddmmyyyy=v=>{const s=typeof v==='string'?v:iso(v);const [y,m,d]=s.split('-');return d&&m&&y?`${d}/${m}/${y}`:s};

  // ---------- UI additions ----------
  const style=document.createElement('style');
  style.id='workScheduleV19Style';
  style.textContent=`
    .btn.danger{background:#fff1f1;color:#a23535;border:1px solid #f0caca}
    .btn.danger:hover{background:#ffe5e5}
    .hist.v19{grid-template-columns:1.2fr .65fr .65fr .9fr auto auto}
    .admin-chart-card{margin-top:16px}
    .admin-chart-title{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:14px}
    .admin-chart-title h2{margin:0;font-size:18px}.admin-chart-title p{margin:4px 0 0;color:var(--muted);font-size:12px}
    .bar-chart{display:grid;gap:11px}.bar-row{display:grid;grid-template-columns:120px 1fr 54px;gap:10px;align-items:center}
    .bar-label b{display:block;font-size:12px}.bar-label small{display:block;color:var(--muted);font-size:10px;margin-top:2px}
    .bar-track{height:26px;border-radius:999px;background:#edf7f2;overflow:hidden;position:relative;border:1px solid #d8ece4}
    .bar-fill{height:100%;min-width:0;border-radius:999px;background:linear-gradient(90deg,#21a87c,#79d2b2);transition:width .35s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;color:#fff;font-size:10px;font-weight:800}
    .bar-value{text-align:right;font-weight:800;color:#1b624f}.bar-meta{font-size:10px;color:var(--muted);margin-top:4px}
    @media(max-width:980px){.hist.v19{grid-template-columns:1fr 1fr}.hist.v19 .btn{grid-column:auto}.bar-row{grid-template-columns:82px 1fr 42px}}
  `;
  document.head.appendChild(style);

  // ---------- Close branch popup after selecting ----------
  const branchPicker=document.querySelector('#adminBranchPicker');
  const branchOptions=document.querySelector('#adminBranchOptions');
  if(branchOptions&&branchPicker){
    branchOptions.addEventListener('change',()=>setTimeout(()=>{branchPicker.open=false},20));
  }

  // ---------- Admin PIN: require on every Admin entry, do not persist ----------
  function lockAdmin(){
    admin=false;
    try{sessionStorage.removeItem('kamu_admin')}catch{}
    const lock=document.querySelector('#adminLock'),panel=document.querySelector('#adminPanel');
    if(lock)lock.classList.remove('hidden');
    if(panel)panel.classList.add('hidden');
    const pin=document.querySelector('#pin');if(pin)pin.value='';
  }
  lockAdmin();

  const adminNav=[...document.querySelectorAll('.nav button')].find(b=>b.dataset.page==='admin');
  if(adminNav){
    adminNav.onclick=()=>{
      page('admin');
      lockAdmin();
      setTimeout(()=>document.querySelector('#pin')?.focus(),20);
    };
  }
  const loginForm=document.querySelector('#login');
  if(loginForm){
    loginForm.onsubmit=async e=>{
      e.preventDefault();
      const value=document.querySelector('#pin')?.value||'';
      const h=await sha(value);
      if(h!==ADMIN_HASH){toast('รหัสไม่ถูกต้อง','error');return;}
      admin=true;
      document.querySelector('#pin').value='';
      openAdmin();
      toast('เข้าสู่ระบบ Admin แล้ว');
    };
  }

  // ---------- History: Edit + protected Delete ----------
  function renderHistoryV19(){
    const b=document.querySelector('#historyBranch')?.value||'ALL';
    const arr=Object.values(db.schedules).filter(s=>b==='ALL'||s.branch_code===b).sort((a,b)=>b.week_start.localeCompare(a.week_start));
    const root=document.querySelector('#history');
    if(!root)return;
    root.innerHTML=arr.length?arr.map(s=>`<div class="hist v19">
      <div><b>${esc(s.branch_code)} ${esc(s.branch_name||'')}</b><span>Week ${esc(s.week_start)}</span></div>
      <div><b>${new Set(s.entries.map(e=>e.employee_code)).size} คน</b><span>จำนวนพนักงาน</span></div>
      <div><b>Version ${s.version}</b><span>${esc(s.status)}</span></div>
      <div><b>${esc(s.scheduler_name)}</b><span>ผู้จัดตาราง</span></div>
      <button class="btn secondary openHistV19" data-b="${esc(s.branch_code)}" data-w="${esc(s.week_start)}">เปิด / แก้ไข</button>
      <button class="btn danger deleteHistV19" data-b="${esc(s.branch_code)}" data-w="${esc(s.week_start)}">ลบ</button>
    </div>`).join(''):'<div class="empty">ยังไม่มีตารางย้อนหลัง</div>';
    root.querySelectorAll('.openHistV19').forEach(x=>x.onclick=()=>{
      document.querySelector('#branch').value=x.dataset.b;
      document.querySelector('#week').value=x.dataset.w;
      page('schedule');loadSchedule();
    });
    root.querySelectorAll('.deleteHistV19').forEach(x=>x.onclick=async()=>{
      const entered=window.prompt('กรอกรหัส Admin เพื่อยืนยันการลบตารางนี้');
      if(entered===null)return;
      if(await sha(entered)!==ADMIN_HASH){toast('รหัสไม่ถูกต้อง ไม่ได้ลบข้อมูล','error');return;}
      const id=key(x.dataset.b,x.dataset.w);
      const s=db.schedules[id];
      if(!s)return toast('ไม่พบตาราง','error');
      if(!window.confirm(`ยืนยันลบตาราง ${s.branch_code} Week ${s.week_start} ?\nการลบไม่สามารถย้อนกลับได้`))return;
      delete db.schedules[id];
      if(Array.isArray(db.versions))db.versions=db.versions.filter(v=>v.schedule_id!==id);
      saveDB();
      renderHistoryV19();
      toast('ลบตารางเรียบร้อยแล้ว');
    });
  }
  window.renderHistory=renderHistoryV19;
  const historyLoad=document.querySelector('#historyLoad');if(historyLoad)historyLoad.onclick=renderHistoryV19;

  // ---------- Export: show date directly below day, keep notes ----------
  function printBuildV19(arr){
    document.querySelector('#printArea').innerHTML=arr.map(s=>`<section class="print-sheet">
      <h2>KAMU WORK SCHEDULE — ${esc(s.branch_code)}</h2><p>Week ${esc(s.week_start)}</p>
      <table><thead><tr><th>พนักงาน</th>${weekDates(s.week_start).map((d,i)=>`<th>${SHORT[i]}<br><span style="font-size:10px;font-weight:600">${ddmmyyyy(iso(d))}</span></th>`).join('')}</tr></thead>
      <tbody>${grouped(s).map(r=>`<tr><td><b>${esc(r.name)}</b><br>${esc(r.code)}</td>${r.dates.map(d=>{
        const e=r.days[d]||{};
        const ot=e.ot_start&&e.ot_end?`<br>OT ${esc(e.ot_start)}-${esc(e.ot_end)} ${esc(db.otTypes.find(o=>o.code===e.ot_type)?.name||'')}`:'';
        const note=e.note?`<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #bbb;text-align:left;font-size:10px;line-height:1.35"><b>หมายเหตุ:</b> ${esc(e.note)}</div>`:'';
        return `<td>${esc(e.normal_time||'-')}${ot}${note}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></section>`).join('');
    return document.querySelector('#printArea');
  }

  function exportExcelV19(){
    try{
      const arr=expSchedules(),wb=XLSX.utils.book_new();
      arr.forEach(s=>{
        const dates=weekDates(s.week_start).map(iso);
        const dayRow=['รหัส','ชื่อพนักงาน','ตำแหน่ง'];
        const dateRow=['','',''];
        const fieldRow=['','',''];
        dates.forEach((d,i)=>{
          dayRow.push(SHORT[i],'','','','');
          dateRow.push(ddmmyyyy(d),'','','','');
          fieldRow.push('เวลา','เริ่ม OT','เลิก OT','ประเภท','หมายเหตุ');
        });
        const aoa=[['KAMU WORK SCHEDULE',s.branch_code,'Week',s.week_start],[],dayRow,dateRow,fieldRow];
        grouped(s).forEach(r=>{
          const line=[r.code,r.name,r.position];
          dates.forEach(d=>{
            const e=r.days[d]||{};
            line.push(e.normal_time||'',e.ot_start||'',e.ot_end||'',db.otTypes.find(o=>o.code===e.ot_type)?.name||'',e.note||'');
          });
          aoa.push(line);
        });
        const ws=XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols']=[{wch:14},{wch:28},{wch:16},...dates.flatMap(()=>[{wch:13},{wch:13},{wch:13},{wch:16},{wch:28}])];
        ws['!merges']=[];
        dates.forEach((_,i)=>{
          const c=3+i*5;
          ws['!merges'].push({s:{r:2,c},e:{r:2,c:c+4}},{s:{r:3,c},e:{r:3,c:c+4}});
        });
        XLSX.utils.book_append_sheet(wb,ws,String(s.branch_code).slice(0,31));
      });
      XLSX.writeFile(wb,'KAMU_Work_Schedule_'+document.querySelector('#exportWeek').value+'.xlsx');
      toast('Export Excel พร้อมวันที่และหมายเหตุแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  async function exportImageV19(type){
    try{
      const root=printBuildV19(expSchedules()),canvas=await html2canvas(root,{scale:1.3,backgroundColor:'#fff'});
      if(type==='png'){
        const a=document.createElement('a');a.download='KAMU_Work_Schedule_'+document.querySelector('#exportWeek').value+'.png';a.href=canvas.toDataURL('image/png');a.click();
        return toast('Export PNG พร้อมวันที่และหมายเหตุแล้ว');
      }
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),img=canvas.toDataURL('image/jpeg',.92),pw=297,ph=210,m=8,w=pw-m*2,h=canvas.height*w/canvas.width;
      let y=0,p=0;while(y<h){if(p++)pdf.addPage();pdf.addImage(img,'JPEG',m,m-y,w,h);y+=ph-m*2}
      pdf.save('KAMU_Work_Schedule_'+document.querySelector('#exportWeek').value+'.pdf');toast('Export PDF พร้อมวันที่และหมายเหตุแล้ว');
    }catch(e){toast(e.message,'error')}
  }
  const xl=document.querySelector('#xl'),pdf=document.querySelector('#pdf'),png=document.querySelector('#png');
  if(xl)xl.onclick=exportExcelV19;if(pdf)pdf.onclick=()=>exportImageV19('pdf');if(png)png.onclick=()=>exportImageV19('png');

  // ---------- Admin schedule bar chart ----------
  const adminScheduleSection=document.querySelector('#admin-adminschedule');
  let chartCard=document.querySelector('#adminScheduleChart');
  if(adminScheduleSection&&!chartCard){
    chartCard=document.createElement('div');chartCard.id='adminScheduleChart';chartCard.className='card admin-chart-card';
    chartCard.innerHTML='<div class="admin-chart-title"><div><h2>กราฟจำนวนพนักงานเข้ากะรายวัน</h2><p>สรุปจากสาขาที่เลือกในสัปดาห์เดียวกัน</p></div><span class="pill" id="adminChartScope">-</span></div><div class="bar-chart" id="adminBarChart"><div class="empty">เลือกสาขาและสัปดาห์ แล้วกด “แสดงข้อมูล”</div></div>';
    adminScheduleSection.appendChild(chartCard);
  }
  function selectedAdminCodes(){return [...document.querySelectorAll('.adminBranchCheck:checked')].map(x=>x.value)}
  function renderAdminBars(){
    const w=document.querySelector('#adminWeek')?.value,codes=selectedAdminCodes(),root=document.querySelector('#adminBarChart');
    if(!root||!w||!codes.length){if(root)root.innerHTML='<div class="empty">เลือกสาขาและสัปดาห์ แล้วกด “แสดงข้อมูล”</div>';return;}
    const schedules=codes.map(c=>db.schedules[key(c,w)]).filter(Boolean),dates=weekDates(w).map(iso);
    if(!schedules.length){root.innerHTML='<div class="empty">ยังไม่มีตารางในสาขาและสัปดาห์ที่เลือก</div>';return;}
    const stats=dates.map((date,i)=>{
      let work=0,ot=0,off=0;
      schedules.forEach(s=>(s.entries||[]).filter(e=>e.work_date===date).forEach(e=>{
        const n=norm(e.normal_time||'');
        if(n&&/^(H|VL|EX)$/.test(n))off++;else if(n)work++;
        if(e.ot_start&&e.ot_end)ot++;
      }));
      return {day:SHORT[i],date,work,ot,off};
    });
    const max=Math.max(1,...stats.map(x=>x.work));
    root.innerHTML=stats.map(x=>`<div class="bar-row"><div class="bar-label"><b>${x.day}</b><small>${ddmmyyyy(x.date)}</small></div><div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(x.work?7:0,(x.work/max)*100)}%">${x.work||''}</div></div><div class="bar-meta">OT ${x.ot} คน · H/VL/EX ${x.off} คน</div></div><div class="bar-value">${x.work} คน</div></div>`).join('');
    const scope=document.querySelector('#adminChartScope');if(scope)scope.textContent=`${schedules.length} สาขา · Week ${w}`;
  }
  const adminLoad=document.querySelector('#adminLoad');
  if(adminLoad){const old=adminLoad.onclick;adminLoad.onclick=function(e){if(typeof old==='function')old.call(this,e);setTimeout(renderAdminBars,20);const p=document.querySelector('#adminBranchPicker');if(p)p.open=false;};}

  // Version
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.9 · Cute Green Anime';
})();
