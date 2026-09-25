/* KSL V6.3 — reliable Production Recipe upload + immediate online/render refresh */
(()=>{
  'use strict';
  if(window.__KSL_PRODUCTION_UPLOAD_FIX_V63__)return;
  window.__KSL_PRODUCTION_UPLOAD_FIX_V63__=1;

  const API=window.__KSL_API_ENDPOINT__||'https://script.google.com/macros/s/AKfycbwtHxjbAvvxLPezMt6GljkyxxVdSPmaSfXSjL1UeoNOQWeUVNihygmsFPaAutfuN6JE/exec';
  const PROD_COLS=['page','recipe_name_th','recipe_name_en','variant','ingredients','temperature_c','boil_time_min','soak_time_min','yield_amount','yield_unit','serving_info','shelf_life','storage_condition','method','notes'];
  const text=v=>String(v??'').trim();
  const clone=rows=>(Array.isArray(rows)?rows:[]).map(r=>r&&typeof r==='object'?{...r}:r);
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
      const out={};
      PROD_COLS.forEach(k=>out[k]=text(mapped[k]));
      return out;
    }).filter(r=>r.recipe_name_th||r.recipe_name_en);
  }

  function installNormalizer(){
    try{window.normalizeProductionRows=normalizeProductionRowsV63}catch(_){}
    try{normalizeProductionRows=normalizeProductionRowsV63}catch(_){}
  }

  function state(){try{return typeof appState!=='undefined'&&appState?appState:window.appState}catch(_){return window.appState}}
  function setProductionAliases(rows){
    const s=state();if(!s)return;
    const names=['productionData','productionRecipes','production','recipesProduction'];
    names.forEach(k=>s[k]=clone(rows));
    try{if(typeof productionData!=='undefined'&&Array.isArray(productionData)){productionData.splice(0,productionData.length,...clone(rows))}}catch(_){}
    try{if(typeof productionRecipes!=='undefined'&&Array.isArray(productionRecipes)){productionRecipes.splice(0,productionRecipes.length,...clone(rows))}}catch(_){}
    try{if(typeof PRODUCTION_DATA!=='undefined'&&Array.isArray(PRODUCTION_DATA)){PRODUCTION_DATA.splice(0,PRODUCTION_DATA.length,...clone(rows))}}catch(_){}
  }
  async function pushProduction(rows,updatedAt){
    const s=state();
    const payload={action:'syncProductionRecipes',key:text(s?.settings?.syncKey),app:'KSL-V6.3',rows:clone(rows),updatedAt:updatedAt||new Date().toISOString()};
    const res=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),cache:'no-store'});
    let data=null;try{data=await res.json()}catch(_){}
    if(!res.ok||data?.ok===false)throw new Error(data?.error||('HTTP '+res.status));
    return data||{ok:true};
  }
  function refreshProduction(){
    const calls=['renderStats','renderCourses','renderCourseMenu','renderFlashCards','renderAnswerKey','renderManage','refreshAll'];
    const done=new Set();
    calls.forEach(name=>{try{const fn=window[name];if(typeof fn==='function'&&!done.has(fn)){done.add(fn);fn()}}catch(err){console.debug('[KSL] production refresh skipped',name,err)}});
  }
  function notify(msg,type='success'){try{if(typeof toast==='function')return toast(msg,type)}catch(_){}console.info('[KSL]',msg)}

  let baseHandle=null;
  function installHandler(){
    installNormalizer();
    const current=window.handleRecipeFiles;
    if(typeof current!=='function')return false;
    if(current.__kslProductionUploadV63)return true;
    baseHandle=current;
    const wrapped=async function(mode,fileList){
      if(mode!=='production')return baseHandle.apply(this,arguments);
      const s=state();
      window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=true;
      const oldSyncEnabled=s?.settings?.syncEnabled;
      try{
        // Prevent the legacy fire-and-forget sync. This wrapper performs one awaited central write.
        if(s){s.settings=s.settings||{};s.settings.syncEnabled=false;}
        installNormalizer();
        const result=await baseHandle.apply(this,arguments);
        const latest=state();
        let rows=clone(latest?.productionData);
        if(!rows.length)throw new Error('ไม่พบข้อมูลสูตรการผลิตหลัง Upload');
        rows=normalizeProductionRowsV63(rows);
        if(!rows.length)throw new Error('ไม่พบชื่อสูตรการผลิตในไฟล์ กรุณาตรวจสอบหัวคอลัมน์');
        const updatedAt=latest.productionUpdatedAt||new Date().toISOString();
        setProductionAliases(rows);
        latest.productionUpdatedAt=updatedAt;
        latest.settings=latest.settings||{};
        latest.settings.syncEnabled=true;
        latest.settings.gasUrl=API;
        try{if(typeof dbSet==='function')await Promise.resolve(dbSet(latest))}catch(err){console.warn('[KSL] local production save failed',err)}
        await pushProduction(rows,updatedAt);
        refreshProduction();
        setTimeout(refreshProduction,120);
        setTimeout(refreshProduction,550);
        notify('สูตรการผลิตอัปเดตแล้ว '+rows.length+' แถว • บันทึก Online และแสดงผลล่าสุดแล้ว','success');
        return result;
      }catch(err){
        console.error('[KSL] production upload finalization failed',err);
        const now=state();if(now?.settings)now.settings.syncEnabled=oldSyncEnabled!==undefined?oldSyncEnabled:true;
        notify('Upload สูตรการผลิตยังไม่สมบูรณ์: '+text(err?.message||err),'error');
        throw err;
      }finally{
        window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=false;
        setTimeout(()=>{try{window.KSL_SYNC_CENTRAL?.(true)}catch(_){}},450);
      }
    };
    wrapped.__kslProductionUploadV63=1;
    wrapped.__kslOriginal=current;
    window.handleRecipeFiles=wrapped;
    try{handleRecipeFiles=wrapped}catch(_){}
    return true;
  }

  function boot(){
    let tries=0;
    const tick=()=>{tries++;if(installHandler())return;if(tries<80)setTimeout(tick,100)};
    tick();
  }
  window.addEventListener('ksl-central-synced',()=>setTimeout(()=>{installHandler();refreshProduction()},80));
  boot();
  console.info('[KSL] V6.3 Production Recipe upload fix ready');
})();
