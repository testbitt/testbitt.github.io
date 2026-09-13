/* KSL V6.3 — Online Expiry Audit history, edit/view and PDF/JPG export */
(() => {
  'use strict';
  if (window.__KSL_EXPIRY_HISTORY_V635__) return;
  window.__KSL_EXPIRY_HISTORY_V635__ = true;

  const HISTORY_KEY = 'KSL_EXPIRY_HISTORY_V635';
  const PAGE_ID = 'expiryAudit';
  let history = [];
  let editingId = '';
  let installTimer = 0;

  const txt = v => String(v ?? '').trim();
  const esc = v => txt(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone = v => JSON.parse(JSON.stringify(v));
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function getState(){ try { if (typeof appState !== 'undefined' && appState) return appState; } catch(_){} return window.appState || null; }
  function toastMsg(msg,type=''){ try{ if(typeof toast==='function') return toast(msg,type); }catch(_){} alert(msg); }
  function nowLocalInput(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); }
  function formatThai(v){ if(!v)return '-'; const d=new Date(v); if(Number.isNaN(d.getTime()))return '-'; try{return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(d)}catch(_){return d.toLocaleString('th-TH')} }
  function fileSafe(v){ return txt(v).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').slice(0,60) || 'KSL'; }
  function reportTime(v){ const d=new Date(v); if(Number.isNaN(d.getTime())) return 0; return d.getTime(); }
  function uid(){ return 'EA-'+new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)+'-'+Math.random().toString(36).slice(2,7); }

  function normalizeReport(r){
    if(!r || typeof r!=='object') return null;
    const rows=Array.isArray(r.rows)?r.rows.map(x=>({
      key:txt(x?.key), item:txt(x?.item), status:txt(x?.status), holding:txt(x?.holding),
      start:txt(x?.start), expiry:txt(x?.expiry), resultCode:txt(x?.resultCode)||'pending',
      resultLabel:txt(x?.resultLabel)||'รอตรวจ', reason:txt(x?.reason)
    })).filter(x=>x.item):[];
    return {
      id:txt(r.id)||uid(), branch:txt(r.branch), checkedAt:txt(r.checkedAt), rows,
      summary:summaryFromRows(rows), createdAt:txt(r.createdAt)||txt(r.updatedAt)||new Date().toISOString(),
      updatedAt:txt(r.updatedAt)||txt(r.createdAt)||new Date().toISOString()
    };
  }
  function normalizeHistory(v){ return (Array.isArray(v)?v:[]).map(normalizeReport).filter(Boolean); }
  function mergeHistory(...sets){
    const map=new Map();
    sets.flat().forEach(raw=>{
      const r=normalizeReport(raw); if(!r)return;
      const old=map.get(r.id);
      if(!old || reportTime(r.updatedAt)>=reportTime(old.updatedAt)) map.set(r.id,r);
    });
    return [...map.values()].sort((a,b)=>reportTime(b.checkedAt||b.updatedAt)-reportTime(a.checkedAt||a.updatedAt));
  }
  function summaryFromRows(rows){
    let pass=0,fail=0,manual=0,pending=0;
    (rows||[]).forEach(r=>{ const c=txt(r.resultCode); if(c==='pass')pass++; else if(c==='fail')fail++; else if(c==='manual')manual++; else pending++; });
    return {all:(rows||[]).length,pass,fail,manual,pending};
  }
  function loadLocal(){ try{return normalizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'))}catch(_){return[]} }
  function saveLocal(){ try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}catch(_){} }

  function pullOnline(){
    const s=getState();
    const online=normalizeHistory(s?.expiryAuditHistory);
    history=mergeHistory(history,loadLocal(),online);
    saveLocal();
    renderHistory();
    setOnlineStatus(online.length||s?.expiryAuditHistory ? 'online' : 'ready');
  }
  async function pushOnline(){
    history=mergeHistory(history,loadLocal());
    saveLocal();
    const s=getState();
    if(!s){ setOnlineStatus('local'); throw new Error('ยังไม่พบฐานข้อมูลกลาง'); }
    history=mergeHistory(history,normalizeHistory(s.expiryAuditHistory));
    s.expiryAuditHistory=clone(history);
    saveLocal();
    if(typeof dbSet!=='function'){ setOnlineStatus('local'); throw new Error('ยังไม่พบการเชื่อมต่อฐานข้อมูล Online'); }
    setOnlineStatus('syncing');
    await Promise.resolve(dbSet(s));
    setOnlineStatus('online');
    return true;
  }
  function setOnlineStatus(mode){
    const el=document.getElementById('eaHistoryOnline'); if(!el)return;
    const labels={online:'● ONLINE',syncing:'↻ กำลัง Sync...',local:'○ LOCAL / รอ Online',ready:'● ONLINE READY'};
    el.textContent=labels[mode]||labels.ready;
    el.dataset.mode=mode;
  }

  function codeOfResult(el){
    if(!el)return 'pending';
    if(el.classList.contains('pass'))return 'pass';
    if(el.classList.contains('fail'))return 'fail';
    if(el.classList.contains('manual'))return 'manual';
    return 'pending';
  }
  function captureRows(){
    return [...document.querySelectorAll(`#${PAGE_ID} #eaBody tr[data-key]`)]
      .filter(tr=>tr.style.display!=='none')
      .map(tr=>{
        const result=tr.querySelector('.ea-result');
        const expiry=tr.querySelector('.ea-manual-expiry-input') || [...tr.querySelectorAll('.ea-exp-input')].find(x=>!x.closest('td')?.style?.display?.includes('none')) || tr.querySelector('.ea-exp-input');
        return {
          key:txt(tr.dataset.key),
          item:txt(tr.querySelector('.ea-item')?.textContent),
          status:txt(tr.querySelector('.ea-status')?.textContent),
          holding:txt(tr.querySelector('.ea-holding')?.textContent),
          start:txt(tr.querySelector('.ea-start-input')?.value),
          expiry:txt(expiry?.value),
          resultCode:codeOfResult(result),
          resultLabel:txt(result?.textContent).replace(/^[✓✕!•]\s*/,'') || 'รอตรวจ',
          reason:txt(tr.querySelector('.ea-reason')?.textContent)
        };
      }).filter(r=>r.item);
  }
  function captureReport(){
    const branch=txt(document.getElementById('eaBranch')?.value);
    const checkedAt=txt(document.getElementById('eaCheckedAt')?.value);
    const rows=captureRows();
    const now=new Date().toISOString();
    const existing=editingId?history.find(r=>r.id===editingId):null;
    return {
      id:existing?.id||uid(), branch, checkedAt, rows, summary:summaryFromRows(rows),
      createdAt:existing?.createdAt||now, updatedAt:now
    };
  }

  async function saveReport(){
    const report=captureReport();
    if(!report.branch){toastMsg('กรุณากรอกชื่อสาขาก่อนบันทึก','warn');return;}
    if(!report.checkedAt){toastMsg('กรุณาระบุวันที่ตรวจก่อนบันทึก','warn');return;}
    if(!report.rows.length){toastMsg('กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ','warn');return;}
    const idx=history.findIndex(r=>r.id===report.id);
    if(idx>=0) history[idx]=report; else history.unshift(report);
    history=mergeHistory(history);
    editingId=report.id;
    renderHistory(); updateEditBanner();
    try{
      await pushOnline();
      toastMsg(idx>=0?'อัปเดตรายงานย้อนหลังและบันทึก Online แล้ว':'บันทึกรายงานผลตรวจ Online แล้ว','success');
    }catch(err){
      toastMsg('บันทึกไว้ในเครื่องแล้ว แต่ Sync Online ยังไม่สำเร็จ: '+(err?.message||err),'warn');
    }
  }

  function updateEditBanner(){
    const btn=document.getElementById('eaHistorySave');
    const note=document.getElementById('eaHistoryEditNote');
    const r=editingId?history.find(x=>x.id===editingId):null;
    if(btn) btn.textContent=r?'💾 บันทึกการแก้ไขรายงาน':'💾 บันทึกเป็นประวัติ';
    if(note) note.textContent=r?`กำลังแก้ไขรายงาน ${r.id} • ${r.branch} • ${formatThai(r.checkedAt)}`:'โหมดรายงานใหม่';
  }

  async function clearCurrentForNew(){
    editingId='';
    document.getElementById('eaClearSelected')?.click();
    const branch=document.getElementById('eaBranch'); if(branch){branch.value='';branch.dispatchEvent(new Event('input',{bubbles:true}));branch.dispatchEvent(new Event('change',{bubbles:true}));}
    const checked=document.getElementById('eaCheckedAt'); if(checked){checked.value=nowLocalInput();checked.dispatchEvent(new Event('change',{bubbles:true}));}
    document.querySelectorAll(`#${PAGE_ID} .ea-start-input, #${PAGE_ID} .ea-manual-expiry-input`).forEach(input=>{input.value='';input.dispatchEvent(new Event('change',{bubbles:true}));});
    updateEditBanner();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function findRow(snapshot){
    const rows=[...document.querySelectorAll(`#${PAGE_ID} #eaBody tr[data-key]`)];
    let tr=rows.find(x=>txt(x.dataset.key)===txt(snapshot.key));
    if(tr)return tr;
    return rows.find(x=>txt(x.querySelector('.ea-item')?.textContent)===snapshot.item && txt(x.querySelector('.ea-status')?.textContent)===snapshot.status && txt(x.querySelector('.ea-holding')?.textContent)===snapshot.holding) || null;
  }
  async function loadReport(id){
    const report=history.find(r=>r.id===id); if(!report)return;
    editingId=report.id;
    const branch=document.getElementById('eaBranch'); if(branch){branch.value=report.branch;branch.dispatchEvent(new Event('input',{bubbles:true}));branch.dispatchEvent(new Event('change',{bubbles:true}));}
    const checked=document.getElementById('eaCheckedAt'); if(checked){checked.value=report.checkedAt;checked.dispatchEvent(new Event('change',{bubbles:true}));}
    document.getElementById('eaClearSelected')?.click();
    await wait(80);
    for(const snap of report.rows){
      let tr=findRow(snap);
      const key=txt(tr?.dataset?.key)||txt(snap.key);
      const picker=document.getElementById('eaItemPicker');
      if(picker && key && [...picker.options].some(o=>o.value===key)){
        picker.value=key; picker.dispatchEvent(new Event('change',{bubbles:true})); await wait(12);
      }
    }
    await wait(140);
    for(const snap of report.rows){
      const tr=findRow(snap); if(!tr)continue;
      const start=tr.querySelector('.ea-start-input');
      if(start){start.value=snap.start||'';start.dispatchEvent(new Event('change',{bubbles:true}));}
      const expiry=tr.querySelector('.ea-manual-expiry-input');
      if(expiry){expiry.value=snap.expiry||'';expiry.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    await wait(100);
    updateEditBanner();
    window.scrollTo({top:0,behavior:'smooth'});
    toastMsg('เปิดรายงานย้อนหลังสำหรับแก้ไขแล้ว','success');
  }

  function resultText(code,label){ const map={pass:'ผ่าน',fail:'ไม่ผ่าน',manual:'ตรวจฉลาก',pending:'รอตรวจ'}; return txt(label)||map[code]||'รอตรวจ'; }
  function previewHtml(report){
    const s=summaryFromRows(report.rows);
    return `<div class="eah-preview-head"><div><h3>รายงานตรวจสอบวันหมดอายุ</h3><p>${esc(report.branch)} • ${esc(formatThai(report.checkedAt))}</p></div><span class="badge">${esc(report.id)}</span></div>
      <div class="eah-preview-sum"><span>ทั้งหมด <b>${s.all}</b></span><span class="pass">ผ่าน <b>${s.pass}</b></span><span class="fail">ไม่ผ่าน <b>${s.fail}</b></span><span>ตรวจฉลาก <b>${s.manual}</b></span></div>
      <div class="eah-preview-table"><table><thead><tr><th>#</th><th>วัตถุดิบ</th><th>ประเภท/สถานะ</th><th>Holding Time</th><th>เริ่มต้นวันหมดอายุ</th><th>วันหมดอายุ</th><th>ผลตรวจ</th></tr></thead><tbody>${report.rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.item)}</b></td><td>${esc(r.status||'-')}</td><td>${esc(r.holding||'-')}</td><td>${esc(formatThai(r.start))}</td><td>${esc(formatThai(r.expiry))}</td><td><b class="${esc(r.resultCode)}">${esc(resultText(r.resultCode,r.resultLabel))}</b>${r.reason?`<small>${esc(r.reason)}</small>`:''}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function openPreview(id){
    const report=history.find(r=>r.id===id); if(!report)return;
    ensureModal();
    const modal=document.getElementById('eaHistoryModal');
    modal.dataset.reportId=id;
    modal.querySelector('.eah-modal-body').innerHTML=previewHtml(report);
    modal.classList.add('open');
  }
  function ensureModal(){
    if(document.getElementById('eaHistoryModal'))return;
    const m=document.createElement('div');m.id='eaHistoryModal';m.className='eah-modal';m.innerHTML=`<div class="eah-modal-card"><div class="eah-modal-top"><b>ดูรายงานย้อนหลัง</b><button type="button" class="btn btn-outline" data-eah-close>✕ ปิด</button></div><div class="eah-modal-body"></div><div class="eah-modal-actions"><button type="button" class="btn btn-outline" data-eah-edit>✏️ แก้ไข</button><button type="button" class="btn btn-primary" data-eah-pdf>📄 PDF</button><button type="button" class="btn btn-outline" data-eah-jpg>🖼️ JPG</button></div></div>`;document.body.appendChild(m);
  }

  function reportHtml(report){
    const s=summaryFromRows(report.rows);
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>KSL Expiry Audit ${esc(report.id)}</title><style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{font-family:Tahoma,"Noto Sans Thai",Arial,sans-serif;margin:0;color:#173d30;font-size:8pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.head{display:flex;justify-content:space-between;border-bottom:2px solid #176e52;padding-bottom:4mm;margin-bottom:4mm}.brand{display:flex;gap:4mm;align-items:center}.logo{width:15mm;height:15mm;border-radius:4mm;background:#176e52;color:#fff;display:grid;place-items:center;font-size:14pt;font-weight:900}h1{font-size:17pt;margin:0}.sub{color:#6b8077;margin-top:1mm}.meta{text-align:right;line-height:1.6}.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:4mm}.sum div{border:1px solid #d8e8e0;border-radius:2mm;padding:2.5mm;text-align:center;background:#f8fcfa}.sum b{display:block;font-size:13pt}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th{background:#e9f6ef;color:#285a47;padding:2mm;border:1px solid #cbded5;text-align:left;font-size:7pt}td{padding:1.8mm;border:1px solid #dfe9e4;vertical-align:top;line-height:1.35}.pass{color:#11784d}.fail{color:#a33131}.manual{color:#8c6415}.pending{color:#708077}.foot{margin-top:3mm;color:#71847b;font-size:7pt}</style></head><body><div class="head"><div class="brand"><div class="logo">KSL</div><div><h1>รายงานตรวจสอบวันหมดอายุ</h1><div class="sub">Kamu Kamu Standard Libary • Online Expiry Audit History</div></div></div><div class="meta"><b>สาขา:</b> ${esc(report.branch)}<br><b>วันที่ตรวจ:</b> ${esc(formatThai(report.checkedAt))}<br><b>Report ID:</b> ${esc(report.id)}</div></div><div class="sum"><div><b>${s.all}</b>ทั้งหมด</div><div><b>${s.pass}</b>ผ่าน</div><div><b>${s.fail}</b>ไม่ผ่าน</div><div><b>${s.manual}</b>ตรวจฉลาก</div></div><table><thead><tr><th style="width:4%">#</th><th style="width:18%">วัตถุดิบ</th><th style="width:19%">ประเภท / สถานะ</th><th style="width:10%">Holding Time</th><th style="width:18%">เริ่มต้นวันหมดอายุ</th><th style="width:18%">วันหมดอายุ</th><th style="width:13%">ผลตรวจ</th></tr></thead><tbody>${report.rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.item)}</b></td><td>${esc(r.status||'-')}</td><td>${esc(r.holding||'-')}</td><td>${esc(formatThai(r.start))}</td><td>${esc(formatThai(r.expiry))}</td><td class="${esc(r.resultCode)}"><b>${esc(resultText(r.resultCode,r.resultLabel))}</b>${r.reason?`<br><small>${esc(r.reason)}</small>`:''}</td></tr>`).join('')}</tbody></table><div class="foot">ข้อมูลจากประวัติรายงานผลตรวจ Online • แก้ไขล่าสุด ${esc(formatThai(report.updatedAt))}</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
  }
  function exportPdfReport(report){
    const w=window.open('','_blank');if(!w){toastMsg('Browser บล็อกหน้าต่าง Export กรุณาอนุญาต Pop-up','warn');return;}
    w.document.open();w.document.write(reportHtml(report));w.document.close();
  }
  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=2){ const chars=Array.from(String(text||''));let line='',lines=[];for(const ch of chars){const t=line+ch;if(ctx.measureText(t).width>maxWidth&&line){lines.push(line);line=ch;if(lines.length>=maxLines-1)break}else line=t}if(line&&lines.length<maxLines)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return lines.length; }
  function drawCell(ctx,text,x,y,w,h,opt={}){ctx.strokeStyle='#d9e6df';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);ctx.fillStyle=opt.fill||'#173d30';ctx.font=`${opt.bold?'700':'400'} ${opt.size||19}px Tahoma, Arial, sans-serif`;ctx.textBaseline='top';wrapCanvasText(ctx,text,x+8,y+8,w-16,opt.lineHeight||23,opt.lines||2);}
  function exportJpgReport(report){
    const rows=report.rows||[], PAGE_W=2480,PAGE_H=1754,M=60,HEAD=250,HEADER_H=56,ROW_H=74; const cols=[70,350,390,220,390,390,390];
    const perPage=Math.max(1,Math.floor((PAGE_H-M-HEAD-HEADER_H-80)/ROW_H)), pages=Math.max(1,Math.ceil(rows.length/perPage));
    for(let p=0;p<pages;p++) setTimeout(()=>{
      const canvas=document.createElement('canvas');canvas.width=PAGE_W;canvas.height=PAGE_H;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,PAGE_W,PAGE_H);
      ctx.fillStyle='#176e52';ctx.fillRect(M,M,88,88);ctx.fillStyle='#fff';ctx.font='700 36px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('KSL',M+44,M+44);ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#173d30';ctx.font='700 40px Tahoma, Arial';ctx.fillText('รายงานตรวจสอบวันหมดอายุ',M+115,M+3);ctx.fillStyle='#6b8077';ctx.font='21px Tahoma, Arial';ctx.fillText('Online Expiry Audit History',M+115,M+55);ctx.fillStyle='#173d30';ctx.font='700 22px Tahoma, Arial';ctx.fillText(`สาขา: ${report.branch}`,M+115,M+100);ctx.font='20px Tahoma, Arial';ctx.fillText(`วันที่ตรวจ: ${formatThai(report.checkedAt)}`,M+115,M+135);ctx.fillText(`Report ID: ${report.id}`,M+115,M+170);ctx.fillText(`หน้า ${p+1}/${pages}`,PAGE_W-M-150,M+5);
      const s=summaryFromRows(rows);ctx.fillStyle='#f1f8f4';ctx.fillRect(M,M+205,PAGE_W-M*2,38);ctx.fillStyle='#315d4b';ctx.font='700 19px Tahoma, Arial';ctx.fillText(`ทั้งหมด ${s.all}   ผ่าน ${s.pass}   ไม่ผ่าน ${s.fail}   ตรวจฉลาก ${s.manual}`,M+12,M+214);
      let y=M+HEAD,x=M;const headers=['#','วัตถุดิบ','ประเภท/สถานะ','Holding Time','เริ่มต้นวันหมดอายุ','วันหมดอายุ','ผลตรวจ'];headers.forEach((h,i)=>{ctx.fillStyle='#e9f6ef';ctx.fillRect(x,y,cols[i],HEADER_H);drawCell(ctx,h,x,y,cols[i],HEADER_H,{bold:true,size:18});x+=cols[i]});y+=HEADER_H;
      rows.slice(p*perPage,(p+1)*perPage).forEach((r,idx)=>{x=M;const vals=[String(p*perPage+idx+1),r.item,r.status||'-',r.holding||'-',formatThai(r.start),formatThai(r.expiry),resultText(r.resultCode,r.resultLabel)];vals.forEach((v,i)=>{const fill=i===6?(r.resultCode==='pass'?'#11784d':r.resultCode==='fail'?'#a33131':r.resultCode==='manual'?'#8c6415':'#708077'):'#173d30';drawCell(ctx,v,x,y,cols[i],ROW_H,{bold:i===1||i===6,size:18,fill,lines:2});x+=cols[i]});y+=ROW_H;});
      ctx.fillStyle='#71847b';ctx.font='17px Tahoma, Arial';ctx.fillText(`แก้ไขล่าสุด ${formatThai(report.updatedAt)}`,M,PAGE_H-M+5);
      const a=document.createElement('a');a.download=`KSL_Expiry_Audit_${fileSafe(report.branch)}_${fileSafe(report.checkedAt.slice(0,10))}_${p+1}.jpg`;a.href=canvas.toDataURL('image/jpeg',0.94);a.click();
    },p*180);
  }

  function renderHistory(){
    const body=document.getElementById('eaHistoryBody'); if(!body)return;
    const q=txt(document.getElementById('eaHistorySearch')?.value).toLowerCase();
    const list=history.filter(r=>!q || [r.id,r.branch,formatThai(r.checkedAt)].join(' ').toLowerCase().includes(q));
    body.innerHTML=list.length?list.map(r=>{const s=summaryFromRows(r.rows);return `<tr data-history-id="${esc(r.id)}"><td><b>${esc(formatThai(r.checkedAt))}</b><small>${esc(r.id)}</small></td><td>${esc(r.branch||'-')}</td><td>${s.all}</td><td><span class="eah-pass">${s.pass}</span> / <span class="eah-fail">${s.fail}</span> / ${s.manual}</td><td>${esc(formatThai(r.updatedAt))}</td><td><div class="eah-actions"><button type="button" class="btn btn-outline" data-eah-view="${esc(r.id)}">ดู</button><button type="button" class="btn btn-outline" data-eah-load="${esc(r.id)}">แก้ไข</button><button type="button" class="btn btn-outline" data-eah-pdf-row="${esc(r.id)}">PDF</button><button type="button" class="btn btn-outline" data-eah-jpg-row="${esc(r.id)}">JPG</button></div></td></tr>`}).join(''):`<tr><td colspan="6" class="eah-empty">ยังไม่มีประวัติรายงานผลตรวจ</td></tr>`;
    const count=document.getElementById('eaHistoryCount'); if(count)count.textContent=`${history.length} รายงาน`;
  }

  function ensureUi(){
    const page=document.getElementById(PAGE_ID); if(!page)return false;
    if(!document.getElementById('eaHistorySave')){
      const form=page.querySelector('.ea-form .ea-actions');
      if(form){
        const save=document.createElement('button');save.id='eaHistorySave';save.type='button';save.className='btn btn-primary';save.textContent='💾 บันทึกเป็นประวัติ';form.insertBefore(save,form.firstChild);
        const fresh=document.createElement('button');fresh.id='eaHistoryNew';fresh.type='button';fresh.className='btn btn-outline';fresh.textContent='＋ สร้างรายงานใหม่';form.insertBefore(fresh,save.nextSibling);
        const note=document.createElement('div');note.id='eaHistoryEditNote';note.className='eah-edit-note';note.textContent='โหมดรายงานใหม่';form.insertAdjacentElement('afterend',note);
      }
    }
    if(!document.getElementById('eaHistoryCard')){
      const card=document.createElement('div');card.id='eaHistoryCard';card.className='card eah-card';card.innerHTML=`<div class="section-head"><div><h3>ประวัติรายงานผลตรวจ</h3><p>บันทึก Online สามารถเปิดดูและแก้ไขย้อนหลังได้ทุกอุปกรณ์</p></div><div class="eah-head-badges"><span id="eaHistoryOnline" class="badge">● ONLINE READY</span><span id="eaHistoryCount" class="badge">0 รายงาน</span></div></div><div class="eah-toolbar"><input id="eaHistorySearch" class="input" placeholder="ค้นหาสาขา / วันที่ / Report ID"><button id="eaHistorySync" type="button" class="btn btn-outline">↻ Sync Online</button></div><div class="eah-wrap"><table class="eah-table"><thead><tr><th>วันที่ตรวจ / Report ID</th><th>สาขา</th><th>รายการ</th><th>ผ่าน / ไม่ผ่าน / ตรวจฉลาก</th><th>แก้ไขล่าสุด</th><th>จัดการ</th></tr></thead><tbody id="eaHistoryBody"></tbody></table></div>`;
      const tableCard=page.querySelector('.ea-table-card'); if(tableCard)tableCard.insertAdjacentElement('afterend',card); else page.appendChild(card);
    }
    ensureModal();
    renderHistory();updateEditBanner();return true;
  }

  const style=document.createElement('style');style.id='ksl-expiry-history-v635-style';style.textContent=`
    #expiryAudit .eah-edit-note{font-size:9px;color:#60776d;margin-top:7px;font-weight:800}
    #expiryAudit .eah-card{padding:14px;margin-top:14px}.eah-head-badges{display:flex;gap:6px;flex-wrap:wrap}.eah-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:8px;margin-bottom:10px}.eah-wrap{overflow:auto;border:1px solid #d8e8e0;border-radius:12px}.eah-table{width:100%;border-collapse:collapse;min-width:950px;font-size:10px}.eah-table th{background:#edf7f2;color:#315d4b;padding:9px;border-bottom:1px solid #d8e8e0;text-align:left;white-space:nowrap}.eah-table td{padding:9px;border-bottom:1px solid #edf2ef;vertical-align:top}.eah-table td small{display:block;color:#7b8c84;margin-top:3px}.eah-actions{display:flex;gap:5px;flex-wrap:wrap}.eah-actions .btn{padding:6px 8px;font-size:9px}.eah-pass{color:#11784d;font-weight:900}.eah-fail{color:#a33131;font-weight:900}.eah-empty{text-align:center;color:#7b8c84;padding:20px!important}#eaHistoryOnline[data-mode="syncing"]{color:#8c6415}#eaHistoryOnline[data-mode="local"]{color:#a33131}
    .eah-modal{position:fixed;inset:0;background:rgba(17,39,31,.45);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px}.eah-modal.open{display:flex}.eah-modal-card{width:min(1180px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:16px}.eah-modal-top,.eah-modal-actions,.eah-preview-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.eah-modal-actions{justify-content:flex-end;margin-top:12px}.eah-preview-head h3{margin:8px 0 2px}.eah-preview-head p{margin:0;color:#6b8077}.eah-preview-sum{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.eah-preview-sum span{padding:7px 10px;border:1px solid #d8e8e0;border-radius:9px;background:#f8fcfa}.eah-preview-table{overflow:auto}.eah-preview-table table{width:100%;border-collapse:collapse;min-width:1000px;font-size:10px}.eah-preview-table th{background:#edf7f2;padding:8px;text-align:left}.eah-preview-table td{padding:8px;border-bottom:1px solid #edf2ef;vertical-align:top}.eah-preview-table td small{display:block;color:#7b8c84;margin-top:3px}.eah-preview-table .pass{color:#11784d}.eah-preview-table .fail{color:#a33131}.eah-preview-table .manual{color:#8c6415}
    @media(max-width:680px){#expiryAudit .eah-toolbar{grid-template-columns:1fr}.eah-modal{padding:8px}.eah-modal-card{padding:10px}.eah-modal-actions .btn{flex:1}}
  `;document.head.appendChild(style);

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#eaHistorySave')){e.preventDefault();saveReport();return;}
    if(e.target.closest?.('#eaHistoryNew')){e.preventDefault();clearCurrentForNew();return;}
    if(e.target.closest?.('#eaHistorySync')){e.preventDefault();pullOnline();pushOnline().then(()=>toastMsg('Sync ประวัติ Online แล้ว','success')).catch(err=>toastMsg('Sync ยังไม่สำเร็จ: '+(err?.message||err),'warn'));return;}
    const view=e.target.closest?.('[data-eah-view]');if(view){openPreview(view.dataset.eahView);return;}
    const load=e.target.closest?.('[data-eah-load]');if(load){loadReport(load.dataset.eahLoad);return;}
    const pdf=e.target.closest?.('[data-eah-pdf-row]');if(pdf){const r=history.find(x=>x.id===pdf.dataset.eahPdfRow);if(r)exportPdfReport(r);return;}
    const jpg=e.target.closest?.('[data-eah-jpg-row]');if(jpg){const r=history.find(x=>x.id===jpg.dataset.eahJpgRow);if(r)exportJpgReport(r);return;}
    if(e.target.closest?.('[data-eah-close]')){document.getElementById('eaHistoryModal')?.classList.remove('open');return;}
    if(e.target.id==='eaHistoryModal'){e.target.classList.remove('open');return;}
    const edit=e.target.closest?.('[data-eah-edit]');if(edit){const m=document.getElementById('eaHistoryModal');const id=m?.dataset.reportId;m?.classList.remove('open');if(id)loadReport(id);return;}
    const mpdf=e.target.closest?.('[data-eah-pdf]');if(mpdf){const id=document.getElementById('eaHistoryModal')?.dataset.reportId;const r=history.find(x=>x.id===id);if(r)exportPdfReport(r);return;}
    const mjpg=e.target.closest?.('[data-eah-jpg]');if(mjpg){const id=document.getElementById('eaHistoryModal')?.dataset.reportId;const r=history.find(x=>x.id===id);if(r)exportJpgReport(r);return;}
    if(e.target.closest?.('.nav button[data-page="expiryAudit"]')) scheduleInstall();
  },true);
  document.addEventListener('input',e=>{if(e.target?.id==='eaHistorySearch')renderHistory();},true);
  window.addEventListener('ksl-central-synced',()=>{pullOnline();scheduleInstall();});

  function scheduleInstall(){clearTimeout(installTimer);[0,80,220,600,1200].forEach(ms=>setTimeout(()=>{ensureUi();pullOnline();},ms));}
  history=mergeHistory(loadLocal(),normalizeHistory(getState()?.expiryAuditHistory));saveLocal();scheduleInstall();
  console.info('[KSL] V6.3 online expiry audit history ready');
})();
