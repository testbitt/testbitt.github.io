/* KSL V5.8 — shared central data for every device */
(() => {
  'use strict';
  if (window.__KSL_CENTRAL_SYNC_V58__) return;
  window.__KSL_CENTRAL_SYNC_V58__ = true;

  const VERSION = '58';
  const API = 'https://script.google.com/macros/s/AKfycbySkH0Fn2P757EJM_bDNYNkQx-Ieq6IAa9e0uSz1WOPt4u8eL4dP7pr3iBH0lqn6zxD/exec';
  const STATIC_PARTS = [0,1,2,3].map(i => `central/part-${String(i).padStart(2,'0')}.txt?v=${VERSION}`);
  const STATIC_B64_LENGTH = 20492;
  const TIMEOUT_MS = 2200;
  let syncPromise = null;

  function withTimeout(promise, ms){
    return Promise.race([
      promise,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('central sync timeout')),ms))
    ]);
  }

  async function loadApi(){
    try{
      const url = `${API}?action=snapshot&t=${Date.now()}`;
      const res = await withTimeout(fetch(url,{cache:'no-store',redirect:'follow'}), TIMEOUT_MS);
      if(!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      const d = json?.data || {};
      if(!Array.isArray(d.holdingTime) || !Array.isArray(d.productionRecipes) || !Array.isArray(d.drinkRecipes)) throw new Error('snapshot API not deployed yet');
      return {...json, source:'Google Sheets Live'};
    }catch(err){
      console.info('[KSL V5.8] live API unavailable; use published snapshot', err?.message || err);
      return null;
    }
  }

  async function loadStatic(){
    const parts = await Promise.all(STATIC_PARTS.map(url => fetch(url,{cache:'no-store'}).then(r=>{
      if(!r.ok) throw new Error(`โหลด ${url} ไม่สำเร็จ (${r.status})`);
      return r.text();
    })));
    const b64 = parts.join('').replace(/\s+/g,'');
    if(b64.length !== STATIC_B64_LENGTH || !b64.startsWith('H4sI')) throw new Error(`Central snapshot ไม่สมบูรณ์ (${b64.length})`);
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin,c=>c.charCodeAt(0));
    if(!('DecompressionStream' in window)) throw new Error('Browser ไม่รองรับการอ่าน Central Snapshot');
    const text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    const json = JSON.parse(text);
    if(!json?.data) throw new Error('Central snapshot ไม่มีข้อมูล');
    return {...json, source:'KSL Database Snapshot'};
  }

  function sampleKeys(arr){
    const row = Array.isArray(arr) ? arr.find(x=>x && typeof x==='object' && !Array.isArray(x)) : null;
    return row ? Object.keys(row) : [];
  }
  function classify(arr){
    const keys = new Set(sampleKeys(arr));
    if(keys.has('ชื่อวัตถุดิบ') && (keys.has('อายุการจัดเก็บ') || keys.has('สถานะ'))) return 'holding';
    if(keys.has('recipe_name_th') && (keys.has('ingredients') || keys.has('method'))) return 'production';
    if(keys.has('Menu') && keys.has('Ingredient') && (keys.has('Category') || keys.has('Variant'))) return 'drink';
    return '';
  }
  function replaceArray(target, rows){
    if(!Array.isArray(target) || !Array.isArray(rows)) return false;
    target.splice(0,target.length,...rows.map(r=>({...r})));
    return true;
  }
  function replaceMatchingArrays(root, rowsByType){
    const seen = new WeakSet();
    const changed = {holding:0,production:0,drink:0};
    function walk(obj,depth){
      if(!obj || typeof obj!=='object' || depth>4 || seen.has(obj)) return;
      seen.add(obj);
      for(const key of Object.keys(obj)){
        let value;
        try{ value=obj[key]; }catch(_){ continue; }
        if(Array.isArray(value)){
          const type=classify(value);
          if(type && rowsByType[type]?.length){ replaceArray(value,rowsByType[type]); changed[type]++; }
          continue;
        }
        if(value && typeof value==='object') walk(value,depth+1);
      }
    }
    walk(root,0);
    return changed;
  }
  function assignKnownKeys(state, data){
    if(!state || typeof state!=='object') return;
    const holding=data.holdingTime||[], production=data.productionRecipes||[], drink=data.drinkRecipes||[];
    if(Array.isArray(state.data)) replaceArray(state.data,holding); else state.data=holding.map(r=>({...r}));
    const prodKeys=['productionRecipes','productionData','production','recipesProduction'];
    const drinkKeys=['beverageRecipes','drinkRecipes','beverageData','drinkData','drinks'];
    for(const k of prodKeys){ if(Array.isArray(state[k])) replaceArray(state[k],production); }
    for(const k of drinkKeys){ if(Array.isArray(state[k])) replaceArray(state[k],drink); }
  }
  function refreshViews(){
    const calls=['refreshAll','renderDataTable','renderCourses','renderCourseMenu','renderFlashCards','populateCalculator','renderAnswerKey','updateStats'];
    for(const name of calls){
      try{ if(typeof window[name]==='function') window[name](); }
      catch(err){ console.debug('[KSL V5.8] refresh skipped',name,err); }
    }
  }

  async function applySnapshot(snapshot){
    const data=snapshot?.data||{};
    const rowsByType={
      holding:Array.isArray(data.holdingTime)?data.holdingTime:[],
      production:Array.isArray(data.productionRecipes)?data.productionRecipes:[],
      drink:Array.isArray(data.drinkRecipes)?data.drinkRecipes:[]
    };
    if(!rowsByType.holding.length && !rowsByType.production.length && !rowsByType.drink.length) return false;
    let state=null;
    try{ if(typeof appState!=='undefined') state=appState; }catch(_){ }
    if(!state) return false;

    const changed=replaceMatchingArrays(state,rowsByType);
    assignKnownKeys(state,data);
    try{
      state.centralSync={
        version:'5.8', source:snapshot.source||'Central', generatedAt:snapshot.generatedAt||snapshot.time||'',
        rows:{holding:rowsByType.holding.length,production:rowsByType.production.length,drink:rowsByType.drink.length}
      };
    }catch(_){ }
    try{ localStorage.setItem('KSL_CENTRAL_SYNC_META',JSON.stringify(state.centralSync||{})); }catch(_){ }

    refreshViews();
    setTimeout(refreshViews,120);
    setTimeout(refreshViews,650);
    console.info('[KSL V5.8] central data applied',state.centralSync,changed);
    return true;
  }

  async function syncCentral(force=false){
    if(syncPromise && !force) return syncPromise;
    const task=(async()=>{
      try{
        let snapshot=await loadApi();
        if(!snapshot) snapshot=await loadStatic();
        await applySnapshot(snapshot);
        window.dispatchEvent(new CustomEvent('ksl-central-synced',{detail:{source:snapshot.source,meta:snapshot.meta||{}}}));
        return snapshot;
      }catch(err){
        console.warn('[KSL V5.8] central sync failed; local data remains available',err);
        return null;
      }
    })();
    syncPromise=task;
    try{return await task}finally{if(syncPromise===task)syncPromise=null}
  }

  window.KSL_SYNC_CENTRAL=syncCentral;
  window.addEventListener('focus',()=>{
    const last=Number(sessionStorage.getItem('KSL_LAST_CENTRAL_CHECK')||0);
    if(Date.now()-last>5*60*1000){ sessionStorage.setItem('KSL_LAST_CENTRAL_CHECK',String(Date.now())); syncCentral(true); }
  });

  // Central data updates after first paint, so it never blocks the home screen.
  const start=()=>{sessionStorage.setItem('KSL_LAST_CENTRAL_CHECK',String(Date.now()));syncCentral(true)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(start,30),{once:true});
  else setTimeout(start,30);

  console.info('[KSL] V5.8 central sync ready');
})();