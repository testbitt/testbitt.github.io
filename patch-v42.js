/* KSL V4.3 — expiry calculator + store expiry slip layout closely matching the supplied reference. */
(() => {
  const css=document.createElement('style');
  css.id='ksl-expiry-v43-style';
  css.textContent=`
    .expiry-ref-workspace{display:grid;grid-template-columns:minmax(300px,.76fr) minmax(560px,1.24fr);gap:16px;align-items:start}
    .expiry-ref-form,.expiry-ref-preview{padding:18px}.expiry-ref-preview{position:sticky;top:14px}
    .expiry-ref-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.expiry-ref-grid .full{grid-column:1/-1}
    .expiry-ref-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.expiry-ref-note{margin-top:10px;font-size:11px;line-height:1.6;color:#62786f}
    .expiry-paper-shell{padding:12px;background:#edf3f0;border:1px dashed #bed2c9;border-radius:15px;overflow:auto}
    .expiry-paper{position:relative;width:min(100%,860px);aspect-ratio:1504/1018;background:#fff;color:#080808;margin:auto;box-sizing:border-box;overflow:hidden;font-family:Tahoma,'Noto Sans Thai',Arial,sans-serif;box-shadow:0 3px 14px rgba(0,0,0,.08)}
    .ep-field{position:absolute;display:flex;align-items:flex-end;gap:16px;height:9.2%;z-index:2}
    .ep-label{font-size:clamp(21px,2.15vw,34px);font-weight:400;line-height:1;white-space:nowrap;letter-spacing:-.02em}
    .ep-line{flex:1;min-width:40px;height:72%;display:flex;align-items:flex-end;padding:0 7px 5px;border-bottom:2px solid #111;box-sizing:border-box;font-size:clamp(16px,1.65vw,26px);font-weight:500;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ep-branch{left:5.7%;top:5.8%;width:60.5%}
    .ep-prep-date{left:2.6%;top:20.0%;width:50.2%}.ep-prep-time{left:55.0%;top:20.0%;width:45.5%}
    .ep-exp-date{left:2.6%;top:35.7%;width:50.2%}.ep-exp-time{left:55.0%;top:35.7%;width:45.5%}
    .ep-item{left:3.5%;top:51.8%;width:62.8%}
    .ep-qty{left:3.5%;top:66.7%;width:82.5%;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:5.4%}
    .ep-qty-main{display:flex;align-items:flex-end;gap:16px;height:100%}.ep-unit{font-size:clamp(21px,2.15vw,34px);font-weight:400;line-height:1;padding-bottom:8%}
    .ep-producer{left:4.2%;top:81.6%;width:62%}
    .ep-mascot{position:absolute;right:-1.1%;bottom:-13.7%;width:34%;aspect-ratio:1/1;border:5px solid #111;border-radius:50%;background:#fff;z-index:1;box-sizing:border-box}
    .ep-hair{position:absolute;left:50%;top:-5%;width:9%;height:15%;border-left:5px solid #111;border-radius:55%;transform:rotate(-34deg)}
    .ep-eye{position:absolute;top:30%;width:9%;height:7%;border-top:5px solid #111;border-radius:50%}.ep-eye.l{left:27%;transform:rotate(-13deg)}.ep-eye.r{right:27%;transform:rotate(13deg)}
    .ep-cheek{position:absolute;top:42%;width:17%;height:9%;border-radius:50%;opacity:.52;background:repeating-linear-gradient(165deg,#8f9794 0 2px,transparent 2px 5px)}.ep-cheek.l{left:13%}.ep-cheek.r{right:13%}
    .ep-mouth{position:absolute;left:42%;top:54%;width:16%;height:10%;border-bottom:5px solid #111;border-radius:50%}
    .expiry-print-btn{margin-top:12px}
    @media(max-width:1100px){.expiry-ref-workspace{grid-template-columns:1fr}.expiry-ref-preview{position:static}}
    @media(max-width:680px){.expiry-ref-grid{grid-template-columns:1fr}.expiry-ref-grid .full{grid-column:auto}.expiry-paper{min-width:680px}.expiry-paper-shell{padding:8px}}
  `;
  document.head.appendChild(css);

  function markup(){return `
    <div class="card expiry-hero"><div><span class="cartoon-label">🧮 EXPIRY DOCUMENT</span><h2>ตัวช่วยคำนวณวัน–เวลาหมดอายุ</h2><p>เลือกข้อมูลจาก Holding Time แล้วระบบจะคำนวณวันหมดอายุและจัดลงใบหมดอายุอัตโนมัติ</p></div><div class="expiry-hero-icon">🏷️</div></div>
    <div class="expiry-ref-workspace">
      <div class="card expiry-ref-form">
        <div class="section-head"><div><h3>ข้อมูลสำหรับใบหมดอายุ</h3><p>กรอกเฉพาะข้อมูลหน้างาน ส่วนวันหมดอายุระบบคำนวณให้</p></div></div>
        <div class="expiry-ref-grid">
          <div class="field full"><label>รายการ / วัตถุดิบ</label><select id="calcItem" class="select"></select></div>
          <div class="field full"><label>สถานะสินค้า</label><select id="calcStatus" class="select"></select></div>
          <div class="field full"><label>วันที่–เวลาผลิต</label><input id="calcStart" type="datetime-local" class="input"></div>
          <div class="field"><label>สาขา</label><input id="calcBranch" class="input" placeholder="รหัส/ชื่อสาขา"></div>
          <div class="field"><label>จำนวน (สูตร)</label><input id="calcQty" class="input" type="number" min="0" step="1" value="1"></div>
          <div class="field full"><label>ผู้ผลิต</label><input id="calcPreparedBy" class="input" placeholder="ชื่อผู้ผลิต"></div>
        </div>
        <div class="expiry-ref-actions"><button class="btn btn-primary" type="button" onclick="calculateExpiry()">🧮 คำนวณและสร้างใบหมดอายุ</button><button class="btn btn-outline" type="button" onclick="resetExpiryCalculator()">↺ รีเซ็ต</button></div>
        <div class="calc-result expiry-ref-result" id="calcResult"></div>
        <div class="expiry-ref-note">อ้างอิงค่า <b>อายุการจัดเก็บ</b> จากฐาน Holding Time ล่าสุด หากเป็น “ตามบรรจุภัณฑ์” ให้ตรวจฉลากจริง</div>
      </div>
      <div class="card expiry-ref-preview">
        <div class="section-head"><div><h3>ใบหมดอายุ</h3><p>เลย์เอาต์ตามแบบเอกสารตัวอย่าง</p></div><span class="badge" id="labelCalcState">รอคำนวณ</span></div>
        <div class="expiry-paper-shell"><div class="expiry-paper" id="expiryLabel">
          <div class="ep-field ep-branch"><span class="ep-label">สาขา</span><span class="ep-line" id="labelBranch"></span></div>
          <div class="ep-field ep-prep-date"><span class="ep-label">วันที่ผลิต</span><span class="ep-line" id="labelPrepDate"></span></div>
          <div class="ep-field ep-prep-time"><span class="ep-label">เวลา</span><span class="ep-line" id="labelPrepTime"></span></div>
          <div class="ep-field ep-exp-date"><span class="ep-label">วันหมดอายุ</span><span class="ep-line" id="labelExpDate"></span></div>
          <div class="ep-field ep-exp-time"><span class="ep-label">เวลา</span><span class="ep-line" id="labelExpTime"></span></div>
          <div class="ep-field ep-item"><span class="ep-label">รายการ</span><span class="ep-line" id="labelProduct"></span></div>
          <div class="ep-field ep-qty"><div class="ep-qty-main"><span class="ep-label">จำนวน</span><span class="ep-line" id="labelQty"></span></div><span class="ep-unit">สูตร</span></div>
          <div class="ep-field ep-producer"><span class="ep-label">ผู้ผลิต</span><span class="ep-line" id="labelPreparedBy"></span></div>
          <div class="ep-mascot" aria-hidden="true"><i class="ep-hair"></i><i class="ep-eye l"></i><i class="ep-eye r"></i><i class="ep-cheek l"></i><i class="ep-cheek r"></i><i class="ep-mouth"></i></div>
        </div></div>
        <button class="btn btn-outline expiry-print-btn" type="button" onclick="printExpiryLabel()">🖨️ Print / Save PDF</button>
      </div>
    </div>`}

  function setTxt(id,val){const el=document.getElementById(id);if(el)el.textContent=(typeof safe==='function'?safe(val):(val??''))||''}
  function uniqLocal(arr){return typeof uniq==='function'?uniq(arr):[...new Set(arr.filter(Boolean))]}
  function esc(v){return typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function parts(v){
    if(typeof labelDateParts==='function')return labelDateParts(v);
    if(!v)return{date:'-',time:'-'};const d=v instanceof Date?v:new Date(v);if(Number.isNaN(d.getTime()))return{date:'-',time:'-'};
    return{date:d.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit'}),time:d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false})};
  }
  function selected(){
    const item=document.getElementById('calcItem')?.value||'';
    const idx=Number(document.getElementById('calcStatus')?.value||0);
    const rows=(window.appState?.data||[]).filter(r=>(typeof safe==='function'?safe(r['ชื่อวัตถุดิบ']):r['ชื่อวัตถุดิบ'])===item);
    return{item,idx,row:rows[idx],start:document.getElementById('calcStart')?.value||'',branch:document.getElementById('calcBranch')?.value||'',qty:document.getElementById('calcQty')?.value||'',preparedBy:document.getElementById('calcPreparedBy')?.value||''};
  }

  window.populateCalculator=function(){
    const sel=document.getElementById('calcItem');if(!sel)return;
    const items=uniqLocal((window.appState?.data||[]).map(x=>(typeof safe==='function'?safe(x['ชื่อวัตถุดิบ']):x['ชื่อวัตถุดิบ']))).sort((a,b)=>String(a).localeCompare(String(b),'th'));
    const current=sel.value;sel.innerHTML=items.length?items.map(v=>`<option>${esc(v)}</option>`).join(''):'<option value="">ไม่มีข้อมูล</option>';if(current&&items.includes(current))sel.value=current;
    const st=document.getElementById('calcStart');if(st&&!st.value){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());st.value=d.toISOString().slice(0,16)}
    window.refreshCalcStatuses();window.previewExpiryLabel();
  };

  window.refreshCalcStatuses=function(){
    const item=document.getElementById('calcItem')?.value||'',el=document.getElementById('calcStatus');if(!el)return;
    const rows=(window.appState?.data||[]).filter(r=>(typeof safe==='function'?safe(r['ชื่อวัตถุดิบ']):r['ชื่อวัตถุดิบ'])===item),old=Number(el.value||0);
    el.innerHTML=rows.map((r,i)=>`<option value="${i}">${esc(r['สถานะ'])} • ${esc(r['อายุการจัดเก็บ'])}</option>`).join('');el.value=String(old<rows.length?old:0);window.previewExpiryLabel();
  };

  window.previewExpiryLabel=function(explicit){
    if(!document.getElementById('expiryLabel'))return;const s=selected();
    const exp=explicit!==undefined?explicit:(s.row&&s.start&&typeof parseHoldingTime==='function'?parseHoldingTime(s.row['อายุการจัดเก็บ'],s.start):null);
    const p=parts(s.start),e=parts(exp);
    setTxt('labelBranch',s.branch);setTxt('labelPrepDate',p.date==='-'?'':p.date);setTxt('labelPrepTime',p.time==='-'?'':p.time);setTxt('labelExpDate',exp?(e.date==='-'?'':e.date):'');setTxt('labelExpTime',exp?(e.time==='-'?'':e.time):'');setTxt('labelProduct',s.item);setTxt('labelQty',s.qty);setTxt('labelPreparedBy',s.preparedBy);
    const badge=document.getElementById('labelCalcState');if(badge)badge.textContent=exp?'คำนวณแล้ว':'รอคำนวณ';
  };

  window.calculateExpiry=function(){
    const s=selected(),out=document.getElementById('calcResult');if(!s.row||!s.start){if(typeof toast==='function')toast('กรุณาเลือกรายการ สถานะ และวัน–เวลาผลิตให้ครบ','warn');return}
    const exp=typeof parseHoldingTime==='function'?parseHoldingTime(s.row['อายุการจัดเก็บ'],s.start):null;window.previewExpiryLabel(exp);if(out)out.classList.add('show');
    if(!exp){if(out)out.innerHTML=`<b>⚠️ ไม่สามารถคำนวณวันหมดอายุอัตโนมัติ</b><br>Holding Time: ${esc(s.row['อายุการจัดเก็บ'])}`;return}
    const p=parts(s.start),e=parts(exp);if(out)out.innerHTML=`<b>✅ สร้างใบหมดอายุแล้ว</b><div class="calc-result-grid"><span>วันที่ผลิต</span><strong>${p.date} • ${p.time}</strong><span>วันหมดอายุ</span><strong>${e.date} • ${e.time}</strong><span>Holding Time</span><strong>${esc(s.row['อายุการจัดเก็บ'])}</strong></div>`;
  };

  window.resetExpiryCalculator=function(){
    const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());const st=document.getElementById('calcStart');if(st)st.value=d.toISOString().slice(0,16);
    ['calcBranch','calcPreparedBy'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});const q=document.getElementById('calcQty');if(q)q.value='1';const out=document.getElementById('calcResult');if(out){out.classList.remove('show');out.innerHTML=''}window.previewExpiryLabel();
  };

  window.printExpiryLabel=function(){
    const label=document.getElementById('expiryLabel');if(!label)return;
    const w=window.open('','_blank','width=1000,height=760');if(!w){if(typeof toast==='function')toast('กรุณาอนุญาต Pop-up เพื่อพิมพ์ใบหมดอายุ','warn');return}
    w.document.open();w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ใบหมดอายุ</title><style>${css.textContent}
      @page{size:148mm 100mm;margin:0}html,body{margin:0;padding:0;background:#fff;width:148mm;height:100mm;overflow:hidden}.expiry-paper{width:148mm!important;height:100mm!important;aspect-ratio:auto!important;box-shadow:none!important;margin:0!important}.ep-label,.ep-unit{font-size:6.2mm!important}.ep-line{font-size:4.6mm!important;border-bottom:.45mm solid #111!important}.ep-mascot{border-width:.8mm!important}.ep-eye{border-top-width:.8mm!important}.ep-hair{border-left-width:.8mm!important}.ep-mouth{border-bottom-width:.8mm!important}</style></head><body>${label.outerHTML}<script>setTimeout(()=>{window.print();},180)<\/script></body></html>`);w.document.close();
  };

  function install(){
    const section=document.getElementById('expiry');if(!section)return;
    section.innerHTML=markup();section.dataset.refV43='1';
    ['calcItem','calcStatus','calcStart','calcBranch','calcQty','calcPreparedBy'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{if(id==='calcItem')window.refreshCalcStatuses();window.previewExpiryLabel();});});
    window.populateCalculator();
  }
  install();setTimeout(install,350);
})();
