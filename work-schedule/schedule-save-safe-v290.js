(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/ksp-api';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  let saving=false;

  function setSync(text,bad=false){
    const el=q('#sync');
    if(!el)return;
    el.textContent=text;
    el.style.color=bad?'#9d2c2c':'';
  }

  function markDirty(){
    try{
      dirty=true;
      if(typeof saveState==='function')saveState();
    }catch{}
  }

  const table=q('#scheduleTable');
  if(table){
    table.addEventListener('input',markDirty,true);
    table.addEventListener('change',markDirty,true);
  }

  function captureEntries(){
    return qa('#scheduleTable .cell').map(cell=>{
      const td=cell.closest('td');
      return {
        employee_code:String(cell.dataset.emp||'').trim(),
        work_date:String(cell.dataset.date||'').trim(),
        normal_time:String(cell.querySelector('.normal')?.value||'').trim(),
        ot_start:String(cell.querySelector('.otStart')?.value||'').trim(),
        ot_end:String(cell.querySelector('.otEnd')?.value||'').trim(),
        ot_type:String(cell.querySelector('.otType')?.value||'').trim(),
        note:String(td?.querySelector('.note')?.value||'').trim()
      };
    });
  }

  function valid24(v){return !v||/^([01]\d|2[0-3]):[0-5]\d$/.test(v)};

  async function postSave(payload){
    const r=await fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'saveSchedule',...payload})
    });
    let j={};
    try{j=await r.json()}catch{}
    if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
    return j.data||{};
  }

  function decorateEntries(list){
    const em=new Map((db.employees||[]).map(e=>[String(e.employee_code),e]));
    return list.map(e=>({
      ...e,
      employee_name:em.get(e.employee_code)?.name||em.get(e.employee_code)?.display_name||e.employee_code,
      position:em.get(e.employee_code)?.position||''
    }));
  }

  function sameValue(a,b){return String(a??'').slice(0,5)===String(b??'').slice(0,5)}

  async function verifyServer(payload){
    try{
      const r=await fetch(`${API}?action=bootstrap`,{cache:'no-store'});
      const j=await r.json();
      if(!r.ok||!j.ok)return false;
      const s=j.data?.schedules?.[`${payload.branch_code}|${payload.week_start}`];
      if(!s)return false;
      const sm=new Map((s.entries||[]).map(e=>[`${e.employee_code}|${e.work_date}`,e]));
      return payload.entries.every(e=>{
        const x=sm.get(`${e.employee_code}|${e.work_date}`);
        return !!x&&
          String(x.normal_time||'')===String(e.normal_time||'')&&
          sameValue(x.ot_start,e.ot_start)&&sameValue(x.ot_end,e.ot_end)&&
          String(x.ot_type||'')===String(e.ot_type||'')&&
          String(x.note||'')===String(e.note||'');
      });
    }catch{return false}
  }

  async function safeSave(status){
    if(saving)return;
    const saveBtn=q('#save'),draftBtn=q('#draft');
    try{
      // Commit the value currently being typed before reading the table.
      const active=document.activeElement;
      if(active&&q('#scheduleTable')?.contains(active)&&typeof active.blur==='function')active.blur();
      await new Promise(resolve=>setTimeout(resolve,0));

      const branch=q('#branch')?.value||'';
      const week=q('#week')?.value||'';
      const scheduler=q('#scheduler')?.value.trim()||'';
      if(!branch||!week||!scheduler)throw new Error('กรุณาเลือกสาขา สัปดาห์ และชื่อผู้จัดตาราง');

      const raw=captureEntries();
      const expected=(currentEmployees?.length||0)*7;
      if(!raw.length)throw new Error('ยังไม่มีข้อมูลตารางให้บันทึก');
      if(expected&&raw.length!==expected)throw new Error(`ข้อมูลบนหน้าจอยังโหลดไม่ครบ (${raw.length}/${expected} ช่อง) กรุณากดแสดงตารางใหม่ก่อนบันทึก`);
      if(raw.some(e=>!e.employee_code||!e.work_date))throw new Error('พบช่องตารางที่ข้อมูลพนักงานหรือวันที่ไม่ครบ');
      if(raw.some(e=>(e.ot_start&&!e.ot_end)||(!e.ot_start&&e.ot_end)))throw new Error('พบเวลา OT ที่กรอกไม่ครบ');
      if(raw.some(e=>!valid24(e.ot_start)||!valid24(e.ot_end)))throw new Error('เวลา OT ต้องเป็นรูปแบบ 24 ชั่วโมง HH:MM');

      const list=decorateEntries(raw);
      const payload={branch_code:branch,week_start:week,scheduler_name:scheduler,status,entries:list};

      // Keep dirty=true for the whole request. Existing focus/visibility cloud sync
      // therefore cannot repaint an older cloud copy over the user's edits.
      saving=true;
      dirty=true;
      if(saveBtn)saveBtn.disabled=true;
      if(draftBtn)draftBtn.disabled=true;
      setSync('กำลังบันทึกออนไลน์...');

      const result=await postSave(payload);
      const version=Number(result.version)||Number(db.schedules?.[key(branch,week)]?.version||0)+1;
      const now=new Date().toISOString();
      const schedule={
        id:result.id||db.schedules?.[key(branch,week)]?.id||key(branch,week),
        branch_code:branch,
        branch_name:db.branches?.find(x=>x.code===branch)?.name||branch,
        week_start:week,
        scheduler_name:scheduler,
        status,
        version,
        updated_at:now,
        entries:list
      };

      // Update the local online cache from exactly what was submitted.
      // Do NOT bootstrap + rerender here; that race was the cause of values disappearing.
      db.schedules=db.schedules||{};
      db.schedules[key(branch,week)]=schedule;
      currentSchedule=schedule;
      currentEmployees=(db.employees||[]).filter(e=>e.active!==false&&e.branch_code===branch);
      dirty=false;
      if(typeof saveState==='function')saveState();
      setSync('ออนไลน์ · บันทึกแล้ว');
      toast(status==='draft'?'บันทึกร่างออนไลน์แล้ว':'บันทึกตารางออนไลน์แล้ว');

      // Read-back verification is non-destructive: it never repaints the table.
      const verified=await verifyServer(payload);
      if(!verified){
        setSync('บันทึกแล้ว · รอตรวจสอบ Sync');
        console.warn('KSP save read-back verification did not match; UI preserved intentionally.');
      }
    }catch(e){
      // Keep edits on screen on any failure and block auto cloud repaint.
      dirty=true;
      if(typeof saveState==='function')saveState();
      setSync('บันทึกไม่สำเร็จ · ข้อมูลบนหน้าจอยังคงอยู่',true);
      toast('บันทึกไม่สำเร็จ: '+(e?.message||String(e)),'error');
    }finally{
      saving=false;
      if(saveBtn)saveBtn.disabled=false;
      if(draftBtn)draftBtn.disabled=false;
    }
  }

  const saveBtn=q('#save'),draftBtn=q('#draft');
  if(saveBtn)saveBtn.onclick=()=>safeSave('saved');
  if(draftBtn)draftBtn.onclick=()=>safeSave('draft');

  const style=document.createElement('style');
  style.id='scheduleSaveSafeV290Style';
  style.textContent=`#save:disabled,#draft:disabled{opacity:.58!important;cursor:wait!important}`;
  document.head.appendChild(style);

  const footer=q('.side footer');
  if(footer)footer.textContent='Version 2.9 · Safe Cloud Save';
})();