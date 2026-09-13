/* KSL V6.3 — Expiry Audit inspection meta + Holding Time management add/delete */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_INSPECTION_META_V63__) return;
  window.__KSL_EXPIRY_INSPECTION_META_V63__ = true;

  const META_KEY = 'KSL_EXPIRY_INSPECTION_META_V63';
  const META_STATE_KEY = 'expiryAuditMeta';
  const txt = v => String(v ?? '').trim();
  const esc = v => txt(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone = v => JSON.parse(JSON.stringify(v));
  const getState = () => { try { if (typeof appState !== 'undefined' && appState) return appState; } catch(_) {} return window.appState || null; };
  const notify = (msg,type='') => { try { if (typeof toast === 'function') return toast(msg,type); } catch(_) {} alert(msg); };
  const loadMeta = () => { try { return JSON.parse(localStorage.getItem(META_KEY)||'{}') || {}; } catch(_) { return {}; } };
  const saveMeta = meta => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch(_) {} };
  let meta = loadMeta();
  let saveTimer = 0;
  let manageTimer = 0;
  let lastHistorySignature = '';

  function syncMetaToState() {
    const s = getState();
    if (!s) return;
    try { s[META_STATE_KEY] = clone(meta); } catch(_) {}
  }
  function mergeMetaFromState() {
    const s = getState();
    if (s?.[META_STATE_KEY] && typeof s[META_STATE_KEY] === 'object') {
      meta = {...meta, ...s[META_STATE_KEY]};
      saveMeta(meta);
    }
  }
  async function persistState() {
    syncMetaToState();
    const s = getState();
    if (!s || typeof dbSet !== 'function') return;
    try { await Promise.resolve(dbSet(s)); } catch(err) { console.warn('[KSL V6.3] meta/dbSet failed', err); }
  }
  function scheduleMetaSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveMeta(meta); persistState(); }, 220);
  }

  function getInspectionMeta() {
    return {
      shiftEmployee: txt(document.getElementById('eaShiftEmployee')?.value),
      inspector: txt(document.getElementById('eaInspector')?.value)
    };
  }
  function setInspectionMeta(values={}) {
    const shift = document.getElementById('eaShiftEmployee');
    const inspector = document.getElementById('eaInspector');
    if (shift) shift.value = txt(values.shiftEmployee);
    if (inspector) inspector.value = txt(values.inspector);
  }
  function currentDraftKey() {
    const branch = txt(document.getElementById('eaBranch')?.value);
    const checked = txt(document.getElementById('eaCheckedAt')?.value);
    return `${branch}\u0001${checked}`;
  }
  function saveDraftMeta() {
    const key = currentDraftKey();
    if (!key || key === '\u0001') return;
    meta.__draft = getInspectionMeta();
    meta.__draftKey = key;
    scheduleMetaSave();
  }
  function installInspectionFields() {
    const page = document.getElementById('expiryAudit');
    const grid = page?.querySelector('.ea-form-grid');
    if (!grid || document.getElementById('eaShiftEmployee')) return false;
    const make = (id,label,placeholder) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      wrap.innerHTML = `<label>${label}</label><input id="${id}" class="input" type="text" autocomplete="off" placeholder="${placeholder}">`;
      return wrap;
    };
    grid.appendChild(make('eaShiftEmployee','พนักงานประจำกะ','ชื่อพนักงานประจำกะ'));
    grid.appendChild(make('eaInspector','ชื่อผู้ตรวจ','ชื่อผู้ตรวจ'));
    ['eaShiftEmployee','eaInspector'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', saveDraftMeta);
      document.getElementById(id)?.addEventListener('change', saveDraftMeta);
    });
    const branch = document.getElementById('eaBranch');
    const checked = document.getElementById('eaCheckedAt');
    [branch,checked].forEach(el => el?.addEventListener('change', () => {
      const key = currentDraftKey();
      const found = meta[key];
      setInspectionMeta(found || (meta.__draftKey === key ? meta.__draft : {}));
    }));
    setInspectionMeta(meta.__draft || {});
    const note = page.querySelector('.ea-form .section-head p');
    if (note) note.textContent = 'ข้อมูลจะบันทึกอัตโนมัติ และใช้ประกอบรายงานผลตรวจ';
    return true;
  }

  function getReportIds() {
    const s = getState();
    const reports = Array.isArray(s?.expiryAuditHistory) ? s.expiryAuditHistory : [];
    return reports.map(r => ({id:txt(r?.id), report:r})).filter(x=>x.id);
  }
  function currentReportMetaForLatest() {
    const reports = getReportIds();
    if (!reports.length) return null;
    reports.sort((a,b) => String(b.report?.updatedAt||b.report?.checkedAt||'').localeCompare(String(a.report?.updatedAt||a.report?.checkedAt||'')));
    return reports[0];
  }
  function decorateHistoryRows() {
    const body = document.getElementById('eaHistoryBody');
    if (!body) return;
    [...body.querySelectorAll('tr[data-history-id]')].forEach(tr => {
      const id = txt(tr.dataset.historyId);
      const m = meta[id];
      if (!m) return;
      let cell = tr.querySelector('.eah-inspection-meta');
      if (!cell) {
        cell = document.createElement('td');
        cell.className = 'eah-inspection-meta';
        const actionCell = tr.lastElementChild;
        if (actionCell) tr.insertBefore(cell, actionCell);
      }
      cell.innerHTML = `<div><b>${esc(m.shiftEmployee || '-')}</b></div><small>ผู้ตรวจ: ${esc(m.inspector || '-')}</small>`;
    });
    const table = document.querySelector('#eaHistoryCard .eah-table');
    const head = table?.querySelector('thead tr');
    if (head && !head.querySelector('.eah-meta-head')) {
      const th = document.createElement('th'); th.className='eah-meta-head'; th.textContent='พนักงานประจำกะ / ผู้ตรวจ';
      const action = head.lastElementChild; if (action) head.insertBefore(th, action);
    }
  }

  function decoratePreview() {
    const modal = document.getElementById('eaHistoryModal');
    const id = txt(modal?.dataset.reportId);
    if (!modal || !id) return;
    const m = meta[id];
    if (!m) return;
    const head = modal.querySelector('.eah-preview-head');
    if (!head || head.querySelector('.eah-meta')) return;
    const box = document.createElement('div'); box.className='eah-meta';
    box.innerHTML = `<small>พนักงานประจำกะ: <b>${esc(m.shiftEmployee || '-')}</b></small><small>ชื่อผู้ตรวจ: <b>${esc(m.inspector || '-')}</b></small>`;
    head.appendChild(box);
  }

  function addManagementStyles() {
    if (document.getElementById('ksl-v63-management-style')) return;
    const s=document.createElement('style');s.id='ksl-v63-management-style';s.textContent=`
      #kslV63HoldingManage{margin:0 0 14px;border:1px solid #d7e9e0;background:#fff}
      #kslV63HoldingManage .v63m-grid{display:grid;grid-template-columns:1.3fr 1fr .9fr 1.3fr auto;gap:8px;align-items:end}
      #kslV63HoldingManage .v63m-list{margin-top:12px;border:1px solid #d8e8e0;border-radius:10px;overflow:auto;max-height:420px}
      #kslV63HoldingManage table{width:100%;border-collapse:collapse;min-width:760px;font-size:10px}
      #kslV63HoldingManage th{background:#edf7f2;color:#315d4b;padding:8px;text-align:left;white-space:nowrap}
      #kslV63HoldingManage td{padding:8px;border-top:1px solid #edf2ef;vertical-align:top}
      #kslV63HoldingManage .v63m-del{padding:5px 8px;font-size:9px;color:#a33131;border-color:#efcaca}
      #kslV63HoldingManage .v63m-note{font-size:9px;color:#71847b;margin-top:6px}
      @media(max-width:1000px){#kslV63HoldingManage .v63m-grid{grid-template-columns:1fr 1fr}.v63m-grid .v63m-submit{grid-column:1/-1}}
      @media(max-width:650px){#kslV63HoldingManage .v63m-grid{grid-template-columns:1fr}}
      #expiryAudit .eah-meta{display:flex;gap:8px;flex-wrap:wrap;padding:8px 10px;border:1px solid #d8e8e0;border-radius:9px;background:#f8fcfa;margin-left:auto}
      #expiryAudit .eah-meta small{color:#60776d}
      #expiryAudit .eah-inspection-meta small{display:block;color:#7b8c84;margin-top:3px}
    `;document.head.appendChild(s);
  }

  function uniqueHoldingRows() {
    const s=getState();
    const rows=Array.isArray(s?.data)?s.data:[];
    return rows.map((r,i)=>({r,i})).filter(x=>txt(x.r?.['ชื่อวัตถุดิบ']));
  }
  function holdingArrays() {
    const s=getState();
    return {s, keys:['data','holdingTime','holdingData']};
  }
  function updateHoldingRows(next) {
    const {s,keys}=holdingArrays(); if(!s) return false;
    keys.forEach(k=>{ if(Array.isArray(s[k])) s[k].splice(0,s[k].length,...clone(next)); });
    try { if (typeof holdingData!=='undefined' && Array.isArray(holdingData)) holdingData.splice(0,holdingData.length,...clone(next)); } catch(_) {}
    try { if (typeof holdingTimeData!=='undefined' && Array.isArray(holdingTimeData)) holdingTimeData.splice(0,holdingTimeData.length,...clone(next)); } catch(_) {}
    try { if (typeof SEED_DATA!=='undefined' && Array.isArray(SEED_DATA)) SEED_DATA.splice(0,SEED_DATA.length,...clone(next)); } catch(_) {}
    return true;
  }
  async function saveHoldingOnline() {
    const s=getState();
    if (!s || typeof dbSet!=='function') throw new Error('ยังไม่พบฐานข้อมูล Online');
    await Promise.resolve(dbSet(s));
  }
  async function addHolding() {
    const item=txt(document.getElementById('v63mItem')?.value);
    const status=txt(document.getElementById('v63mStatus')?.value);
    const holding=txt(document.getElementById('v63mHolding')?.value);
    const storage=txt(document.getElementById('v63mStorage')?.value);
    if(!item){notify('กรุณาใส่ชื่อวัตถุดิบ','warn');return;}
    if(!holding){notify('กรุณาใส่อายุการจัดเก็บ / Holding Time','warn');return;}
    const s=getState(); if(!s){notify('ยังไม่พบฐานข้อมูล','warn');return;}
    const rows=Array.isArray(s.data)?s.data:[];
    const duplicate=rows.some(r=>txt(r?.['ชื่อวัตถุดิบ'])===item && txt(r?.['สถานะ'])===status && txt(r?.['อายุการจัดเก็บ'])===holding && txt(r?.['อุณหภูมิ/สถานที่จัดเก็บ'])===storage);
    if(duplicate){notify('มีข้อมูลรายการนี้อยู่แล้ว','warn');return;}
    const row={'ชื่อวัตถุดิบ':item,'สถานะ':status,'อายุการจัดเก็บ':holding,'อุณหภูมิ/สถานที่จัดเก็บ':storage};
    const next=[...rows,row];
    updateHoldingRows(next);
    try{ await saveHoldingOnline(); renderManagement(); if(typeof window.renderExpiryAudit==='function') window.renderExpiryAudit(); notify('เพิ่มข้อมูลเรียบร้อย และบันทึก Online แล้ว','success'); }
    catch(err){ notify('เพิ่มข้อมูลแล้ว แต่ Sync Online ไม่สำเร็จ: '+(err?.message||err),'warn'); }
  }
  async function deleteHolding(index) {
    const rows=uniqueHoldingRows(); const target=rows.find(x=>x.i===index)?.r; if(!target)return;
    if(!confirm(`ลบวัตถุดิบ “${txt(target['ชื่อวัตถุดิบ'])}” ออกจากข้อมูล Holding Time หรือไม่?`)) return;
    const s=getState(); if(!s)return;
    const next=(Array.isArray(s.data)?s.data:[]).filter((_,i)=>i!==index);
    updateHoldingRows(next);
    try{ await saveHoldingOnline(); renderManagement(); if(typeof window.renderExpiryAudit==='function') window.renderExpiryAudit(); notify('ลบข้อมูลเรียบร้อย และบันทึก Online แล้ว','success'); }
    catch(err){ notify('ลบข้อมูลแล้ว แต่ Sync Online ไม่สำเร็จ: '+(err?.message||err),'warn'); }
  }
  function renderManagement() {
    const manage=document.getElementById('manage'); if(!manage)return false;
    addManagementStyles();
    let card=document.getElementById('kslV63HoldingManage');
    if(!card){
      card=document.createElement('div');card.id='kslV63HoldingManage';card.className='card';
      manage.insertBefore(card,manage.firstChild);
    }
    const rows=uniqueHoldingRows();
    card.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><div style="font-weight:900;color:#204d3b">⚙️ จัดการข้อมูล Holding Time</div><div style="font-size:10px;color:#647d72;margin-top:3px">เพิ่ม / ลบรายการวัตถุดิบ และบันทึกเข้าฐานข้อมูล Online</div></div><span class="badge">${rows.length} รายการ</span></div>
      <div class="v63m-grid" style="margin-top:12px"><div class="field"><label>ชื่อวัตถุดิบ *</label><input id="v63mItem" class="input" placeholder="ชื่อวัตถุดิบ"></div><div class="field"><label>สถานะ</label><input id="v63mStatus" class="input" placeholder="สถานะ"></div><div class="field"><label>Holding Time *</label><input id="v63mHolding" class="input" placeholder="เช่น 14 วัน"></div><div class="field"><label>อุณหภูมิ / สถานที่จัดเก็บ</label><input id="v63mStorage" class="input" placeholder="เช่น แช่เย็น 0–4°C"></div><button id="v63mAdd" type="button" class="btn btn-primary v63m-submit">＋ เพิ่มข้อมูล</button></div>
      <div class="v63m-list"><table><thead><tr><th>#</th><th>ชื่อวัตถุดิบ</th><th>สถานะ</th><th>Holding Time</th><th>อุณหภูมิ / สถานที่จัดเก็บ</th><th>จัดการ</th></tr></thead><tbody>${rows.map(({r,i})=>`<tr><td>${i+1}</td><td><b>${esc(r['ชื่อวัตถุดิบ'])}</b></td><td>${esc(r['สถานะ']||'-')}</td><td>${esc(r['อายุการจัดเก็บ']||'-')}</td><td>${esc(r['อุณหภูมิ/สถานที่จัดเก็บ']||'-')}</td><td><button type="button" class="btn btn-outline v63m-del" data-v63-delete="${i}">ลบ</button></td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center;color:#7b8c84;padding:18px">ยังไม่มีข้อมูล</td></tr>'}</tbody></table></div><div class="v63m-note">หมายเหตุ: การลบจะลบจากรายการ Holding Time ที่ใช้ในหน้า ตรวจสอบวันหมดอายุ ด้วย</div>`;
    card.querySelector('#v63mAdd')?.addEventListener('click',addHolding);
    card.querySelectorAll('[data-v63-delete]').forEach(btn=>btn.addEventListener('click',()=>deleteHolding(Number(btn.dataset.v63Delete))));
    return true;
  }

  function scheduleManagement() { clearTimeout(manageTimer); manageTimer=setTimeout(renderManagement,80); }

  function decorateHistoryIfChanged() {
    const s=getState();
    const sig=JSON.stringify({h:s?.expiryAuditHistory?.length||0,m:Object.keys(meta).length});
    if(sig===lastHistorySignature)return;
    lastHistorySignature=sig;
    decorateHistoryRows();
  }

  function bindHistorySaveWatcher() {
    const btn=document.getElementById('eaHistorySave');
    if(!btn || btn.dataset.v63MetaBound)return;
    btn.dataset.v63MetaBound='1';
    btn.addEventListener('click',()=>{
      setTimeout(()=>{
        const latest=currentReportMetaForLatest();
        if(!latest)return;
        const m=getInspectionMeta();
        if(!m.shiftEmployee && !m.inspector)return;
        meta[latest.id]={...(meta[latest.id]||{}),...m,updatedAt:new Date().toISOString()};
        saveMeta(meta); syncMetaToState(); persistState();
        decorateHistoryRows();
      },450);
    });
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('.nav button[data-page="manage"]')) scheduleManagement();
    if(e.target.closest?.('.nav button[data-page="expiryAudit"]')) setTimeout(()=>{installInspectionFields();bindHistorySaveWatcher();decorateHistoryIfChanged();},120);
    if(e.target.closest?.('[data-eah-view]')) setTimeout(decoratePreview,80);
    if(e.target.closest?.('[data-eah-load]')) setTimeout(()=>{
      const id=e.target.closest('[data-eah-load]')?.dataset.eahLoad;
      if(id && meta[id]) setInspectionMeta(meta[id]);
    },420);
  },true);
  window.addEventListener('ksl-central-synced',()=>{ mergeMetaFromState(); installInspectionFields(); scheduleManagement(); decorateHistoryIfChanged(); });

  mergeMetaFromState();
  setTimeout(()=>{installInspectionFields();bindHistorySaveWatcher();decorateHistoryIfChanged();},180);
  setTimeout(scheduleManagement,250);
  setTimeout(scheduleManagement,900);
  setTimeout(()=>{ if(document.getElementById('manage')) renderManagement(); },1800);
  console.info('[KSL] V6.3 inspection metadata + management add/delete ready');
})();
