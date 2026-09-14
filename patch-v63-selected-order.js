/* KSL V6.3 — stable reorder selected inspection items + autosave (no rebuild loop) */
(()=>{
  'use strict';
  if(window.__KSL_EXPIRY_SELECTED_ORDER_V633__) return;
  window.__KSL_EXPIRY_SELECTED_ORDER_V633__=1;

  const ORDER_KEY='KSL_EXPIRY_SELECTED_ORDER_V633';
  let dragKey='';
  let syncTimer=0;
  let lastSynced='';
  let observer=null;
  let observedList=null;

  const q=v=>String(v??'').trim();
  const getState=()=>{try{if(typeof appState!=='undefined'&&appState)return appState}catch(_){}return window.appState||null};
  const readOrder=()=>{try{const v=JSON.parse(localStorage.getItem(ORDER_KEY)||'[]');return Array.isArray(v)?v.map(q).filter(Boolean):[]}catch(_){return[]}};
  const writeOrder=a=>{try{localStorage.setItem(ORDER_KEY,JSON.stringify(a))}catch(_){}};

  function ensureStyle(){
    if(document.getElementById('ksl-selected-order-v633-style'))return;
    const s=document.createElement('style');
    s.id='ksl-selected-order-v633-style';
    s.textContent=`
      #expiryAudit #eaSelectedList{align-items:center}
      #expiryAudit .ea-order-wrap{display:inline-flex;align-items:center;gap:2px;border-radius:999px}
      #expiryAudit .ea-order-wrap .ea-pick-chip{cursor:grab}
      #expiryAudit .ea-order-wrap .ea-pick-chip:active{cursor:grabbing}
      #expiryAudit .ea-order-btn{width:22px;height:22px;min-width:22px;padding:0;border:1px solid #cfe2d8;border-radius:50%;background:#fff;color:#31634f;font-size:9px;font-weight:900;line-height:20px;cursor:pointer}
      #expiryAudit .ea-order-btn:hover:not(:disabled){background:#edf8f2;border-color:#79b89f}
      #expiryAudit .ea-order-btn:disabled{opacity:.28;cursor:default}
      #expiryAudit .ea-order-wrap.drag-over{outline:2px dashed #58a785;outline-offset:3px}
      #expiryAudit .ea-order-note{display:inline-flex;align-items:center;margin-left:6px;font-size:8px;font-weight:800;color:#789086}
    `;
    document.head.appendChild(s);
  }

  function currentKeys(list){
    return [...list.querySelectorAll('.ea-pick-chip[data-remove-key]')]
      .map(x=>q(x.dataset.removeKey)).filter(Boolean);
  }

  function reconcileOrder(list){
    const current=currentKeys(list);
    const set=new Set(current);
    const saved=readOrder().filter(k=>set.has(k));
    current.forEach(k=>{if(!saved.includes(k))saved.push(k)});
    writeOrder(saved);
    return saved;
  }

  function scheduleOnline(order){
    const signature=JSON.stringify(order);
    if(signature===lastSynced)return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(async()=>{
      const latest=readOrder();
      const sig=JSON.stringify(latest);
      if(sig===lastSynced)return;
      const s=getState();
      if(!s){lastSynced=sig;return;}
      s.expiryAuditSelectedOrder=latest.slice();
      try{
        if(typeof dbSet==='function') await Promise.resolve(dbSet(s));
        lastSynced=sig;
      }catch(err){console.warn('[KSL] selected order online save failed',err)}
    },450);
  }

  function reorderTable(order){
    const body=document.querySelector('#expiryAudit #eaBody');
    if(!body)return;
    const rows=[...body.querySelectorAll('tr[data-key]')];
    if(!rows.length)return;
    const map=new Map(rows.map(tr=>[q(tr.dataset.key),tr]));
    const chosen=new Set(order);
    order.forEach(k=>{const tr=map.get(k);if(tr)body.appendChild(tr)});
    rows.filter(tr=>!chosen.has(q(tr.dataset.key))).forEach(tr=>body.appendChild(tr));
  }

  function updateButtons(order){
    document.querySelectorAll('#eaSelectedList .ea-order-wrap').forEach(w=>{
      const key=q(w.dataset.orderKey),i=order.indexOf(key);
      const prev=w.querySelector('[data-order-prev]'),next=w.querySelector('[data-order-next]');
      if(prev)prev.disabled=i<=0;
      if(next)next.disabled=i<0||i>=order.length-1;
    });
  }

  function pauseObserver(){
    if(observer)observer.disconnect();
  }
  function resumeObserver(list){
    if(!list)return;
    if(!observer)observer=new MutationObserver(()=>setTimeout(enhance,35));
    observer.observe(list,{childList:true,subtree:false});
    observedList=list;
  }

  function enhance(){
    ensureStyle();
    const list=document.getElementById('eaSelectedList');
    if(!list)return false;
    pauseObserver();

    const order=reconcileOrder(list);
    const chips=[...list.querySelectorAll('.ea-pick-chip[data-remove-key]')];

    chips.forEach(chip=>{
      const key=q(chip.dataset.removeKey); if(!key)return;
      let wrap=chip.closest('.ea-order-wrap');
      if(!wrap || wrap.parentElement!==list){
        wrap=document.createElement('span');
        wrap.className='ea-order-wrap';
        wrap.dataset.orderKey=key;
        chip.parentNode.insertBefore(wrap,chip);
        wrap.appendChild(chip);
      }else{
        wrap.dataset.orderKey=key;
      }
      chip.draggable=true;
      chip.title='ลากเพื่อย้ายตำแหน่ง หรือใช้ปุ่ม ◀ ▶';

      if(!wrap.querySelector('[data-order-prev]')){
        const prev=document.createElement('button');
        prev.type='button';prev.className='ea-order-btn';prev.dataset.orderPrev=key;prev.textContent='◀';prev.title='ย้ายไปด้านหน้า';
        wrap.appendChild(prev);
      }else wrap.querySelector('[data-order-prev]').dataset.orderPrev=key;

      if(!wrap.querySelector('[data-order-next]')){
        const next=document.createElement('button');
        next.type='button';next.className='ea-order-btn';next.dataset.orderNext=key;next.textContent='▶';next.title='ย้ายไปด้านหลัง';
        wrap.appendChild(next);
      }else wrap.querySelector('[data-order-next]').dataset.orderNext=key;
    });

    const wraps=[...list.querySelectorAll(':scope > .ea-order-wrap')];
    const byKey=new Map(wraps.map(w=>[q(w.dataset.orderKey),w]));
    const domOrder=wraps.map(w=>q(w.dataset.orderKey)).filter(Boolean);
    if(JSON.stringify(domOrder)!==JSON.stringify(order)){
      order.forEach(k=>{const w=byKey.get(k);if(w)list.appendChild(w)});
    }

    const label=list.parentElement?.querySelector('.ea-picker-label');
    if(label&&!label.querySelector('.ea-order-note')){
      const n=document.createElement('span');
      n.className='ea-order-note';
      n.textContent='ลาก หรือ ◀ ▶ เพื่อจัดลำดับ • บันทึกอัตโนมัติ';
      label.appendChild(n);
    }

    reorderTable(order);
    updateButtons(order);
    scheduleOnline(order);
    resumeObserver(list);
    return true;
  }

  function applyOrder(order){
    const list=document.getElementById('eaSelectedList');
    if(!list)return;
    const current=currentKeys(list);
    const set=new Set(current);
    order=order.filter(k=>set.has(k));
    current.forEach(k=>{if(!order.includes(k))order.push(k)});
    writeOrder(order);

    pauseObserver();
    const wraps=[...list.querySelectorAll(':scope > .ea-order-wrap')];
    const byKey=new Map(wraps.map(w=>[q(w.dataset.orderKey),w]));
    order.forEach(k=>{const w=byKey.get(k);if(w)list.appendChild(w)});
    reorderTable(order);
    updateButtons(order);
    scheduleOnline(order);
    resumeObserver(list);
  }

  function move(key,delta){
    const list=document.getElementById('eaSelectedList');
    if(!list)return;
    const order=reconcileOrder(list);
    const i=order.indexOf(key),j=i+delta;
    if(i<0||j<0||j>=order.length)return;
    [order[i],order[j]]=[order[j],order[i]];
    applyOrder(order);
  }

  function moveTo(key,targetKey){
    if(!key||!targetKey||key===targetKey)return;
    const list=document.getElementById('eaSelectedList');
    if(!list)return;
    const order=reconcileOrder(list);
    const from=order.indexOf(key),to=order.indexOf(targetKey);
    if(from<0||to<0)return;
    order.splice(from,1);
    order.splice(to,0,key);
    applyOrder(order);
  }

  document.addEventListener('click',e=>{
    const p=e.target.closest?.('[data-order-prev]');
    if(p){e.preventDefault();e.stopPropagation();move(q(p.dataset.orderPrev),-1);return;}
    const n=e.target.closest?.('[data-order-next]');
    if(n){e.preventDefault();e.stopPropagation();move(q(n.dataset.orderNext),1);return;}
    if(e.target.closest?.('#eaClearSelected,[data-remove-key],#eaFlowTplApply,#eaTemplateSave,#eaTemplateDelete,#eaTemplateNew,#eaTemplateEdit')){
      setTimeout(enhance,120);
    }
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='eaItemPicker' || e.target.closest?.('#eaFlowTplList input[type="checkbox"]')){
      setTimeout(enhance,140);
    }
  },true);

  document.addEventListener('dragstart',e=>{
    const chip=e.target.closest?.('#eaSelectedList .ea-pick-chip[data-remove-key]');
    if(!chip)return;
    dragKey=q(chip.dataset.removeKey);
    try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragKey)}catch(_){}
  },true);
  document.addEventListener('dragover',e=>{
    const w=e.target.closest?.('#eaSelectedList .ea-order-wrap');
    if(!w||!dragKey)return;
    e.preventDefault();
    document.querySelectorAll('#eaSelectedList .drag-over').forEach(x=>x.classList.remove('drag-over'));
    w.classList.add('drag-over');
  },true);
  document.addEventListener('drop',e=>{
    const w=e.target.closest?.('#eaSelectedList .ea-order-wrap');
    document.querySelectorAll('#eaSelectedList .drag-over').forEach(x=>x.classList.remove('drag-over'));
    if(!w||!dragKey)return;
    e.preventDefault();
    const source=dragKey;dragKey='';
    moveTo(source,q(w.dataset.orderKey));
  },true);
  document.addEventListener('dragend',()=>{
    dragKey='';
    document.querySelectorAll('#eaSelectedList .drag-over').forEach(x=>x.classList.remove('drag-over'));
  },true);

  let tries=0;
  (function boot(){
    tries++;
    if(enhance())return;
    if(tries<80)setTimeout(boot,120);
  })();

  window.addEventListener('ksl-central-synced',()=>setTimeout(enhance,180));
  console.info('[KSL] V6.3 stable selected item ordering + autosave ready');
})();
