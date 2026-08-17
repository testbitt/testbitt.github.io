(()=>{
const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/ksp-api';
let adminPin=null,syncTimer=null,booting=false;
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
function setSync(t,bad=false){const e=q('#sync');if(e){e.textContent=t;e.style.color=bad?'#9d2c2c':''}}
async function api(action,payload=null){
 const opt=payload===null?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})};
 const url=payload===null?`${API}?action=${encodeURIComponent(action)}`:API;
 const r=await fetch(url,opt);let j={};try{j=await r.json()}catch{}if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);return j.data;
}
function normalizeCloud(x){
 const branches=x.branches||[];
 const bm=new Map(branches.map(b=>[b.code,b]));
 const employees=(x.employees||[]).map(e=>({...e,name:e.display_name||e.name||e.employee_code,branch_name:e.branch_name||bm.get(e.branch_code)?.name||e.branch_code,active:e.active!==false}));
 const schedules=x.schedules||{};
 Object.values(schedules).forEach(s=>{s.entries=(s.entries||[]).map(e=>({...e,ot_start:e.ot_start?String(e.ot_start).slice(0,5):'',ot_end:e.ot_end?String(e.ot_end).slice(0,5):''}))});
 return {employees,branches,shifts:x.shifts||[],otTypes:x.otTypes||[],schedules,versions:x.versions||[]};
}
async function bootstrap({silent=false}={}){
 if(booting)return;booting=true;if(!silent)setSync('กำลัง Sync ออนไลน์...');
 try{
   const x=normalizeCloud(await api('bootstrap'));
   db=x;try{localStorage.removeItem(KEY);sessionStorage.removeItem('kamu_admin')}catch{}
   refreshMeta();
   if(q('#page-history')?.classList.contains('active'))renderHistoryCloud();
   if(q('#page-schedule')?.classList.contains('active')&&q('#branch')?.value&&q('#week')?.value&&!dirty)loadSchedule();
   if(admin)try{overview();renderEmployees();renderMasters()}catch{}
   setSync('ออนไลน์ · Sync แล้ว');
 }catch(e){console.error(e);setSync('เชื่อมฐานข้อมูลไม่ได้',true);toast('เชื่อมฐานข้อมูลออนไลน์ไม่ได้: '+e.message,'error')}
 finally{booting=false}
}
function schedulePayload(status){
 const b=q('#branch')?.value,w=q('#week')?.value,s=q('#scheduler')?.value.trim();if(!b||!w||!s)throw new Error('กรุณาเลือกสาขา สัปดาห์ และชื่อผู้จัดตาราง');
 const list=entries();if(list.some(e=>(e.ot_start&&!e.ot_end)||(!e.ot_start&&e.ot_end)))throw new Error('พบเวลา OT ที่กรอกไม่ครบ');
 const em=new Map((db.employees||[]).map(e=>[e.employee_code,e]));
 return {branch_code:b,week_start:w,scheduler_name:s,status,entries:list.map(e=>({...e,employee_name:em.get(e.employee_code)?.name||e.employee_code,position:em.get(e.employee_code)?.position||''}))};
}
async function saveCloud(status){
 try{setSync('กำลังบันทึก...');const p=schedulePayload(status);await api('saveSchedule',p);dirty=false;await bootstrap({silent:true});currentSchedule=db.schedules[key(p.branch_code,p.week_start)]||null;currentEmployees=db.employees.filter(e=>e.active!==false&&e.branch_code===p.branch_code);renderSchedule();saveState();toast(status==='draft'?'บันทึกร่างออนไลน์แล้ว':'บันทึกตารางออนไลน์แล้ว');setSync('ออนไลน์ · บันทึกแล้ว')}catch(e){setSync('บันทึกไม่สำเร็จ',true);toast(e.message,'error')}
}
async function syncMasters(){
 if(!adminPin||!admin)return;
 try{setSync('กำลัง Sync Admin...');await api('syncMasters',{pin:adminPin,employees:db.employees||[],shifts:db.shifts||[],otTypes:db.otTypes||[],source_file:db.employee_import_meta?.filename||'admin-sync'});await bootstrap({silent:true});toast('ข้อมูล Admin Sync ออนไลน์แล้ว');setSync('ออนไลน์ · Sync แล้ว')}catch(e){setSync('Admin Sync ไม่สำเร็จ',true);toast('Sync Admin ไม่สำเร็จ: '+e.message,'error')}
}
const oldSaveDB=window.saveDB;
window.saveDB=function(){try{localStorage.removeItem(KEY)}catch{};try{refreshMeta()}catch{};if(admin&&adminPin){clearTimeout(syncTimer);syncTimer=setTimeout(syncMasters,250)}};

// User save buttons -> server transaction
const sv=q('#save'),dr=q('#draft');if(sv)sv.onclick=()=>saveCloud('saved');if(dr)dr.onclick=()=>saveCloud('draft');

// Admin authentication only on server
function lockAdminCloud(){admin=false;adminPin=null;const l=q('#adminLock'),p=q('#adminPanel');l?.classList.remove('hidden');p?.classList.add('hidden');if(q('#pin'))q('#pin').value='';}
lockAdminCloud();
const adminNav=qa('.nav button').find(b=>b.dataset.page==='admin');if(adminNav)adminNav.onclick=()=>{page('admin');lockAdminCloud();setTimeout(()=>q('#pin')?.focus(),20)};
const login=q('#login');if(login)login.onsubmit=async e=>{e.preventDefault();const value=q('#pin')?.value||'';try{await api('adminLogin',{pin:value});adminPin=value;admin=true;q('#pin').value='';openAdmin();toast('เข้าสู่ระบบ Admin ออนไลน์แล้ว')}catch{adminPin=null;toast('รหัสไม่ถูกต้อง','error')}};

