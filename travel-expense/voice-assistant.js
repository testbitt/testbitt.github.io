(()=>{
  const API=window.KAMU_API||'';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null;
  let state={step:'idle',type:'',employeeId:'',startDate:'',endDate:''};
  let listening=false;

  function speak(text,after){
    try{speechSynthesis.cancel();}catch(_){ }
    const u=new SpeechSynthesisUtterance(text);
    u.lang='th-TH';u.rate=1.08;u.pitch=1;
    u.onend=()=>after&&setTimeout(after,250);
    u.onerror=()=>after&&setTimeout(after,250);
    speechSynthesis.speak(u);
  }

  function setStatus(text){const el=$('voiceStatus');if(el)el.textContent=text;}
  function setHeard(text){const el=$('voiceHeard');if(el)el.textContent=text?`ได้ยิน: ${text}`:'';}

  function appendUI(){
    if($('goVoiceAssistant'))return;
    const grid=document.querySelector('#home .grid2');
    if(!grid)return;
    const card=document.createElement('div');
    card.className='card';card.id='goVoiceAssistant';
    card.innerHTML='<div class="ico">🎙️</div><h3>6. ตรวจสอบด้วยเสียง</h3><p>พูดเพื่อตรวจสอบค่าเดินทางหรือ OT และฟังสรุปผลอัตโนมัติ</p><span class="tag">VOICE CHECK →</span>';
    grid.appendChild(card);

    const sec=document.createElement('section');
    sec.id='voiceAssistant';sec.className='hidden';
    sec.innerHTML=`
      <button class="back" id="voiceBack">‹ กลับหน้าแรก</button>
      <div class="form" style="text-align:center">
        <h2>🎙️ ตรวจสอบข้อมูลด้วยเสียง</h2>
        <p class="desc">พูดว่า “ตรวจสอบค่าเดินทาง” หรือ “ตรวจสอบ OT” จากนั้นตอบคำถามทีละขั้น</p>
        <div id="voiceSupport" style="margin:14px 0;padding:10px;border-radius:12px;background:#f7fbf8;font-size:12px"></div>
        <button type="button" class="btn primary" id="voiceStart" style="min-width:220px">🎤 เริ่มคำสั่งเสียง</button>
        <button type="button" class="btn" id="voiceStop" style="margin-left:8px">หยุด</button>
        <div id="voiceStatus" style="margin:18px auto 6px;padding:14px;max-width:680px;border-radius:14px;background:#fff8dc;color:#6d5500;font-weight:800">กด “เริ่มคำสั่งเสียง” แล้วพูดคำสั่ง</div>
        <div id="voiceHeard" style="font-size:12px;color:#6b776e;min-height:20px"></div>
        <div id="voiceFlow" style="margin:16px auto;max-width:680px;text-align:left;background:#f7fbf8;border:1px solid #dfeae2;border-radius:14px;padding:14px;font-size:13px">
          <b>ลำดับการสนทนา</b><br>1. ตรวจสอบค่าเดินทาง / ตรวจสอบ OT<br>2. รหัสพนักงาน<br>3. วันที่เริ่มต้น<br>4. วันที่สิ้นสุด<br>5. ระบบสรุปผลจากฐานข้อมูล
        </div>
        <div id="voiceResult" style="margin-top:18px;text-align:left"></div>
      </div>`;
    document.querySelector('main').appendChild(sec);

    $('voiceSupport').textContent=SpeechRecognition?'เบราว์เซอร์รองรับการรับคำสั่งเสียง ✓':'เบราว์เซอร์นี้ไม่รองรับ Speech Recognition กรุณาใช้ Chrome/Edge หรือ Chrome บน Android';
    $('goVoiceAssistant').onclick=openVoice;
    $('voiceBack').onclick=goHome;
    $('voiceStart').onclick=startFlow;
    $('voiceStop').onclick=stopAll;
    $('homeBtn')&&$('homeBtn').addEventListener('click',()=>$('voiceAssistant')?.classList.add('hidden'));
    document.querySelectorAll('[data-home]').forEach(el=>el.addEventListener('click',()=>$('voiceAssistant')?.classList.add('hidden')));
  }

  function openVoice(){
    ['home','travel','ot','travelSummary','otSummary','adminSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('voiceAssistant').classList.remove('hidden');
    scrollTo(0,0);
  }
  function goHome(){
    stopAll(false);
    $('voiceAssistant')?.classList.add('hidden');
    ['travel','ot','travelSummary','otSummary','adminSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('home')?.classList.remove('hidden');
    scrollTo(0,0);
  }

  function stopAll(reset=true){
    try{recognition&&recognition.abort();}catch(_){ }
    try{speechSynthesis.cancel();}catch(_){ }
    listening=false;
    if(reset){state={step:'idle',type:'',employeeId:'',startDate:'',endDate:''};setStatus('หยุดการรับคำสั่งเสียงแล้ว');}
  }

  function startFlow(){
    if(!SpeechRecognition){alert('อุปกรณ์นี้ไม่รองรับการรับคำสั่งเสียง กรุณาใช้ Chrome หรือ Edge');return;}
    state={step:'type',type:'',employeeId:'',startDate:'',endDate:''};
    $('voiceResult').innerHTML='';setHeard('');
    ask('สวัสดีครับ ต้องการตรวจสอบค่าเดินทาง หรือ ตรวจสอบโอทีครับ','type');
  }

  function ask(message,step){
    state.step=step;setStatus(message);
    speak(message,listen);
  }

  function listen(){
    if(!SpeechRecognition)return;
    try{recognition&&recognition.abort();}catch(_){ }
    recognition=new SpeechRecognition();
    recognition.lang='th-TH';recognition.interimResults=false;recognition.maxAlternatives=3;recognition.continuous=false;
    recognition.onstart=()=>{listening=true;$('voiceStart').textContent='🎙️ กำลังฟัง...';};
    recognition.onend=()=>{listening=false;$('voiceStart').textContent='🎤 เริ่มคำสั่งเสียง';};
    recognition.onerror=e=>{setStatus('ฟังไม่ชัด กรุณากดเริ่มและพูดใหม่ หรือรอสักครู่');};
    recognition.onresult=e=>{
      const text=Array.from(e.results[0]).map(x=>x.transcript).join(' ');
      setHeard(text);handleAnswer(text);
    };
    try{recognition.start();}catch(_){ }
  }

  function normalizeThaiDigits(s){
    const map={'๐':'0','๑':'1','๒':'2','๓':'3','๔':'4','๕':'5','๖':'6','๗':'7','๘':'8','๙':'9'};
    return String(s||'').replace(/[๐-๙]/g,c=>map[c]);
  }

  function parseEmployeeId(text){
    let s=normalizeThaiDigits(text).toLowerCase();
    const direct=s.match(/\d{2,10}/g);
    if(direct)return direct.join('').replace(/\D/g,'');
    const words=[['ศูนย์','0'],['หนึ่ง','1'],['เอ็ด','1'],['สอง','2'],['สาม','3'],['สี่','4'],['ห้า','5'],['หก','6'],['เจ็ด','7'],['แปด','8'],['เก้า','9']];
    let result='';
    for(const [w,d] of words){s=s.replace(new RegExp(w,'g'),` ${d} `);}
    const ds=s.match(/\d/g);if(ds)result=ds.join('');
    return result;
  }


  function employeeIdSpeech(id){
    const digitWords={'0':'ศูนย์','1':'หนึ่ง','2':'สอง','3':'สาม','4':'สี่','5':'ห้า','6':'หก','7':'เจ็ด','8':'แปด','9':'เก้า'};
    return String(id||'').split('').map(d=>digitWords[d]||d).join(' ');
  }

  const months={
    'มกราคม':1,'มกรา':1,'กุมภาพันธ์':2,'กุมภา':2,'มีนาคม':3,'มีนา':3,'เมษายน':4,'เมษา':4,'พฤษภาคม':5,'พฤษภา':5,'มิถุนายน':6,'มิถุนา':6,'กรกฎาคม':7,'กรกฎา':7,'สิงหาคม':8,'สิงหา':8,'กันยายน':9,'กันยา':9,'ตุลาคม':10,'ตุลา':10,'พฤศจิกายน':11,'พฤศจิกา':11,'ธันวาคม':12,'ธันวา':12
  };
  function pad(n){return String(n).padStart(2,'0');}
  function validYMD(y,m,d){const dt=new Date(y,m-1,d);return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d;}
  function parseDate(text){
    let s=normalizeThaiDigits(text).trim().toLowerCase();
    if(/วันนี้/.test(s)){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
    if(/เมื่อวาน/.test(s)){const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
    let m=s.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{2,4})/);
    if(m){let d=+m[1],mo=+m[2],y=+m[3];if(y<100)y+=2000;if(y>2400)y-=543;return validYMD(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:'';}
    let monthNum=0;for(const [name,n] of Object.entries(months)){if(s.includes(name)){monthNum=n;break;}}
    if(monthNum){
      const nums=(s.match(/\d{1,4}/g)||[]).map(Number);
      let d=nums.find(n=>n>=1&&n<=31)||0;
      let y=[...nums].reverse().find(n=>n>=1900)||new Date().getFullYear();
      if(y>2400)y-=543;
      if(d&&validYMD(y,monthNum,d))return `${y}-${pad(monthNum)}-${pad(d)}`;
    }
    const nums=(s.match(/\d+/g)||[]).map(Number);
    if(nums.length>=3){let [d,mo,y]=nums;if(y>2400)y-=543;if(y<100)y+=2000;return validYMD(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:'';}
    return '';
  }

  function thaiDate(ymd){if(!ymd)return '-';const [y,m,d]=ymd.split('-').map(Number);return `${d}/${pad(m)}/${y+543}`;}

  function handleAnswer(text){
    if(state.step==='type'){
      if(/เดินทาง|ค่าเดินทาง/.test(text)){state.type='travel';ask('ได้ครับ ขอรหัสพนักงานหน่อยครับ พูดตัวเลขทีละหลักได้เลย','employee');return;}
      if(/โอ\s*ที|OT|ot|โอที/.test(text)){state.type='ot';ask('ได้ครับ ขอรหัสพนักงานหน่อยครับ พูดตัวเลขทีละหลักได้เลย','employee');return;}
      ask('ขออีกครั้งนะครับ ต้องการเช็กค่าเดินทาง หรือโอทีครับ','type');return;
    }
    if(state.step==='employee'){
      const id=parseEmployeeId(text);
      if(!id){ask('ผมฟังรหัสไม่ชัดครับ ลองพูดตัวเลขทีละหลักอีกครั้งนะครับ','employee');return;}
      state.employeeId=id;
      ask(`รับรหัสพนักงาน ${employeeIdSpeech(id)} แล้วครับ ขอวันที่เริ่มต้นที่ต้องการตรวจสอบครับ เช่น 1 สิงหาคม 2569`,'start');return;
    }
    if(state.step==='start'){
      const d=parseDate(text);
      if(!d){ask('ผมฟังวันที่เริ่มต้นไม่ชัดครับ ลองพูดใหม่ เช่น 1 สิงหาคม 2569','start');return;}
      state.startDate=d;
      ask(`ได้ครับ เริ่มวันที่ ${thaiDate(d)} แล้ววันที่สิ้นสุดเป็นวันไหนครับ`,'end');return;
    }
    if(state.step==='end'){
      const d=parseDate(text);
      if(!d){ask('ผมฟังวันที่สิ้นสุดไม่ชัดครับ ลองพูดวันที่อีกครั้งนะครับ','end');return;}
      if(d<state.startDate){ask('วันที่สิ้นสุดอยู่ก่อนวันที่เริ่มต้นครับ ขอวันที่สิ้นสุดใหม่อีกครั้งนะครับ','end');return;}
      state.endDate=d;state.step='loading';
      setStatus('กำลังตรวจสอบข้อมูลจากฐานข้อมูล...');
      speak('ได้ครับ ผมกำลังเช็กข้อมูลให้ รอสักครู่นะครับ');
      lookup();
    }
  }

  async function post(payload){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const t=await r.text();let x;try{x=JSON.parse(t)}catch{throw Error('Apps Script ตอบกลับไม่ถูกต้อง');}
    if(!x.success)throw Error(x.message||'ค้นข้อมูลไม่สำเร็จ');return x;
  }

  async function lookup(){
    try{
      if(state.type==='travel'){
        const x=await post({action:'getTravelSummary',employeeId:state.employeeId,startDate:state.startDate,endDate:state.endDate,month:''});
        const rows=x.records||[];const count=Number(x.totals?.count||rows.length||0),km=Number(x.totals?.totalKm||0),amount=Number(x.totals?.totalAmount||0);
        const message=count?`เจอข้อมูลแล้วครับ มีค่าเดินทางทั้งหมด ${count} รายการ ระยะทางรวม ${num(km)} กิโลเมตร และค่าเดินทางรวม ${num(amount)} บาทครับ`:`ไม่พบข้อมูลค่าเดินทางของรหัสพนักงาน ${employeeIdSpeech(state.employeeId)} ในช่วงวันที่ที่กำหนดครับ`;
        $('voiceResult').innerHTML=`<div class="summary-panel"><h3>🚙 สรุปค่าเดินทาง</h3><p><b>รหัสพนักงาน:</b> ${esc(state.employeeId)} ${x.employeeName?`• ${esc(x.employeeName)}`:''}</p><p><b>ช่วงวันที่:</b> ${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}</p><div class="metric-grid"><div class="metric"><small>จำนวนรายการ</small><strong>${count}</strong></div><div class="metric"><small>ระยะทางรวม</small><strong>${num(km)} กม.</strong></div><div class="metric"><small>ค่าเดินทางรวม</small><strong>${num(amount)} บาท</strong></div></div></div>`;
        setStatus(message);speak(message+' ถ้าต้องการเช็กอีกครั้ง กดเริ่มคุยกับระบบได้เลยครับ');
      }else{
        const x=await post({action:'getOTSummary',employeeId:state.employeeId,startDate:state.startDate,endDate:state.endDate,month:''});
        const rows=x.records||[];const count=Number(x.totals?.count||rows.length||0);
        const comp=rows.reduce((s,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
        const paid=rows.reduce((s,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
        const total=rows.reduce((s,r)=>s+Number(r.hours||0),0);
        const message=count?`เจอข้อมูลแล้วครับ มีโอทีทั้งหมด ${count} รายการ เป็นโอทีชดชั่วโมง ${num(comp)} ชั่วโมง โอทีทำจ่ายเงิน ${num(paid)} ชั่วโมง รวมทั้งหมด ${num(total)} ชั่วโมงครับ`:`ไม่พบข้อมูลโอทีของรหัสพนักงาน ${employeeIdSpeech(state.employeeId)} ในช่วงวันที่ที่กำหนดครับ`;
        $('voiceResult').innerHTML=`<div class="summary-panel"><h3>⏰ สรุป OT</h3><p><b>รหัสพนักงาน:</b> ${esc(state.employeeId)} ${x.employeeName?`• ${esc(x.employeeName)}`:''}</p><p><b>ช่วงวันที่:</b> ${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}</p><div class="metric-grid"><div class="metric"><small>OT ชดชั่วโมง</small><strong>${num(comp)} ชม.</strong></div><div class="metric"><small>OT ทำจ่ายเงิน</small><strong>${num(paid)} ชม.</strong></div><div class="metric"><small>OT รวม</small><strong>${num(total)} ชม.</strong></div></div></div>`;
        setStatus(message);speak(message+' ถ้าต้องการเช็กอีกครั้ง กดเริ่มคุยกับระบบได้เลยครับ');
      }
      state.step='done';
    }catch(e){setStatus('เกิดข้อผิดพลาด: '+e.message);speak('ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่อีกครั้ง');state.step='idle';}
  }

  function boot(){appendUI();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();