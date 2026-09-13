/* KSL V6.3 update — start datetime support; manual expiry field is rendered by result patch */
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
    #expiryAudit .ea-calc-cell{min-width:205px}
    #expiryAudit .ea-manual-expiry-input{width:190px;min-height:34px;border:1px solid #cbded5;border-radius:8px;padding:5px 7px;font:inherit;background:#fff;color:#203c31}
    #expiryAudit .ea-manual-expiry-input:focus{outline:0;border-color:#2b9270;box-shadow:0 0 0 3px rgba(43,146,112,.10)}
  `;
  document.head.appendChild(style);

  function txt(v){ return String(v ?? '').trim(); }
  function esc(v){ return txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(starts)); } catch (_) {}
  }

  function renderCalc(tr){
    // V6.3 manual-expiry mode owns this column. Never overwrite it with a calculated badge.
    if (window.__KSL_EXPIRY_MANUAL_RESULT_V634__) return;
    if (!tr) return;
    const out = tr.querySelector('.ea-calc-cell');
    if (out && !out.querySelector('.ea-manual-expiry-input')) {
      out.innerHTML = '<span class="ea-calc-expiry pending">รอช่องวันหมดอายุ<small>กรอกวันหมดอายุเอง</small></span>';
    }
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
      calcTh.textContent = 'วันหมดอายุ';
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
  console.info('[KSL] V6.3 start datetime support ready for manual expiry');
})();

(() => {
  'use strict';
  if (window.__KSL_EXPIRY_PICKER_LOADER_V632__) return;
  window.__KSL_EXPIRY_PICKER_LOADER_V632__ = true;
  const s=document.createElement('script');
  s.src='patch-v63-item-picker.js?v=63-picker-1';
  s.async=false;
  s.onerror=()=>console.error('[KSL] expiry item picker load failed');
  document.body.appendChild(s);
})();
