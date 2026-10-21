/* Version 3.34 — Admin Shared Custom Check Groups */
(()=>{
  const API='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-api';
  const PREFIX='🌐 ';
  const ROLE=()=>localStorage.getItem('kamuInvCloudRole')||'';
  const TOKEN=()=>localStorage.getItem('kamuInvCloudToken')||'';
  const T2=v=>String(v??'').trim();
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  let sharedGroups={};
  let loadingShared=false;

  async function api(action,data={}){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',...(TOKEN()?{'Authorization':'Bearer '+TOKEN()}:{})},body:JSON.stringify({action,...data})});
    let out={};try{out=await r.json()}catch{}
    if(!r.ok||out.ok===false)throw Error(out.message||out.error||('HTTP '+r.status));
    return out;
  }
  function internalName(raw){return PREFIX+raw}
  function rawSharedName(name){return String(name||'').startsWith(PREFIX)?String(name).slice(PREFIX.length):''}
  function selectedNames(){return String(activeCustomCheck||'').split(' + ').map(T2).filter(Boolean)}
  function selectedShared(){return selectedNames().filter(x=>x.startsWith(PREFIX))}
  function mergeShared(){
    if(!customChecks||typeof customChecks!=='object')customChecks={};
    for(const k of Object.keys(customChecks))if(k.startsWith(PREFIX))delete customChecks[k];
    for(const [name,codes] of Object.entries(sharedGroups))customChecks[internalName(name)]=Array.isArray(codes)?[...codes]:[];
  }
  async function loadShared(){
    if(!TOKEN()||loadingShared)return;
    loadingShared=true;
    try{
      const x=await api('load_shared_custom_checks');
      sharedGroups={};
      for(const g of Array.isArray(x.groups)?x.groups:[]){
        const name=T2(g.name);if(name)sharedGroups[name]=Array.isArray(g.rm_codes)?g.rm_codes:[];
      }
      mergeShared();
      if(typeof renderCustomChecks==='function')renderCustomChecks();
    }catch(e){console.warn('Shared Custom Check load',e)}
    finally{loadingShared=false}
  }

  const basePersist=persistCustomChecks;
  persistCustomChecks=async function(){
    if(ROLE()==='user'){
      const clean={};
      for(const [name,codes] of Object.entries(customChecks||{})){
        if(String(name).startsWith(PREFIX))continue;
        clean[name]=Array.isArray(codes)?codes:[];
      }
      await api('save_custom_checks',{custom_checks:clean});
      return;
    }
    return basePersist.apply(this,arguments);
  };

  function annotateShared(){
    document.querySelectorAll('#customCheckMultiOptions .cc-multi-opt').forEach(label=>{
      const input=label.querySelector('input[type=checkbox]');if(!input)return;
      const raw=rawSharedName(input.value);
      if(!raw)return;
      label.classList.add('cc-shared');
      const b=label.querySelector('b');
      if(b)b.innerHTML='🌐 '+esc(raw)+' <em>แชร์โดย Admin</em>';
      const small=label.querySelector('small');
      if(small)small.textContent=(sharedGroups[raw]||[]).length.toLocaleString('th-TH')+' รายการ • ใช้ร่วมกันทุก User';
    });
  }

  function protectShared(){
    const shared=selectedShared(),hasShared=shared.length>0;
    const update=document.querySelector('#updateCustom'),del=document.querySelector('#deleteCustom'),rename=document.querySelector('#renameCustom');
    if(hasShared){
      if(update){update.disabled=true;update.title='Group ที่แชร์โดย Admin แก้ไขจาก User ไม่ได้'}
      if(del){del.disabled=true;del.title='Group ที่แชร์โดย Admin ลบจาก User ไม่ได้'}
      if(rename){rename.disabled=true;rename.title='Group ที่แชร์โดย Admin เปลี่ยนชื่อได้จาก Admin เท่านั้น'}
    }
  }

  function ensureAdminControls(){
    const box=document.querySelector('.custom-check');if(!box)return;
    let wrap=document.querySelector('#sharedCustomAdmin');
    if(ROLE()!=='admin'){if(wrap)wrap.remove();return}
    if(!wrap){
      wrap=document.createElement('div');wrap.id='sharedCustomAdmin';wrap.className='shared-custom-admin';
      wrap.innerHTML=`
        <div class="shared-admin-title"><span>🌐</span><div><b>Shared Custom Check</b><small>บันทึก Group กลางและแชร์ให้ User ทุกคน</small></div></div>
        <div class="shared-admin-actions">
          <button type="button" class="btn small" id="saveSharedCustom">🌐 บันทึกชุดใหม่ + แชร์ User</button>
          <button type="button" class="btn alt small" id="updateSharedCustom">💾 บันทึกทับ Shared</button>
          <button type="button" class="btn alt small" id="renameSharedCustom">✏️ แก้ชื่อ Shared</button>
          <button type="button" class="btn danger small" id="deleteSharedCustom">🗑️ ลบ Shared</button>
        </div>
        <div class="shared-admin-note" id="sharedAdminNote">เลือก RM ที่ต้องการ หรือเลือก User จาก Admin ก่อน แล้วบันทึกเป็น Group กลาง</div>`;
      box.appendChild(wrap);
      document.querySelector('#saveSharedCustom').onclick=saveSharedNew;
      document.querySelector('#updateSharedCustom').onclick=updateShared;
      document.querySelector('#renameSharedCustom').onclick=renameShared;
      document.querySelector('#deleteSharedCustom').onclick=deleteShared;
    }
    syncAdminButtons();
  }

  function syncAdminButtons(){
    const wrap=document.querySelector('#sharedCustomAdmin');if(!wrap)return;
    const arr=selectedShared(),one=arr.length===1;
    const u=document.querySelector('#updateSharedCustom'),r=document.querySelector('#renameSharedCustom'),d=document.querySelector('#deleteSharedCustom');
    if(u)u.disabled=!one;
    if(r)r.disabled=!one;
    if(d)d.disabled=!one;
    const note=document.querySelector('#sharedAdminNote');
    if(note){
      if(one){
        const raw=rawSharedName(arr[0]);
        note.innerHTML=`กำลังเลือก <b>🌐 ${esc(raw)}</b> • ${(sharedGroups[raw]||[]).length.toLocaleString('th-TH')} รายการ • Admin สามารถบันทึกทับ/เปลี่ยนชื่อ/ลบได้`;
      }else if(arr.length>1)note.textContent='เลือก Shared Group เพียง 1 Group เพื่อแก้ไข';
      else note.textContent='เลือก RM ที่ต้องการ แล้วกด “บันทึกชุดใหม่ + แชร์ User”';
    }
  }

  async function saveSharedNew(){
    if(ROLE()!=='admin')return;
    if(!selectedRM?.size){alert('กรุณาเลือก RM อย่างน้อย 1 รายการก่อนบันทึก Shared Group\nหากไม่มีรายการ RM ให้เลือก User จากหน้า Admin ก่อน');return}
    let name=prompt('ตั้งชื่อ Shared Custom Check Group');if(name===null)return;name=T2(name);
    if(!name){alert('กรุณาระบุชื่อ Group');return}
    if(name.toLowerCase()==='standard'||name.startsWith(PREFIX)){alert('ชื่อ Standard และสัญลักษณ์ 🌐 เป็นชื่อสงวนของระบบ');return}
    if(sharedGroups[name]&&!confirm(`มี Shared Group “${name}” อยู่แล้ว ต้องการบันทึกทับหรือไม่?`))return;
    const codes=[...selectedRM].sort((a,b)=>String(a).localeCompare(String(b),'en',{numeric:true}));
    try{
      await api('admin_save_shared_custom_check',{name,rm_codes:codes});
      await loadShared();
      if(typeof applyCustomCheck==='function')applyCustomCheck(internalName(name),false);
      setCustomMessage?.(`แชร์ Group “${name}” ให้ User แล้ว • ${codes.length.toLocaleString('th-TH')} รายการ`,'ok');
    }catch(e){alert('บันทึก Shared Group ไม่สำเร็จ: '+(e?.message||e))}
  }
  async function updateShared(){
    if(ROLE()!=='admin')return;
    const arr=selectedShared();if(arr.length!==1)return;
    if(!selectedRM?.size){alert('Shared Group ต้องมีอย่างน้อย 1 RM');return}
    const raw=rawSharedName(arr[0]),codes=[...selectedRM].sort((a,b)=>String(a).localeCompare(String(b),'en',{numeric:true}));
    if(!confirm(`บันทึกทับ Shared Group “${raw}” ด้วย ${codes.length} รายการหรือไม่?`))return;
    try{await api('admin_save_shared_custom_check',{name:raw,rm_codes:codes});await loadShared();applyCustomCheck?.(internalName(raw),false);setCustomMessage?.(`บันทึกทับ Shared Group “${raw}” แล้ว`,'ok')}
    catch(e){alert('บันทึกทับ Shared Group ไม่สำเร็จ: '+(e?.message||e))}
  }
  async function renameShared(){
    if(ROLE()!=='admin')return;
    const arr=selectedShared();if(arr.length!==1)return;
    const oldName=rawSharedName(arr[0]);let newName=prompt('แก้ชื่อ Shared Group',oldName);if(newName===null)return;newName=T2(newName);
    if(!newName||newName===oldName)return;
    if(newName.toLowerCase()==='standard'||newName.startsWith(PREFIX)){alert('ชื่อนี้สงวนไว้สำหรับระบบ');return}
    try{await api('admin_rename_shared_custom_check',{old_name:oldName,new_name:newName});await loadShared();applyCustomCheck?.(internalName(newName),false);setCustomMessage?.(`เปลี่ยนชื่อ Shared Group เป็น “${newName}” แล้ว`,'ok')}
    catch(e){alert('เปลี่ยนชื่อ Shared Group ไม่สำเร็จ: '+(e?.message||e))}
  }
  async function deleteShared(){
    if(ROLE()!=='admin')return;
    const arr=selectedShared();if(arr.length!==1)return;
    const raw=rawSharedName(arr[0]);if(!confirm(`ลบ Shared Group “${raw}” ออกจาก User ทุกคนหรือไม่?`))return;
    try{await api('admin_delete_shared_custom_check',{name:raw});await loadShared();if(typeof applyCustomCheck==='function')applyCustomCheck('',false);setCustomMessage?.(`ลบ Shared Group “${raw}” แล้ว`,'warn')}
    catch(e){alert('ลบ Shared Group ไม่สำเร็จ: '+(e?.message||e))}
  }

  const baseRender=renderCustomChecks;
  renderCustomChecks=function(){
    const out=baseRender.apply(this,arguments);
    annotateShared();protectShared();ensureAdminControls();syncAdminButtons();
    return out;
  };

  const css=document.createElement('style');
  css.textContent=`
    .cc-multi-opt.cc-shared{background:#eef7ff;border:1px solid #bed8ef}
    .cc-multi-opt.cc-shared b{color:#175f8d}.cc-multi-opt.cc-shared b em{font-style:normal;font-size:9px;color:#4f7f9d;background:#ddebfa;border-radius:999px;padding:2px 6px;margin-left:5px}
    .shared-custom-admin{flex-basis:100%;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px;padding:12px;border-radius:14px;background:#f2f8ff;border:1px solid #c6ddf0}
    .shared-admin-title{display:flex;gap:8px;align-items:center;min-width:230px}.shared-admin-title>span{font-size:23px}.shared-admin-title b{display:block;color:#175f8d}.shared-admin-title small{display:block;color:#668399;margin-top:2px;font-size:10px}
    .shared-admin-actions{display:flex;gap:7px;flex-wrap:wrap}.shared-admin-note{flex-basis:100%;font-size:10px;color:#557588}
    @media(max-width:850px){.shared-admin-title,.shared-admin-actions{width:100%}.shared-admin-actions .btn{flex:1 1 180px}}
  `;
  document.head.appendChild(css);

  ensureAdminControls();
  setTimeout(()=>{ensureAdminControls();loadShared()},300);
  setTimeout(()=>{ensureAdminControls();loadShared()},1200);
  document.addEventListener('kamu:data-ready',()=>setTimeout(()=>{ensureAdminControls();loadShared()},120));

  const v=document.querySelector('.version');
  if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.34 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();