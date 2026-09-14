/* Version 3.23 — Item Sale consistency + integer daily average + cup grand total */
(()=>{
  const fmt0=v=>Math.round(Number(v)||0).toLocaleString('th-TH');
  const fmt=v=>(Number(v)||0).toLocaleString('th-TH',{maximumFractionDigits:2});
  const parseNum=v=>{const s=String(v??'').replace(/[^0-9.\-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0};
  const isDash=v=>/^[\s—–-]*$/.test(String(v??''));

  function manualCupMap(){
    const m=new Map();
    for(const x of Array.isArray(S?.cupMapping)?S.cupMapping:[]){
      const code=T(x?.item_code).toUpperCase();
      if(code)m.set(code,x);
    }
    return m;
  }

  function itemSaleCupSnapshot(branch,date){
    const manual=manualCupMap(),byRm=new Map();
    let total=0,unmapped=0;
    for(const r of Array.isArray(S?.item)?S.item:[]){
      if(branch&&T(V(r,'wh'))!==branch)continue;
      if(date&&T(V(r,'date'))!==date)continue;
      const code=T(V(r,'item')).toUpperCase(),name=T(V(r,'itemd')),cfg=manual.get(code);
      const match=name.match(/\((P|PB|PP|M|MB|L|LB|H|S)\)\s*$/i),autoSize=match?match[1].toUpperCase():'';
      const count=cfg?cfg.count_as_cup!==false:/^KR\d+/i.test(code)&&!!autoSize;
      const qty=N(V(r,'qty'));
      if(!count||!qty)continue;
      total+=qty;
      const rm=T(cfg?.usage_rm_code).toUpperCase();
      if(rm)byRm.set(rm,(byRm.get(rm)||0)+qty);else unmapped+=qty;
    }
    return{total,unmapped,byRm,mapped:[...byRm.values()].reduce((s,v)=>s+v,0)};
  }

  function setDiffCell(cell,value){
    if(!cell)return;
    cell.className='num';
    if(value===null){cell.textContent='—';return}
    cell.textContent=typeof F==='function'?F(value):fmt(value);
    if(Math.abs(value)<0.0005)cell.classList.add('ok');
    else if(value>0)cell.classList.add('warn');
    else cell.classList.add('bad');
  }

  function fixCupUsageItemSale(){
    const body=document.querySelector('#cupTbl tbody');
    if(!body)return;
    const branch=document.querySelector('#branch')?.value||'',date=document.querySelector('#date')?.value||'';
    if(!branch)return;
    const snap=itemSaleCupSnapshot(branch,date);
    for(const tr of [...body.rows]){
      if(tr.cells.length<10||tr.querySelector('.cup-empty'))continue;
      const rm=T(tr.cells[0]?.textContent).toUpperCase(),item=snap.byRm.get(rm)||0;
      const bom=parseNum(tr.cells[4]?.textContent),stock=isDash(tr.cells[5]?.textContent)?null:parseNum(tr.cells[5]?.textContent);
      tr.cells[6].textContent=typeof F==='function'?F(item):fmt(item);
      tr.cells[6].className='num cup-item-sale';
      setDiffCell(tr.cells[8],item-bom);
      setDiffCell(tr.cells[9],stock===null?null:item-stock);
    }
    const kpi=document.querySelector('#cupItemSale');
    if(kpi)kpi.textContent=fmt(snap.total)+' ใบ';
    let note=document.querySelector('#cupItemSaleMapNote');
    const host=document.querySelector('#cupUsageCard .cup-note');
    if(host&&!note){note=document.createElement('div');note.id='cupItemSaleMapNote';note.className='subtle cup-item-map-note';host.insertAdjacentElement('afterend',note)}
    if(note){
      note.innerHTML=snap.unmapped>0
        ?`Item Sale รวม <b>${fmt(snap.total)} ใบ</b> • Mapping เข้า RM แล้ว <b>${fmt(snap.mapped)} ใบ</b> • <span class="warn">ยังไม่ Mapping RM ${fmt(snap.unmapped)} ใบ</span>`
        :`Item Sale รวม <b>${fmt(snap.total)} ใบ</b> • ใช้ฐานเดียวกับหน้า “จำนวนแก้วจาก Item Sale”`;
    }
  }

  function fixDailyCupAverage(){
    const badge=document.querySelector('#cupDaysBadge');
    const days=parseNum(badge?.textContent);
    if(!days)return;
    document.querySelectorAll('#cupBars .cup-bar-row:not(.cup-grand-total)').forEach(row=>{
      const total=parseNum(row.querySelector('strong')?.textContent),avg=row.querySelector('em');
      if(avg)avg.textContent=fmt0(total/days);
    });
  }

  function renderCupGrandTotal(){
    const bars=document.querySelector('#cupBars');
    if(!bars)return;
    bars.querySelector('.cup-grand-total')?.remove();
    const regular=[...bars.querySelectorAll('.cup-bar-row:not(.cup-grand-total)')];
    if(!regular.length)return;
    const total=parseNum(document.querySelector('#cupTotal')?.textContent);
    const days=parseNum(document.querySelector('#cupDaysBadge')?.textContent);
    const row=document.createElement('div');
    row.className='cup-bar-row cup-grand-total';
    row.innerHTML=`<b>รวมทั้งหมด</b><div><i style="width:100%"></i></div><strong>${fmt0(total)}</strong><em>${fmt0(days?total/days:0)}</em>`;
    bars.appendChild(row);
  }

  function applyFixes(){
    fixCupUsageItemSale();
    fixDailyCupAverage();
    renderCupGrandTotal();
  }

  const css=document.createElement('style');
  css.textContent=`
  #cups .cup-summary-wrap table{width:100%!important;min-width:0!important;table-layout:fixed!important}
  #cups .cup-summary-wrap th,#cups .cup-summary-wrap td{position:static!important;left:auto!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important}
  #cups .cup-summary-wrap th:nth-child(1),#cups .cup-summary-wrap td:nth-child(1){width:58%!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;padding-right:16px!important}
  #cups .cup-summary-wrap th:nth-child(2),#cups .cup-summary-wrap td:nth-child(2){width:22%!important;text-align:right!important;white-space:nowrap!important;padding-left:12px!important;padding-right:12px!important}
  #cups .cup-summary-wrap th:nth-child(3),#cups .cup-summary-wrap td:nth-child(3){width:20%!important;text-align:right!important;white-space:nowrap!important;padding-left:12px!important}
  #cups .cup-summary-wrap td:nth-child(2) b{display:block!important;text-align:right!important}
  #cups .cup-bar-row em{font-variant-numeric:tabular-nums}
  #cups .cup-grand-total{margin-top:9px;padding-top:11px!important;border-top:2px solid #b9ddc7!important;background:#edf8f1!important;border-radius:12px;padding-left:9px!important;padding-right:9px!important;font-weight:900}
  #cups .cup-grand-total>b,#cups .cup-grand-total>strong,#cups .cup-grand-total>em{font-weight:950!important;color:#126c3e!important}
  #cups .cup-grand-total>div{background:#d8ece0!important}
  #cups .cup-grand-total>div>i{background:linear-gradient(90deg,#238a55,#75c996)!important}
  .cup-item-map-note{margin-top:6px;padding:7px 10px;border-radius:10px;background:#f5faf7;color:#4f6f5c}
  .cup-item-map-note .warn{color:#9a5b00;font-weight:800}
  @media(max-width:640px){#cups .cup-summary-wrap th:nth-child(1),#cups .cup-summary-wrap td:nth-child(1){width:52%!important}#cups .cup-summary-wrap th:nth-child(2),#cups .cup-summary-wrap td:nth-child(2){width:26%!important}#cups .cup-summary-wrap th:nth-child(3),#cups .cup-summary-wrap td:nth-child(3){width:22%!important}}
  `;
  document.head.appendChild(css);

  try{
    const previous=render;
    render=function(){const out=previous.apply(this,arguments);requestAnimationFrame(applyFixes);return out};
  }catch(e){console.warn('v3.23 render hook',e)}

  document.addEventListener('kamu:data-ready',()=>setTimeout(applyFixes,60));
  document.addEventListener('change',e=>{const id=e.target?.id||'';if(id==='branch'||id==='date'||id.startsWith('cup'))setTimeout(applyFixes,60)},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('.tab[data-p="cups"],.tab[data-p="dashboard"]'))setTimeout(applyFixes,120)},true);

  const oldVersion=document.querySelector('.version');
  if(oldVersion){const fresh=oldVersion.cloneNode(false);fresh.textContent='Version 3.23 • Public Multi‑User Cloud';oldVersion.replaceWith(fresh)}
  setTimeout(applyFixes,120);setTimeout(applyFixes,700);setTimeout(applyFixes,1800);
})();
