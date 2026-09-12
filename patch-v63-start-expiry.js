/* KSL V6.3 update — start datetime -> calculated expiry datetime */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_START_V631__) return;
  window.__KSL_EXPIRY_START_V631__ = true;

  const STORAGE_KEY = 'KSL_EXPIRY_START_V631';
  let starts = {};
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) starts = saved;
  } catch (_) {}

  const style = document.createElement('style');
  style.id = 'ksl-expiry-start-v631-style';
  style.textContent = `
    #expiryAudit .ea-table{min-width:1480px}
    #expiryAudit .ea-start-cell{min-width:205px}
    #expiryAudit .ea-start-input{width:190px;min-height:34px;border:1px solid #cbded5;border-radius:8px;padding:5px 7px;font:inherit;background:#fff;color:#203c31}
    #expiryAudit .ea-start-input:focus{outline:0;border-color:#2b9270;box-shadow:0 0 0 3px rgba(43,146,112,.10)}
    #expiryAudit .ea-calc-cell{min-width:190px}
    #expiryAudit .ea-calc-expiry{display:inline-flex;flex-direction:column;gap:2px;padding:7px 9px;border-radius:10px;background:#eef8f3;border:1px solid #d4e9df;color:#174b38;font-weight:900;line-height:1.35}
    #expiryAudit .ea-calc-expiry small{font-size:8.5px;color:#6b8077;font-weight:700}
    #expiryAudit .ea-calc-expiry.manual{background:#fff7df;border-color:#efdfad;color:#8b6516}
    #expiryAudit .ea-calc-expiry.pending{background:#f3f5f4;border-color:#e1e7e4;color:#718079}
  `;
  document.head.appendChild(style);

  function txt(v){ return String(v ?? '').trim(); }
  function esc(v){ return txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(starts)); } catch (_) {}
  }

  function formatThai(v){
    if (!v) return '-';
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return '-';
    try {
      return new Intl.DateTimeFormat('th-TH', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit', hour12:false
      }).format(d);
    } catch (_) { return d.toLocaleString('th-TH'); }
  }

  function parseDuration(holding, start){
    const raw = txt(holding).toLowerCase();
    if (!raw || /ตาม.*บรรจุภัณฑ์|บรรจุภัณฑ์|package/.test(raw)) return {kind:'manual',expiry:null};
    const base = new Date(start);
    if (Number.isNaN(base.getTime())) return {kind:'invalid',expiry:null};
    const m = raw.match(/(\d+(?:\.\d+)?)\s*(นาที|ชั่วโมง|ชม\.?|วัน|เดือน|ปี)/i);
    if (!m) return {kind:'manual',expiry:null};
    const n = Number(m[1]);
    const unit = m[2];
    const d = new Date(base);
    if (/นาที/.test(unit)) d.setMinutes(d.getMinutes() + n);
    else if (/ชั่วโมง|ชม/.test(unit)) d.setHours(d.getHours() + n);
    else if (/วัน/.test(unit)) d.setDate(d.getDate() + n);
    else if (/เดือน/.test(unit)) d.setMonth(d.getMonth() + n);
    else if (/ปี/.test(unit)) d.setFullYear(d.getFullYear() + n);
    return {kind:'fixed',expiry:d};
  }

  function resultMarkup(holding, start){
    if (!start) return '<span class="ea-calc-expiry pending">รอวัน/เวลาเริ่มต้น<small>กรอกช่องเริ่มต้นเพื่อคำนวณ</small></span>';
    const calc = parseDuration(holding, start);
    if (calc.kind === 'fixed' && calc.expiry) {
      return `<span class="ea-calc-expiry">${esc(formatThai(calc.expiry))}<small>คำนวณจาก ${esc(holding || '-')}</small></span>`;
    }
    if (calc.kind === 'manual') return '<span class="ea-calc-expiry manual">ตรวจตามฉลาก<small>Holding Time ไม่ระบุช่วงคำนวณ</small></span>';
    return '<span class="ea-calc-expiry pending">คำนวณไม่ได้<small>กรุณาตรวจวัน/เวลาเริ่มต้น</small></span>';
  }

  function renderCalc(tr){
    if (!tr) return;
    const input = tr.querySelector('.ea-start-input');
    const out = tr.querySelector('.ea-calc-cell');
    const holding = txt(tr.cells?.[3]?.textContent);
    if (out) out.innerHTML = resultMarkup(holding, input?.value || '');
  }

  function augmentTable(){
    const page = document.getElementById('expiryAudit');
    const table = page?.querySelector('.ea-table');
    const head = table?.querySelector('thead tr');
    const body = table?.querySelector('#eaBody');
    if (!table || !head || !body) return false;

    if (!head.querySelector('.ea-start-head')) {
      const startTh = document.createElement('th');
      startTh.className = 'ea-start-head';
      startTh.textContent = 'เริ่มต้นวันหมดอายุ';
      const calcTh = document.createElement('th');
      calcTh.className = 'ea-calc-head';
      calcTh.textContent = 'วัน/เวลาหมดอายุที่คำนวณ';
      const anchor = head.children[4] || null;
      head.insertBefore(startTh, anchor);
      head.insertBefore(calcTh, anchor);
    }

    body.querySelectorAll('tr[data-key]').forEach(tr => {
      const key = txt(tr.dataset.key);
      if (!key) return;
      if (!tr.querySelector('.ea-start-cell')) {
        const startCell = tr.insertCell(4);
        startCell.className = 'ea-start-cell';
        startCell.innerHTML = `<input class="ea-start-input" type="datetime-local" data-start-key="${esc(key)}" value="${esc(starts[key] || '')}">`;
        const calcCell = tr.insertCell(5);
        calcCell.className = 'ea-calc-cell';
      }
      const input = tr.querySelector('.ea-start-input');
      if (input && input.value !== txt(starts[key])) input.value = txt(starts[key]);
      renderCalc(tr);
    });
    return true;
  }

  function scheduleAugment(){
    [0,60,180,450,1000].forEach(ms => setTimeout(augmentTable, ms));
  }

  document.addEventListener('change', e => {
    const input = e.target.closest?.('.ea-start-input');
    if (input) {
      const key = txt(input.dataset.startKey);
      if (key) {
        if (input.value) starts[key] = input.value;
        else delete starts[key];
        persist();
        renderCalc(input.closest('tr'));
      }
      return;
    }
    if (e.target?.id === 'eaCheckedAt') scheduleAugment();
  }, true);

  document.addEventListener('input', e => {
    if (e.target?.id === 'eaSearch') scheduleAugment();
  }, true);

  document.addEventListener('click', e => {
    const el = e.target.closest?.('#eaRefresh, .nav button[data-page="expiryAudit"]');
    if (el) scheduleAugment();
    if (e.target.closest?.('#eaClear')) {
      starts = {};
      persist();
      scheduleAugment();
    }
  }, true);

  window.addEventListener('ksl-central-synced', scheduleAugment);

  if (typeof window.renderExpiryAudit === 'function' && !window.renderExpiryAudit.__kslStartWrapped) {
    const base = window.renderExpiryAudit;
    const wrapped = function(){
      const out = base.apply(this, arguments);
      scheduleAugment();
      return out;
    };
    wrapped.__kslStartWrapped = true;
    window.renderExpiryAudit = wrapped;
  }

  scheduleAugment();
  console.info('[KSL] V6.3 start datetime expiry calculator ready');
})();
