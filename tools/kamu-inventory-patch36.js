/* Version 3.25 — Custom Check multi-group selection */
(()=>{
  let selectedCustomGroups=new Set();
  const multiKey='inventory:lastCustomChecks';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  function names(){return Object.keys(customChecks||{}).sort((a,b)=>a.localeCompare(b,'th',{numeric:true}))}
  function restore(){
    let arr=[];
    try{arr=JSON.parse(localStorage.getItem(multiKey)||'[]')}catch{}
    if(!Array.isArray(arr))arr=[];
    arr=arr.filter(n=>customChecks&&customChecks[n]);
    if(!arr.length&&activeCustomCheck&&customChecks&&customChecks[activeCustomCheck])arr=[activeCustomCheck];
    selectedCustomGroups=new Set(arr);
    syncActiveLabel();
  }
  function syncActiveLabel(){
    const arr=[...selectedCustomGroups].filter(n=>customChecks&&customChecks[n]);
    activeCustomCheck=arr.join(' + ');
    if(arr.length===1)localStorage.setItem('inventory:lastCustomCheck',arr[0]);else localStorage.removeItem('inventory:lastCustomCheck');
    localStorage.setItem(multiKey,JSON.stringify(arr));
  }
  function unionCodes(groups=[...selectedCustomGroups]){
    const set=new Set();
    for(const n of groups)for(const code of customChecks?.[n]||[])set.add(code);
    return set;
  }
  function availableUnion(){const valid=new Set(rmChoices().map(x=>x.code));return new Set([...unionCodes()].filter(x=>valid.has(x)))}
  function ensureUi(){
    const old=$('#customCheckSelect');if(!old)return;
    old.style.display='none';
    if($('#customCheckMulti'))return;
    const wrap=document.createElement('div');wrap.id='customCheckMulti';wrap.className='cc-multi';
    wrap.innerHTML='<button type="button" class="cc-multi-btn" id="customCheckMultiBtn"><span id="customCheckMultiText">-- เลือกชุด Custom Check --</span><span class="cc-caret">⌄</span></button><div class="cc-multi-popup" id="customCheckMultiPopup" hidden><div class="cc-multi-tools"><input id="customCheckMultiSearch" placeholder="ค้นหา Group"><button type="button" class="btn alt small" id="customCheckMultiClear">ล้าง</button></div><div id="customCheckMultiOptions" class="cc-multi-options"></div></div>';
    old.insertAdjacentElement('afterend',wrap);
    $('#customCheckMultiBtn').onclick=e=>{e.stopPropagation();const p=$('#customCheckMultiPopup');p.hidden=!p.hidden;if(!p.hidden){$('#customCheckMultiSearch').value='';renderMultiOptions();setTimeout(()=>$('#customCheckMultiSearch')?.focus(),0)}};
    $('#customCheckMultiSearch').oninput=renderMultiOptions;
    $('#customCheckMultiClear').onclick=()=>applyGroups([]);
    $('#customCheckMultiPopup').onclick=e=>e.stopPropagation();
    document.addEventListener('click',()=>{const p=$('#customCheckMultiPopup');if(p)p.hidden=true});
  }
  function renderMultiOptions(){
    const box=$('#customCheckMultiOptions');if(!box)return;
    const q=K($('#customCheckMultiSearch')?.value||'');
    const list=names().filter(n=>!q||K(n).includes(q));
    box.innerHTML=list.length?list.map(n=>`<label class="cc-multi-opt"><input type="checkbox" value="${esc(n)}" ${selectedCustomGroups.has(n)?'checked':''}><span><b>${esc(n)}</b><small>${(customChecks[n]||[]).length.toLocaleString('th-TH')} รายการ</small></span></label>`).join(''):'<div class="cc-empty">ไม่พบ Group</div>';
    box.querySelectorAll('input[type=checkbox]').forEach(ch=>ch.onchange=()=>{const next=new Set(selectedCustomGroups);if(ch.checked)next.add(ch.value);else next.delete(ch.value);applyGroups([...next],false)});
  }
  function applyGroups(groups,notify=true){
    const clean=[...new Set((groups||[]).filter(n=>customChecks&&customChecks[n]))];
    selectedCustomGroups=new Set(clean);syncActiveLabel();customDirty=false;
    selectedRM=availableUnion();renderRMFilter(true);render();renderCustomChecks();
    if(notify){if(clean.length)setCustomMessage(`ใช้ ${clean.length} Group • รวม ${selectedRM.size} รายการ`,'ok');else setCustomMessage('')}
  }
  renderCustomChecks=function(){
    ensureUi();
    const validNames=new Set(names());selectedCustomGroups=new Set([...selectedCustomGroups].filter(n=>validNames.has(n)));syncActiveLabel();
    const arr=[...selectedCustomGroups],union=unionCodes(),avail=availableUnion();
    const txt=$('#customCheckMultiText');if(txt)txt.textContent=!arr.length?'-- เลือกชุด Custom Check --':arr.length===1?`${arr[0]} (${avail.size})`:`เลือก ${arr.length} Group • ${avail.size} รายการ`;
    const meta=$('#customCheckMeta');if(meta)meta.textContent=!arr.length?'บันทึกชุดรายการตรวจไว้ใช้ครั้งถัดไป':`${arr.join(' + ')} • ${arr.length} Group • รวม ${avail.size}/${union.size} รายการ${customDirty?' • มีการแก้ไข ยังไม่ได้บันทึก':''}`;
    const u=$('#updateCustom'),d=$('#deleteCustom');
    if(u){u.disabled=arr.length!==1;u.title=arr.length>1?'เลือก 1 Group เพื่อบันทึกทับ':''}
    if(d){d.disabled=!arr.length;d.textContent=arr.length>1?`🗑️ ลบ ${arr.length} ชุด`:'🗑️ ลบชุด'}
    renderMultiOptions();
  };
  syncActiveCustomCheck=function(analysis=S.analysis){
    if(!selectedCustomGroups.size){restore();if(!selectedCustomGroups.size)return}
    const valid=new Set((analysis||[]).map(x=>x.rm));selectedRM=new Set([...unionCodes()].filter(x=>valid.has(x)));customDirty=false;syncActiveLabel();
  };
  applyCustomCheck=function(name,notify=true){applyGroups(name?[name]:[],notify)};
  markCustomDirty=function(){if(selectedCustomGroups.size){customDirty=true;renderCustomChecks()}};
  saveCustomCheckAs=async function(){
    if(!selectedRM.size){alert('กรุณาเลือก RM อย่างน้อย 1 รายการก่อนบันทึก Custom Check');return}
    let name=prompt('ตั้งชื่อ Group Custom Check ใหม่');if(name===null)return;name=T(name);if(!name)return;
    if(customChecks[name]&&!confirm(`มีชุด “${name}” อยู่แล้ว ต้องการบันทึกทับหรือไม่?`))return;
    customChecks[name]=[...selectedRM].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
    await persistCustomChecks();applyGroups([name],false);setCustomMessage(`บันทึก Group “${name}” แล้ว • ${selectedRM.size} รายการ`,'ok');
  };
  updateCustomCheck=async function(){
    const arr=[...selectedCustomGroups];if(arr.length!==1||!customChecks[arr[0]])return;
    if(!selectedRM.size){alert('Custom Check ต้องมีอย่างน้อย 1 รายการ');return}
    customChecks[arr[0]]=[...selectedRM].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));customDirty=false;await persistCustomChecks();renderCustomChecks();setCustomMessage(`บันทึกทับชุด “${arr[0]}” แล้ว`,'ok');
  };
  deleteCustomCheck=async function(){
    const arr=[...selectedCustomGroups];if(!arr.length)return;
    const label=arr.length===1?`ชุด “${arr[0]}”`:`${arr.length} Group: ${arr.join(', ')}`;
    if(!confirm(`ลบ ${label} หรือไม่?`))return;
    for(const n of arr)delete customChecks[n];await persistCustomChecks();applyGroups([],false);setCustomMessage(`ลบ ${arr.length} Group แล้ว`,'warn');
  };
  function rebind(){
    ensureUi();const s=$('#saveCustom'),u=$('#updateCustom'),d=$('#deleteCustom');if(s)s.onclick=saveCustomCheckAs;if(u)u.onclick=updateCustomCheck;if(d)d.onclick=deleteCustomCheck;
    const old=$('#customCheckSelect');if(old)old.onchange=null;renderCustomChecks();
  }
  const css=document.createElement('style');css.textContent=`
  .custom-check{align-items:flex-start!important}.cc-multi{position:relative;flex:1 1 420px;min-width:260px}.cc-multi-btn{width:100%;min-height:44px;border:2px solid #1770df;border-radius:16px;background:#fff;padding:9px 14px;display:flex;justify-content:space-between;align-items:center;font-size:16px;color:#1d2a22;text-align:left}.cc-caret{font-size:18px;color:#315f48}.cc-multi-popup{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:1200;background:#fff;border:1px solid #c8e2d1;border-radius:15px;box-shadow:0 16px 38px rgba(18,75,43,.18);padding:10px;max-height:360px;overflow:hidden}.cc-multi-tools{display:flex;gap:7px;margin-bottom:8px}.cc-multi-tools input{flex:1;min-width:0;padding:9px 10px;border:1px solid #bfdac8;border-radius:10px}.cc-multi-options{max-height:285px;overflow:auto;display:grid;gap:5px}.cc-multi-opt{display:flex;gap:9px;align-items:center;padding:8px 9px;border-radius:10px;cursor:pointer}.cc-multi-opt:hover{background:#f0f9f3}.cc-multi-opt input{width:17px;height:17px;accent-color:#238a55}.cc-multi-opt span{display:flex;justify-content:space-between;gap:12px;align-items:center;width:100%}.cc-multi-opt small{color:#718679;font-size:10px}.cc-empty{padding:14px;text-align:center;color:#718679}.custom-check #customCheckMeta{flex-basis:100%;margin-left:250px}@media(max-width:850px){.custom-check #customCheckMeta{margin-left:0}.cc-multi{flex-basis:100%}.cc-multi-btn{font-size:15px}}
  `;document.head.appendChild(css);
  restore();rebind();setTimeout(rebind,400);setTimeout(()=>{restore();syncActiveCustomCheck(S.analysis);renderRMFilter(true);renderCustomChecks();render()},1200);
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{restore();syncActiveCustomCheck(S.analysis);renderRMFilter(true);renderCustomChecks();render()},80));
  const v=document.querySelector('.version');if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.25 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();
