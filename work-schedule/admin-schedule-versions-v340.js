(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/ksp-api';
  const q=s=>document.querySelector(s);
  const esc340=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const shortTime=v=>v?String(v).slice(0,5):'';
  let adminPin340='';
  let rows340=[];
  let selected340=null;
  let loading340=false;

  function fmtDateTime(v){
    if(!v)return '-';
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return String(v);
    return new Intl.DateTimeFormat('th-TH',{
      dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'
    }).format(d);
  }
  function fmtWeek(v){
    if(!v)return '-';
    const d=new Date(`${v}T12:00:00`);
    if(Number.isNaN(d.getTime()))return String(v);
    return new Intl.DateTimeFormat('th-TH',{
      day:'2-digit',month:'short',year:'numeric'
    }).format(d);
  }
  async function post340(action,payload={}){
    if(!adminPin340)throw new Error('กรุณาออกจาก Admin แล้วเข้าสู่ระบบใหม่ เพื่อยืนยันสิทธิ์สำหรับ Version ตารางงาน');
    const r=await fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action,pin:adminPin340,...payload}),
      cache:'no-store'
    });
    let j={};try{j=await r.json()}catch{}
    if(!r.ok||!j.ok){
      if(j.error==='INVALID_PIN')adminPin340='';
      throw new Error(j.error==='INVALID_PIN'?'สิทธิ์ Admin หมดอายุ กรุณาออกแล้วเข้าสู่ Admin ใหม่':j.error||`HTTP ${r.status}`);
    }
    return j.data||{};
  }
  async function bootstrap340(){
    const r=await fetch(`${API}?action=bootstrap&_=${Date.now()}`,{cache:'no-store'});
    let j={};try{j=await r.json()}catch{}
    if(!r.ok||!j.ok)throw new Error(j.error||`HTTP ${r.status}`);
    return j.data||{};
  }

  function buildUI340(){
    const tabs=q('#adminPanel .tabs');
    if(!tabs||q('[data-admin="versions"]'))return;
    const tab=document.createElement('button');
    tab.type='button';
    tab.dataset.admin='versions';
    tab.textContent='Version ตารางงาน';
    tabs.appendChild(tab);

    const panel=q('#adminPanel');
    const sec=document.createElement('div');
    sec.className='admin-sec';
    sec.id='admin-versions';
    sec.innerHTML=`
      <div class="card">
        <div class="section-head version-head340">
          <div>
            <h2>Version ตารางงาน</h2>
            <p>ดู Version ของทุกสาขาและทุก Week พร้อม Preview และ Restore ตารางเดิม</p>
          </div>
          <span class="pill" id="versionApi340">ksp-api V5</span>
        </div>
        <div class="filters version-filters340">
          <label>สาขา
            <select id="versionBranch340"><option value="ALL">ทุกสาขา</option></select>
          </label>
          <label>Week
            <input id="versionWeek340" type="date">
          </label>
          <button type="button" class="btn secondary" id="versionLoad340">แสดง Version</button>
          <button type="button" class="btn ghost" id="versionClear340">ทุกสาขา / ทุก Week</button>
          <span class="version-count340" id="versionCount340"></span>
        </div>
        <div id="versionStatus340" class="version-status340">เลือก Filter หรือแสดง Version ทั้งหมด</div>
        <div class="scroll version-scroll340">
          <table class="data version-table340" id="versionTable340">
            <tbody><tr><td class="empty">กำลังเตรียมรายการ Version…</td></tr></tbody>
          </table>
        </div>
      </div>`;
    panel.appendChild(sec);

    const modal=document.createElement('div');
    modal.id='versionModal340';
    modal.className='version-modal340 hidden';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','versionModalTitle340');
    modal.innerHTML=`
      <div class="version-modal-box340">
        <div class="version-modal-head340">
          <div>
            <h2 id="versionModalTitle340">Preview Version ตารางงาน</h2>
            <p id="versionModalMeta340"></p>
          </div>
          <button type="button" class="btn ghost" id="versionClose340" aria-label="ปิด">ปิด</button>
        </div>
        <div id="versionPreviewStatus340" class="version-status340"></div>
        <div class="version-preview-scroll340">
          <table class="data version-preview-table340" id="versionPreviewTable340"></table>
        </div>
        <div class="version-modal-actions340">
          <span id="versionRestoreNote340">Restore จะเขียนทับตารางปัจจุบันและคงเลข Version เดิม</span>
          <button type="button" class="btn primary" id="versionRestore340">Restore Version นี้</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    tab.onclick=()=>{
      if(typeof adminTab==='function')adminTab('versions');
      else{
        tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===tab));
        panel.querySelectorAll('.admin-sec').forEach(x=>x.classList.toggle('active',x===sec));
      }
      fillBranches340();
      loadVersions340();
    };
    q('#versionLoad340').onclick=()=>loadVersions340();
    q('#versionClear340').onclick=()=>{
      q('#versionBranch340').value='ALL';
      q('#versionWeek340').value='';
      loadVersions340();
    };
    q('#versionBranch340').onchange=()=>loadVersions340();
    q('#versionWeek340').onchange=()=>loadVersions340();
    q('#versionClose340').onclick=closePreview340;
    q('#versionModal340').onclick=e=>{if(e.target===q('#versionModal340'))closePreview340()};
    q('#versionRestore340').onclick=restoreSelected340;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!q('#versionModal340')?.classList.contains('hidden'))closePreview340()});
  }

  function fillBranches340(){
    const sel=q('#versionBranch340');if(!sel)return;
    const value=sel.value||'ALL';
    const list=(db?.branches||[]).slice().sort((a,b)=>String(a.code).localeCompare(String(b.code)));
    sel.innerHTML='<option value="ALL">ทุกสาขา</option>'+list.map(b=>`<option value="${esc340(b.code)}">${esc340(b.code)}${b.name&&b.name!==b.code?' — '+esc340(b.name):''}</option>`).join('');
    sel.value=[...sel.options].some(o=>o.value===value)?value:'ALL';
  }

  function setStatus340(text,bad=false){
    const e=q('#versionStatus340');if(!e)return;
    e.textContent=text;
    e.classList.toggle('error',bad);
  }
  function renderRows340(){
    const table=q('#versionTable340');if(!table)return;
    q('#versionCount340').textContent=`${rows340.length.toLocaleString()} Version`;
    if(!rows340.length){
      table.innerHTML='<tbody><tr><td class="empty">ไม่พบ Version ตาม Filter ที่เลือก</td></tr></tbody>';
      return;
    }
    table.innerHTML=`<thead><tr>
      <th>สาขา</th><th>Week</th><th>Version</th><th>สถานะ</th><th>ผู้บันทึก</th><th>บันทึกเมื่อ</th><th>รายการ</th><th>จัดการ</th>
    </tr></thead><tbody>${rows340.map((r,i)=>`<tr>
      <td><b>${esc340(r.branch_code)}</b><br><small>${esc340(r.branch_name||'')}</small></td>
      <td>${esc340(fmtWeek(r.week_start))}<br><small>${esc340(r.week_start)}</small></td>
      <td><b>Version ${esc340(r.version)}</b>${r.is_current?'<br><span class="current-version340">ปัจจุบัน</span>':`<br><small>ปัจจุบัน V${esc340(r.current_version)}</small>`}</td>
      <td>${esc340(r.status==='draft'?'ร่าง':'บันทึกแล้ว')}</td>
      <td>${esc340(r.updated_by||r.scheduler_name||'-')}</td>
      <td>${esc340(fmtDateTime(r.created_at))}</td>
      <td>${Number(r.entry_count||0).toLocaleString()}</td>
      <td><div class="version-actions340">
        <button type="button" class="btn secondary previewVersion340" data-index="${i}">Preview</button>
        ${r.is_current?'':`<button type="button" class="btn ghost restoreVersion340" data-index="${i}">Restore</button>`}
      </div></td>
    </tr>`).join('')}</tbody>`;
    table.querySelectorAll('.previewVersion340').forEach(b=>b.onclick=()=>preview340(rows340[Number(b.dataset.index)]));
    table.querySelectorAll('.restoreVersion340').forEach(b=>b.onclick=async()=>{
      await preview340(rows340[Number(b.dataset.index)]);
      if(selected340)q('#versionRestore340')?.focus();
    });
  }

  async function loadVersions340(){
    if(loading340)return;
    loading340=true;
    const table=q('#versionTable340');
    if(table)table.innerHTML='<tbody><tr><td class="empty">กำลังโหลด Version จาก Cloud…</td></tr></tbody>';
    setStatus340('กำลังโหลดข้อมูล Version ของตารางงาน…');
    try{
      const data=await post340('adminVersionList',{
        branch_code:q('#versionBranch340')?.value||'ALL',
        week_start:q('#versionWeek340')?.value||''
      });
      rows340=Array.isArray(data.rows)?data.rows:[];
      renderRows340();
      setStatus340(`โหลดแล้ว ${rows340.length.toLocaleString()} Version · ข้อมูลจาก Supabase ส่วนกลาง`);
    }catch(e){
      rows340=[];
      renderRows340();
      setStatus340(e?.message||String(e),true);
    }finally{loading340=false}
  }

  function groupedSnapshot340(entries){
    const map=new Map();
    for(const e of entries||[]){
      const code=String(e.employee_code||'');
      if(!map.has(code))map.set(code,{code,name:e.employee_name||code,position:e.position||'',days:{}});
      map.get(code).days[String(e.work_date||'')]=e;
    }
    return [...map.values()];
  }
  function cell340(e){
    if(!e)return '<span class="empty-cell340">—</span>';
    const normal=esc340(e.normal_time||'—');
    const ot=e.ot_start&&e.ot_end?`<small>OT ${esc340(shortTime(e.ot_start))}–${esc340(shortTime(e.ot_end))}${e.ot_type?' · '+esc340(e.ot_type):''}</small>`:'';
    const note=e.note?`<small class="version-note340">${esc340(e.note)}</small>`:'';
    return `<b>${normal}</b>${ot}${note}`;
  }
  function renderPreview340(row,data){
    const version=data.version||{};
    const snapshot=version.snapshot||{};
    const entries=Array.isArray(snapshot.entries)?snapshot.entries:[];
    const dates=typeof weekDates==='function'?weekDates(row.week_start).map(iso):Array.from(new Set(entries.map(e=>e.work_date))).sort();
    const grouped=groupedSnapshot340(entries);
    q('#versionModalMeta340').textContent=`${row.branch_code} · Week ${row.week_start} · Version ${row.version} · ${fmtDateTime(version.created_at||row.created_at)}`;
    q('#versionPreviewStatus340').textContent=`${grouped.length.toLocaleString()} พนักงาน · ${entries.length.toLocaleString()} รายการ · ผู้บันทึก ${version.updated_by||row.updated_by||'-'}`;
    q('#versionPreviewTable340').innerHTML=grouped.length?`<thead><tr><th>พนักงาน</th>${dates.map((d,i)=>`<th>${esc340((window.SHORT||['MON','TUE','WED','THU','FRI','SAT','SUN'])[i]||'')}<br><small>${esc340(d)}</small></th>`).join('')}</tr></thead><tbody>${grouped.map(emp=>`<tr><td><b>${esc340(emp.name)}</b><br><small>${esc340(emp.code)}${emp.position?' · '+esc340(emp.position):''}</small></td>${dates.map(d=>`<td>${cell340(emp.days[d])}</td>`).join('')}</tr>`).join('')}</tbody>`:'<tbody><tr><td class="empty">Version นี้ไม่มีรายละเอียดตารางสำหรับ Preview</td></tr></tbody>';
    const restore=q('#versionRestore340');
    restore.classList.toggle('hidden',!!row.is_current);
    q('#versionRestoreNote340').textContent=row.is_current?'Version นี้เป็น Version ปัจจุบัน':'Restore จะเขียนทับตารางปัจจุบันและคงเลข Version เดิม';
  }
  async function preview340(row){
    if(!row)return;
    const modal=q('#versionModal340');
    modal.classList.remove('hidden');
    q('#versionModalMeta340').textContent=`${row.branch_code} · Week ${row.week_start} · Version ${row.version}`;
    q('#versionPreviewStatus340').textContent='กำลังโหลดรายละเอียด Version…';
    q('#versionPreviewTable340').innerHTML='<tbody><tr><td class="empty">กำลังโหลด Preview…</td></tr></tbody>';
    q('#versionRestore340').classList.add('hidden');
    selected340=null;
    try{
      const data=await post340('adminVersionGet',{schedule_id:row.schedule_id,version:Number(row.version)});
      selected340={row,data};
      renderPreview340(row,data);
    }catch(e){
      q('#versionPreviewStatus340').textContent=e?.message||String(e);
      q('#versionPreviewTable340').innerHTML='<tbody><tr><td class="empty">โหลด Preview ไม่สำเร็จ</td></tr></tbody>';
    }
  }
  function closePreview340(){
    q('#versionModal340')?.classList.add('hidden');
    selected340=null;
  }

  async function refreshCloud340(){
    const x=await bootstrap340();
    const branches=x.branches||[];
    const bm=new Map(branches.map(b=>[b.code,b]));
    const schedules={};
    Object.entries(x.schedules||{}).forEach(([k,s])=>{
      schedules[k]={...s,entries:(s.entries||[]).map(e=>({...e,ot_start:shortTime(e.ot_start),ot_end:shortTime(e.ot_end)}))};
    });
    db={
      employees:(x.employees||[]).map(e=>({...e,name:e.display_name||e.name||e.employee_code,branch_name:e.branch_name||bm.get(e.branch_code)?.name||e.branch_code,active:e.active!==false})),
      branches,shifts:x.shifts||[],otTypes:x.otTypes||[],schedules,versions:x.versions||[]
    };
    if(typeof refreshMeta==='function')refreshMeta();
  }
  async function restoreSelected340(){
    if(!selected340)return;
    const {row}=selected340;
    if(row.is_current)return;
    const message=`ยืนยัน Restore ${row.branch_code} Week ${row.week_start} จาก Version ${row.version} ?\n\nตารางปัจจุบัน Version ${row.current_version} จะถูกเขียนทับ และยังคงเป็น Version ${row.current_version} โดยไม่เพิ่มเลข Version`;
    if(!confirm(message))return;
    const btn=q('#versionRestore340');
    btn.disabled=true;
    btn.textContent='กำลัง Restore…';
    q('#versionPreviewStatus340').textContent='กำลังเขียนทับตารางปัจจุบันและตรวจสอบเลข Version…';
    try{
      const data=await post340('adminVersionRestore',{schedule_id:row.schedule_id,version:Number(row.version)});
      const restored=data.schedule||{};
      if(Number(restored.version)!==Number(row.current_version)){
        throw new Error(`Restore สำเร็จแต่เลข Version เปลี่ยนจาก ${row.current_version} เป็น ${restored.version} กรุณาตรวจสอบ Backend`);
      }
      await refreshCloud340();
      if(typeof overview==='function')overview();
      q('#versionPreviewStatus340').textContent=`Restore สำเร็จ · ตารางปัจจุบันยังคงเป็น Version ${restored.version}`;
      if(typeof toast==='function')toast(`Restore Version ${row.version} สำเร็จ · คงเลข Version ${restored.version}`);
      await loadVersions340();
      const fresh=rows340.find(x=>x.schedule_id===row.schedule_id&&Number(x.version)===Number(row.version))||row;
      selected340={row:{...fresh,is_current:Number(row.version)===Number(restored.version)},data:selected340.data};
      q('#versionRestore340').classList.add('hidden');
      q('#versionRestoreNote340').textContent=`Restore แล้ว · Version ปัจจุบันยังคงเป็น ${restored.version}`;
    }catch(e){
      q('#versionPreviewStatus340').textContent=`Restore ไม่สำเร็จ: ${e?.message||String(e)}`;
      if(typeof toast==='function')toast('Restore ไม่สำเร็จ: '+(e?.message||String(e)),'error');
    }finally{
      btn.disabled=false;
      btn.textContent='Restore Version นี้';
    }
  }

  const style=document.createElement('style');
  style.id='adminScheduleVersionsV340Style';
  style.textContent=`
    .version-head340{gap:12px}.version-filters340{align-items:end}.version-count340{margin-left:auto;color:var(--muted);font-size:12px;font-weight:800;padding:10px 0}
    .version-status340{margin:12px 0;padding:10px 12px;border:1px solid #cfe8de;border-radius:11px;background:#f3fbf7;color:#356d5d;font-size:12px}.version-status340.error{background:#fff3f3;border-color:#efcccc;color:#9d2c2c}
    .version-scroll340{max-height:62vh}.version-table340{min-width:1080px;width:100%}.version-table340 th{position:sticky;top:0;z-index:2}.version-table340 small{color:var(--muted)}
    .current-version340{display:inline-block;margin-top:4px;padding:3px 7px;border-radius:999px;background:#dff7ed;color:#0f7455;font-size:10px;font-weight:900}.version-actions340{display:flex;gap:6px}.version-actions340 .btn{padding:7px 9px;min-height:34px;font-size:11px}
    .version-modal340{position:fixed;inset:0;z-index:1000;background:rgba(12,42,34,.58);display:grid;place-items:center;padding:18px}.version-modal340.hidden{display:none!important}
    .version-modal-box340{width:min(1380px,96vw);max-height:92vh;display:flex;flex-direction:column;background:#fff;border-radius:18px;box-shadow:0 28px 80px rgba(5,31,24,.28);padding:18px}
    .version-modal-head340{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.version-modal-head340 h2{margin:0;color:#174f40}.version-modal-head340 p{margin:5px 0 0;color:var(--muted);font-size:12px}
    .version-preview-scroll340{overflow:auto;border:1px solid var(--line);border-radius:12px;flex:1}.version-preview-table340{min-width:1450px;width:100%}.version-preview-table340 th{position:sticky;top:0;z-index:2}.version-preview-table340 th:first-child,.version-preview-table340 td:first-child{position:sticky;left:0;z-index:1;background:#fff;min-width:190px}.version-preview-table340 th:first-child{z-index:3;background:#eaf8f2}.version-preview-table340 td{min-width:165px;vertical-align:top}.version-preview-table340 td b{display:block}.version-preview-table340 td small{display:block;margin-top:4px;color:var(--muted);line-height:1.35}.version-note340{color:#8a641d!important}.empty-cell340{color:#a8b7b2}
    .version-modal-actions340{display:flex;justify-content:flex-end;align-items:center;gap:14px;padding-top:14px}.version-modal-actions340 span{margin-right:auto;color:var(--muted);font-size:12px}
    @media(max-width:700px){.version-head340{align-items:flex-start}.version-count340{width:100%;margin-left:0;padding:2px 0}.version-filters340 label{flex:1 1 145px}.version-filters340 .btn{flex:1 1 auto}.version-modal340{padding:6px}.version-modal-box340{width:100%;max-height:97vh;border-radius:12px;padding:10px}.version-modal-head340 h2{font-size:17px}.version-modal-actions340{align-items:stretch;flex-direction:column}.version-modal-actions340 span{margin:0}.version-modal-actions340 .btn{width:100%}}
  `;
  document.head.appendChild(style);

  // Capture the PIN only for this browser session. The existing Cloud login still validates it.
  q('#login')?.addEventListener('submit',()=>{adminPin340=q('#pin')?.value||''},true);
  buildUI340();
  fillBranches340();
  document.querySelectorAll('.cute-mascot').forEach(x=>x.remove());
  const footer=q('.side footer');if(footer)footer.textContent='Version 3.4 · Schedule Versions';
})();
