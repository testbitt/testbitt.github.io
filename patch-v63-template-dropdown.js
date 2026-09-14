/* KSL V6.3 — Template dropdown + selected-template-only inspection rows */
(()=>{
  'use strict';
  if(window.__KSL_TEMPLATE_DROPDOWN_V63__)return;
  window.__KSL_TEMPLATE_DROPDOWN_V63__=true;

  const q=v=>String(v??'').trim();
  let applyTimer=0;
  let enforcing=false;
  let attempts=0;

  const style=document.createElement('style');
  style.id='ksl-template-dropdown-v63-style';
  style.textContent=`
    #expiryAudit #eaFlowTplBox{position:relative}
    #expiryAudit .flow63-dropdown-wrap{position:relative;min-width:min(520px,100%);flex:1 1 360px}
    #expiryAudit #eaFlowTplToggle{width:100%;min-height:40px;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;background:#fff;border:1px solid #bcd9cd;border-radius:10px;padding:8px 12px;color:#214b3b;font-weight:900;cursor:pointer}
    #expiryAudit #eaFlowTplToggle::after{content:'▾';font-size:12px;color:#638074}
    #expiryAudit #eaFlowTplToggle.open::after{content:'▴'}
    #expiryAudit #eaFlowTplList.flow63-dropdown-menu{display:none;position:absolute;left:0;right:0;top:calc(100% + 5px);z-index:50;max-height:290px;overflow:auto;padding:8px;background:#fff;border:1px solid #c9e0d6;border-radius:11px;box-shadow:0 12px 30px rgba(29,75,57,.16)}
    #expiryAudit #eaFlowTplList.flow63-dropdown-menu.open{display:flex;flex-direction:column;gap:5px}
    #expiryAudit #eaFlowTplList.flow63-dropdown-menu .flow63-chip{width:100%;box-sizing:border-box;border-radius:8px;justify-content:flex-start;padding:8px 10px}
    #expiryAudit #eaFlowTplList.flow63-dropdown-menu .flow63-chip:hover{background:#f0f8f4}
    #expiryAudit #eaFlowTplList.flow63-dropdown-menu input{width:15px;height:15px;flex:0 0 auto}
    #expiryAudit .flow63-actions{align-items:stretch}
    #expiryAudit #eaFlowTplApply{display:none!important}
    #expiryAudit #eaFlowTplCount{display:flex;align-items:center;padding:0 4px}
    @media(max-width:700px){#expiryAudit .flow63-dropdown-wrap{min-width:100%}}
  `;
  document.head.appendChild(style);

  function checked(){
    return [...document.querySelectorAll('#eaFlowTplList input[type="checkbox"]:checked')];
  }

  function updateLabel(){
    const btn=document.getElementById('eaFlowTplToggle');
    const count=document.getElementById('eaFlowTplCount');
    if(!btn)return;
    const arr=checked();
    if(!arr.length){
      btn.querySelector('span').textContent='เลือก Template';
      if(count)count.textContent='ยังไม่ได้เลือก Template';
      return;
    }
    const names=arr.map(x=>q(x.closest('label')?.querySelector('span')?.textContent).replace(/\s*•\s*\d+\s*รายการ\s*$/,'')).filter(Boolean);
    btn.querySelector('span').textContent=arr.length===1?(names[0]||'1 Template'):`เลือกแล้ว ${arr.length} Template`;
    if(count)count.textContent=`แสดงเฉพาะรายการจาก ${arr.length} Template`;
  }

  function closeMenu(){
    document.getElementById('eaFlowTplList')?.classList.remove('open');
    document.getElementById('eaFlowTplToggle')?.classList.remove('open');
  }

  function install(){
    const box=document.getElementById('eaFlowTplBox');
    const list=document.getElementById('eaFlowTplList');
    const actions=box?.querySelector('.flow63-actions');
    if(!box||!list||!actions)return false;

    list.classList.add('flow63-dropdown-menu');
    let wrap=document.getElementById('eaFlowTplDropdownWrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='eaFlowTplDropdownWrap';
      wrap.className='flow63-dropdown-wrap';
      const toggle=document.createElement('button');
      toggle.id='eaFlowTplToggle';
      toggle.type='button';
      toggle.innerHTML='<span>เลือก Template</span>';
      list.parentNode.insertBefore(wrap,list);
      wrap.appendChild(toggle);
      wrap.appendChild(list);
      actions.insertBefore(wrap,actions.firstChild);
    }
    updateLabel();
    return true;
  }

  function applySelected(){
    clearTimeout(applyTimer);
    applyTimer=setTimeout(()=>{
      const arr=checked();
      if(!arr.length){
        document.getElementById('eaClearSelected')?.click();
        updateLabel();
        return;
      }
      enforcing=true;
      document.getElementById('eaFlowTplApply')?.click();
      setTimeout(()=>{enforcing=false;updateLabel();},180);
    },90);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaFlowTplToggle')){
      e.preventDefault();
      install();
      const list=document.getElementById('eaFlowTplList');
      const btn=document.getElementById('eaFlowTplToggle');
      const willOpen=!list?.classList.contains('open');
      list?.classList.toggle('open',willOpen);
      btn?.classList.toggle('open',willOpen);
      return;
    }
    if(!e.target.closest?.('#eaFlowTplDropdownWrap')) closeMenu();
    if(e.target.closest?.('#eaTemplateSave,#eaTemplateDelete,#eaTemplateNew,#eaTemplateEdit,.nav button[data-page="expiryAudit"],#eaRefresh,#eaFlowStart')){
      setTimeout(()=>{install();updateLabel();},220);
    }
  },true);

  document.addEventListener('change',e=>{
    if(e.target.closest?.('#eaFlowTplList input[type="checkbox"]')){
      install(); updateLabel(); applySelected(); return;
    }
    if(e.target?.id==='eaItemPicker' && checked().length && !enforcing){
      // In Template mode, manual additions must not leak into the inspection table.
      applySelected();
    }
  },true);

  window.addEventListener('ksl-central-synced',()=>setTimeout(()=>{install();updateLabel();},180));

  function boot(){
    attempts++;
    if(install())return;
    if(attempts<80)setTimeout(boot,150);
  }
  boot();
  console.info('[KSL] V6.3 Template dropdown + template-only rows ready');
})();
