/* KSL V6.3 — direct Production Recipe import + immediate menu refresh */
(()=>{
  'use strict';
  if(window.__KSL_UPLOAD_LIVE_FIX_V633__)return;
  window.__KSL_UPLOAD_LIVE_FIX_V633__=1;

  const API=window.__KSL_API_ENDPOINT__||'https://script.google.com/macros/s/AKfycbwtHxjbAvvxLPezMt6GljkyxxVdSPmaSfXSjL1UeoNOQWeUVNihygmsFPaAutfuN6JE/exec';
  const text=v=>String(v??'').trim();
  const clone=rows=>(Array.isArray(rows)?rows:[]).map(r=>r&&typeof r==='object'?{...r}:r);
  const PROD_COLS=['page','recipe_name_th','recipe_name_en','variant','ingredients','temperature_c','boil_time_min','soak_time_min','yield_amount','yield_unit','serving_info','shelf_life','storage_condition','method','notes'];
  const normKey=v=>text(v).replace(/^\uFEFF/,'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').replace(/[：:]+$/,'').trim().toLowerCase();

  const aliases=new Map();
  const add=(canonical,names)=>[canonical,...names].forEach(n=>aliases.set(normKey(n),canonical));
  add('page',['ลำดับ','ลําดับ','no','no.','number','#','หน้า','source page','source_page','page no','page_no']);
  add('recipe_name_th',['ชื่อไทย','ชื่อภาษาไทย','ชื่อสูตร','ชื่อเมนู','ชื่อสูตรการผลิต','สูตรการผลิต','ชื่อผลิตภัณฑ์','ชื่อสินค้า','ชื่อวัตถุดิบ','ชื่อรายการ','รายการ','recipe name th','recipe name thai','recipe_name','menu','menu th','menu_th','product','product name','product_name','product th','product_th','name th','name_th']);
  add('recipe_name_en',['ชื่ออังกฤษ','ชื่อภาษาอังกฤษ','ชื่อสูตรภาษาอังกฤษ','ชื่อเมนูภาษาอังกฤษ','recipe name en','recipe english','english name','name en','name_en','menu en','menu_en','product en','product_en']);
  add('variant',['สูตร','สูตรย่อย','รูปแบบ','ประเภทสูตร','variant','variant name','sub recipe','sub_recipe']);
  add('ingredients',['ส่วนผสม','วัตถุดิบในสูตร','รายการวัตถุดิบ','ingredient','ingredients','raw material','raw materials','materials']);
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

  function canonicalHeader(key){
    const k=normKey(key);
    if(aliases.has(k))return aliases.get(k);
    if(!k)return '';
    if(/^(ลำดับ|ลําดับ|no\.?|number|#)$/.test(k))return 'page';
    if((/อังกฤษ|english/.test(k)||/(^|\s|_)(en)(\s|_|$)/.test(k))&&/(ชื่อ|name|menu|product|recipe)/.test(k))return 'recipe_name_en';
    if((/ไทย|thai/.test(k)||/(^|\s|_)(th)(\s|_|$)/.test(k))&&/(ชื่อ|name|menu|product|recipe)/.test(k))return 'recipe_name_th';
    if(/ชื่อ/.test(k)&&/(สูตร|เมนู|ผลิตภัณฑ์|สินค้า|วัตถุดิบ|รายการ)/.test(k))return 'recipe_name_th';
    if(/recipe/.test(k)&&/name/.test(k)&&!/en|english/.test(k))return 'recipe_name_th';
    if(/ส่วนผสม|ingredient|raw material|materials/.test(k))return 'ingredients';
    if(/วิธีทำ|วิธีผลิต|ขั้นตอน|instructions|procedure|process/.test(k))return 'method';
    if(/อายุ.*จัดเก็บ|holding|shelf/.test(k))return 'shelf_life';
    if(/สถานที่.*จัดเก็บ|storage/.test(k))return 'storage_condition';
    if(/อุณหภูมิ|temperature/.test(k))return 'temperature_c';
    if(/หมายเหตุ|notes?|remarks?/.test(k))return 'notes';
    return '';
  }

  function normalizeObjectRow(raw){
    const mapped={};
    Object.entries(raw||{}).forEach(([key,value])=>{
      const clean=text(key).replace(/^\uFEFF/,'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim();
      const canonical=canonicalHeader(clean)||clean;
      if(mapped[canonical]===undefined||mapped[canonical]==='')mapped[canonical]=text(value);
    });
    const out={};PROD_COLS.forEach(k=>out[k]=text(mapped[k]));
    return out;
  }
  function normalizeProductionRowsV633(rows){
    return (Array.isArray(rows)?rows:[]).map(normalizeObjectRow).filter(r=>r.recipe_name_th||r.recipe_name_en);
  }

  function headerInfo(row){
    const fields=(Array.isArray(row)?row:[]).map(canonicalHeader);
    const recognized=fields.filter(Boolean);
    const strong=fields.some(x=>x==='recipe_name_th'||x==='recipe_name_en');
    return {fields,score:recognized.length+(strong?3:0),strong};
  }
  function matrixToProduction(matrix){
    const rows=(Array.isArray(matrix)?matrix:[]).map(r=>Array.isArray(r)?r.map(text):[]);
    if(!rows.length)return [];
    let best={idx:-1,score:0,fields:[],strong:false};
    for(let i=0;i<Math.min(rows.length,25);i++){
      const h=headerInfo(rows[i]);
      if(h.score>best.score)best={idx:i,...h};
    }
    if(best.idx>=0&&(best.strong||best.score>=3)){
      const headers=rows[best.idx];
      const objects=[];
      for(let r=best.idx+1;r<rows.length;r++){
        if(!rows[r].some(Boolean))continue;
        const obj={};
        headers.forEach((h,c)=>{const key=text(h)||('__COL_'+c);obj[key]=rows[r][c]??''});
        objects.push(obj);
      }
      const normalized=normalizeProductionRowsV633(objects);
      if(normalized.length)return normalized;
    }

    // Fallback for sheets whose header row is merged/unusual:
    // infer the early Thai-name and English-name columns from the data itself.
    const data=rows.filter(r=>r.some(Boolean));
    const width=Math.max(0,...data.map(r=>r.length));
    const sample=data.slice(0,60);
    const stats=Array.from({length:width},(_,col)=>{
      let non=0,num=0,thai=0,latin=0;
      sample.forEach(r=>{
        const v=text(r[col]);if(!v)return;non++;
        if(/^\d+(?:\.\d+)?$/.test(v))num++;
        if(/[ก-๙]/.test(v))thai++;
        if(/[A-Za-z]/.test(v))latin++;
      });
      return {col,non,num,thai,latin};
    }).filter(s=>s.non>=Math.min(2,Math.max(1,sample.length)));
    const seq=stats.slice().sort((a,b)=>(b.num/Math.max(1,b.non))-(a.num/Math.max(1,a.non))||a.col-b.col)[0]?.col ?? -1;
    const thai=stats.filter(s=>s.col!==seq&&s.thai>0).sort((a,b)=>(b.thai/Math.max(1,b.non))-(a.thai/Math.max(1,a.non))||a.col-b.col)[0]?.col ?? -1;
    const en=stats.filter(s=>s.col!==seq&&s.col!==thai&&s.latin>0).sort((a,b)=>(b.latin/Math.max(1,b.non))-(a.latin/Math.max(1,a.non))||a.col-b.col)[0]?.col ?? -1;
    if(thai<0&&en<0)return [];
    return data.map(r=>({
      page:seq>=0?text(r[seq]):'',
      recipe_name_th:thai>=0?text(r[thai]):'',
      recipe_name_en:en>=0?text(r[en]):'',
      variant:'',ingredients:'',temperature_c:'',boil_time_min:'',soak_time_min:'',
      yield_amount:'',yield_unit:'',serving_info:'',shelf_life:'',storage_condition:'',method:'',notes:''
    })).filter(r=>{
      const n=(r.recipe_name_th+' '+r.recipe_name_en).toLowerCase();
      if(!r.recipe_name_th&&!r.recipe_name_en)return false;
      if(/ชื่อ|name|recipe|menu|product|สูตรการผลิต/.test(n)&&!/เผือก|taro/.test(n))return false;
      return true;
    });
  }

  function parseDelimitedMatrix(source,delimiter){
    const out=[];let row=[],cell='',q=false;
    const s=String(source||'');
    for(let i=0;i<s.length;i++){
      const ch=s[i];
      if(q){
        if(ch==='"'&&s[i+1]==='"'){cell+='"';i++;}
        else if(ch==='"')q=false;
        else cell+=ch;
      }else{
        if(ch==='"')q=true;
        else if(ch===delimiter){row.push(cell);cell='';}
        else if(ch==='\n'){row.push(cell.replace(/\r$/,''));out.push(row);row=[];cell='';}
        else cell+=ch;
      }
    }
    if(cell||row.length){row.push(cell.replace(/\r$/,''));out.push(row)}
    return out;
  }
  function guessDelimiter(source){
    const first=String(source||'').split(/\r?\n/).find(x=>x.trim())||'';
    return [',','\t',';','|'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  }
  async function readProductionFile(file){
    const ext=(text(file?.name).split('.').pop()||'').toLowerCase();
    if(['xlsx','xls','ods'].includes(ext)){
      if(!window.XLSX)throw new Error('ตัวอ่าน Excel ยังโหลดไม่สำเร็จ');
      const buf=await file.arrayBuffer(),wb=XLSX.read(buf,{type:'array',cellDates:false});
      const all=[];
      wb.SheetNames.forEach(name=>{
        const ws=wb.Sheets[name];
        const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false,blankrows:false});
        all.push(...matrixToProduction(matrix));
      });
      return all;
    }
    if(['csv','tsv','txt'].includes(ext)){
      const src=await file.text(),delim=ext==='tsv'?'\t':guessDelimiter(src);
      return matrixToProduction(parseDelimitedMatrix(src,delim));
    }
    if(ext==='json'){
      const obj=JSON.parse(await file.text());
      const rows=Array.isArray(obj)?obj:(obj.data||obj.rows||[]);
      return normalizeProductionRowsV633(rows);
    }
    // Fall back to the app's parser for any future supported type.
    if(typeof window.parseRawFile==='function'){
      const raw=await window.parseRawFile(file);
      return normalizeProductionRowsV633(raw);
    }
    throw new Error('ชนิดไฟล์ไม่รองรับ');
  }

  function dedupeProduction(rows){
    const map=new Map();
    (rows||[]).forEach((r,i)=>{
      const name=text(r.recipe_name_th)||text(r.recipe_name_en);
      if(!name)return;
      const key=[name,text(r.variant),text(r.page)||String(i)].join('||').toLowerCase();
      map.set(key,{...r});
    });
    return [...map.values()];
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
    const s=state(),payload={action,key:text(s?.settings?.syncKey),app:'KSL-V6.3',rows:clone(rows),updatedAt:String(updatedAt||new Date().toISOString())};
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
    }
    s.settings=s.settings||{};s.settings.gasUrl=API;
    markFresh(type,updatedAt);
    try{if(typeof dbSet==='function')await Promise.resolve(dbSet(s))}catch(err){console.warn('[KSL] local save failed',err)}
    refreshNow();setTimeout(refreshNow,60);setTimeout(refreshNow,250);setTimeout(refreshNow,800);
  }

  function installNormalizer(){
    try{window.normalizeProductionRows=normalizeProductionRowsV633}catch(_){}
    try{normalizeProductionRows=normalizeProductionRowsV633}catch(_){}
  }

  function wrapHolding(){
    const current=window.handleFiles;
    if(typeof current!=='function'||current.__kslUploadLiveV633)return false;
    const base=current;
    const wrapped=async function(fileList){
      const s=state(),oldSync=s?.settings?.syncEnabled;window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=true;
      try{
        if(s){s.settings=s.settings||{};s.settings.syncEnabled=false;}
        const result=await base.apply(this,arguments);
        const latest=state(),rows=clone(latest?.data),updatedAt=latest?.updatedAt||new Date().toISOString();
        await persistAndRender('holding',rows,updatedAt);
        try{await postOnline('syncHoldingTime',rows,updatedAt);notify('Holding Time อัปเดตเป็นข้อมูลใหม่แล้ว '+rows.length+' แถว','success')}
        catch(err){console.warn(err);notify('Holding Time แสดงข้อมูลใหม่แล้ว • รอ Sync Online','warn')}
        return result;
      }finally{
        const latest=state();if(latest?.settings)latest.settings.syncEnabled=oldSync!==undefined?oldSync:true;
        window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=false;refreshNow();setTimeout(()=>window.KSL_SYNC_CENTRAL?.(true),1500);
      }
    };
    wrapped.__kslUploadLiveV633=1;window.handleFiles=wrapped;try{handleFiles=wrapped}catch(_){};return true;
  }

  function wrapRecipes(){
    installNormalizer();
    const current=window.handleRecipeFiles;
    if(typeof current!=='function'||current.__kslUploadLiveV633)return false;
    const base=current;
    const wrapped=async function(mode,fileList){
      if(mode!=='production'){
        // Keep the stable existing path for beverage recipes.
        return base.apply(this,arguments);
      }
      const files=[...fileList];if(!files.length)return;
      const s=state(),oldSync=s?.settings?.syncEnabled;
      const list=document.getElementById('productionUploadList');if(list)list.innerHTML='';
      window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=true;
      try{
        if(s){s.settings=s.settings||{};s.settings.syncEnabled=false;}
        let batch=[],success=0;
        for(const file of files){
          const line=document.createElement('div');line.className='file-row';
          line.innerHTML='<span>📄 '+text(file.name).replace(/[<>]/g,'')+'</span><span>กำลังอ่าน...</span>';
          if(list)list.appendChild(line);
          try{
            const rows=await readProductionFile(file);
            if(!rows.length)throw new Error('ไม่พบชื่อสูตร/ชื่อเมนูในไฟล์');
            batch.push(...rows);success++;
            const st=line.lastElementChild;if(st){st.className='file-ok';st.textContent='✓ '+rows.length+' แถว';}
            const latest=state();latest.recipeHistory=Array.isArray(latest.recipeHistory)?latest.recipeHistory:[];
            latest.recipeHistory.unshift({name:file.name,rows:rows.length,when:new Date().toISOString(),source:'Upload & Replace',dataType:'production'});
          }catch(err){
            const st=line.lastElementChild;if(st){st.className='file-bad';st.textContent='✕ '+text(err?.message||err);}
          }
        }
        if(!success)throw new Error('ยังไม่มีไฟล์สูตรการผลิตที่อ่านสำเร็จ');
        batch=dedupeProduction(batch);
        const updatedAt=new Date().toISOString(),latest=state();
        latest.recipeHistory=(latest.recipeHistory||[]).slice(0,40);
        await persistAndRender('production',batch,updatedAt);

        // Make sure the newly uploaded menus are actually present in the rendered source.
        const names=[...new Set(batch.map(r=>text(r.recipe_name_th)||text(r.recipe_name_en)).filter(Boolean))];
        try{
          if(typeof courseMode!=='undefined')courseMode='production';
          if(typeof courseCategory!=='undefined')courseCategory='';
          if(typeof courseMenu!=='undefined')courseMenu='';
          if(typeof courseVariant!=='undefined')courseVariant='';
        }catch(_){}
        refreshNow();

        try{
          await postOnline('syncProductionRecipes',batch,updatedAt);
          notify('สูตรการผลิตอัปเดตแล้ว '+names.length+' เมนู / '+batch.length+' แถว • แสดงรายการใหม่แล้ว','success');
        }catch(err){
          console.warn('[KSL] production online sync pending',err);
          notify('สูตรการผลิตแสดงรายการใหม่แล้ว '+names.length+' เมนู • รอ Sync Online','warn');
        }
        return true;
      }finally{
        const latest=state();if(latest?.settings)latest.settings.syncEnabled=oldSync!==undefined?oldSync:true;
        window.__KSL_TRAINING_UPLOAD_IN_PROGRESS__=false;
        const inp=document.getElementById('productionFileInput');if(inp)inp.value='';
        refreshNow();setTimeout(()=>window.KSL_SYNC_CENTRAL?.(true),1800);
      }
    };
    wrapped.__kslUploadLiveV633=1;wrapped.__kslOriginal=base;
    window.handleRecipeFiles=wrapped;try{handleRecipeFiles=wrapped}catch(_){};return true;
  }

  // Taro is a topping/dessert preparation in the production curriculum.
  try{
    const baseCategory=window.productionCategory;
    if(typeof baseCategory==='function'&&!baseCategory.__kslTaroV633){
      const cat=function(row){
        const n=(text(row?.recipe_name_th)+' '+text(row?.recipe_name_en)).toLowerCase();
        if(/เผือก|taro/.test(n))return '🧋 Topping / Dessert';
        return baseCategory(row);
      };
      cat.__kslTaroV633=1;window.productionCategory=cat;try{productionCategory=cat}catch(_){}
    }
  }catch(_){}

  function boot(){
    let tries=0;
    const tick=()=>{tries++;const a=wrapHolding(),b=wrapRecipes();if(a&&b)return;if(tries<120)setTimeout(tick,100)};
    tick();
  }
  window.addEventListener('ksl-central-synced',()=>setTimeout(()=>{wrapHolding();wrapRecipes();refreshNow()},80));
  boot();
  console.info('[KSL] V6.3.3 direct Production Recipe import ready');
})();