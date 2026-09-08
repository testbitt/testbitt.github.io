/* Version 2.4 — Cup Usage by Item Sale + BOM */
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
    const m=new Map();
    for(const r of S.stock||[]){
      const code=T(V(r,'rm')),desc=T(V(r,'rmd')),unit=T(V(r,'stocku'))||T(V(r,'stockuc'));
      if(code&&/^แก้ว/i.test(desc)&&(!m.has(code)||!m.get(code).desc))m.set(code,{code,desc,unit});
    }
    for(const r of S.recipe||[]){
      const code=T(V(r,'comp')),desc=recipeComponentDesc(r),unit=T(V(r,'unit'));
      if(code&&/^แก้ว/i.test(desc)){
        const old=m.get(code)||{};
        m.set(code,{code,desc:old.desc||desc,unit:old.unit||unit});
      }
    }
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
  function cupRows(){
    const branch=$('#branch')?.value||'',date=$('#date')?.value||'',master=cupMaster(),sales=date?IDX.salesByDate.get(branch+'\u0001'+date):IDX.salesAll.get(branch);
    const agg=new Map();
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
    const analysis=new Map((S.analysis||[]).map(x=>[x.rm,x]));
    return [...agg.values()].map(x=>{const a=analysis.get(x.code),movement=a?N(a.mov):null,variance=movement===null?null:movement-x.expected;return {...x,type:cupType(x.desc),size:cupSize(x.desc),movement,variance}}).sort((a,b)=>{const na=parseFloat(a.size)||999,nb=parseFloat(b.size)||999;return na-nb||a.type.localeCompare(b.type,'th')||a.code.localeCompare(b.code,'en',{numeric:true});});
  }
  function ensureCupSection(){
    if($('#cupUsageCard'))return;
    const audit=$('#tbl')?.closest('.card');if(!audit)return;
    const card=document.createElement('div');card.className='card';card.id='cupUsageCard';
    card.innerHTML=`<div class="section-head"><div class="section-title"><div class="icon">🥤</div><div><h3>Cup Usage</h3><div class="subtle">คำนวณจำนวนแก้วจาก Item Sale × BOM ตามสาขาและวันที่ที่เลือก</div></div></div><div class="cup-actions"><button class="btn alt small" id="cupCsv" type="button">⬇️ CSV</button><button class="btn alt small" id="cupExcel" type="button">📗 Excel</button></div></div><div class="cup-kpis"><div class="cup-kpi">ประเภทแก้ว<b id="cupTypes">0</b></div><div class="cup-kpi">ควรใช้จาก BOM<b id="cupExpected">0 ใบ</b></div><div class="cup-kpi">Sales Usage<b id="cupMovement">0 ใบ</b></div><div class="cup-kpi">ส่วนต่าง<b id="cupVariance">0 ใบ</b></div></div><div class="tablewrap cup-tablewrap"><table id="cupTbl"><thead><tr><th>RM Code</th><th>ประเภทแก้ว</th><th>ขนาด</th><th>รายละเอียด</th><th>ยอดขายที่เกี่ยวข้อง</th><th>ควรใช้จาก BOM (ใบ)</th><th>Stock Sales Usage (ใบ)</th><th>ส่วนต่าง (ใบ)</th></tr></thead><tbody></tbody></table></div><div class="subtle cup-note">* Cup Usage อ้างอิง Filter สาขา + วันที่ Item Sale และไม่รับผลจาก RM Filter / Custom Check</div>`;
    audit.parentNode.insertBefore(card,audit);
    $('#cupCsv').onclick=downloadCupCsv;$('#cupExcel').onclick=downloadCupExcel;
  }
  function renderCupUsage(){
    ensureCupSection();const rows=cupRows(),tb=$('#cupTbl tbody');if(!tb)return;
    tb.innerHTML=rows.length?rows.map(x=>`<tr><td><b>${escCup(x.code)}</b></td><td>${escCup(x.type)}</td><td>${escCup(x.size)}</td><td class="cup-desc">${escCup(x.desc)}</td><td class="num">${F(x.relatedSales)}</td><td class="num cup-expected">${F(x.expected)}</td><td class="num">${x.movement===null?'—':F(x.movement)}</td><td class="num ${x.variance===null?'':Math.abs(x.variance)<.0005?'ok':x.variance>0?'warn':'bad'}">${x.variance===null?'—':F(x.variance)}</td></tr>`).join(''):'<tr><td colspan="8" class="cup-empty">ไม่พบรายการแก้วจาก Item Sale + BOM ของสาขา/วันที่ที่เลือก</td></tr>';
    const exp=rows.reduce((s,x)=>s+x.expected,0),mov=rows.reduce((s,x)=>s+(x.movement??0),0),hasMov=rows.some(x=>x.movement!==null),vari=hasMov?rows.reduce((s,x)=>s+(x.variance??0),0):0;
    $('#cupTypes').textContent=rows.length.toLocaleString('th-TH');$('#cupExpected').textContent=F(exp)+' ใบ';$('#cupMovement').textContent=hasMov?F(mov)+' ใบ':'—';$('#cupVariance').textContent=hasMov?F(vari)+' ใบ':'—';
  }
  function cupMeta(){const b=$('#branch'),branch=b?.selectedOptions?.[0]?.textContent||'-';return {branch,date:$('#date')?.value||'ทั้งหมด'}}
  function cupExportRows(){return cupRows().map(x=>[x.code,x.type,x.size,x.desc,x.relatedSales,x.expected,x.movement??'',x.variance??''])}
  function cupFileBase(){const b=$('#branch')?.value||'ALL',d=$('#date')?.value||'ALL_DATE';return`KAMU_Cup_Usage_${b}_${d}`}
  function downloadCupCsv(){const head=['RM Code','ประเภทแก้ว','ขนาด','รายละเอียด','ยอดขายที่เกี่ยวข้อง','ควรใช้จาก BOM (ใบ)','Stock Sales Usage (ใบ)','ส่วนต่าง (ใบ)'],lines=[head.map(escCsv).join(',')].concat(cupExportRows().map(r=>r.map(escCsv).join(','))),a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}));a.download=cupFileBase()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),100)}
  function downloadCupExcel(){if(!window.XLSX){alert('ตัวสร้าง Excel ยังโหลดไม่สำเร็จ กรุณา Refresh แล้วลองใหม่');return}const m=cupMeta(),head=['RM Code','ประเภทแก้ว','ขนาด','รายละเอียด','ยอดขายที่เกี่ยวข้อง','ควรใช้จาก BOM (ใบ)','Stock Sales Usage (ใบ)','ส่วนต่าง (ใบ)'],aoa=[['KAMU Cup Usage'],['Branch',m.branch],['Item Sale Date',m.date],[],head,...cupExportRows()],ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[14,16,10,48,18,20,22,16].map(wch=>({wch}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Cup Usage');XLSX.writeFile(wb,cupFileBase()+'.xlsx')}
  const st=document.createElement('style');st.textContent=`.cup-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:8px 0 12px}.cup-kpi{padding:11px 13px;border:1px solid #d5eadc;border-radius:14px;background:#f7fdf9;color:#658071;font-size:11px}.cup-kpi b{display:block;margin-top:3px;font-size:20px;color:#17653e}.cup-actions{display:flex;gap:7px;flex-wrap:wrap}.cup-tablewrap{max-height:44vh}.cup-desc{max-width:360px;white-space:normal;line-height:1.25}.cup-expected{font-weight:900;color:#17653e}.cup-empty{text-align:center;color:#658071;padding:20px}.cup-note{margin-top:8px}@media(max-width:900px){.cup-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.cup-kpis{grid-template-columns:1fr 1fr}.cup-kpi b{font-size:17px}.cup-actions{width:100%}.cup-actions .btn{flex:1}.cup-tablewrap{max-height:48vh}}`;document.head.appendChild(st);
  const renderBeforeCup=render;render=function(){renderBeforeCup();renderCupUsage()};
  const ver=document.querySelector('.version');if(ver)ver.textContent='Version 2.4 • Cup Usage';
  ensureCupSection();renderCupUsage();
})();
