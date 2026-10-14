/* Version 3.28 — Dual Usage Source + WIP Conversion + Manual Cal + Daily Usage Planning */
(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-api';
  const ROLE=()=>localStorage.getItem('kamuInvCloudRole')||'';
  const TOKEN=()=>localStorage.getItem('kamuInvCloudToken')||'';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0};
  const fmt=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('th-TH',{maximumFractionDigits:3}):'—';

  if(!Array.isArray(S.wipConversion))S.wipConversion=[];
  if(!Array.isArray(S.reorderSettings))S.reorderSettings=[];

  async function cloudApi(action,data={}){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',...(TOKEN()?{'Authorization':'Bearer '+TOKEN()}:{})},body:JSON.stringify({action,...data})});
    let out={};try{out=await r.json()}catch{}
    if(!r.ok||out.ok===false)throw Error(out.message||out.error||`HTTP ${r.status}`);
    return out;
  }

  function sourceCode(v){
    const x=T(v).toLowerCase().replace(/[\s_-]+/g,'');
    if(x==='stock'||x==='stockmovement'||x==='movement')return'stock';
    if(x==='itemsale'||x==='sale'||x==='sales')return'item_sale';
    if(x==='manual'||x==='manualcal'||x==='manualcalculation')return'manual_cal';
    return x==='bom'||x==='bomb'?'bom':'';
  }
  function sourceLabel(v){
    const x=sourceCode(v);
    return x==='bom'?'BOM':x==='stock'?'Stock Movement':x==='item_sale'?'Item Sale':x==='manual_cal'?'Manual Cal':'ยังไม่กำหนด';
  }
  function sourceOptions(current,second=false){
    const first=second?'<option value="">-- ไม่ใช้ Source 2 --</option>':'<option value="">-- ยังไม่กำหนด --</option>';
    return first+
      `<option value="bom" ${current==='bom'?'selected':''}>BOM</option>`+
      `<option value="stock" ${current==='stock'?'selected':''}>Stock Movement</option>`+
      `<option value="item_sale" ${current==='item_sale'?'selected':''}>Item Sale</option>`+
      `<option value="manual_cal" ${current==='manual_cal'?'selected':''}>Manual Cal</option>`;
  }
  function dualSettingsMap(){
    const m=new Map();
    for(const x of Array.isArray(S.usageSource)?S.usageSource:[]){
      const rm=T(x.rm_code).toUpperCase();if(!rm)continue;
      m.set(rm,{
        rm_code:rm,
        source1:sourceCode(x.source_1||x.source),
        source2:sourceCode(x.source_2),
        cup1:T(x.cup_size_1||x.cup_size).toUpperCase(),
        cup2:T(x.cup_size_2).toUpperCase()
      });
    }
    return m;
  }

  function yieldOverrides(){
    const m=new Map();
    for(const x of S.wipConversion||[]){
      const code=T(x.wip_code).toUpperCase(),y=num(x.yield_qty);
      if(code&&y>0)m.set(code,y);
    }
    return m;
  }
  function wipGroups(){
    const by=new Map();
    for(const r of Array.isArray(S.wip)?S.wip:[]){
      const code=T(V(r,'wipc')).toUpperCase();
      if(!/^WP/i.test(code))continue;
      if(!by.has(code))by.set(code,[]);
      by.get(code).push(r);
    }
    return by;
  }
  function stockRmInfo(branch,rm){
    const rows=IDX.stockByBranch.get(branch)||[];
    const r=rows.find(x=>T(V(x,'rm')).toUpperCase()===rm.toUpperCase());
    return r?{desc:T(V(r,'rmd')),unit:T(V(r,'stocku')),cost:num(V(r,'cost'))}:{desc:'',unit:'',cost:0};
  }

  function manualCal(branch){
    const groups=wipGroups(),overrides=yieldOverrides(),wpSales=new Map(),errors=[],byRm=new Map(),wipDetails=[];
    for(const r of IDX.stockByBranch.get(branch)||[]){
      const code=T(V(r,'rm')).toUpperCase();
      if(!/^WP/i.test(code))continue;
      wpSales.set(code,(wpSales.get(code)||0)+num(V(r,'sales')));
    }
    for(const [wp,sales] of wpSales){
      if(!sales)continue;
      const rows=groups.get(wp)||[];
      if(!rows.length){errors.push({type:'WP without WIP Master',code:wp,note:'ไม่พบใน Bomb Sheet Wip'});continue}
      const fileYield=num(V(rows[0],'fgq')),yieldQty=overrides.get(wp)||fileYield;
      if(!(yieldQty>0)){errors.push({type:'Missing Yield',code:wp,note:'กรุณากำหนดผลผลิตใน WIP Conversion Master'});continue}
      const batches=sales/yieldQty;
      if(!rows.length){errors.push({type:'WP without ingredients',code:wp,note:'ไม่พบวัตถุดิบ'});continue}
      for(const row of rows){
        const rm=T(V(row,'rmitem')).toUpperCase(),rmQty=num(V(row,'rmq')),rmUnit=T(V(row,'rmu'));
        if(!rm||!rmQty)continue;
        const raw=batches*rmQty,info=stockRmInfo(branch,rm);
        let factor=1,status='OK';
        if(K(rmUnit)!==K(info.unit)){
          factor=convFactor(rm,rmUnit,info.unit,info.desc);
          if(!(factor>0)){status='Needs conversion';factor=0;errors.push({type:'Manual Cal needs conversion',code:rm,note:`${rmUnit||'-'} → ${info.unit||'-'} • ${wp}`})}
        }
        const converted=factor>0?raw/factor:null;
        const detail={wp,sales,yieldQty,batches,rm,rmQty,rmUnit,raw,factor,stockUnit:info.unit,converted,status};
        wipDetails.push(detail);
        if(!byRm.has(rm))byRm.set(rm,{rm,desc:info.desc,unit:info.unit,total:0,status:'OK',sources:[],details:[]});
        const agg=byRm.get(rm);agg.sources.push(wp);agg.details.push(detail);
        if(converted!=null)agg.total+=converted;else agg.status='Needs conversion';
      }
    }
    for(const x of byRm.values())x.sources=[...new Set(x.sources)];
    return {wpSales,byRm,errors,wipDetails};
  }
  window.kamuManualCal=manualCal;

  function calcDualAnalysis(){
    const b=$('#branch')?.value||'',d=$('#date')?.value||'';
    if(!b){S.analysis=[];S.needs=[];S.currentExpected=new Map();render();renderRMFilter();return}
    setCalcStatus('กำลังคำนวณ...');
    requestAnimationFrame(()=>{
      const exp=expected(b,d),mov=IDX.stockByBranch.get(b)||[],out=[],needs=[],groups=new Map(),
            usageSettings=dualSettingsMap(),itemUsage=itemSaleUsage(b,d),manual=manualCal(b);
      for(const r of mov){const rm=T(V(r,'rm'));if(!rm)continue;if(!groups.has(rm))groups.set(rm,[]);groups.get(rm).push(r)}
      for(const [rm,rs] of groups){
        const r=rs[0],sum=n=>rs.reduce((z,x)=>z+num(V(x,n)),0),firstText=n=>{for(const x of rs){const v=T(V(x,n));if(v)return v}return''};
        const desc=firstText('rmd'),su=firstText('stocku'),stockuc=firstText('stockuc'),units=exp.get(rm),bomUnits=units?[...units.entries()]:[];
        let bomConverted=0,missing=[];
        for(const [bu,q] of bomUnits){
          const fac=convFactor(rm,bu,su,desc)||convFactor(rm,bu,stockuc,desc);
          if(!fac){missing.push({rm,bu,su,desc,raw:q});needs.push({rm,bu,su,desc,raw:q})}
          else bomConverted+=q/fac;
        }
        const need=missing.length>0,hasBom=bomUnits.length>0,bom=hasBom&&!need?bomConverted:null,bomRaw=rawBomText(bomUnits);
        const bf=sum('bf'),gr=sum('gr'),tin=sum('tin'),wipin=sum('wipin'),adjin=sum('adjin'),rtv=sum('rtv'),tout=sum('tout'),wipout=sum('wipout'),damage=sum('damage'),adjout=sum('adjout'),movSales=sum('sales'),waste=sum('waste'),reportTheory=sum('theory'),reportActual=sum('actual');
        const cfg=usageSettings.get(T(rm).toUpperCase())||{source1:'',source2:'',cup1:'',cup2:''};
        const mappedItemUsage=itemUsage.byRm.get(T(rm).toUpperCase());
        const manualRow=manual.byRm.get(T(rm).toUpperCase());

        function sourceValue(source,cup){
          if(!source)return{value:0,setup:false,needConv:false};
          if(source==='stock')return{value:movSales,setup:false,needConv:false};
          if(source==='bom')return{value:bom,setup:false,needConv:need||bom===null};
          if(source==='manual_cal')return{value:manualRow?.status==='Needs conversion'?null:(manualRow?.total||0),setup:false,needConv:manualRow?.status==='Needs conversion'};
          if(source==='item_sale'){
            if(mappedItemUsage!==undefined)return{value:mappedItemUsage,setup:false,needConv:false};
            if(cup)return{value:itemUsage.bySize.get(cup)||0,setup:false,needConv:false};
            return{value:null,setup:true,needConv:false};
          }
          return{value:null,setup:true,needConv:false};
        }

        const one=sourceValue(cfg.source1,cfg.cup1),two=sourceValue(cfg.source2,cfg.cup2);
        const duplicate=!!cfg.source1&&cfg.source1===cfg.source2;
        if(duplicate){two.value=0;two.setup=true}
        const usageSetupNeeded=!cfg.source1||one.setup||two.setup;
        const usageNeedConversion=one.needConv||two.needConv;
        const usageTotal=usageSetupNeeded||usageNeedConversion||one.value==null||two.value==null?null:num(one.value)+num(two.value);
        const calc=usageTotal==null?null:bf+gr+tin+wipin+adjin-rtv-tout-wipout-damage-adjout-usageTotal-waste;
        const cv=localStorage.getItem(countsKey(b,rm)),count=cv===null?null:Number(cv),diff=count===null||calc===null?null:count-calc,
              status=usageSetupNeeded?'Needs usage setup':usageNeedConversion?'Needs conversion':count===null?'Not counted':Math.abs(diff)<0.0005?'OK':diff<0?'Short':'Over';
        const cost=rs.map(x=>num(V(x,'cost'))).find(v=>v!==0)||num(V(r,'cost'));
        out.push({
          rm,desc,unit:su,bf,gr,tin,wipin,adjin,rtv,tout,wipout,damage,adjout,bom,bomRaw,hasBom,missingConv:missing.length,
          mov:movSales,uv:bom===null?null:movSales-bom,waste,calc,reportTheory,reportActual,count,diff,
          diffp:diff===null||calc===null||Math.abs(calc)<1e-9?null:diff/calc*100,cost,vc:diff===null?0:diff*cost,status,sourceRows:rs.length,
          usageSource:cfg.source1?sourceLabel(cfg.source1)+(cfg.source2?' + '+sourceLabel(cfg.source2):''):'ยังไม่กำหนด',
          usageCupSize:cfg.cup1,usageValue:usageTotal,usageSetupNeeded,
          usageSource1:sourceLabel(cfg.source1),usageCode1:cfg.source1,usageCupSize1:cfg.cup1,usageValue1:one.value,
          usageSource2:cfg.source2?sourceLabel(cfg.source2):'',usageCode2:cfg.source2,usageCupSize2:cfg.cup2,usageValue2:cfg.source2?two.value:0,
          usageTotal,manualUsage:manualRow?.total||0
        });
      }
      S.analysis=out;S.needs=needs;S.currentExpected=exp;S.manualCal=manual;
      syncActiveCustomCheck(out);renderRMFilter(true);render();recon();renderCustomChecks();setCalcStatus(`พร้อม • ${out.length.toLocaleString()} RM`);
      renderManualPage();renderPlanningPage();
    });
  }
  compute=calcDualAnalysis;

  let usageSaveTimer=0,usageSaving=false;
  function cupSizes(){return[...new Set((S.cupMapping||[]).filter(x=>x.count_as_cup!==false&&T(x.cup_size)).map(x=>T(x.cup_size).toUpperCase()))].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}))}
  function cupSelect(rm,value,source,slot){
    if(source!=='item_sale')return'';
    const sizes=cupSizes();
    return `<select class="dual-usage-cup" data-rm="${esc(rm)}" data-slot="${slot}"><option value="">-- รหัสแก้ว --</option>${sizes.map(s=>`<option value="${esc(s)}" ${value===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  }
  function usageEditor(rm,cfg,slot){
    const src=slot===1?cfg.source1:cfg.source2,cup=slot===1?cfg.cup1:cfg.cup2;
    return `<select class="dual-usage-source" data-rm="${esc(rm)}" data-slot="${slot}">${sourceOptions(src,slot===2)}</select>${cupSelect(rm,cup,src,slot)}`;
  }
  function ensureUsageSaveState(){
    if($('#dualUsageSaveState'))return;
    const card=$('#tbl')?.closest('.card'),actions=card?.querySelector('.section-head>div:last-child');if(!actions)return;
    const st=document.createElement('span');st.id='dualUsageSaveState';st.className='dual-usage-state saved';st.textContent='Usage Source 1+2 • Auto Save';actions.prepend(st);
  }
  function setUsageState(t,c){const e=$('#dualUsageSaveState');if(e){e.textContent=t;e.className='dual-usage-state '+c}}
  async function saveUsageMaster(){
    if(ROLE()!=='admin'||usageSaving)return;
    usageSaving=true;setUsageState('กำลังบันทึก Usage Source...','saving');
    try{await cloudApi('admin_save_master',{dataset_type:'usage_source',payload:S.usageSource||[],metadata:{file_name:'RM Usage Source 1+2',rows:(S.usageSource||[]).length,source:'inventory_audit_v328'},silent:true});setUsageState('บันทึก Usage Source แล้ว','saved')}
    catch(e){setUsageState('บันทึกไม่สำเร็จ','error');console.warn(e)}
    finally{usageSaving=false}
  }
  function scheduleUsageSave(){clearTimeout(usageSaveTimer);setUsageState('รอบันทึกอัตโนมัติ...','saving');usageSaveTimer=setTimeout(saveUsageMaster,500)}
  function updateUsageCfg(rm,slot,source,cup){
    const map=dualSettingsMap(),old=map.get(rm)||{rm_code:rm,source1:'',source2:'',cup1:'',cup2:''};
    if(slot===1){old.source1=source;old.cup1=source==='item_sale'?cup:''}
    else{old.source2=source;old.cup2=source==='item_sale'?cup:''}
    if(old.source1&&old.source2&&old.source1===old.source2){alert('Usage Source 1 และ Usage Source 2 ห้ามเลือกซ้ำกัน');return false}
    const raw=new Map();
    for(const x of S.usageSource||[])raw.set(T(x.rm_code).toUpperCase(),x);
    if(!old.source1&&!old.source2)raw.delete(rm);
    else raw.set(rm,{rm_code:rm,source:old.source1,source_1:old.source1,source_2:old.source2,cup_size:old.cup1,cup_size_1:old.cup1,cup_size_2:old.cup2});
    S.usageSource=[...raw.values()];
    scheduleUsageSave();compute();return true;
  }

  const renderBase=render;
  render=function(){
    renderBase();
    enhanceDualUsageTable();
    renderPlanningPage();
  };
  function enhanceDualUsageTable(){
    const table=$('#tbl');if(!table)return;
    let hs=[...table.querySelectorAll('thead th')],sidx=hs.findIndex(x=>T(x.textContent)==='Usage Source'),uidx=hs.findIndex(x=>T(x.textContent)==='Usage');
    if(sidx<0){sidx=hs.findIndex(x=>T(x.textContent)==='Usage Source 1')}
    if(uidx<0){uidx=hs.findIndex(x=>T(x.textContent)==='Usage 1')}
    if(sidx<0||uidx<0)return;
    hs[sidx].textContent='Usage Source 1';hs[uidx].textContent='Usage 1';
    const trh=table.querySelector('thead tr');
    const h2=document.createElement('th');h2.textContent='Usage Source 2';
    const h3=document.createElement('th');h3.textContent='Usage 2';
    const h4=document.createElement('th');h4.textContent='Usage Total';
    trh.insertBefore(h2,hs[uidx].nextSibling);trh.insertBefore(h3,h2.nextSibling);trh.insertBefore(h4,h3.nextSibling);
    const map=dualSettingsMap();
    for(const tr of table.querySelectorAll('tbody tr')){
      const rm=T(tr.cells[0]?.textContent).toUpperCase(),x=S.analysis.find(a=>T(a.rm).toUpperCase()===rm),cfg=map.get(rm)||{source1:'',source2:'',cup1:'',cup2:''};
      if(!x)continue;
      const sc=tr.cells[sidx],uc=tr.cells[uidx];
      if(ROLE()==='admin'){ensureUsageSaveState();sc.className='dual-usage-editor';sc.innerHTML=usageEditor(rm,cfg,1)}
      else sc.innerHTML=`<span class="usage-source-tag">${esc(x.usageSource1||'ยังไม่กำหนด')}${x.usageCupSize1?' ('+esc(x.usageCupSize1)+')':''}</span>`;
      uc.className='num';uc.innerHTML=x.usageValue1==null?'—':`<b>${fmt(x.usageValue1)}</b>`;
      const c2=document.createElement('td'),u2=document.createElement('td'),tot=document.createElement('td');
      if(ROLE()==='admin'){c2.className='dual-usage-editor';c2.innerHTML=usageEditor(rm,cfg,2)}
      else c2.innerHTML=x.usageSource2?`<span class="usage-source-tag">${esc(x.usageSource2)}${x.usageCupSize2?' ('+esc(x.usageCupSize2)+')':''}</span>`:'—';
      u2.className='num';u2.innerHTML=x.usageCode2?(x.usageValue2==null?'—':fmt(x.usageValue2)):'—';
      tot.className='num dual-total';tot.innerHTML=x.usageTotal==null?'—':`<b>${fmt(x.usageTotal)}</b>`;
      tr.insertBefore(c2,uc.nextSibling);tr.insertBefore(u2,c2.nextSibling);tr.insertBefore(tot,u2.nextSibling);
    }
  }
  $('#tbl')?.addEventListener('change',e=>{
    const t=e.target;if(ROLE()!=='admin')return;
    if(t.classList.contains('dual-usage-source')){
      const rm=T(t.dataset.rm).toUpperCase(),slot=Number(t.dataset.slot),source=sourceCode(t.value),tr=t.closest('tr');
      const cup=T(tr?.querySelector(`.dual-usage-cup[data-slot="${slot}"]`)?.value).toUpperCase();
      updateUsageCfg(rm,slot,source,cup);
    }else if(t.classList.contains('dual-usage-cup')){
      const rm=T(t.dataset.rm).toUpperCase(),slot=Number(t.dataset.slot),tr=t.closest('tr');
      const source=sourceCode(tr?.querySelector(`.dual-usage-source[data-slot="${slot}"]`)?.value);
      updateUsageCfg(rm,slot,source,T(t.value).toUpperCase());
    }
  });

  async function loadPlanningData(){
    if(!TOKEN())return;
    try{
      const x=await cloudApi('load_planning');
      S.wipConversion=Array.isArray(x.wip_conversion)?x.wip_conversion:[];
      S.reorderSettings=Array.isArray(x.reorder_settings)?x.reorder_settings:[];
      ensureExtraPages();renderWipMaster();renderManualPage();renderPlanningPage();compute();
    }catch(e){console.warn('Planning data load',e)}
  }
  async function saveWipMaster(){
    if(ROLE()!=='admin')return;
    const b=$('#wipSaveState');if(b){b.textContent='กำลังบันทึก...';b.className='planning-state saving'}
    try{
      await cloudApi('admin_save_master',{dataset_type:'wip_conversion',payload:S.wipConversion,metadata:{file_name:'WIP Conversion Master',rows:S.wipConversion.length,updated_by:'admin'},silent:true});
      if(b){b.textContent='บันทึกแล้ว';b.className='planning-state saved'}
      compute();
    }catch(e){if(b){b.textContent='บันทึกไม่สำเร็จ';b.className='planning-state error'}alert('บันทึก WIP Conversion ไม่สำเร็จ: '+e.message)}
  }
  function setYield(code,value){
    code=T(code).toUpperCase();const y=num(value),m=new Map((S.wipConversion||[]).map(x=>[T(x.wip_code).toUpperCase(),x]));
    if(y>0)m.set(code,{wip_code:code,yield_qty:y,updated_at:new Date().toISOString()});else m.delete(code);
    S.wipConversion=[...m.values()].sort((a,b)=>a.wip_code.localeCompare(b.wip_code,'en',{numeric:true}));
    saveWipMaster();renderWipMaster();
  }

  function ensureExtraPages(){
    const tabs=$('.tabs'),main=document.querySelector('main');if(!tabs||!main)return;
    if(!$('.tab[data-p="wipmaster"]')){
      const t=document.createElement('button');t.className='tab';t.dataset.p='wipmaster';t.innerHTML='<span>🏭</span> WIP Conversion Master';tabs.appendChild(t);
      const s=document.createElement('section');s.id='wipmaster';s.className='page';s.innerHTML=`
        <div class="card"><div class="section-head"><div class="section-title"><div class="icon">🏭</div><div><h3>WIP Conversion Master</h3><div class="subtle">รหัส WP จาก Bomb Sheet Wip • กำหนดผลผลิตสำหรับ Manual Cal</div></div></div><span id="wipSaveState" class="planning-state saved">พร้อม</span></div>
        <div class="planning-toolbar"><input id="wipSearch" placeholder="ค้นหา WP Code / วัตถุดิบ"><span id="wipCount" class="subtle"></span></div></div>
        <div class="card"><div id="wipMasterList" class="wip-master-list"></div></div>`;
      main.appendChild(s);t.onclick=()=>activatePage('wipmaster');$('#wipSearch').oninput=renderWipMaster;
    }
    if(!$('.tab[data-p="manualcal"]')){
      const t=document.createElement('button');t.className='tab';t.dataset.p='manualcal';t.innerHTML='<span>🧮</span> Manual Cal';tabs.appendChild(t);
      const s=document.createElement('section');s.id='manualcal';s.className='page';s.innerHTML=`
        <div class="card"><div class="section-head"><div class="section-title"><div class="icon">🧮</div><div><h3>Manual Cal • WIP Usage</h3><div class="subtle">WP Sales Usage ÷ ผลผลิต × วัตถุดิบ ÷ Unit Conversion</div></div></div></div>
        <div class="planning-toolbar"><label>สาขา <select id="manualBranch"></select></label><button class="btn" id="manualRefresh">🔄 คำนวณใหม่</button></div></div>
        <div id="manualKpi" class="planning-kpis"></div>
        <div class="card"><div id="manualErrors"></div><div class="tablewrap"><table id="manualTbl"><thead><tr><th>RM</th><th>Description</th><th>Unit</th><th>WP Source</th><th>รายละเอียดสูตร</th><th>Total Manual Usage</th><th>Status</th></tr></thead><tbody></tbody></table></div></div>`;
      main.appendChild(s);t.onclick=()=>activatePage('manualcal');$('#manualBranch').onchange=renderManualPage;$('#manualRefresh').onclick=renderManualPage;
    }
    if(ROLE()==='user'&&!$('.tab[data-p="planning"]')){
      const t=document.createElement('button');t.className='tab';t.dataset.p='planning';t.innerHTML='<span>📦</span> Daily Usage & Plan';tabs.appendChild(t);
      const s=document.createElement('section');s.id='planning';s.className='page';s.innerHTML=`
        <div class="card"><div class="section-head"><div class="section-title"><div class="icon">📦</div><div><h3>Daily Usage & Order Planning</h3><div class="subtle">คำนวณยอดใช้รายวัน • รอบรอส่งสินค้า • Stock Cover • Plan สั่งสินค้า</div></div></div><div style="display:flex;gap:8px"><button class="btn" id="planExcel">📗 Excel</button><button class="btn" id="planPdf">📄 PDF</button></div></div>
        <div class="planning-toolbar"><label>สาขา <select id="planBranch"></select></label><label>Lead Time ทุกสินค้า <input id="planAllDays" type="number" min="0" max="365" value="0"></label><button class="btn alt" id="applyPlanAll">ใช้กับทุกรายการ</button><span id="planDaysInfo" class="subtle"></span></div></div>
        <div id="planKpi" class="planning-kpis"></div>
        <div class="card"><div class="tablewrap"><table id="planTbl"><thead><tr><th>RM</th><th>Description</th><th>Unit</th><th>Current Stock</th><th>Usage Total</th><th>Usage Days</th><th>Daily Usage</th><th>Lead Time Days</th><th>Required Qty</th><th>Plan Order Qty</th><th>Stock Cover Days</th><th>ใช้ได้ถึงวันที่</th><th>Status</th></tr></thead><tbody></tbody></table></div></div>`;
      main.appendChild(s);t.onclick=()=>{activatePage('planning');syncPlanningBranch(true)};$('#planBranch').onchange=()=>syncPlanningBranch(true);$('#applyPlanAll').onclick=applyLeadAll;$('#planExcel').onclick=exportPlanningExcel;$('#planPdf').onclick=exportPlanningPdf;
    }
    renderBranchSelectors();
  }
  function activatePage(id){
    $$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.p===id));
    $$('.page').forEach(x=>x.classList.toggle('active',x.id===id));
    if(id==='wipmaster')renderWipMaster();
    if(id==='manualcal')renderManualPage();
    if(id==='planning')renderPlanningPage();
  }
  function renderBranchSelectors(){
    const opts=(typeof branchMaster==='function'?branchMaster():[]).map(x=>`<option value="${esc(x.code)}">${esc(x.code+(x.name?' - '+x.name:''))}</option>`).join('');
    for(const id of ['manualBranch','planBranch']){
      const e=$('#'+id);if(!e)continue;const keep=e.value||$('#branch')?.value||'';e.innerHTML=opts;if(keep&&[...e.options].some(o=>o.value===keep))e.value=keep;
    }
  }

  function renderWipMaster(){
    const box=$('#wipMasterList');if(!box)return;
    const q=K($('#wipSearch')?.value||''),groups=wipGroups(),overrides=yieldOverrides(),list=[...groups.entries()].filter(([code,rows])=>!q||K(code+' '+rows.map(r=>T(V(r,'rmitem'))+' '+T(V(r,'rmd'))).join(' ')).includes(q));
    $('#wipCount').textContent=`${list.length.toLocaleString('th-TH')} WP`;
    box.innerHTML=list.length?list.map(([code,rows])=>{
      const fileYield=num(V(rows[0],'fgq')),override=overrides.get(code),used=override||fileYield;
      return `<div class="wip-card"><div class="wip-head"><div><b>${esc(code)}</b><small>${rows.length} วัตถุดิบ</small></div><div class="wip-yield"><label>ผลผลิตจากไฟล์<input value="${fileYield||''}" disabled></label><label>ผลผลิตที่ใช้<input class="wip-yield-input" data-code="${esc(code)}" type="number" min="0" step="any" value="${override||''}" placeholder="${fileYield||'กรอกผลผลิต'}" ${ROLE()==='admin'?'':'disabled'}></label>${ROLE()==='admin'?`<button class="btn alt small wip-clear" data-code="${esc(code)}">ล้างค่ากำหนดเอง</button>`:''}<span class="wip-used">ใช้ ${fmt(used)}</span></div></div>
      <div class="tablewrap"><table><thead><tr><th>RM Code</th><th>Qty / สูตร</th><th>Unit</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(T(V(r,'rmitem')))}</b></td><td class="num">${fmt(num(V(r,'rmq')))}</td><td>${esc(T(V(r,'rmu')))}</td></tr>`).join('')}</tbody></table></div></div>`;
    }).join(''):'<div class="planning-empty">ไม่พบรหัส WP ใน Bomb Sheet Wip</div>';
    box.querySelectorAll('.wip-yield-input').forEach(i=>i.onchange=()=>setYield(i.dataset.code,i.value));
    box.querySelectorAll('.wip-clear').forEach(b=>b.onclick=()=>setYield(b.dataset.code,0));
  }

  function renderManualPage(){
    const body=$('#manualTbl tbody');if(!body)return;
    renderBranchSelectors();const branch=$('#manualBranch')?.value||$('#branch')?.value||'';if(!branch){body.innerHTML='';return}
    const m=manualCal(branch),rows=[...m.byRm.values()].sort((a,b)=>a.rm.localeCompare(b.rm,'en',{numeric:true}));
    body.innerHTML=rows.map(x=>`<tr><td><b>${esc(x.rm)}</b></td><td>${esc(x.desc)}</td><td>${esc(x.unit)}</td><td>${x.sources.map(esc).join(', ')}</td><td>${x.details.map(d=>`${esc(d.wp)}: Sales ${fmt(d.sales)} ÷ Yield ${fmt(d.yieldQty)} = ${fmt(d.batches)} สูตร × ${fmt(d.rmQty)} ${esc(d.rmUnit)}${d.factor?` ÷ ${fmt(d.factor)}`:''}`).join('<br>')}</td><td class="num"><b>${fmt(x.total)}</b></td><td class="${x.status==='OK'?'ok':'warn'}">${esc(x.status)}</td></tr>`).join('');
    const missingYield=m.errors.filter(x=>x.type==='Missing Yield').length,needConv=m.errors.filter(x=>x.type==='Manual Cal needs conversion').length;
    $('#manualKpi').innerHTML=`<div class="card plan-kpi">WP ที่มียอดใช้<b>${m.wpSales.size}</b></div><div class="card plan-kpi">RM ที่คำนวณได้<b>${rows.length}</b></div><div class="card plan-kpi">Missing Yield<b class="warn">${missingYield}</b></div><div class="card plan-kpi">Need Conversion<b class="warn">${needConv}</b></div>`;
    $('#manualErrors').innerHTML=m.errors.length?`<div class="notice">${m.errors.map(x=>`<b>${esc(x.type)}</b> ${esc(x.code)}: ${esc(x.note)}`).join(' • ')}</div>`:'';
  }

  function itemSaleDays(branch){
    return new Set((S.item||[]).filter(r=>T(V(r,'wh'))===branch&&T(V(r,'date'))).map(r=>T(V(r,'date')))).size;
  }
  function reorderMap(branch){const m=new Map();for(const x of S.reorderSettings||[])if(T(x.branch_code)===branch)m.set(T(x.rm_code).toUpperCase(),Math.max(0,Math.trunc(num(x.lead_time_days))));return m}
  function parseStockDate(s){
    s=T(s);if(!s)return new Date();
    let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
    m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);
    const d=new Date(s);return isNaN(d)?new Date():d;
  }
  function thaiDate(d){return d instanceof Date&&!isNaN(d)?d.toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'}):'—'}
  function currentStock(x){
    if(x.count!=null)return{value:num(x.count),basis:'Actual Count'};
    if(Number.isFinite(Number(x.reportActual))&&num(x.reportActual)!==0)return{value:num(x.reportActual),basis:'Report Actual'};
    return{value:num(x.calc),basis:'Calc Theory'};
  }
  function planningRows(){
    const branch=$('#planBranch')?.value||$('#branch')?.value||'',days=Math.max(1,itemSaleDays(branch)),lead=reorderMap(branch),base=parseStockDate(S.stockDate);
    return (S.analysis||[]).map(x=>{
      const stock=currentStock(x),usage=x.usageTotal==null?null:num(x.usageTotal),daily=usage==null?null:usage/days,lt=lead.get(T(x.rm).toUpperCase())||0,required=daily==null?null:daily*lt,order=required==null?null:Math.max(required-stock.value,0),cover=daily>0?Math.max(stock.value,0)/daily:null;
      let until=null;if(cover!=null){until=new Date(base);until.setDate(until.getDate()+Math.floor(cover))}
      return {...x,currentStock:stock.value,stockBasis:stock.basis,usageDays:days,dailyUsage:daily,leadTime:lt,requiredQty:required,planOrder:order,coverDays:cover,availableUntil:until,planStatus:required==null?'คำนวณไม่ได้':stock.value>=required?'เพียงพอ':'ควรสั่งเพิ่ม'};
    });
  }
  let leadSaveTimer=0;
  async function saveLeadSetting(branch,rm,days){
    days=Math.max(0,Math.min(365,Math.trunc(num(days))));
    const key=branch+'\u0001'+rm.toUpperCase(),m=new Map((S.reorderSettings||[]).map(x=>[T(x.branch_code)+'\u0001'+T(x.rm_code).toUpperCase(),x]));
    m.set(key,{branch_code:branch,rm_code:rm,lead_time_days:days,updated_at:new Date().toISOString()});S.reorderSettings=[...m.values()];
    clearTimeout(leadSaveTimer);leadSaveTimer=setTimeout(async()=>{try{await cloudApi('save_reorder_settings',{settings:S.reorderSettings.filter(x=>T(x.branch_code)===branch)});renderPlanningPage()}catch(e){alert('บันทึก Lead Time ไม่สำเร็จ: '+e.message)}},350);
  }
  function syncPlanningBranch(forceAll=false){
    const p=$('#planBranch'),main=$('#branch');if(!p||!main)return;
    if(p.value&&main.value!==p.value)main.value=p.value;
    if(forceAll&&$('#date'))$('#date').value='';
    compute();
  }
  function renderPlanningPage(){
    const body=$('#planTbl tbody');if(!body||ROLE()!=='user')return;
    renderBranchSelectors();const branch=$('#planBranch')?.value||$('#branch')?.value||'';if(!branch)return;
    if($('#branch')?.value!==branch)return;
    const rows=planningRows(),days=itemSaleDays(branch);
    $('#planDaysInfo').textContent=`ฐานคำนวณ Daily Usage: ${days||1} วัน${days?'จาก Item Sale':' (ไม่พบวันที่ Item Sale จึงใช้ 1 วัน)'}`;
    body.innerHTML=rows.map(x=>`<tr><td><b>${esc(x.rm)}</b></td><td>${esc(x.desc)}</td><td>${esc(x.unit)}</td><td class="num" title="${esc(x.stockBasis)}">${fmt(x.currentStock)}</td><td class="num">${x.usageTotal==null?'—':fmt(x.usageTotal)}</td><td class="num">${x.usageDays}</td><td class="num">${x.dailyUsage==null?'—':fmt(x.dailyUsage)}</td><td><input class="lead-days" data-rm="${esc(x.rm)}" type="number" min="0" max="365" value="${x.leadTime}"></td><td class="num">${x.requiredQty==null?'—':fmt(x.requiredQty)}</td><td class="num"><b>${x.planOrder==null?'—':fmt(x.planOrder)}</b></td><td class="num">${x.coverDays==null?'—':fmt(x.coverDays)}</td><td>${x.availableUntil?thaiDate(x.availableUntil):'—'}</td><td><span class="plan-status ${x.planStatus==='เพียงพอ'?'enough':x.planStatus==='ควรสั่งเพิ่ม'?'order':'unknown'}">${x.planStatus}</span></td></tr>`).join('');
    body.querySelectorAll('.lead-days').forEach(i=>i.onchange=()=>saveLeadSetting(branch,i.dataset.rm,i.value));
    const enough=rows.filter(x=>x.planStatus==='เพียงพอ').length,order=rows.filter(x=>x.planStatus==='ควรสั่งเพิ่ม').length,totalOrder=rows.reduce((s,x)=>s+(x.planOrder||0),0),covers=rows.map(x=>x.coverDays).filter(x=>x!=null);
    $('#planKpi').innerHTML=`<div class="card plan-kpi">RM ทั้งหมด<b>${rows.length}</b></div><div class="card plan-kpi">เพียงพอ<b class="ok">${enough}</b></div><div class="card plan-kpi">ควรสั่งเพิ่ม<b class="bad">${order}</b></div><div class="card plan-kpi">Plan Order Qty รวม<b>${fmt(totalOrder)}</b></div><div class="card plan-kpi">Average Stock Cover<b>${covers.length?fmt(covers.reduce((a,b)=>a+b,0)/covers.length):'—'} วัน</b></div>`;
  }
  async function applyLeadAll(){
    const branch=$('#planBranch')?.value||'',days=Math.max(0,Math.min(365,Math.trunc(num($('#planAllDays')?.value))));
    const rows=S.analysis||[];for(const x of rows){const key=branch+'\u0001'+T(x.rm).toUpperCase(),m=new Map((S.reorderSettings||[]).map(y=>[T(y.branch_code)+'\u0001'+T(y.rm_code).toUpperCase(),y]));m.set(key,{branch_code:branch,rm_code:x.rm,lead_time_days:days,updated_at:new Date().toISOString()});S.reorderSettings=[...m.values()]}
    try{await cloudApi('save_reorder_settings',{settings:S.reorderSettings.filter(x=>T(x.branch_code)===branch)});renderPlanningPage()}catch(e){alert('บันทึก Lead Time ไม่สำเร็จ: '+e.message)}
  }

  function exportPlanningExcel(){
    if(!window.XLSX){alert('Excel library ยังไม่พร้อม');return}
    const branch=$('#planBranch')?.value||'',rows=planningRows(),aoa=[['KAMU Daily Usage & Order Planning'],['Branch',branch],['Stock Date',S.stockDate||''],[],['RM','Description','Unit','Current Stock','Usage Total','Usage Days','Daily Usage','Lead Time Days','Required Qty','Plan Order Qty','Stock Cover Days','Stock Available Until','Status'],...rows.map(x=>[x.rm,x.desc,x.unit,x.currentStock,x.usageTotal??'',x.usageDays,x.dailyUsage??'',x.leadTime,x.requiredQty??'',x.planOrder??'',x.coverDays??'',x.availableUntil?thaiDate(x.availableUntil):'',x.planStatus])];
    const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[{wch:15},{wch:35},{wch:12},...Array(10).fill({wch:16})];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Daily Usage Plan');XLSX.writeFile(wb,`KAMU_Daily_Usage_Plan_${branch}_${S.stockDate||'ALL'}.xlsx`);
  }
  async function exportPlanningPdf(){
    try{
      if(typeof ensurePdf!=='function')throw Error('PDF library ไม่พร้อม');await ensurePdf();
      const branch=$('#planBranch')?.value||'',rows=planningRows(),per=20,total=Math.max(1,Math.ceil(rows.length/per)),pages=[];
      for(let p=0;p<total;p++){
        const part=rows.slice(p*per,(p+1)*per),box=document.createElement('div');box.style.cssText='position:fixed;left:-100000px;top:0;width:1400px;padding:32px;background:white;color:#173a28;font-family:Arial,sans-serif;box-sizing:border-box';
        box.innerHTML=`<h2 style="margin:0 0 8px">KAMU Daily Usage & Order Planning</h2><div style="margin-bottom:12px">Branch: <b>${esc(branch)}</b> • Stock Date: ${esc(S.stockDate||'-')} • Page ${p+1}/${total}</div><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>${['RM','Description','Stock','Usage','Daily','Lead','Required','Plan Order','Cover Days','ใช้ได้ถึง','Status'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${part.map(x=>`<tr><td>${esc(x.rm)}</td><td>${esc(x.desc)}</td><td>${fmt(x.currentStock)}</td><td>${x.usageTotal==null?'—':fmt(x.usageTotal)}</td><td>${x.dailyUsage==null?'—':fmt(x.dailyUsage)}</td><td>${x.leadTime}</td><td>${x.requiredQty==null?'—':fmt(x.requiredQty)}</td><td>${x.planOrder==null?'—':fmt(x.planOrder)}</td><td>${x.coverDays==null?'—':fmt(x.coverDays)}</td><td>${x.availableUntil?thaiDate(x.availableUntil):'—'}</td><td>${x.planStatus}</td></tr>`).join('')}</tbody></table>`;box.querySelectorAll('th,td').forEach(x=>x.style.cssText+=';border:1px solid #cfded4;padding:6px');box.querySelectorAll('th').forEach(x=>x.style.cssText+=';background:#dff4e7');document.body.appendChild(box);pages.push(box);
      }
      const canvases=[];try{for(const p of pages)canvases.push(await html2canvas(p,{scale:1.15,backgroundColor:'#fff',logging:false}))}finally{pages.forEach(x=>x.remove())}
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});canvases.forEach((c,i)=>{if(i)pdf.addPage('a4','landscape');const img=c.toDataURL('image/jpeg',.92),pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),r=Math.min(pw/c.width,ph/c.height);pdf.addImage(img,'JPEG',(pw-c.width*r)/2,(ph-c.height*r)/2,c.width*r,c.height*r)});pdf.save(`KAMU_Daily_Usage_Plan_${branch}_${S.stockDate||'ALL'}.pdf`);
    }catch(e){alert('Export PDF ไม่สำเร็จ: '+e.message)}
  }

  const css=document.createElement('style');css.textContent=`
  .dual-usage-editor{min-width:170px}.dual-usage-editor select{display:block;width:100%;min-height:34px;border:1px solid #bcd9c6;border-radius:9px;background:#fff;padding:5px 7px;font-size:11px}.dual-usage-editor select+select{margin-top:4px}.dual-total{background:#f0faf3}.dual-usage-state,.planning-state{display:inline-flex;padding:6px 10px;border-radius:10px;font-size:11px;font-weight:850}.saved{background:#e7f8ed;color:#147645}.saving{background:#fff5d9;color:#8b5a00}.error{background:#fff0ee;color:#b42318}
  .planning-toolbar{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-top:12px}.planning-toolbar label{display:grid;gap:4px;font-size:11px;font-weight:800;color:#547060}.planning-toolbar select,.planning-toolbar input{min-height:40px;border:1px solid #bfdac8;border-radius:10px;padding:7px 10px;background:#fff}.planning-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:12px 0}.plan-kpi{font-size:11px;color:#657c6d}.plan-kpi b{display:block;margin-top:4px;font-size:21px;color:#173a28}.lead-days{width:84px;min-height:34px;border:1px solid #bfdac8;border-radius:8px;padding:5px}.plan-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900;white-space:nowrap}.plan-status.enough{background:#daf5e3;color:#116a35}.plan-status.order{background:#ffe1df;color:#b42318}.plan-status.unknown{background:#eef1ef;color:#65756c}
  .wip-master-list{display:grid;gap:12px}.wip-card{border:1px solid #d5e8db;border-radius:16px;padding:12px;background:#fff}.wip-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:10px}.wip-head>div:first-child b{font-size:16px;color:#17653e}.wip-head small{display:block;color:#748679;margin-top:3px}.wip-yield{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.wip-yield label{display:grid;gap:3px;font-size:10px;color:#688071}.wip-yield input{width:130px;min-height:36px;border:1px solid #c7dfcf;border-radius:9px;padding:6px 8px}.wip-used{padding:7px 9px;border-radius:9px;background:#eef9f2;color:#17653e;font-size:11px;font-weight:850}.planning-empty{padding:24px;text-align:center;color:#718679}
  @media(max-width:900px){.planning-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.wip-head{display:block}.wip-yield{margin-top:10px}}@media(max-width:600px){.planning-kpis{grid-template-columns:1fr}.planning-toolbar>*{width:100%}.planning-toolbar select,.planning-toolbar input{width:100%}}
  `;document.head.appendChild(css);

  ensureExtraPages();renderBranchSelectors();renderWipMaster();renderManualPage();
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{ensureExtraPages();renderBranchSelectors();loadPlanningData()},120));
  setTimeout(()=>{ensureExtraPages();if(TOKEN())loadPlanningData()},900);

  const ver=document.querySelector('.version');if(ver){const fresh=ver.cloneNode(false);fresh.textContent='Version 3.28 • Public Multi‑User Cloud';ver.replaceWith(fresh)}
})();
