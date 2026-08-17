(()=>{
  const VERSION='1.11';
  const GREEN='148965',DARK='0F5F49',MINT='EAF8F2',MINT2='F6FCF9',LINE='B9DECF',WHITE='FFFFFF',TEXT='173E33',MUTED='638378',YELLOW='FFF4D8',BLUE='E9F4FF',PURPLE='F3ECFF',PINK='FFECEC';
  const ddmmyyyy=v=>{const s=String(v||'');const [y,m,d]=s.split('-');return d&&m&&y?`${d}/${m}/${y}`:s};
  const csvEscape=v=>{const s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};

  // ---------- Export page cards ----------
  const css=document.createElement('style');
  css.textContent=`
    #page-export .export-grid{gap:16px}
    #page-export .export-btn{min-height:110px;border:1px solid #cce8dc;background:linear-gradient(145deg,#fff,#f7fdf9);box-shadow:0 8px 24px rgba(19,120,87,.06);transition:.2s ease}
    #page-export .export-btn:hover{transform:translateY(-2px);border-color:#88cfb5;box-shadow:0 12px 28px rgba(19,120,87,.12)}
    #page-export .export-btn b{background:linear-gradient(145deg,#dff7ed,#c9efe1);color:#0f7558;font-size:15px}
    #page-export .export-btn span{color:#164e3f;font-size:17px}
    #page-export .export-btn small{color:#78958b;line-height:1.45}
  `;
  document.head.appendChild(css);

  // ---------- Styled XLSX loader ----------
  let styledPromise=null;
  function ensureStyledXLSX(){
    if(window.__KSP_XLSX_STYLE_READY&&window.XLSX)return Promise.resolve(window.XLSX);
    if(styledPromise)return styledPromise;
    styledPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
      s.onload=()=>{window.__KSP_XLSX_STYLE_READY=true;resolve(window.XLSX)};
      s.onerror=()=>reject(new Error('ไม่สามารถโหลดตัวจัดรูปแบบ Excel ได้'));
      document.head.appendChild(s);
    });
    return styledPromise;
  }

  const border={top:{style:'thin',color:{rgb:LINE}},bottom:{style:'thin',color:{rgb:LINE}},left:{style:'thin',color:{rgb:LINE}},right:{style:'thin',color:{rgb:LINE}}};
  const styleTitle={font:{bold:true,color:{rgb:WHITE},sz:18},fill:{fgColor:{rgb:DARK}},alignment:{horizontal:'left',vertical:'center'},border};
  const styleSub={font:{bold:true,color:{rgb:DARK},sz:11},fill:{fgColor:{rgb:MINT}},alignment:{horizontal:'left',vertical:'center'},border};
  const styleHead={font:{bold:true,color:{rgb:WHITE},sz:11},fill:{fgColor:{rgb:GREEN}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border};
  const styleDate={font:{bold:true,color:{rgb:DARK},sz:10},fill:{fgColor:{rgb:MINT}},alignment:{horizontal:'center',vertical:'center'},border};
  const baseCell=(fill=WHITE,align='left')=>({font:{color:{rgb:TEXT},sz:10},fill:{fgColor:{rgb:fill}},alignment:{horizontal:align,vertical:'center',wrapText:true},border});
  const stateFill=e=>{const n=norm(e?.normal_time||'');if(n==='H')return BLUE;if(n==='VL')return PURPLE;if(n==='EX')return PINK;if(e?.ot_start&&e?.ot_end)return YELLOW;return null};
  function dayText(e){
    if(!e)return '';
    const out=[];
    if(e.normal_time)out.push(e.normal_time);
    if(e.ot_start&&e.ot_end){const name=db.otTypes.find(o=>o.code===e.ot_type)?.name||'';out.push(`OT ${e.ot_start}-${e.ot_end}${name?' · '+name:''}`)}
    if(e.note)out.push(`หมายเหตุ: ${e.note}`);
    return out.join('\n');
  }
  function setCellStyle(X,ws,addr,style){if(ws[addr])ws[addr].s=style}

  // ---------- Main Excel: one equal column per day ----------
  async function exportExcelBeautiful(){
    try{
      const X=await ensureStyledXLSX();
      const arr=expSchedules(),wb=X.utils.book_new();
      arr.forEach(s=>{
        const dates=weekDates(s.week_start).map(iso),rows=grouped(s);
        const aoa=[
          [`KSP · KAMU WORK SCHEDULE — ${s.branch_code}${s.branch_name?' · '+s.branch_name:''}`],
          [`Week ${ddmmyyyy(s.week_start)}  |  ผู้จัดตาราง: ${s.scheduler_name||'-'}  |  Version ${s.version||1}`],
          [],
          ['รหัส','ชื่อพนักงาน','ตำแหน่ง',...SHORT],
          ['','','',...dates.map(ddmmyyyy)]
        ];
        rows.forEach(r=>aoa.push([r.code,r.name,r.position||'',...dates.map(d=>dayText(r.days[d]||{}))]));
        const ws=X.utils.aoa_to_sheet(aoa);
        const totalCols=10;
        ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:totalCols-1}},{s:{r:1,c:0},e:{r:1,c:totalCols-1}}];
        ws['!cols']=[{wch:14},{wch:28},{wch:18},...Array(7).fill({wch:23})];
        ws['!rows']=[{hpt:30},{hpt:22},{hpt:8},{hpt:24},{hpt:20},...rows.map(()=>({hpt:54}))];
        setCellStyle(X,ws,'A1',styleTitle);setCellStyle(X,ws,'A2',styleSub);
        for(let c=0;c<totalCols;c++){
          setCellStyle(X,ws,X.utils.encode_cell({r:3,c}),styleHead);
          setCellStyle(X,ws,X.utils.encode_cell({r:4,c}),c<3?styleDate:styleDate);
        }
        rows.forEach((r,ri)=>{
          const rr=5+ri,base=ri%2===0?WHITE:MINT2;
          for(let c=0;c<3;c++)setCellStyle(X,ws,X.utils.encode_cell({r:rr,c}),baseCell(base,c===0?'center':'left'));
          dates.forEach((d,i)=>{
            const e=r.days[d]||{},fill=stateFill(e)||base;
            setCellStyle(X,ws,X.utils.encode_cell({r:rr,c:3+i}),baseCell(fill,'center'));
          });
        });
        X.utils.book_append_sheet(wb,ws,String(s.branch_code).slice(0,31));
      });
      X.writeFile(wb,'KAMU_Work_Schedule_'+document.querySelector('#exportWeek').value+'.xlsx');
      toast('Export Excel รูปแบบใหม่เรียบร้อยแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  // ---------- Beautiful PDF / PNG table ----------
  function printBuildBeautiful(arr){
    const root=document.querySelector('#printArea');
    root.innerHTML=arr.map(s=>{
      const dates=weekDates(s.week_start).map(iso),rows=grouped(s);
      return `<section class="beauty-sheet" style="width:1500px;background:#fff;color:#173e33;padding:30px;font-family:Inter,Arial,sans-serif;box-sizing:border-box;margin-bottom:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0f674f,#15916b);color:#fff;border-radius:18px;padding:18px 22px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:14px"><div style="width:52px;height:52px;border-radius:15px;background:#fff;color:#12805f;display:grid;place-items:center;font-weight:900;font-size:18px">KSP</div><div><div style="font-size:23px;font-weight:900">KAMU WORK SCHEDULE</div><div style="font-size:12px;opacity:.86">ตารางงานประจำสัปดาห์</div></div></div>
          <div style="text-align:right"><div style="font-size:18px;font-weight:900">${esc(s.branch_code)}${s.branch_name?' · '+esc(s.branch_name):''}</div><div style="font-size:12px;margin-top:4px">Week ${ddmmyyyy(s.week_start)} · Version ${s.version||1}</div></div>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;margin:0 3px 12px;color:#567a6d;font-size:11px"><span>ผู้จัดตาราง: <b style="color:#214f40">${esc(s.scheduler_name||'-')}</b></span><span>พนักงาน ${rows.length} คน</span></div>
        <table style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;border:1px solid #b9decf;border-radius:14px;overflow:hidden">
          <colgroup><col style="width:19%">${Array(7).fill('<col style="width:11.57%">').join('')}</colgroup>
          <thead><tr><th style="background:#158c69;color:#fff;padding:12px 9px;border-right:1px solid #a9d8c6;text-align:left;font-size:12px">พนักงาน</th>${dates.map((d,i)=>`<th style="background:#158c69;color:#fff;padding:9px 5px;border-right:1px solid #a9d8c6;text-align:center;font-size:12px"><b>${SHORT[i]}</b><div style="margin-top:4px;font-size:10px;font-weight:600;color:#dff7ee">${ddmmyyyy(d)}</div></th>`).join('')}</tr></thead>
          <tbody>${rows.map((r,ri)=>`<tr>${`<td style="background:${ri%2?'#f7fcf9':'#fff'};padding:10px 9px;border-top:1px solid #d6ebe2;border-right:1px solid #d6ebe2;vertical-align:middle;font-size:11px"><b style="font-size:12px;color:#174f3e">${esc(r.name)}</b><div style="color:#6c8a80;margin-top:3px">${esc(r.code)}${r.position?' · '+esc(r.position):''}</div></td>`}${dates.map(d=>{
            const e=r.days[d]||{},n=norm(e.normal_time||''),bg=n==='H'?'#eaf4ff':n==='VL'?'#f4eeff':n==='EX'?'#ffeded':e.ot_start&&e.ot_end?'#fff8e5':ri%2?'#f7fcf9':'#fff';
            const ot=e.ot_start&&e.ot_end?`<div style="display:inline-block;margin-top:5px;padding:3px 6px;border-radius:999px;background:#ffe8a9;color:#805b00;font-size:9px;font-weight:800">OT ${esc(e.ot_start)}-${esc(e.ot_end)}${e.ot_type?' · '+esc(db.otTypes.find(o=>o.code===e.ot_type)?.name||''):''}</div>`:'';
            const note=e.note?`<div style="margin-top:6px;padding-top:5px;border-top:1px dashed #c7ddd4;text-align:left;color:#617d73;font-size:9px;line-height:1.35"><b>หมายเหตุ:</b> ${esc(e.note)}</div>`:'';
            return `<td style="background:${bg};height:66px;padding:8px 6px;border-top:1px solid #d6ebe2;border-right:1px solid #d6ebe2;text-align:center;vertical-align:middle;font-size:11px;line-height:1.35;word-break:break-word"><b style="color:#174f3e">${esc(e.normal_time||'-')}</b>${ot}${note}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table>
        <div style="display:flex;gap:14px;justify-content:flex-end;margin-top:10px;font-size:9px;color:#6a8a7d"><span>■ OT</span><span>■ H วันหยุด</span><span>■ VL พักร้อน</span><span>■ EX นักขัตฤกษ์</span></div>
      </section>`;
    }).join('');
    return root;
  }

  async function exportVisualBeautiful(type){
    try{
      const root=printBuildBeautiful(expSchedules());
      const sheets=[...root.querySelectorAll('.beauty-sheet')];
      if(type==='png'){
        const canvas=await html2canvas(root,{scale:1.25,backgroundColor:'#ffffff',useCORS:true});
        const a=document.createElement('a');a.download='KAMU_Work_Schedule_'+document.querySelector('#exportWeek').value+'.png';a.href=canvas.toDataURL('image/png');a.click();
        return toast('Export PNG รูปแบบใหม่เรียบร้อยแล้ว');
      }
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),pw=297,ph=210,m=7;
      for(let i=0;i<sheets.length;i++){
        if(i>0)pdf.addPage();
        const canvas=await html2canvas(sheets[i],{scale:1.35,backgroundColor:'#ffffff',useCORS:true});
        const img=canvas.toDataURL('image/jpeg',.94),availW=pw-m*2,availH=ph-m*2,ratio=Math.min(availW/canvas.width,availH/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio,x=(pw-w)/2,y=(ph-h)/2;
        pdf.addImage(img,'JPEG',x,y,w,h);
      }
      pdf.save('KAMU_Work_Schedule_'+document.querySelector('#exportWeek').value+'.pdf');toast('Export PDF รูปแบบใหม่เรียบร้อยแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  // ---------- Admin DAY Excel styled ----------
  function adminSelectedSchedules(){
    const w=document.querySelector('#adminWeek')?.value;if(!w)throw Error('กรุณาเลือกสัปดาห์');
    const codes=[...document.querySelectorAll('.adminBranchCheck:checked')].map(x=>x.value);if(!codes.length)throw Error('กรุณาเลือกอย่างน้อย 1 สาขา');
    const out=codes.map(c=>db.schedules[key(c,w)]).filter(Boolean);if(!out.length)throw Error('ไม่พบตารางในสาขาและสัปดาห์ที่เลือก');return out;
  }
  async function exportAdminExcelBeautiful(){
    try{
      const X=await ensureStyledXLSX(),schedules=adminSelectedSchedules(),wb=X.utils.book_new();
      schedules.forEach(s=>{
        const dates=weekDates(s.week_start).map(iso),rows=grouped(s),aoa=[
          [`KSP · KAMU DAY SCHEDULE — ${s.branch_code}${s.branch_name?' · '+s.branch_name:''}`],
          [`Week ${ddmmyyyy(s.week_start)}`],[],
          ['รหัส','ชื่อพนักงาน','ตำแหน่ง',...SHORT],['','','',...dates.map(ddmmyyyy)]
        ];
        rows.forEach(r=>aoa.push([r.code,r.name,r.position||'',...dates.map(d=>dayCode((r.days[d]||{}).normal_time)||'')]));
        const ws=X.utils.aoa_to_sheet(aoa),totalCols=10;
        ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:9}},{s:{r:1,c:0},e:{r:1,c:9}}];
        ws['!cols']=[{wch:14},{wch:28},{wch:18},...Array(7).fill({wch:15})];
        ws['!rows']=[{hpt:30},{hpt:22},{hpt:8},{hpt:24},{hpt:20},...rows.map(()=>({hpt:24}))];
        setCellStyle(X,ws,'A1',styleTitle);setCellStyle(X,ws,'A2',styleSub);
        for(let c=0;c<totalCols;c++){setCellStyle(X,ws,X.utils.encode_cell({r:3,c}),styleHead);setCellStyle(X,ws,X.utils.encode_cell({r:4,c}),styleDate)}
        rows.forEach((r,ri)=>{const rr=5+ri,base=ri%2===0?WHITE:MINT2;for(let c=0;c<3;c++)setCellStyle(X,ws,X.utils.encode_cell({r:rr,c}),baseCell(base,c===0?'center':'left'));dates.forEach((d,i)=>{const e=r.days[d]||{},fill=stateFill(e)||base;setCellStyle(X,ws,X.utils.encode_cell({r:rr,c:3+i}),baseCell(fill,'center'))})});
        X.utils.book_append_sheet(wb,ws,String(s.branch_code).slice(0,31));
      });
      X.writeFile(wb,'KAMU_DAY_Schedule_'+document.querySelector('#adminWeek').value+'.xlsx');toast('Export Excel DAY รูปแบบใหม่แล้ว');
    }catch(e){toast(e.message,'error')}
  }

  // CSV cannot store visual formatting; keep same logical equal day columns.
  function exportAdminCsvConsistent(){
    try{
      const schedules=adminSelectedSchedules(),week=document.querySelector('#adminWeek').value,dates=weekDates(week).map(iso),rows=[];
      rows.push(['BranchCode','BranchName','Week','EmployeeCode','EmployeeName','Position',...SHORT]);
      rows.push(['','','','','','',...dates.map(ddmmyyyy)]);
      schedules.forEach(s=>{const ds=weekDates(s.week_start).map(iso);grouped(s).forEach(r=>rows.push([s.branch_code,s.branch_name||'',s.week_start,r.code,r.name,r.position||'',...ds.map(d=>dayCode((r.days[d]||{}).normal_time)||'')]))});
      const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');
      a.href=url;a.download='KAMU_DAY_Schedule_'+week+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);toast('Export CSV ตารางมาตรฐานเรียบร้อยแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  // ---------- Bind last so this version wins ----------
  const xl=document.querySelector('#xl'),pdf=document.querySelector('#pdf'),png=document.querySelector('#png');
  if(xl){xl.onclick=exportExcelBeautiful;xl.querySelector('small').textContent='ตารางสีเขียว–ขาว ช่องวันเท่ากัน แก้ไขต่อได้'}
  if(pdf){pdf.onclick=()=>exportVisualBeautiful('pdf');pdf.querySelector('small').textContent='จัดหน้าสวยงาม ช่องวันเท่ากัน'}
  if(png){png.onclick=()=>exportVisualBeautiful('png');png.querySelector('small').textContent='ตารางสีเขียว–ขาว พร้อมส่ง LINE'}
  const ax=document.querySelector('#adminExportExcel'),ac=document.querySelector('#adminExportCsv');
  if(ax)ax.onclick=exportAdminExcelBeautiful;
  if(ac){ac.onclick=exportAdminCsvConsistent;ac.title='CSV ไม่รองรับสีหรือความกว้างคอลัมน์ แต่จัดโครงสร้างวัน/วันที่ให้ตรงกัน'}
  const footer=document.querySelector('.side footer');if(footer)footer.textContent=`Version ${VERSION} · Cute Green Anime`;
})();
