(()=>{
  const nativeHtml2Canvas=window.html2canvas;
  if(typeof nativeHtml2Canvas!=='function')return;

  const style=document.createElement('style');
  style.id='pngHiResV220Style';
  style.textContent=`
    #printArea.png-hires-v220 .beauty-sheet{
      width:1700px!important;
      padding:38px!important;
      margin-bottom:28px!important;
      -webkit-font-smoothing:antialiased!important;
      text-rendering:geometricPrecision!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:first-child{
      padding:22px 26px!important;
      margin-bottom:18px!important;
      border-radius:20px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:first-child>div:first-child>div:first-child{
      width:60px!important;height:60px!important;border-radius:17px!important;font-size:21px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:first-child>div:first-child>div:last-child>div:first-child{
      font-size:29px!important;line-height:1.15!important;letter-spacing:.15px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:first-child>div:first-child>div:last-child>div:last-child{
      font-size:15px!important;margin-top:4px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:first-child>div:last-child>div:first-child{
      font-size:22px!important;line-height:1.25!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:first-child>div:last-child>div:last-child{
      font-size:14px!important;margin-top:6px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:nth-child(2){
      font-size:14px!important;margin:2px 4px 15px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet table{
      border-width:1.5px!important;border-radius:16px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet thead th{
      padding:14px 8px!important;
      font-size:16px!important;
      line-height:1.25!important;
    }
    #printArea.png-hires-v220 .beauty-sheet thead th div{
      font-size:13px!important;
      margin-top:5px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet tbody td{
      height:84px!important;
      padding:12px 9px!important;
      font-size:14px!important;
      line-height:1.45!important;
    }
    #printArea.png-hires-v220 .beauty-sheet tbody td:first-child{
      padding-left:12px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet tbody td:first-child>b{
      font-size:16px!important;
      line-height:1.3!important;
    }
    #printArea.png-hires-v220 .beauty-sheet tbody td:first-child>div{
      font-size:12px!important;
      line-height:1.35!important;
      margin-top:5px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet tbody td:not(:first-child)>b{
      font-size:15px!important;
    }
    #printArea.png-hires-v220 .beauty-sheet tbody td:not(:first-child)>div{
      font-size:11.5px!important;
      line-height:1.4!important;
    }
    #printArea.png-hires-v220 .beauty-sheet>div:last-child{
      font-size:11px!important;
      gap:18px!important;
      margin-top:13px!important;
    }
  `;
  document.head.appendChild(style);

  window.html2canvas=function(target,options={}){
    const isPngRoot=target?.id==='printArea' && Number(options?.scale)===1.25;
    if(!isPngRoot)return nativeHtml2Canvas(target,options);

    target.classList.add('png-hires-v220');
    const width=Math.max(1,target.scrollWidth||target.offsetWidth||1700);
    const height=Math.max(1,target.scrollHeight||target.offsetHeight||900);
    const maxPixels=60000000;
    const memorySafeScale=Math.sqrt(maxPixels/(width*height));
    const hiScale=Math.max(1.8,Math.min(3, memorySafeScale));
    const opt={
      ...options,
      scale:hiScale,
      backgroundColor:'#ffffff',
      useCORS:true,
      logging:false,
      scrollX:0,
      scrollY:0,
      windowWidth:width,
      windowHeight:height,
      onclone:(doc)=>{
        try{
          const cloned=doc.querySelector('#printArea');
          cloned?.classList.add('png-hires-v220');
        }catch{}
        if(typeof options.onclone==='function')options.onclone(doc);
      }
    };
    return nativeHtml2Canvas(target,opt).finally(()=>target.classList.remove('png-hires-v220'));
  };

  const png=document.querySelector('#png');
  if(png){
    const small=png.querySelector('small');
    if(small)small.textContent='PNG คมชัดสูง · ตัวหนังสือใหญ่ · พร้อมส่ง LINE';
    png.title='Export PNG ความละเอียดสูงแบบ Adaptive';
  }
  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 2.2 · Online Database';
})();