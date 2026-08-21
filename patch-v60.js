/* KSL V6.0 — JSONP central sync for reliable cross-origin data updates. */
(() => {
  'use strict';
  if (window.__KSL_CENTRAL_SYNC_V60__) return;
  window.__KSL_CENTRAL_SYNC_V60__ = true;
  window.__KSL_CENTRAL_SYNC_V59__ = true;
  window.__KSL_CENTRAL_SYNC_V58__ = true;

  const API = 'https://script.google.com/macros/s/AKfycbySkH0Fn2P757EJM_bDNYNkQx-Ieq6IAa9e0uSz1WOPt4u8eL4dP7pr3iBH0lqn6zxD/exec';
  const TIMEOUT_MS = 15000;
  const RETRY_DELAYS = [0, 1500, 4000];
  const PERIODIC_MS = 2 * 60 * 1000;
  let activePromise = null;
  let lastSignature = '';
  let status = {state:'idle', text:'กำลังตรวจสอบข้อมูลส่วนกลาง', updatedAt:''};

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cloneRows = rows => Array.isArray(rows) ? rows.map(r => (r && typeof r === 'object' ? {...r} : r)) : [];

  function replaceArray(target, rows){
    if (!Array.isArray(target) || !Array.isArray(rows)) return false;
    target.splice(0, target.length, ...cloneRows(rows));
    return true;
  }

  function classify(arr){
    if (!Array.isArray(arr) || !arr.length) return '';
    const row = arr.find(x => x && typeof x === 'object' && !Array.isArray(x));
    if (!row) return '';
    const keys = new Set(Object.keys(row));
    if (keys.has('ชื่อวัตถุดิบ') && (keys.has('อายุการจัดเก็บ') || keys.has('สถานะ'))) return 'holding';
    if (keys.has('recipe_name_th') && (keys.has('ingredients') || keys.has('method'))) return 'production';
    if (keys.has('Menu') && keys.has('Ingredient')) return 'drink';
    return '';
  }

  function replaceMatchingArrays(root, rowsByType){
    if (!root || typeof root !== 'object') return;
    const seen = new WeakSet();
    function walk(obj, depth){
      if (!obj || typeof obj !== 'object' || depth > 5 || seen.has(obj)) return;
      seen.add(obj);
      for (const key of Object.keys(obj)) {
        let value;
        try { value = obj[key]; } catch (_) { continue; }
        if (Array.isArray(value)) {
          const type = classify(value);
          if (type && rowsByType[type]) replaceArray(value, rowsByType[type]);
        } else if (value && typeof value === 'object') {
          walk(value, depth + 1);
        }
      }
    }
    walk(root, 0);
  }

  function updatedAtOf(snapshot){
    const vals = [
      snapshot?.meta?.holdingTime?.updatedAt,
      snapshot?.meta?.productionRecipes?.updatedAt,
      snapshot?.meta?.drinkRecipes?.updatedAt
    ].map(v => String(v || '')).filter(Boolean).sort();
    return vals.length ? vals[vals.length - 1] : '';
  }

  function signatureOf(snapshot){
    const d = snapshot?.data || {}, m = snapshot?.meta || {};
    return [
      d.holdingTime?.length || 0,
      d.productionRecipes?.length || 0,
      d.drinkRecipes?.length || 0,
      m.holdingTime?.updatedAt || '',
      m.productionRecipes?.updatedAt || '',
      m.drinkRecipes?.updatedAt || ''
    ].join('|');
  }

  function fmtTime(iso){
    if (!iso) return '-';
    try {
      return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(iso));
    } catch (_) { return String(iso); }
  }

  function setStatus(state, text, updatedAt=''){
    status = {state,text,updatedAt};
    renderStatus();
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
  }

  function renderStatus(){
    installStatus();
    const el = document.getElementById('kslCentralSyncText');
    if (!el) return;
    el.textContent = status.text + (status.updatedAt ? ` • ล่าสุด ${fmtTime(status.updatedAt)}` : '');
    el.style.color = status.state === 'ok' ? '#177348' : status.state === 'error' ? '#a05252' : '#647d72';
  }

  function jsonpOnce(){
    return new Promise((resolve,reject) => {
      const cb = '__kslCentralCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let done = false;
      const cleanup = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { delete window[cb]; } catch (_) { window[cb] = undefined; }
        script.remove();
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, TIMEOUT_MS);

      window[cb] = payload => {
        cleanup();
        if (!payload?.ok || payload?.action !== 'snapshot') {
          reject(new Error(payload?.error || 'Apps Script ยังไม่ได้ Deploy V3.6 JSONP'));
          return;
        }
        const d = payload?.data || {};
        if (!Array.isArray(d.holdingTime) || !Array.isArray(d.productionRecipes) || !Array.isArray(d.drinkRecipes)) {
          reject(new Error('ข้อมูลส่วนกลางไม่ครบ'));
          return;
        }
        resolve(payload);
      };

      script.async = true;
      script.onerror = () => {
        cleanup();
        reject(new Error('โหลด JSONP จาก Apps Script ไม่สำเร็จ'));
      };
      script.src = `${API}?action=snapshot&callback=${encodeURIComponent(cb)}&v=60&t=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function loadLive(){
    let lastErr = null;
    for (let i=0; i<RETRY_DELAYS.length; i++) {
      if (RETRY_DELAYS[i]) await sleep(RETRY_DELAYS[i]);
      setStatus('loading', i ? `กำลังลองดึงข้อมูลส่วนกลางอีกครั้ง (${i+1}/${RETRY_DELAYS.length})` : 'กำลังดึงข้อมูลล่าสุดจาก Google Sheets');
      try { return await jsonpOnce(); }
      catch (err) {
        lastErr = err;
        console.warn('[KSL V6.0] JSONP attempt failed', i+1, err?.message || err);
      }
    }
    throw lastErr || new Error('ไม่สามารถดึงข้อมูลส่วนกลางได้');
  }

  function patchState(data){
    let state = null;
    try { if (typeof appState !== 'undefined') state = appState; } catch (_) {}
    if (!state || typeof state !== 'object') return false;

    const rowsByType = {
      holding: cloneRows(data.holdingTime),
      production: cloneRows(data.productionRecipes),
      drink: cloneRows(data.drinkRecipes)
    };

    replaceMatchingArrays(state, rowsByType);

    state.data = cloneRows(rowsByType.holding);
    state.holdingTime = cloneRows(rowsByType.holding);
    state.holdingData = cloneRows(rowsByType.holding);
    state.productionRecipes = cloneRows(rowsByType.production);
    state.productionData = cloneRows(rowsByType.production);
    state.production = cloneRows(rowsByType.production);
    state.recipesProduction = cloneRows(rowsByType.production);
    state.beverageRecipes = cloneRows(rowsByType.drink);
    state.drinkRecipes = cloneRows(rowsByType.drink);
    state.beverageData = cloneRows(rowsByType.drink);
    state.drinkData = cloneRows(rowsByType.drink);
    state.drinks = cloneRows(rowsByType.drink);

    try { if (typeof SEED_DATA !== 'undefined' && Array.isArray(SEED_DATA)) replaceArray(SEED_DATA, rowsByType.holding); } catch (_) {}
    try { if (typeof holdingData !== 'undefined' && Array.isArray(holdingData)) replaceArray(holdingData, rowsByType.holding); } catch (_) {}
    try { if (typeof holdingTimeData !== 'undefined' && Array.isArray(holdingTimeData)) replaceArray(holdingTimeData, rowsByType.holding); } catch (_) {}
    try { if (typeof productionRecipes !== 'undefined' && Array.isArray(productionRecipes)) replaceArray(productionRecipes, rowsByType.production); } catch (_) {}
    try { if (typeof productionData !== 'undefined' && Array.isArray(productionData)) replaceArray(productionData, rowsByType.production); } catch (_) {}
    try { if (typeof PRODUCTION_DATA !== 'undefined' && Array.isArray(PRODUCTION_DATA)) replaceArray(PRODUCTION_DATA, rowsByType.production); } catch (_) {}
    try { if (typeof beverageRecipes !== 'undefined' && Array.isArray(beverageRecipes)) replaceArray(beverageRecipes, rowsByType.drink); } catch (_) {}
    try { if (typeof drinkRecipes !== 'undefined' && Array.isArray(drinkRecipes)) replaceArray(drinkRecipes, rowsByType.drink); } catch (_) {}
    try { if (typeof drinkData !== 'undefined' && Array.isArray(drinkData)) replaceArray(drinkData, rowsByType.drink); } catch (_) {}
    try { if (typeof DRINK_DATA !== 'undefined' && Array.isArray(DRINK_DATA)) replaceArray(DRINK_DATA, rowsByType.drink); } catch (_) {}
    try { if (typeof beverageData !== 'undefined' && Array.isArray(beverageData)) replaceArray(beverageData, rowsByType.drink); } catch (_) {}
    return true;
  }

  function refreshViews(){
    const names = ['refreshAll','renderDataTable','renderCourses','renderCourseMenu','renderFlashCards','populateCalculator','renderAnswerKey','updateStats','renderManage'];
    for (const name of names) {
      try { if (typeof window[name] === 'function') window[name](); }
      catch (err) { console.debug('[KSL V6.0] refresh skipped', name, err); }
    }
  }

  async function applySnapshot(snapshot, force=false){
    const sig = signatureOf(snapshot);
    if (!force && sig && sig === lastSignature) return true;
    if (!patchState(snapshot.data || {})) throw new Error('appState ยังไม่พร้อม');

    const updatedAt = updatedAtOf(snapshot);
    try {
      appState.centralSync = {
        version:'6.0', source:'Google Sheets JSONP', updatedAt,
        rows:{
          holding:snapshot.data.holdingTime.length,
          production:snapshot.data.productionRecipes.length,
          drink:snapshot.data.drinkRecipes.length
        },
        checkedAt:new Date().toISOString()
      };
      localStorage.setItem('KSL_CENTRAL_SYNC_META', JSON.stringify(appState.centralSync));
    } catch (_) {}

    try { if (typeof dbSet === 'function') await dbSet(appState); } catch (err) { console.debug('[KSL V6.0] local persist skipped', err); }
    lastSignature = sig;
    refreshViews();
    setTimeout(refreshViews, 150);
    setTimeout(refreshViews, 700);
    setStatus('ok', `เชื่อมส่วนกลางแล้ว • Holding ${snapshot.data.holdingTime.length} • ผลิต ${snapshot.data.productionRecipes.length} • สูตรชง ${snapshot.data.drinkRecipes.length}`, updatedAt);
    window.dispatchEvent(new CustomEvent('ksl-central-synced',{detail:{source:'Google Sheets JSONP',meta:snapshot.meta||{}}}));
    console.info('[KSL V6.0] live central data applied', appState.centralSync);
    return true;
  }

  async function syncCentral(force=false){
    if (activePromise && !force) return activePromise;
    activePromise = (async () => {
      try {
        const snapshot = await loadLive();
        return await applySnapshot(snapshot, force);
      } catch (err) {
        console.error('[KSL V6.0] central sync failed', err);
        setStatus('error', 'ยังดึงข้อมูลส่วนกลางไม่ได้ • ตรวจสอบ Apps Script V3.6');
        return false;
      } finally {
        setTimeout(() => { activePromise = null; }, 400);
      }
    })();
    return activePromise;
  }

  window.KSL_SYNC_CENTRAL = syncCentral;

  const boot = () => {
    installStatus();
    [80, 1500, 5000, 12000].forEach(ms => setTimeout(() => syncCentral(true), ms));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  window.addEventListener('focus', () => syncCentral(false));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncCentral(false); });
  setInterval(() => syncCentral(false), PERIODIC_MS);

  console.info('[KSL] V6.0 JSONP central sync ready');
})();
