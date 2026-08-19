/* KSL V5.7 — Export quiz / answer key to print-ready A4 PDF */
(() => {
  'use strict';
  if (window.__KSL_PDF_EXPORT_V57__) return;
  window.__KSL_PDF_EXPORT_V57__ = true;

  const style = document.createElement('style');
  style.id = 'ksl-pdf-export-v57-style';
  style.textContent = `
    #quizAnswerKeyCard .answer-key-toolbar{grid-template-columns:170px minmax(210px,1fr) 190px auto auto!important}
    #answerKeyPdfExport{white-space:nowrap}
    @media(max-width:1100px){#quizAnswerKeyCard .answer-key-toolbar{grid-template-columns:1fr 1fr!important}}
    @media(max-width:650px){#quizAnswerKeyCard .answer-key-toolbar{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function safeText(v){
    try { if (typeof safe === 'function') return safe(v); } catch(_) {}
    return String(v ?? '').trim();
  }
  function esc(v){
    return safeText(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function callBank(name){
    try {
      const fn = window[name] || (typeof globalThis[name] === 'function' ? globalThis[name] : null);
      return typeof fn === 'function' ? fn() : [];
    } catch(err){ console.warn('[KSL V5.7] bank failed', name, err); return []; }
  }
  function labelFor(type){
    return type === 'production' ? 'สูตรการผลิต' : type === 'drink' ? 'สูตรชงเครื่องดื่ม' : 'Holding Time';
  }
  function iconFor(type){ return type === 'production' ? '🧑‍🍳' : type === 'drink' ? '🧋' : '⏳'; }
  function getAllRows(){
    const banks = {
      holding: callBank('buildHoldingQuestionBank'),
      production: callBank('buildProductionQuestionBank'),
      drink: callBank('buildDrinkQuestionBank')
    };
    const scope = document.getElementById('answerKeyScope')?.value || 'all';
    const query = safeText(document.getElementById('answerKeySearch')?.value).toLowerCase();
    const seen = new Set();
    const out = [];
    Object.entries(banks).forEach(([type,list]) => {
      if (scope !== 'all' && scope !== type) return;
      (Array.isArray(list) ? list : []).forEach(q => {
        const question = safeText(q?.q || q?.question);
        const correct = safeText(q?.correct || q?.answer);
        if (!question || !correct) return;
        const key = question + '\u0000' + correct;
        if (seen.has(key)) return;
        seen.add(key);
        const row = {type, ...q, q:question, correct};
        const hay = [question, correct, safeText(q?.kicker), labelFor(type)].join(' ').toLowerCase();
        if (!query || hay.includes(query)) out.push(row);
      });
    });
    return out;
  }
  function optionTexts(q){
    const raw = q?.options ?? q?.opts ?? q?.choices ?? q?.answers ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map(o => {
      if (o && typeof o === 'object') return safeText(o.label ?? o.text ?? o.answer ?? o.value ?? o.name);
      return safeText(o);
    }).filter(Boolean).slice(0,8);
  }
  function scopeTitle(){
    const scope = document.getElementById('answerKeyScope')?.value || 'all';
    return scope === 'holding' ? 'Holding Time' : scope === 'production' ? 'สูตรการผลิต' : scope === 'drink' ? 'สูตรชงเครื่องดื่ม' : 'ทุกหลักสูตร';
  }
  function formatThaiDate(){
    try { return new Intl.DateTimeFormat('th-TH',{dateStyle:'long',timeStyle:'short'}).format(new Date()); }
    catch(_) { return new Date().toLocaleString('th-TH'); }
  }
  function questionHtml(r,i){
    const opts = optionTexts(r);
    const letters = ['A','B','C','D','E','F','G','H'];
    const optionsHtml = opts.length
      ? `<div class="options">${opts.map((o,j)=>`<div class="option"><span class="opt-letter">${letters[j]}</span><span>${esc(o)}</span></div>`).join('')}</div>`
      : `<div class="write-lines"><i></i><i></i></div>`;
    return `<article class="question-card">
      <div class="q-head"><span class="q-no">${i+1}</span><span class="course-pill ${esc(r.type)}">${iconFor(r.type)} ${esc(labelFor(r.type))}</span>${r.kicker?`<span class="kicker">${esc(r.kicker)}</span>`:''}</div>
      <div class="q-text">${esc(r.q)}</div>
      ${optionsHtml}
    </article>`;
  }
  function answerKeyHtml(rows){
    return `<section class="answer-section page-break-before">
      <div class="answer-title"><span class="answer-mark">✓</span><div><h2>เฉลยคำตอบ</h2><p>Answer Key</p></div></div>
      <div class="answer-grid">${rows.map((r,i)=>`<div class="answer-item"><span class="ans-no">${i+1}</span><div><small>${iconFor(r.type)} ${esc(labelFor(r.type))}</small><strong>${esc(r.correct)}</strong></div></div>`).join('')}</div>
    </section>`;
  }
  function buildPrintDocument(rows, mode){
    const title = mode === 'exam' ? 'แบบทดสอบความรู้มาตรฐาน KAMU' : 'แบบทดสอบและเฉลยความรู้มาตรฐาน KAMU';
    const subtitle = scopeTitle();
    const query = safeText(document.getElementById('answerKeySearch')?.value);
    const metaSearch = query ? `<span>ตัวกรอง: ${esc(query)}</span>` : '';
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} - ${esc(subtitle)}</title>
    <style>
      @page{size:A4;margin:13mm 12mm 16mm}
      *{box-sizing:border-box} html,body{margin:0;padding:0;background:#fff;color:#173d30;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans Thai",Tahoma,sans-serif;font-size:11.2pt;line-height:1.45}
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .cover{min-height:258mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:18mm 8mm;page-break-after:always;background:linear-gradient(150deg,#f3fbf7 0%,#fff 48%,#fff8e9 100%);border:1px solid #d9ebe2;border-radius:9mm}
      .logo{width:27mm;height:27mm;border-radius:8mm;background:linear-gradient(145deg,#0f6b4f,#47a77f);color:#fff;display:grid;place-items:center;font-size:23pt;font-weight:1000;box-shadow:0 4mm 10mm rgba(15,107,79,.14);margin-bottom:10mm}
      .eyebrow{font-size:9pt;letter-spacing:.12em;text-transform:uppercase;color:#47806a;font-weight:800;margin-bottom:4mm}
      .cover h1{font-size:25pt;line-height:1.2;margin:0;color:#123e2f;max-width:160mm}.cover h2{font-size:15pt;margin:5mm 0 0;color:#2c7057}.cover p{color:#688278;margin:4mm 0 0}
      .meta{display:flex;gap:3mm;justify-content:center;flex-wrap:wrap;margin-top:10mm}.meta span{padding:2.2mm 4mm;border-radius:99mm;background:#fff;border:1px solid #d6e8df;color:#3b6656;font-size:9pt;font-weight:700}
      .student-box{width:100%;max-width:160mm;margin-top:15mm;padding:6mm;border:1px solid #cfe2d9;border-radius:5mm;background:rgba(255,255,255,.82);display:grid;grid-template-columns:1fr 1fr;gap:5mm;text-align:left}
      .line-field{border-bottom:1px solid #8fb6a5;padding:0 1mm 2mm;color:#547466}.line-field.full{grid-column:1/-1}
      .doc-head{display:flex;justify-content:space-between;gap:8mm;align-items:flex-start;border-bottom:2px solid #1e7a59;padding-bottom:4mm;margin-bottom:6mm}.doc-brand{display:flex;gap:4mm;align-items:center}.mini-logo{width:13mm;height:13mm;border-radius:4mm;background:#197556;color:#fff;display:grid;place-items:center;font-weight:1000}.doc-head h1{font-size:16pt;margin:0;color:#143e30}.doc-head p{margin:1mm 0 0;color:#70877d;font-size:9pt}.doc-stat{text-align:right;color:#466b5c;font-size:9pt}.doc-stat b{display:block;font-size:17pt;color:#126546}
      .question-card{break-inside:avoid;page-break-inside:avoid;border:1px solid #d9e8e1;border-radius:4mm;padding:5mm;margin:0 0 4.5mm;background:#fff;box-shadow:0 1mm 3mm rgba(22,77,56,.04)}
      .q-head{display:flex;align-items:center;gap:2.2mm;flex-wrap:wrap;margin-bottom:3mm}.q-no{width:8mm;height:8mm;border-radius:50%;display:grid;place-items:center;background:#166f52;color:#fff;font-weight:900;font-size:9pt}.course-pill{padding:1.2mm 2.5mm;border-radius:99mm;background:#eef8f3;border:1px solid #cfe7dc;color:#286148;font-size:8pt;font-weight:800}.course-pill.production{background:#fff2f5;border-color:#f0d8df;color:#7a4656}.course-pill.drink{background:#eef8fc;border-color:#d6eaf2;color:#366477}.kicker{font-size:8pt;color:#758b82;margin-left:auto}.q-text{font-size:11.5pt;font-weight:750;color:#173d30;margin-bottom:3.5mm}
      .options{display:grid;grid-template-columns:1fr 1fr;gap:2.4mm 4mm}.option{display:flex;gap:2.5mm;align-items:flex-start;padding:2.2mm 2.8mm;border:1px solid #e1ebe7;border-radius:2.5mm;background:#fbfdfc}.opt-letter{width:6mm;height:6mm;border-radius:2mm;background:#edf6f2;color:#26654d;display:grid;place-items:center;font-size:8pt;font-weight:900;flex:0 0 auto}.write-lines{display:grid;gap:4mm;padding-top:2mm}.write-lines i{display:block;border-bottom:1px solid #cbdcd4;height:4mm}
      .answer-section{padding-top:2mm}.page-break-before{page-break-before:always}.answer-title{display:flex;align-items:center;gap:4mm;border-bottom:2px solid #1e7a59;padding-bottom:4mm;margin-bottom:6mm}.answer-mark{width:13mm;height:13mm;border-radius:4mm;background:#e8f7ef;color:#118254;display:grid;place-items:center;font-size:18pt;font-weight:1000}.answer-title h2{margin:0;font-size:18pt;color:#143e30}.answer-title p{margin:0;color:#7a9087;font-size:9pt}.answer-grid{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.answer-item{break-inside:avoid;display:flex;gap:3mm;padding:3mm;border:1px solid #dce9e3;border-radius:3mm}.ans-no{width:8mm;height:8mm;border-radius:50%;background:#176e52;color:#fff;display:grid;place-items:center;font-size:8pt;font-weight:900;flex:0 0 auto}.answer-item small{display:block;color:#758a82;font-size:7.5pt}.answer-item strong{display:block;color:#124e38;margin-top:.6mm}
      .footer{position:fixed;bottom:-11mm;left:0;right:0;text-align:center;color:#86988f;font-size:7.5pt;border-top:1px solid #e3ece8;padding-top:2mm;background:#fff}
      @media screen{body{background:#eef4f1;padding:14mm}.print-sheet{width:210mm;min-height:297mm;margin:auto;background:#fff;padding:13mm 12mm;box-shadow:0 5mm 18mm rgba(21,69,51,.12)}.cover{min-height:250mm}}
      @media print{.print-sheet{padding:0}.cover{border:none;border-radius:0;min-height:260mm}.question-card{box-shadow:none}.footer{display:block}}
    </style></head><body><div class="print-sheet">
      <section class="cover"><div class="logo">KSL</div><div class="eyebrow">Kamu Kamu Standard Libary</div><h1>${esc(title)}</h1><h2>${esc(subtitle)}</h2><p>Product Knowledge • Recipe • Holding Time</p><div class="meta"><span>${rows.length.toLocaleString('th-TH')} ข้อ</span><span>${esc(formatThaiDate())}</span>${metaSearch}</div>
        <div class="student-box"><div class="line-field full">ชื่อ-นามสกุล ........................................................................................................</div><div class="line-field">รหัสพนักงาน ................................................</div><div class="line-field">สาขา ................................................</div><div class="line-field">คะแนน ................ / ${rows.length}</div><div class="line-field">วันที่สอบ ................................................</div></div>
      </section>
      <header class="doc-head"><div class="doc-brand"><div class="mini-logo">KSL</div><div><h1>${esc(title)}</h1><p>${esc(subtitle)} • Kamu Kamu Standard Libary</p></div></div><div class="doc-stat"><b>${rows.length}</b>ข้อ</div></header>
      ${rows.map((r,i)=>questionHtml(r,i)).join('')}
      ${mode === 'answer' ? answerKeyHtml(rows) : ''}
      <div class="footer">Kamu Kamu Standard Libary • เอกสารสำหรับการฝึกอบรมภายใน</div>
    </div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));<\/script></body></html>`;
  }

  function exportPdf(){
    const rows = getAllRows();
    if (!rows.length) {
      if (typeof toast === 'function') toast('ไม่พบข้อสอบตามตัวกรองที่เลือก','warn');
      else alert('ไม่พบข้อสอบตามตัวกรองที่เลือก');
      return;
    }
    const mode = document.getElementById('answerKeyPdfMode')?.value || 'answer';
    const w = window.open('', '_blank');
    if (!w) {
      if (typeof toast === 'function') toast('Browser บล็อกหน้าต่าง Export กรุณาอนุญาต Pop-up แล้วลองใหม่','warn');
      else alert('กรุณาอนุญาต Pop-up เพื่อ Export PDF');
      return;
    }
    w.document.open();
    w.document.write(buildPrintDocument(rows, mode));
    w.document.close();
  }

  function install(){
    const toolbar = document.querySelector('#quizAnswerKeyCard .answer-key-toolbar');
    const refresh = document.getElementById('answerKeyRefresh');
    if (!toolbar || !refresh || document.getElementById('answerKeyPdfExport')) return false;

    const modeWrap = document.createElement('div');
    modeWrap.className = 'field';
    modeWrap.innerHTML = `<label>รูปแบบ PDF</label><select id="answerKeyPdfMode" class="select"><option value="answer">ข้อสอบ + เฉลยท้ายเล่ม</option><option value="exam">ข้อสอบอย่างเดียว</option></select>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'answerKeyPdfExport';
    btn.className = 'btn btn-primary';
    btn.innerHTML = '📄 Export PDF';
    btn.addEventListener('click', exportPdf);
    refresh.before(modeWrap, btn);
    return true;
  }

  window.exportAnswerKeyPDF = exportPdf;
  install();
  setTimeout(install, 150);
  setTimeout(install, 700);
  const obs = new MutationObserver(() => install());
  obs.observe(document.documentElement,{subtree:true,childList:true});
  console.info('[KSL] V5.7 PDF export ready');
})();