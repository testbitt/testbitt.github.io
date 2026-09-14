/* Version 3.12 — Cup Usage with explicit Item Sale to RM mapping */
(()=>{
  const escCup=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  function recipeComponentDesc(r){
    const vals=[];
    for(const k of Object.keys(r||{})){
      const nk=K(k);
      if(nk==='itemdes1'||nk.startsWith('itemdes1')) vals.push(T(r[k]));
    }
    return vals.length>1?vals[vals.length-1]:(vals[0]||'');
  }
  function cupMaster(){
    const m=new Map(),allStock=new Map();
    for(const r of S.stock||[]){
      const code=T(V(r,'rm')),desc=T(V(r,'rmd')),unit=T(V(r,'stocku'))||T(V(r,'stockuc'));
      if(code&&!allStock.has(code))allStock.set(code,{code,desc,unit});
      if(code&&/^แก้ว/i.test(desc)&&(!m.has(code)||!m.get(code).desc))m.set(code,{code,desc,unit});
    }
    for(const r of S.recipe||[]){
      const code=T(V(r,'comp')),desc=recipeComponentDesc(r),unit=T(V(r,'unit'));
      if(code&&/^แก้ว/i.test(desc)){
        const old=m.get(code)||{};
        m.set(code,{code,desc:old.desc||desc,unit:old.unit||unit});
      }
    }
    for(const x of Array.isArray(S.cupMapping)?S.cupMapping:[]){const code=T(x.usage_rm_code).toUpperCase(),p=allStock.get(code);if(code&&p&&!m.has(code))m.set(code,p)}
    return m;
  }
  function cupType(desc){
    const d=T(desc);
    if(/กระดาษ.*ร้อน|ร้อน.*กระดาษ|hot/i.test(d))return'แก้วร้อน';
    if(/กระดาษ/i.test(d))return'แก้วกระดาษ';
    if(/reusable/i.test(d))return'Reusable';
    if(/pet/i.test(d))return'PET';
    if(/pp\s*(?:hs\s*)?slim|hs\s*slim/i.test(d))return'PP Slim';
    if(/pp/i.test(d))return'PP';
    if(/คามุ|kamu/i.test(d))return'KAMU';
    return'แก้ว';
  }
  function cupSize(desc){const m=T(desc).match(/(\d+(?:\.\d+)?)\s*(?:oz\.?|ออนซ์)/i);return m?`${m[1]} oz`:'-'}
  function mappedCupSales(sales){const itemToRm=new Map(),targets=new Set(),byRm=new Map();for(const x of Array.isArray(S.cupMapping)?S.cupMapping:[]){const item=T(x.item_code).toUpperCase(),rm=T(x.usage_rm_code).toUpperCase();if(item&&rm&&x.count_as_cup!==false){itemToRm.set(item,rm);targets.add(rm)}}for(const [item,qty] of sales||[]){const rm=itemToRm.get(T(item).toUpperCase());if(rm)byRm.set(rm,(byRm.get(rm)||0)+qty)}return{targets,byRm}}
  function cupRows(){
    const branch=$('#branch')?.value||'',date=$('#date')?.value||'',master=cupMaster(),sales=date?IDX.salesByDate.get(branch+'\u0001'+date):IDX.salesAll.get(branch);
    const agg=new Map(),mapped=mappedCupSales(sales);
    if(!branch||!sales)return[];
    const add=(code,expected,sold)=>{if(!master.has(code))return;let x=agg.get(code);if(!x){const p=master.get(code);x={code,desc:p.desc||'',unit:p.unit||'ใบ',expected:0,relatedSales:0};agg.set(code,x)}x.expected+=expected;x.relatedSales+=sold};
    for(const [item,qty] of sales){
      const rec=IDX.recipeByRec.get(item)||[],soldOnce=new Set();
      for(const r of rec){
        const c=T(V(r,'comp')),q=N(V(r,'compq'));if(!c||!q)continue;
        if(c.startsWith('WP-')){
          for(const p of wipUnitParts(c))if(master.has(p.code)&&p.qty*q){add(p.code,qty*p.qty*q,soldOnce.has(p.code)?0:qty);soldOnce.add(p.code)}
        }else if(master.has(c)){add(c,qty*q,soldOnce.has(c)?0:qty);soldOnce.add(c)}
      }
    }
    for(const code of mapped.targets){if(!master.has(code)||agg.has(code))continue;const p=master.get(code);agg.set(code,{code,desc:p.desc||'',unit:p.unit||'ใบ',expected:0,relatedSales:0})}
    const analysis=new Map((S.analysis||[]).map(x=>[x.rm,x]));
    return [...agg.values()].map(x=>{const a=analysis.get(x.code),movement=a?N(a.mov):null,itemSale=mapped.targets.has(x.code)?(mapped.byRm.get(x.code)||0):x.relatedSales,bomVsMovement=movement===null?null:movement-x.expected,bomVsItem=itemSale-x.expected,movementVsItem=movement===null?null:itemSale-movement;return {...x,type:cupType(x.desc),size:cupSize(x.desc),movement,itemSale,bomVsMovement,bomVsItem,movementVsItem}}).sort((a,b)=>{const na=parseFloat(a.size)||999,nb=parseFloat(b.size)||999;return na-nb||a.type.localeCompare(b.type,'th')||a.code.localeCompare(b.code,'en',{numeric:true});});
  }
  function ensureCupSection(){
    if($('#cupUsageCard'))return;
    const audit=$('#tbl')?.closest('.card');if(!audit)return;
    const card=document.createElement('div');card.className='card';card.id='cupUsageCard';
    card.innerHTML=`<div class="section-head"><div class="section-title"><div class="icon">🥤</div><div><h3>Cup Usage • เปรียบเทียบยอดใช้ 3 แหล่ง</h3><div class="subtle">เปรียบเทียบข้อมูลจาก BOM, Stock Movement และ Item Sale Mapping ตามสาขาและวันที่ที่เลือก</div></div></div><div class="cup-actions"><button class="btn alt small" id="cupCsv" type="button">⬇️ CSV</button><button class="btn alt small" id="cupExcel" type="button">📗 Excel</button></div></div><div class="cup-kpis cup-kpis-compare"><div class="cup-kpi neutral">ประเภทแก้ว<b id="cupTypes">0</b></div><div class="cup-kpi source-bom"><span>1</span> ข้อมูลจาก BOM<b id="cupExpected">0 ใบ</b></div><div class="cup-kpi source-stock"><span>2</span> ข้อมูลจาก Stock Movement<b id="cupMovement">0 ใบ</b></div><div class="cup-kpi source-item"><span>3</span> ข้อมูลจาก Item Sale<b id="cupItemSale">0 ใบ</b></div></div><div class="cup-compare-legend"><span class="bom">BOM = Item Sale × สูตร</span><span class="stock">Stock Movement = Sales Usage</span><span class="item">Item Sale = Total Qty ตามสินค้า/RM ที่ Admin Mapping</span></div><div class="tablewrap cup-tablewrap"><table id="cupTbl"><thead><tr><th rowspan="2">RM Code</th><th rowspan="2">ประเภทแก้ว</th><th rowspan="2">ขนาด</th><th rowspan="2">รายละเอียด</th><th colspan="3" class="cup-source-group">ยอดใช้ (ใบ)</th><th colspan="3" class="cup-diff-group">ผลต่าง (ใบ)</th></tr><tr><th class="th-bom">BOM</th><th class="th-stock">Stock Movement</th><th class="th-item">Item Sale</th><th>Stock − BOM</th><th>Item Sale − BOM</th><th>Item Sale − Stock</th></tr></thead><tbody></tbody></table></div><div class="subtle cup-note">* ค่าบวกหมายถึงแหล่งข้อมูลด้านซ้ายมียอดมากกว่า • Item Sale ใช้ Mapping ใหม่เมื่อกำหนด RM แล้ว • อ้างอิง Filter สาขา + วันที่</div>`;
    audit.parentNode.insertBefore(card,audit);
    $('#cupCsv').onclick=downloadCupCsv;$('#cupExcel').onclick=downloadCupExcel;
  }
  function renderCupUsage(){
    ensureCupSection();const rows=cupRows(),tb=$('#cupTbl tbody');if(!tb)return;
    const diffClass=v=>v===null?'':Math.abs(v)<.0005?'ok':v>0?'warn':'bad';
    tb.innerHTML=rows.length?rows.map(x=>`<tr><td><b>${escCup(x.code)}</b></td><td>${escCup(x.type)}</td><td>${escCup(x.size)}</td><td class="cup-desc">${escCup(x.desc)}</td><td class="num cup-expected">${F(x.expected)}</td><td class="num cup-stock">${x.movement===null?'—':F(x.movement)}</td><td class="num cup-item-sale">${F(x.itemSale)}</td><td class="num ${diffClass(x.bomVsMovement)}">${x.bomVsMovement===null?'—':F(x.bomVsMovement)}</td><td class="num ${diffClass(x.bomVsItem)}">${F(x.bomVsItem)}</td><td class="num ${diffClass(x.movementVsItem)}">${x.movementVsItem===null?'—':F(x.movementVsItem)}</td></tr>`).join(''):'<tr><td colspan="10" class="cup-empty">ไม่พบรายการแก้วสำหรับสาขา/วันที่ที่เลือก</td></tr>';
    const exp=rows.reduce((s,x)=>s+x.expected,0),mov=rows.reduce((s,x)=>s+(x.movement??0),0),item=rows.reduce((s,x)=>s+x.itemSale,0),hasMov=rows.some(x=>x.movement!==null);
    $('#cupTypes').textContent=rows.length.toLocaleString('th-TH');$('#cupExpected').textContent=F(exp)+' ใบ';$('#cupMovement').textContent=hasMov?F(mov)+' ใบ':'—';$('#cupItemSale').textContent=F(item)+' ใบ';
  }
  function cupMeta(){const b=$('#branch'),branch=b?.selectedOptions?.[0]?.textContent||'-';return {branch,date:$('#date')?.value||'ทั้งหมด'}}
  function cupExportRows(){return cupRows().map(x=>[x.code,x.type,x.size,x.desc,x.expected,x.movement??'',x.itemSale,x.bomVsMovement??'',x.bomVsItem,x.movementVsItem??''])}
  function cupFileBase(){const b=$('#branch')?.value||'ALL',d=$('#date')?.value||'ALL_DATE';return`KAMU_Cup_Usage_${b}_${d}`}
  function downloadCupCsv(){const head=['RM Code','ประเภทแก้ว','ขนาด','รายละเอียด','BOM (ใบ)','Stock Movement (ใบ)','Item Sale (ใบ)','Stock - BOM','Item Sale - BOM','Item Sale - Stock'],lines=[head.map(escCsv).join(',')].concat(cupExportRows().map(r=>r.map(escCsv).join(','))),a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}));a.download=cupFileBase()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),100)}
  function downloadCupExcel(){if(!window.XLSX){alert('ตัวสร้าง Excel ยังโหลดไม่สำเร็จ กรุณา Refresh แล้วลองใหม่');return}const m=cupMeta(),head=['RM Code','ประเภทแก้ว','ขนาด','รายละเอียด','BOM (ใบ)','Stock Movement (ใบ)','Item Sale (ใบ)','Stock - BOM','Item Sale - BOM','Item Sale - Stock'],aoa=[['KAMU Cup Usage — 3 Source Comparison'],['Branch',m.branch],['Item Sale Date',m.date],[],head,...cupExportRows()],ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[14,16,10,44,16,22,16,16,18,20].map(wch=>({wch}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Cup Usage Compare');XLSX.writeFile(wb,cupFileBase()+'.xlsx')}
  const st=document.createElement('style');st.textContent=`.cup-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:8px 0 10px}.cup-kpi{padding:12px 14px;border:1px solid #d5eadc;border-radius:14px;background:#f7fdf9;color:#658071;font-size:11px}.cup-kpi b{display:block;margin-top:4px;font-size:20px;color:#17653e}.cup-kpi>span{display:inline-grid;place-items:center;width:20px;height:20px;margin-right:5px;border-radius:7px;font-weight:900}.cup-kpi.source-bom{background:#edf8f1;border-color:#baddc6}.cup-kpi.source-bom>span{background:#cfead8;color:#17653e}.cup-kpi.source-stock{background:#eef5ff;border-color:#c8daf4}.cup-kpi.source-stock>span{background:#d4e3f8;color:#285d9a}.cup-kpi.source-stock b{color:#285d9a}.cup-kpi.source-item{background:#fff7e8;border-color:#f1ddb4}.cup-kpi.source-item>span{background:#f9e4bb;color:#8a5b00}.cup-kpi.source-item b{color:#8a5b00}.cup-compare-legend{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 11px}.cup-compare-legend span{padding:5px 9px;border-radius:999px;font-size:10px;font-weight:800}.cup-compare-legend .bom{background:#edf8f1;color:#17653e}.cup-compare-legend .stock{background:#eef5ff;color:#285d9a}.cup-compare-legend .item{background:#fff7e8;color:#8a5b00}.cup-actions{display:flex;gap:7px;flex-wrap:wrap}.cup-tablewrap{max-height:48vh}.cup-tablewrap table{min-width:1220px}.cup-tablewrap thead tr:first-child th{border-bottom:1px solid #cfe2d5}.cup-source-group{text-align:center!important;background:#eaf6ee!important}.cup-diff-group{text-align:center!important;background:#f4f6f5!important}.th-bom{background:#edf8f1!important}.th-stock{background:#eef5ff!important}.th-item{background:#fff7e8!important}.cup-desc{max-width:320px;white-space:normal;line-height:1.25}.cup-expected{font-weight:900;color:#17653e;background:#fbfefc}.cup-stock{font-weight:850;color:#285d9a;background:#fbfdff}.cup-item-sale{font-weight:850;color:#8a5b00;background:#fffdf9}.cup-empty{text-align:center;color:#658071;padding:20px}.cup-note{margin-top:8px}@media(max-width:900px){.cup-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.cup-kpis{grid-template-columns:1fr 1fr}.cup-kpi{padding:10px}.cup-kpi b{font-size:17px}.cup-actions{width:100%}.cup-actions .btn{flex:1}.cup-tablewrap{max-height:52vh}}`;document.head.appendChild(st);
  const renderBeforeCup=render;render=function(){renderBeforeCup();renderCupUsage()};
  const ver=document.querySelector('.version');if(ver)ver.textContent='Version 2.4 • Cup Usage';
  ensureCupSection();renderCupUsage();
})();
