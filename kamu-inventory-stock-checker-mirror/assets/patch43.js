/* Version 3.33 — Fix unresponsive loop + separate mMilk / ไมแลคโกลด์วิปครีม Lead Time */
(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-api';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0};
  const T2=v=>String(v??'').trim();
  const milkCodeSet=new Set(['3603-4','Y3-36034','3107-1']);

  function normalizeMilkText(v){
    return String(v??'').toLowerCase().replace(/[^a-z0-9ก-๙]+/g,'');
  }
  function isMilkMilac(rm,desc=''){
    const code=T2(rm).toUpperCase();
    const s=normalizeMilkText(code+' '+desc);
    return milkCodeSet.has(code)||s.includes('mmilk')||s.includes('milac')||s.includes('ไมแลคโกลด์วิปครีม')||s.includes('ไมแลค');
  }

  function branchCode(){return document.querySelector('#planBranch')?.value||document.querySelector('#branch')?.value||''}
  function token(){return localStorage.getItem('kamuInvCloudToken')||''}
  async function saveSettings(branch){
    const settings=(S.reorderSettings||[]).filter(x=>T2(x.branch_code)===branch);
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},body:JSON.stringify({action:'save_reorder_settings',settings})});
    let out={};try{out=await r.json()}catch{}
    if(!r.ok||out.ok===false)throw Error(out.message||out.error||('HTTP '+r.status));
  }

  function setLeadForGroup(branch,days,wantMilk){
    days=Math.max(0,Math.min(365,Math.trunc(num(days))));
    const rows=[...document.querySelectorAll('#planTbl tbody tr')];
    const map=new Map((S.reorderSettings||[]).map(x=>[T2(x.branch_code)+'\u0001'+T2(x.rm_code).toUpperCase(),x]));
    let changed=0;
    for(const tr of rows){
      const rm=T2(tr.cells[0]?.textContent),desc=T2(tr.cells[1]?.textContent);
      if(!rm||/^WP/i.test(rm))continue;
      if(isMilkMilac(rm,desc)!==wantMilk)continue;
      const key=branch+'\u0001'+rm.toUpperCase();
      map.set(key,{branch_code:branch,rm_code:rm,lead_time_days:days,updated_at:new Date().toISOString()});
      changed++;
    }
    S.reorderSettings=[...map.values()];
    return changed;
  }

  async function applyGroup(wantMilk){
    const branch=branchCode();if(!branch){alert('กรุณาเลือกสาขา');return}
    const id=wantMilk?'planMilkDays':'planAllDays';
    const days=Math.max(0,Math.min(365,Math.trunc(num(document.querySelector('#'+id)?.value))));
    const changed=setLeadForGroup(branch,days,wantMilk);
    if(!changed){alert(wantMilk?'ไม่พบสินค้า mMilk / ไมแลคโกลด์วิปครีม ในสาขานี้':'ไม่พบสินค้าทั่วไปสำหรับกำหนด Lead Time');return}
    const btn=document.querySelector(wantMilk?'#applyMilkDays':'#applyPlanAll');
    const old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='กำลังบันทึก...'}
    try{
      await saveSettings(branch);
      if(typeof renderPlanningPage==='function')renderPlanningPage();
      alert((wantMilk?'บันทึก Lead Time mMilk / ไมแลคโกลด์วิปครีม':'บันทึก Lead Time สินค้าทั่วไป')+' '+days+' วัน • '+changed+' รายการแล้ว');
    }catch(e){alert('บันทึก Lead Time ไม่สำเร็จ: '+(e?.message||e))}
    finally{if(btn){btn.disabled=false;btn.textContent=old}}
  }

  function ensureSeparateLeadUi(){
    const toolbar=document.querySelector('#planning .planning-toolbar');
    const all=document.querySelector('#planAllDays');
    const apply=document.querySelector('#applyPlanAll');
    if(!toolbar||!all||!apply)return;

    const allLabel=all.closest('label');
    if(allLabel){
      const textNode=[...allLabel.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
      if(textNode)textNode.textContent='Lead Time สินค้าทั่วไป ';
    }

    if(!document.querySelector('#planMilkDays')){
      const label=document.createElement('label');
      label.className='milk-lead-label';
      label.innerHTML='Lead Time mMilk / ไมแลคโกลด์วิปครีม <input id="planMilkDays" type="number" min="0" max="365" value="0">';
      const btn=document.createElement('button');
      btn.className='btn milk-lead-btn';btn.id='applyMilkDays';btn.type='button';btn.textContent='ใช้กับ mMilk / ไมแลคโกลด์วิปครีม';
      apply.insertAdjacentElement('afterend',label);
      label.insertAdjacentElement('afterend',btn);
    }

    if(apply.dataset.leadGroupBound!=='1'){
      apply.dataset.leadGroupBound='1';
      apply.onclick=()=>applyGroup(false);
    }
    const milkBtn=document.querySelector('#applyMilkDays');
    if(milkBtn&&milkBtn.dataset.leadGroupBound!=='1'){
      milkBtn.dataset.leadGroupBound='1';
      milkBtn.onclick=()=>applyGroup(true);
    }

    const noteId='milkLeadNote';
    if(!document.querySelector('#'+noteId)){
      const note=document.createElement('div');
      note.id=noteId;note.className='milk-lead-note';
      note.innerHTML='<b>Lead Time แยก:</b> mMilk / ไมแลคโกลด์วิปครีม จะใช้วันรอส่งของกลุ่มนี้เท่านั้น และไม่ใช้ค่า Lead Time ของสินค้าทั่วไป';
      toolbar.insertAdjacentElement('afterend',note);
    }
  }

  function markMilkRows(){
    for(const tr of document.querySelectorAll('#planTbl tbody tr')){
      const rm=T2(tr.cells[0]?.textContent),desc=T2(tr.cells[1]?.textContent);
      const milk=isMilkMilac(rm,desc);
      tr.classList.toggle('milk-milac-row',milk);
      const lead=tr.cells[7];
      if(lead){
        let badge=lead.querySelector('.milk-badge');
        if(milk&&!badge){
          badge=document.createElement('small');badge.className='milk-badge';badge.textContent='mMilk / ไมแลคโกลด์วิปครีม';
          lead.appendChild(badge);
        }else if(!milk&&badge)badge.remove();
      }
    }
  }

  function hideWpFromPlanningExport(){
    // Patch42 already filters WP. This guard also excludes WP if another export renderer is attached later.
    for(const tr of document.querySelectorAll('.oito-order-export tbody tr')){
      const rm=T2(tr.cells[0]?.textContent);
      if(/^WP/i.test(rm))tr.remove();
    }
  }

  let obsPending=false;
  const runSafeRefresh=()=>{
    if(obsPending)return;
    obsPending=true;
    requestAnimationFrame(()=>{
      obsPending=false;
      ensureSeparateLeadUi();
      markMilkRows();
      hideWpFromPlanningExport();
    });
  };
  const planRoot=document.querySelector('#planning')||document.body;
  const obs=new MutationObserver(runSafeRefresh);
  obs.observe(planRoot,{childList:true,subtree:true});

  const css=document.createElement('style');
  css.textContent=`
    .milk-lead-label input{border-color:#a9cce8!important;background:#f7fbff!important}
    .milk-lead-btn{background:#eef7ff!important;color:#17608f!important;border-color:#a9cce8!important}
    .milk-lead-note{margin:8px 0 0;padding:9px 11px;border-radius:11px;background:#f4f9ff;border:1px solid #c7dff1;color:#40677f;font-size:11px}
    #planTbl tr.milk-milac-row{background:#f7fbff}
    .milk-badge{display:block;margin-top:4px;color:#17608f;font-weight:850;font-size:9px;white-space:nowrap}
    @media(max-width:640px){.milk-lead-label,.milk-lead-btn{width:100%}}
  `;
  document.head.appendChild(css);

  ensureSeparateLeadUi();markMilkRows();
  setTimeout(()=>{ensureSeparateLeadUi();markMilkRows()},500);
  setTimeout(()=>{ensureSeparateLeadUi();markMilkRows()},1300);
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{ensureSeparateLeadUi();markMilkRows()},150));

  const v=document.querySelector('.version');
  if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.33 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();