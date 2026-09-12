(()=>{
  function removeLegacyAdminNotice(){
    document.querySelectorAll('#adminPanel .notice').forEach(el=>{
      const text=(el.textContent||'').trim();
      if(/Public V1|Browser|Cloudflare D1/i.test(text)) el.remove();
    });
  }

  removeLegacyAdminNotice();

  const obs=new MutationObserver(removeLegacyAdminNotice);
  obs.observe(document.documentElement,{childList:true,subtree:true});

  const footer=document.querySelector('.side footer');
  if(footer) footer.textContent='Version 3.3 · Online Cloud';
})();
