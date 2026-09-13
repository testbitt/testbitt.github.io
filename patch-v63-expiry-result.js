/* KSL V6.3 — manual expiry input drives PASS/FAIL; hide legacy expiry/max columns */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_MANUAL_RESULT_V634__) return;
  window.__KSL_EXPIRY_MANUAL_RESULT_V634__ = true;

  function txt(v){ return String(v ?? '').trim(); }
  function resultMarkup(code,label,reason){
    const icon=code==='pass'?'✓':code==='fail'?'✕':code==='manual'?'!':'•';
    return `<span class="ea-result ${code}">${icon} ${label}</span><span class="ea-reason">${reason}</span>`;
  }
  function parseDuration(holding,start){
    const raw=txt(holding).toLowerCase();
    if(!raw||/ตาม.*บรรจุภัณฑ์|บรรจุภัณฑ์|package/.test(raw))return{kind:'manual',max:null};
    const base=new Date(start);if(Number.isNaN(base.getTime()))return{kind:'invalid',max:null};
    const m=raw.match(/(\d+(?:\.\d+)?)\s*(นาที|ชั่วโมง|ชม\.?|วัน|เดือน|ปี)/i);
    if(!m)return{kind:'manual',max:null};
    const n=Number(m[1]),unit=m[2],d=new Date(base);
    if(/นาที/.test(unit))d.setMinutes(d.getMinutes()+n);
    else if(/ชั่วโมง|ชม/.test(unit))d.setHours(d.getHours()+n);
    else if(/วัน/.test(unit))d.setDate(d.getDate()+n);
    else if(/เดือน/.test(unit))d.setMonth(d.getMonth()+n);
    else if(/ปี/.test(unit))d.setFullYear(d.getFullYear()+n);
    return{kind:'fixed',max:d};
  }
  function ensureManualInput(tr){
    const out=tr?.querySelector('.ea-calc-cell');
    const legacy=tr?.querySelector('.ea-exp-input');
    if(!out||!legacy)return null;
    let input=out.querySelector('.ea-manual-expiry-input');
    if(!input){
      out.innerHTML='<input class="ea-exp-input ea-manual-expiry-input" type="datetime-local" aria-label="วันหมดอายุ">';
      input=out.querySelector('.ea-manual-expiry-input');
    }
    if(input.value!==legacy.value)input.value=legacy.value||'';
    return input;
  }
  function evaluateRow(tr){
    if(!tr)return;
    const start=tr.querySelector('.ea-start-input')?.value||'';
    const expiry=tr.querySelector('.ea-manual-expiry-input')?.value||tr.querySelector('.ea-exp-input:not(.ea-manual-expiry-input)')?.value||'';
    const holding=txt(tr.querySelector('.ea-holding')?.textContent);
    const result=tr.querySelector('.ea-result-cell');
    const checked=document.getElementById('eaCheckedAt')?.value||'';
    if(!result)return;

    if(!start){result.innerHTML=resultMarkup('pending','รอตรวจ','กรุณากรอกเริ่มต้นวันหมดอายุ');return;}
    if(!expiry){result.innerHTML=resultMarkup('pending','รอตรวจ','กรุณากรอกวันหมดอายุ');return;}

    const startDate=new Date(start), expDate=new Date(expiry), checkDate=new Date(checked);
    if(Number.isNaN(startDate.getTime())||Number.isNaN(expDate.getTime())){result.innerHTML=resultMarkup('pending','รอตรวจ','วัน/เวลาไม่สมบูรณ์');return;}
    if(expDate.getTime()<startDate.getTime()){result.innerHTML=resultMarkup('fail','ไม่ผ่าน','วันหมดอายุก่อนวันเริ่มต้น');return;}
    if(!Number.isNaN(checkDate.getTime())&&expDate.getTime()<checkDate.getTime()){result.innerHTML=resultMarkup('fail','ไม่ผ่าน','หมดอายุแล้ว ณ วันที่ตรวจ');return;}

    const std=parseDuration(holding,start);
    if(std.kind==='manual'){result.innerHTML=resultMarkup('manual','ตรวจฉลาก','Holding Time ระบุให้อ้างอิงฉลาก/บรรจุภัณฑ์');return;}
    if(std.kind!=='fixed'||!std.max){result.innerHTML=resultMarkup('pending','รอตรวจ','ไม่สามารถอ่าน Holding Time เพื่อเทียบมาตรฐานได้');return;}
    if(expDate.getTime()<=std.max.getTime())result.innerHTML=resultMarkup('pass','ผ่าน','วันหมดอายุอยู่ภายใน Holding Time และยังไม่หมดอายุ');
    else result.innerHTML=resultMarkup('fail','ไม่ผ่าน','วันหมดอายุเกิน Holding Time มาตรฐาน');
  }
  function updateSummary(){
    const rows=[...document.querySelectorAll('#expiryAudit #eaBody tr[data-key]')].filter(tr=>tr.style.display!=='none');
    let pass=0,fail=0,manual=0;
    rows.forEach(tr=>{const r=tr.querySelector('.ea-result');if(r?.classList.contains('pass'))pass++;else if(r?.classList.contains('fail'))fail++;else if(r?.classList.contains('manual'))manual++;});
    [['eaAll',rows.length],['eaPass',pass],['eaFail',fail],['eaManual',manual]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=String(v)});
  }
  function normalize(){
    const table=document.querySelector('#expiryAudit .ea-table');
    const head=table?.querySelector('thead tr');
    const body=table?.querySelector('#eaBody');
    if(!table||!head||!body)return false;

    const startHead=head.querySelector('.ea-start-head');
    const calcHead=head.querySelector('.ea-calc-head');
    if(startHead)startHead.textContent='เริ่มต้นวันหมดอายุ';
    if(calcHead)calcHead.textContent='วันหมดอายุ';

    [...head.children].forEach(th=>{
      const t=txt(th.textContent);
      if(t.includes('วันหมดอายุที่ตรวจพบ')||t.includes('ขอบเขตสูงสุด'))th.style.display='none';
    });

    body.querySelectorAll('tr[data-key]').forEach(tr=>{
      const allExpiry=[...tr.querySelectorAll('.ea-exp-input')];
      const legacy=allExpiry.find(el=>!el.classList.contains('ea-manual-expiry-input'));
      if(legacy)legacy.closest('td').style.display='none';
      const max=tr.querySelector('.ea-max');
      if(max)max.style.display='none';
      ensureManualInput(tr);
      evaluateRow(tr);
    });
    updateSummary();
    return true;
  }
  function schedule(){[0,40,120,320,750].forEach(ms=>setTimeout(normalize,ms));}

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('.ea-manual-expiry-input')){
      const tr=e.target.closest('tr');
      const legacy=[...tr.querySelectorAll('.ea-exp-input')].find(el=>!el.classList.contains('ea-manual-expiry-input'));
      if(legacy){legacy.value=e.target.value||'';legacy.dispatchEvent(new Event('change',{bubbles:true}));}
      setTimeout(()=>{evaluateRow(tr);updateSummary();},10);
      return;
    }
    if(e.target?.matches?.('.ea-start-input,#eaCheckedAt'))setTimeout(normalize,10);
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaRefresh,.nav button[data-page="expiryAudit"],[data-frequent-key],[data-remove-key],#eaClearSelected,#eaClear'))schedule();
  },true);
  window.addEventListener('ksl-central-synced',schedule);

  if(typeof window.renderExpiryAudit==='function'&&!window.renderExpiryAudit.__kslManualResultWrapped){
    const base=window.renderExpiryAudit;
    const wrapped=function(){const out=base.apply(this,arguments);schedule();return out;};
    wrapped.__kslManualResultWrapped=true;
    window.renderExpiryAudit=wrapped;
  }

  schedule();
  console.info('[KSL] V6.3 manual expiry PASS/FAIL ready');
})();
