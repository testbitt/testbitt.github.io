(()=>{
  document.querySelector('#greenCreamGoldClayV397')?.remove();

  const style=document.createElement('style');
  style.id='greenCreamGoldClayV397';
  style.textContent=`
    :root{
      --k-green-900:#254b3c;
      --k-green-800:#32624d;
      --k-green-700:#4c7b5d;
      --k-green-600:#65956c;
      --k-green-400:#9fbe8b;
      --k-green-200:#dcebd8;
      --k-green-100:#edf5ea;
      --k-cream-50:#fffdf7;
      --k-cream-100:#fbf6e9;
      --k-cream-200:#f3ead6;
      --k-gold-700:#9b7729;
      --k-gold-600:#b89138;
      --k-gold-500:#c9a64d;
      --k-gold-300:#e6d08e;
      --k-gold-100:#f5ecd2;
      --k-white:#ffffff;
      --k-ink:#2d4136;
      --k-muted:#748075;
      --k-line:#d8e1d2;
      --k-shadow:10px 12px 24px rgba(63,86,61,.14),-7px -7px 18px rgba(255,255,255,.94),inset 1px 1px 1px rgba(255,255,255,.78);
      --k-shadow-sm:5px 6px 14px rgba(63,86,61,.13),-4px -4px 10px rgba(255,255,255,.9),inset 1px 1px 1px rgba(255,255,255,.7);
      --k-pressed:inset 4px 4px 9px rgba(70,92,65,.15),inset -4px -4px 8px rgba(255,255,255,.8);
      --bg:var(--k-cream-100)!important;
      --card:var(--k-cream-50)!important;
      --ink:var(--k-ink)!important;
      --muted:var(--k-muted)!important;
      --line:var(--k-line)!important;
      --brand:var(--k-green-700)!important;
      --brand2:var(--k-green-900)!important;
      --accent:var(--k-gold-500)!important;
    }

    html{background:var(--k-cream-100)!important}
    body{
      color:var(--k-ink)!important;
      background:
        radial-gradient(circle at 91% 7%,rgba(201,166,77,.20) 0 7%,transparent 24%),
        radial-gradient(circle at 14% 91%,rgba(101,149,108,.14) 0 9%,transparent 27%),
        linear-gradient(145deg,#fffefb 0%,#fbf6e9 45%,#eef5ea 100%)!important;
    }
    body:before{
      background:linear-gradient(145deg,#9fbe8b,#759d72)!important;
      box-shadow:18px 18px 35px rgba(62,87,60,.13),inset 12px 12px 22px rgba(255,255,255,.38),inset -10px -12px 20px rgba(54,77,49,.12)!important;
    }
    body:after{
      background:linear-gradient(145deg,#f5ecd2,#e6d08e)!important;
      box-shadow:14px 16px 30px rgba(146,112,41,.12),inset 10px 10px 18px rgba(255,255,255,.52),inset -9px -10px 18px rgba(143,108,37,.09)!important;
    }

    .side{
      background:linear-gradient(160deg,#fffefb 0%,#f8f1df 54%,#e9f3e6 100%)!important;
      box-shadow:15px 0 30px rgba(70,86,61,.13),inset -2px 0 2px rgba(255,255,255,.82)!important;
    }
    .side:before{background:linear-gradient(145deg,#6f9d6c,#4c7b5d)!important}
    .side:after{background:linear-gradient(145deg,#f5ecd2,#e1ca83)!important}
    .mark{
      background:linear-gradient(145deg,#739b70,#436f55)!important;
      box-shadow:8px 9px 17px rgba(55,83,59,.24),-5px -5px 12px rgba(255,255,255,.76),inset 4px 4px 8px rgba(255,255,255,.28),inset -5px -5px 9px rgba(34,67,43,.17)!important;
      border:1px solid rgba(201,166,77,.45)!important;
    }
    .brand b,.top h1,.section-head h2,.crud-head350 h3,.version-head340 h3{color:var(--k-green-900)!important}
    .brand small,.top p,.section-head p,.filters label,.field,.side footer{color:var(--k-muted)!important}

    .nav button{
      background:linear-gradient(145deg,#fffefb,#f4eddc)!important;
      color:#526453!important;
      box-shadow:var(--k-shadow-sm)!important;
      border:1px solid rgba(201,166,77,.16)!important;
    }
    .nav button:hover{
      background:linear-gradient(145deg,#ffffff,#f8f1df)!important;
      box-shadow:8px 9px 17px rgba(75,91,65,.16),-5px -5px 12px rgba(255,255,255,.96)!important;
    }
    .nav button.active{
      background:linear-gradient(145deg,#759b6d,#456f55)!important;
      color:#fff!important;
      border:1px solid rgba(230,208,142,.72)!important;
      box-shadow:var(--k-pressed),0 0 0 2px rgba(201,166,77,.18),5px 6px 12px rgba(55,76,50,.18)!important;
    }
    .nav .nav-num,.nav button>span:first-child{
      background:linear-gradient(145deg,#f6edcf,#dfc77c)!important;
      color:#6e5721!important;
    }
    .nav button.active .nav-num{
      background:linear-gradient(145deg,#fff9e9,#ead795)!important;
      color:#6b5520!important;
    }

    .card,.metric,.export-btn,.crud-box350,.version-box340{
      background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(251,246,233,.98))!important;
      border:1px solid rgba(201,166,77,.14)!important;
      box-shadow:var(--k-shadow)!important;
    }
    .badge,.admin-api350,.pill{
      background:linear-gradient(145deg,#ffffff,#f7f0dd)!important;
      color:#5e695e!important;
      border:1px solid rgba(201,166,77,.14)!important;
    }

    input,select,textarea{
      background:#fffdf7!important;
      color:var(--k-ink)!important;
      box-shadow:var(--k-pressed)!important;
      border:1px solid #dce4d6!important;
    }
    input:focus,select:focus,textarea:focus{
      background:#fff!important;
      border-color:#c9a64d!important;
      outline:3px solid rgba(201,166,77,.16)!important;
    }

    .btn{
      box-shadow:var(--k-shadow-sm)!important;
      border:1px solid rgba(201,166,77,.12)!important;
    }
    .btn.primary{
      background:linear-gradient(145deg,#719867,#466f55)!important;
      color:#fff!important;
      border-color:rgba(230,208,142,.55)!important;
    }
    .btn.secondary{
      background:linear-gradient(145deg,#e9f1df,#c8d9b8)!important;
      color:#345740!important;
    }
    .btn.ghost{
      background:linear-gradient(145deg,#fffefb,#f5ecd9)!important;
      color:#536054!important;
    }
    .btn.danger{
      background:linear-gradient(145deg,#f1e6c7,#d8bf72)!important;
      color:#654f20!important;
    }
    #addBranchBtn350,#addEmployeeBtn{
      background:linear-gradient(145deg,#769d6c,#4a7357)!important;
      color:white!important;
      border:1px solid rgba(230,208,142,.65)!important;
    }

    .tabs button{
      background:linear-gradient(145deg,#fffdf8,#f1ead8)!important;
      color:#617062!important;
      border:1px solid rgba(201,166,77,.12)!important;
      box-shadow:var(--k-shadow-sm)!important;
    }
    .tabs button.active{
      background:linear-gradient(145deg,#719867,#456e54)!important;
      color:#fff!important;
      border-color:#d4b967!important;
      box-shadow:var(--k-pressed),0 0 0 2px rgba(201,166,77,.14)!important;
    }

    .table-wrap,.scroll,.version-preview-scroll340{
      background:linear-gradient(145deg,#f0f4e8,#f7f0df)!important;
      box-shadow:var(--k-pressed)!important;
      border:1px solid rgba(201,166,77,.12)!important;
    }
    .schedule thead th,.data th,.version-preview-table340 th{
      background:linear-gradient(180deg,#d9e7cb 0%,#b9d09e 72%,#d9c77f 100%)!important;
      color:#314d3c!important;
      border-color:#d9d8b8!important;
    }
    .schedule thead .employee{
      background:linear-gradient(180deg,#d2e2c1 0%,#aec994 72%,#d7c478 100%)!important;
    }
    .schedule td,.data td,.version-preview-table340 td{
      background:rgba(255,254,250,.97)!important;
      border-color:#e6dfcd!important;
    }
    .schedule tbody tr:nth-child(even) td,.data tbody tr:nth-child(even) td{
      background:rgba(243,248,239,.97)!important;
    }

    .pill.ot{background:#f5ecd2!important;color:#775d20!important}
    .pill.h{background:#e6f0df!important;color:#426247!important}
    .pill.vl{background:#fff7e6!important;color:#806626!important}
    .pill.ex{background:#e9dfb9!important;color:#66501e!important}
    .metric strong{color:var(--k-green-700)!important}
    .notice{
      background:linear-gradient(145deg,#fff8e6,#f4ead0)!important;
      color:#6e5a26!important;
      border:1px solid rgba(201,166,77,.24)!important;
    }
    .upload{
      background:#fffdf7!important;
      border-color:#d6c27d!important;
    }
    .upload.drag{
      background:#edf5ea!important;
      border-color:#70966b!important;
    }
    .toast{
      background:linear-gradient(145deg,#4e775c,#315944)!important;
      box-shadow:8px 10px 24px rgba(45,72,48,.22),0 0 0 2px rgba(201,166,77,.16)!important;
    }
    .toast.error{background:linear-gradient(145deg,#9b7040,#775128)!important}

    ::selection{background:#e6d08e;color:#304234}

    @media(max-width:1180px){
      .side{background:linear-gradient(145deg,#fffefb,#f7f0df 60%,#eaf3e6)!important}
    }
  `;
  document.head.appendChild(style);

  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content','#f7f0df');
  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 3.9.7 · Green Cream Gold Clay';
})();