(()=>{
  const style=document.createElement('style');
  style.id='animeExecutiveThemeV15';
  style.textContent=`
  :root{--anime-navy:#101c2e;--anime-deep:#0b302b;--anime-emerald:#137b61;--anime-mint:#8ed9c3;--anime-gold:#e7ba69;--anime-lilac:#b7b3ed;--anime-ice:#edf8f5}
  body{background:linear-gradient(135deg,#eef6f4 0%,#f5f3fb 48%,#edf5f8 100%);position:relative;overflow-x:hidden}
  body:before,body:after{content:"";position:fixed;border-radius:50%;filter:blur(42px);opacity:.28;pointer-events:none;z-index:0;animation:auroraMove 12s ease-in-out infinite alternate}
  body:before{width:440px;height:440px;background:#8fd8c5;right:-110px;top:-150px}
  body:after{width:360px;height:360px;background:#c2b9ec;left:210px;bottom:-170px;animation-delay:-5s}
  @keyframes auroraMove{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(35px,22px,0) scale(1.12)}}
  .app{position:relative;z-index:1;grid-template-columns:272px 1fr}
  .side{background:linear-gradient(165deg,#0c302a 0%,#10263a 58%,#171d35 100%);padding:24px 18px;overflow:hidden;box-shadow:14px 0 42px rgba(15,38,49,.12)}
  .side:before{content:"";position:absolute;inset:-30% -70% auto -70%;height:360px;background:radial-gradient(circle,rgba(142,217,195,.2),transparent 65%);animation:sideGlow 7s ease-in-out infinite alternate;pointer-events:none}
  @keyframes sideGlow{to{transform:translateY(80px) scale(1.15)}}
  .brand{position:relative;z-index:2;padding:8px 10px 20px;gap:14px}
  .mark{width:52px;height:52px;border-radius:18px;background:linear-gradient(145deg,#1c9876,#3f6ea5);box-shadow:0 12px 28px rgba(20,137,104,.25),inset 0 1px rgba(255,255,255,.22);font-size:25px;animation:logoFloat 4.5s ease-in-out infinite}
  @keyframes logoFloat{50%{transform:translateY(-4px) rotate(-2deg)}}
  .brand b{font-size:22px;letter-spacing:.4px}.brand small{font-size:12px;opacity:.72;letter-spacing:.25px}
  .nav{position:relative;z-index:3;gap:10px}
  .nav button{position:relative;overflow:hidden;color:#e6f4f0;border:1px solid transparent;background:rgba(255,255,255,.035);border-radius:16px;padding:14px 13px;min-height:60px;font-weight:750;line-height:1.35;transition:.22s ease;box-shadow:none}
  .nav button:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 10%,rgba(255,255,255,.13) 45%,transparent 80%);transform:translateX(-130%);transition:.55s}
  .nav button:hover:before{transform:translateX(130%)}
  .nav button:hover{transform:translateX(3px);border-color:rgba(142,217,195,.25);background:rgba(255,255,255,.07)}
  .nav button.active{background:linear-gradient(135deg,rgba(32,132,104,.72),rgba(61,93,145,.58));border-color:rgba(177,231,215,.34);box-shadow:0 13px 30px rgba(5,27,31,.2),inset 0 1px rgba(255,255,255,.13)}
  .nav .nav-num{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:9px;margin-right:8px;background:rgba(255,255,255,.12);color:#f4d9a2;font-size:12px;font-weight:900;border:1px solid rgba(255,255,255,.1)}
  .nav button.active .nav-num{background:#f0c779;color:#26364a;border-color:transparent}
  .anime-mascot{position:relative;z-index:2;margin-top:auto;margin-bottom:12px;height:150px;border-radius:22px;background:linear-gradient(150deg,rgba(255,255,255,.075),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.09);overflow:hidden;box-shadow:inset 0 1px rgba(255,255,255,.08)}
  .anime-mascot svg{position:absolute;right:-4px;bottom:-9px;width:142px;height:142px;animation:mascotFloat 4.8s ease-in-out infinite;filter:drop-shadow(0 12px 18px rgba(0,0,0,.22))}
  .anime-copy{position:absolute;left:14px;top:16px;width:108px;color:#d9eee8;z-index:2}.anime-copy b{display:block;color:#f6d899;font-size:13px;margin-bottom:4px}.anime-copy span{font-size:10px;line-height:1.45;opacity:.72}
  .spark{position:absolute;width:5px;height:5px;background:#f5d48d;transform:rotate(45deg);border-radius:1px;animation:sparkle 2.5s ease-in-out infinite}.spark.s1{right:116px;top:26px}.spark.s2{right:24px;top:20px;animation-delay:-1s}.spark.s3{right:78px;top:70px;animation-delay:-1.7s}
  @keyframes mascotFloat{0%,100%{transform:translateY(2px)}50%{transform:translateY(-8px)}}
  @keyframes sparkle{0%,100%{opacity:.2;transform:scale(.7) rotate(45deg)}50%{opacity:1;transform:scale(1.45) rotate(45deg)}}
  .side footer{position:relative;z-index:2;margin-top:0;color:#8eaaa5}
  .main{padding:28px;position:relative;z-index:1}.top{margin-bottom:20px}.top h1{font-size:29px;letter-spacing:-.4px;color:#172c2a}.top p{color:#6c7d7a}.badge{background:rgba(255,255,255,.7);backdrop-filter:blur(10px);border-color:rgba(164,194,186,.5);box-shadow:0 8px 22px rgba(24,58,49,.06)}
  .card{border-color:rgba(185,209,202,.62);background:rgba(255,255,255,.84);backdrop-filter:blur(12px);box-shadow:0 16px 42px rgba(30,64,57,.075)}
  .btn.primary{background:linear-gradient(135deg,#117b61,#2d6e8f);box-shadow:0 7px 18px rgba(22,112,88,.17)}
  .btn.secondary{background:linear-gradient(135deg,#e7f4ef,#edf0fb);color:#245f55}
  input,select{background:rgba(255,255,255,.92);border-color:#c9dcd6}
  .table-wrap,.scroll{box-shadow:inset 0 1px rgba(255,255,255,.7)}
  @media(max-width:980px){.app{grid-template-columns:1fr}.side{padding:13px 12px}.brand{padding:3px 7px 10px}.mark{width:43px;height:43px;border-radius:14px;font-size:21px}.brand b{font-size:18px}.nav{grid-template-columns:1fr 1fr;gap:7px}.nav button{min-height:52px;padding:10px 8px;font-size:11px;text-align:left}.nav .nav-num{width:22px;height:22px;margin-right:4px}.anime-mascot{display:none}.side footer{display:none}.main{padding:14px}.top h1{font-size:22px}}
  @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const nav=document.querySelector('.nav');
  if(nav){
    const map={schedule:'<span class="nav-num">1</span>จัดตารางงานประจำ Week',export:'<span class="nav-num">2</span>Export ตารางงาน',history:'<span class="nav-num">3</span>ปรับเปลี่ยน/ดูตารางงานย้อนหลัง',admin:'<span style="display:inline-block;width:26px;text-align:center;margin-right:8px">⚙</span>Admin'};
    const order=['schedule','export','history','admin'];
    const buttons=[...nav.querySelectorAll('button')];
    order.forEach(k=>{const b=buttons.find(x=>x.dataset.page===k);if(b){b.innerHTML=map[k];nav.appendChild(b)}});
  }

  const brandSmall=document.querySelector('.brand small');if(brandSmall)brandSmall.textContent='Executive Work Planner';

  const side=document.querySelector('.side');
  if(side&&!side.querySelector('.anime-mascot')){
    const box=document.createElement('div');
    box.className='anime-mascot';
    box.innerHTML=`<div class="anime-copy"><b>WEEKLY PLANNER</b><span>วางแผนกะอย่างเป็นระบบ พร้อมสรุปข้อมูลสำหรับบริหาร</span></div><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i>
    <svg viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="j" x1="0" x2="1"><stop stop-color="#456f9e"/><stop offset="1" stop-color="#173b55"/></linearGradient><linearGradient id="h" x1="0" x2="1"><stop stop-color="#2b5b54"/><stop offset="1" stop-color="#122d39"/></linearGradient></defs><circle cx="95" cy="62" r="31" fill="#f6d8c4"/><path d="M62 63c2-35 20-49 43-47 23 2 34 21 31 47-6-8-13-14-25-16-13 12-27 15-49 16z" fill="url(#h)"/><path d="M70 57c-5 10-5 21 1 31-10-5-16-17-13-29 2-11 7-22 16-29z" fill="#183d42"/><ellipse cx="84" cy="65" rx="3" ry="4" fill="#263a42"/><ellipse cx="108" cy="64" rx="3" ry="4" fill="#263a42"/><path d="M91 78c5 4 10 4 15 0" fill="none" stroke="#b26f68" stroke-width="2" stroke-linecap="round"/><path d="M69 154c4-38 15-52 29-55 17-3 35 10 42 55z" fill="url(#j)"/><path d="M91 99l7 25 8-25" fill="#f7f9fb"/><path d="M94 100l4 24 5-24" fill="#e2bc70"/><rect x="107" y="116" width="37" height="29" rx="4" fill="#dfeae8" transform="rotate(-8 107 116)"/><path d="M114 125h20M114 131h16M114 137h19" stroke="#72918b" stroke-width="2" stroke-linecap="round"/></svg>`;
    const footer=side.querySelector('footer');side.insertBefore(box,footer||null);
  }

  const titleMap={
    schedule:['จัดตารางงานประจำ Week','วางแผนตารางพนักงานรายสัปดาห์ จันทร์–อาทิตย์'],
    export:['Export ตารางงาน','ส่งออกตารางตามสาขาและสัปดาห์ที่ต้องการ'],
    history:['ปรับเปลี่ยน/ดูตารางงานย้อนหลัง','เปิดดู แก้ไข และทบทวนตารางงานที่บันทึกแล้ว'],
    admin:['Admin','บริหารฐานข้อมูลและตรวจสอบ DAY Code']
  };
  const originalPage=window.page;
  if(typeof originalPage==='function'){
    window.page=function(n){const r=originalPage.apply(this,arguments);const m=titleMap[n];if(m){const t=document.querySelector('#title'),s=document.querySelector('#subtitle');if(t)t.textContent=m[0];if(s)s.textContent=m[1]}return r};
  }
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.5 · Anime Executive';
})();