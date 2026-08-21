/* KSL V5.9 — Live-first central sync. Do not let stale GitHub snapshot override Google Sheets. */
(() => {
  'use strict';
  if (window.__KSL_CENTRAL_SYNC_V59__) return;
  window.__KSL_CENTRAL_SYNC_V59__ = true;
  // Prevent an older central-sync patch from taking ownership if it is injected later.
  window.__KSL_CENTRAL_SYNC_V58__ = true;

  const API = 'https://script.google.com/macros/s/AKfycbySkH0Fn2P757EJM_bDNYNkQx-Ieq6IAa9e0uSz1WOPt4u8eL4dP7pr3iBH0lqn6zxD/exec';
  const REQUEST_TIMEOUT = 12000;
  const RETRY_DELAYS = [0, 1400, 4200];
  const PERIODIC_MS = 3 * 60 * 1000;
  let activePromise = null;
  let lastAppliedSignature = '';
  let lastStatus = {state:'idle', text:'กำลังตรวจสอบข้อมูลส่วนกลาง', source:'', updatedAt:''};

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cloneRows = rows => (Array.isArray(rows) ? rows.map(r => (r && typeof r === 'object' ? {...r} : r)) : []);

  function replaceArray(target, rows){
    if (!Array.isArray(target) || !Array.isArray(rows)) return false;
    target.splice(0, target.length, ...cloneRows(rows));
    return true;
  }

  function maxUpdatedAt(meta){
    const vals = [meta?.holdingTime?.updatedAt, meta?.productionRecipes?.updatedAt, meta?.drinkRecipes?.updatedAt]
      .map(v => String(v || '')).filter(Boolean).sort();
    return vals.length ? vals[vals.length - 1] : '';
  }

  function signatureOf(snapshot){
    const d = snapshot?.data || {};
    const m = snapshot?.meta || {};
    return [
      d.holdingTime?.length || 0,
      d.productionRecipes?.length || 0,
      d.drinkRecipes?.length || 0,
      m.holdingTime?.updatedAt || '',
      m.productionRecipes?.updatedAt || '',
      m.drinkRecipes?.updatedAt || ''
    ].join('|');
  }

  function setStatus(state, text, source='', updatedAt=''){
    lastStatus = {state, text, source, updatedAt};
    try { renderStatus(); } catch (_) {}
  }

  function fmtTime(iso){
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(iso));
    } catch (_) { return String(iso); }
  }

  function installStatus(){
    const manage = document.getElementById('manage');
    if (!manage || document.getElementById('kslCentralSyncCard')) return;
    const card = document.createElement('div');
    card.id = 'kslCentralSyncCard';
    card.className = 'card';
    card.style.cssText = 'margin:0 0 14px;border:1px solid #d7e9e0;background:#f8fcfa';
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <div style="font-weight:900;color:#204d3b">☁️ ข้อมูลส่วนกลาง</div>
          <div id="kslCentralSyncText" style="font-size:11px;color:#647d72;margin-top:3px">กำลังตรวจสอบข้อมูลส่วนกลาง</div>
        </div>
        <button type="button" class="btn btn-outline" id="kslCentralSyncNow">↻ ดึงข้อมูลล่าสุด</button>
      </div>`;
    manage.insertBefore(card, manage.firstChild);
    document.getElementById('kslCentralSyncNow')?.addEventListener('click', () => syncCentral(true));
    renderStatus();
  }

  function renderStatus(){
    installStatus();
    const el = document.getElementById('kslCentralSyncText');
    if (!el) return;
    const suffix = lastStatus.updatedAt ? ` • ล่าสุด ${fmtTime(lastStatus.updatedAt)}` : '';
    el.textContent = `${lastStatus.text}${suffix}`;
    el.style.color = lastStatus.state === 'ok' ? '#177348' : lastStatus.state === 'error' ? '#a05252' : '#647d72';
  }

  async function fetchOnce(){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const url = `${API}?action=snapshot&v=59&t=${Date.now()}`;
      const res = await fetch(url, {
        method:'GET', cache:'no-store', redirect:'follow', credentials:'omit', signal:controller.signal,
        headers:{'Accept':'application/json'}
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json?.ok || json?.action !== 'snapshot') throw new Error(json?.error || 'Apps Script ยังไม่ใช่เวอร์ชัน snapshot');
      const d = json?.data || {};
      if (!Array.isArray(d.holdingTime) || !Array.isArray(d.productionRecipes) || !Array.isArray(d.drinkRecipes)) {
        throw new Error('ข้อมูล snapshot ไม่ครบ');
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchLiveWithRetry(){
    let lastErr = null;
    for (let i=0; i<RETRY_DELAYS.length; i++) {
      if (RETRY_DELAYS[i]) await sleep(RETRY_DELAYS[i]);
      setStatus('loading', i ? `กำลังลองดึงข้อมูลส่วนกลางอีกครั้ง (${i+1}/${RETRY_DELAYS.length})` : 'กำลังดึงข้อมูลล่าสุดจาก Google Sheets');
      try { return await fetchOnce(); }
      catch (err) {
        lastErr = err;
        console.warn('[KSL V5.9] live central attempt failed', i+1, err?.message || err);
      }
    }
    throw lastErr || new Error('ไม่สามารถดึงข้อมูลส่วนกลางได้');
  }

  function patchState(data){
    let state = null;
    try { if (typeof appState !== 'undefined') state = appState; } catch (_) {}
    if (!state || typeof state !== 'object') return false;

    const h = cloneRows(data.holdingTime);
    const p = cloneRows(data.productionRecipes);
    const d = cloneRows(data.drinkRecipes);

    // Keep the canonical keys plus legacy aliases so every existing screen reads the same central set.
    state.data = h;
    state.holdingTime = cloneRows(h);
    state.holdingData = cloneRows(h);
    state.productionRecipes = p;
    state.productionData = cloneRows(p);
    state.production = cloneRows(p);
    state.recipesProduction = cloneRows(p);
    state.beverageRecipes = d;
    state.drinkRecipes = cloneRows(d);
    state.beverageData = cloneRows(d);
    state.drinkData = cloneRows(d);
    state.drinks = cloneRows(d);

    // Patch common lexical/global array names used by older KSL builds when they exist.
    try { if (typeof SEED_DATA !== 'undefined' && Array.isArray(SEED_DATA)) replaceArray(SEED_DATA, h); } catch (_) {}
    try { if (typeof holdingData !== 'undefined' && Array.isArray(holdingData)) replaceArray(holdingData, h); } catch (_) {}
    try { if (typeof holdingTimeData !== 'undefined' && Array.isArray(holdingTimeData)) replaceArray(holdingTimeData, h); } catch (_) {}
    try { if (typeof productionRecipes !== 'undefined' && Array.isArray(productionRecipes)) replaceArray(productionRecipes, p); } catch (_) {}
    try { if (typeof productionData !== 'undefined' && Array.isArray(productionData)) replaceArray(productionData, p); } catch (_) {}
    try { if (typeof PRODUCTION_DATA !== 'undefined' && Array.isArray(PRODUCTION_DATA)) replaceArray(PRODUCTION_DATA, p); } catch (_) {}
    try { if (typeof beverageRecipes !== 'undefined' && Array.isArray(beverageRecipes)) replaceArray(beverageRecipes, d); } catch (_) {}
    try { if (typeof drinkRecipes !== 'undefined' && Array.isArray(drinkRecipes)) replaceArray(drinkRecipes, d); } catch (_) {}
    try { if (typeof drinkData !== 'undefined' && Array.isArray(drinkData)) replaceArray(drinkData, d); } catch (_) {}
    try { if (typeof DRINK_DATA !== 'undefined' && Array.isArray(DRINK_DATA)) replaceArray(DRINK_DATA, d); } catch (_) {}
    try { if (typeof beverageData !== 'undefined' && Array.isArray(beverageData)) replaceArray(beverageData, d); } catch (_) {}
    return true;
  }

  function refreshViews(){
    const names = [
      'refreshAll','renderDataTable','renderCourses','renderCourseMenu','renderFlashCards',
      'populateCalculator','renderAnswerKey','updateStats','renderManage'
    ];
    for (const name of names) {
      try { if (typeof window[name] === 'function') window[name](); }
      catch (err) { console.debug('[KSL V5.9] refresh skipped', name, err); }
    }
  }

  async function applySnapshot(snapshot, force=false){
    const sig = signatureOf(snapshot);
    if (!force && sig && sig === lastAppliedSignature) return true;
    if (!patchState(snapshot.data || {})) throw new Error('appState ยังไม่พร้อม');

    const updatedAt = maxUpdatedAt(snapshot.meta || {});
    try {
      appState.centralSync = {
        version:'5.9', source:'Google Sheets Live', updatedAt,
        rows:{
          holding:snapshot.data.holdingTime.length,
          production:snapshot.data.productionRecipes.length,
          drink:snapshot.data.drinkRecipes.length
        },
        checkedAt:new Date().toISOString()
      };
      localStorage.setItem('KSL_CENTRAL_SYNC_META', JSON.stringify(appState.centralSync));
    } catch (_) {}

    try { if (typeof dbSet === 'function') await dbSet(appState); } catch (err) { console.debug('[KSL V5.9] local save skipped', err); }
    lastAppliedSignature = sig;
    refreshViews();
    setTimeout(refreshViews, 120);
    setTimeout(refreshViews, 650);
    setStatus('ok', `เชื่อมส่วนกลางแล้ว • Holding ${snapshot.data.holdingTime.length} • ผลิต ${snapshot.data.productionRecipes.length} • สูตรชง ${snapshot.data.drinkRecipes.length}`, 'Google Sheets Live', updatedAt);
    window.dispatchEvent(new CustomEvent('ksl-central-synced',{detail:{source:'Google Sheets Live',meta:snapshot.meta||{}}}));
    console.info('[KSL V5.9] Google Sheets live data applied', appState.centralSync);
    return true;
  }

  async function syncCentral(force=false){
    if (activePromise && !force) return activePromise;
    activePromise = (async () => {
      try {
        const snapshot = await fetchLiveWithRetry();
        return await applySnapshot(snapshot, force);
      } catch (err) {
        console.error('[KSL V5.9] live central sync failed; stale static snapshot will NOT be applied', err);
        setStatus('error', 'ยังดึงข้อมูลส่วนกลางไม่ได้ • ระบบจะลองใหม่อัตโนมัติ');
        return false;
      } finally {
        setTimeout(() => { activePromise = null; }, 500);
      }
    })();
    return activePromise;
  }

  window.KSL_SYNC_CENTRAL = syncCentral;

  const start = () => {
    installStatus();
    syncCentral(true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 40), {once:true});
  else setTimeout(start, 40);

  window.addEventListener('focus', () => syncCentral(false));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncCentral(false); });
  setInterval(() => syncCentral(false), PERIODIC_MS);

  console.info('[KSL] V5.9 live-first central sync ready');
})();
