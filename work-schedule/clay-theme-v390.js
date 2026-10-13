(()=>{
  document.querySelector('#clayThemeV390')?.remove();
  document.querySelectorAll('.cute-mascot').forEach(x=>x.remove());

  const style=document.createElement('style');
  style.id='clayThemeV390';
  style.textContent=`
    :root{
      --clay-bg:#eef6ef;--clay-surface:#ffffff;--clay-panel:#dfeee2;
      --clay-red:#6f9d5e;--clay-red-deep:#3f7047;--clay-peach:#98c39a;
      --clay-mint:#c8dab6;--clay-blue:#e2f0e4;--clay-purple:#edf7ef;
      --clay-ink:#304034;--clay-muted:#6c7865;--clay-line:#d1e3d4;
      --clay-raised:10px 10px 22px rgba(81,105,72,.16),-8px -8px 18px rgba(255,255,255,.94),inset 1px 1px 1px rgba(255,255,255,.78);
      --clay-small:5px 5px 12px rgba(81,105,72,.15),-4px -4px 10px rgba(255,255,255,.92),inset 1px 1px 1px rgba(255,255,255,.75);
      --clay-pressed:inset 4px 4px 9px rgba(81,105,72,.18),inset -4px -4px 8px rgba(255,255,255,.76);
      --bg:var(--clay-bg);--card:var(--clay-surface);--ink:var(--clay-ink);--muted:var(--clay-muted);
      --line:var(--clay-line);--brand:var(--clay-red);--brand2:var(--clay-red-deep);--danger:#355e3b;
    }
    html{background:var(--clay-bg)}
    body{background:radial-gradient(circle at 92% 8%,#d7ebda 0 8%,transparent 27%),radial-gradient(circle at 18% 88%,#eef7ef 0 8%,transparent 30%),linear-gradient(145deg,#ffffff 0%,#eef6ef 52%,#e4f1e6 100%)!important;color:var(--clay-ink)!important;position:relative}
    body:before,body:after{content:""!important;display:block!important;position:fixed!important;pointer-events:none!important;z-index:0!important;filter:none!important;opacity:1!important;animation:clayFloat 8s ease-in-out infinite alternate!important}
    body:before{width:180px!important;height:180px!important;right:4vw!important;top:10vh!important;border-radius:42% 58% 55% 45%/46% 43% 57% 54%!important;background:#98c39a!important;box-shadow:18px 18px 35px rgba(71,103,62,.14),inset 12px 12px 22px rgba(255,255,255,.4),inset -10px -12px 20px rgba(53,91,47,.12)!important}
    body:after{width:135px!important;height:135px!important;left:19vw!important;bottom:6vh!important;border-radius:58% 42% 39% 61%/47% 58% 42% 53%!important;background:#d9ecdc!important;box-shadow:14px 16px 30px rgba(77,105,68,.13),inset 10px 10px 18px rgba(255,255,255,.44),inset -9px -10px 18px rgba(64,94,58,.1)!important;animation-delay:-3s!important}
    @keyframes clayFloat{to{transform:translateY(-13px) rotate(3deg)}}
    .app{position:relative;z-index:1;grid-template-columns:282px minmax(0,1fr)!important}
    .side{background:linear-gradient(155deg,#ffffff,#e6f1e8)!important;color:var(--clay-ink)!important;border:0!important;border-radius:0 34px 34px 0!important;padding:24px 20px!important;box-shadow:14px 0 30px rgba(70,92,64,.14),inset -2px 0 2px rgba(255,255,255,.74)!important;overflow:hidden!important}
    .side:before{display:block!important;content:""!important;position:absolute!important;width:165px!important;height:165px!important;left:-62px!important;top:-63px!important;border-radius:45% 55% 61% 39%!important;background:#83b486!important;box-shadow:inset 12px 12px 18px rgba(255,255,255,.34),inset -10px -10px 18px rgba(50,89,45,.12)!important;animation:clayFloat 7s ease-in-out infinite alternate!important}
    .side:after{display:block!important;content:""!important;position:absolute!important;width:108px!important;height:108px!important;right:-45px!important;bottom:74px!important;border:0!important;border-radius:56% 44% 58% 42%!important;background:#d5ead8!important;box-shadow:inset 9px 9px 14px rgba(255,255,255,.42),inset -8px -8px 14px rgba(60,103,54,.1)!important;animation:clayFloat 9s ease-in-out infinite alternate-reverse!important}
    .brand{position:relative;z-index:2;padding:8px 6px 24px!important;gap:14px!important}
    .mark{width:58px!important;height:58px!important;border-radius:22px 18px 24px 19px!important;background:linear-gradient(145deg,#7fac69,#4f824f)!important;color:#fff!important;font-size:25px!important;box-shadow:8px 9px 17px rgba(52,91,50,.25),-5px -5px 12px rgba(255,255,255,.75),inset 4px 4px 8px rgba(255,255,255,.27),inset -5px -5px 9px rgba(37,78,37,.16)!important;animation:clayWobble 5s ease-in-out infinite!important}
    @keyframes clayWobble{0%,100%{transform:rotate(-2deg) translateY(0)}50%{transform:rotate(2deg) translateY(-4px)}}
    .brand b{color:#35553a!important;font-size:22px!important}.brand small{color:#71806a!important;opacity:1!important;font-weight:700!important}
    .nav{position:relative;z-index:2;gap:12px!important}
    .nav button{min-height:60px!important;border:0!important;border-radius:19px 23px 18px 22px!important;background:linear-gradient(145deg,#ffffff,#e5f1e7)!important;color:#48604b!important;padding:13px 13px!important;font-weight:850!important;box-shadow:var(--clay-small)!important;transition:transform .18s ease,box-shadow .18s ease!important;overflow:hidden!important}
    .nav button:after{content:""!important;position:absolute!important;width:52px!important;height:52px!important;border-radius:50%!important;right:-23px!important;top:-25px!important;background:rgba(105,151,84,.14)!important}
    .nav button:hover{transform:translateY(-3px) rotate(-.25deg)!important;background:linear-gradient(145deg,#fff,#edf6ef)!important;box-shadow:8px 9px 17px rgba(81,105,72,.18),-5px -5px 12px rgba(255,255,255,.96)!important}
    .nav button.active{color:#fff!important;background:linear-gradient(145deg,#7eac68,#4c804d)!important;box-shadow:var(--clay-pressed),5px 6px 12px rgba(55,91,50,.19)!important;transform:translateY(1px)!important}
    .nav .nav-num,.nav button>span:first-child{border:0!important;border-radius:10px 13px 9px 12px!important;background:#d9ecdc!important;color:#4f7648!important;box-shadow:2px 3px 6px rgba(75,99,67,.13),inset 1px 1px 2px rgba(255,255,255,.64)!important}
    .nav button.active .nav-num{background:#f3faf4!important;color:#477344!important;box-shadow:inset 2px 2px 4px rgba(72,98,65,.13)!important}
    .side footer{position:relative;z-index:2;color:#71806b!important;font-weight:800!important}
    .main{padding:30px!important;position:relative;z-index:1}
    .top{margin-bottom:22px!important}.top h1{color:#34523a!important;font-size:30px!important;font-weight:950!important;letter-spacing:-.5px!important}.top p{color:#71806b!important;font-weight:650!important}
    .badge,.admin-api350,.pill{border:0!important;border-radius:999px!important;background:#ffffff!important;color:#596b57!important;box-shadow:var(--clay-small)!important;font-weight:850!important}
    .card,.metric,.export-btn,.crud-box350,.version-box340{border:0!important;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(229,242,232,.97))!important;border-radius:25px 31px 24px 29px!important;box-shadow:var(--clay-raised)!important}
    .card{padding:20px!important;margin-bottom:20px!important}.section-head h2{color:#3b5a40!important;font-weight:950!important}.section-head p,.filters label,.field{color:#71806b!important;font-weight:700!important}
    input,select,textarea{border:0!important;border-radius:14px 18px 13px 17px!important;background:#eef7ef!important;color:#3d5141!important;box-shadow:var(--clay-pressed)!important;font-weight:700!important}
    input:focus,select:focus,textarea:focus{outline:3px solid rgba(93,139,74,.2)!important;background:#ffffff!important}
    .btn{border:0!important;border-radius:14px 18px 13px 17px!important;font-weight:900!important;box-shadow:var(--clay-small)!important;transition:.18s ease!important}
    .btn:hover{transform:translateY(-2px)!important}.btn:active{transform:translateY(1px)!important;box-shadow:var(--clay-pressed)!important}
    .btn.primary{background:linear-gradient(145deg,#7eac68,#4c804d)!important;color:#fff!important}.btn.secondary{background:linear-gradient(145deg,#dbeede,#bad1a7)!important;color:#355e3b!important}.btn.ghost{background:linear-gradient(145deg,#ffffff,#e9f3eb)!important;color:#4f624f!important;border:0!important}.btn.danger{background:linear-gradient(145deg,#b8cfa6,#88aa76)!important;color:#294b31!important;border:0!important}
    .table-wrap,.scroll,.version-preview-scroll340{border:0!important;border-radius:20px 24px 19px 23px!important;background:#e5f1e7!important;box-shadow:var(--clay-pressed)!important;padding:5px!important}
    .schedule,.data,.version-preview-table340{border-radius:16px!important;overflow:hidden!important}
    .schedule th,.schedule td,.data th,.data td,.version-preview-table340 th,.version-preview-table340 td{border-color:#d9decb!important}
    .schedule thead th,.data th,.version-preview-table340 th{background:linear-gradient(180deg,#c9dcb7,#abc792)!important;color:#34523a!important;font-weight:950!important}
    .schedule td,.data td,.version-preview-table340 td{background:rgba(255,255,255,.94)!important}
    .schedule tbody tr:nth-child(even) td,.data tbody tr:nth-child(even) td{background:rgba(237,247,239,.94)!important}
    .schedule .employee{background:#ffffff!important;box-shadow:5px 0 10px rgba(73,95,65,.08)!important}.schedule thead .employee{background:linear-gradient(180deg,#bdd3aa,#9fbe85)!important}
    .cell input,.cell select,.note{background:#ffffff!important;box-shadow:inset 2px 2px 5px rgba(77,101,69,.15),inset -2px -2px 4px rgba(255,255,255,.88)!important;border-radius:10px 13px 9px 12px!important}
    .legend{gap:10px!important}.pill{padding:7px 11px!important}.pill.ot{background:#e2f0e4!important;color:#456348!important}.pill.h{background:#deeee1!important;color:#426346!important}.pill.vl{background:#edf6ee!important;color:#5e6b55!important}.pill.ex{background:#c5d8b4!important;color:#38573d!important}
    .tabs{gap:10px!important}.tabs button{border:0!important;border-radius:13px 17px 12px 16px!important;background:#eaf4ec!important;color:#596b57!important;box-shadow:var(--clay-small)!important;font-weight:850!important}.tabs button.active{background:linear-gradient(145deg,#7eac68,#4c804d)!important;color:#fff!important;box-shadow:var(--clay-pressed)!important}
    .metric{padding:18px!important}.metric strong{color:#477947!important}.upload{border:3px dashed #b7c9a7!important;background:#ffffff!important;border-radius:24px!important}.upload.drag{background:#e4f0e6!important;border-color:#719c5f!important}
    .notice{border:0!important;background:#e4f1e6!important;color:#596037!important;border-radius:15px 19px 14px 18px!important;box-shadow:var(--clay-small)!important}.toast{background:#3f6445!important;border-radius:14px 18px 13px 17px!important;box-shadow:8px 10px 24px rgba(45,72,48,.24)!important}.toast.error{background:#315738!important}
    .export-btn:hover{transform:translateY(-4px) rotate(-.2deg)!important;box-shadow:13px 14px 27px rgba(81,105,72,.18),-8px -8px 17px rgba(255,255,255,.96)!important}.export-btn b{background:#d5e2c5!important;color:#436d42!important;border-radius:14px 18px 13px 17px!important;box-shadow:var(--clay-small)!important}
    .crud-modal350,.version-modal340{background:rgba(47,65,49,.34)!important;backdrop-filter:blur(8px)!important}.crud-head350 h3,.version-head340 h3{color:#3b5a40!important}
    @media(max-width:1180px){
      .app{display:block!important}.side{border-radius:0 0 24px 24px!important;background:linear-gradient(145deg,#ffffff,#e5f1e7)!important;box-shadow:0 9px 22px rgba(70,93,64,.14)!important}.side:before,.side:after{display:none!important}.main{padding:13px!important}.nav button{box-shadow:3px 4px 9px rgba(78,103,70,.14),-3px -3px 7px rgba(255,255,255,.84)!important}.card{border-radius:19px 23px 18px 22px!important;padding:13px!important}
    }
    @media(max-width:700px){
      body:before,body:after{display:none!important}.side{border-radius:0 0 18px 18px!important}.main{padding:7px!important}.top h1{font-size:19px!important}.card{border-radius:15px 18px 14px 17px!important;padding:9px!important;box-shadow:6px 7px 15px rgba(81,105,72,.13),-4px -4px 10px rgba(255,255,255,.87)!important}.nav button{border-radius:11px 14px 10px 13px!important}.table-wrap,.scroll{border-radius:13px 16px 12px 15px!important;padding:3px!important}
    }
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const brandSmall=document.querySelector('.brand small');
  if(brandSmall)brandSmall.textContent='Clay Work Planner';
  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 3.9.2 · Green & White Clay Theme';
})();

