(()=>{
  const mark=document.querySelector('.mark');
  if(mark){
    mark.textContent='KSP';
    mark.setAttribute('aria-label','KSP');
  }

  const style=document.createElement('style');
  style.id='kspHappyWeekV18';
  style.textContent=`
    .mark{font-size:18px!important;letter-spacing:.3px!important;font-weight:900!important;white-space:nowrap}
    .cute-mascot{height:184px!important;background:linear-gradient(145deg,#ffffff 0%,#f4fff9 100%)!important;border:1px solid #bfe6d7!important}
    .cute-mascot svg{display:none!important}
    .cute-copy{left:14px!important;top:15px!important;width:122px!important}
    .cute-copy b{font-size:13px!important;letter-spacing:.2px}
    .cute-copy span{font-size:9.5px!important;line-height:1.55!important}
    .happy-staff3{position:absolute;right:-4px;bottom:-5px;width:158px;height:123px;object-fit:cover;object-position:center 48%;border-radius:22px 0 20px 0;filter:drop-shadow(0 7px 12px rgba(24,108,82,.10));animation:happyStaffFloat 4.8s ease-in-out infinite;z-index:1}
    .cute-mascot:after{content:"";position:absolute;right:4px;bottom:2px;width:145px;height:110px;border-radius:50%;background:radial-gradient(circle,rgba(182,237,215,.28),rgba(182,237,215,0) 72%);pointer-events:none;z-index:0}
    @keyframes happyStaffFloat{0%,100%{transform:translateY(1px)}50%{transform:translateY(-5px)}}
    @media(max-width:980px){.mark{font-size:14px!important}}
    @media(prefers-reduced-motion:reduce){.happy-staff3{animation:none!important}}
  `;
  document.head.appendChild(style);

  const box=document.querySelector('.cute-mascot');
  if(box){
    box.querySelectorAll('svg,.happy-staff3').forEach(el=>el.remove());
    fetch('./staff3-v18.b64?v=1.8',{cache:'no-store'})
      .then(r=>r.text())
      .then(data=>{
        const img=document.createElement('img');
        img.className='happy-staff3';
        img.alt='พนักงาน KAMU 3 คน ใส่ผ้ากันเปื้อนสีเขียว';
        img.src='data:image/webp;base64,'+data.trim();
        box.appendChild(img);
      })
      .catch(()=>{});
  }

  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 1.8 · Cute Green Anime';
})();
