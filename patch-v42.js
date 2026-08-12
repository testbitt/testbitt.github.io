/* KSL V4.2 — expiry document matching store expiry slip reference. */
(() => {
  const css = document.createElement('style');
  css.textContent = `
    .expiry-ref-workspace{display:grid;grid-template-columns:minmax(310px,.8fr) minmax(540px,1.2fr);gap:18px;align-items:start}
    .expiry-ref-form{padding:20px}.expiry-ref-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.expiry-ref-grid .full{grid-column:1/-1}
    .expiry-ref-preview{padding:18px;position:sticky;top:18px}.expiry-ref-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
    .expiry-paper-shell{padding:16px;background:#eef3f1;border:2px dashed #c8d7d1;border-radius:18px;overflow:auto}
    .expiry-paper{position:relative;width:min(100%,820px);aspect-ratio:1.477/1;background:#fff;color:#050505;margin:auto;padding:5.4% 4.6% 3.5%;box-sizing:border-box;font-family:Tahoma,'Noto Sans Thai',Arial,sans-serif;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.09)}
    .ep-row{display:flex;align-items:flex-end;gap:18px;margin-bottom:5.2%;position:relative;z-index:2}
    .ep-label{font-size:clamp(18px,2.15vw,34px);font-weight:500;white-space:nowrap;line-height:1}
    .ep-line{height:1.22em;border-bottom:2px solid #111;flex:1;min-width:70px;padding:0 8px 4px;font-size:clamp(14px,1.7vw,27px);line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ep-two{display:grid;grid-template-columns:1.15fr 1fr;column-gap:4.2%;margin-bottom:5.2%}.ep-two .ep-row{margin:0;gap:15px}
    .ep-item{margin-top:1.4%}.ep-qty{display:grid;grid-template-columns:1fr auto;gap:5.4%;align-items:end}.ep-qty-main{display:flex;align-items:flex-end;gap:18px}.ep-unit{font-size:clamp(18px,2.15vw,34px);padding-right:5%;padding-bottom:2px}
    .ep-producer{width:70%;margin-bottom:0}.ep-mascot{position:absolute;right:-1.8%;bottom:-13%;width:29%;aspect-ratio:1/1;border:5px solid #111;border-radius:50%;background:#fff;z-index:1;box-sizing:border-box}.ep-hair{position:absolute;left:49%;top:-4%;width:8%;height:13%;border-left:5px solid #111;border-radius:50%;transform:rotate(-32deg)}.ep-eye{position:absolute;top:31%;width:9%;height:5%;border-top:5px solid #111;border-radius:50%}.ep-eye.l{left:27%;transform:rotate(-13deg)}.ep-eye.r{right:27%;transform:rotate(13deg)}.ep-cheek{position:absolute;top:42%;width:17%;height:8%;background:repeating-linear-gradient(165deg,#aaa 0 2px,transparent 2px 5px);border-radius:50%;opacity:.55}.ep-cheek.l{left:14%}.ep-cheek.r{right:14%}.ep-mouth{position:absolute;left:42%;top:54%;width:16%;height:9%;border-bottom:5px solid #111;border-radius:50%}
    .expiry-ref-note{margin-top:12px;font-size:11px;color:#62786f;line-height:1.65}.expiry-ref-result{margin-top:12px}
    @media(max-width:1100px){.expiry-ref-workspace{grid-template-columns:1fr}.expiry-ref-preview{position:static}}
    @media(max-width:650px){.expiry-ref-grid{grid-template-columns:1fr}.expiry-ref-grid .full{grid-column:auto}.expiry-paper{min-width:600px}.expiry-paper-shell{justify-content:flex-start}.ep-line{border-bottom-width:1.5px}}
  `;
  document.head.appendChild(css);

  function expirySectionMarkup(){
    return `
      <div class="card expiry-hero">
        <div><span class="cartoon-label">🧮 EXPIRY DOCUMENT</span><h2>ตัวช่วยคำนวณวัน–เวลาหมดอายุ</h2><p>เลือกสินค้าและสถานะ ระบบจะใช้ Holding Time ล่าสุดคำนวณวัน–เวลาหมดอายุ และใส่ข้อมูลลงใบหมดอายุตามรูปแบบเอกสารหน้าร้าน</p></div>
        <div class="expiry-hero-icon">🏷️</div>
      </div>
      <div class="expiry-ref-workspace">
        <div class="card expiry-ref-form">
          <div class="section-head"><div><h3>① ข้อมูลสำหรับใบหมดอายุ</h3><p>ข้อมูลที่กรอกจะถูกใส่ในเอกสารด้านขวาอัตโนมัติ</p></div></div>
          <div class="expiry-ref-grid">
            <div class="field full"><label>รายการ / วัตถุดิบ</label><select id="calcItem" class="select"></select></div>
            <div class="field full"><label>สถานะสินค้า</label><select id="calcStatus" class="select"></select></div>
            <div class="field full"><label>วันที่–เวลาผลิต / เปิด / เตรียม</label><input id="calcStart" type="datetime-local" class="input"></div>
            <div class="field"><label>สาขา</label><input id="calcBranch" class="input" placeholder="ชื่อหรือรหัสสาขา"></div>
            <div class="field"><label>จำนวน (สูตร)</label><input id="calcQty" class="input" type="number" min="0" step="1" value="1" placeholder="1"></div>
            <div class="field full"><label>ผู้ผลิต</label><input id="calcPreparedBy" class="input" placeholder="ชื่อผู้ผลิต"></div>
          </div>
          <div class="expiry-ref-actions">
            <button class="btn btn-primary" type="button" onclick="calculateExpiry()">🧮 คำนวณและสร้างใบหมดอายุ</button>
            <button class="btn btn-outline" type="button" onclick="resetExpiryCalculator()">↺ รีเซ็ต</button>
          </div>
          <div class="calc-result expiry-ref-result" id="calcResult"></div>
          <div class="expiry-ref-note">ระบบคำนวณจากคอลัมน์ <b>อายุการจัดเก็บ</b> ของ Holding Time ชุดล่าสุด หากระบุ “ตามบรรจุภัณฑ์” ระบบจะไม่สร้างวันหมดอายุอัตโนมัติและให้ตรวจฉลากจริง</div>
        </div>
        <div class="card expiry-ref-preview">
          <div class="section-head"><div><h3>② ใบหมดอายุ</h3><p>จัดวางตามตัวอย่างเอกสารสำหรับพิมพ์</p></div><span class="badge" id="labelCalcState">รอคำนวณ</span></div>
          <div class="expiry-paper-shell">
            <div class="expiry-paper" id="expiryLabel">
              <div class="ep-row ep-branch"><span class="ep-label">สาขา</span><span class="ep-line" id="labelBranch"></span></div>
              <div class="ep-two">
                <div class="ep-row"><span class="ep-label">วันที่ผลิต</span><span class="ep-line" id="labelPrepDate"></span></div>
                <div class="ep-row"><span class="ep-label">เวลา</span><span class="ep-line" id="labelPrepTime"></span></div>
              </div>
              <div class="ep-two">
                <div class="ep-row"><span class="ep-label">วันหมดอายุ</span><span class="ep-line" id="labelExpDate"></span></div>
                <div class="ep-row"><span class="ep-label">เวลา</span><span class="ep-line" id="labelExpTime"></span></div>
              </div>
              <div class="ep-row ep-item"><span class="ep-label">รายการ</span><span class="ep-line" id="labelProduct"></span></div>
              <div class="ep-row ep-qty"><div class="ep-qty-main"><span class="ep-label">จำนวน</span><span class="ep-line" id="labelQty"></span></div><span class="ep-unit">สูตร</span></div>
              <div class="ep-row ep-producer"><span class="ep-label">ผู้ผลิต</span><span class="ep-line" id="labelPreparedBy"></span></div>
              <div class="ep-mascot" aria-hidden="true"><i class="ep-hair"></i><i class="ep-eye l"></i><i class="ep-eye r"></i><i class="ep-cheek l"></i><i class="ep-cheek r"></i><i class="ep-mouth"></i></div>
            </div>
          </div>
          <button class="btn btn-outline expiry-print-btn" type="button" onclick="printExpiryLabel()">🖨️ Print / Save PDF</button>
        </div>
      </div>`;
  }

  function installExpiryDocument(){
    const section=document.getElementById('expiry');
    if(!section || section.dataset.refV42==='1') return;
    section.dataset.refV42='1';
    section.innerHTML=expirySectionMarkup();
    ['calcItem','calcStatus','calcStart','calcBranch','calcQty','calcPreparedBy'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{ if(id==='calcItem') refreshCalcStatuses(); previewExpiryLabel(); });
    });
    populateCalculator();
  }

  function setTxt(id,val){const el=document.getElementById(id);if(el)el.textContent=safe(val)||''}
  function selection(){
    const item=document.getElementById('calcItem')?.value||'';
    const idx=Number(document.getElementById('calcStatus')?.value||0);
    const start=document.getElementById('calcStart')?.value||'';
    const rows=(appState?.data||[]).filter(r=>safe(r['ชื่อวัตถุดิบ'])===item);
    return {item,idx,start,row:rows[idx],branch:safe(document.getElementById('calcBranch')?.value),qty:safe(document.getElementById('calcQty')?.value),preparedBy:safe(document.getElementById('calcPreparedBy')?.value)};
  }

  window.populateCalculator=function(){
    const sel=document.getElementById('calcItem'); if(!sel)return;
    const items=uniq((appState?.data||[]).map(x=>x['ชื่อวัตถุดิบ'])).sort((a,b)=>a.localeCompare(b,'th'));
    const current=sel.value;
    sel.innerHTML=items.length?items.map(v=>`<option>${escapeHtml(v)}</option>`).join(''):'<option value="">ไม่มีข้อมูล</option>';
    if(current&&items.includes(current))sel.value=current;
    const st=document.getElementById('calcStart'); if(st&&!st.value){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());st.value=d.toISOString().slice(0,16)}
    refreshCalcStatuses(); previewExpiryLabel();
  };

  window.refreshCalcStatuses=function(){
    const item=document.getElementById('calcItem')?.value||'',el=document.getElementById('calcStatus'); if(!el)return;
    const rows=(appState?.data||[]).filter(r=>safe(r['ชื่อวัตถุดิบ'])===item),old=Number(el.value||0);
    el.innerHTML=rows.map((r,i)=>`<option value="${i}">${escapeHtml(r['สถานะ'])} • ${escapeHtml(r['อายุการจัดเก็บ'])}</option>`).join('');
    if(old<rows.length)el.value=String(old); else el.value='0';
    previewExpiryLabel();
  };

  window.previewExpiryLabel=function(explicit){
    if(!document.getElementById('expiryLabel'))return;
    const s=selection();
    const exp=explicit!==undefined?explicit:(s.row&&s.start?parseHoldingTime(s.row['อายุการจัดเก็บ'],s.start):null);
    const prep=labelDateParts(s.start),ex=labelDateParts(exp);
    setTxt('labelBranch',s.branch);setTxt('labelPrepDate',prep.date==='-'?'':prep.date);setTxt('labelPrepTime',prep.time==='-'?'':prep.time);
    setTxt('labelExpDate',exp?ex.date:'');setTxt('labelExpTime',exp?ex.time:'');setTxt('labelProduct',s.item);setTxt('labelQty',s.qty||'');setTxt('labelPreparedBy',s.preparedBy);
    const badge=document.getElementById('labelCalcState');if(badge)badge.textContent=exp?'คำนวณแล้ว':'รอคำนวณ';
  };

  window.calculateExpiry=function(){
    const s=selection(),out=document.getElementById('calcResult');
    if(!s.row||!s.start){toast('กรุณาเลือกรายการ สถานะ และวัน–เวลาผลิตให้ครบ','warn');return}
    const exp=parseHoldingTime(s.row['อายุการจัดเก็บ'],s.start); previewExpiryLabel(exp); if(out)out.classList.add('show');
    if(!exp){if(out)out.innerHTML=`<b>⚠️ ไม่สามารถคำนวณวันหมดอายุอัตโนมัติ</b><br>Holding Time: ${escapeHtml(s.row['อายุการจัดเก็บ'])}<br><span class="small-note">กรุณาตรวจสอบวันหมดอายุบนบรรจุภัณฑ์/มาตรฐานจริง</span>`;return}
    const p=labelDateParts(s.start),e=labelDateParts(exp);if(out)out.innerHTML=`<b>✅ สร้างใบหมดอายุแล้ว</b><div class="calc-result-grid"><span>วันที่ผลิต</span><strong>${p.date} • ${p.time}</strong><span>วันหมดอายุ</span><strong>${e.date} • ${e.time}</strong><span>Holding Time</span><strong>${escapeHtml(s.row['อายุการจัดเก็บ'])}</strong></div>`;
  };

  window.resetExpiryCalculator=function(){
    const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    const st=document.getElementById('calcStart');if(st)st.value=d.toISOString().slice(0,16);
    ['calcBranch','calcPreparedBy'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
    const q=document.getElementById('calcQty');if(q)q.value='1';
    const out=document.getElementById('calcResult');if(out){out.classList.remove('show');out.innerHTML=''}
    previewExpiryLabel();toast('รีเซ็ตข้อมูลแล้ว');
  };

  window.printExpiryLabel=function(){
    const paper=document.getElementById('expiryLabel');if(!paper)return;
    const w=window.open('','_blank','width=980,height=760');if(!w){toast('เบราว์เซอร์บล็อกหน้าต่าง Print กรุณาอนุญาต Pop-up','warn');return}
    w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ใบหมดอายุ</title><style>@page{size:148mm 100mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font-family:Tahoma,'Noto Sans Thai',Arial,sans-serif}.expiry-paper{position:relative;width:148mm;height:100mm;background:#fff;color:#050505;padding:5.4% 4.6% 3.5%;overflow:hidden}.ep-row{display:flex;align-items:flex-end;gap:4mm;margin-bottom:5.2%;position:relative;z-index:2}.ep-label{font-size:17pt;white-space:nowrap;line-height:1}.ep-line{height:1.22em;border-bottom:.45mm solid #111;flex:1;min-width:15mm;padding:0 2mm 1mm;font-size:14pt;line-height:1.05;white-space:nowrap;overflow:hidden}.ep-two{display:grid;grid-template-columns:1.15fr 1fr;column-gap:6mm;margin-bottom:5.2%}.ep-two .ep-row{margin:0;gap:3mm}.ep-item{margin-top:1.4%}.ep-qty{display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:end}.ep-qty-main{display:flex;align-items:flex-end;gap:4mm}.ep-unit{font-size:17pt;padding-right:6mm;padding-bottom:.5mm}.ep-producer{width:70%;margin-bottom:0}.ep-mascot{position:absolute;right:-2%;bottom:-13%;width:29%;aspect-ratio:1/1;border:1.1mm solid #111;border-radius:50%;background:#fff;z-index:1}.ep-hair{position:absolute;left:49%;top:-4%;width:8%;height:13%;border-left:1.1mm solid #111;border-radius:50%;transform:rotate(-32deg)}.ep-eye{position:absolute;top:31%;width:9%;height:5%;border-top:1.1mm solid #111;border-radius:50%}.ep-eye.l{left:27%;transform:rotate(-13deg)}.ep-eye.r{right:27%;transform:rotate(13deg)}.ep-cheek{position:absolute;top:42%;width:17%;height:8%;background:repeating-linear-gradient(165deg,#aaa 0 .4mm,transparent .4mm 1mm);border-radius:50%;opacity:.55}.ep-cheek.l{left:14%}.ep-cheek.r{right:14%}.ep-mouth{position:absolute;left:42%;top:54%;width:16%;height:9%;border-bottom:1.1mm solid #111;border-radius:50%}</style></head><body>${paper.outerHTML}<script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);
    w.document.close();
  };

  installExpiryDocument();
  setTimeout(installExpiryDocument,250);
})();
