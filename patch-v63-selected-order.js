/* KSL V6.3 — reorder selected inspection items + autosave */
(()=>{
  'use strict';
  if(window.__KSL_EXPIRY_SELECTED_ORDER_V63__) return;
  window.__KSL_EXPIRY_SELECTED_ORDER_V63__=1;

  const SELECTED_KEY='KSL_EXPIRY_SELECTED_V632';
  let rebuilding=false;
  let dragKey='';
  let syncTimer=0;
  let lastSynced='';

  const q=v=>String(v??'').trim();
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const getState=()=>{try{if(typeof appState!=='undefined'&&appState)return appState}catch(_){}return window.appState||null};
  const readOrder=()=>{try{const v=JSON.parse(localStorage.getItem(SELECTED_KEY)||'[]');return Array.isArray(v)?v.map(q).filter(Boolean):[]}catch(_){return[]}};
  const writeOrder=a=>{try{localStorage.setItem(SELECTED_KEY,JSON.stringify(a))}catch(_){}};

  function ensureStyle(){
    if(document.getElementById('ksl-selected-order-v63-style'))return;
    const s=document.createElement('style');
    s.id='ksl-selected-order-v63-style';
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

  function scheduleOnline(order){
    const signature=JSON.stringify(order);
    if(signature===lastSynced)return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(async()=>{
      const a=readOrder();
      const sig=JSON.stringify(a);
      const s=getState();
      if(!s){lastSynced=sig;return;}
      s.expiryAuditSelectedOrder=a.slice();
      s.expiryAuditSelectedItems=a.slice();
      try{
        if(typeof dbSet==='function') await Promise.resolve(dbSet(s));
        lastSynced=sig;
      }catch(err){console.warn('[KSL] selected order online save failed',err)}
    },350);
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

  function updateButtons(){
    const order=readOrder();
    document.querySelectorAll('#eaSelectedList .ea-order-wrap').forEach(w=>{
      const key=q(w.dataset.orderKey),i=order.indexOf(key);
      const prev=w.querySelector('[data-order-prev]'),next=w.querySelector('[data-order-next]');
      if(prev)prev.disabled=i<=0;
      if(next)next.disabled=i<0||i>=order.length-1;
    });
  }

  function enhance(){
    ensureStyle();
    const list=document.getElementById('eaSelectedList');
    if(!list)return false;
    const chips=[...list.querySelectorAll(':scope > .ea-pick-chip[data-remove-key], :scope > button.ea-pick-chip[data-remove-key]')];
    chips.forEach(chip=>{
      const key=q(chip.dataset.removeKey); if(!key)return;
      const wrap=document.createElement('span');
      wrap.className='ea-order-wrap';
      wrap.dataset.orderKey=key;
      chip.parentNode.insertBefore(wrap,chip);
      wrap.appendChild(chip);
      chip.draggable=true;
      chip.title='ลากเพื่อย้ายตำแหน่ง หรือใช้ปุ่ม ◀ ▶';
      const prev=document.createElement('button');
      prev.type='button';prev.className='ea-order-btn';prev.dataset.orderPrev=key;prev.textContent='◀';prev.title='ย้ายไปด้านหน้า';
      const next=document.createElement('button');
      next.type='button';next.className='ea-order-btn';next.dataset.orderNext=key;next.textContent='▶';next.title='ย้ายไปด้านหลัง';
      wrap.append(prev,next);
    });
    const label=list.parentElement?.querySelector('.ea-picker-label');
    if(label&&!label.querySelector('.ea-order-note')){
      const n=document.createElement('span');n.className='ea-order-note';n.textContent='ลาก หรือ ◀ ▶ เพื่อจัดลำดับ • บันทึกอัตโนมัติ';label.appendChild(n);
    }
    const order=readOrder();
    reorderTable(order);
    updateButtons();
    scheduleOnline(order);
    return true;
  }

  async function rebuild(order){
    if(rebuilding)return;
    rebuilding=true;
    try{
      const clear=document.getElementById('eaClearSelected');
      const picker=document.getElementById('eaItemPicker');
      if(!clear||!picker){writeOrder(order);return;}
      clear.click();
      await wait(35);
      for(const key of order){
        if(![...picker.options].some(o=>q(o.value)===key))continue;
        picker.value=key;
        picker.dispatchEvent(new Event('change',{bubbles:true}));
        await wait(12);
      }
      picker.value='';
      picker.dispatchEvent(new Event('change',{bubbles:true}));
      writeOrder(order);
      reorderTable(order);
      scheduleOnline(order);
      setTimeout(enhance,30);
    }finally{rebuilding=false;}
  }

  function move(key,delta){
    const order=readOrder();
    const i=order.indexOf(key),j=i+delta;
    if(i<0||j<0||j>=order.length)return;
    [order[i],order[j]]=[order[j],order[i]];
    rebuild(order);
  }

  function moveTo(key,targetKey){
    if(!key||!targetKey||key===targetKey)return;
    const order=readOrder();
    const from=order.indexOf(key),to=order.indexOf(targetKey);
    if(from<0||to<0)return;
    order.splice(from,1);
    order.splice(to,0,key);
    rebuild(order);
  }

  document.addEventListener('click',e=>{
    const p=e.target.closest?.('[data-order-prev]');
    if(p){e.preventDefault();e.stopPropagation();move(q(p.dataset.orderPrev),-1);return;}
    const n=e.target.closest?.('[data-order-next]');
    if(n){e.preventDefault();e.stopPropagation();move(q(n.dataset.orderNext),1);return;}
    if(e.target.closest?.('#eaClearSelected,[data-remove-key]'))setTimeout(enhance,50);
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='eaItemPicker')setTimeout(enhance,35);
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
    dragKey='';document.querySelectorAll('#eaSelectedList .drag-over').forEach(x=>x.classList.remove('drag-over'));
  },true);

  let observer;
  function watch(){
    const list=document.getElementById('eaSelectedList');
    if(!list)return false;
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>setTimeout(enhance,0));
    observer.observe(list,{childList:true});
    enhance();
    return true;
  }

  let tries=0;
  (function boot(){tries++;if(!watch()&&tries<80)setTimeout(boot,120)})();
  window.addEventListener('ksl-central-synced',()=>setTimeout(()=>{watch();enhance()},120));
  console.info('[KSL] V6.3 selected item ordering + autosave ready');
})();
