(()=>{
  function printBuildWithNotes(arr){
    $('#printArea').innerHTML=arr.map(s=>`<section class="print-sheet"><h2>KAMU WORK SCHEDULE — ${esc(s.branch_code)}</h2><p>Week ${esc(s.week_start)}</p><table><thead><tr><th>พนักงาน</th>${weekDates(s.week_start).map((d,i)=>`<th>${SHORT[i]}<br>${iso(d)}</th>`).join('')}</tr></thead><tbody>${grouped(s).map(r=>`<tr><td><b>${esc(r.name)}</b><br>${esc(r.code)}</td>${r.dates.map(d=>{const e=r.days[d]||{};const ot=e.ot_start&&e.ot_end?`<br>OT ${esc(e.ot_start)}-${esc(e.ot_end)} ${esc(db.otTypes.find(o=>o.code===e.ot_type)?.name||'')}`:'';const note=e.note?`<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #bbb;text-align:left;font-size:10px;line-height:1.35"><b>หมายเหตุ:</b> ${esc(e.note)}</div>`:'';return `<td>${esc(e.normal_time||'-')}${ot}${note}</td>`}).join('')}</tr>`).join('')}</tbody></table></section>`).join('');
    return $('#printArea');
  }

  function exportExcelWithNotes(){
    try{
      const arr=expSchedules(),wb=XLSX.utils.book_new();
      arr.forEach(s=>{
        const dates=weekDates(s.week_start).map(iso),aoa=[['KAMU WORK SCHEDULE',s.branch_code,'Week',s.week_start],[],['รหัส','ชื่อพนักงาน','ตำแหน่ง']];
        dates.forEach((d,i)=>aoa[2].push(SHORT[i]+' เวลา',SHORT[i]+' เริ่ม OT',SHORT[i]+' เลิก OT',SHORT[i]+' ประเภท',SHORT[i]+' หมายเหตุ'));
        grouped(s).forEach(r=>{
          const line=[r.code,r.name,r.position];
          dates.forEach(d=>{
            const e=r.days[d]||{};
            line.push(e.normal_time||'',e.ot_start||'',e.ot_end||'',db.otTypes.find(o=>o.code===e.ot_type)?.name||'',e.note||'');
          });
          aoa.push(line);
        });
        const ws=XLSX.utils.aoa_to_sheet(aoa),cols=[{wch:14},{wch:28},{wch:16}];
        dates.forEach(()=>cols.push({wch:13},{wch:13},{wch:13},{wch:16},{wch:28}));
        ws['!cols']=cols;
        XLSX.utils.book_append_sheet(wb,ws,String(s.branch_code).slice(0,31));
      });
      XLSX.writeFile(wb,'KAMU_Work_Schedule_'+$('#exportWeek').value+'.xlsx');
      toast('Export Excel พร้อมหมายเหตุแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  async function exportImageWithNotes(type){
    try{
      const root=printBuildWithNotes(expSchedules()),canvas=await html2canvas(root,{scale:1.3,backgroundColor:'#fff'});
      if(type==='png'){
        const a=document.createElement('a');
        a.download='KAMU_Work_Schedule_'+$('#exportWeek').value+'.png';
        a.href=canvas.toDataURL('image/png');
        a.click();
        return toast('Export PNG พร้อมหมายเหตุแล้ว');
      }
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),img=canvas.toDataURL('image/jpeg',.92),pw=297,ph=210,m=8,w=pw-m*2,h=canvas.height*w/canvas.width;
      let y=0,p=0;
      while(y<h){if(p++)pdf.addPage();pdf.addImage(img,'JPEG',m,m-y,w,h);y+=ph-m*2}
      pdf.save('KAMU_Work_Schedule_'+$('#exportWeek').value+'.pdf');
      toast('Export PDF พร้อมหมายเหตุแล้ว');
    }catch(e){toast(e.message,'error')}
  }

  const xl=$('#xl'),pdf=$('#pdf'),png=$('#png');
  if(xl){xl.onclick=exportExcelWithNotes;const s=xl.querySelector('small');if(s)s.textContent='รวมหมายเหตุ และแก้ไขข้อมูลต่อได้'}
  if(pdf){pdf.onclick=()=>exportImageWithNotes('pdf');const s=pdf.querySelector('small');if(s)s.textContent='รวมหมายเหตุในตาราง'}
  if(png){png.onclick=()=>exportImageWithNotes('png');const s=png.querySelector('small');if(s)s.textContent='รวมหมายเหตุ เหมาะสำหรับส่ง LINE'}
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.1 · Public Web';
})();
