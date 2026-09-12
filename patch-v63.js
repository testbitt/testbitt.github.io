/* KSL V6.3 — Expiry Audit: Holding Time based inspection + PDF/JPG export */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_AUDIT_V63__) return;
  window.__KSL_EXPIRY_AUDIT_V63__ = true;

  const STORAGE_KEY = 'KSL_EXPIRY_AUDIT_V63';
  const PAGE_ID = 'expiryAudit';
  const RESULT = {PASS:'pass', FAIL:'fail', MANUAL:'manual', PENDING:'pending'};
  let auditState = {branch:'', checkedAt:'', entries:{}, savedAt:''};
  let saveTimer = 0;

  const css = document.createElement('style');
  css.id = 'ksl-expiry-audit-v63-style';
  css.textContent = `
    #expiryAudit{--ea-green:#166f52;--ea-dark:#173d30;--ea-soft:#eef8f3;--ea-border:#d8e8e0;--ea-red:#ad3d3d;--ea-amber:#9b6c17}
    .ea-hero{display:flex;justify-content:space-between;gap:20px;align-items:center;background:linear-gradient(135deg,#fff,#effaf5 68%,#fff8e8);margin-bottom:14px;overflow:hidden}
    .ea-hero h2{margin:8px 0 6px;color:var(--ea-dark);font-size:27px}.ea-hero p{margin:0;color:#667d73;line-height:1.7}.ea-hero-icon{font-size:62px;padding:8px 22px}
    .ea-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.62fr);gap:14px;margin-bottom:14px}.ea-form,.ea-summary{padding:16px}
    .ea-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ea-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ea-save-note{font-size:10px;color:#698078;margin-top:8px}
    .ea-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.ea-stat{padding:11px 8px;border:1px solid var(--ea-border);border-radius:12px;text-align:center;background:#fff}.ea-stat b{display:block;font-size:20px;color:var(--ea-dark)}.ea-stat span{font-size:9px;color:#6c8178;font-weight:800}.ea-stat.pass{background:#effaf4}.ea-stat.fail{background:#fff1f1}.ea-stat.manual{background:#fff8e8}
    .ea-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:8px;align-items:center;margin-bottom:10px}.ea-toolbar .input{min-width:0}.ea-table-card{padding:14px;overflow:hidden}.ea-table-wrap{overflow:auto;border:1px solid var(--ea-border);border-radius:12px;max-height:67vh}.ea-table{width:100%;border-collapse:separate;border-spacing:0;min-width:1120px;font-size:10.5px}.ea-table th{position:sticky;top:0;z-index:4;background:#edf7f2;color:#315d4b;text-align:left;padding:9px 8px;border-bottom:1px solid #cfe3d9;font-size:9.5px;white-space:nowrap}.ea-table td{padding:8px;border-bottom:1px solid #edf2ef;vertical-align:top;color:#2b463b}.ea-table tr:last-child td{border-bottom:0}.ea-table tr:hover td{background:#fbfdfc}.ea-no{width:44px;text-align:center;color:#70857b}.ea-item{font-weight:900;color:#174b38;min-width:170px}.ea-status{min-width:220px}.ea-holding{font-weight:850;white-space:nowrap}.ea-exp-input{width:190px;min-height:34px;border:1px solid #cbded5;border-radius:8px;padding:5px 7px;font:inherit;background:#fff;color:#203c31}.ea-exp-input:focus{outline:0;border-color:#2b9270;box-shadow:0 0 0 3px rgba(43,146,112,.10)}
    .ea-result{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-weight:900;font-size:9px;white-space:nowrap}.ea-result.pass{background:#e8f7ef;color:#11784d}.ea-result.fail{background:#ffecec;color:#a33131}.ea-result.manual{background:#fff4d8;color:#8c6415}.ea-result.pending{background:#f0f3f2;color:#708077}.ea-max{font-size:9.5px;color:#60776d;line-height:1.45;min-width:150px}.ea-reason{display:block;font-size:8.8px;color:#7b8c84;margin-top:3px;line-height:1.4}
    .ea-rule{margin-top:10px;padding:10px 12px;border-radius:11px;background:#f8fbf9;border:1px dashed #c7dcd2;color:#5e766b;font-size:10px;line-height:1.6}
    @media(max-width:980px){.ea-top{grid-template-columns:1fr}.ea-table-wrap{max-height:none}.ea-summary-grid{grid-template-columns:repeat(4,1fr)}}
    @media(max-width:680px){.ea-hero{align-items:flex-start}.ea-hero-icon{font-size:43px;padding:5px}.ea-form-grid{grid-template-columns:1fr}.ea-summary-grid{grid-template-columns:1fr 1fr}.ea-toolbar{grid-template-columns:1fr 1fr}.ea-toolbar .input{grid-column:1/-1}.ea-actions .btn{flex:1 1 45%}}
  `;
  document.head.appendChild(css);

  function txt(v){ return String(v ?? '').trim(); }
  function esc(v){ return txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function getState(){ try { if (typeof appState !== 'undefined' && appState) return appState; } catch(_){} return window.appState || null; }
  function rowsSource(){ const s=getState(); return Array.isArray(s?.data) ? s.data : []; }
  function nowLocalInput(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); }
  function formatThai(v){ if(!v)return '-'; const d=new Date(v); if(Number.isNaN(d.getTime()))return '-'; try{return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(d)}catch(_){return d.toLocaleString('th-TH')} }
  function fileSafe(v){ return txt(v).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').slice(0,60) || 'KSL'; }
  function toastMsg(msg,type=''){ try{ if(typeof toast==='function')return toast(msg,type); }catch(_){} alert(msg); }

  function uniqueRows(){
    const seen=new Set(), out=[];
    rowsSource().forEach((r,i)=>{
      const item=txt(r?.['ชื่อวัตถุดิบ']), status=txt(r?.['สถานะ']), holding=txt(r?.['อายุการจัดเก็บ']), storage=txt(r?.['อุณหภูมิ/สถานที่จัดเก็บ']);
      if(!item) return;
      const uniqKey=[item,status,holding,storage].join('\u0001');
      if(seen.has(uniqKey))return; seen.add(uniqKey);
      out.push({item,status,holding,storage,sourceIndex:i,key:stableKey(uniqKey)});
    });
    return out.sort((a,b)=>a.item.localeCompare(b.item,'th')||a.status.localeCompare(b.status,'th')||a.holding.localeCompare(b.holding,'th'));
  }
  function stableKey(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)} return 'r'+(h>>>0).toString(36); }

  function parseDuration(holding, start){
    const raw=txt(holding).toLowerCase();
    if(!raw || /ตาม.*บรรจุภัณฑ์|บรรจุภัณฑ์|package/.test(raw)) return {kind:'manual',max:null};
    const base=new Date(start); if(Number.isNaN(base.getTime())) return {kind:'invalid',max:null};
    const m=raw.match(/(\d+(?:\.\d+)?)\s*(นาที|ชั่วโมง|ชม\.?|วัน|เดือน|ปี)/i);
    if(!m) return {kind:'manual',max:null};
    const n=Number(m[1]), unit=m[2]; const d=new Date(base);
    if(/นาที/.test(unit)) d.setMinutes(d.getMinutes()+n);
    else if(/ชั่วโมง|ชม/.test(unit)) d.setHours(d.getHours()+n);
    else if(/วัน/.test(unit)) d.setDate(d.getDate()+n);
    else if(/เดือน/.test(unit)) d.setMonth(d.getMonth()+n);
    else if(/ปี/.test(unit)) d.setFullYear(d.getFullYear()+n);
    return {kind:'fixed',max:d};
  }

  function evaluate(row, expiryValue){
    if(!expiryValue) return {code:RESULT.PENDING,label:'รอตรวจ',reason:'ยังไม่ได้กรอกวันหมดอายุ',max:null};
    const check=new Date(auditState.checkedAt); const exp=new Date(expiryValue);
    if(Number.isNaN(check.getTime())||Number.isNaN(exp.getTime())) return {code:RESULT.PENDING,label:'รอตรวจ',reason:'วันที่ไม่สมบูรณ์',max:null};
    if(exp < check) return {code:RESULT.FAIL,label:'ไม่ผ่าน',reason:'วันหมดอายุก่อนวันที่ตรวจ / หมดอายุแล้ว',max:null};
    const std=parseDuration(row.holding, check);
    if(std.kind==='manual') return {code:RESULT.MANUAL,label:'ตรวจฉลาก',reason:'มาตรฐานระบุให้อ้างอิงวันหมดอายุบนบรรจุภัณฑ์',max:null};
    if(std.kind!=='fixed'||!std.max) return {code:RESULT.MANUAL,label:'ตรวจฉลาก',reason:'Holding Time ไม่สามารถคำนวณอัตโนมัติ',max:null};
    if(exp <= std.max) return {code:RESULT.PASS,label:'ผ่าน',reason:'วันหมดอายุอยู่ภายในช่วง Holding Time สูงสุด',max:std.max};
    return {code:RESULT.FAIL,label:'ไม่ผ่าน',reason:'วันหมดอายุเกินช่วง Holding Time สูงสุด',max:std.max};
  }

  function loadState(){
    let saved=null;
    try{ saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); }catch(_){}
    const s=getState();
    if(s?.expiryAudit && typeof s.expiryAudit==='object') saved=s.expiryAudit;
    if(saved&&typeof saved==='object') auditState={branch:txt(saved.branch),checkedAt:txt(saved.checkedAt),entries:saved.entries&&typeof saved.entries==='object'?saved.entries:{},savedAt:txt(saved.savedAt)};
    if(!auditState.checkedAt) auditState.checkedAt=nowLocalInput();
  }
  function persistNow(){
    auditState.savedAt=new Date().toISOString();
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(auditState))}catch(_){}
    try{ const s=getState(); if(s){s.expiryAudit=JSON.parse(JSON.stringify(auditState)); if(typeof dbSet==='function') dbSet(s).catch?.(()=>{});} }catch(_){}
    updateSavedText();
  }
  function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(persistNow,180); }
  function updateSavedText(){ const el=document.getElementById('eaSaved'); if(el)el.textContent=auditState.savedAt?`บันทึกอัตโนมัติล่าสุด ${formatThai(auditState.savedAt)}`:'บันทึกอัตโนมัติเมื่อมีการแก้ไข'; }

  function pageMarkup(){ return `
    <section id="${PAGE_ID}" class="section">
      <div class="card ea-hero"><div><span class="cartoon-label">✅ EXPIRY AUDIT</span><h2>ตรวจสอบวันหมดอายุ</h2><p>ตรวจวันหมดอายุจริงของวัตถุดิบตามฐาน Holding Time ล่าสุด เรียงตามวัตถุดิบและประเภท/สถานะ</p></div><div class="ea-hero-icon">🔎🏷️</div></div>
      <div class="ea-top">
        <div class="card ea-form"><div class="section-head"><div><h3>ข้อมูลการตรวจ</h3><p>ข้อมูลจะบันทึกอัตโนมัติในระบบของเครื่องนี้</p></div><span class="badge">AUTO SAVE</span></div>
          <div class="ea-form-grid"><div class="field"><label>ชื่อสาขา *</label><input id="eaBranch" class="input" placeholder="รหัส / ชื่อสาขา"></div><div class="field"><label>วันที่ตรวจ *</label><input id="eaCheckedAt" class="input" type="datetime-local"></div></div>
          <div class="ea-actions"><button id="eaClear" type="button" class="btn btn-outline">🗑️ ล้างข้อมูล</button><button id="eaPdf" type="button" class="btn btn-primary">📄 Export PDF</button><button id="eaJpg" type="button" class="btn btn-outline">🖼️ Export JPG</button></div>
          <div id="eaSaved" class="ea-save-note">บันทึกอัตโนมัติเมื่อมีการแก้ไข</div>
        </div>
        <div class="card ea-summary"><div class="section-head"><div><h3>สรุปผลตรวจ</h3><p>อัปเดตทันทีเมื่อกรอกข้อมูล</p></div></div><div class="ea-summary-grid"><div class="ea-stat"><b id="eaAll">0</b><span>ทั้งหมด</span></div><div class="ea-stat pass"><b id="eaPass">0</b><span>ผ่าน</span></div><div class="ea-stat fail"><b id="eaFail">0</b><span>ไม่ผ่าน</span></div><div class="ea-stat manual"><b id="eaManual">0</b><span>ตรวจฉลาก</span></div></div></div>
      </div>
      <div class="card ea-table-card"><div class="ea-toolbar"><input id="eaSearch" class="input" placeholder="ค้นหาวัตถุดิบ / ประเภท"><span class="badge" id="eaVisibleCount">0 รายการ</span><button id="eaRefresh" class="btn btn-outline" type="button">↻ อัปเดต Holding Time</button></div>
        <div class="ea-table-wrap"><table class="ea-table"><thead><tr><th>#</th><th>วัตถุดิบ</th><th>ประเภท / สถานะ</th><th>Holding Time</th><th>วันหมดอายุที่ตรวจพบ</th><th>ขอบเขตสูงสุดตามมาตรฐาน</th><th>ผลตรวจ</th></tr></thead><tbody id="eaBody"></tbody></table></div>
        <div class="ea-rule">เกณฑ์อัตโนมัติ: วันหมดอายุต้องไม่ก่อนวันที่ตรวจ และต้องไม่เกินช่วง Holding Time สูงสุดนับจากวันที่ตรวจ สำหรับรายการที่ระบุ “ตามบรรจุภัณฑ์” ระบบจะแสดง <b>ตรวจฉลาก</b> เพื่อให้ตรวจวันหมดอายุบนบรรจุภัณฑ์จริง</div>
      </div>
    </section>`; }

  function installPage(){
    if(document.getElementById(PAGE_ID)) return;
    const main=document.querySelector('.main'); if(!main)return;
    const quiz=document.getElementById('quiz');
    if(quiz) quiz.insertAdjacentHTML('beforebegin',pageMarkup()); else main.insertAdjacentHTML('beforeend',pageMarkup());
    try{ if(typeof pageMeta!=='undefined') pageMeta[PAGE_ID]=['ตรวจสอบวันหมดอายุ','ตรวจวัตถุดิบตาม Holding Time • Auto Save • Export PDF/JPG']; }catch(_){}
    bindPage();
  }

  function installMenu(){
    if(document.querySelector(`.nav button[data-page="${PAGE_ID}"]`))return;
    const expiryBtn=document.querySelector('.nav button[data-page="expiry"]'); if(!expiryBtn)return;
    const btn=document.createElement('button'); btn.dataset.page=PAGE_ID; btn.innerHTML='<span class="ico">✅</span><span class="label">ตรวจสอบวันหมดอายุ</span>';
    expiryBtn.insertAdjacentElement('afterend',btn);
    btn.addEventListener('click',()=>{try{goPage(PAGE_ID)}catch(_){document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===PAGE_ID));} renderAudit();});
  }

  function bindPage(){
    document.getElementById('eaBranch')?.addEventListener('input',e=>{auditState.branch=e.target.value; scheduleSave();});
    document.getElementById('eaCheckedAt')?.addEventListener('change',e=>{auditState.checkedAt=e.target.value||nowLocalInput(); scheduleSave(); renderAuditRows();});
    document.getElementById('eaSearch')?.addEventListener('input',renderAuditRows);
    document.getElementById('eaRefresh')?.addEventListener('click',()=>{renderAuditRows(); toastMsg('อัปเดตรายการจาก Holding Time ล่าสุดแล้ว','success');});
    document.getElementById('eaClear')?.addEventListener('click',clearAudit);
    document.getElementById('eaPdf')?.addEventListener('click',exportPdf);
    document.getElementById('eaJpg')?.addEventListener('click',exportJpg);
    document.getElementById('eaBody')?.addEventListener('change',e=>{
      const input=e.target.closest?.('.ea-exp-input'); if(!input)return;
      auditState.entries[input.dataset.key]=input.value||''; scheduleSave(); updateRowResult(input); updateSummary();
    });
  }

  function renderAudit(){
    installPage(); installMenu();
    const branch=document.getElementById('eaBranch'), checked=document.getElementById('eaCheckedAt');
    if(branch)branch.value=auditState.branch||''; if(checked)checked.value=auditState.checkedAt||nowLocalInput();
    updateSavedText(); renderAuditRows();
  }

  function resultHtml(res){ const icon=res.code===RESULT.PASS?'✓':res.code===RESULT.FAIL?'✕':res.code===RESULT.MANUAL?'!':'•'; return `<span class="ea-result ${res.code}">${icon} ${esc(res.label)}</span><span class="ea-reason">${esc(res.reason)}</span>`; }
  function renderAuditRows(){
    const body=document.getElementById('eaBody'); if(!body)return;
    const q=txt(document.getElementById('eaSearch')?.value).toLowerCase();
    const rows=uniqueRows().filter(r=>!q||[r.item,r.status,r.holding].join(' ').toLowerCase().includes(q));
    body.innerHTML=rows.map((r,i)=>{const val=txt(auditState.entries[r.key]);const ev=evaluate(r,val);return `<tr data-key="${r.key}"><td class="ea-no">${i+1}</td><td class="ea-item">${esc(r.item)}</td><td class="ea-status">${esc(r.status||'-')}</td><td class="ea-holding">${esc(r.holding||'-')}</td><td><input class="ea-exp-input" type="datetime-local" data-key="${r.key}" value="${esc(val)}"></td><td class="ea-max">${ev.max?esc(formatThai(ev.max)):(ev.code===RESULT.MANUAL?'ตรวจตามฉลาก':'-')}</td><td class="ea-result-cell">${resultHtml(ev)}</td></tr>`}).join('');
    const count=document.getElementById('eaVisibleCount'); if(count)count.textContent=`${rows.length} รายการ`; updateSummary();
  }
  function updateRowResult(input){
    const tr=input.closest('tr'), row=uniqueRows().find(r=>r.key===input.dataset.key); if(!tr||!row)return;
    const ev=evaluate(row,input.value); const max=tr.querySelector('.ea-max'), cell=tr.querySelector('.ea-result-cell'); if(max)max.textContent=ev.max?formatThai(ev.max):(ev.code===RESULT.MANUAL?'ตรวจตามฉลาก':'-'); if(cell)cell.innerHTML=resultHtml(ev);
  }
  function summaryData(){ let pass=0,fail=0,manual=0,pending=0; const rows=uniqueRows(); rows.forEach(r=>{const e=evaluate(r,txt(auditState.entries[r.key])); if(e.code===RESULT.PASS)pass++; else if(e.code===RESULT.FAIL)fail++; else if(e.code===RESULT.MANUAL)manual++; else pending++;}); return {all:rows.length,pass,fail,manual,pending}; }
  function updateSummary(){ const s=summaryData(); [['eaAll',s.all],['eaPass',s.pass],['eaFail',s.fail],['eaManual',s.manual]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v}); }

  function clearAudit(){
    if(!confirm('ล้างข้อมูลผลตรวจวันหมดอายุทั้งหมดของหน้านี้หรือไม่?'))return;
    auditState={branch:'',checkedAt:nowLocalInput(),entries:{},savedAt:''}; persistNow(); renderAudit(); toastMsg('ล้างข้อมูลแล้ว','success');
  }

  function exportRows(){ return uniqueRows().map((r,i)=>{const value=txt(auditState.entries[r.key]);const ev=evaluate(r,value);return {...r,no:i+1,value,ev};}); }
  function exportMeta(){ const s=summaryData(); return {branch:auditState.branch||'-',checkedAt:formatThai(auditState.checkedAt),generated:formatThai(new Date()),summary:s}; }
  function reportHtml(){
    const meta=exportMeta(), rows=exportRows();
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>KSL Expiry Audit</title><style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Tahoma,"Noto Sans Thai",Arial,sans-serif;margin:0;color:#173d30;font-size:8pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.head{display:flex;justify-content:space-between;gap:12mm;align-items:flex-start;border-bottom:2px solid #176e52;padding-bottom:4mm;margin-bottom:4mm}.brand{display:flex;gap:4mm;align-items:center}.logo{width:15mm;height:15mm;border-radius:4mm;background:#176e52;color:#fff;display:grid;place-items:center;font-size:14pt;font-weight:900}.head h1{font-size:17pt;margin:0}.head p{margin:1mm 0 0;color:#6b8077}.meta{text-align:right;font-size:8pt;line-height:1.6}.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:0 0 4mm}.sum div{border:1px solid #d8e8e0;border-radius:2mm;padding:2.5mm;text-align:center;background:#f8fcfa}.sum b{display:block;font-size:13pt}.sum span{font-size:7pt;color:#6d8178}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th{background:#e9f6ef;color:#285a47;padding:2mm;border:1px solid #cbded5;text-align:left;font-size:7pt}td{padding:1.8mm 2mm;border:1px solid #dfe9e4;vertical-align:top;line-height:1.35}.c-no{width:5%}.c-item{width:18%}.c-status{width:23%}.c-hold{width:10%}.c-exp{width:17%}.c-max{width:17%}.c-result{width:10%}.pass{color:#11784d;font-weight:900}.fail{color:#a33131;font-weight:900}.manual{color:#8c6415;font-weight:900}.pending{color:#708077;font-weight:900}.foot{margin-top:3mm;font-size:7pt;color:#71847b}.page-footer{position:fixed;bottom:-5mm;left:0;right:0;text-align:center;font-size:6.5pt;color:#899990}</style></head><body><div class="head"><div class="brand"><div class="logo">KSL</div><div><h1>รายงานตรวจสอบวันหมดอายุ</h1><p>Kamu Kamu Standard Libary • Holding Time Audit</p></div></div><div class="meta"><b>สาขา:</b> ${esc(meta.branch)}<br><b>วันที่ตรวจ:</b> ${esc(meta.checkedAt)}<br><b>Export:</b> ${esc(meta.generated)}</div></div><div class="sum"><div><b>${meta.summary.all}</b><span>ทั้งหมด</span></div><div><b>${meta.summary.pass}</b><span>ผ่าน</span></div><div><b>${meta.summary.fail}</b><span>ไม่ผ่าน</span></div><div><b>${meta.summary.manual}</b><span>ตรวจฉลาก</span></div></div><table><thead><tr><th class="c-no">#</th><th class="c-item">วัตถุดิบ</th><th class="c-status">ประเภท / สถานะ</th><th class="c-hold">Holding Time</th><th class="c-exp">วันหมดอายุที่ตรวจพบ</th><th class="c-max">ขอบเขตสูงสุด</th><th class="c-result">ผล</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.no}</td><td><b>${esc(r.item)}</b></td><td>${esc(r.status||'-')}</td><td>${esc(r.holding||'-')}</td><td>${esc(r.value?formatThai(r.value):'-')}</td><td>${esc(r.ev.max?formatThai(r.ev.max):(r.ev.code===RESULT.MANUAL?'ตรวจตามฉลาก':'-'))}</td><td class="${r.ev.code}">${esc(r.ev.label)}</td></tr>`).join('')}</tbody></table><div class="foot">เกณฑ์: ไม่หมดอายุก่อนวันที่ตรวจ และไม่เกิน Holding Time สูงสุดจากวันที่ตรวจ • รายการตามบรรจุภัณฑ์ต้องตรวจฉลากจริง</div><div class="page-footer">KSL • Expiry Audit</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
  }
  function exportPdf(){
    if(!auditState.branch){toastMsg('กรุณากรอกชื่อสาขาก่อน Export','warn');return}
    const w=window.open('','_blank'); if(!w){toastMsg('Browser บล็อกหน้าต่าง Export กรุณาอนุญาต Pop-up','warn');return}
    w.document.open();w.document.write(reportHtml());w.document.close();
  }

  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=2){ const words=Array.from(String(text||''));let line='',lines=[];for(const ch of words){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch;if(lines.length>=maxLines-1)break}else line=test}if(line&&lines.length<maxLines)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return lines.length; }
  function drawCell(ctx,text,x,y,w,h,opt={}){ ctx.strokeStyle='#d9e6df';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);ctx.fillStyle=opt.fill||'#173d30';ctx.font=`${opt.bold?'700':'400'} ${opt.size||20}px Tahoma, Arial, sans-serif`;ctx.textBaseline='top';wrapCanvasText(ctx,text,x+10,y+9,w-20,opt.lineHeight||25,opt.lines||2); }
  function exportJpg(){
    if(!auditState.branch){toastMsg('กรุณากรอกชื่อสาขาก่อน Export','warn');return}
    const rows=exportRows(), meta=exportMeta(); const PAGE_W=2480,PAGE_H=1754,M=70,HEAD=290,ROW_H=62,HEADER_H=58; const cols=[70,390,500,230,360,360,260]; const perPage=Math.floor((PAGE_H-M-HEAD-HEADER_H-80)/ROW_H); const pages=Math.max(1,Math.ceil(rows.length/perPage));
    for(let p=0;p<pages;p++) setTimeout(()=>{
      const canvas=document.createElement('canvas');canvas.width=PAGE_W;canvas.height=PAGE_H;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,PAGE_W,PAGE_H);
      ctx.fillStyle='#176e52';ctx.fillRect(M,M,92,92);ctx.fillStyle='#fff';ctx.font='700 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('KSL',M+46,M+46);ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#173d30';ctx.font='700 42px Tahoma, Arial';ctx.fillText('รายงานตรวจสอบวันหมดอายุ',M+120,M+4);ctx.fillStyle='#6b8077';ctx.font='22px Tahoma, Arial';ctx.fillText('Kamu Kamu Standard Libary • Holding Time Audit',M+120,M+60);ctx.fillStyle='#173d30';ctx.font='700 23px Tahoma, Arial';ctx.fillText(`สาขา: ${meta.branch}`,M+120,M+105);ctx.font='20px Tahoma, Arial';ctx.fillText(`วันที่ตรวจ: ${meta.checkedAt}`,M+120,M+140);ctx.fillText(`หน้า ${p+1}/${pages}`,PAGE_W-M-160,M+8);
      const sy=M+205; const cards=[['ทั้งหมด',meta.summary.all,'#f7fbf9'],['ผ่าน',meta.summary.pass,'#effaf4'],['ไม่ผ่าน',meta.summary.fail,'#fff1f1'],['ตรวจฉลาก',meta.summary.manual,'#fff8e8']];cards.forEach((c,i)=>{const w=320,x=M+i*(w+18);ctx.fillStyle=c[2];ctx.fillRect(x,sy,w,70);ctx.strokeStyle='#d8e8e0';ctx.strokeRect(x,sy,w,70);ctx.fillStyle='#173d30';ctx.font='700 29px Tahoma, Arial';ctx.fillText(String(c[1]),x+18,sy+12);ctx.fillStyle='#6c8178';ctx.font='18px Tahoma, Arial';ctx.fillText(c[0],x+80,sy+18)});
      let y=M+HEAD,x=M; const heads=['#','วัตถุดิบ','ประเภท / สถานะ','Holding Time','วันหมดอายุที่ตรวจพบ','ขอบเขตสูงสุด','ผล'];heads.forEach((h,i)=>{ctx.fillStyle='#e9f6ef';ctx.fillRect(x,y,cols[i],HEADER_H);drawCell(ctx,h,x,y,cols[i],HEADER_H,{bold:true,size:18,lineHeight:22});x+=cols[i]});y+=HEADER_H;
      rows.slice(p*perPage,(p+1)*perPage).forEach(r=>{x=M;const vals=[r.no,r.item,r.status||'-',r.holding||'-',r.value?formatThai(r.value):'-',r.ev.max?formatThai(r.ev.max):(r.ev.code===RESULT.MANUAL?'ตรวจตามฉลาก':'-'),r.ev.label];vals.forEach((v,i)=>{const fill=i===6?(r.ev.code===RESULT.PASS?'#11784d':r.ev.code===RESULT.FAIL?'#a33131':r.ev.code===RESULT.MANUAL?'#8c6415':'#708077'):'#173d30';drawCell(ctx,String(v),x,y,cols[i],ROW_H,{bold:i===1||i===6,size:17,lineHeight:21,lines:2,fill});x+=cols[i]});y+=ROW_H});
      ctx.fillStyle='#768a80';ctx.font='16px Tahoma, Arial';ctx.fillText('KSL • Expiry Audit • เกณฑ์อ้างอิงจาก Holding Time ล่าสุด',M,PAGE_H-45);
      const a=document.createElement('a');a.download=`KSL_Expiry_Audit_${fileSafe(meta.branch)}_${fileSafe(auditState.checkedAt.slice(0,10))}_${p+1}.jpg`;a.href=canvas.toDataURL('image/jpeg',0.92);document.body.appendChild(a);a.click();a.remove();
    },p*350);
    toastMsg(`กำลัง Export JPG ${pages} หน้า`,'success');
  }

  function install(){ installPage(); installMenu(); if(document.getElementById(PAGE_ID)?.classList.contains('active'))renderAudit(); }

  loadState(); install();
  [120,500,1400,3200].forEach(ms=>setTimeout(install,ms));
  window.addEventListener('ksl-central-synced',()=>{ if(document.getElementById(PAGE_ID)?.classList.contains('active'))renderAuditRows(); });
  new MutationObserver(()=>queueMicrotask(install)).observe(document.documentElement,{childList:true,subtree:true});
  window.renderExpiryAudit=renderAudit;
  window.exportExpiryAuditPDF=exportPdf;
  window.exportExpiryAuditJPG=exportJpg;
  console.info('[KSL] V6.3 expiry audit ready');
})();