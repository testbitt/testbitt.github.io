(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/ksp-api';
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  let saving310=false;
  const norm=v=>String(v??'').trim();
  const normTime=v=>v?String(v).slice(0,5):'';
  const valid24=v=>!v||/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  function setSync310(t,bad=false){const e=q('#sync');if(e){e.textContent=t;e.style.color=bad?'#9d2c2c':''}}
  function capture310(){
    return qa('#scheduleTable .cell').map(c=>({
      employee_code:norm(c.dataset.emp),work_date:norm(c.dataset.date),
      normal_time:norm(c.querySelector('.normal')?.value),
      ot_start:norm(c.querySelector('.otStart')?.value),
      ot_end:norm(c.querySelector('.otEnd')?.value),
      ot_type:norm(c.querySelector('.otType')?.value),
      note:norm(c.closest('td')?.querySelector('.note')?.value)
    }));
  }
  function decorate310(list){
    const em=new Map((db.employees||[]).map(e=>[String(e.employee_code),e]));
    return list.map(e=>({...e,employee_name:em.get(e.employee_code)?.name||em.get(e.employee_code)?.display_name||e.employee_code,position:em.get(e.employee_code)?.position||''}));
  }
  function equalEntry310(a,b){
    return !!b&&norm(a.normal_time)===norm(b.normal_time)&&normTime(a.ot_start)===normTime(b.ot_start)&&normTime(a.ot_end)===normTime(b.ot_end)&&norm(a.ot_type)===norm(b.ot_type)&&norm(a.note)===norm(b.note);
  }
  function matchesReturned310(payload,schedule){
    if(!schedule||!Array.isArray(schedule.entries))return false;
    const m=new Map(schedule.entries.map(e=>[`${norm(e.employee_code)}|${norm(e.work_date)}`,e]));
    if(m.size!==payload.entries.length)return false;
    return payload.entries.every(e=>equalEntry310(e,m.get(`${e.employee_code}|${e.work_date}`)));
  }
  async function save310(status){
    if(saving310)return;
    const saveBtn=q('#save'),draftBtn=q('#draft');
    try{
      const active=document.activeElement;
      if(active&&q('#scheduleTable')?.contains(active)&&typeof active.blur==='function')active.blur();
      await new Promise(r=>setTimeout(r,20));
      const branch=q('#branch')?.value||'',week=q('#week')?.value||'',scheduler=q('#scheduler')?.value.trim()||'';
      if(!branch||!week||!scheduler)throw new Error('กรุณาเลือกสาขา สัปดาห์ และชื่อผู้จัดตาราง');
      const raw=capture310(),expected=(currentEmployees?.length||0)*7;
      if(!raw.length)throw new Error('ยังไม่มีข้อมูลตารางให้บันทึก');
      if(expected&&raw.length!==expected)throw new Error(`ข้อมูลตารางโหลดไม่ครบ (${raw.length}/${expected} ช่อง)`);
      if(raw.some(e=>!e.employee_code||!e.work_date))throw new Error('ข้อมูลพนักงานหรือวันที่ในตารางไม่ครบ');
      if(raw.some(e=>(e.ot_start&&!e.ot_end)||(!e.ot_start&&e.ot_end)))throw new Error('พบเวลา OT ที่กรอกไม่ครบ');
      if(raw.some(e=>!valid24(e.ot_start)||!valid24(e.ot_end)))throw new Error('เวลา OT ต้องเป็นรูปแบบ 24 ชั่วโมง HH:MM');
      const payload={branch_code:branch,week_start:week,scheduler_name:scheduler,status,entries:decorate310(raw)};
      saving310=true;dirty=true;if(saveBtn)saveBtn.disabled=true;if(draftBtn)draftBtn.disabled=true;setSync310('กำลังบันทึกออนไลน์...');
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'saveSchedule',...payload}),cache:'no-store'});
      let j={};try{j=await r.json()}catch{}
      if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
      const result=j.data||{},schedule=result.schedule;
      if(!matchesReturned310(payload,schedule))throw new Error('Server บันทึกแล้ว แต่ข้อมูลที่คืนกลับไม่ตรงกับหน้าจอ');
      const normalized={...schedule,branch_name:db.branches?.find(x=>x.code===branch)?.name||branch,entries:(schedule.entries||[]).map(e=>({...e,ot_start:normTime(e.ot_start),ot_end:normTime(e.ot_end)}))};
      db.schedules=db.schedules||{};db.schedules[key(branch,week)]=normalized;currentSchedule=normalized;currentEmployees=(db.employees||[]).filter(e=>e.active!==false&&e.branch_code===branch);dirty=false;
      try{saveState()}catch{}
      setSync310(`ออนไลน์ · บันทึกแล้ว Version ${normalized.version||result.version||''}`);
      toast(status==='draft'?'บันทึกร่างออนไลน์แล้ว':'บันทึกตารางออนไลน์แล้ว');
    }catch(e){
      dirty=true;try{saveState()}catch{}
      setSync310('บันทึกไม่สำเร็จ · ข้อมูลบนหน้าจอยังคงอยู่',true);
      toast('บันทึกไม่สำเร็จ: '+(e?.message||String(e)),'error');
    }finally{saving310=false;if(saveBtn)saveBtn.disabled=false;if(draftBtn)draftBtn.disabled=false}
  }
  const saveBtn=q('#save'),draftBtn=q('#draft');if(saveBtn)saveBtn.onclick=()=>save310('saved');if(draftBtn)draftBtn.onclick=()=>save310('draft');
  const footer=q('.side footer');if(footer)footer.textContent='Version 3.1 · Server Confirm Save';
})();