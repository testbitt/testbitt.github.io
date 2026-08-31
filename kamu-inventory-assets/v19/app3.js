function compute(){
 const b=$('#branch').value,d=$('#date').value;if(!b){S.analysis=[];S.needs=[];S.currentExpected=new Map();render();renderRMFilter();return}
 setCalcStatus('กำลังคำนวณ...');
 requestAnimationFrame(()=>{
  const exp=expected(b,d),mov=IDX.stockByBranch.get(b)||[],out=[],needs=[],groups=new Map();
  for(const r of mov){const rm=T(V(r,'rm'));if(!rm)continue;if(!groups.has(rm))groups.set(rm,[]);groups.get(rm).push(r)}
  for(const [rm,rs] of groups){
   const r=rs[0],sum=n=>rs.reduce((z,x)=>z+N(V(x,n)),0),firstText=n=>{for(const x of rs){const v=T(V(x,n));if(v)return v}return''};
   const desc=firstText('rmd'),su=firstText('stocku'),stockuc=firstText('stockuc'),units=exp.get(rm),bomUnits=units?[...units.entries()]:[];
   let bomConverted=0,convertedParts=0,missing=[];
   for(const [bu,q] of bomUnits){const fac=convFactor(rm,bu,su,desc)||convFactor(rm,bu,stockuc,desc);if(!fac){missing.push({rm,bu,su,desc,raw:q});needs.push({rm,bu,su,desc,raw:q})}else{bomConverted+=q/fac;convertedParts++}}
   const need=missing.length>0,hasBom=bomUnits.length>0,bom=hasBom&&!need?bomConverted:null,bomRaw=rawBomText(bomUnits);
   const bf=sum('bf'),gr=sum('gr'),tin=sum('tin'),wipin=sum('wipin'),adjin=sum('adjin'),rtv=sum('rtv'),tout=sum('tout'),wipout=sum('wipout'),damage=sum('damage'),adjout=sum('adjout'),movSales=sum('sales'),waste=sum('waste'),reportTheory=sum('theory'),reportActual=sum('actual');
   const calc=need?null:bf+gr+tin+wipin+adjin-rtv-tout-wipout-damage-adjout-(bom||0)-waste;
   const cv=localStorage.getItem(countsKey(b,rm)),count=cv===null?null:Number(cv),diff=count===null||calc===null?null:count-calc,status=need?'Needs conversion':count===null?'Not counted':Math.abs(diff)<0.0005?'OK':diff<0?'Short':'Over';
   const cost=rs.map(x=>N(V(x,'cost'))).find(v=>v!==0)||N(V(r,'cost'));
   out.push({rm,desc,unit:su,bf,gr,tin,wipin,adjin,rtv,tout,wipout,damage,adjout,bom,bomRaw,hasBom,missingConv:missing.length,mov:movSales,uv:bom===null?null:movSales-bom,waste,calc,reportTheory,reportActual,count,diff,diffp:diff===null||calc===null||Math.abs(calc)<1e-9?null:diff/calc*100,cost,vc:diff===null?0:diff*cost,status,sourceRows:rs.length});
  }
  S.analysis=out;S.needs=needs;S.currentExpected=exp;syncActiveCustomCheck(out);renderRMFilter(true);render();recon();renderCustomChecks();setCalcStatus(`พร้อม • ${out.length.toLocaleString()} RM`);
 });
}
function setCalcStatus(text){const el=$('#calcStatus');if(el)el.textContent=text}
let selectedRM=new Set();
function branchMaster(){const names=new Map();for(const r of S.item){const c=T(V(r,'wh')),n=T(V(r,'whn'));if(c&&n&&!names.has(c))names.set(c,n)}const m=new Map();const src=S.stock.length?S.stock:S.item;for(const r of src){const code=T(V(r,'wh')),name=names.get(code)||T(V(r,'whn'))||'';if(!code||code==='รหัสคลังสินค้า'||code==='รหัสสาขา')continue;if(!m.has(code)||(!m.get(code)&&name))m.set(code,name)}return [...m.entries()].map(([code,name])=>({code,name})).sort((a,b)=>a.code.localeCompare(b.code,'en',{numeric:true}))}
function refresh(){
 const sel=$('#branch'),previous=sel.value,branches=branchMaster();
 if(!branches.length)sel.innerHTML='<option value="">ยังไม่มีรายการสาขา — กรุณา Upload Stock Movement หรือ Item Sale</option>';
 else{sel.innerHTML=branches.map(x=>`<option value="${x.code}">${x.code}${x.name?' - '+x.name:''}</option>`).join('');if(previous&&branches.some(x=>x.code===previous))sel.value=previous;else sel.value=branches[0].code}
 const dates=[...new Set(S.item.map(r=>T(V(r,'date'))).filter(x=>x&&x!=='วันที่'))];$('#date').innerHTML='<option value="">ทั้งหมด</option>'+dates.map(x=>`<option value="${x}">${x}</option>`).join('');
 $('#mStock').textContent=S.stock.length?`${S.meta.stock||''} • ${S.stock.length.toLocaleString()} rows • ${new Set(S.stock.map(r=>T(V(r,'wh'))).filter(Boolean)).size.toLocaleString()} สาขา • Stock Date ${S.stockDate||'-'}`:'ยังไม่มีข้อมูล';
 $('#mItem').textContent=S.item.length?`${S.meta.item||''} • ${S.item.length.toLocaleString()} rows • ${new Set(S.item.map(r=>T(V(r,'wh'))).filter(Boolean)).size.toLocaleString()} สาขา`:'ยังไม่มีข้อมูล';
 $('#mBom').textContent=S.recipe.length?`${S.meta.bom||''} • Recipe ${S.recipe.length.toLocaleString()} • WIP ${S.wip.length.toLocaleString()}`:'ยังไม่มีข้อมูล';
}
function rmChoices(){const m=new Map();for(const x of S.analysis){if(!x.rm)continue;if(!m.has(x.rm)||(!m.get(x.rm)&&x.desc))m.set(x.rm,x.desc||'')}return [...m.entries()].map(([code,name])=>({code,name})).sort((a,b)=>a.code.localeCompare(b.code,'en',{numeric:true}))}
function renderRMFilter(preserve=true){const choices=rmChoices(),valid=new Set(choices.map(x=>x.code));if(preserve)selectedRM=new Set([...selectedRM].filter(x=>valid.has(x)));else selectedRM.clear();const btn=$('#rmFilterBtn');if(btn)btn.textContent=selectedRM.size?`เลือก ${selectedRM.size} รายการ`:`ทั้งหมด (${choices.length})`;renderRMOptions();renderCustomChecks()}
function renderRMOptions(){const box=$('#rmOptions');if(!box)return;const q=K($('#rmSearch')?.value||''),choices=rmChoices().filter(x=>!q||K(x.code+' '+x.name).includes(q));box.innerHTML=choices.length?choices.map(x=>`<label class="rm-option"><input type="checkbox" value="${x.code}" ${selectedRM.has(x.code)?'checked':''}><span><b>${x.code}</b>${x.name?`<small>${x.name}</small>`:''}</span></label>`).join(''):'<div class="rm-empty">ไม่พบรายการ RM</div>';box.querySelectorAll('input[type=checkbox]').forEach(ch=>ch.onchange=()=>{if(ch.checked)selectedRM.add(ch.value);else selectedRM.delete(ch.value);markCustomDirty();renderRMFilter(true);render()})}
function toggleRMPopup(force){const p=$('#rmPopup');if(!p)return;const show=force!==undefined?force:p.hidden;p.hidden=!show;if(show){$('#rmSearch').value='';renderRMOptions();setTimeout(()=>$('#rmSearch').focus(),0)}}