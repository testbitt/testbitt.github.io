(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/ksp-api';
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  let saving300=false,historyLoading300=false;

  const esc300=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shortTime=v=>v?String(v).slice(0,5):'';
  const statusText=s=>s==='draft'?'draft':'saved';
  function setSync300(t,bad=false){const e=q('#sync');if(e){e.textContent=t;e.style.color=bad?'#9d2c2c':''}}

  async function getBootstrap300(){
    const r=await fetch(`${API}?action=bootstrap&_=${Date.now()}`,{cache:'no-store'});
    let j={};try{j=await r.json()}catch{}
    if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
    return j.data||{};
  }
  async function postSave300(payload){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'saveSchedule',...payload})});
    let j={};try{j=await r.json()}catch{}
    if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
    return j.data||{};
  }

  function normalizeSchedule300(s){
    if(!s)return null;
    return {...s,entries:(s.entries||[]).map(e=>({...e,ot_start:shortTime(e.ot_start),ot_end:shortTime(e.ot_end)}))};
  }
  function applyBootstrap300(x){
    const bm=new Map((x.branches||[]).map(b=>[b.code,b]));
    const schedules={};
    Object.entries(x.schedules||{}).forEach(([k,s])=>{schedules[k]=normalizeSchedule300(s)});
    db={
      employees:(x.employees||[]).map(e=>({...e,name:e.display_name||e.name||e.employee_code,branch_name:e.branch_name||bm.get(e.branch_code)?.name||e.branch_code,active:e.active!==false})),
      branches:x.branches||[],shifts:x.shifts||[],otTypes:x.otTypes||[],schedules,versions:x.versions||[]
    };
    try{refreshMeta()}catch{}
  }

  function capture300(){
    return qa('#scheduleTable .cell').map(c=>({
      employee_code:String(c.dataset.emp||'').trim(),
      work_date:String(c.dataset.date||'').trim(),
      normal_time:String(c.querySelector('.normal')?.value||'').trim(),
      ot_start:String(c.querySelector('.otStart')?.value||'').trim(),
      ot_end:String(c.querySelector('.otEnd')?.value||'').trim(),
      ot_type:String(c.querySelector('.otType')?.value||'').trim(),
      note:String(c.closest('td')?.querySelector('.note')?.value||'').trim()
    }));
  }
  function decorate300(list){
    const em=new Map((db.employees||[]).map(e=>[String(e.employee_code),e]));
    return list.map(e=>({...e,employee_name:em.get(e.employee_code)?.name||em.get(e.employee_code)?.display_name||e.employee_code,position:em.get(e.employee_code)?.position||''}));
  }
  function sameEntry300(a,b){
    return !!b&&String(a.normal_time||'')===String(b.normal_time||'')&&shortTime(a.ot_start)===shortTime(b.ot_start)&&shortTime(a.ot_end)===shortTime(b.ot_end)&&String(a.ot_type||'')===String(b.ot_type||'')&&String(a.note||'')===String(b.note||'');
  }
  function matches300(payload,s){
    if(!s)return false;
    const m=new Map((s.entries||[]).map(e=>[`${e.employee_code}|${e.work_date}`,e]));
    return payload.entries.length===m.size&&payload.entries.every(e=>sameEntry300(e,m.get(`${e.employee_code}|${e.work_date}`)));
  }
  async function verify300(payload,tries=3){
    for(let i=0;i<tries;i++){
      if(i)await new Promise(r=>setTimeout(r,250*(i+1)));
      const x=await getBootstrap300();
      const s=normalizeSchedule300(x.schedules?.[`${payload.branch_code}|${payload.week_start}`]);
      if(matches300(payload,s))return {ok:true,bootstrap:x,schedule:s};
    }
    return {ok:false};
  }
  const valid24=v=>!v||/^([01]\d|2[0-3]):[0-5]\d$/.test(v);

  async function saveReliable300(status){
    if(saving300)return;
    const sb=q('#save'),dbtn=q('#draft');
    try{
      const active=document.activeElement;
      if(active&&q('#scheduleTable')?.contains(active)&&typeof active.blur==='function')active.blur();
      await new Promise(r=>setTimeout(r,20));
      const branch=q('#branch')?.value||'',week=q('#week')?.value||'',scheduler=q('#scheduler')?.value.trim()||'';
      if(!branch||!week||!scheduler)throw new Error('กรุณาเลือกสาขา สัปดาห์ และชื่อผู้จัดตาราง');
      const raw=capture300(),expected=(currentEmployees?.length||0)*7;
      if(!raw.length)throw new Error('ยังไม่มีข้อมูลตารางให้บันทึก');
      if(expected&&raw.length!==expected)throw new Error(`ข้อมูลตารางโหลดไม่ครบ (${raw.length}/${expected} ช่อง)`);
      if(raw.some(e=>!e.employee_code||!e.work_date))throw new Error('ข้อมูลพนักงานหรือวันที่ในตารางไม่ครบ');
      if(raw.some(e=>(e.ot_start&&!e.ot_end)||(!e.ot_start&&e.ot_end)))throw new Error('พบเวลา OT ที่กรอกไม่ครบ');
      if(raw.some(e=>!valid24(e.ot_start)||!valid24(e.ot_end)))throw new Error('เวลา OT ต้องเป็นรูปแบบ 24 ชั่วโมง HH:MM');
      const payload={branch_code:branch,week_start:week,scheduler_name:scheduler,status,entries:decorate300(raw)};

      saving300=true;dirty=true;if(sb)sb.disabled=true;if(dbtn)dbtn.disabled=true;setSync300('กำลังบันทึกออนไลน์...');
      await postSave300(payload);
      let checked=await verify300(payload,3);
      if(!checked.ok){
        setSync300('กำลังบันทึกซ้ำเพื่อตรวจสอบ...');
        await postSave300(payload);
        checked=await verify300(payload,3);
      }
      if(!checked.ok)throw new Error('Server รับคำสั่งแล้ว แต่ตรวจข้อมูลกลับมาไม่ครบ กรุณากดบันทึกอีกครั้ง');

      applyBootstrap300(checked.bootstrap);
      currentSchedule=db.schedules[key(branch,week)]||checked.schedule;
      currentEmployees=(db.employees||[]).filter(e=>e.active!==false&&e.branch_code===branch);
      dirty=false;try{saveState()}catch{}
      setSync300('ออนไลน์ · บันทึกและตรวจสอบแล้ว');
      toast(status==='draft'?'บันทึกร่างออนไลน์และตรวจสอบแล้ว':'บันทึกตารางออนไลน์และตรวจสอบแล้ว');
    }catch(e){
      dirty=true;try{saveState()}catch{}
      setSync300('บันทึกไม่สำเร็จ · ข้อมูลบนหน้าจอยังคงอยู่',true);
      toast('บันทึกไม่สำเร็จ: '+(e?.message||String(e)),'error');
    }finally{saving300=false;if(sb)sb.disabled=false;if(dbtn)dbtn.disabled=false}
  }

  // Replace previous save handlers with verified cloud save.
  const saveBtn=q('#save'),draftBtn=q('#draft');
  if(saveBtn)saveBtn.onclick=()=>saveReliable300('saved');
  if(draftBtn)draftBtn.onclick=()=>saveReliable300('draft');

  // Ensure edits immediately block background cloud repaint.
  const scheduleTable=q('#scheduleTable');
  if(scheduleTable){
    const dirtyNow=()=>{try{dirty=true;saveState()}catch{}};
    scheduleTable.addEventListener('input',dirtyNow,true);
    scheduleTable.addEventListener('change',dirtyNow,true);
  }

  // Remove legacy history observers/listeners by replacing controlled nodes.
  let historyRoot=q('#history');
  if(historyRoot){const n=historyRoot.cloneNode(false);historyRoot.replaceWith(n);historyRoot=n}
  let historyWeek=q('#historyWeek');
  if(historyWeek){const n=historyWeek.cloneNode(true);historyWeek.replaceWith(n);historyWeek=n}
  let historyLoad=q('#historyLoad');
  if(historyLoad){const n=historyLoad.cloneNode(true);historyLoad.replaceWith(n);historyLoad=n}

  const filters=q('#page-history .filters');
  let clearBtn=q('#historyClear300');
  if(filters&&!clearBtn){
    clearBtn=document.createElement('button');clearBtn.type='button';clearBtn.id='historyClear300';clearBtn.className='btn ghost';clearBtn.textContent='ล้าง Filter';filters.appendChild(clearBtn);
  }

  function renderHistory300(schedules){
    const root=q('#history');if(!root)return;
    const branch=q('#historyBranch')?.value||'ALL',week=q('#historyWeek')?.value||'';
    const arr=Object.values(schedules||{}).filter(s=>(branch==='ALL'||s.branch_code===branch)&&(!week||s.week_start===week)).sort((a,b)=>String(b.week_start).localeCompare(String(a.week_start))||String(a.branch_code).localeCompare(String(b.branch_code)));
    root.innerHTML=arr.length?arr.map(s=>`<div class="hist v300"><div><b>${esc300(s.branch_code)} ${esc300(s.branch_name||'')}</b><span>Week ${esc300(s.week_start)}</span></div><div><b>${new Set((s.entries||[]).map(e=>e.employee_code)).size} คน</b><span>จำนวนพนักงาน</span></div><div><b>Version ${esc300(s.version||1)}</b><span>${esc300(statusText(s.status))}</span></div><div><b>${esc300(s.scheduler_name||'-')}</b><span>ผู้จัดตาราง</span></div><button class="btn secondary openHist300" data-b="${esc300(s.branch_code)}" data-w="${esc300(s.week_start)}">เปิด / แก้ไข</button><button class="btn danger deleteHistCloud" data-b="${esc300(s.branch_code)}" data-w="${esc300(s.week_start)}">ลบ</button></div>`).join(''):`<div class="empty">ไม่พบตารางตาม Filter ที่เลือก</div>`;
    root.querySelectorAll('.openHist300').forEach(x=>x.onclick=()=>{q('#branch').value=x.dataset.b;q('#week').value=x.dataset.w;page('schedule');loadSchedule()});
    // Reuse server-protected delete behavior from cloud module when available by dispatching through existing API flow.
    root.querySelectorAll('.deleteHistCloud').forEach(x=>x.onclick=async()=>{
      const pin=prompt('กรอกรหัส Admin เพื่อยืนยันการลบตารางนี้');if(pin===null)return;
      if(!confirm(`ยืนยันลบตาราง ${x.dataset.b} Week ${x.dataset.w} ?\nการลบไม่สามารถย้อนกลับได้`))return;
      try{
        const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'deleteSchedule',pin,branch_code:x.dataset.b,week_start:x.dataset.w})});
        const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
        toast('ลบตารางออนไลน์แล้ว');await loadHistory300();
      }catch(e){toast(e.message==='INVALID_PIN'?'รหัสไม่ถูกต้อง ไม่ได้ลบข้อมูล':e.message,'error')}
    });
  }

  async function loadHistory300(){
    if(historyLoading300)return;historyLoading300=true;
    const root=q('#history');if(root)root.innerHTML='<div class="empty">กำลังโหลดข้อมูลย้อนหลังจาก Cloud...</div>';
    try{
      const x=await getBootstrap300();applyBootstrap300(x);renderHistory300(db.schedules);
      setSync300('ออนไลน์ · โหลดตารางย้อนหลังแล้ว');
    }catch(e){if(root)root.innerHTML=`<div class="empty">โหลดข้อมูลย้อนหลังไม่สำเร็จ: ${esc300(e.message)}</div>`;setSync300('โหลดตารางย้อนหลังไม่สำเร็จ',true)}
    finally{historyLoading300=false}
  }
  window.renderHistory=loadHistory300;
  if(historyLoad)historyLoad.onclick=()=>loadHistory300();
  if(historyWeek)historyWeek.addEventListener('change',()=>loadHistory300());
  q('#historyBranch')?.addEventListener('change',()=>loadHistory300());
  if(clearBtn)clearBtn.onclick=()=>{if(q('#historyBranch'))q('#historyBranch').value='ALL';if(q('#historyWeek'))q('#historyWeek').value='';loadHistory300()};

  const historyNav=qa('.nav button').find(b=>b.dataset.page==='history');
  if(historyNav)historyNav.onclick=()=>{page('history');setTimeout(loadHistory300,0)};

  const style=document.createElement('style');
  style.textContent='.hist.v300{grid-template-columns:1.2fr .65fr .65fr .9fr auto auto}@media(max-width:980px){.hist.v300{grid-template-columns:1fr 1fr}.hist.v300 .btn{grid-column:auto}}';
  document.head.appendChild(style);
  const footer=q('.side footer');if(footer)footer.textContent='Version 3.0 · Cloud Reliability';
})();