// Cloud history + protected server delete
function renderHistoryCloud(){
 const b=q('#historyBranch')?.value||'ALL',arr=Object.values(db.schedules||{}).filter(s=>b==='ALL'||s.branch_code===b).sort((a,b)=>b.week_start.localeCompare(a.week_start)),root=q('#history');if(!root)return;
 root.innerHTML=arr.length?arr.map(s=>`<div class="hist v19"><div><b>${esc(s.branch_code)} ${esc(s.branch_name||'')}</b><span>Week ${esc(s.week_start)}</span></div><div><b>${new Set((s.entries||[]).map(e=>e.employee_code)).size} คน</b><span>จำนวนพนักงาน</span></div><div><b>Version ${s.version}</b><span>${esc(s.status)}</span></div><div><b>${esc(s.scheduler_name)}</b><span>ผู้จัดตาราง</span></div><button class="btn secondary openHistCloud" data-b="${esc(s.branch_code)}" data-w="${esc(s.week_start)}">เปิด / แก้ไข</button><button class="btn danger deleteHistCloud" data-b="${esc(s.branch_code)}" data-w="${esc(s.week_start)}">ลบ</button></div>`).join(''):'<div class="empty">ยังไม่มีตารางย้อนหลัง</div>';
 root.querySelectorAll('.openHistCloud').forEach(x=>x.onclick=()=>{q('#branch').value=x.dataset.b;q('#week').value=x.dataset.w;page('schedule');loadSchedule()});
 root.querySelectorAll('.deleteHistCloud').forEach(x=>x.onclick=async()=>{const pin=prompt('กรอกรหัส Admin เพื่อยืนยันการลบตารางนี้');if(pin===null)return;const s=db.schedules[key(x.dataset.b,x.dataset.w)];if(!s)return;if(!confirm(`ยืนยันลบตาราง ${s.branch_code} Week ${s.week_start} ?\nการลบไม่สามารถย้อนกลับได้`))return;try{await api('deleteSchedule',{pin,branch_code:x.dataset.b,week_start:x.dataset.w});await bootstrap({silent:true});renderHistoryCloud();toast('ลบตารางออนไลน์แล้ว')}catch(e){toast(e.message==='INVALID_PIN'?'รหัสไม่ถูกต้อง ไม่ได้ลบข้อมูล':e.message,'error')}})
}
window.renderHistory=renderHistoryCloud;const hl=q('#historyLoad');if(hl)hl.onclick=renderHistoryCloud;

// Admin branch popup closes after choosing
const bp=q('#adminBranchPicker'),bo=q('#adminBranchOptions');if(bp&&bo)bo.addEventListener('change',()=>setTimeout(()=>bp.open=false,20));

// Admin bar chart (server-synced schedules)
function ensureChart(){const sec=q('#admin-adminschedule');if(!sec||q('#adminScheduleChart'))return;const c=document.createElement('div');c.id='adminScheduleChart';c.className='card admin-chart-card';c.innerHTML='<div class="section-head"><div><h2>กราฟจำนวนพนักงานเข้ากะรายวัน</h2><p>ข้อมูลจากฐานกลางของสาขาที่เลือก</p></div><span class="pill" id="adminChartScope">ONLINE</span></div><div id="adminBarChart" class="bar-chart"><div class="empty">เลือกสาขาและสัปดาห์ แล้วกด “แสดงข้อมูล”</div></div>';sec.appendChild(c)}
function renderBars(){ensureChart();const root=q('#adminBarChart'),w=q('#adminWeek')?.value,codes=qa('.adminBranchCheck:checked').map(x=>x.value);if(!root||!w||!codes.length)return;const ss=codes.map(c=>db.schedules[key(c,w)]).filter(Boolean),dates=weekDates(w).map(iso),stats=dates.map((date,i)=>{let work=0,ot=0,off=0;ss.forEach(s=>(s.entries||[]).filter(e=>e.work_date===date).forEach(e=>{const n=norm(e.normal_time||'');if(/^(H|VL|EX)$/.test(n))off++;else if(n)work++;if(e.ot_start&&e.ot_end)ot++}));return{day:SHORT[i],date,work,ot,off}}),mx=Math.max(1,...stats.map(x=>x.work));root.innerHTML=stats.map(x=>`<div style="display:grid;grid-template-columns:70px 1fr 54px;gap:10px;align-items:center;margin:10px 0"><div><b>${x.day}</b><small style="display:block;color:var(--muted)">${thDate(new Date(x.date+'T00:00:00'))}</small></div><div><div style="height:24px;border-radius:999px;background:#edf7f2;overflow:hidden"><div style="height:100%;width:${(x.work/mx)*100}%;background:linear-gradient(90deg,#21a87c,#79d2b2);border-radius:999px"></div></div><small style="color:var(--muted)">OT ${x.ot} · H/VL/EX ${x.off}</small></div><b>${x.work} คน</b></div>`).join('')}
ensureChart();const al=q('#adminLoad');if(al){const old=al.onclick;al.onclick=function(e){if(typeof old==='function')old.call(this,e);setTimeout(renderBars,30)}}

// Online badges and refresh behavior
const style=document.createElement('style');style.textContent='.btn.danger{background:#fff1f1;color:#a23535;border:1px solid #f0caca}.hist.v19{grid-template-columns:1.2fr .65fr .65fr .9fr auto auto}.bar-chart{display:grid;gap:4px}@media(max-width:980px){.hist.v19{grid-template-columns:1fr 1fr}}';document.head.appendChild(style);
const footer=q('.side footer');if(footer)footer.textContent='Version 2.0 · Online Database';
window.addEventListener('focus',()=>{if(!dirty)bootstrap({silent:true})});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!dirty)bootstrap({silent:true})});
bootstrap();
})();