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

  const REPORT_SHEET_ID='1vEqeMB2WYka2p64LpV8fvuUuX-MAHHuJlPAydUPuguQ';
  const reportCache={travel:{rows:null,ts:0},ot:{rows:null,ts:0}};
  const REPORT_CACHE_MS=60000;

  function gvizTable(sheetName){
    return new Promise((resolve,reject)=>{
      const cb='__kamuGviz_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      let finished=false;
      const cleanup=()=>{
        try{delete window[cb];}catch(_){window[cb]=undefined;}
        if(script.parentNode)script.parentNode.removeChild(script);
      };
      const timer=setTimeout(()=>{
        if(finished)return;finished=true;cleanup();
        reject(Error('โหลดข้อมูล Google Sheet ใช้เวลานานเกินไป'));
      },15000);
      window[cb]=data=>{
        if(finished)return;finished=true;clearTimeout(timer);cleanup();
        if(!data||data.status==='error'||!data.table){
          const msg=data&&data.errors&&data.errors[0]&&data.errors[0].detailed_message;
          reject(Error(msg||'Google Sheet ตอบกลับไม่ถูกต้อง'));
          return;
        }
        resolve(data.table);
      };
      script.onerror=()=>{
        if(finished)return;finished=true;clearTimeout(timer);cleanup();
        reject(Error('เชื่อมต่อ Google Sheet ไม่สำเร็จ'));
      };
      const tqx='out:json;responseHandler:'+cb;
      script.src='https://docs.google.com/spreadsheets/d/'+REPORT_SHEET_ID+
        '/gviz/tq?sheet='+encodeURIComponent(sheetName)+
        '&headers=1&tqx='+encodeURIComponent(tqx)+'&_='+Date.now();
      document.head.appendChild(script);
    });
  }

  function cobj(row,i){return row&&row.c&&row.c[i]?row.c[i]:null;}
  function ctext(row,i){
    const c=cobj(row,i);if(!c)return '';
    if(c.f!==undefined&&c.f!==null&&String(c.f)!=='')return String(c.f).trim();
    if(Array.isArray(c.v))return c.v.join(':');
    return c.v===null||c.v===undefined?'':String(c.v).trim();
  }
  function cnum(row,i){
    const c=cobj(row,i);if(!c)return 0;
    if(typeof c.v==='number'&&Number.isFinite(c.v))return c.v;
    const n=Number(String(c.f!==undefined&&c.f!==null?c.f:c.v||'').replace(/,/g,''));
    return Number.isFinite(n)?n:0;
  }
  function cdate(row,i){
    const c=cobj(row,i);if(!c)return '';
    if(c.v instanceof Date&&!isNaN(c.v)){
      return c.v.getFullYear()+'-'+String(c.v.getMonth()+1).padStart(2,'0')+'-'+String(c.v.getDate()).padStart(2,'0');
    }
    const raw=c.v===null||c.v===undefined?'':String(c.v).trim();
    let m=raw.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})/);
    if(m)return m[1]+'-'+String(Number(m[2])+1).padStart(2,'0')+'-'+String(Number(m[3])).padStart(2,'0');
    const f=ctext(row,i);
    if(/^\d{4}-\d{2}-\d{2}$/.test(f))return f;
    m=f.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m)return m[3]+'-'+String(Number(m[2])).padStart(2,'0')+'-'+String(Number(m[1])).padStart(2,'0');
    return f;
  }
  function ctime(row,i){
    const c=cobj(row,i);if(!c)return '';
    if(Array.isArray(c.v))return String(c.v[0]||0).padStart(2,'0')+':'+String(c.v[1]||0).padStart(2,'0');
    const raw=c.v===null||c.v===undefined?'':String(c.v).trim();
    const m=raw.match(/^Date\([^,]+,[^,]+,[^,]+,(\d{1,2}),(\d{1,2})/);
    if(m)return String(Number(m[1])).padStart(2,'0')+':'+String(Number(m[2])).padStart(2,'0');
    return ctext(row,i);
  }

  function parseTravelTable(table){
    return (table.rows||[]).map(r=>({
      timestamp:ctext(r,0),recordId:ctext(r,1),date:cdate(r,2),
      origin:ctext(r,3),destination:ctext(r,4),employeeId:ctext(r,5),
      employeeName:ctext(r,6),transportType:ctext(r,7),
      distanceOut:cnum(r,8),receiptOutUrl:ctext(r,9),distanceBack:cnum(r,10),
      receiptBackUrl:ctext(r,11),totalKm:cnum(r,12),amount:cnum(r,13),
      status:ctext(r,14),travelReason:ctext(r,15)
    })).filter(r=>r.date||r.recordId||r.employeeId);
  }
  function parseOTTable(table){
    return (table.rows||[]).map(r=>({
      timestamp:ctext(r,0),recordId:ctext(r,1),employeeId:ctext(r,2),
      employeeName:ctext(r,3),branch:ctext(r,4),date:cdate(r,5),
      startTime:ctime(r,6),endTime:ctime(r,7),hours:cnum(r,8),
      otType:ctext(r,9),reason:ctext(r,10),status:ctext(r,11)
    })).filter(r=>r.date||r.recordId||r.employeeId);
  }
  async function reportRows(type){
    const cache=reportCache[type];
    if(cache.rows&&Date.now()-cache.ts<REPORT_CACHE_MS)return cache.rows;
    const table=await gvizTable(type==='travel'?'Travel Expense':'OT Record');
    const rows=type==='travel'?parseTravelTable(table):parseOTTable(table);
    cache.rows=rows;cache.ts=Date.now();
    return rows;
  }
  function matchReport(r,f,type){
    if(f.month&&String(r.date||'').slice(0,7)!==f.month)return false;
    if(f.start&&String(r.date||'')<f.start)return false;
    if(f.end&&String(r.date||'')>f.end)return false;
    if(f.employee&&String(r.employeeId||'').trim().toUpperCase()!==f.employee.trim().toUpperCase())return false;
    if(f.branch){
      const b=f.branch.trim().toUpperCase();
      if(type==='travel'){
        if(String(r.origin||'').trim().toUpperCase()!==b&&String(r.destination||'').trim().toUpperCase()!==b)return false;
      }else if(String(r.branch||'').trim().toUpperCase()!==b)return false;
    }
    return true;
  }

  async function searchTravel(){
    const f=filters('tr');if(!hasFilter(f)){clearTravel();return alert('กรุณาเลือก Filter ค่าเดินทางอย่างน้อย 1 รายการ');}if(!validDates(f))return;
    $('trSearch').disabled=true;$('trStatus').textContent='⏳ กำลังโหลดข้อมูลค่าเดินทาง...';
    try{
      const all=await reportRows('travel');
      travelRows=all.filter(r=>matchReport(r,f,'travel')).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.recordId).localeCompare(String(a.recordId)));
      const km=travelRows.reduce((sum,r)=>sum+Number(r.totalKm||0),0),amount=travelRows.reduce((sum,r)=>sum+Number(r.amount||0),0);
      $('trCount').textContent=travelRows.length.toLocaleString('th-TH');$('trKm').textContent=num(km)+' กม.';$('trAmount').textContent=num(amount)+' บาท';
      $('trBody').innerHTML=travelRows.length?travelRows.map(r=>`<tr><td>${esc(r.timestamp||'-')}</td><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.employeeId)}</td><td>${esc(r.employeeName)}</td><td>${esc(r.origin)} → ${esc(r.destination)}</td><td>${esc(r.travelReason||'-')}</td><td>${esc(r.transportType)}</td><td>${num(r.totalKm)} กม.</td><td>${num(r.amount)} บาท</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="11" class="summary-empty">ไม่พบข้อมูลตาม Filter</td></tr>';
      $('trStatus').textContent='✓ พบ '+travelRows.length.toLocaleString('th-TH')+' รายการตาม Filter';
    }catch(e){$('trStatus').textContent='⚠️ '+(e.message||'โหลดข้อมูลค่าเดินทางไม่สำเร็จ');travelRows=[];}finally{$('trSearch').disabled=false;}
  }

  async function searchOT(){
    const f=filters('ao');if(!hasFilter(f)){clearOT();return alert('กรุณาเลือก Filter OT อย่างน้อย 1 รายการ');}if(!validDates(f))return;
    $('aoSearch').disabled=true;$('aoStatus').textContent='⏳ กำลังโหลดข้อมูล OT...';
    try{
      const all=await reportRows('ot');
      otRows=all.filter(r=>matchReport(r,f,'ot')).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.recordId).localeCompare(String(a.recordId)));
      const comp=otRows.reduce((sum,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?sum+Number(r.hours||0):sum,0);
      const paid=otRows.reduce((sum,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?sum+Number(r.hours||0):sum,0);
      const total=otRows.reduce((sum,r)=>sum+Number(r.hours||0),0);
      $('aoComp').textContent=num(comp)+' ชม.';$('aoPaid').textContent=num(paid)+' ชม.';$('aoTotal').textContent=num(total)+' ชม.';
      $('aoBody').innerHTML=otRows.length?otRows.map(r=>`<tr><td>${esc(r.timestamp||'-')}</td><td>${esc(r.date)}</td><td>${esc(r.recordId)}</td><td>${esc(r.employeeId)}</td><td>${esc(r.employeeName)}</td><td>${esc(r.branch)}</td><td>${esc(r.startTime)} - ${esc(r.endTime)}</td><td>${num(r.hours)}</td><td>${esc(r.otType)}</td><td>${esc(r.reason)}</td><td>${esc(r.status||'-')}</td></tr>`).join(''):'<tr><td colspan="11" class="summary-empty">ไม่พบข้อมูลตาม Filter</td></tr>';
      $('aoStatus').textContent='✓ พบ '+otRows.length.toLocaleString('th-TH')+' รายการตาม Filter';
    }catch(e){$('aoStatus').textContent='⚠️ '+(e.message||'โหลดข้อมูล OT ไม่สำเร็จ');otRows=[];}finally{$('aoSearch').disabled=false;}
  }

  function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
  function download(name,headers,rows){if(!rows.length)return alert('ไม่มีข้อมูลตาม Filter สำหรับ Export');const csv='\ufeff'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  function exportTravel(){download('KAMU_Travel_Admin_Filtered.csv',['Timestamp','วันที่','เลขรายการ','รหัสพนักงาน','ชื่อ','ต้นทาง','ปลายทาง','สาเหตุในการเดินทาง','ประเภท','ระยะทางรวม','ค่าเดินทาง','สถานะ'],travelRows.map(r=>[r.timestamp,r.date,r.recordId,r.employeeId,r.employeeName,r.origin,r.destination,r.travelReason,r.transportType,r.totalKm,r.amount,r.status]));}
  function exportOT(){download('KAMU_OT_Admin_Filtered.csv',['Timestamp','วันที่','เลขรายการ','รหัสพนักงาน','ชื่อ','สาขา','เวลาเริ่ม','เวลาสิ้นสุด','ชั่วโมง','ประเภท OT','เหตุผล','สถานะ'],otRows.map(r=>[r.timestamp,r.date,r.recordId,r.employeeId,r.employeeName,r.branch,r.startTime,r.endTime,r.hours,r.otType,r.reason,r.status]));}

  function showHome(){
    $('adminSummary')?.classList.add('hidden');['travel','ot','travelSummary','otSummary'].forEach(id=>$(id)?.classList.add('hidden'));$('home')?.classList.remove('hidden');scrollTo(0,0);
  }
  function showAdmin(){
    ['home','travel','ot','travelSummary','otSummary'].forEach(id=>$(id)?.classList.add('hidden'));
    $('adminSummary').classList.remove('hidden');
    clearTravel();clearOT();
    scrollTo(0,0);
  }
  function switchTab(tab){
    const travel=tab==='travel';
    $('adminTravelPanel').classList.toggle('hidden',!travel);$('adminOTPanel').classList.toggle('hidden',travel);
    $('tabTravel').classList.toggle('active',travel);$('tabOT').classList.toggle('active',!travel);
  }

  function openAdminLogin(){
    if($('adminLoginModal'))return;
    const m=document.createElement('div');
    m.id='adminLoginModal';m.className='modal';
    m.innerHTML=`<div class="mbox" style="max-width:420px"><h3>🔐 เข้าสู่ Admin</h3><div class="f" style="margin-top:14px"><label>รหัส Admin</label><input id="adminCodeInput" type="password" inputmode="numeric" autocomplete="off" placeholder="กรอกรหัส Admin"></div><div id="adminLoginStatus" style="min-height:22px;margin-top:10px;font-size:12px;color:#8a5d00"></div><div class="actions"><button type="button" class="btn" id="adminLoginCancel">ยกเลิก</button><button type="button" class="btn primary" id="adminLoginSubmit">เข้าสู่ Admin</button></div></div>`;
    document.body.appendChild(m);
    const input=$('adminCodeInput'),submit=$('adminLoginSubmit'),status=$('adminLoginStatus');
    const close=()=>m.remove();
    const go=async()=>{
      const code=String(input.value||'').trim();
      if(!code){status.textContent='กรุณากรอกรหัส Admin';input.focus();return;}
      submit.disabled=true;input.disabled=true;status.textContent='⏳ กำลังตรวจสอบรหัส...';
      try{
        const x=await api({action:'verifyAdmin',adminCode:code});
        if(!x.authorized)throw Error('รหัส Admin ไม่ถูกต้อง');
        adminCode=code;close();showAdmin();switchTab('travel');
      }catch(e){
        adminCode='';status.textContent='⚠️ '+(e.message||'ไม่สามารถเข้าสู่ Admin ได้');submit.disabled=false;input.disabled=false;input.select();
      }
    };
    $('adminLoginCancel').onclick=close;submit.onclick=go;
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});
    setTimeout(()=>input.focus(),50);
  }

  function enterAdmin(){openAdminLogin();}

  window.initKamuAdmin=()=>{
    appendUI();
    $('goAdminSummary').onclick=enterAdmin;$('adminBack').onclick=showHome;$('adminLock').onclick=()=>{adminCode='';showHome();};
    $('tabTravel').onclick=()=>switchTab('travel');$('tabOT').onclick=()=>switchTab('ot');
    $('trSearch').onclick=searchTravel;$('trReset').onclick=clearTravel;$('aoSearch').onclick=searchOT;$('aoReset').onclick=clearOT;
    $('exportTravel').onclick=exportTravel;$('exportOT').onclick=exportOT;
  };
})();