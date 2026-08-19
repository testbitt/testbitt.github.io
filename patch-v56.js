/* KSL V5.6 — Admin quiz answer key */
(() => {
  'use strict';
  if (window.__KSL_ANSWER_KEY_V56__) return;
  window.__KSL_ANSWER_KEY_V56__ = true;

  const PAGE_SIZE = 80;
  let answerKeyPage = 1;

  const style = document.createElement('style');
  style.id = 'ksl-answer-key-v56-style';
  style.textContent = `
    .answer-key-card{margin-top:16px!important;overflow:hidden}
    .answer-key-toolbar{display:grid;grid-template-columns:190px minmax(220px,1fr) auto;gap:9px;align-items:end;margin:14px 0 12px}
    .answer-key-summary{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .answer-key-summary .ak-chip{padding:7px 10px;border-radius:999px;background:#f0f8f4;border:1px solid #d4e9df;color:#245744;font-size:11px;font-weight:800}
    .answer-key-wrap{border:1px solid #d9e9e2;border-radius:16px;overflow:auto;background:#fff;max-height:620px}
    .answer-key-table{width:100%;border-collapse:separate;border-spacing:0;min-width:820px}
    .answer-key-table th{position:sticky;top:0;z-index:2;background:#eef8f3;color:#245744;text-align:left;font-size:11px;padding:11px 12px;border-bottom:1px solid #d8e8e1;white-space:nowrap}
    .answer-key-table td{padding:11px 12px;border-bottom:1px solid #edf3f0;vertical-align:top;font-size:12px;line-height:1.55;color:#304e43}
    .answer-key-table tr:last-child td{border-bottom:0}
    .answer-key-table .ak-no{width:54px;text-align:center;color:#789087;font-weight:800}
    .answer-key-table .ak-course{width:155px}
    .answer-key-table .ak-question{min-width:340px;font-weight:700;color:#173d30}
    .answer-key-table .ak-answer{min-width:250px}
    .ak-course-badge{display:inline-flex;align-items:center;padding:6px 9px;border-radius:999px;font-size:10px;font-weight:900;white-space:nowrap;border:1px solid #d6e9e0;background:#f4faf7;color:#235b46}
    .ak-course-badge.production{background:#fff3f6;border-color:#f3dce3;color:#7f4658}
    .ak-course-badge.drink{background:#eef8fc;border-color:#d7eaf2;color:#346276}
    .ak-correct{display:inline-block;padding:7px 10px;border-radius:10px;background:#eaf8f1;border:1px solid #cfeadb;color:#116742;font-weight:900;white-space:pre-wrap;word-break:break-word}
    .answer-key-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:10px}
    .answer-key-empty{padding:34px;text-align:center;color:#789087}
    @media(max-width:760px){.answer-key-toolbar{grid-template-columns:1fr}.answer-key-wrap{max-height:520px}}
  `;
  document.head.appendChild(style);

  function safeText(v){
    try { if (typeof safe === 'function') return safe(v); } catch(_) {}
    return String(v ?? '').trim();
  }
  function esc(v){
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch(_) {}
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function uniqQuestions(rows){
    const seen = new Set();
    return (Array.isArray(rows) ? rows : []).filter(q => {
      const question = safeText(q?.q);
      const correct = safeText(q?.correct);
      if (!question || !correct) return false;
      const key = question + '\u0000' + correct;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function callBank(name){
    try {
      const fn = window[name] || (typeof globalThis[name] === 'function' ? globalThis[name] : null);
      return typeof fn === 'function' ? uniqQuestions(fn()) : [];
    } catch(err){
      console.warn('[KSL V5.6] answer bank failed:', name, err);
      return [];
    }
  }
  function getBanks(){
    return {
      holding: callBank('buildHoldingQuestionBank'),
      production: callBank('buildProductionQuestionBank'),
      drink: callBank('buildDrinkQuestionBank')
    };
  }
  function labelFor(scope){
    return scope === 'production' ? '🧑‍🍳 สูตรการผลิต' : scope === 'drink' ? '🧋 สูตรชงเครื่องดื่ม' : '⏳ Holding Time';
  }
  function classFor(scope){ return scope === 'production' ? 'production' : scope === 'drink' ? 'drink' : 'holding'; }

  function installUI(){
    const manage = document.getElementById('manage');
    if (!manage || document.getElementById('quizAnswerKeyCard')) return;

    const card = document.createElement('div');
    card.className = 'card answer-key-card';
    card.id = 'quizAnswerKeyCard';
    card.innerHTML = `
      <div class="section-head">
        <div><h3>✅ คลังเฉลยแบบทดสอบ</h3><p>แสดงคำถามและคำตอบที่ถูกต้องจากฐานหลักสูตรล่าสุด • ใช้สำหรับผู้ดูแลตรวจสอบข้อสอบ</p></div>
        <span class="badge" id="answerKeyTotalBadge">0 ข้อ</span>
      </div>
      <div class="answer-key-summary" id="answerKeySummary"></div>
      <div class="answer-key-toolbar">
        <div class="field"><label>หลักสูตร</label><select id="answerKeyScope" class="select">
          <option value="all">ทุกหลักสูตร</option>
          <option value="holding">Holding Time</option>
          <option value="production">สูตรการผลิต</option>
          <option value="drink">สูตรชงเครื่องดื่ม</option>
        </select></div>
        <div class="field"><label>ค้นหาคำถาม / คำตอบ</label><input id="answerKeySearch" class="input" placeholder="พิมพ์ชื่อวัตถุดิบ เมนู หรือคำตอบ..."></div>
        <button type="button" class="btn btn-outline" id="answerKeyRefresh">↻ อัปเดตเฉลย</button>
      </div>
      <div class="answer-key-wrap" id="answerKeyWrap"></div>
      <div class="answer-key-footer">
        <div class="small-note" id="answerKeyShowing">-</div>
        <div style="display:flex;gap:7px"><button type="button" class="btn btn-outline" id="answerKeyPrev">← ก่อนหน้า</button><button type="button" class="btn btn-outline" id="answerKeyNext">ถัดไป →</button></div>
      </div>`;

    manage.appendChild(card);

    const scope = document.getElementById('answerKeyScope');
    const search = document.getElementById('answerKeySearch');
    scope?.addEventListener('change', () => { answerKeyPage = 1; renderAnswerKey(); });
    search?.addEventListener('input', () => { answerKeyPage = 1; renderAnswerKey(); });
    document.getElementById('answerKeyRefresh')?.addEventListener('click', () => { answerKeyPage = 1; renderAnswerKey(); });
    document.getElementById('answerKeyPrev')?.addEventListener('click', () => { if(answerKeyPage > 1){ answerKeyPage--; renderAnswerKey(); } });
    document.getElementById('answerKeyNext')?.addEventListener('click', () => { answerKeyPage++; renderAnswerKey(); });
  }

  function filteredRows(){
    const banks = getBanks();
    const scope = document.getElementById('answerKeyScope')?.value || 'all';
    const query = safeText(document.getElementById('answerKeySearch')?.value).toLowerCase();
    let rows = [];
    Object.entries(banks).forEach(([type, list]) => {
      if (scope !== 'all' && scope !== type) return;
      list.forEach(q => rows.push({type, ...q}));
    });
    if (query) rows = rows.filter(r => [r.q, r.correct, r.kicker, labelFor(r.type)].map(safeText).join(' ').toLowerCase().includes(query));
    return {banks, rows};
  }

  function renderAnswerKey(){
    installUI();
    const wrap = document.getElementById('answerKeyWrap');
    if (!wrap) return;

    const {banks, rows} = filteredRows();
    const totalAll = banks.holding.length + banks.production.length + banks.drink.length;
    const summary = document.getElementById('answerKeySummary');
    if (summary) summary.innerHTML = `
      <span class="ak-chip">⏳ Holding Time ${banks.holding.length.toLocaleString('th-TH')} ข้อ</span>
      <span class="ak-chip">🧑‍🍳 สูตรการผลิต ${banks.production.length.toLocaleString('th-TH')} ข้อ</span>
      <span class="ak-chip">🧋 สูตรชง ${banks.drink.length.toLocaleString('th-TH')} ข้อ</span>`;
    const badge = document.getElementById('answerKeyTotalBadge');
    if (badge) badge.textContent = `${totalAll.toLocaleString('th-TH')} ข้อ`;

    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (answerKeyPage > pages) answerKeyPage = pages;
    const start = (answerKeyPage - 1) * PAGE_SIZE;
    const shown = rows.slice(start, start + PAGE_SIZE);

    if (!shown.length) {
      wrap.innerHTML = '<div class="answer-key-empty">🔎 ไม่พบคำถามตามเงื่อนไข</div>';
    } else {
      wrap.innerHTML = `<table class="answer-key-table"><thead><tr><th>#</th><th>หลักสูตร</th><th>คำถาม</th><th>คำตอบที่ถูกต้อง</th></tr></thead><tbody>${shown.map((r,i)=>`
        <tr>
          <td class="ak-no">${start+i+1}</td>
          <td class="ak-course"><span class="ak-course-badge ${classFor(r.type)}">${esc(labelFor(r.type))}</span><div class="small-note" style="margin-top:5px">${esc(r.kicker||'')}</div></td>
          <td class="ak-question">${esc(r.q)}</td>
          <td class="ak-answer"><span class="ak-correct">✓ ${esc(r.correct)}</span></td>
        </tr>`).join('')}</tbody></table>`;
    }

    const info = document.getElementById('answerKeyShowing');
    if (info) info.textContent = rows.length ? `แสดง ${start+1}–${Math.min(start+PAGE_SIZE,rows.length)} จาก ${rows.length.toLocaleString('th-TH')} ข้อ • หน้า ${answerKeyPage}/${pages}` : '0 ข้อ';
    const prev = document.getElementById('answerKeyPrev');
    const next = document.getElementById('answerKeyNext');
    if (prev) prev.disabled = answerKeyPage <= 1;
    if (next) next.disabled = answerKeyPage >= pages;
  }

  window.renderAnswerKey = renderAnswerKey;

  try {
    if (typeof window.renderManage === 'function') {
      const base = window.renderManage;
      window.renderManage = function(){
        const out = base.apply(this, arguments);
        setTimeout(renderAnswerKey, 0);
        return out;
      };
    }
  } catch(_) {}

  installUI();
  setTimeout(renderAnswerKey, 120);
  setTimeout(renderAnswerKey, 700);

  console.info('[KSL] V5.6 Admin quiz answer key ready');
})();
