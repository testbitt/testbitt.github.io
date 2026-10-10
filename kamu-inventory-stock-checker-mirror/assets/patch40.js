/* Version 3.28 — Ratio Master */
(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-api';
  if(!Array.isArray(S.ratio))S.ratio=[];

  const escRatio=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const role=()=>localStorage.getItem('kamuInvCloudRole')||'';
  const token=()=>localStorage.getItem('kamuInvCloudToken')||'';
  const norm=v=>String(v??'').trim().toLowerCase()
    .replace(/\s+/g,'')
    .replace(/[.\-_\/()（）]/g,'');

  async function ratioApi(action,data={}){
    const r=await fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},
      body:JSON.stringify({action,...data})
    });
    let out={};try{out=await r.json()}catch{}
    if(!r.ok||out.ok===false)throw Error(out.message||out.error||('HTTP '+r.status));
    return out;
  }

  function pick(row,aliases){
    const keys=Object.keys(row||{});
    for(const want of aliases){
      const w=norm(want);
      const k=keys.find(x=>norm(x)===w);
      if(k!==undefined)return row[k];
    }
    return '';
  }
  function num(v){
    const n=Number(String(v??'').replace(/,/g,'').trim());
    return Number.isFinite(n)?n:0;
  }

  function parseRatioWorkbook(file){
    return file.arrayBuffer().then(buf=>{
      if(!window.XLSX)throw Error('ตัวอ่าน Excel ยังโหลดไม่สำเร็จ กรุณา Refresh แล้วลองใหม่');
      const wb=XLSX.read(buf,{type:'array',cellDates:false});
      const sheetName=wb.SheetNames.find(n=>norm(n)==='ratio')||wb.SheetNames[0];
      if(!sheetName)throw Error('ไม่พบ Sheet ในไฟล์');
      const ws=wb.Sheets[sheetName];
      const aoa=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
      let header=-1;
      for(let i=0;i<Math.min(80,aoa.length);i++){
        const set=new Set((aoa[i]||[]).map(norm));
        if(set.has('code')&&set.has('detailrawmaterial')&&set.has('unit')&&set.has('ขนาดบรรจุ')&&set.has('ปริมาณที่ใช้ต่อ1สูตร')){
          header=i;break;
        }
      }
      if(header<0)throw Error('ไม่พบ Header Ratio: Code / Detail Raw Material / Unit / ขนาดบรรจุ / ปริมาณที่ใช้ต่อ 1 สูตร');
      const raw=XLSX.utils.sheet_to_json(ws,{range:header,defval:'',raw:true});
      const parsed=[];
      for(const r of raw){
        const code=T(pick(r,['Code']));
        const detail=T(pick(r,['Detail Raw Material']));
        const unit=T(pick(r,['Unit']));
        const pack=num(pick(r,['ขนาดบรรจุ']));
        const use=num(pick(r,['ปริมาณที่ใช้ต่อ 1 สูตร','ปริมาณที่ใช้ต่อ1สูตร']));
        const no=num(pick(r,['NO.','NO']));
        if(!code)continue;
        if(!(pack>0)||!(use>0))continue;
        parsed.push({
          no:no||parsed.length+1,
          code,detail,unit,
          pack_size:pack,
          usage_per_recipe:use,
          yield_recipes:pack/use
        });
      }
      if(!parsed.length)throw Error('ไม่พบข้อมูล Ratio ที่ใช้งานได้');
      const map=new Map();
      for(const x of parsed)map.set(x.code,x);
      return {sheetName,rows:[...map.values()]};
    });
  }

  function ensureRatioUI(){
    const tabs=document.querySelector('.tabs');
    if(tabs&&!document.querySelector('.tab[data-p="ratio"]')){
      const b=document.createElement('button');
      b.className='tab';b.dataset.p='ratio';b.innerHTML='<span>⚗️</span> อัตราส่วน';
      const conv=tabs.querySelector('.tab[data-p="conversion"]');
      conv?.insertAdjacentElement('afterend',b);
      b.onclick=()=>{
        $$('.tab').forEach(x=>x.classList.remove('active'));
        $$('.page').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        $('#ratio')?.classList.add('active');
        renderRatio();
      };
    }

    if(!$('#ratio')){
      const main=document.querySelector('main');
      const sec=document.createElement('section');
      sec.id='ratio';sec.className='page';
      sec.innerHTML=`
        <div class="card ratio-head-card">
          <div class="section-head">
            <div class="section-title"><div class="icon">⚗️</div><div>
              <h3>อัตราส่วน (Ratio)</h3>
              <div class="subtle">ขนาดบรรจุ ÷ ปริมาณที่ใช้ต่อ 1 สูตร = จำนวนที่ผลิตได้ (สูตร)</div>
            </div></div>
            <div id="ratioCount" class="subtle">0 รายการ</div>
          </div>
          <div class="ratio-tools">
            <input id="ratioSearch" placeholder="ค้นหา Code / วัตถุดิบ / Unit">
            <button class="btn alt" id="ratioClear">ล้างค้นหา</button>
          </div>
          <div id="ratioMeta" class="subtle"></div>
        </div>
        <div class="card">
          <div class="tablewrap ratio-table-wrap">
            <table class="ratio-table">
              <thead><tr>
                <th>NO.</th><th>Code</th><th>Detail Raw Material</th><th>Unit</th>
                <th>ขนาดบรรจุ</th><th>ปริมาณที่ใช้ต่อ 1 สูตร</th><th>จำนวนที่ผลิตได้ (สูตร)</th>
              </tr></thead>
              <tbody id="ratioBody"></tbody>
            </table>
          </div>
        </div>`;
      main.appendChild(sec);
      $('#ratioSearch').oninput=renderRatio;
      $('#ratioClear').onclick=()=>{$('#ratioSearch').value='';renderRatio()};
    }

    const grid=document.querySelector('#upload .grid');
    if(grid&&!$('#fRatio')){
      const card=document.createElement('div');
      card.id='ratioUploadCard';card.className='card upload-card';
      card.innerHTML='<div class="upload-icon">⚗️</div><b>5. อัตราส่วน (Ratio)</b><input type="file" id="fRatio" accept=".xlsx,.xls,.xlsm"><div id="mRatio" class="subtle">ยังไม่มีข้อมูล</div>';
      grid.appendChild(card);
      $('#fRatio').onchange=uploadRatio;
    }
    const uploadCard=$('#ratioUploadCard');
    if(uploadCard)uploadCard.style.display=role()==='admin'?'':'none';
  }

  function renderRatio(){
    ensureRatioUI();
    const q=norm($('#ratioSearch')?.value||'');
    const all=Array.isArray(S.ratio)?S.ratio:[];
    const show=all.filter(x=>!q||norm([x.code,x.detail,x.unit].join(' ')).includes(q));
    const body=$('#ratioBody');
    if(body)body.innerHTML=show.length?show.map((x,i)=>`
      <tr>
        <td class="ratio-no">${escRatio(x.no||i+1)}</td>
        <td><b class="ratio-code">${escRatio(x.code)}</b></td>
        <td>${escRatio(x.detail||'')}</td>
        <td class="ratio-center">${escRatio(x.unit||'')}</td>
        <td class="ratio-num">${F(Number(x.pack_size)||0)}</td>
        <td class="ratio-num">${F(Number(x.usage_per_recipe)||0)}</td>
        <td class="ratio-yield">${F(Number(x.yield_recipes)||0)}</td>
      </tr>`).join(''):'<tr><td colspan="7" class="ratio-empty">ยังไม่มีข้อมูลอัตราส่วน</td></tr>';
    const count=$('#ratioCount');if(count)count.textContent=`${all.length.toLocaleString('th-TH')} รายการ${show.length!==all.length?' • แสดง '+show.length.toLocaleString('th-TH'):''}`;
    const meta=$('#ratioMeta');if(meta)meta.textContent=all.length?`${S.meta?.ratio||'Ratio Master'} • ข้อมูลส่วนกลาง`:'Admin กรุณา Upload ไฟล์ Ratio';
    const m=$('#mRatio');if(m)m.textContent=all.length?`${S.meta?.ratio||'Ratio Master'} • ${all.length.toLocaleString('th-TH')} รายการ`:'ยังไม่มีข้อมูล';
  }

  async function uploadRatio(e){
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(role()!=='admin')throw Error('Upload Ratio ได้เฉพาะ Admin');
      const m=$('#mRatio');if(m)m.textContent='กำลังอ่าน '+file.name+' ...';
      const parsed=await parseRatioWorkbook(file);
      if(m)m.textContent=`อ่านสำเร็จ ${parsed.rows.length.toLocaleString('th-TH')} รายการ • กำลังบันทึก Cloud...`;
      await ratioApi('admin_save_master',{
        dataset_type:'ratio',
        payload:parsed.rows,
        metadata:{file_name:file.name,sheet:parsed.sheetName,rows:parsed.rows.length,source:'excel_upload'}
      });
      S.ratio=parsed.rows;S.meta=S.meta||{};S.meta.ratio=file.name;
      renderRatio();
      if(m)m.innerHTML=`${escRatio(file.name)} • ${parsed.rows.length.toLocaleString('th-TH')} รายการ <span class="ok">☁ Cloud Saved</span>`;
    }catch(err){
      const m=$('#mRatio');if(m)m.innerHTML='<span class="bad">Upload ไม่สำเร็จ: '+escRatio(err?.message||err)+'</span>';
      alert('Upload Ratio ไม่สำเร็จ: '+(err?.message||err));
    }finally{e.target.value=''}
  }

  const css=document.createElement('style');
  css.textContent=`
    #upload .grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important}
    .ratio-tools{display:flex;gap:10px;align-items:center;margin-top:14px}
    .ratio-tools input{flex:1;min-height:42px;padding:9px 12px;border:1px solid #c6dece;border-radius:12px;font-size:14px}
    .ratio-table{width:100%;min-width:960px;border-collapse:collapse}
    .ratio-table th{text-align:center;vertical-align:middle;white-space:normal}
    .ratio-table td{vertical-align:middle}
    .ratio-table th:nth-child(1){width:70px}.ratio-table th:nth-child(2){width:125px}.ratio-table th:nth-child(4){width:90px}
    .ratio-table th:nth-child(5),.ratio-table th:nth-child(6),.ratio-table th:nth-child(7){width:160px}
    .ratio-no,.ratio-center,.ratio-num,.ratio-yield{text-align:center}
    .ratio-code{color:#17653e;white-space:nowrap}
    .ratio-yield{font-weight:900;color:#17653e;background:#f2fbf5}
    .ratio-empty{text-align:center!important;padding:28px!important;color:#789085}
    @media(max-width:700px){.ratio-tools{display:grid;grid-template-columns:1fr}.ratio-tools .btn{width:100%}.ratio-table-wrap{overflow-x:auto}}
  `;
  document.head.appendChild(css);

  ensureRatioUI();
  renderRatio();
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{ensureRatioUI();renderRatio()},80));
  setTimeout(()=>{ensureRatioUI();renderRatio()},700);

  const ver=document.querySelector('.version');
  if(ver)ver.textContent='Version 3.28 • Ratio Master';
})();
