/* KSL V6.3 update — Expiry Audit item dropdown + frequent items + selected-only rows */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_ITEM_PICKER_V632__) return;
  window.__KSL_EXPIRY_ITEM_PICKER_V632__ = true;

  const SELECTED_KEY = 'KSL_EXPIRY_SELECTED_V632';
  const FREQUENT_KEY = 'KSL_EXPIRY_FREQUENT_V632';
  let selected = [];
  let frequent = [];
  let pickerKey = '';

  function readList(key){
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
    } catch (_) { return []; }
  }
  selected = readList(SELECTED_KEY);
  frequent = readList(FREQUENT_KEY);

  function save(){
    try { localStorage.setItem(SELECTED_KEY, JSON.stringify(selected)); } catch (_) {}
    try { localStorage.setItem(FREQUENT_KEY, JSON.stringify(frequent)); } catch (_) {}
  }
  function txt(v){ return String(v ?? '').trim(); }
  function esc(v){ return txt(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  const style = document.createElement('style');
  style.id = 'ksl-expiry-item-picker-v632-style';
  style.textContent = `
    #expiryAudit .ea-picker-panel{margin-top:12px;padding:12px;border:1px solid #d8e8e0;border-radius:13px;background:#f8fcfa}
    #expiryAudit .ea-picker-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
    #expiryAudit .ea-picker-title b{font-size:11px;color:#244f3e}
    #expiryAudit .ea-picker-title span{font-size:9px;color:#71847b}
    #expiryAudit .ea-picker-row{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:8px;align-items:center}
    #expiryAudit #eaItemPicker{min-width:0}
    #expiryAudit .ea-picker-btn{white-space:nowrap}
    #expiryAudit .ea-picker-group{margin-top:10px}
    #expiryAudit .ea-picker-label{font-size:9px;font-weight:900;color:#60776d;margin-bottom:6px}
    #expiryAudit .ea-picker-chips{display:flex;gap:6px;flex-wrap:wrap;min-height:24px}
    #expiryAudit .ea-pick-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid #d2e5db;border-radius:999px;padding:5px 8px;background:#fff;color:#315d4b;font-size:9px;font-weight:850;cursor:pointer}
    #expiryAudit .ea-pick-chip:hover{border-color:#79b89f;background:#f0faf5}
    #expiryAudit .ea-pick-chip.frequent{background:#fff8e8;border-color:#efdfa9;color:#8b6516}
    #expiryAudit .ea-pick-chip .x{font-size:11px;color:#9a605f;margin-left:2px}
    #expiryAudit .ea-empty-chip{font-size:9px;color:#88988f;padding:5px 0}
    #expiryAudit #eaSearch{display:none!important}
    #expiryAudit .ea-toolbar{grid-template-columns:auto auto;justify-content:end}
    #expiryAudit .ea-selection-empty{display:none;margin:10px 0 2px;padding:14px;border:1px dashed #cadfd5;border-radius:11px;background:#fbfdfc;text-align:center;color:#72877e;font-size:10px}
    @media(max-width:680px){#expiryAudit .ea-picker-row{grid-template-columns:1fr 1fr}#expiryAudit #eaItemPicker{grid-column:1/-1}#expiryAudit .ea-picker-btn{width:100%}}
  `;
  document.head.appendChild(style);

  function rows(){
    return [...document.querySelectorAll('#expiryAudit #eaBody tr[data-key]')];
  }
  function info(tr){
    return {
      key: txt(tr?.dataset?.key),
      item: txt(tr?.querySelector('.ea-item')?.textContent),
      status: txt(tr?.querySelector('.ea-status')?.textContent),
      holding: txt(tr?.querySelector('.ea-holding')?.textContent)
    };
  }
  function labelFor(r){
    return [r.item, r.status && r.status !== '-' ? r.status : '', r.holding && r.holding !== '-' ? r.holding : ''].filter(Boolean).join(' • ');
  }
  function mapRows(){
    const m = new Map();
    rows().forEach(tr => { const r=info(tr); if(r.key) m.set(r.key,{...r,tr}); });
    return m;
  }

  function ensurePanel(){
    const page = document.getElementById('expiryAudit');
    const form = page?.querySelector('.ea-form');
    const grid = form?.querySelector('.ea-form-grid');
    if (!page || !form || !grid) return false;

    if (!document.getElementById('eaPickerPanel')) {
      const panel = document.createElement('div');
      panel.id = 'eaPickerPanel';
      panel.className = 'ea-picker-panel';
      panel.innerHTML = `
        <div class="ea-picker-title"><b>เลือกวัตถุดิบสำหรับตรวจ</b><span>แสดงเฉพาะรายการที่เลือก</span></div>
        <div class="ea-picker-row">
          <select id="eaItemPicker" class="input"><option value="">เลือกวัตถุดิบ / ประเภท</option></select>
          <button id="eaFrequentToggle" class="btn btn-outline ea-picker-btn" type="button">☆ เพิ่มเป็นใช้บ่อย</button>
          <button id="eaClearSelected" class="btn btn-outline ea-picker-btn" type="button">ล้างรายการที่เลือก</button>
        </div>
        <div class="ea-picker-group"><div class="ea-picker-label">★ รายการที่ใช้บ่อย</div><div id="eaFrequentList" class="ea-picker-chips"></div></div>
        <div class="ea-picker-group"><div class="ea-picker-label">รายการที่เลือกสำหรับตรวจ</div><div id="eaSelectedList" class="ea-picker-chips"></div></div>`;
      grid.insertAdjacentElement('afterend', panel);
    }

    const tableCard = page.querySelector('.ea-table-card');
    if (tableCard && !document.getElementById('eaSelectionEmpty')) {
      const empty = document.createElement('div');
      empty.id = 'eaSelectionEmpty';
      empty.className = 'ea-selection-empty';
      empty.textContent = 'กรุณาเลือกวัตถุดิบจาก Drop Down ด้านบน ระบบจะแสดงเฉพาะรายการที่เลือก';
      const wrap = tableCard.querySelector('.ea-table-wrap');
      if (wrap) wrap.insertAdjacentElement('beforebegin', empty);
    }
    return true;
  }

  function cleanState(m){
    const valid = new Set(m.keys());
    selected = selected.filter(k => valid.has(k));
    frequent = frequent.filter(k => valid.has(k));
    if (pickerKey && !valid.has(pickerKey)) pickerKey = '';
    save();
  }

  function renderPicker(){
    if (!ensurePanel()) return false;
    const m = mapRows();
    if (!m.size) return false;
    cleanState(m);

    const select = document.getElementById('eaItemPicker');
    if (select) {
      const current = pickerKey || select.value || '';
      const list = [...m.values()].sort((a,b) => {
        const af = frequent.includes(a.key) ? 0 : 1;
        const bf = frequent.includes(b.key) ? 0 : 1;
        return af-bf || labelFor(a).localeCompare(labelFor(b),'th');
      });
      select.innerHTML = '<option value="">เลือกวัตถุดิบ / ประเภท</option>' + list.map(r => `<option value="${esc(r.key)}">${frequent.includes(r.key)?'★ ':''}${esc(labelFor(r))}</option>`).join('');
      if (current && m.has(current)) select.value=current;
      pickerKey = select.value || '';
    }

    const frequentList = document.getElementById('eaFrequentList');
    if (frequentList) {
      const items = frequent.map(k=>m.get(k)).filter(Boolean);
      frequentList.innerHTML = items.length ? items.map(r=>`<button type="button" class="ea-pick-chip frequent" data-frequent-key="${esc(r.key)}">★ ${esc(r.item)}${r.status&&r.status!=='-'?` • ${esc(r.status)}`:''}</button>`).join('') : '<span class="ea-empty-chip">ยังไม่มีรายการใช้บ่อย</span>';
    }

    const selectedList = document.getElementById('eaSelectedList');
    if (selectedList) {
      const items = selected.map(k=>m.get(k)).filter(Boolean);
      selectedList.innerHTML = items.length ? items.map(r=>`<button type="button" class="ea-pick-chip" data-remove-key="${esc(r.key)}">${esc(r.item)}${r.status&&r.status!=='-'?` • ${esc(r.status)}`:''}<span class="x">×</span></button>`).join('') : '<span class="ea-empty-chip">ยังไม่ได้เลือกรายการ</span>';
    }

    updateFrequentButton();
    return true;
  }

  function updateFrequentButton(){
    const btn = document.getElementById('eaFrequentToggle');
    if (!btn) return;
    const key = pickerKey || document.getElementById('eaItemPicker')?.value || '';
    btn.disabled = !key;
    btn.textContent = key && frequent.includes(key) ? '★ เอาออกจากใช้บ่อย' : '☆ เพิ่มเป็นใช้บ่อย';
  }

  function addSelected(key){
    key=txt(key); if(!key)return;
    if(!selected.includes(key)) selected.push(key);
    save();
    renderPicker();
    applySelectedOnly();
  }
  function removeSelected(key){
    selected = selected.filter(k=>k!==key);
    save();
    renderPicker();
    applySelectedOnly();
  }
  function toggleFrequent(key){
    key=txt(key); if(!key)return;
    if(frequent.includes(key)) frequent=frequent.filter(k=>k!==key); else frequent.push(key);
    save();
    renderPicker();
    applySelectedOnly();
  }

  function updateSelectedSummary(visibleRows){
    let pass=0,fail=0,manual=0;
    visibleRows.forEach(tr=>{
      const r=tr.querySelector('.ea-result');
      if(r?.classList.contains('pass'))pass++;
      else if(r?.classList.contains('fail'))fail++;
      else if(r?.classList.contains('manual'))manual++;
    });
    [['eaAll',visibleRows.length],['eaPass',pass],['eaFail',fail],['eaManual',manual]].forEach(([id,v])=>{
      const el=document.getElementById(id); if(el)el.textContent=String(v);
    });
  }

  function applySelectedOnly(){
    if (!ensurePanel()) return false;
    const m=mapRows(); if(!m.size)return false;
    cleanState(m);
    const chosen=new Set(selected);
    const visible=[];
    m.forEach((r,key)=>{
      const show=chosen.has(key);
      r.tr.style.display=show?'':'none';
      if(show)visible.push(r.tr);
    });
    const count=document.getElementById('eaVisibleCount');
    if(count) count.textContent=`${visible.length} รายการที่เลือก`;
    const empty=document.getElementById('eaSelectionEmpty');
    const wrap=document.querySelector('#expiryAudit .ea-table-wrap');
    if(empty) empty.style.display=visible.length?'none':'block';
    if(wrap) wrap.style.display=visible.length?'block':'none';
    updateSelectedSummary(visible);
    return true;
  }

  function refresh(){
    renderPicker();
    applySelectedOnly();
  }
  function scheduleRefresh(){ [0,70,180,450,900].forEach(ms=>setTimeout(refresh,ms)); }

  document.addEventListener('change', e=>{
    if(e.target?.id==='eaItemPicker'){
      pickerKey=e.target.value||'';
      if(pickerKey) addSelected(pickerKey); else updateFrequentButton();
      return;
    }
    if(e.target?.closest?.('#eaBody')) setTimeout(applySelectedOnly,20);
  }, true);

  document.addEventListener('input', e=>{
    if(e.target?.closest?.('#eaBody')) setTimeout(applySelectedOnly,20);
  }, true);

  document.addEventListener('click', e=>{
    const frequentChip=e.target.closest?.('[data-frequent-key]');
    if(frequentChip){ e.preventDefault(); pickerKey=frequentChip.dataset.frequentKey||''; addSelected(pickerKey); return; }
    const remove=e.target.closest?.('[data-remove-key]');
    if(remove){ e.preventDefault(); removeSelected(remove.dataset.removeKey||''); return; }
    if(e.target.closest?.('#eaFrequentToggle')){ e.preventDefault(); toggleFrequent(pickerKey||document.getElementById('eaItemPicker')?.value||''); return; }
    if(e.target.closest?.('#eaClearSelected')){ e.preventDefault(); selected=[]; save(); renderPicker(); applySelectedOnly(); return; }
    if(e.target.closest?.('#eaRefresh, .nav button[data-page="expiryAudit"]')) scheduleRefresh();
  }, true);

  window.addEventListener('ksl-central-synced',scheduleRefresh);

  if(typeof window.renderExpiryAudit==='function' && !window.renderExpiryAudit.__kslPickerWrapped){
    const base=window.renderExpiryAudit;
    const wrapped=function(){ const out=base.apply(this,arguments); scheduleRefresh(); return out; };
    wrapped.__kslPickerWrapped=true;
    window.renderExpiryAudit=wrapped;
  }

  scheduleRefresh();
  console.info('[KSL] V6.3 expiry item picker + frequent items ready');
})();
