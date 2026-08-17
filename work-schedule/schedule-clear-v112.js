(()=>{
  const table=document.querySelector('#scheduleTable');
  const schedulePage=document.querySelector('#page-schedule');
  if(!schedulePage||!table)return;

  const style=document.createElement('style');
  style.textContent=`
    #clearScheduleBtn{background:#fff6f6;color:#a33b3b;border:1px solid #efcaca}
    #clearScheduleBtn:hover{background:#ffecec}
    #clearScheduleBtn .trash{margin-right:6px}
  `;
  document.head.appendChild(style);

  function normalizePlaceholders(){
    table.querySelectorAll('input.normal').forEach(input=>{
      input.placeholder='-';
      input.setAttribute('aria-label','เวลาปกติ');
    });
  }

  normalizePlaceholders();
  new MutationObserver(normalizePlaceholders).observe(table,{childList:true,subtree:true});

  const saveBtn=document.querySelector('#save');
  let clearBtn=document.querySelector('#clearScheduleBtn');
  if(!clearBtn){
    clearBtn=document.createElement('button');
    clearBtn.id='clearScheduleBtn';
    clearBtn.type='button';
    clearBtn.className='btn ghost';
    clearBtn.innerHTML='<span class="trash">🗑</span>ล้างข้อมูลในตาราง';
    if(saveBtn?.parentNode) saveBtn.parentNode.insertBefore(clearBtn,saveBtn);
  }

  clearBtn.onclick=()=>{
    const wrap=document.querySelector('#scheduleWrap');
    const cells=[...table.querySelectorAll('.cell')];
    if(!wrap||wrap.classList.contains('hidden')||!cells.length){
      return toast('กรุณาแสดงตารางก่อนล้างข้อมูล','error');
    }

    const branch=document.querySelector('#branch')?.value||'';
    const week=document.querySelector('#week')?.value||'';
    const ok=window.confirm(
      `ยืนยันล้างข้อมูลทั้งหมดในตารางนี้?\n\nสาขา: ${branch||'-'}\nสัปดาห์: ${week||'-'}\n\nระบบจะล้าง เวลาปกติ / ประเภท OT / เวลา OT / หมายเหตุ ของพนักงานทุกคนในตาราง\nข้อมูลเดิมจะยังไม่ถูกบันทึกทับจนกว่าจะกด “บันทึกตาราง”`
    );
    if(!ok)return;

    table.querySelectorAll('input.normal').forEach(el=>{el.value='';el.placeholder='-';});
    table.querySelectorAll('select.otType').forEach(el=>{el.value='';});
    table.querySelectorAll('input.otStart,input.otEnd').forEach(el=>{el.value='';});
    table.querySelectorAll('input.note').forEach(el=>{el.value='';});

    table.querySelectorAll('input,select').forEach(el=>{
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });

    try{dirty=true;saveState();}catch{}
    toast('ล้างข้อมูลในตารางแล้ว กรุณากด “บันทึกตาราง” เพื่อบันทึกการเปลี่ยนแปลง');
  };

  const footer=document.querySelector('.side footer');
  if(footer)footer.textContent='Version 1.12 · Cute Green Anime';
})();
