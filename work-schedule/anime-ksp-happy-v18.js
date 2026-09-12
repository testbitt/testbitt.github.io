(()=>{
  const mark=document.querySelector('.mark');
  if(mark){
    mark.textContent='KSP';
    mark.setAttribute('aria-label','KSP');
  }

  // Remove the HAPPY WEEK mascot/card completely while keeping KSP branding.
  const box=document.querySelector('.cute-mascot');
  if(box) box.remove();

  const oldStyle=document.getElementById('kspHappyWeekV18');
  if(oldStyle) oldStyle.remove();
  const style=document.createElement('style');
  style.id='kspHappyWeekV18';
  style.textContent=`
    .mark{font-size:18px!important;letter-spacing:.3px!important;font-weight:900!important;white-space:nowrap}
    .cute-mascot{display:none!important}
    @media(max-width:980px){.mark{font-size:14px!important}}
  `;
  document.head.appendChild(style);

  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 3.4';
})();
