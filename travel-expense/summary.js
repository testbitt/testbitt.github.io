(()=>{
  const API='https://script.google.com/macros/s/AKfycbzCc6jDCvwzIx8GMyDslEh607Ggi3h-DgOFUGTKhyWH3KbSqXo3S7s45DNlhynk956F/exec';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const num=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});

  async function api(d){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(d)});
    const t=await r.text();
    let x;
    try{x=JSON.parse(t)}catch{throw Error('Apps Script ตอบกลับไม่ถูกต้อง กรุณาตรวจ Deploy');}
    if(!x.success)throw Error(x.message||'ดำเนินการไม่สำเร็จ');
    return x;
  }

  function prepareUI(){
    const travelCard=document.querySelector('#goTravelSummary h3');
    const otCard=document.querySelector('#goOTSummary h3');
    const travelTag=document.querySelector('#goTravelSummary .tag');
    const otTag=document.querySelector('#goOTSummary .tag');
    const travelTitle=document.querySelector('#travelSummary h2');
    const otTitle=document.querySelector('#otSummary h2');
    if(travelCard)travelCard.textContent='3. ตรวจสอบค่าเดินทาง';
    if(otCard)otCard.textContent='4. ตรวจสอบการทำ OT';
    if(travelTag)travelTag.textContent='TRAVEL CHECK →';
    if(otTag)otTag.textContent='OT CHECK →';
    if(travelTitle)travelTitle.textContent='💰 ตรวจสอบค่าเดินทาง';
    if(otTitle)otTitle.textContent='📊 ตรวจสอบการทำ OT';

    const hoursEl=$('osHours');
    if(hoursEl){
      const metric=hoursEl.closest('.metric');
      const label=metric&&metric.querySelector('small');
      if(label)label.textContent='OT ใช้สำหรับชดชั่วโมง เข้า-ออก';
      if(metric&&!$('osPaidHours')){
        const paid=document.createElement('div');
        paid.className='metric';
        paid.innerHTML='<small>OT ทำจ่ายเงิน</small><strong id="osPaidHours">0.00 ชม.</strong>';
        metric.insertAdjacentElement('afterend',paid);
      }
    }

    if(!document.getElementById('otSplitStyle')){
      const style=document.createElement('style');
      style.id='otSplitStyle';
      style.textContent='@media(min-width:761px){#otSummary .metric-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}';
      document.head.appendChild(style);
    }
  }

  function clearTravel(){
    ['tsEmployeeId','tsMonth','tsStart','tsEnd'].forEach(i=>$(i).value='');
    $('tsCount').textContent='0';
    $('tsKm').textContent='0.00 กม.';
    $('tsAmount').textContent='0.00 บาท';
    $('tsStatus').className='summary-status';
    $('tsBody').innerHTML='<tr><td colspan="8" class="summary-empty">กรอกรหัสพนักงาน แล้วกด “ค้นหาและสรุป”</td></tr>';
  }

  function clearOT(){
    ['osEmployeeId','osMonth','osStart','osEnd'].forEach(i=>$(i).value='');
    $('osCount').textContent='0';
    $('osHours').textContent='0.00 ชม.';
    if($('osPaidHours'))$('osPaidHours').textContent='0.00 ชม.';
    $('osName').textContent='-';
    $('osStatus').className='summary-status';
    $('osBody').innerHTML='<tr><td colspan="8" class="summary-empty">กรอกรหัสพนักงาน แล้วกด “ค้นหาและสรุป”</td></tr>';
  }

  async function loadTravel(){
    const employeeId=$('tsEmployeeId').value.trim();
    if(!employeeId)return alert('กรุณากรอกรหัสพนักงาน');
    if($('tsStart').value&&$('tsEnd').value&&$('tsStart').value>$('tsEnd').value)return alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
    $('tsStatus').className='summary-status show';
    $('tsStatus').textContent='⏳ กำลังโหลดข้อมูล...';
    $('tsSearch').disabled=true;
    try{
      const x=await api({action:'getTravelSummary',employeeId,month:$('tsMonth').value,startDate:$('tsStart').value,endDate:$('tsEnd').value});
      $('tsCount').textContent=Number(x.totals?.count||0).toLocaleString('th-TH');
      $('tsKm').textContent=num(x.totals?.totalKm)+' กม.';
      $('tsAmount').textContent=money(x.totals?.totalAmount)+' บาท';
      const rows=x.records||[];
      $('tsBody').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.origin)} → ${esc(r.destination)}</td><td>${esc(r.transportType)}</td><td>${num(r.totalKm)} กม.</td><td class="summary-money">${money(r.amount)} บาท</td><td><span class="summary-attach">${r.receiptOutUrl?`<a href="${esc(r.receiptOutUrl)}" target="_blank" rel="noopener">ขาไป</a>`:''}${r.receiptBackUrl?`<a href="${esc(r.receiptBackUrl)}" target="_blank" rel="noopener">ขากลับ</a>`:''}${!r.receiptOutUrl&&!r.receiptBackUrl?'-':''}</span></td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="8" class="summary-empty">ไม่พบข้อมูลตาม Filter ที่เลือก</td></tr>';
      $('tsStatus').textContent='✓ พบ '+rows.length.toLocaleString('th-TH')+' รายการ'+(x.employeeName?' • '+x.employeeName:'');
    }catch(e){
      $('tsStatus').textContent='⚠️ '+e.message;
      $('tsBody').innerHTML='<tr><td colspan="8" class="summary-empty">โหลดข้อมูลไม่สำเร็จ</td></tr>';
    }finally{$('tsSearch').disabled=false;}
  }

  async function loadOT(){
    const employeeId=$('osEmployeeId').value.trim();
    if(!employeeId)return alert('กรุณากรอกรหัสพนักงาน');
    if($('osStart').value&&$('osEnd').value&&$('osStart').value>$('osEnd').value)return alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
    $('osStatus').className='summary-status show';
    $('osStatus').textContent='⏳ กำลังโหลดข้อมูล...';
    $('osSearch').disabled=true;
    try{
      const x=await api({action:'getOTSummary',employeeId,month:$('osMonth').value,startDate:$('osStart').value,endDate:$('osEnd').value});
      const rows=x.records||[];
      const compensateHours=rows.reduce((sum,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?sum+Number(r.hours||0):sum,0);
      const paidHours=rows.reduce((sum,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?sum+Number(r.hours||0):sum,0);
      $('osCount').textContent=Number(x.totals?.count||rows.length||0).toLocaleString('th-TH');
      $('osHours').textContent=num(compensateHours)+' ชม.';
      if($('osPaidHours'))$('osPaidHours').textContent=num(paidHours)+' ชม.';
      $('osName').textContent=x.employeeName||'-';
      $('osBody').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.branch)}</td><td>${esc(r.startTime)} - ${esc(r.endTime)}</td><td>${num(r.hours)}</td><td>${esc(r.otType)}</td><td>${esc(r.reason)}</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="8" class="summary-empty">ไม่พบข้อมูลตาม Filter ที่เลือก</td></tr>';
      $('osStatus').textContent='✓ พบ '+rows.length.toLocaleString('th-TH')+' รายการ'+(x.employeeName?' • '+x.employeeName:'');
    }catch(e){
      $('osStatus').textContent='⚠️ '+e.message;
      $('osBody').innerHTML='<tr><td colspan="8" class="summary-empty">โหลดข้อมูลไม่สำเร็จ</td></tr>';
    }finally{$('osSearch').disabled=false;}
  }

  window.initKamuSummary=()=>{
    prepareUI();
    $('tsSearch').onclick=loadTravel;
    $('osSearch').onclick=loadOT;
    $('tsReset').onclick=clearTravel;
    $('osReset').onclick=clearOT;
  };
})();