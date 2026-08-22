(()=>{
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];

  function normalize24(v){
    let s=String(v||'').trim().replace(/\./g,':').replace(/\s+/g,'');
    if(!s)return '';
    if(/^\d{3,4}$/.test(s)){
      s=s.padStart(4,'0');
      s=s.slice(0,2)+':'+s.slice(2);
    }
    const m=s.match(/^(\d{1,2}):(\d{1,2})$/);
    if(!m)return null;
    const h=Number(m[1]), min=Number(m[2]);
    if(!Number.isInteger(h)||!Number.isInteger(min)||h<0||h>23||min<0||min>59)return null;
    return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0');
  }

  function validateOne(input,{focus=false}={}){
    const out=normalize24(input.value);
    if(out===null){
      input.classList.add('ot24-invalid');
      input.setCustomValidity('กรุณากรอกเวลาแบบ 24 ชั่วโมง HH:MM เช่น 16:00');
      if(focus){input.reportValidity();input.focus()}
      return false;
    }
    input.classList.remove('ot24-invalid');
    input.setCustomValidity('');
    input.value=out;
    return true;
  }

  function convert(input){
    if(!input||input.dataset.ot24v250==='1')return;
    input.dataset.ot24v250='1';
    const current=input.value;
    input.type='text';
    input.inputMode='numeric';
    input.autocomplete='off';
    input.maxLength=5;
    input.placeholder='--:--';
    input.setAttribute('aria-label',input.classList.contains('otStart')?'เริ่ม OT เวลา 24 ชั่วโมง':'เลิก OT เวลา 24 ชั่วโมง');
    input.value=normalize24(current)??current;
    input.addEventListener('input',()=>{
      input.classList.remove('ot24-invalid');
      input.setCustomValidity('');
      let s=input.value.replace(/[^0-9:]/g,'');
      const colon=s.indexOf(':');
      if(colon!==-1)s=s.slice(0,colon+1)+s.slice(colon+1).replace(/:/g,'');
      input.value=s.slice(0,5);
    });
    input.addEventListener('blur',()=>validateOne(input));
    input.addEventListener('change',()=>validateOne(input));
  }

  function convertAll(){qa('#scheduleTable .otStart,#scheduleTable .otEnd').forEach(convert)}
  convertAll();
  const table=q('#scheduleTable');
  if(table)new MutationObserver(convertAll).observe(table,{childList:true,subtree:true});

  function validateBeforeSave(e){
    const inputs=qa('#scheduleTable .otStart,#scheduleTable .otEnd');
    const bad=inputs.find(x=>!validateOne(x));
    if(bad){
      e.preventDefault();e.stopImmediatePropagation();validateOne(bad,{focus:true});
      if(typeof toast==='function')toast('เวลา OT ต้องเป็นรูปแบบ 24 ชั่วโมง HH:MM เช่น 16:00','error');
    }
  }
  q('#save')?.addEventListener('click',validateBeforeSave,true);
  q('#draft')?.addEventListener('click',validateBeforeSave,true);

  const style=document.createElement('style');
  style.id='ot24HourV250Style';
  style.textContent=`#scheduleTable .otStart,#scheduleTable .otEnd{font-variant-numeric:tabular-nums;letter-spacing:.2px}#scheduleTable .ot24-invalid{border-color:#c84b45!important;background:#fff3f2!important;outline:2px solid rgba(200,75,69,.10)!important}`;
  document.head.appendChild(style);

  const footer=q('.side footer');
  if(footer)footer.textContent='Version 2.5 · Online Database';
})();