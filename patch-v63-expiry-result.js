/* KSL V6.3 — calculated expiry drives PASS/FAIL; hide legacy expiry/max columns */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_CALC_RESULT_V633__) return;
  window.__KSL_EXPIRY_CALC_RESULT_V633__ = true;

  function txt(v){ return String(v ?? '').trim(); }
  function fmt(v){
    if(!v) return '-';
    const d=v instanceof Date?v:new Date(v);
    if(Number.isNaN(d.getTime())) return '-';
    try{return new Intl.DateTimeFormat('th-TH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}catch(_){return d.toLocaleString('th-TH')}
  }
  function parseDuration(holding,start){
    const raw=txt(holding).toLowerCase();
    if(!raw||/ตาม.*บรรจุภัณฑ์|บรรจุภัณฑ์|package/.test(raw))return{kind:'manual',expiry:null};
    const base=new Date(start);if(Number.isNaN(base.getTime()))return{kind:'invalid',expiry:null};
    const m=raw.match(/(\d+(?:\.\d+)?)\s*(นาที|ชั่วโมง|ชม\.?|วัน|เดือน|ปี)/i);
    if(!m)return{kind:'manual',expiry:null};
    const n=Number(m[1]),unit=m[2],d=new Date(base);
    if(/นาที/.test(unit))d.setMinutes(d.getMinutes()+n);
    else if(/ชั่วโมง|ชม/.test(unit))d.setHours(d.getHours()+n);
    else if(/วัน/.test(unit))d.setDate(d.getDate()+n);
    else if(/เดือน/.test(unit))d.setMonth(d.getMonth()+n);
    else if(/ปี/.test(unit))d.setFullYear(d.getFullYear()+n);
    return{kind:'fixed',expiry:d};
  }
  function resultMarkup(code,label,reason){
    const icon=code==='pass'?'✓':code==='fail'?'✕':code==='manual'?'!':'•';
    return `<span class="ea-result ${code}">${icon} ${label}</span><span class="ea-reason">${reason}</span>`;
  }
  function evaluateRow(tr){
    if(!tr)return;
    const start=tr.querySelector('.ea-start-input')?.value||'';
    const holding=txt(tr.querySelector('.ea-holding')?.textContent);
    const out=tr.querySelector('.ea-calc-cell');
    const result=tr.querySelector('.ea-result-cell');
    const checked=document.getElementById('eaCheckedAt')?.value||'';
    const calc=parseDuration(holding,start);

    if(out){
      if(!start)out.innerHTML='<span class="ea-calc-expiry pending">รอวัน/เวลาเริ่มต้น<small>กรอกวันและเวลาเริ่มต้น</small></span>';
      else if(calc.kind==='fixed'&&calc.expiry)out.innerHTML=`<span class="ea-calc-expiry">${fmt(calc.expiry)}<small>คำนวณจาก ${holding||'-'}</small></span>`;
      else if(calc.kind==='manual')out.innerHTML='<span class="ea-calc-expiry manual">ตรวจตามฉลาก<small>Holding Time ไม่ระบุช่วงคำนวณ</small></span>';
      else out.innerHTML='<span class="ea-calc-expiry pending">คำนวณไม่ได้<small>กรุณาตรวจข้อมูลเริ่มต้น</small></span>';
    }

    if(!result)return;
    if(!start){ result.innerHTML=resultMarkup('pending','รอตรวจ','ยังไม่ได้กรอกเริ่มต้นวันหมดอายุ'); return; }
    if(calc.kind==='manual'){ result.innerHTML=resultMarkup('manual','ตรวจฉลาก','รายการนี้ต้องอ้างอิงฉลาก/บรรจุภัณฑ์'); return; }
    if(calc.kind!=='fixed'||!calc.expiry){ result.innerHTML=resultMarkup('pending','รอตรวจ','ไม่สามารถคำนวณวันหมดอายุได้'); return; }
    const check=new Date(checked);
    if(Number.isNaN(check.getTime())){ result.innerHTML=resultMarkup('pending','รอตรวจ','กรุณาระบุวันที่ตรวจ'); return; }
    if(calc.expiry.getTime()>=check.getTime()) result.innerHTML=resultMarkup('pass','ผ่าน','ยังไม่ถึงวันหมดอายุ');
    else result.innerHTML=resultMarkup('fail','ไม่ผ่าน','หมดอายุแล้ว ณ วันที่ตรวจ');
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

    // After V6.3 start patch, legacy columns are immediately after calculated expiry.
    // Remove legacy "วันหมดอายุที่ตรวจพบ" and "ขอบเขตสูงสุดตามมาตรฐาน" from UI.
    const ths=[...head.children];
    ths.forEach(th=>{
      const t=txt(th.textContent);
      if(t.includes('วันหมดอายุที่ตรวจพบ')||t.includes('ขอบเขตสูงสุด')) th.style.display='none';
    });

    body.querySelectorAll('tr[data-key]').forEach(tr=>{
      const legacyInput=tr.querySelector('.ea-exp-input');
      if(legacyInput) legacyInput.closest('td').style.display='none';
      const max=tr.querySelector('.ea-max');
      if(max) max.style.display='none';
      evaluateRow(tr);
    });
    updateSummary();
    return true;
  }
  function schedule(){[0,50,150,400,900].forEach(ms=>setTimeout(normalize,ms));}

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('.ea-start-input,#eaCheckedAt')){setTimeout(()=>{normalize();},10);}
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaRefresh,.nav button[data-page="expiryAudit"],[data-frequent-key],[data-remove-key],#eaClearSelected'))schedule();
  },true);
  window.addEventListener('ksl-central-synced',schedule);

  if(typeof window.renderExpiryAudit==='function'&&!window.renderExpiryAudit.__kslCalcResultWrapped){
    const base=window.renderExpiryAudit;
    const wrapped=function(){const out=base.apply(this,arguments);schedule();return out;};
    wrapped.__kslCalcResultWrapped=true;
    window.renderExpiryAudit=wrapped;
  }

  schedule();
  console.info('[KSL] V6.3 calculated expiry PASS/FAIL ready');
})();
