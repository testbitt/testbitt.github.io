/* Version 3.35 — Custom Check layout refinement */
(()=>{
  function ensureLayout(){
    const box=document.querySelector('.custom-check');
    if(!box)return;

    box.classList.add('cc-layout-v335');

    let primary=document.querySelector('#ccPrimaryPanel');
    if(!primary){
      primary=document.createElement('div');
      primary.id='ccPrimaryPanel';
      primary.className='cc-primary-panel';

      const row=document.createElement('div');
      row.className='cc-primary-row';

      const selector=document.createElement('div');
      selector.id='ccSelectorArea';
      selector.className='cc-selector-area';

      const actions=document.createElement('div');
      actions.id='ccMainActions';
      actions.className='cc-main-actions';

      const metaWrap=document.createElement('div');
      metaWrap.className='cc-meta-wrap';

      row.append(selector,actions);
      primary.append(row,metaWrap);

      const title=box.querySelector('.custom-title');
      if(title)title.insertAdjacentElement('afterend',primary);
      else box.prepend(primary);
    }

    const selector=primary.querySelector('#ccSelectorArea');
    const actions=primary.querySelector('#ccMainActions');
    const metaWrap=primary.querySelector('.cc-meta-wrap');

    const oldSelect=document.querySelector('#customCheckSelect');
    const multi=document.querySelector('#customCheckMulti');
    if(oldSelect&&oldSelect.parentElement!==selector)selector.appendChild(oldSelect);
    if(multi&&multi.parentElement!==selector)selector.appendChild(multi);

    ['saveCustom','updateCustom','renameCustom','deleteCustom'].forEach(id=>{
      const el=document.getElementById(id);
      if(el&&el.parentElement!==actions)actions.appendChild(el);
    });

    ['customCheckMeta','customCheckMessage'].forEach(id=>{
      const el=document.getElementById(id);
      if(el&&el.parentElement!==metaWrap)metaWrap.appendChild(el);
    });

    const shared=document.querySelector('#sharedCustomAdmin');
    if(shared&&shared.parentElement===box){
      shared.classList.add('cc-shared-wide');
    }
  }

  const css=document.createElement('style');
  css.textContent=`
    .custom-check.cc-layout-v335{
      display:grid!important;
      grid-template-columns:220px minmax(0,1fr)!important;
      gap:12px 16px!important;
      align-items:start!important;
      padding:16px 18px!important;
    }
    .custom-check.cc-layout-v335>.custom-title{
      grid-column:1;
      grid-row:1;
      min-height:46px;
      align-items:center;
      font-size:18px;
    }
    #ccPrimaryPanel{
      grid-column:2;
      grid-row:1;
      min-width:0;
      display:grid;
      gap:7px;
    }
    .cc-primary-row{
      display:grid;
      grid-template-columns:minmax(360px,1fr) auto;
      gap:12px;
      align-items:center;
      min-width:0;
    }
    .cc-selector-area{
      min-width:0;
    }
    .cc-selector-area #customCheckSelect{
      display:none!important;
    }
    .cc-selector-area .cc-multi{
      width:100%!important;
      min-width:0!important;
      flex:none!important;
    }
    .cc-selector-area .cc-multi-btn{
      min-height:48px;
      border-radius:15px;
      font-size:15px;
    }
    .cc-main-actions{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      gap:7px;
      flex-wrap:wrap;
    }
    .cc-main-actions .btn{
      min-height:42px;
      white-space:nowrap;
      margin:0!important;
    }
    .cc-meta-wrap{
      min-width:0;
      padding:0 2px;
    }
    .cc-meta-wrap #customCheckMeta,
    .cc-meta-wrap #customCheckMessage{
      grid-column:auto!important;
      margin:0!important;
      min-height:0;
    }
    .cc-meta-wrap #customCheckMessage:empty{
      display:none;
    }
    #sharedCustomAdmin.cc-shared-wide{
      grid-column:1/-1!important;
      width:100%!important;
      margin:2px 0 0!important;
      padding:13px 15px!important;
      display:grid!important;
      grid-template-columns:260px minmax(0,1fr)!important;
      gap:8px 14px!important;
      align-items:center!important;
      box-sizing:border-box;
    }
    #sharedCustomAdmin .shared-admin-title{
      width:auto!important;
      min-width:0!important;
      align-self:center;
    }
    #sharedCustomAdmin .shared-admin-actions{
      width:auto!important;
      display:flex!important;
      justify-content:flex-start;
      align-items:center;
      gap:7px;
      flex-wrap:wrap;
    }
    #sharedCustomAdmin .shared-admin-actions .btn{
      min-height:40px;
      margin:0;
      white-space:nowrap;
    }
    #sharedCustomAdmin .shared-admin-note{
      grid-column:1/-1;
      flex-basis:auto!important;
      padding-top:2px;
      font-size:11px;
    }

    @media(max-width:1350px){
      .custom-check.cc-layout-v335{
        grid-template-columns:190px minmax(0,1fr)!important;
      }
      .cc-primary-row{
        grid-template-columns:1fr;
      }
      .cc-main-actions{
        justify-content:flex-start;
      }
    }
    @media(max-width:900px){
      .custom-check.cc-layout-v335{
        grid-template-columns:1fr!important;
        padding:13px!important;
      }
      .custom-check.cc-layout-v335>.custom-title,
      #ccPrimaryPanel{
        grid-column:1;
        grid-row:auto;
      }
      .custom-check.cc-layout-v335>.custom-title{
        min-height:auto;
      }
      #sharedCustomAdmin.cc-shared-wide{
        grid-column:1!important;
        grid-template-columns:1fr!important;
      }
      #sharedCustomAdmin .shared-admin-note{
        grid-column:1;
      }
    }
    @media(max-width:640px){
      .cc-primary-row{
        grid-template-columns:1fr;
      }
      .cc-main-actions{
        display:grid;
        grid-template-columns:1fr 1fr;
        width:100%;
      }
      .cc-main-actions .btn{
        width:100%!important;
      }
      #sharedCustomAdmin .shared-admin-actions{
        display:grid!important;
        grid-template-columns:1fr 1fr;
      }
      #sharedCustomAdmin .shared-admin-actions .btn{
        width:100%!important;
      }
      .cc-selector-area .cc-multi-btn{
        font-size:14px;
      }
    }
  `;
  document.head.appendChild(css);

  ensureLayout();
  setTimeout(ensureLayout,150);
  setTimeout(ensureLayout,500);
  setTimeout(ensureLayout,1200);
  document.addEventListener('kamu:data-ready',()=>setTimeout(ensureLayout,100));

  const v=document.querySelector('.version');
  if(v){const fresh=v.cloneNode(false);fresh.textContent='Version 3.35 • Public Multi‑User Cloud';v.replaceWith(fresh)}
})();