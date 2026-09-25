/* KSL V6.3 — upload latest data, render immediately, then sync online safely */
(()=>{
  'use strict';
  if(window.__KSL_UPLOAD_LIVE_FIX_V63__)return;
  window.__KSL_UPLOAD_LIVE_FIX_V63__=1;

  const API=window.__KSL_API_ENDPOINT__||'https://script.google.com/macros/s/AKfycbwtHxjbAvvxLPezMt6GljkyxxVdSPmaSfXSjL1UeoNOQWeUVNihygmsFPaAutfuN6JE/exec';
  const text=v=>String(v??'').trim();
  const clone=rows=>(Array.isArray(rows)?rows:[]).map(r=>r&&typeof r==='object'?{...r}:r);
  const PROD_COLS=['page','recipe_name_th','recipe_name_en','variant','ingredients','temperature_c','boil_time_min','soak_time_min','yield_amount','yield_unit','serving_info','shelf_life','storage_condition','method','notes'];

  const normKey=v=>text(v).replace(/^\uFEFF/,'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').replace(/[：:]+$/,'').trim().toLowerCase();
  const aliases=new Map();
  const add=(canonical,names)=>[canonical,...names].forEach(n=>aliases.set(normKey(n),canonical));
  add('page',['หน้า','source page','source_page','page no','page_no']);
  add('recipe_name_th',['ชื่อสูตร','ชื่อเมนู','ชื่อสูตรการผลิต','สูตรการผลิต','ชื่อผลิตภัณฑ์','ชื่อรายการ','รายการ','recipe name th','recipe name thai','recipe_name','menu','menu th','menu_th','product','product name','product_name']);
  add('recipe_name_en',['ชื่อภาษาอังกฤษ','ชื่อสูตรภาษาอังกฤษ','ชื่อเมนูภาษาอังกฤษ','recipe name en','recipe english','english name','name en','name_en','menu en','menu_en']);
  add('variant',['สูตร','สูตรย่อย','รูปแบบ','ประเภทสูตร','variant name','sub recipe','sub_recipe']);
  add('ingredients',['ส่วนผสม','วัตถุดิบ','รายการวัตถุดิบ','ingredient','raw material','raw materials','materials']);
  add('temperature_c',['อุณหภูมิ','อุณหภูมิ c','อุณหภูมิ °c','temperature','temperature c','temperature °c']);
  add('boil_time_min',['เวลาต้ม','เวลาต้ม นาที','boil time','boil time min','boiling time']);
  add('soak_time_min',['เวลาแช่','เวลาอบ/แช่','เวลาอบ','soak time','soak time min','steep time']);
  add('yield_amount',['yield','ปริมาณที่ได้','จำนวนที่ได้','ผลผลิต','yield amount']);
  add('yield_unit',['หน่วย yield','หน่วยผลผลิต','yield unit']);
  add('serving_info',['การเสิร์ฟ','ข้อมูลการเสิร์ฟ','serving','serving info']);
  add('shelf_life',['อายุจัดเก็บ','อายุการจัดเก็บ','วันหมดอายุ','holding time','holding_time','shelf life','shelf_life']);
  add('storage_condition',['สถานที่จัดเก็บ','การจัดเก็บ','วิธีจัดเก็บ','เงื่อนไขการจัดเก็บ','storage','storage condition','storage_condition']);
  add('method',['วิธีทำ','วิธีผลิต','ขั้นตอน','ขั้นตอนการผลิต','กระบวนการผลิต','instructions','instruction','process','procedure']);
  add('notes',['หมายเหตุ','note','remark','remarks']);

  function normalizeProductionRowsV63(rows){
    return (Array.isArray(rows)?rows:[]).map(raw=>{
      const mapped={};
      Object.entries(raw||{}).forEach(([key,value])=>{
        const clean=text(key).replace(/^\uFEFF/,'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim();
        const canonical=aliases.get(normKey(clean))||clean;
        if(mapped[canonical]===undefined||mapped[canonical]==='')mapped[canonical]=text(value);
      });
      const out={};PROD_COLS.forEach(k=>out[k]=text(mapped[k]));
      return out;
    }).filter(r=>r.recipe_name_th||r.recipe_name_en);
  }

  function state(){try{return typeof appState!=='undefined'&&appState?appState:window.appState}catch(_){return window.appState}}
  function notify(msg,type='success'){try{if(typeof toast==='function')return toast(msg,type)}catch(_){}console.info('[KSL]',msg)}
  function markFresh(type,updatedAt){try{window.KSL_MARK_UPLOAD_FRESH?.(type,updatedAt)}catch(_){}}

  function refreshNow(){
    const names=['refreshAll','renderStats','populateFilters','renderTable','populateCalculator','renderFlashCards','renderCourses','renderCourseMenu','renderCourseDetail','renderManage','renderExpiryAudit','renderAnswerKey','updateStats'];
    const done=new Set();
    names.forEach(name=>{try{const fn=window[name];if(typeof fn==='function'&&!done.has(fn)){done.add(fn);fn()}}catch(err){console.debug('[KSL] refresh skipped',name,err)}});
  }

  async function postOnline(action,rows,updatedAt){
    const s=state();
    const payload={action,key:text(s?.settings?.syncKey),app:'KSL-V6.3',rows:clone(rows),updatedAt:String(updatedAt||new Date().toISOString())};
    const res=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),cache:'no-store'});
    let data=null;try{data=await res.json()}catch(_){}
    if(!res.ok||data?.ok===false)throw new Error(data?.error||('HTTP '+res.status));
    return data||{ok:true};
  }

  async function persistAndRender(type,rows,updatedAt){
    const s=state();if(!s)return;
    const safeRows=clone(rows);
    if(type==='holding'){
      s.data=safeRows;s.holdingTime=clone(safeRows);s.holdingData=clone(safeRows);s.updatedAt=updatedAt;
    }else if(type==='production'){
      s.productionData=safeRows;s.productionRecipes=clone(safeRows);s.production=clone(safeRows);s.recipesProduction=clone(safeRows);s.productionUpdatedAt=updatedAt;
      try{if(typeof productionData!=='undefined'&&Array.isArray(productionData))productionData.splice(0,productionData.length,...clone(safeRows))}catch(_){}
      try{if(typeof productionRecipes!=='undefined'&&Array.isArray(productionRecipes))productionRecipes.splice(0,productionRecipes.length,...clone(safeRows))}catch(_){}
      try{if(typeof PRODUCTION_DATA!=='undefined'&&Array.isArray(PRODUCTION_DATA))PRODUCTION_DATA.splice(0,PRODUCTION_DATA.length,...clone(safeRows))}catch(_){}
    }else{
      s.drinkData=safeRows;s.drinkRecipes=clone(safeRows);s.beverageRecipes=clone(safeRows);s.beverageData=clone(safeRows);s.drinks=clone(safeRows);s.drinkUpdatedAt=updatedAt;
      try{if(typeof drinkData!=='undefined'&&Array.isArray(drinkData))drinkData.splice(0,drinkData.length,...clone(safeRows))}catch(_){}
      try{if(typeof drinkRecipes!=='undefined'&&Array.isArray(drinkRecipes))drinkRecipes.splice(0,drinkRecipes.length,...clone(safeRows))}catch(_){}
      try{if(typeof DRINK_DATA!=='undefined'&&Array.isArray(DRINK_DATA))DRINK_DATA.splice(0,DRINK_DATA.length,...clone(safeRows))}catch(_){}
    }
    s.settings=s.settings||{};s.settings.gasUrl=API;
    markFresh(type,updatedAt);
    try{if(typeof dbSet==='function')await Promise.resolve(dbSet(s))}catch(err){console.warn('[KSL] local save failed',err)}
    refreshNow();setTimeout(refreshNow,80);setTimeout(refreshNow,300);setTimeout(refreshNow,900);
  }

  function installNormalizer(){
    try{window.normalizeProductionRows=normalizeProductionRowsV63}catch(_){}
    try{normalizeProductionRows=normalizeProductionRowsV63}catch(_){}
  }

  function wrapHolding(){
    const current=window.handleFiles;
    if(typeof current!=='function'||current.__kslUploadLiveV63)return false;
    const base=current;
    const wrapped=async function(fileList){
      const s=state(),oldSync=s?.settings?.syncEnabled;
      window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=true;
      try{
        if(s){s.settings=s.settings||{};s.settings.syncEnabled=false;}
        const result=await base.apply(this,arguments);
        const latest=state();const rows=clone(latest?.data);const updatedAt=latest?.updatedAt||new Date().toISOString();
        await persistAndRender('holding',rows,updatedAt);
        try{
          await postOnline('syncHoldingTime',rows,updatedAt);
          notify('Holding Time อัปเดตเป็นข้อมูลใหม่แล้ว '+rows.length+' แถว • Online Saved','success');
        }catch(err){
          console.warn('[KSL] holding online sync pending',err);
          notify('Holding Time แสดงข้อมูลใหม่แล้ว '+rows.length+' แถว • กำลังรอ Sync Online','warn');
        }
        return result;
      }finally{
        const latest=state();if(latest?.settings)latest.settings.syncEnabled=oldSync!==undefined?oldSync:true;
        window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=false;
        refreshNow();setTimeout(()=>window.KSL_SYNC_CENTRAL?.(true),1200);
      }
    };
    wrapped.__kslUploadLiveV63=1;wrapped.__kslOriginal=base;
    window.handleFiles=wrapped;try{handleFiles=wrapped}catch(_){}
    return true;
  }

  function wrapRecipes(){
    installNormalizer();
    const current=window.handleRecipeFiles;
    if(typeof current!=='function'||current.__kslUploadLiveV63)return false;
    const base=current;
    const wrapped=async function(mode,fileList){
      if(mode!=='production'&&mode!=='drink')return base.apply(this,arguments);
      const s=state(),oldSync=s?.settings?.syncEnabled;
      window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=true;
      try{
        if(s){s.settings=s.settings||{};s.settings.syncEnabled=false;}
        installNormalizer();
        const result=await base.apply(this,arguments);
        const latest=state();
        let rows=clone(mode==='production'?latest?.productionData:latest?.drinkData);
        if(mode==='production')rows=normalizeProductionRowsV63(rows);
        if(!rows.length)throw new Error(mode==='production'?'ไม่พบข้อมูลสูตรการผลิตหลัง Upload':'ไม่พบข้อมูลสูตรชงหลัง Upload');
        const updatedAt=(mode==='production'?latest?.productionUpdatedAt:latest?.drinkUpdatedAt)||new Date().toISOString();
        await persistAndRender(mode,rows,updatedAt);
        const action=mode==='production'?'syncProductionRecipes':'syncDrinkRecipes';
        try{
          await postOnline(action,rows,updatedAt);
          notify((mode==='production'?'สูตรการผลิต':'สูตรชงเครื่องดื่ม')+' อัปเดตเป็นข้อมูลใหม่แล้ว '+rows.length+' แถว • Online Saved','success');
        }catch(err){
          console.warn('[KSL] recipe online sync pending',err);
          notify((mode==='production'?'สูตรการผลิต':'สูตรชงเครื่องดื่ม')+' แสดงข้อมูลใหม่แล้ว '+rows.length+' แถว • กำลังรอ Sync Online','warn');
        }
        return result;
      }finally{
        const latest=state();if(latest?.settings)latest.settings.syncEnabled=oldSync!==undefined?oldSync:true;
        window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=false;
        refreshNow();setTimeout(()=>window.KSL_SYNC_CENTRAL?.(true),1200);
      }
    };
    wrapped.__kslUploadLiveV63=1;wrapped.__kslOriginal=base;
    window.handleRecipeFiles=wrapped;try{handleRecipeFiles=wrapped}catch(_){}
    return true;
  }

  function boot(){
    let tries=0;
    const tick=()=>{tries++;const a=wrapHolding(),b=wrapRecipes();if(a&&b)return;if(tries<100)setTimeout(tick,100)};
    tick();
  }
  window.addEventListener('ksl-central-synced',()=>setTimeout(()=>{wrapHolding();wrapRecipes();refreshNow()},80));
  boot();
  console.info('[KSL] V6.3 live upload refresh fix ready');
})();