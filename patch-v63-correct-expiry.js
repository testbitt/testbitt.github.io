/* KSL V6.3 — show correct expiry date after manual expiry input */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_CORRECT_DATE_V635__) return;
  window.__KSL_EXPIRY_CORRECT_DATE_V635__ = true;

  function txt(v){ return String(v ?? '').trim(); }
  function parseDuration(holding,start){
    const raw=txt(holding).toLowerCase();
    if(!raw || /ตาม.*บรรจุภัณฑ์|บรรจุภัณฑ์|package/.test(raw)) return {kind:'manual',max:null};
    const base=new Date(start);
    if(Number.isNaN(base.getTime())) return {kind:'invalid',max:null};
    const m=raw.match(/(\d+(?:\.\d+)?)\s*(นาที|ชั่วโมง|ชม\.?|วัน|เดือน|ปี)/i);
    if(!m) return {kind:'manual',max:null};
    const n=Number(m[1]), unit=m[2], d=new Date(base);
    if(/นาที/.test(unit)) d.setMinutes(d.getMinutes()+n);
    else if(/ชั่วโมง|ชม/.test(unit)) d.setHours(d.getHours()+n);
    else if(/วัน/.test(unit)) d.setDate(d.getDate()+n);
    else if(/เดือน/.test(unit)) d.setMonth(d.getMonth()+n);
    else if(/ปี/.test(unit)) d.setFullYear(d.getFullYear()+n);
    return {kind:'fixed',max:d};
  }
  function pad(n){ return String(n).padStart(2,'0'); }
  function formatGregorian(d){
    if(!(d instanceof Date) || Number.isNaN(d.getTime())) return '-';
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const style=document.createElement('style');
  style.id='ksl-expiry-correct-date-v635-style';
  style.textContent=`
    #expiryAudit .ea-correct-head{min-width:205px;white-space:nowrap}
    #expiryAudit .ea-correct-cell{min-width:205px}
    #expiryAudit .ea-correct-expiry{display:inline-flex;flex-direction:column;gap:3px;padding:7px 9px;border:1px solid #b9ddcd;border-radius:9px;background:#eef9f4;color:#145b42;font-weight:900;white-space:nowrap}
    #expiryAudit .ea-correct-expiry small{font-size:8px;font-weight:700;color:#6a8277;white-space:normal}
    #expiryAudit .ea-correct-expiry.manual{border-color:#eadba9;background:#fff8e8;color:#8b6516}
    #expiryAudit .ea-correct-expiry.pending{border-color:#dde5e1;background:#f5f7f6;color:#75857e}
  `;
  document.head.appendChild(style);

  function updateRow(tr){
    if(!tr) return;
    const cell=tr.querySelector('.ea-correct-cell');
    if(!cell) return;
    const start=tr.querySelector('.ea-start-input')?.value||'';
    const holding=txt(tr.querySelector('.ea-holding')?.textContent);
    if(!start){
      cell.innerHTML='<span class="ea-correct-expiry pending">รอวันเริ่มต้น<small>กรอกเริ่มต้นวันหมดอายุ</small></span>';
      return;
    }
    const std=parseDuration(holding,start);
    if(std.kind==='manual'){
      cell.innerHTML='<span class="ea-correct-expiry manual">ตรวจตามฉลาก<small>Holding Time อ้างอิงบรรจุภัณฑ์</small></span>';
      return;
    }
    if(std.kind!=='fixed'||!std.max){
      cell.innerHTML='<span class="ea-correct-expiry pending">คำนวณไม่ได้<small>ตรวจรูปแบบ Holding Time</small></span>';
      return;
    }
    cell.innerHTML=`<span class="ea-correct-expiry">${formatGregorian(std.max)}<small>เริ่มต้น + ${holding||'Holding Time'}</small></span>`;
  }

  function normalize(){
    const table=document.querySelector('#expiryAudit .ea-table');
    const head=table?.querySelector('thead tr');
    const body=table?.querySelector('#eaBody');
    if(!table||!head||!body) return false;

    let correctHead=head.querySelector('.ea-correct-head');
    const calcHead=head.querySelector('.ea-calc-head');
    if(!correctHead && calcHead){
      correctHead=document.createElement('th');
      correctHead.className='ea-correct-head';
      correctHead.textContent='วันที่หมดอายุที่ถูกต้อง';
      calcHead.insertAdjacentElement('afterend',correctHead);
    } else if(correctHead){
      correctHead.textContent='วันที่หมดอายุที่ถูกต้อง';
    }

    body.querySelectorAll('tr[data-key]').forEach(tr=>{
      let cell=tr.querySelector('.ea-correct-cell');
      const calcCell=tr.querySelector('.ea-calc-cell');
      if(!cell && calcCell){
        cell=document.createElement('td');
        cell.className='ea-correct-cell';
        calcCell.insertAdjacentElement('afterend',cell);
      }
      updateRow(tr);
    });
    return true;
  }

  function schedule(){ [0,40,120,320,750].forEach(ms=>setTimeout(normalize,ms)); }

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('.ea-start-input,#eaCheckedAt,.ea-manual-expiry-input')){
      setTimeout(()=>{ const tr=e.target.closest?.('tr'); if(tr)updateRow(tr); else normalize(); },10);
    }
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaRefresh,.nav button[data-page="expiryAudit"],[data-frequent-key],[data-remove-key],#eaClearSelected,#eaClear')) schedule();
  },true);
  window.addEventListener('ksl-central-synced',schedule);

  if(typeof window.renderExpiryAudit==='function'&&!window.renderExpiryAudit.__kslCorrectExpiryWrapped){
    const base=window.renderExpiryAudit;
    const wrapped=function(){ const out=base.apply(this,arguments); schedule(); return out; };
    wrapped.__kslCorrectExpiryWrapped=true;
    window.renderExpiryAudit=wrapped;
  }

  schedule();
  console.info('[KSL] V6.3 correct expiry date column ready');
})();
