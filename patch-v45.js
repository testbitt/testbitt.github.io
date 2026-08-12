/* KSL V4.5 — expiry slip geometry aligned to the supplied 1504x1018 reference. */
(() => {
  const style=document.createElement('style');
  style.id='ksl-expiry-ref-v45';
  style.textContent=`
    /* Reference canvas = 1504 x 1018 (aspect 1.47740668) */
    .expiry-paper-shell{background:#eef4f1!important;padding:12px!important;border:1px dashed #bcd2ca!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;overflow:auto!important}
    .expiry-paper{
      container-type:inline-size!important;
      position:relative!important;
      width:min(100%,1504px)!important;
      aspect-ratio:1504/1018!important;
      min-width:0!important;
      height:auto!important;
      padding:0!important;
      margin:0 auto!important;
      overflow:hidden!important;
      box-sizing:border-box!important;
      background:#eef7ff!important;
      color:#080808!important;
      font-family:Tahoma,'Noto Sans Thai','Arial Unicode MS',Arial,sans-serif!important;
      box-shadow:none!important;
    }
    .expiry-paper .ep-row,.expiry-paper .ep-two{margin:0!important;padding:0!important;box-sizing:border-box!important}
    .expiry-paper .ep-label,.expiry-paper .ep-unit{font-size:3.35cqw!important;font-weight:400!important;line-height:1!important;color:#050505!important;white-space:nowrap!important}
    .expiry-paper .ep-line{font-size:2.55cqw!important;font-weight:400!important;line-height:1!important;height:1.18em!important;border-bottom:0.20cqw solid #111!important;padding:0 .45cqw .24cqw!important;box-sizing:border-box!important;color:#050505!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;background:transparent!important}

    /* 1) Branch */
    .expiry-paper>.ep-branch{position:absolute!important;left:5.9%!important;top:6.5%!important;width:60.0%!important;height:9.5%!important;display:flex!important;align-items:flex-end!important;gap:2.1%!important;z-index:3!important}
    .expiry-paper>.ep-branch .ep-line{flex:1!important}

    /* 2) Produced date / time */
    .expiry-paper>.ep-two:nth-child(2){position:absolute!important;left:2.8%!important;top:20.5%!important;width:97.2%!important;height:10.5%!important;display:grid!important;grid-template-columns:53.5% 46.5%!important;column-gap:0!important;z-index:3!important}
    .expiry-paper>.ep-two:nth-child(2)>.ep-row:first-child{display:flex!important;align-items:flex-end!important;gap:2.0%!important;padding-left:0!important;padding-right:4.0%!important}
    .expiry-paper>.ep-two:nth-child(2)>.ep-row:last-child{display:flex!important;align-items:flex-end!important;gap:2.1%!important;padding-left:1.6%!important}
    .expiry-paper>.ep-two:nth-child(2) .ep-line{flex:1!important}

    /* 3) Expiry date / time */
    .expiry-paper>.ep-two:nth-child(3){position:absolute!important;left:0.2%!important;top:36.9%!important;width:99.8%!important;height:10.5%!important;display:grid!important;grid-template-columns:53.6% 46.4%!important;column-gap:0!important;z-index:3!important}
    .expiry-paper>.ep-two:nth-child(3)>.ep-row:first-child{display:flex!important;align-items:flex-end!important;gap:2.0%!important;padding-left:0!important;padding-right:4.0%!important}
    .expiry-paper>.ep-two:nth-child(3)>.ep-row:last-child{display:flex!important;align-items:flex-end!important;gap:2.1%!important;padding-left:1.6%!important}
    .expiry-paper>.ep-two:nth-child(3) .ep-line{flex:1!important}

    /* 4) Item */
    .expiry-paper>.ep-item{position:absolute!important;left:3.6%!important;top:53.3%!important;width:62.4%!important;height:10.0%!important;display:flex!important;align-items:flex-end!important;gap:2.0%!important;z-index:3!important}
    .expiry-paper>.ep-item .ep-line{flex:1!important}

    /* 5) Quantity + สูตร */
    .expiry-paper>.ep-qty{position:absolute!important;left:3.7%!important;top:68.1%!important;width:82.8%!important;height:10.5%!important;display:block!important;z-index:3!important}
    .expiry-paper>.ep-qty .ep-qty-main{position:absolute!important;left:0!important;bottom:0!important;width:69.0%!important;height:100%!important;display:flex!important;align-items:flex-end!important;gap:2.0%!important}
    .expiry-paper>.ep-qty .ep-qty-main .ep-line{flex:1!important}
    .expiry-paper>.ep-qty .ep-unit{position:absolute!important;right:0!important;bottom:0.25cqw!important;padding:0!important}

    /* 6) Producer */
    .expiry-paper>.ep-producer{position:absolute!important;left:4.4%!important;top:82.4%!important;width:61.5%!important;height:10.0%!important;display:flex!important;align-items:flex-end!important;gap:2.0%!important;z-index:4!important}
    .expiry-paper>.ep-producer .ep-line{flex:1!important}

    /* Mascot: only upper portion visible, as in the reference */
    .expiry-paper>.ep-mascot{position:absolute!important;right:-1.8%!important;bottom:-30.5%!important;width:34.4%!important;aspect-ratio:1/1!important;border:0.34cqw solid #111!important;border-radius:50%!important;background:#eef7ff!important;z-index:2!important;box-sizing:border-box!important}
    .expiry-paper>.ep-mascot .ep-hair{position:absolute!important;left:49%!important;top:-5.0%!important;width:8%!important;height:14%!important;border-left:0.32cqw solid #111!important;border-radius:50%!important;transform:rotate(-32deg)!important}
    .expiry-paper>.ep-mascot .ep-eye{position:absolute!important;top:31%!important;width:9%!important;height:5%!important;border-top:0.31cqw solid #111!important;border-radius:50%!important}
    .expiry-paper>.ep-mascot .ep-eye.l{left:27%!important;transform:rotate(-13deg)!important}.expiry-paper>.ep-mascot .ep-eye.r{right:27%!important;transform:rotate(13deg)!important}
    .expiry-paper>.ep-mascot .ep-cheek{position:absolute!important;top:42%!important;width:17%!important;height:8%!important;background:repeating-linear-gradient(165deg,#9ca3a6 0 .12cqw,transparent .12cqw .30cqw)!important;border-radius:50%!important;opacity:.55!important}.expiry-paper>.ep-mascot .ep-cheek.l{left:14%!important}.expiry-paper>.ep-mascot .ep-cheek.r{right:14%!important}
    .expiry-paper>.ep-mascot .ep-mouth{position:absolute!important;left:42%!important;top:54%!important;width:16%!important;height:9%!important;border-bottom:0.31cqw solid #111!important;border-radius:50%!important}

    /* Make preview fit the card without cropping right edge */
    .expiry-ref-preview{overflow:hidden!important}.expiry-paper-shell{max-width:100%!important}.expiry-ref-workspace{min-width:0!important}.expiry-ref-preview{min-width:0!important}
    @media(max-width:700px){.expiry-paper-shell{padding:6px!important}.expiry-paper{width:100%!important;min-width:0!important}}

    @media print{
      @page{size:148mm 100mm;margin:0}
      html,body{margin:0!important;padding:0!important;background:#fff!important}
      body *{visibility:hidden!important}
      #expiryLabel,#expiryLabel *{visibility:visible!important}
      #expiryLabel{position:fixed!important;left:0!important;top:0!important;width:148mm!important;height:100mm!important;aspect-ratio:auto!important;background:#eef7ff!important;box-shadow:none!important}
    }
  `;
  document.head.appendChild(style);

  function refresh(){
    const paper=document.getElementById('expiryLabel');
    if(!paper)return;
    paper.setAttribute('aria-label','ใบหมดอายุตามแบบฟอร์มหน้าร้าน');
    // Keep the visual document clean: no extra title or border inside the slip itself.
    paper.style.border='0';
  }
  refresh(); setTimeout(refresh,120); setTimeout(refresh,700);
})();
