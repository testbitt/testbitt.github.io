/* Version 3.30 — Order-friendly planning exports + PNG + Powered By OITO */
(()=>{
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const text=v=>String(v??'').trim();
  const number=v=>{const n=Number(String(v??'').replace(/,/g,'').replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0};
  const file=v=>String(v||'ALL').replace(/[^a-zA-Z0-9ก-๙_-]+/g,'_').replace(/^_+|_+$/g,'')||'ALL';

  function planningMeta(){
    const sel=document.querySelector('#planBranch');
    return {
      branchCode:sel?.value||'ALL',
      branchText:sel?.selectedOptions?.[0]?.textContent||sel?.value||'ALL',
      stockDate:text(S?.stockDate||''),
      exportedAt:new Date().toLocaleString('th-TH')
    };
  }

  function planExportRows(){
    const rows=[...document.querySelectorAll('#planTbl tbody tr')].map(tr=>{
      const c=tr.cells;
      const rm=text(c[0]?.textContent);
      return {
        rm,
        desc:text(c[1]?.textContent),
        unit:text(c[2]?.textContent),
        stock:text(c[3]?.textContent),
        usage:text(c[4]?.textContent),
        usageDays:text(c[5]?.textContent),
        daily:text(c[6]?.textContent),
        lead:text(c[7]?.querySelector('input')?.value||c[7]?.textContent),
        required:text(c[8]?.textContent),
        order:text(c[9]?.textContent),
        cover:text(c[10]?.textContent),
        until:text(c[11]?.textContent),
        status:text(c[12]?.textContent)
      };
    }).filter(x=>x.rm && !/^WP/i.test(x.rm));
    rows.sort((a,b)=>{
      const ao=a.status.includes('ควรสั่งเพิ่ม')?0:1,bo=b.status.includes('ควรสั่งเพิ่ม')?0:1;
      if(ao!==bo)return ao-bo;
      const q=number(b.order)-number(a.order);
      return q||a.rm.localeCompare(b.rm,'th',{numeric:true});
    });
    return rows;
  }

  function orderSummary(rows){
    const need=rows.filter(x=>x.status.includes('ควรสั่งเพิ่ม'));
    const enough=rows.filter(x=>x.status.includes('เพียงพอ'));
    const qty=need.reduce((s,x)=>s+number(x.order),0);
    return {need,enough,qty};
  }

  function buildExportPages(rows){
    const meta=planningMeta(),per=22,total=Math.max(1,Math.ceil(rows.length/per)),pages=[];
    const summary=orderSummary(rows);
    for(let p=0;p<total;p++){
      const part=rows.slice(p*per,(p+1)*per);
      const box=document.createElement('div');
      box.className='oito-order-export';
      box.style.cssText='position:fixed;left:-100000px;top:0;width:1500px;padding:38px;background:#fff;color:#173a28;font-family:Arial,"Noto Sans Thai",sans-serif;box-sizing:border-box';
      box.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:5px solid #238a55;padding-bottom:16px;margin-bottom:16px">
          <div>
            <div style="font-size:30px;font-weight:900">KAMU Order Planning</div>
            <div style="font-size:16px;margin-top:4px">Daily Usage & Purchase Recommendation</div>
          </div>
          <div style="text-align:right;font-size:13px"><b>${esc(meta.branchText)}</b><br>Stock Date: ${esc(meta.stockDate||'-')}<br>หน้า ${p+1}/${total}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
          <div style="padding:12px;border-radius:14px;background:#f5fbf7;border:1px solid #d2e8da"><small>รายการทั้งหมด</small><b style="display:block;font-size:24px">${rows.length}</b></div>
          <div style="padding:12px;border-radius:14px;background:#fff0ee;border:1px solid #f1c3bd"><small>ควรสั่งเพิ่ม</small><b style="display:block;font-size:24px;color:#b42318">${summary.need.length}</b></div>
          <div style="padding:12px;border-radius:14px;background:#eaf8ef;border:1px solid #bee2ca"><small>เพียงพอ</small><b style="display:block;font-size:24px;color:#147645">${summary.enough.length}</b></div>
          <div style="padding:12px;border-radius:14px;background:#fff8e8;border:1px solid #edd9a8"><small>Plan Order Qty รวม</small><b style="display:block;font-size:24px">${summary.qty.toLocaleString('th-TH',{maximumFractionDigits:3})}</b></div>
        </div>
        <div style="padding:10px 12px;border-radius:12px;background:#f7faf8;margin-bottom:12px;font-size:12px;color:#5d7567">เรียงรายการ “ควรสั่งเพิ่ม” ก่อน และซ่อนรหัส WP จาก Export เพื่อให้ใช้เป็นรายการสั่งสินค้าได้ง่าย</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr>
            <th>RM Code</th><th>รายการ</th><th>Unit</th><th>จำนวนแนะนำให้สั่ง</th><th>Stock ปัจจุบัน</th><th>ใช้เฉลี่ย/วัน</th><th>Lead Time</th><th>Stock Cover</th><th>ใช้ได้ถึงวันที่</th><th>สถานะ</th>
          </tr></thead>
          <tbody>${part.map((x,i)=>{
            const need=x.status.includes('ควรสั่งเพิ่ม');
            return `<tr style="background:${need?'#fff7f6':i%2?'#f8fcf9':'#fff'}">
              <td><b>${esc(x.rm)}</b></td><td>${esc(x.desc)}</td><td>${esc(x.unit)}</td>
              <td style="font-size:15px;font-weight:900;color:${need?'#b42318':'#17653e'}">${esc(x.order)}</td>
              <td>${esc(x.stock)}</td><td>${esc(x.daily)}</td><td>${esc(x.lead)} วัน</td><td>${esc(x.cover)} วัน</td><td>${esc(x.until)}</td>
              <td><span style="display:inline-block;padding:4px 8px;border-radius:999px;background:${need?'#ffe1df':'#daf5e3'};color:${need?'#b42318':'#116a35'};font-weight:900">${esc(x.status)}</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:11px;color:#668071"><span>Exported: ${esc(meta.exportedAt)}</span><b>Powered By OITO</b></div>
      `;
      box.querySelectorAll('th').forEach(th=>th.style.cssText+=';background:#dff4e7;border:1px solid #abd5ba;padding:8px;text-align:left');
      box.querySelectorAll('td').forEach(td=>td.style.cssText+=';border:1px solid #d5e6dc;padding:8px;vertical-align:middle');
      document.body.appendChild(box);pages.push(box);
    }
    return pages;
  }

  async function renderExportCanvases(rows){
    if(typeof ensureCanvas==='function')await ensureCanvas();
    if(!window.html2canvas)throw Error('Image export library ยังไม่พร้อม');
    const pages=buildExportPages(rows),out=[];
    try{for(const p of pages)out.push(await html2canvas(p,{scale:1.25,backgroundColor:'#ffffff',logging:false,useCORS:true}))}
    finally{pages.forEach(p=>p.remove())}
    return out;
  }

  function saveCanvasPng(canvas,name){
    canvas.toBlob(blob=>{
      if(!blob)return;
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    },'image/png');
  }

  async function exportPlanImage(){
    const rows=planExportRows();if(!rows.length){alert('ไม่พบรายการสำหรับ Export');return}
    const meta=planningMeta(),btn=document.querySelector('#planImage');
    if(btn){btn.disabled=true;btn.textContent='กำลังสร้างรูป...'}
    try{
      const canvases=await renderExportCanvases(rows);
      canvases.forEach((c,i)=>saveCanvasPng(c,`KAMU_Order_Plan_${file(meta.branchCode)}_${file(meta.stockDate||'ALL')}${canvases.length>1?`_Page_${i+1}`:''}.png`));
    }catch(e){alert('Export รูปภาพไม่สำเร็จ: '+(e?.message||e))}
    finally{if(btn){btn.disabled=false;btn.textContent='🖼️ รูปภาพ'}}
  }

  function exportPlanExcel(){
    if(!window.XLSX){alert('Excel library ยังไม่พร้อม');return}
    const rows=planExportRows();if(!rows.length){alert('ไม่พบรายการสำหรับ Export');return}
    const meta=planningMeta(),sum=orderSummary(rows);
    const aoa=[
      ['KAMU Order Planning'],
      ['Branch',meta.branchText],
      ['Stock Date',meta.stockDate],
      ['ควรสั่งเพิ่ม',sum.need.length],
      ['เพียงพอ',sum.enough.length],
      ['Plan Order Qty รวม',sum.qty],
      ['Powered By','OITO'],
      [],
      ['RM Code','รายการ','Unit','จำนวนแนะนำให้สั่ง','Stock ปัจจุบัน','Usage Total','Usage Days','ใช้เฉลี่ย/วัน','Lead Time Days','Required Qty','Stock Cover Days','ใช้ได้ถึงวันที่','สถานะ'],
      ...rows.map(x=>[x.rm,x.desc,x.unit,number(x.order),number(x.stock),number(x.usage),number(x.usageDays),number(x.daily),number(x.lead),number(x.required),number(x.cover),x.until,x.status])
    ];
    const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[{wch:15},{wch:38},{wch:12},{wch:20},{wch:16},{wch:16},{wch:12},{wch:16},{wch:16},{wch:16},{wch:16},{wch:20},{wch:16}];
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Order Plan');
    XLSX.writeFile(wb,`KAMU_Order_Plan_${file(meta.branchCode)}_${file(meta.stockDate||'ALL')}.xlsx`);
  }

  async function exportPlanPdf(){
    const rows=planExportRows();if(!rows.length){alert('ไม่พบรายการสำหรับ Export');return}
    const meta=planningMeta(),btn=document.querySelector('#planPdf');
    if(btn){btn.disabled=true;btn.textContent='กำลังสร้าง PDF...'}
    try{
      if(typeof ensurePdf==='function')await ensurePdf();
      else throw Error('PDF library ยังไม่พร้อม');
      const canvases=await renderExportCanvases(rows),{jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
      canvases.forEach((c,i)=>{if(i)pdf.addPage('a4','landscape');const img=c.toDataURL('image/jpeg',.94),pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),r=Math.min(pw/c.width,ph/c.height);pdf.addImage(img,'JPEG',(pw-c.width*r)/2,(ph-c.height*r)/2,c.width*r,c.height*r)});
      pdf.save(`KAMU_Order_Plan_${file(meta.branchCode)}_${file(meta.stockDate||'ALL')}.pdf`);
    }catch(e){alert('Export PDF ไม่สำเร็จ: '+(e?.message||e))}
    finally{if(btn){btn.disabled=false;btn.textContent='📄 PDF'}}
  }

  function ensurePlanExportUi(){
    const excel=document.querySelector('#planExcel'),pdf=document.querySelector('#planPdf');
    if(!excel||!pdf)return;
    excel.textContent='📗 Excel';pdf.textContent='📄 PDF';
    excel.onclick=exportPlanExcel;pdf.onclick=exportPlanPdf;
    if(!document.querySelector('#planImage')){
      const b=document.createElement('button');b.className='btn';b.id='planImage';b.type='button';b.textContent='🖼️ รูปภาพ';b.onclick=exportPlanImage;pdf.insertAdjacentElement('afterend',b);
    }else document.querySelector('#planImage').onclick=exportPlanImage;
  }

  function ensureOito(){
    if(document.querySelector('#oitoPowered'))return;
    const f=document.createElement('div');f.id='oitoPowered';f.innerHTML='<span>Powered By</span> <b>OITO</b>';document.body.appendChild(f);
  }

  const css=document.createElement('style');
  css.textContent=`
    #oitoPowered{margin:24px auto 16px;text-align:center;color:#789083;font-size:11px;letter-spacing:.2px}
    #oitoPowered b{color:#17653e;font-size:12px;letter-spacing:.8px}
    .cloud-locked #oitoPowered{position:fixed;z-index:12001;left:0;right:0;bottom:10px;margin:0;color:#6b8375}
    #planImage{white-space:nowrap}
  `;
  document.head.appendChild(css);

  ensureOito();ensurePlanExportUi();
  setTimeout(ensurePlanExportUi,400);setTimeout(ensurePlanExportUi,1200);
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{ensureOito();ensurePlanExportUi()},120));

  const v=document.querySelector('.version');
  if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.30 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();
