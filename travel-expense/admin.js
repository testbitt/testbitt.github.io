(()=>{
  const API=window.KAMU_API||'';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  let adminCode='';
  let travelRows=[];
  let otRows=[];

  async function api(payload){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const t=await r.text();
    let x;
    try{x=JSON.parse(t)}catch{throw Error('Apps Script ตอบกลับไม่ถูกต้อง กรุณาตรวจ Deploy');}
    if(!x.success)throw Error(x.message||'ดำเนินการไม่สำเร็จ');
    return x;
  }

  function appendStyle(){
    if($('adminSplitStyle'))return;
    const s=document.createElement('style');
    s.id='adminSplitStyle';
    s.textContent=`
      .admin-tabs{display:flex;gap:10px;margin:18px 0}.admin-tab{flex:1;height:48px;border:1px solid #dbe8df;border-radius:14px;background:#fff;font-weight:900;color:#29533a;cursor:pointer}.admin-tab.active{background:linear-gradient(90deg,#255f3e,#3d8558);color:#fff;border-color:transparent}.admin-subpanel{margin-top:10px}.admin-subpanel.hidden{display:none!important}.admin-filterbar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.admin-actions{display:flex;justify-content:flex-end;gap:8px;margin:14px 0}.admin-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}.admin-note{padding:12px 14px;border-radius:12px;background:#fff8dc;color:#785a00;font-size:12px;margin:10px 0}.admin-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px}.admin-panel .summary-table{min-width:1050px}@media(max-width:760px){.admin-filterbar,.admin-metrics{grid-template-columns:1fr}.admin-tabs,.admin-actions,.admin-section-head{flex-direction:column}.admin-tab,.admin-actions .btn,.admin-section-head .btn{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function appendUI(){
    if($('goAdminSummary'))return;
    appendStyle();
    const grid=document.querySelector('#home .grid2');
    const card=document.createElement('div');
    card.className='card admin-card';
    card.id='goAdminSummary';
    card.innerHTML='<div class="ico">🔐</div><h3>5. Admin</h3><p>สรุปค่าเดินทางและ OT แยกเมนู</p><span class="tag">ADMIN →</span>';
    grid.appendChild(card);

    const sec=document.createElement('section');
    sec.id='adminSummary';
    sec.className='hidden';
    sec.innerHTML=`
      <button class="back" id="adminBack">‹ กลับหน้าแรก</button>
      <div class="admin-panel">
        <div class="admin-head"><div><h2>🔐 Admin</h2><p>เลือกดูค่าเดินทางหรือ OT แยกกัน ข้อมูลจะแสดงเฉพาะเมื่อเลือก Filter แล้วเท่านั้น</p></div><button type="button" class="btn" id="adminLock">ออกจาก Admin</button></div>
        <div class="admin-tabs"><button type="button" class="admin-tab active" id="tabTravel">🚙 ค่าเดินทาง</button><button type="button" class="admin-tab" id="tabOT">⏰ OT</button></div>

        <div id="adminTravelPanel" class="admin-subpanel">
          <h3>🚙 สรุปค่าเดินทาง</h3>
          <div class="admin-filterbar">
            <div class="f"><label>เดือน</label><input type="month" id="trMonth"></div>
            <div class="f"><label>วันที่เริ่มต้น</label><input type="date" id="trStart"></div>
            <div class="f"><label>วันที่สิ้นสุด</label><input type="date" id="trEnd"></div>
            <div class="f"><label>รหัสพนักงาน</label><input id="trEmployee" inputmode="numeric" placeholder="ระบุรหัส"></div>
            <div class="f"><label>สาขา</label><input id="trBranch" placeholder="ระบุสาขา"></div>
          </div>
          <div class="admin-actions"><button type="button" class="btn" id="trReset">ล้าง Filter</button><button type="button" class="btn primary" id="trSearch">ค้นหาค่าเดินทาง</button></div>
          <div id="trStatus" class="admin-note">กรุณาเลือก Filter อย่างน้อย 1 รายการ แล้วกดค้นหา</div>
          <div class="admin-metrics"><div class="metric"><small>จำนวนรายการ</small><strong id="trCount">0</strong></div><div class="metric"><small>ระยะทางรวม</small><strong id="trKm">0.00 กม.</strong></div><div class="metric"><small>ค่าเดินทางรวม</small><strong id="trAmount">0.00 บาท</strong></div></div>
          <div class="admin-section-head"><h3>รายละเอียดค่าเดินทาง</h3><button type="button" class="btn" id="exportTravel">Export ค่าเดินทาง CSV</button></div>
          <div class="summary-table-wrap"><table class="summary-table"><thead><tr><th>Timestamp</th><th>วันที่</th><th>เลขรายการ</th><th>รหัสพนักงาน</th><th>ชื่อ</th><th>ต้นทาง → ปลายทาง</th><th>สาเหตุ</th><th>ประเภท</th><th>ระยะทาง</th><th>ค่าเดินทาง</th><th>สถานะ</th></tr></thead><tbody id="trBody"><tr><td colspan="11" class="summary-empty">ยังไม่แสดงข้อมูลจนกว่าจะเลือก Filter</td></tr></tbody></table></div>
        </div>

        <div id="adminOTPanel" class="admin-subpanel hidden">
          <h3>⏰ สรุปการทำ OT</h3>
          <div class="admin-filterbar">
            <div class="f"><label>เดือน</label><input type="month" id="aoMonth"></div>
            <div class="f"><label>วันที่เริ่มต้น</label><input type="date" id="aoStart"></div>
            <div class="f"><label>วันที่สิ้นสุด</label><input type="date" id="aoEnd"></div>
            <div class="f"><label>รหัสพนักงาน</label><input id="aoEmployee" inputmode="numeric" placeholder="ระบุรหัส"></div>
            <div class="f"><label>สาขา</label><input id="aoBranch" placeholder="ระบุสาขา"></div>
          </div>
          <div class="admin-actions"><button type="button" class="btn" id="aoReset">ล้าง Filter</button><button type="button" class="btn primary" id="aoSearch">ค้นหา OT</button></div>
          <div id="aoStatus" class="admin-note">กรุณาเลือก Filter อย่างน้อย 1 รายการ แล้วกดค้นหา</div>
          <div class="admin-metrics"><div class="metric"><small>OT ชดชั่วโมง เข้า-ออก</small><strong id="aoComp">0.00 ชม.</strong></div><div class="metric"><small>OT ทำจ่ายเงิน</small><strong id="aoPaid">0.00 ชม.</strong></div><div class="metric"><small>ชั่วโมง OT รวม</small><strong id="aoTotal">0.00 ชม.</strong></div></div>
          <div class="admin-section-head"><h3>รายละเอียด OT</h3><button type="button" class="btn" id="exportOT">Export OT CSV</button></div>
          <div class="summary-table-wrap"><table class="summary-table"><thead><tr><th>Timestamp</th><th>วันที่</th><th>เลขรายการ</th><th>รหัสพนักงาน</th><th>ชื่อ</th><th>สาขา</th><th>เวลา</th><th>ชั่วโมง</th><th>ประเภท OT</th><th>เหตุผล</th><th>สถานะ</th></tr></thead><tbody id="aoBody"><tr><td colspan="11" class="summary-empty">ยังไม่แสดงข้อมูลจนกว่าจะเลือก Filter</td></tr></tbody></table></div>
        </div>
      </div>`;
    document.querySelector('main').appendChild(sec);
  }

  function filters(prefix){
    if(prefix==='tr')return {month:$('trMonth').value,start:$('trStart').value,end:$('trEnd').value,employee:$('trEmployee').value.trim(),branch:$('trBranch').value.trim()};
    return {month:$('aoMonth').value,start:$('aoStart').value,end:$('aoEnd').value,employee:$('aoEmployee').value.trim(),branch:$('aoBranch').value.trim()};
  }
  function hasFilter(f){return !!(f.month||f.start||f.end||f.employee||f.branch);}
  function validDates(f){if(f.start&&f.end&&f.start>f.end){alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');return false;}return true;}

  function clearTravel(){
    ['trMonth','trStart','trEnd','trEmployee','trBranch'].forEach(id=>$(id).value='');travelRows=[];
    $('trCount').textContent='0';$('trKm').textContent='0.00 กม.';$('trAmount').textContent='0.00 บาท';
    $('trStatus').textContent='กรุณาเลือก Filter อย่างน้อย 1 รายการ แล้วกดค้นหา';
    $('trBody').innerHTML='<tr><td colspan="11" class="summary-empty">ยังไม่แสดงข้อมูลจนกว่าจะเลือก Filter</td></tr>';
  }
  function clearOT(){
    ['aoMonth','aoStart','aoEnd','aoEmployee','aoBranch'].forEach(id=>$(id).value='');otRows=[];
    $('aoComp').textContent='0.00 ชม.';$('aoPaid').textContent='0.00 ชม.';$('aoTotal').textContent='0.00 ชม.';
    $('aoStatus').textContent='กรุณาเลือก Filter อย่างน้อย 1 รายการ แล้วกดค้นหา';
    $('aoBody').innerHTML='<tr><td colspan="11" class="summary-empty">ยังไม่แสดงข้อมูลจนกว่าจะเลือก Filter</td></tr>';
  }

  async function searchTravel(){
    const f=filters('tr');if(!hasFilter(f)){clearTravel();return alert('กรุณาเลือก Filter ค่าเดินทางอย่างน้อย 1 รายการ');}if(!validDates(f))return;
    $('trSearch').disabled=true;$('trStatus').textContent='⏳ กำลังโหลดข้อมูลค่าเดินทาง...';
    try{
      const x=await api({action:'getAdminSummary',adminCode,month:f.month,startDate:f.start,endDate:f.end,employeeId:f.employee,branch:f.branch});
      travelRows=x.travelRecords||[];
      const km=travelRows.reduce((s,r)=>s+Number(r.totalKm||0),0), amount=travelRows.reduce((s,r)=>s+Number(r.amount||0),0);
      $('trCount').textContent=travelRows.length.toLocaleString('th-TH');$('trKm').textContent=num(km)+' กม.';$('trAmount').textContent=num(amount)+' บาท';
      $('trBody').innerHTML=travelRows.length?travelRows.map(r=>`<tr><td>${esc(r.timestamp||'-')}</td><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.employeeId)}</td><td>${esc(r.employeeName)}</td><td>${esc(r.origin)} → ${esc(r.destination)}</td><td>${esc(r.travelReason||'-')}</td><td>${esc(r.transportType)}</td><td>${num(r.totalKm)} กม.</td><td>${num(r.amount)} บาท</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="11" class="summary-empty">ไม่พบข้อมูลตาม Filter</td></tr>';
      $('trStatus').textContent='✓ พบ '+travelRows.length.toLocaleString('th-TH')+' รายการตาม Filter';
    }catch(e){$('trStatus').textContent='⚠️ '+e.message;travelRows=[];}finally{$('trSearch').disabled=false;}
  }

  async function searchOT(){
    const f=filters('ao');if(!hasFilter(f)){clearOT();return alert('กรุณาเลือก Filter OT อย่างน้อย 1 รายการ');}if(!validDates(f))return;
    $('aoSearch').disabled=true;$('aoStatus').textContent='⏳ กำลังโหลดข้อมูล OT...';
    try{
      const x=await api({action:'getAdminSummary',adminCode,month:f.month,startDate:f.start,endDate:f.end,employeeId:f.employee,branch:f.branch});
      otRows=x.otRecords||[];
      const comp=otRows.reduce((s,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
      const paid=otRows.reduce((s,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
      const total=otRows.reduce((s,r)=>s+Number(r.hours||0),0);
      $('aoComp').textContent=num(comp)+' ชม.';$('aoPaid').textContent=num(paid)+' ชม.';$('aoTotal').textContent=num(total)+' ชม.';
      $('aoBody').innerHTML=otRows.length?otRows.map(r=>`<tr><td>${esc(r.timestamp||'-')}</td><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.employeeId)}</td><td>${esc(r.employeeName)}</td><td>${esc(r.branch)}</td><td>${esc(r.startTime)} - ${esc(r.endTime)}</td><td>${num(r.hours)}</td><td>${esc(r.otType)}</td><td>${esc(r.reason)}</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="11" class="summary-empty">ไม่พบข้อมูลตาม Filter</td></tr>';
      $('aoStatus').textContent='✓ พบ '+otRows.length.toLocaleString('th-TH')+' รายการตาม Filter';
    }catch(e){$('aoStatus').textContent='⚠️ '+e.message;otRows=[];}finally{$('aoSearch').disabled=false;}
  }

  function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
  function download(name,headers,rows){if(!rows.length)return alert('ไม่มีข้อมูลตาม Filter สำหรับ Export');const csv='\ufeff'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  function exportTravel(){download('KAMU_Travel_Admin_Filtered.csv',['Timestamp','วันที่','เลขรายการ','รหัสพนักงาน','ชื่อ','ต้นทาง','ปลายทาง','สาเหตุในการเดินทาง','ประเภท','ระยะทางรวม','ค่าเดินทาง','สถานะ'],travelRows.map(r=>[r.timestamp,r.date,r.recordId,r.employeeId,r.employeeName,r.origin,r.destination,r.travelReason,r.transportType,r.totalKm,r.amount,r.status]));}
  function exportOT(){download('KAMU_OT_Admin_Filtered.csv',['Timestamp','วันที่','เลขรายการ','รหัสพนักงาน','ชื่อ','สาขา','เวลาเริ่ม','เวลาสิ้นสุด','ชั่วโมง','ประเภท OT','เหตุผล','สถานะ'],otRows.map(r=>[r.timestamp,r.date,r.recordId,r.employeeId,r.employeeName,r.branch,r.startTime,r.endTime,r.hours,r.otType,r.reason,r.status]));}

  function showHome(){
    $('adminSummary')?.classList.add('hidden');['travel','ot','travelSummary','otSummary'].forEach(id=>$(id)?.classList.add('hidden'));$('home')?.classList.remove('hidden');scrollTo(0,0);
  }
  function showAdmin(){['home','travel','ot','travelSummary','otSummary'].forEach(id=>$(id)?.classList.add('hidden'));$('adminSummary').classList.remove('hidden');clearTravel();clearOT();scrollTo(0,0);}
  function switchTab(tab){const travel=tab==='travel';$('adminTravelPanel').classList.toggle('hidden',!travel);$('adminOTPanel').classList.toggle('hidden',travel);$('tabTravel').classList.toggle('active',travel);$('tabOT').classList.toggle('active',!travel);}

  async function enterAdmin(){
    const code=prompt('กรุณากรอกรหัส Admin');if(code===null)return;
    try{const x=await api({action:'verifyAdmin',adminCode:code});if(!x.authorized)throw Error('รหัส Admin ไม่ถูกต้อง');adminCode=code;showAdmin();switchTab('travel');}
    catch(e){adminCode='';alert(e.message);}
  }

  window.initKamuAdmin=()=>{
    appendUI();
    $('goAdminSummary').onclick=enterAdmin;$('adminBack').onclick=showHome;$('adminLock').onclick=()=>{adminCode='';showHome();};
    $('tabTravel').onclick=()=>switchTab('travel');$('tabOT').onclick=()=>switchTab('ot');
    $('trSearch').onclick=searchTravel;$('trReset').onclick=clearTravel;$('aoSearch').onclick=searchOT;$('aoReset').onclick=clearOT;
    $('exportTravel').onclick=exportTravel;$('exportOT').onclick=exportOT;
  };
})();