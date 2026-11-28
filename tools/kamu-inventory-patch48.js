/* Version 3.40 — BOM Usage from Stock Movement Sales Usage; Manual Cal retired */
(()=>{
  const ROLE=()=>localStorage.getItem('kamuInvCloudRole')||'';
  const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0};
  const code=v=>String(v??'').trim().toUpperCase();
  const bomCache=new Map();

  function mergePart(map,rm,unit,qty){
    rm=code(rm);unit=String(unit??'').trim();
    if(!rm||!Number.isFinite(qty)||Math.abs(qty)<1e-12)return;
    const k=rm+'\u0001'+unit,old=map.get(k);
    if(old)old.qty+=qty;else map.set(k,{code:rm,unit,qty});
  }

  function yieldMap(){
    const m=new Map();
    for(const x of Array.isArray(S.wipConversion)?S.wipConversion:[]){
      const c=code(x.wip_code),y=num(x.yield_qty);
      if(c&&y>0)m.set(c,y);
    }
    return m;
  }

  function recipeRows(rec){
    const c=code(rec);
    return IDX.recipeByRec?.get(c)||IDX.recipeByRec?.get(String(rec??'').trim())||[];
  }
  function wipRows(wp){
    const c=code(wp);
    return IDX.wipByCode?.get(c)||IDX.wipByCode?.get(String(wp??'').trim())||[];
  }

  function explodeWip(wp,overrides,trail=new Set()){
    wp=code(wp);
    if(!wp||trail.has(wp))return[];
    const rows=wipRows(wp);if(!rows.length)return[];
    const next=new Set(trail);next.add(wp);const out=new Map();
    const overrideYield=overrides.get(wp)||0;
    for(const r of rows){
      const child=code(V(r,'rmitem')),rmQty=num(V(r,'rmq')),rmUnit=String(V(r,'rmu')??'').trim();
      const fileYield=num(V(r,'fgq')),yieldQty=overrideYield>0?overrideYield:fileYield;
      if(!child||!(rmQty!==0)||!(yieldQty>0))continue;
      const ratio=rmQty/yieldQty;
      const childWip=wipRows(child);
      if(childWip.length){
        for(const p of explodeWip(child,overrides,next))mergePart(out,p.code,p.unit||rmUnit,p.qty*ratio);
      }else mergePart(out,child,rmUnit,ratio);
    }
    return [...out.values()];
  }

  function bomFromSalesUsage(branch){
    branch=String(branch??'').trim();
    const overrides=yieldMap();
    const cacheKey=branch+'|'+JSON.stringify([...overrides.entries()]);
    if(bomCache.has(cacheKey))return bomCache.get(cacheKey);

    const source=new Map(),out=new Map(),matched=new Set();
    for(const r of IDX.stockByBranch?.get(branch)||[]){
      const c=code(V(r,'rm')),sales=num(V(r,'sales'));
      if(!c||Math.abs(sales)<1e-12)continue;
      source.set(c,(source.get(c)||0)+sales);
    }

    for(const [src,sales] of source){
      const rec=recipeRows(src),wip=wipRows(src);
      if(rec.length){
        matched.add(src);
        for(const r of rec){
          const child=code(V(r,'comp')),qty=sales*num(V(r,'compq')),unit=String(V(r,'unit')??'').trim();
          if(!child||Math.abs(qty)<1e-12)continue;
          const childWip=wipRows(child);
          if(childWip.length){
            for(const p of explodeWip(child,overrides,new Set([src])))mergePart(out,p.code,p.unit||unit,p.qty*qty);
          }else mergePart(out,child,unit,qty);
        }
      }else if(wip.length){
        matched.add(src);
        for(const p of explodeWip(src,overrides))mergePart(out,p.code,p.unit,p.qty*sales);
      }
    }

    const grouped=new Map();
    for(const p of out.values()){
      if(!grouped.has(p.code))grouped.set(p.code,new Map());
      const u=grouped.get(p.code);u.set(p.unit,(u.get(p.unit)||0)+p.qty);
    }
    window.kamuBomSalesStats={branch,sourceCount:source.size,matchedCount:matched.size,rawRmCount:grouped.size,source,matched};
    bomCache.set(cacheKey,grouped);
    return grouped;
  }

  // Replace legacy Item Sale based BOM expected usage.
  expected=function(branch,date){return bomFromSalesUsage(branch)};
  window.kamuBomFromSalesUsage=bomFromSalesUsage;

  function sanitizeUsageSource(){
    if(!Array.isArray(S.usageSource))return false;
    let changed=false;
    S.usageSource=S.usageSource.map(row=>{
      const x={...row};
      let s1=String(x.source_1??x.source??'').trim();
      let s2=String(x.source_2??'').trim();
      const norm=s=>/^(manual|manual_cal|manualcal|manualcalculation)$/i.test(s)?'bom':s;
      const n1=norm(s1),n2=norm(s2);
      if(n1!==s1||n2!==s2)changed=true;
      s1=n1;s2=n2;
      if(s1&&s2&&s1===s2){s2='';changed=true}
      x.source=s1;x.source_1=s1;x.source_2=s2;
      if(s1!=='item_sale'){x.cup_size='';x.cup_size_1=''}
      if(s2!=='item_sale')x.cup_size_2='';
      return x;
    });
    return changed;
  }

  function cleanupManualUi(){
    const tab=document.querySelector('.tab[data-p="manualcal"]');
    const page=document.querySelector('#manualcal');
    const wasActive=tab?.classList.contains('active')||page?.classList.contains('active');
    tab?.remove();page?.remove();
    document.querySelectorAll('select.dual-usage-source option[value="manual_cal"]').forEach(o=>o.remove());

    const wip=document.querySelector('#wipmaster .section-title .subtle');
    if(wip&&/Manual Cal/i.test(wip.textContent||''))wip.textContent='รหัส WP จาก BOM Sheet Wip • ใช้ Yield สำหรับแปลง Sales Usage กลับเป็นวัตถุดิบหลัก';

    if(wasActive){
      const t=document.querySelector('.tab[data-p="dashboard"]')||document.querySelector('.tab:not([style*="display: none"])');
      t?.click();
    }
  }

  function updateBomDiagnostics(){
    const branch=document.querySelector('#branch')?.value||'';
    if(!branch)return;
    const exp=bomFromSalesUsage(branch),stats=window.kamuBomSalesStats||{};
    const stockRows=(IDX.stockByBranch?.get(branch)||[]).length;
    const needCount=new Set((S.needs||[]).map(x=>x.rm)).size;
    const notices=[];
    if(!stockRows)notices.push('สาขานี้ไม่มี Stock Movement จึงไม่สามารถทำ Inventory Audit ได้');
    if(!stats.sourceCount)notices.push('ไม่พบ Sales Usage ใน Stock Movement');
    if(stats.sourceCount&&stats.matchedCount===0)notices.push('Sales Usage ไม่ Match กับ RecCode/WIP ใน BOM');
    if(needCount)notices.push(`BOM จาก Sales Usage แตกวัตถุดิบแล้ว แต่ ${needCount} RM ยังต้องกำหนด/ตรวจ Unit Conversion`);
    const n=document.querySelector('#dateNotice');if(n)n.innerHTML=notices.length?`<div class="notice">${notices.join(' • ')}</div>`:'';

    const d=document.querySelector('#bomDiag');
    if(d)d.innerHTML=
      `<div class="diag">Sales Usage Source<b>${Number(stats.sourceCount||0).toLocaleString()}</b></div>`+
      `<div class="diag">Match BOM/WIP<b>${Number(stats.matchedCount||0).toLocaleString()}</b></div>`+
      `<div class="diag">วัตถุดิบหลักที่แตกได้<b>${exp.size.toLocaleString()}</b></div>`+
      `<div class="diag ${needCount?'warn':''}">Need Conversion<b>${needCount.toLocaleString()}</b></div>`;
  }

  sanitizeUsageSource();

  const baseCompute=compute;
  compute=function(){
    sanitizeUsageSource();
    bomCache.clear();
    return baseCompute.apply(this,arguments);
  };

  const baseRender=render;
  render=function(){
    const out=baseRender.apply(this,arguments);
    cleanupManualUi();
    updateBomDiagnostics();
    return out;
  };

  function refresh(){
    sanitizeUsageSource();cleanupManualUi();updateBomDiagnostics();
  }
  refresh();
  setTimeout(refresh,250);
  setTimeout(refresh,900);
  setTimeout(refresh,1800);
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{bomCache.clear();refresh();compute()},250));

  const v=document.querySelector('.version');
  if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.40 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();