(()=>{
  const style=document.createElement('style');
  style.id='responsiveLayoutV260Style';
  style.textContent=`
    /* ---------- Shared responsive improvements ---------- */
    html,body{min-width:0!important}
    .main{min-width:0!important}
    .table-wrap,.scroll{scrollbar-gutter:stable;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    .schedule{touch-action:pan-x pan-y}

    /* Give medium notebook screens a little more workspace. */
    @media (min-width:1181px) and (max-width:1450px){
      .app{grid-template-columns:238px minmax(0,1fr)!important}
      .side{padding-left:12px!important;padding-right:12px!important}
      .main{padding:20px!important}
      #page-schedule .table-wrap{max-height:72vh!important}
      .schedule .employee{min-width:185px!important}
      .schedule th.day{min-width:195px!important}
    }

    /* ---------- Tablet / small notebook ---------- */
    @media (max-width:1180px){
      .app{display:block!important;min-height:100dvh!important}
      .side{
        position:sticky!important;top:0!important;z-index:80!important;
        width:100%!important;height:auto!important;min-height:0!important;
        padding:7px 10px!important;
        display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;
        align-items:center!important;gap:9px!important;
        overflow:visible!important;border-right:0!important;border-bottom:1px solid #d7eee5!important;
        box-shadow:0 7px 22px rgba(29,113,87,.07)!important;
      }
      .side:before,.side:after{display:none!important}
      .brand{padding:0!important;gap:8px!important;min-width:max-content!important}
      .mark{width:38px!important;height:38px!important;border-radius:12px!important;font-size:13px!important;animation:none!important}
      .brand b{font-size:16px!important;line-height:1.1!important}
      .brand small{font-size:9.5px!important;line-height:1.1!important;white-space:nowrap!important}
      .cute-mascot,.side footer{display:none!important}
      .nav{
        display:flex!important;grid-template-columns:none!important;gap:6px!important;
        overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap!important;
        scrollbar-width:none!important;padding:1px!important;
      }
      .nav::-webkit-scrollbar{display:none!important}
      .nav button{
        flex:0 0 auto!important;min-height:38px!important;height:38px!important;
        padding:6px 9px!important;border-radius:12px!important;font-size:11px!important;
        line-height:1.1!important;text-align:center!important;box-shadow:none!important;
      }
      .nav button:hover{transform:none!important}
      .nav .nav-num{width:20px!important;height:20px!important;border-radius:7px!important;margin-right:4px!important;font-size:10px!important}

      .main{padding:9px 10px 12px!important;width:100%!important;max-width:none!important}
      .top{margin-bottom:8px!important;min-height:38px!important;gap:8px!important}
      .top h1{font-size:21px!important;line-height:1.15!important}
      .top p{font-size:11px!important;margin-top:2px!important}
      .badge{padding:6px 8px!important;font-size:10px!important;white-space:nowrap!important}
      .card{border-radius:13px!important;padding:11px!important;margin-bottom:9px!important;box-shadow:0 7px 20px rgba(34,118,92,.045)!important}
      .filters{gap:8px!important}
      input,select{min-height:37px!important;padding:7px 8px!important}
      .btn{padding:8px 11px!important;min-height:37px!important}
      .legend{margin:5px 0 7px!important;gap:5px!important}
      .pill{padding:4px 7px!important;font-size:10px!important}
      .save-state{font-size:10px!important}

      /* Scheduling area gets most of the viewport. */
      #page-schedule>.card:not(.filters){padding:5px!important;margin-bottom:0!important}
      #page-schedule .table-wrap{
        height:calc(100dvh - 220px)!important;
        max-height:none!important;min-height:430px!important;
        border-radius:10px!important;
      }
      .schedule{min-width:1490px!important}
      .schedule .employee{min-width:165px!important;width:165px!important}
      .schedule th.day{min-width:185px!important}
      .schedule th,.schedule td{padding:6px!important}
      .emp b{font-size:13px!important}.emp span{font-size:10px!important}
      .cell{gap:4px!important}
      .cell label{font-size:9.5px!important}
      .cell input,.cell select{min-height:34px!important;padding:5px 6px!important;font-size:13px!important}
      .note{min-height:30px!important;font-size:12px!important;margin-top:4px!important}

      /* Other pages also use full width and horizontal scroll instead of shrinking tables. */
      .scroll{max-height:66dvh!important}
      .tabs{margin-bottom:8px!important;gap:5px!important;scrollbar-width:none!important}
      .tabs::-webkit-scrollbar{display:none!important}
      .tabs button{padding:8px 10px!important;font-size:12px!important}
      .export-grid{gap:8px!important}
    }

    /* ---------- Phone portrait / small tablet ---------- */
    @media (max-width:700px){
      .side{
        grid-template-columns:1fr!important;gap:5px!important;
        padding:6px 7px!important;
      }
      .brand{height:31px!important;padding:0 3px!important}
      .mark{width:30px!important;height:30px!important;border-radius:10px!important;font-size:11px!important}
      .brand b{font-size:15px!important}.brand small{font-size:9px!important}
      .nav{gap:5px!important}
      .nav button{height:35px!important;min-height:35px!important;padding:5px 8px!important;font-size:10.5px!important}
      .nav .nav-num{display:none!important}

      .main{padding:6px!important}
      .top{margin:2px 3px 5px!important;min-height:32px!important}
      .top h1{font-size:18px!important}
      .top p{display:none!important}
      .badge{font-size:9px!important;padding:5px 7px!important}
      .card{padding:8px!important;margin-bottom:6px!important;border-radius:11px!important}

      #page-schedule>.filters{display:flex!important;gap:6px!important;padding:7px!important}
      #page-schedule>.filters label{flex:1 1 calc(50% - 6px)!important;min-width:135px!important;font-size:10px!important;gap:3px!important}
      #page-schedule>.filters label:nth-of-type(3){flex-basis:100%!important}
      #page-schedule>.filters .grow{display:none!important}
      #page-schedule>.filters .btn{flex:1 1 auto!important;min-height:35px!important;padding:6px 8px!important;font-size:11px!important}
      #page-schedule>.filters input,#page-schedule>.filters select{min-height:35px!important;font-size:13px!important;padding:6px 7px!important}
      .legend{padding:0 2px!important;margin:3px 0 5px!important;overflow-x:auto!important;flex-wrap:nowrap!important;white-space:nowrap!important;scrollbar-width:none!important}
      .legend::-webkit-scrollbar{display:none!important}
      .save-state{margin-left:4px!important;flex:0 0 auto!important}

      #page-schedule>.card:not(.filters){padding:3px!important;border-radius:8px!important}
      #page-schedule .table-wrap{
        height:calc(100dvh - 255px)!important;
        min-height:390px!important;max-height:none!important;border-radius:7px!important;
      }
      .schedule{min-width:1375px!important}
      .schedule .employee{min-width:150px!important;width:150px!important}
      .schedule th.day{min-width:175px!important}
      .schedule th,.schedule td{padding:5px!important}
      .schedule thead th{font-size:12px!important}
      .schedule th small{font-size:10px!important;margin-top:2px!important}
      .emp b{font-size:12px!important;line-height:1.25!important}.emp span{font-size:9px!important}
      .cell input,.cell select,.note{font-size:14px!important}
      .cell input,.cell select{min-height:36px!important}
      .note{min-height:32px!important}

      /* History/Admin cards stay readable without wasting vertical space. */
      .hist{grid-template-columns:1fr!important;gap:6px!important;padding:9px!important}
      .hist .btn{grid-column:auto!important;width:100%!important}
      .metrics{grid-template-columns:1fr 1fr!important;gap:7px!important}
      .metric{padding:10px!important}.metric strong{font-size:22px!important}
      .two{grid-template-columns:1fr!important}
      .scroll{max-height:70dvh!important}
      .tabs button{font-size:11px!important;padding:7px 8px!important}
      .section-head{margin-bottom:8px!important}.section-head h2{font-size:16px!important}.section-head p{font-size:11px!important}
    }

    /* Very small phones: maximize schedule height and keep controls touchable. */
    @media (max-width:430px){
      .brand small{display:none!important}
      .top .badge{max-width:115px!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #page-schedule>.filters label{min-width:125px!important}
      #page-schedule .table-wrap{height:calc(100dvh - 245px)!important;min-height:360px!important}
      .schedule{min-width:1325px!important}
      .schedule .employee{min-width:145px!important;width:145px!important}
      .schedule th.day{min-width:168px!important}
    }

    @media (orientation:landscape) and (max-height:600px) and (max-width:1180px){
      .brand{display:none!important}
      .side{grid-template-columns:1fr!important;padding:4px 7px!important}
      .nav button{height:32px!important;min-height:32px!important}
      .top{display:none!important}
      #page-schedule .table-wrap{height:calc(100dvh - 145px)!important;min-height:280px!important}
    }
  `;
  document.head.appendChild(style);

  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 2.6 · Responsive Online';
})();