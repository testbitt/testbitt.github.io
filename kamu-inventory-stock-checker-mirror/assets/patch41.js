/* Version 3.29 — Show WIP product name in WIP Conversion Master */
(()=>{
  const getWipName=(code)=>{
    const target=T(code).toUpperCase();
    for(const r of Array.isArray(S?.wip)?S.wip:[]){
      if(T(V(r,'wipc')).toUpperCase()!==target)continue;
      for(const [k,v] of Object.entries(r||{})){
        const key=K(k);
        if(['wipname','fgname','productname','itemname'].includes(key)){
          const name=T(v);
          if(name)return name;
        }
      }
    }
    return '';
  };

  function applyWipNames(){
    const box=document.querySelector('#wipMasterList');
    if(!box)return;
    for(const card of box.querySelectorAll('.wip-card')){
      const head=card.querySelector('.wip-head>div:first-child');
      const codeEl=head?.querySelector('b');
      if(!head||!codeEl)continue;
      const code=T(codeEl.textContent);
      const name=getWipName(code);
      let el=head.querySelector('.wip-product-name');
      if(!el){
        el=document.createElement('div');
        el.className='wip-product-name';
        codeEl.insertAdjacentElement('afterend',el);
      }
      el.textContent=name?name:'ไม่พบชื่อสินค้า';
      el.title=name||'ไม่พบชื่อสินค้าใน Bomb Sheet Wip';
    }
  }

  let busy=false;
  const schedule=()=>{
    if(busy)return;
    busy=true;
    requestAnimationFrame(()=>{busy=false;applyWipNames()});
  };

  function observe(){
    const box=document.querySelector('#wipMasterList');
    if(!box)return;
    if(!box.dataset.wipNameObserved){
      box.dataset.wipNameObserved='1';
      new MutationObserver(schedule).observe(box,{childList:true,subtree:true});
    }
    schedule();
  }

  const css=document.createElement('style');
  css.textContent=`
    .wip-product-name{
      margin-top:3px;
      font-size:14px;
      line-height:1.35;
      font-weight:850;
      color:#263c31;
    }
    .wip-head>div:first-child .wip-product-name+small{margin-top:5px}
    @media(max-width:600px){.wip-product-name{font-size:13px}}
  `;
  document.head.appendChild(css);

  observe();
  setTimeout(observe,300);
  setTimeout(observe,1000);
  document.addEventListener('kamu:data-ready',()=>setTimeout(observe,120));

  const oldVersion=document.querySelector('.version');
  if(oldVersion){
    const fresh=oldVersion.cloneNode(false);
    fresh.textContent='Version 3.29 • Public Multi‑User Cloud';
    oldVersion.replaceWith(fresh);
  }
})();
