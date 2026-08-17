(()=>{
  const old=document.querySelector('#animeExecutiveThemeV15');if(old)old.remove();
  document.querySelectorAll('.anime-mascot').forEach(x=>x.remove());
  const style=document.createElement('style');
  style.id='animeCuteGreenThemeV16';
  style.textContent=`
  :root{--cute-green:#15966f;--cute-deep:#17614f;--cute-mint:#a9e7d0;--cute-soft:#eaf9f3;--cute-pale:#f7fffb;--cute-line:#d5eee4;--cute-ink:#173d33;--cute-pink:#f4b8c8;--cute-yellow:#f3df8d}
  body{background:linear-gradient(145deg,#ffffff 0%,#f5fff9 40%,#eaf9f3 100%);color:var(--cute-ink);position:relative;overflow-x:hidden}
  body:before,body:after{content:"";position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(3px);opacity:.55}
  body:before{width:340px;height:340px;right:-110px;top:-100px;background:radial-gradient(circle,rgba(169,231,208,.72),rgba(169,231,208,0) 70%);animation:cuteCloud 9s ease-in-out infinite alternate}
  body:after{width:300px;height:300px;left:220px;bottom:-130px;background:radial-gradient(circle,rgba(217,246,234,.8),rgba(217,246,234,0) 70%);animation:cuteCloud 11s ease-in-out infinite alternate-reverse}
  @keyframes cuteCloud{to{transform:translate3d(34px,-18px,0) scale(1.08)}}
  .app{position:relative;z-index:1;grid-template-columns:278px 1fr}
  .side{background:linear-gradient(180deg,#ffffff 0%,#f1fff8 55%,#e1f7ed 100%);color:var(--cute-ink);padding:24px 18px;overflow:hidden;border-right:1px solid #d8eee5;box-shadow:12px 0 34px rgba(28,111,86,.08)}
  .side:before{content:"";position:absolute;left:-70px;top:-55px;width:230px;height:230px;border-radius:50%;background:rgba(171,235,211,.32);pointer-events:none;animation:bubbleFloat 7s ease-in-out infinite alternate}
  .side:after{content:"";position:absolute;right:-50px;bottom:120px;width:150px;height:150px;border-radius:50%;border:22px solid rgba(154,225,199,.18);pointer-events:none;animation:bubbleFloat 8.5s ease-in-out infinite alternate-reverse}
  @keyframes bubbleFloat{to{transform:translateY(22px) translateX(9px)}}
  .brand{position:relative;z-index:3;padding:8px 8px 21px;gap:14px}
  .mark{width:54px;height:54px;border-radius:19px;background:linear-gradient(145deg,#2ab387,#138365);box-shadow:0 11px 23px rgba(23,143,105,.19),inset 0 1px rgba(255,255,255,.35);font-size:25px;color:white;animation:cuteLogo 4s ease-in-out infinite}
  @keyframes cuteLogo{0%,100%{transform:rotate(-1deg) translateY(0)}50%{transform:rotate(2deg) translateY(-5px)}}
  .brand b{font-size:22px;color:#155543;letter-spacing:.25px}.brand small{font-size:12px;color:#6f9c8d;opacity:1}
  .nav{position:relative;z-index:3;gap:9px}
  .nav button{position:relative;overflow:hidden;color:#2b6958;border:1px solid #d8eee5;background:rgba(255,255,255,.8);border-radius:18px;padding:13px 12px;min-height:60px;font-weight:760;line-height:1.3;transition:.22s ease;box-shadow:0 5px 13px rgba(30,113,87,.035)}
  .nav button:after{content:"";position:absolute;width:70px;height:70px;border-radius:50%;right:-55px;top:-32px;background:rgba(168,232,207,.22);transition:.35s ease}
  .nav button:hover{transform:translateX(4px) translateY(-1px);border-color:#afe2ce;background:#fbfffd;box-shadow:0 9px 20px rgba(24,128,96,.09)}
  .nav button:hover:after{right:-35px;top:-18px}
  .nav button.active{color:#0e5b46;background:linear-gradient(135deg,#dff7ed,#fafffc);border-color:#a8dfca;box-shadow:0 10px 24px rgba(25,139,103,.12),inset 3px 0 #1da47a}
  .nav .nav-num{display:inline-grid;place-items:center;width:27px;height:27px;border-radius:10px;margin-right:8px;background:#e7f8f1;color:#17815f;font-size:12px;font-weight:900;border:1px solid #c9eadc}
  .nav button.active .nav-num{background:#1c9f77;color:#fff;border-color:#1c9f77;box-shadow:0 5px 11px rgba(28,159,119,.18)}
  .cute-mascot{position:relative;z-index:3;margin-top:auto;margin-bottom:12px;height:166px;border-radius:24px;background:linear-gradient(145deg,#fff,#e8faf2);border:1px solid #cdeade;overflow:hidden;box-shadow:0 11px 25px rgba(35,117,91,.08)}
  .cute-mascot:before{content:"";position:absolute;width:120px;height:120px;border-radius:50%;background:#c9f1e1;right:-26px;bottom:-30px}
  .cute-mascot svg{position:absolute;right:-2px;bottom:-7px;width:150px;height:150px;filter:drop-shadow(0 10px 12px rgba(37,99,80,.12));animation:cuteMascot 4.4s ease-in-out infinite}
  .cute-copy{position:absolute;left:14px;top:16px;width:116px;z-index:2}.cute-copy b{display:block;color:#188261;font-size:13px;margin-bottom:5px}.cute-copy span{display:block;color:#6f988b;font-size:10px;line-height:1.45}
  .leaf{position:absolute;color:#40b78e;font-size:13px;animation:leafSpin 4s ease-in-out infinite}.leaf.l1{right:122px;top:20px}.leaf.l2{right:18px;top:20px;animation-delay:-1.4s}.leaf.l3{right:105px;top:78px;animation-delay:-2.3s}
  @keyframes leafSpin{0%,100%{opacity:.35;transform:translateY(2px) rotate(-10deg) scale(.8)}50%{opacity:1;transform:translateY(-5px) rotate(12deg) scale(1.1)}}
  @keyframes cuteMascot{0%,100%{transform:translateY(1px) rotate(0)}50%{transform:translateY(-7px) rotate(1deg)}}
  .side footer{position:relative;z-index:3;margin-top:0;color:#75a293}
  .main{padding:28px;position:relative;z-index:1}.top{margin-bottom:20px}.top h1{font-size:29px;letter-spacing:-.4px;color:#174f40}.top p{color:#72958a}.badge{background:#fff;border-color:#d6ece4;color:#5f8e7e;box-shadow:0 7px 18px rgba(29,113,87,.05)}
  .card{border-color:#d9eee6;background:rgba(255,255,255,.94);box-shadow:0 15px 36px rgba(34,118,92,.065)}
  .section-head h2{color:#174f40}.section-head p,.filters label,.field{color:#72958a}
  .btn{transition:.2s ease}.btn:hover{transform:translateY(-1px)}.btn.primary{background:linear-gradient(135deg,#1ca579,#118663);box-shadow:0 7px 16px rgba(21,145,106,.16)}
  .btn.secondary{background:#e5f7ef;color:#17664f}.btn.ghost{border-color:#d7ebe3;color:#315f52}
  input,select{background:#fff;border-color:#cfe5dc;color:#214e42}input:focus,select:focus{outline:3px solid rgba(67,184,143,.12);border-color:#6fcbaa}
  .table-wrap,.scroll{border-color:#d8ece4}.schedule thead th,.data th{background:#eaf8f2;color:#235f4e}.schedule .employee{background:#fff}.schedule thead .employee{background:#def4eb}
  .pill{background:#ecf8f3;color:#4b7869}.pill.ot{background:#fff7d9;color:#917122}.pill.h{background:#e9f6ef;color:#34745f}.pill.vl{background:#f5eef8;color:#765b86}.pill.ex{background:#fff0f3;color:#986070}
  .tabs button{border-color:#d8ece4;color:#366c5d;background:#fff}.tabs button.active{background:#1c9c75;color:white;border-color:#1c9c75}
  .metric{border-color:#d9eee5;background:linear-gradient(145deg,#fff,#f8fffb)}
  .upload{border-color:#b8dfcf;background:#f8fffb}.upload.drag{background:#e9f9f2;border-color:#37ad83}
  .notice{background:#effaf5;border-color:#bfe7d7;color:#376c5d}
  .toast{background:#187254}.export-btn{border-color:#d8ece4;transition:.2s}.export-btn:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(29,128,96,.08)}.export-btn b{background:#e3f7ee;color:#18805f}
  @media(max-width:980px){.app{grid-template-columns:1fr}.side{padding:12px}.brand{padding:3px 7px 10px}.mark{width:43px;height:43px;border-radius:14px;font-size:21px}.brand b{font-size:18px}.nav{grid-template-columns:1fr 1fr;gap:7px}.nav button{min-height:52px;padding:9px 7px;font-size:11px;text-align:left}.nav .nav-num{width:22px;height:22px;margin-right:4px}.cute-mascot{display:none}.side footer{display:none}.main{padding:14px}.top h1{font-size:22px}}
  @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const nav=document.querySelector('.nav');
  if(nav){
    const map={schedule:'<span class="nav-num">1</span>จัดตารางงานประจำ Week',export:'<span class="nav-num">2</span>Export ตารางงาน',history:'<span class="nav-num">3</span>ปรับเปลี่ยน/ดูตารางงานย้อนหลัง',admin:'<span style="display:inline-grid;place-items:center;width:27px;height:27px;margin-right:8px">⚙</span>Admin'};
    const order=['schedule','export','history','admin'];
    const buttons=[...nav.querySelectorAll('button')];
    order.forEach(k=>{const b=buttons.find(x=>x.dataset.page===k);if(b){b.innerHTML=map[k];nav.appendChild(b)}});
  }
  const brandSmall=document.querySelector('.brand small');if(brandSmall)brandSmall.textContent='Cute Weekly Planner';
  const side=document.querySelector('.side');
  if(side&&!side.querySelector('.cute-mascot')){
    const box=document.createElement('div');box.className='cute-mascot';
    box.innerHTML=`<div class="cute-copy"><b>HAPPY WEEK ♡</b><span>จัดกะให้ง่าย สดใส และพร้อมสำหรับทุกสัปดาห์</span></div><i class="leaf l1">✦</i><i class="leaf l2">♡</i><i class="leaf l3">✧</i>
    <svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="101" cy="65" r="32" fill="#f7dcca"/><path d="M69 62c2-32 19-47 41-46 22 1 34 18 33 45-8-9-18-15-31-17-11 11-26 16-43 18z" fill="#2e7a63"/><path d="M70 59c-5 11-4 23 1 32-10-5-15-18-12-30 2-10 7-20 15-28z" fill="#236551"/><path d="M82 53c6-7 12-11 19-13" stroke="#4ea98a" stroke-width="6" stroke-linecap="round"/><path d="M94 35c8-9 18-7 25 0-7 7-17 8-25 0z" fill="#69c8a5"/><ellipse cx="89" cy="67" rx="3" ry="4" fill="#31564c"/><ellipse cx="113" cy="67" rx="3" ry="4" fill="#31564c"/><circle cx="82" cy="76" r="4" fill="#f2aebf" opacity=".55"/><circle cx="121" cy="76" r="4" fill="#f2aebf" opacity=".55"/><path d="M96 80c4 4 9 4 13 0" fill="none" stroke="#b87573" stroke-width="2" stroke-linecap="round"/><path d="M70 158c3-37 17-54 31-57 18-3 37 11 43 57z" fill="#ffffff" stroke="#bfe7d7" stroke-width="2"/><path d="M81 111c8 10 15 15 21 16 7-2 15-8 23-18" fill="none" stroke="#36a77e" stroke-width="8" stroke-linecap="round"/><path d="M95 102l7 24 8-24" fill="#e1f6ed"/><rect x="111" y="118" width="36" height="28" rx="6" fill="#dff5eb" stroke="#88cfb4" transform="rotate(-7 111 118)"/><path d="M118 127h18M118 133h15M118 139h18" stroke="#66a992" stroke-width="2" stroke-linecap="round"/></svg>`;
    const footer=side.querySelector('footer');side.insertBefore(box,footer||null);
  }
  const titleMap={schedule:['จัดตารางงานประจำ Week','จัดตารางพนักงานรายสัปดาห์ จันทร์–อาทิตย์'],export:['Export ตารางงาน','เลือกสาขาและสัปดาห์เพื่อส่งออกข้อมูล'],history:['ปรับเปลี่ยน/ดูตารางงานย้อนหลัง','เปิดดูและแก้ไขตารางที่บันทึกไว้'],admin:['Admin','บริหารฐานข้อมูลและตรวจสอบ DAY Code']};
  const originalPage=window.page;
  if(typeof originalPage==='function')window.page=function(n){const r=originalPage.apply(this,arguments),m=titleMap[n];if(m){const t=document.querySelector('#title'),s=document.querySelector('#subtitle');if(t)t.textContent=m[0];if(s)s.textContent=m[1]}return r};
  const footer=document.querySelector('.side footer');if(footer)footer.textContent='Version 1.6 · Cute Green Anime';
})();