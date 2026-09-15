/* Version 3.27 — Inventory Audit count form export/import for every User */
(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-api';
  const FORM_VERSION='KAMU_COUNT_FORM_V1';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const cleanFile=v=>String(v||'').replace(/[^a-zA-Z0-9ก-๙_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'ALL';
  const norm=v=>String(v??'').trim().toLowerCase().replace(/[\s_.\-/\\]+/g,'');
  const asNum=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(n)?n:null};

  function formRows(){return typeof filteredAnalysis==='function'?filteredAnalysis():[]}
  function formMeta(){
    const b=$('#branch'),branchCode=b?.value||'',branchText=b?.selectedOptions?.[0]?.textContent||branchCode;
    const branchName=branchText.includes(' - ')?branchText.split(' - ').slice(1).join(' - ').trim():'';
    return {
      branchCode,branchName,branchText,
      stockDate:T(S?.stockDate||''),itemSaleDate:T($('#date')?.value||''),
      custom:T(activeCustomCheck||''),status:T($('#status')?.value||''),
      createdAt:new Date().toLocaleString('th-TH'),rows:formRows()
    };
  }
  function formBase(meta=formMeta()){
    return `KAMU_Count_Form_${cleanFile(meta.branchCode)}_${cleanFile(meta.stockDate||'NO_STOCK_DATE')}${meta.custom?'_'+cleanFile(meta.custom):''}`;
  }

  function ensureModal(){
    if($('#countFormModal'))return;
    const m=document.createElement('div');m.id='countFormModal';m.className='count-form-backdrop';m.hidden=true;
    m.innerHTML=`<div class="count-form-modal"><div class="count-form-head"><div><h3>📝 สร้างแบบฟอร์มตรวจนับ</h3><p>ใช้รายการตาม Filter / Custom Check ที่กำลังแสดงใน Inventory Audit</p></div><button type="button" class="count-form-x" id="countFormClose">×</button></div><div class="count-form-summary" id="countFormSummary"></div><div class="count-form-note">แบบฟอร์มจะไม่แสดงยอด Theory เพื่อให้พนักงานตรวจนับตามของจริง และมีรหัสสาขา + Stock Date สำหรับตรวจสอบตอน Import</div><div class="count-form-actions"><button class="btn" id="countFormExcel" type="button">📗 Export Excel</button><button class="btn" id="countFormPdf" type="button">📄 Export PDF</button><button class="btn alt" id="countFormCancel" type="button">ปิด</button></div></div>`;
    document.body.appendChild(m);
    $('#countFormClose').onclick=$('#countFormCancel').onclick=()=>m.hidden=true;
    m.onclick=e=>{if(e.target===m)m.hidden=true};
    $('#countFormExcel').onclick=exportCountFormExcel;
    $('#countFormPdf').onclick=exportCountFormPdf;
  }

  function openFormModal(){
    const meta=formMeta();
    if(!meta.branchCode){alert('กรุณาเลือกสาขาก่อนสร้างแบบฟอร์มตรวจนับ');return}
    if(!meta.rows.length){alert('ไม่พบรายการสำหรับสร้างแบบฟอร์ม กรุณาตรวจ Filter / Custom Check');return}
    ensureModal();
    $('#countFormSummary').innerHTML=`<div><span>สาขา</span><b>${esc(meta.branchText)}</b></div><div><span>Stock Date</span><b>${esc(meta.stockDate||'-')}</b></div><div><span>Item Sale Date</span><b>${esc(meta.itemSaleDate||'ทั้งหมด')}</b></div><div><span>Custom Check</span><b>${esc(meta.custom||'ไม่ใช้')}</b></div><div><span>จำนวนรายการ</span><b>${meta.rows.length.toLocaleString('th-TH')} รายการ</b></div>`;
    $('#countFormModal').hidden=false;
  }

  function exportCountFormExcel(){
    if(!window.XLSX){alert('ตัวสร้าง Excel ยังโหลดไม่สำเร็จ กรุณา Refresh แล้วลองใหม่');return}
    const meta=formMeta();if(!meta.rows.length)return;
    const aoa=[
      ['KAMU Inventory Count Form'],
      ['FORM_VERSION',FORM_VERSION],
      ['BRANCH_CODE',meta.branchCode],
      ['BRANCH_NAME',meta.branchName],
      ['STOCK_DATE',meta.stockDate],
      ['ITEM_SALE_DATE',meta.itemSaleDate||'ALL'],
      ['CUSTOM_CHECK',meta.custom||'NONE'],
      ['STATUS_FILTER',meta.status||'ALL'],
      ['CREATED_AT',meta.createdAt],
      ['COUNTER_NAME',''],
      ['COUNT_DATE',''],
      [],
      ['ลำดับ','RM Code','รายการ','Unit','จำนวนตรวจนับ','หมายเหตุ'],
      ...meta.rows.map((x,i)=>[i+1,x.rm,x.desc,x.unit,'',''])
    ];
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols']=[{wch:8},{wch:16},{wch:42},{wch:14},{wch:18},{wch:28}];
    ws['!autofilter']={ref:`A13:F${12+meta.rows.length+1}`};
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Count Form');
    XLSX.writeFile(wb,formBase(meta)+'.xlsx');
  }

  function countFormPages(meta){
    const per=24,total=Math.max(1,Math.ceil(meta.rows.length/per)),pages=[];
    for(let p=0;p<total;p++){
      const part=meta.rows.slice(p*per,(p+1)*per),box=document.createElement('div');
      box.className='count-form-print-page';
      box.style.cssText='position:fixed;left:-100000px;top:0;width:1400px;padding:34px;background:#fff;color:#173a28;font-family:Arial,"Noto Sans Thai",sans-serif;box-sizing:border-box';
      box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #238a55;padding-bottom:14px;margin-bottom:14px"><div><div style="font-size:28px;font-weight:900">KAMU Inventory Count Form</div><div style="font-size:15px;margin-top:4px">แบบฟอร์มตรวจนับสินค้า / วัตถุดิบ</div></div><div style="text-align:right;font-size:13px">หน้า ${p+1}/${total}<br>${esc(meta.createdAt)}</div></div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1.3fr;gap:10px;font-size:14px;margin-bottom:12px"><div><b>สาขา:</b> ${esc(meta.branchText)}</div><div><b>Stock Date:</b> ${esc(meta.stockDate||'-')}</div><div><b>Item Sale:</b> ${esc(meta.itemSaleDate||'ทั้งหมด')}</div><div><b>Custom Check:</b> ${esc(meta.custom||'ไม่ใช้')}</div></div>
      <div style="display:grid;grid-template-columns:2fr 1fr 2fr;gap:20px;font-size:14px;margin:12px 0 14px"><div><b>ผู้ตรวจนับ:</b> ______________________________</div><div><b>เวลา:</b> __________</div><div><b>ลายเซ็น:</b> ______________________________</div></div>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="width:48px">ลำดับ</th><th style="width:145px">RM Code</th><th>รายการ</th><th style="width:110px">Unit</th><th style="width:180px">จำนวนตรวจนับ</th><th style="width:220px">หมายเหตุ</th></tr></thead><tbody>${part.map((x,i)=>`<tr><td>${p*per+i+1}</td><td><b>${esc(x.rm)}</b></td><td>${esc(x.desc)}</td><td>${esc(x.unit)}</td><td style="height:34px"></td><td></td></tr>`).join('')}</tbody></table>
      <div style="margin-top:14px;font-size:11px;color:#5b7767">เอกสารนี้ไม่แสดงยอด Theory เพื่อใช้ตรวจนับของจริง • FORM ${FORM_VERSION}</div>`;
      box.querySelectorAll('th').forEach(th=>th.style.cssText+=';background:#dff4e7;border:1px solid #a9d3b8;padding:7px;text-align:left');
      box.querySelectorAll('td').forEach(td=>td.style.cssText+=';border:1px solid #cddfd4;padding:7px');
      document.body.appendChild(box);pages.push(box);
    }
    return pages;
  }

  async function exportCountFormPdf(){
    const meta=formMeta();if(!meta.rows.length)return;
    const btn=$('#countFormPdf');if(btn){btn.disabled=true;btn.textContent='กำลังสร้าง PDF...'}
    try{
      if(typeof ensurePdf==='function')await ensurePdf();
      else throw Error('ไม่พบ PDF library');
      const pages=countFormPages(meta),canvases=[];
      try{for(const page of pages)canvases.push(await html2canvas(page,{scale:1.25,backgroundColor:'#ffffff',logging:false,useCORS:true}))}finally{pages.forEach(x=>x.remove())}
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
      canvases.forEach((c,i)=>{if(i)pdf.addPage('a4','landscape');const img=c.toDataURL('image/jpeg',.94),pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),r=Math.min(pw/c.width,ph/c.height),w=c.width*r,h=c.height*r;pdf.addImage(img,'JPEG',(pw-w)/2,(ph-h)/2,w,h)});
      pdf.save(formBase(meta)+'.pdf');
    }catch(e){alert('Export แบบฟอร์ม PDF ไม่สำเร็จ: '+(e?.message||e))}
    finally{if(btn){btn.disabled=false;btn.textContent='📄 Export PDF'}}
  }

  function detectHeader(aoa){
    for(let r=0;r<Math.min(80,aoa.length);r++){
      const row=aoa[r]||[],keys=row.map(norm),rm=keys.findIndex(x=>x==='rmcode'||x==='rm'),cnt=keys.findIndex(x=>['จำนวนตรวจนับ','count','actualcount','จำนวนจริง'].map(norm).includes(x));
      if(rm>=0&&cnt>=0)return {row:r,rm,cnt};
    }
    return null;
  }
  function readMeta(aoa){const out={};for(let i=0;i<Math.min(30,aoa.length);i++){const row=aoa[i]||[],k=String(row[0]??'').trim();if(k)out[k.toUpperCase()]=row[1]??''}return out}

  async function cloudSaveCounts(counts){
    const role=localStorage.getItem('kamuInvCloudRole')||'',token=localStorage.getItem('kamuInvCloudToken')||'';
    if(role!=='user'||!token)throw Error('Import ผลตรวจนับใช้ได้เมื่อ Login ด้วย User เท่านั้น');
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'save_counts_bulk',counts})});
    let out={};try{out=await r.json()}catch{}
    if(!r.ok||out.ok===false)throw Error(out.error||`HTTP ${r.status}`);
    return out;
  }

  async function importCountForm(file){
    if(!window.XLSX)throw Error('ตัวอ่าน Excel ยังโหลดไม่สำเร็จ กรุณา Refresh แล้วลองใหม่');
    const buf=await file.arrayBuffer(),wb=XLSX.read(buf,{type:'array',cellDates:false});
    let picked=null;
    for(const sn of wb.SheetNames){const aoa=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',raw:true});const h=detectHeader(aoa);if(h){picked={sn,aoa,h};break}}
    if(!picked)throw Error('ไม่พบหัวตาราง RM Code และ จำนวนตรวจนับ ในไฟล์');
    const meta=readMeta(picked.aoa),branch=T(meta.BRANCH_CODE||''),stockDate=T(meta.STOCK_DATE||''),formVer=T(meta.FORM_VERSION||'');
    if(formVer&&formVer!==FORM_VERSION&&!confirm(`แบบฟอร์มเป็นเวอร์ชัน ${formVer} ซึ่งต่างจากระบบปัจจุบัน ต้องการ Import ต่อหรือไม่?`))return;
    if(!branch)throw Error('ไม่พบ BRANCH_CODE ในแบบฟอร์ม');
    const branches=new Set((typeof branchMaster==='function'?branchMaster():[]).map(x=>x.code));
    if(!branches.has(branch))throw Error(`สาขา ${branch} ไม่มีอยู่ในฐานข้อมูลของ User นี้`);
    if(stockDate&&T(S?.stockDate||'')&&stockDate!==T(S.stockDate))throw Error(`Stock Date ของแบบฟอร์ม (${stockDate}) ไม่ตรงกับฐานปัจจุบัน (${S.stockDate}) กรุณาใช้แบบฟอร์มของรอบ Stock ปัจจุบัน`);

    const map=new Map(),invalid=[];
    for(let r=picked.h.row+1;r<picked.aoa.length;r++){
      const row=picked.aoa[r]||[],rm=T(row[picked.h.rm]),raw=row[picked.h.cnt];if(!rm||String(raw??'').trim()==='')continue;
      const val=asNum(raw);if(val===null||val<0){invalid.push({row:r+1,rm,value:raw});continue}map.set(rm,val);
    }
    if(!map.size)throw Error('ไม่พบจำนวนตรวจนับที่กรอกในไฟล์');
    const validRm=new Set((IDX.stockByBranch.get(branch)||[]).map(r=>T(V(r,'rm'))).filter(Boolean)),valid=[],missing=[];
    for(const [rm,val] of map){if(validRm.has(rm))valid.push([rm,val]);else missing.push(rm)}
    if(!valid.length)throw Error('RM Code ในไฟล์ไม่ตรงกับ Stock Movement ของสาขานี้');
    const msg=[`สาขา ${branch}`,`พบจำนวนตรวจนับ ${valid.length.toLocaleString('th-TH')} รายการ`,missing.length?`RM ไม่พบในฐาน ${missing.length} รายการ`:'',invalid.length?`ค่าที่ไม่ถูกต้อง ${invalid.length} รายการ`:'' ].filter(Boolean).join('\n');
    if(!confirm(msg+'\n\nต้องการ Import และบันทึกเข้า Cloud หรือไม่?'))return;

    const sd=T(S.stockDate||stockDate||'');
    const counts=valid.map(([rm,val])=>({branch_code:branch,stock_date:sd,rm_code:rm,count_value:val}));
    await cloudSaveCounts(counts);
    for(const [rm,val] of valid)localStorage.setItem('count:'+branch+':'+sd+':'+rm,String(val));
    const sel=$('#branch');if(sel&&sel.value!==branch)sel.value=branch;
    const itemDate=T(meta.ITEM_SALE_DATE||'');if($('#date')&&itemDate&&itemDate!=='ALL'&&[...$('#date').options].some(o=>o.value===itemDate))$('#date').value=itemDate;
    compute();
    setTimeout(()=>alert(`Import สำเร็จ ${valid.length.toLocaleString('th-TH')} รายการ\nบันทึก Actual Count เข้า Cloud แล้ว${missing.length?`\nข้าม RM ที่ไม่พบ ${missing.length} รายการ`:''}${invalid.length?`\nข้ามค่าที่ไม่ถูกต้อง ${invalid.length} รายการ`:''}`),160);
  }

  function ensureAuditTools(){
    ensureModal();
    const tbl=$('#tbl'),card=tbl?.closest('.card'),head=card?.querySelector('.section-head');if(!head)return;
    const actions=head.children[1]||head.querySelector('div:last-child');if(!actions)return;
    if(!$('#countFormCreate')){
      const b=document.createElement('button');b.className='btn alt';b.id='countFormCreate';b.type='button';b.textContent='📝 แบบฟอร์มตรวจนับ';b.onclick=openFormModal;actions.prepend(b);
    }
    if(!$('#countFormImportBtn')){
      const b=document.createElement('button');b.className='btn alt';b.id='countFormImportBtn';b.type='button';b.textContent='⬆️ Import ผลตรวจนับ';
      const inp=document.createElement('input');inp.type='file';inp.id='countFormImport';inp.accept='.xlsx,.xls,.csv';inp.hidden=true;
      b.onclick=()=>{const role=localStorage.getItem('kamuInvCloudRole')||'';if(role!=='user'){alert('เมนู Import ผลตรวจนับสำหรับ User เท่านั้น');return}inp.click()};
      inp.onchange=async()=>{const f=inp.files?.[0];if(!f)return;b.disabled=true;b.textContent='กำลัง Import...';try{await importCountForm(f)}catch(e){alert('Import ไม่สำเร็จ: '+(e?.message||e))}finally{inp.value='';b.disabled=false;b.textContent='⬆️ Import ผลตรวจนับ'}};
      actions.prepend(b);actions.appendChild(inp);
    }
  }

  const css=document.createElement('style');css.textContent=`
    .count-form-backdrop{position:fixed;inset:0;z-index:14000;background:rgba(14,49,30,.45);display:grid;place-items:center;padding:18px}.count-form-backdrop[hidden]{display:none}.count-form-modal{width:min(720px,96vw);background:#fff;border:1px solid #c9e3d2;border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(16,75,43,.28)}.count-form-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.count-form-head h3{margin:0;color:#17653e;font-size:21px}.count-form-head p{margin:4px 0 0;color:#668071;font-size:12px}.count-form-x{border:0;background:#f1f7f3;border-radius:50%;width:36px;height:36px;font-size:24px;cursor:pointer}.count-form-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:16px 0}.count-form-summary>div{background:#f5fbf7;border:1px solid #d6eadc;border-radius:12px;padding:10px}.count-form-summary span{display:block;font-size:10px;color:#6d8275}.count-form-summary b{display:block;margin-top:3px;font-size:13px}.count-form-note{padding:10px 12px;border-radius:12px;background:#fff8e7;color:#76571e;font-size:12px}.count-form-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}@media(max-width:640px){.count-form-summary{grid-template-columns:1fr}.count-form-actions .btn{flex:1 1 100%}}
  `;document.head.appendChild(css);

  ensureAuditTools();setTimeout(ensureAuditTools,500);setTimeout(ensureAuditTools,1500);
  document.addEventListener('kamu:data-ready',()=>setTimeout(ensureAuditTools,100));
  const v=document.querySelector('.version');if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.27 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();
