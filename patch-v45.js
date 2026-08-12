/* KSL V4.6 — expiry slip aligned to the supplied 1885x1279 reference image. */
(() => {
  const old=document.getElementById('ksl-expiry-ref-v45'); if(old) old.remove();
  const style=document.createElement('style');
  style.id='ksl-expiry-ref-v46';
  style.textContent=`
    /* Reference image: 1885 x 1279 */
    .expiry-paper-shell{background:#eef4f1!important;padding:10px!important;border:1px dashed #bfd3cb!important;display:flex!important;justify-content:center!important;overflow:auto!important}
    .expiry-paper{
      container-type:inline-size!important;
      position:relative!important;
      width:min(100%,1885px)!important;
      aspect-ratio:1885/1279!important;
      min-width:0!important;height:auto!important;padding:0!important;margin:0 auto!important;
      overflow:hidden!important;box-sizing:border-box!important;
      background:rgb(175,196,226)!important;color:#050505!important;
      font-family:Tahoma,'Noto Sans Thai',Arial,sans-serif!important;
      box-shadow:none!important;border:0!important;
    }
    .expiry-paper>.ep-field,.expiry-paper>.ep-qty{position:static!important;display:block!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important}
    .expiry-paper .ep-label,.expiry-paper .ep-unit{
      position:absolute!important;margin:0!important;padding:0!important;
      color:#050505!important;font-size:3.30cqw!important;font-weight:400!important;line-height:1!important;white-space:nowrap!important;z-index:4!important;
    }
    .expiry-paper .ep-line{
      position:absolute!important;margin:0!important;padding:0 .35cqw .18cqw!important;
      height:4.0%!important;border:0!important;border-bottom:.20cqw solid #080808!important;
      box-sizing:border-box!important;display:flex!important;align-items:flex-end!important;
      background:transparent!important;color:#050505!important;font-size:2.55cqw!important;font-weight:400!important;line-height:1!important;
      white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;z-index:5!important;
    }

    /* Labels measured from the supplied form */
    .ep-branch .ep-label{left:5.6%!important;top:5.8%!important}
    .ep-prep-date .ep-label{left:1.9%!important;top:18.0%!important}
    .ep-prep-time .ep-label{left:55.5%!important;top:18.2%!important}
    .ep-exp-date .ep-label{left:.3%!important;top:33.0%!important}
    .ep-exp-time .ep-label{left:55.5%!important;top:33.2%!important}
    .ep-item .ep-label{left:3.2%!important;top:47.8%!important}
    .ep-qty .ep-label{left:3.4%!important;top:62.8%!important}
    .ep-producer .ep-label{left:4.3%!important;top:77.8%!important}
    .ep-qty .ep-unit{left:79.5%!important;top:66.6%!important}

    /* Horizontal writing lines — exact geometry from reference */
    .ep-branch .ep-line{left:21.2202%!important;top:10.3081%!important;width:44.7745%!important}
    .ep-prep-date .ep-line{left:21.1141%!important;top:25.6325%!important;width:31.9894%!important}
    .ep-prep-time .ep-line{left:65.6233%!important;top:26.1798%!important;width:34.3767%!important}
    .ep-exp-date .ep-line{left:21.0080%!important;top:41.0352%!important;width:32.0424%!important}
    .ep-exp-time .ep-line{left:65.6233%!important;top:41.5043%!important;width:34.3767%!important}
    .ep-item .ep-line{left:20.8488%!important;top:56.1251%!important;width:45.0398%!important}
    .ep-qty .ep-line{left:20.7427%!important;top:71.1368%!important;width:45.0928%!important}
    .ep-producer .ep-line{left:20.6897%!important;top:83.1775%!important;width:45.0928%!important}

    /* Mascot placement follows the reference: only the upper part is visible. */
    .expiry-paper>.ep-mascot{
      position:absolute!important;right:-1.8%!important;bottom:-30.5%!important;width:34.4%!important;aspect-ratio:1/1!important;
      border:.34cqw solid #111!important;border-radius:50%!important;background:rgb(175,196,226)!important;z-index:2!important;box-sizing:border-box!important;
    }
    .expiry-paper>.ep-mascot .ep-hair{position:absolute!important;left:49%!important;top:-5%!important;width:8%!important;height:14%!important;border-left:.32cqw solid #111!important;border-radius:50%!important;transform:rotate(-32deg)!important}
    .expiry-paper>.ep-mascot .ep-eye{position:absolute!important;top:31%!important;width:9%!important;height:5%!important;border-top:.31cqw solid #111!important;border-radius:50%!important}
    .expiry-paper>.ep-mascot .ep-eye.l{left:27%!important;transform:rotate(-13deg)!important}.expiry-paper>.ep-mascot .ep-eye.r{right:27%!important;transform:rotate(13deg)!important}
    .expiry-paper>.ep-mascot .ep-cheek{position:absolute!important;top:42%!important;width:17%!important;height:8%!important;background:repeating-linear-gradient(165deg,#949ca0 0 .12cqw,transparent .12cqw .30cqw)!important;border-radius:50%!important;opacity:.55!important}
    .expiry-paper>.ep-mascot .ep-cheek.l{left:14%!important}.expiry-paper>.ep-mascot .ep-cheek.r{right:14%!important}
    .expiry-paper>.ep-mascot .ep-mouth{position:absolute!important;left:42%!important;top:54%!important;width:16%!important;height:9%!important;border-bottom:.31cqw solid #111!important;border-radius:50%!important}

    .expiry-ref-preview,.expiry-ref-workspace{min-width:0!important}.expiry-ref-preview{overflow:hidden!important}
    @media(max-width:700px){.expiry-paper-shell{padding:5px!important}.expiry-paper{width:100%!important;min-width:0!important}}
    @media print{
      @page{size:148mm 100mm;margin:0}
      html,body{margin:0!important;padding:0!important;background:#fff!important}
      body *{visibility:hidden!important}
      #expiryLabel,#expiryLabel *{visibility:visible!important}
      #expiryLabel{position:fixed!important;left:0!important;top:0!important;width:148mm!important;height:100mm!important;aspect-ratio:auto!important;background:rgb(175,196,226)!important;box-shadow:none!important}
    }
  `;
  document.head.appendChild(style);

  function clean(){
    const p=document.getElementById('expiryLabel'); if(!p) return;
    p.setAttribute('aria-label','ใบหมดอายุตามแบบฟอร์มหน้าร้าน');
    p.style.border='0';
  }
  clean();setTimeout(clean,120);setTimeout(clean,700);
})();
