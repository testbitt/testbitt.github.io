/* KSL V5.0c — HQ Banner loader */
(() => {
  'use strict';

  const EXPECTED_BASE64_LENGTH = 116632;
  const PARTS = Array.from({length:8},(_,i)=>`assets/banner-hq-part-${String(i).padStart(2,'0')}.txt?v=50c`);
  let hqPromise = null;

  const previousStyle = document.getElementById('ksl-v50-hq-banner');
  if(previousStyle) previousStyle.remove();
  const style = document.createElement('style');
  style.id = 'ksl-v50-hq-banner';
  style.textContent = `
    #home .ksl-v49-banner img{
      image-rendering:auto!important;
      width:100%!important;
      height:auto!important;
      aspect-ratio:2048/682!important;
      object-fit:cover!important;
      object-position:center center!important;
      filter:none!important;
      transform:none!important;
      transition:opacity .18s ease;
    }
    #home .ksl-v49-banner img.ksl-hq-loading{opacity:.35!important}
    #home .ksl-v49-banner img.ksl-hq-ready{opacity:1!important}
  `;
  document.head.appendChild(style);

  function getHQBanner(){
    if(hqPromise) return hqPromise;
    hqPromise = Promise.all(PARTS.map(url =>
      fetch(url,{cache:'no-store'}).then(r=>{
        if(!r.ok) throw new Error(`โหลด ${url} ไม่สำเร็จ (${r.status})`);
        return r.text();
      })
    )).then(parts=>{
      const b64 = parts.join('').replace(/\s+/g,'');
      if(b64.length !== EXPECTED_BASE64_LENGTH || !b64.startsWith('UklG')) {
        throw new Error(`ข้อมูล Banner HQ ไม่สมบูรณ์ (${b64.length}/${EXPECTED_BASE64_LENGTH})`);
      }
      return `data:image/webp;base64,${b64}`;
    });
    return hqPromise;
  }

  async function applyHQ(){
    const imgs = [...document.querySelectorAll('#home .ksl-v49-banner img')];
    if(!imgs.length) return;
    const pending = imgs.filter(img=>img.dataset.hqApplied!=='1');
    if(!pending.length) return;
    pending.forEach(img=>img.classList.add('ksl-hq-loading'));

    try{
      const src = await getHQBanner();
      pending.forEach(img=>{
        img.dataset.hqApplied='1';
        img.decoding='async';
        img.onload=()=>{
          img.classList.remove('ksl-hq-loading');
          img.classList.add('ksl-hq-ready');
        };
        img.onerror=()=>{
          img.dataset.hqApplied='0';
          img.classList.remove('ksl-hq-loading');
        };
        img.src=src;
      });
    }catch(err){
      console.warn('[KSL V5.0c] HQ banner fallback:',err);
      pending.forEach(img=>img.classList.remove('ksl-hq-loading'));
    }
  }

  applyHQ();
  setTimeout(applyHQ,180);
  setTimeout(applyHQ,700);
  setTimeout(applyHQ,1500);

  const observer = new MutationObserver(()=>{
    if(document.querySelector('#home .ksl-v49-banner img:not([data-hq-applied="1"])')) applyHQ();
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
  console.info('[KSL] V5.0c HQ Banner loader ready');
})();