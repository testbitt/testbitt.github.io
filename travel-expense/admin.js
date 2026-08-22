(()=>{
  const API='https://script.google.com/macros/s/AKfycbz6t9MS0Ylx8UYhAC4wNdCUvIqNOVbBcs09FiOLy_uIr-lNztukhD3mjlHgfDC_XjZy/exec';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const money=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  let adminCode='';
  let lastTravel=[];
  let lastOT=[];

  async function api(payload){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const t=await r.text();
    let x;
    try{x=JSON.parse(t)}catch{throw Error('Apps Script ตอบกลับไม่ถูกต้อง กรุณาตรวจ Deploy');}
    if(!x.success)throw Error(x.message||'ดำเนินการไม่สำเร็จ');
    return x;
  }

  function appendUI(){
    if($('goAdminSummary'))return;
    const grid=document.querySelector('#home .grid2');
    if(!grid)return;
    const card=document.createElement('div');
    card.className='card admin-card';
    card.id='goAdminSummary';
    card.innerHTML='<div class="ico">🔐</div><h3>5. Admin</h3><p>สรุปค่าเดินทางและ OT สำหรับผู้ดูแลระบบ</p><span class="tag">ADMIN SUMMARY →</span>';
    grid.appendChild(card);

    const sec=document.createElement('section');
    sec.id='adminSummary';
    sec.className='hidden';
    sec.innerHTML=`
      <button class="back" id="adminBack">‹ กลับหน้าแรก</button>
      <div class="admin-panel">
        <div class="admin-head">
          <div><h2>🔐 Admin • สรุปค่าเดินทางและ OT</h2><p>สรุปข้อมูลทั้งหมดตามเดือน/ช่วงวันที่ พร้อม Export CSV</p></div>
          <button type="button" class="btn summary-secondary" id="adminLock">ออกจาก Admin</button>
        </div>
        <div class="admin-filterbar">
          <div class="f"><label>เดือน</label><input type="month" id="adMonth"></div>
          <div class="f"><label>วันที่เริ่มต้น</label><input type="date" id="adStart"></div>
          <div class="f"><label>วันที่สิ้นสุด</label><input type="date" id="adEnd"></div>
          <div class="f"><label>รหัสพนักงาน</label><input id="adEmployee" inputmode="numeric" placeholder="ทั้งหมด"></div>
          <div class="f"><label>สาขา</label><input id="adBranch" placeholder="ทั้งหมด"></div>
        </div>
        <div class="admin-actions">
          <button type="button" class="btn summary-secondary" id="adReset">ล้าง Filter</button>
          <button type="button" class="btn primary" id="adSearch">ค้นหาและสรุป</button>
        </div>
        <div id="adStatus" class="summary-status"></div>

        <div class="admin-metrics">
          <div class="metric"><small>รายการค่าเดินทาง</small><strong id="adTravelCount">0</strong></div>
          <div class="metric"><small>ระยะทางรวม</small><strong id="adTravelKm">0.00 กม.</strong></div>
          <div class="metric"><small>ค่าเดินทางรวม</small><strong id="adTravelAmount">0.00 บาท</strong></div>
          <div class="metric metric-comp"><small>OT ชดชั่วโมง เข้า-ออก</small><strong id="adCompHours">0.00 ชม.</strong></div>
          <div class="metric metric-paid"><small>OT ทำจ่ายเงิน</small><strong id="adPaidHours">0.00 ชม.</strong></div>
          <div class="metric"><small>ชั่วโมง OT รวม</small><strong id="adTotalHours">0.00 ชม.</strong></div>
        </div>

        <div class="admin-section-head"><h3>💰 รายละเอียดค่าเดินทาง</h3><button type="button" class="btn" id="exportTravel">Export ค่าเดินทาง CSV</button></div>
        <div class="summary-table-wrap"><table class="summary-table"><thead><tr><th>Timestamp</th><th>วันที่</th><th>เลขรายการ</th><th>รหัสพนักงาน</th><th>ชื่อ</th><th>ต้นทาง → ปลายทาง</th><th>สาเหตุ</th><th>ประเภท</th><th>ระยะทาง</th><th>ค่าเดินทาง</th><th>สถานะ</th></tr></thead><tbody id="adTravelBody"><tr><td colspan="11" class="summary-empty">เลือก Filter แล้วกด “ค้นหาและสรุป”</td></tr></tbody></table></div>

        <div class="admin-section-head"><h3>⏰ รายละเอียด OT</h3><button type="button" class="btn" id="exportOT">Export OT CSV</button></div>
        <div class="summary-table-wrap"><table class="summary-table"><thead><tr><th>Timestamp</th><th>วันที่</th><th>เลขรายการ</th><th>รหัสพนักงาน</th><th>ชื่อ</th><th>สาขา</th><th>เวลา</th><th>ชั่วโมง</th><th>ประเภท OT</th><th>เหตุผล</th><th>สถานะ</th></tr></thead><tbody id="adOTBody"><tr><td colspan="11" class="summary-empty">เลือก Filter แล้วกด “ค้นหาและสรุป”</td></tr></tbody></table></div>
      </div>`;
    document.querySelector('main').appendChild(sec);
  }

  function hideAdmin(){
    const sec=$('adminSummary');
    if(sec)sec.classList.add('hidden');
  }

  function showHome(){
    hideAdmin();
    ['travel','ot','travelSummary','otSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('home')&&$('home').classList.remove('hidden');
    scrollTo(0,0);
  }

  function showAdmin(){
    ['home','travel','ot','travelSummary','otSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('adminSummary').classList.remove('hidden');
    scrollTo(0,0);
  }

  async function enterAdmin(){
    const code=prompt('กรุณากรอกรหัส Admin');
    if(code===null)return;
    try{
      const x=await api({action:'verifyAdmin',adminCode:code});
      if(!x.authorized)throw Error('รหัส Admin ไม่ถูกต้อง');
      adminCode=code;
      showAdmin();
      await loadAdmin();
    }catch(e){
      adminCode='';
      alert(e.message);
    }
  }

  function resetFilters(){
    ['adMonth','adStart','adEnd','adEmployee','adBranch'].forEach(id=>$(id).value='');
    loadAdmin();
  }

  async function loadAdmin(){
    if(!adminCode)return;
    if($('adStart').value&&$('adEnd').value&&$('adStart').value>$('adEnd').value)return alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
    $('adStatus').className='summary-status show';
    $('adStatus').textContent='⏳ กำลังโหลดข้อมูล...';
    $('adSearch').disabled=true;
    try{
      const x=await api({
        action:'getAdminSummary',
        adminCode,
        month:$('adMonth').value,
        startDate:$('adStart').value,
        endDate:$('adEnd').value,
        employeeId:$('adEmployee').value.trim(),
        branch:$('adBranch').value.trim()
      });
      lastTravel=x.travelRecords||[];
      lastOT=x.otRecords||[];
      const t=x.totals||{};
      $('adTravelCount').textContent=Number(t.travelCount||0).toLocaleString('th-TH');
      $('adTravelKm').textContent=num(t.totalKm)+' กม.';
      $('adTravelAmount').textContent=money(t.totalAmount)+' บาท';
      $('adCompHours').textContent=num(t.compHours)+' ชม.';
      $('adPaidHours').textContent=num(t.paidHours)+' ชม.';
      $('adTotalHours').textContent=num(t.totalHours)+' ชม.';
      $('adTravelBody').innerHTML=lastTravel.length?lastTravel.map(r=>`<tr><td>${esc(r.timestamp||'-')}</td><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.employeeId)}</td><td>${esc(r.employeeName)}</td><td>${esc(r.origin)} → ${esc(r.destination)}</td><td>${esc(r.travelReason||'-')}</td><td>${esc(r.transportType)}</td><td>${num(r.totalKm)} กม.</td><td class="summary-money">${money(r.amount)} บาท</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="11" class="summary-empty">ไม่พบข้อมูลค่าเดินทางตาม Filter</td></tr>';
      $('adOTBody').innerHTML=lastOT.length?lastOT.map(r=>`<tr><td>${esc(r.timestamp||'-')}</td><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.employeeId)}</td><td>${esc(r.employeeName)}</td><td>${esc(r.branch)}</td><td>${esc(r.startTime)} - ${esc(r.endTime)}</td><td>${num(r.hours)}</td><td>${esc(r.otType)}</td><td>${esc(r.reason)}</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="11" class="summary-empty">ไม่พบข้อมูล OT ตาม Filter</td></tr>';
      $('adStatus').textContent=`✓ ค่าเดินทาง ${lastTravel.length.toLocaleString('th-TH')} รายการ • OT ${lastOT.length.toLocaleString('th-TH')} รายการ`;
    }catch(e){
      $('adStatus').textContent='⚠️ '+e.message;
      if(/รหัส Admin/i.test(e.message))adminCode='';
    }finally{$('adSearch').disabled=false;}
  }

  function csvCell(v){
    const s=String(v??'').replace(/"/g,'""');
    return `"${s}"`;
  }
  function downloadCSV(filename,headers,rows){
    const csv='\ufeff'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  function exportTravel(){
    downloadCSV('KAMU_Travel_Admin.csv',['Timestamp','วันที่','เลขรายการ','รหัสพนักงาน','ชื่อ','ต้นทาง','ปลายทาง','สาเหตุในการเดินทาง','ประเภท','ระยะทางรวม','ค่าเดินทาง','สถานะ'],lastTravel.map(r=>[r.timestamp,r.date,r.recordId,r.employeeId,r.employeeName,r.origin,r.destination,r.travelReason,r.transportType,r.totalKm,r.amount,r.status]));
  }
  function exportOT(){
    downloadCSV('KAMU_OT_Admin.csv',['Timestamp','วันที่','เลขรายการ','รหัสพนักงาน','ชื่อ','สาขา','เวลาเริ่ม','เวลาสิ้นสุด','ชั่วโมง','ประเภท OT','เหตุผล','สถานะ'],lastOT.map(r=>[r.timestamp,r.date,r.recordId,r.employeeId,r.employeeName,r.branch,r.startTime,r.endTime,r.hours,r.otType,r.reason,r.status]));
  }

  window.initKamuAdmin=()=>{
    appendUI();
    $('goAdminSummary').onclick=enterAdmin;
    $('adminBack').onclick=showHome;
    $('adminLock').onclick=()=>{adminCode='';showHome();};
    $('adSearch').onclick=loadAdmin;
    $('adReset').onclick=resetFilters;
    $('exportTravel').onclick=exportTravel;
    $('exportOT').onclick=exportOT;
    $('homeBtn')&&$('homeBtn').addEventListener('click',hideAdmin);
    document.querySelectorAll('[data-home]').forEach(el=>el.addEventListener('click',hideAdmin));
  };
})();