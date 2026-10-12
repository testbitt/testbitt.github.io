(()=>{
  document.querySelector('#clayThemeV390')?.remove();
  document.querySelectorAll('.cute-mascot').forEach(x=>x.remove());

  const style=document.createElement('style');
  style.id='clayThemeV390';
  style.textContent=`
    :root{
      --clay-bg:#f7efec;--clay-surface:#fff9f6;--clay-panel:#f4ded8;
      --clay-red:#e65353;--clay-red-deep:#b9363f;--clay-peach:#f5a58f;
      --clay-mint:#bfe2d3;--clay-blue:#bfd6ef;--clay-purple:#d9c7ee;
      --clay-ink:#443533;--clay-muted:#846d68;--clay-line:#ead3cd;
      --clay-raised:10px 10px 22px rgba(151,105,95,.16),-8px -8px 18px rgba(255,255,255,.92),inset 1px 1px 1px rgba(255,255,255,.75);
      --clay-small:5px 5px 12px rgba(151,105,95,.15),-4px -4px 10px rgba(255,255,255,.9),inset 1px 1px 1px rgba(255,255,255,.72);
      --clay-pressed:inset 4px 4px 9px rgba(151,105,95,.18),inset -4px -4px 8px rgba(255,255,255,.72);
      --bg:var(--clay-bg);--card:var(--clay-surface);--ink:var(--clay-ink);--muted:var(--clay-muted);
      --line:var(--clay-line);--brand:var(--clay-red);--brand2:var(--clay-red-deep);--danger:#b9363f;
    }
    html{background:var(--clay-bg)}
    body{background:radial-gradient(circle at 92% 8%,#fbd4ca 0 8%,transparent 27%),radial-gradient(circle at 18% 88%,#d7eee4 0 8%,transparent 30%),linear-gradient(145deg,#fff8f4 0%,#f7efec 52%,#f1e5e2 100%)!important;color:var(--clay-ink)!important;position:relative}
    body:before,body:after{content:""!important;display:block!important;position:fixed!important;pointer-events:none!important;z-index:0!important;filter:none!important;opacity:1!important;animation:clayFloat 8s ease-in-out infinite alternate!important}
    body:before{width:180px!important;height:180px!important;right:4vw!important;top:10vh!important;border-radius:42% 58% 55% 45%/46% 43% 57% 54%!important;background:#f4aa98!important;box-shadow:18px 18px 35px rgba(159,93,82,.13),inset 12px 12px 22px rgba(255,255,255,.35),inset -10px -12px 20px rgba(172,76,70,.12)!important}
    body:after{width:135px!important;height:135px!important;left:19vw!important;bottom:6vh!important;border-radius:58% 42% 39% 61%/47% 58% 42% 53%!important;background:#bddfce!important;box-shadow:14px 16px 30px rgba(72,122,101,.13),inset 10px 10px 18px rgba(255,255,255,.4),inset -9px -10px 18px rgba(66,126,100,.1)!important;animation-delay:-3s!important}
    @keyframes clayFloat{to{transform:translateY(-13px) rotate(3deg)}}
    .app{position:relative;z-index:1;grid-template-columns:282px minmax(0,1fr)!important}
    .side{background:linear-gradient(155deg,#fff7f3,#f1dcd7)!important;color:var(--clay-ink)!important;border:0!important;border-radius:0 34px 34px 0!important;padding:24px 20px!important;box-shadow:14px 0 30px rgba(129,84,77,.14),inset -2px 0 2px rgba(255,255,255,.7)!important;overflow:hidden!important}
    .side:before{display:block!important;content:""!important;position:absolute!important;width:165px!important;height:165px!important;left:-62px!important;top:-63px!important;border-radius:45% 55% 61% 39%!important;background:#f1a28f!important;box-shadow:inset 12px 12px 18px rgba(255,255,255,.3),inset -10px -10px 18px rgba(169,74,66,.12)!important;animation:clayFloat 7s ease-in-out infinite alternate!important}
    .side:after{display:block!important;content:""!important;position:absolute!important;width:108px!important;height:108px!important;right:-45px!important;bottom:74px!important;border:0!important;border-radius:56% 44% 58% 42%!important;background:#c5dfd4!important;box-shadow:inset 9px 9px 14px rgba(255,255,255,.38),inset -8px -8px 14px rgba(62,116,93,.1)!important;animation:clayFloat 9s ease-in-out infinite alternate-reverse!important}
    .brand{position:relative;z-index:2;padding:8px 6px 24px!important;gap:14px!important}
    .mark{width:58px!important;height:58px!important;border-radius:22px 18px 24px 19px!important;background:linear-gradient(145deg,#f46b67,#d9454d)!important;color:#fff!important;font-size:25px!important;box-shadow:8px 9px 17px rgba(164,58,62,.25),-5px -5px 12px rgba(255,255,255,.7),inset 4px 4px 8px rgba(255,255,255,.24),inset -5px -5px 9px rgba(146,39,47,.16)!important;animation:clayWobble 5s ease-in-out infinite!important}
    @keyframes clayWobble{0%,100%{transform:rotate(-2deg) translateY(0)}50%{transform:rotate(2deg) translateY(-4px)}}
    .brand b{color:#713f3d!important;font-size:22px!important}.brand small{color:#9a716b!important;opacity:1!important;font-weight:700!important}
    .nav{position:relative;z-index:2;gap:12px!important}
    .nav button{min-height:60px!important;border:0!important;border-radius:19px 23px 18px 22px!important;background:linear-gradient(145deg,#fffaf7,#f2dfda)!important;color:#6d4c48!important;padding:13px 13px!important;font-weight:850!important;box-shadow:var(--clay-small)!important;transition:transform .18s ease,box-shadow .18s ease!important;overflow:hidden!important}
    .nav button:after{content:""!important;position:absolute!important;width:52px!important;height:52px!important;border-radius:50%!important;right:-23px!important;top:-25px!important;background:rgba(236,99,93,.13)!important}
    .nav button:hover{transform:translateY(-3px) rotate(-.25deg)!important;background:linear-gradient(145deg,#fff,#f5e4df)!important;box-shadow:8px 9px 17px rgba(151,105,95,.18),-5px -5px 12px rgba(255,255,255,.95)!important}
    .nav button.active{color:#fff!important;background:linear-gradient(145deg,#f36763,#d9434c)!important;box-shadow:var(--clay-pressed),5px 6px 12px rgba(160,60,64,.18)!important;transform:translateY(1px)!important}
    .nav .nav-num,.nav button>span:first-child{border:0!important;border-radius:10px 13px 9px 12px!important;background:#f6cdc4!important;color:#a44242!important;box-shadow:2px 3px 6px rgba(133,72,66,.13),inset 1px 1px 2px rgba(255,255,255,.6)!important}
    .nav button.active .nav-num{background:#fff1ed!important;color:#c34145!important;box-shadow:inset 2px 2px 4px rgba(143,72,69,.13)!important}
    .side footer{position:relative;z-index:2;color:#9c756f!important;font-weight:800!important}
    .main{padding:30px!important;position:relative;z-index:1}
    .top{margin-bottom:22px!important}.top h1{color:#68403d!important;font-size:30px!important;font-weight:950!important;letter-spacing:-.5px!important}.top p{color:#997871!important;font-weight:650!important}
    .badge,.admin-api350,.pill{border:0!important;border-radius:999px!important;background:#fff5f1!important;color:#8c625c!important;box-shadow:var(--clay-small)!important;font-weight:850!important}
    .card,.metric,.export-btn,.crud-box350,.version-box340{border:0!important;background:linear-gradient(145deg,rgba(255,251,248,.98),rgba(244,228,223,.97))!important;border-radius:25px 31px 24px 29px!important;box-shadow:var(--clay-raised)!important}
    .card{padding:20px!important;margin-bottom:20px!important}.section-head h2{color:#6d4542!important;font-weight:950!important}.section-head p,.filters label,.field{color:#96746e!important;font-weight:700!important}
    input,select,textarea{border:0!important;border-radius:14px 18px 13px 17px!important;background:#f9ebe7!important;color:#5c413e!important;box-shadow:var(--clay-pressed)!important;font-weight:700!important}
    input:focus,select:focus,textarea:focus{outline:3px solid rgba(226,83,83,.16)!important;background:#fff6f3!important}
    .btn{border:0!important;border-radius:14px 18px 13px 17px!important;font-weight:900!important;box-shadow:var(--clay-small)!important;transition:.18s ease!important}
    .btn:hover{transform:translateY(-2px)!important}.btn:active{transform:translateY(1px)!important;box-shadow:var(--clay-pressed)!important}
    .btn.primary{background:linear-gradient(145deg,#f26461,#d8424b)!important;color:#fff!important}.btn.secondary{background:linear-gradient(145deg,#d7eee4,#add5c4)!important;color:#356756!important}.btn.ghost{background:linear-gradient(145deg,#fffaf7,#eddad5)!important;color:#77514c!important;border:0!important}.btn.danger{background:linear-gradient(145deg,#f7c5c0,#eb9995)!important;color:#8e3236!important;border:0!important}
    .table-wrap,.scroll,.version-preview-scroll340{border:0!important;border-radius:20px 24px 19px 23px!important;background:#f7e9e5!important;box-shadow:var(--clay-pressed)!important;padding:5px!important}
    .schedule,.data,.version-preview-table340{border-radius:16px!important;overflow:hidden!important}
    .schedule th,.schedule td,.data th,.data td,.version-preview-table340 th,.version-preview-table340 td{border-color:#ead7d1!important}
    .schedule thead th,.data th,.version-preview-table340 th{background:linear-gradient(180deg,#f4c9c0,#efb9b0)!important;color:#744b47!important;font-weight:950!important}
    .schedule td,.data td,.version-preview-table340 td{background:rgba(255,250,247,.92)!important}
    .schedule tbody tr:nth-child(even) td,.data tbody tr:nth-child(even) td{background:rgba(250,238,234,.92)!important}
    .schedule .employee{background:#fff8f5!important;box-shadow:5px 0 10px rgba(137,91,82,.08)!important}.schedule thead .employee{background:linear-gradient(180deg,#f2c2b8,#ebab9f)!important}
    .cell input,.cell select,.note{background:#fff8f5!important;box-shadow:inset 2px 2px 5px rgba(145,100,91,.15),inset -2px -2px 4px rgba(255,255,255,.85)!important;border-radius:10px 13px 9px 12px!important}
    .legend{gap:10px!important}.pill{padding:7px 11px!important}.pill.ot{background:#f8e5b0!important;color:#80601b!important}.pill.h{background:#cfe1f4!important;color:#3e6287!important}.pill.vl{background:#e2d2f0!important;color:#705486!important}.pill.ex{background:#f5c3c2!important;color:#8c4649!important}
    .tabs{gap:10px!important}.tabs button{border:0!important;border-radius:13px 17px 12px 16px!important;background:#f7e6e1!important;color:#805d57!important;box-shadow:var(--clay-small)!important;font-weight:850!important}.tabs button.active{background:linear-gradient(145deg,#ef6964,#d8444b)!important;color:#fff!important;box-shadow:var(--clay-pressed)!important}
    .metric{padding:18px!important}.metric strong{color:#bc4145!important}.upload{border:3px dashed #deb9b0!important;background:#fff6f2!important;border-radius:24px!important}.upload.drag{background:#f5dcd5!important;border-color:#df6a64!important}
    .notice{border:0!important;background:#f8e2b8!important;color:#735625!important;border-radius:15px 19px 14px 18px!important;box-shadow:var(--clay-small)!important}.toast{background:#7c4845!important;border-radius:14px 18px 13px 17px!important;box-shadow:8px 10px 24px rgba(92,53,50,.24)!important}.toast.error{background:#ac383f!important}
    .export-btn:hover{transform:translateY(-4px) rotate(-.2deg)!important;box-shadow:13px 14px 27px rgba(151,105,95,.18),-8px -8px 17px rgba(255,255,255,.95)!important}.export-btn b{background:#f4c7bd!important;color:#b44143!important;border-radius:14px 18px 13px 17px!important;box-shadow:var(--clay-small)!important}
    .crud-modal350,.version-modal340{background:rgba(90,61,57,.36)!important;backdrop-filter:blur(8px)!important}.crud-head350 h3,.version-head340 h3{color:#754743!important}
    @media(max-width:1180px){
      .app{display:block!important}.side{border-radius:0 0 24px 24px!important;background:linear-gradient(145deg,#fff7f3,#eed8d2)!important;box-shadow:0 9px 22px rgba(126,83,76,.14)!important}.side:before,.side:after{display:none!important}.main{padding:13px!important}.nav button{box-shadow:3px 4px 9px rgba(143,98,90,.14),-3px -3px 7px rgba(255,255,255,.82)!important}.card{border-radius:19px 23px 18px 22px!important;padding:13px!important}
    }
    @media(max-width:700px){
      body:before,body:after{display:none!important}.side{border-radius:0 0 18px 18px!important}.main{padding:7px!important}.top h1{font-size:19px!important}.card{border-radius:15px 18px 14px 17px!important;padding:9px!important;box-shadow:6px 7px 15px rgba(151,105,95,.13),-4px -4px 10px rgba(255,255,255,.85)!important}.nav button{border-radius:11px 14px 10px 13px!important}.table-wrap,.scroll{border-radius:13px 16px 12px 15px!important;padding:3px!important}
    }
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const brandSmall=document.querySelector('.brand small');
  if(brandSmall)brandSmall.textContent='Clay Work Planner';
  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 3.9 · Clay Theme';
})();
