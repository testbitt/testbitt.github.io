/* KSL V4.6 — fix expiry item data + white expiry slip */
(() => {
  'use strict';

  const clean = v => String(v ?? '').trim();
  const esc = v => clean(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function holdingRows(){
    try {
      if (typeof appState !== 'undefined' && Array.isArray(appState.data) && appState.data.length) {
        return appState.data;
      }
    } catch {}
    try {
      if (typeof SEED_DATA !== 'undefined' && Array.isArray(SEED_DATA) && SEED_DATA.length) {
        return SEED_DATA;
      }
    } catch {}
    return [];
  }

  function nameOf(r){ return clean(r?.['ชื่อวัตถุดิบ'] ?? r?.['รายการ'] ?? r?.['วัตถุดิบ']); }
  function statusOf(r){ return clean(r?.['สถานะ'] ?? r?.['สถานะสินค้า']); }
  function holdOf(r){ return clean(r?.['อายุการจัดเก็บ'] ?? r?.['Holding Time'] ?? r?.['holding_time']); }

  function rowsForItem(item){
    return holdingRows().filter(r => nameOf(r) === clean(item));
  }

  function selection(){
    const item = document.getElementById('calcItem')?.value || '';
    const idx = Number(document.getElementById('calcStatus')?.value || 0);
    const rows = rowsForItem(item);
    return {
      item,
      row: rows[idx],
      start: document.getElementById('calcStart')?.value || '',
      branch: document.getElementById('calcBranch')?.value || '',
      qty: document.getElementById('calcQty')?.value || '',
      preparedBy: document.getElementById('calcPreparedBy')?.value || ''
    };
  }

  function setTxt(id,val){ const el=document.getElementById(id); if(el) el.textContent=clean(val); }

  function dateParts(v){
    try { if(typeof labelDateParts === 'function') return labelDateParts(v); } catch {}
    if(!v) return {date:'-',time:'-'};
    const d = v instanceof Date ? v : new Date(v);
    if(Number.isNaN(d.getTime())) return {date:'-',time:'-'};
    return {
      date:d.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'}),
      time:d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false})
    };
  }

  function computeExpiry(row,start){
    if(!row || !start) return null;
    try {
      if(typeof parseHoldingTime === 'function') return parseHoldingTime(holdOf(row),start);
    } catch {}
    return null;
  }

  window.populateCalculator = function(){
    const sel=document.getElementById('calcItem');
    if(!sel) return;
    const rows=holdingRows();
    const items=[...new Set(rows.map(nameOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
    const current=sel.value;
    sel.innerHTML=items.length ? items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('') : '<option value="">ไม่มีข้อมูล</option>';
    if(current && items.includes(current)) sel.value=current;

    const st=document.getElementById('calcStart');
    if(st && !st.value){
      const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
      st.value=d.toISOString().slice(0,16);
    }
    window.refreshCalcStatuses();
    window.previewExpiryLabel();
  };

  window.refreshCalcStatuses = function(){
    const item=document.getElementById('calcItem')?.value || '';
    const el=document.getElementById('calcStatus');
    if(!el) return;
    const rows=rowsForItem(item);
    const old=Number(el.value || 0);
    el.innerHTML = rows.length
      ? rows.map((r,i)=>`<option value="${i}">${esc(statusOf(r) || 'ไม่ระบุสถานะ')}${holdOf(r)?' • '+esc(holdOf(r)):''}</option>`).join('')
      : '<option value="">ไม่มีสถานะ</option>';
    if(rows.length) el.value=String(old < rows.length ? old : 0);
    window.previewExpiryLabel();
  };

  window.previewExpiryLabel = function(explicit){
    if(!document.getElementById('expiryLabel')) return;
    const s=selection();
    const expiry = explicit !== undefined ? explicit : computeExpiry(s.row,s.start);
    const p=dateParts(s.start), e=dateParts(expiry);
    setTxt('labelBranch',s.branch);
    setTxt('labelPrepDate',p.date==='-'?'':p.date);
    setTxt('labelPrepTime',p.time==='-'?'':p.time);
    setTxt('labelExpDate',expiry && e.date!=='-' ? e.date : '');
    setTxt('labelExpTime',expiry && e.time!=='-' ? e.time : '');
    setTxt('labelProduct',s.item);
    setTxt('labelQty',s.qty);
    setTxt('labelPreparedBy',s.preparedBy);
    const badge=document.getElementById('labelCalcState');
    if(badge) badge.textContent=expiry?'คำนวณแล้ว':'รอคำนวณ';
  };

  window.calculateExpiry = function(){
    const s=selection();
    const out=document.getElementById('calcResult');
    if(!s.row || !s.start){
      try { if(typeof toast === 'function') toast('กรุณาเลือกรายการ สถานะ และวัน–เวลาผลิตให้ครบ','warn'); else alert('กรุณาเลือกรายการ สถานะ และวัน–เวลาผลิตให้ครบ'); } catch {}
      return;
    }
    const expiry=computeExpiry(s.row,s.start);
    window.previewExpiryLabel(expiry);
    if(out) out.classList.add('show');
    if(!expiry){
      if(out) out.innerHTML=`<b>⚠️ ไม่สามารถคำนวณวันหมดอายุอัตโนมัติ</b><br>Holding Time: ${esc(holdOf(s.row))}<br><span class="small-note">กรุณาตรวจสอบฉลากหรือมาตรฐานจริง</span>`;
      return;
    }
    const p=dateParts(s.start),e=dateParts(expiry);
    if(out) out.innerHTML=`<b>✅ สร้างใบหมดอายุแล้ว</b><div class="calc-result-grid"><span>วันที่ผลิต</span><strong>${p.date} • ${p.time}</strong><span>วันหมดอายุ</span><strong>${e.date} • ${e.time}</strong><span>Holding Time</span><strong>${esc(holdOf(s.row))}</strong></div>`;
  };

  function whiteSlip(){
    let s=document.getElementById('ksl-v46-white-slip');
    if(s) s.remove();
    s=document.createElement('style');
    s.id='ksl-v46-white-slip';
    s.textContent=`
      #expiryLabel,.expiry-paper{background:#fff!important;background-color:#fff!important}
      #expiryLabel .ep-mascot,.expiry-paper>.ep-mascot{background:#fff!important;background-color:#fff!important}
      .expiry-paper-shell{background:#f3f7f5!important}
      @media print{
        html,body,#expiryLabel,.expiry-paper{background:#fff!important;background-color:#fff!important}
        #expiryLabel .ep-mascot,.expiry-paper>.ep-mascot{background:#fff!important;background-color:#fff!important}
      }
    `;
    document.head.appendChild(s);
  }

  function bind(){
    const item=document.getElementById('calcItem');
    if(item && item.dataset.v46!=='1'){
      item.dataset.v46='1';
      item.addEventListener('change',()=>window.refreshCalcStatuses());
    }
  }

  let last='';
  function refreshIfChanged(){
    const rows=holdingRows();
    const sig=rows.length+'|'+nameOf(rows[0])+'|'+nameOf(rows[rows.length-1]);
    if(sig!==last){ last=sig; window.populateCalculator(); }
  }

  function boot(){
    whiteSlip(); bind(); refreshIfChanged();
    setTimeout(()=>{whiteSlip();bind();window.populateCalculator();},250);
    setTimeout(()=>{whiteSlip();bind();window.populateCalculator();},900);
    setInterval(refreshIfChanged,1800);
    console.info('[KSL] patch-v46 loaded — Holding Time rows:',holdingRows().length);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
