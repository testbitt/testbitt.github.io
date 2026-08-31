(()=>{
  const API=window.KAMU_API||'';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const monthNames=['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const monthAliases={
    'มกราคม':1,'มกรา':1,'มค':1,'กุมภาพันธ์':2,'กุมภา':2,'กพ':2,'มีนาคม':3,'มีนา':3,'มีค':3,
    'เมษายน':4,'เมษา':4,'เมย':4,'พฤษภาคม':5,'พฤษภา':5,'พค':5,'มิถุนายน':6,'มิถุนา':6,'มิย':6,
    'กรกฎาคม':7,'กรกฎา':7,'กค':7,'สิงหาคม':8,'สิงหา':8,'สค':8,'กันยายน':9,'กันยา':9,'กย':9,
    'ตุลาคม':10,'ตุลา':10,'ตค':10,'พฤศจิกายน':11,'พฤศจิกา':11,'พย':11,'ธันวาคม':12,'ธันวา':12,'ธค':12
  };
  let recognition=null;
  let warmThaiVoice=null;
  let state={step:'idle',type:'',employeeId:'',startDate:'',endDate:''};

  function chooseWarmThaiVoice(){
    if(!window.speechSynthesis)return;
    const voices=speechSynthesis.getVoices()||[];
    const thai=voices.filter(v=>/^th(?:-|_)/i.test(v.lang||'')||/thai|ไทย/i.test(v.name||''));
    const maleHint=/male|man|niwat|niwatt|thanawat|narong|somchai|chai|ชาย/i;
    warmThaiVoice=thai.find(v=>maleHint.test(v.name||''))||thai.find(v=>v.localService)||thai[0]||null;
  }
  chooseWarmThaiVoice();
  if(window.speechSynthesis){
    if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',chooseWarmThaiVoice);
    else speechSynthesis.onvoiceschanged=chooseWarmThaiVoice;
  }

  function speak(text,after){
    if(!window.speechSynthesis){after&&after();return;}
    try{speechSynthesis.cancel();}catch(_){ }
    chooseWarmThaiVoice();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='th-TH';
    if(warmThaiVoice)u.voice=warmThaiVoice;
    u.rate=1.08;
    u.pitch=.86;
    u.volume=1;
    u.onend=()=>after&&setTimeout(after,180);
    u.onerror=()=>after&&setTimeout(after,180);
    speechSynthesis.speak(u);
  }

  function setStatus(text){const el=$('voiceStatus');if(el)el.textContent=text;}
  function setHeard(text){const el=$('voiceHeard');if(el)el.textContent=text?`ได้ยิน: ${text}`:'';}
  function pad(n){return String(n).padStart(2,'0');}
  function ymd(y,m,d){return `${y}-${pad(m)}-${pad(d)}`;}
  function daysInMonth(y,m){return new Date(y,m,0).getDate();}
  function validYMD(y,m,d){const dt=new Date(y,m-1,d);return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d;}
  function thaiDate(value){if(!value)return '-';const [y,m,d]=value.split('-').map(Number);return `${d}/${pad(m)}/${y+543}`;}

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
        <p class="desc">พูดว่า “ตรวจสอบค่าเดินทาง” หรือ “ตรวจสอบ OT” แล้วตอบรหัสพนักงานและช่วงเวลาที่ต้องการ</p>
        <div id="voiceSupport" style="margin:14px 0;padding:10px;border-radius:12px;background:#f7fbf8;font-size:12px"></div>
        <button type="button" class="btn primary" id="voiceStart" style="min-width:220px">🎤 เริ่มคำสั่งเสียง</button>
        <button type="button" class="btn" id="voiceStop" style="margin-left:8px">หยุด</button>
        <div id="voiceStatus" style="margin:18px auto 6px;padding:14px;max-width:680px;border-radius:14px;background:#fff8dc;color:#6d5500;font-weight:800">กด “เริ่มคำสั่งเสียง” แล้วพูดคำสั่ง</div>
        <div id="voiceHeard" style="font-size:12px;color:#6b776e;min-height:20px"></div>
        <div id="voiceFlow" style="margin:16px auto;max-width:680px;text-align:left;background:#f7fbf8;border:1px solid #dfeae2;border-radius:14px;padding:14px;font-size:13px">
          <b>พูดช่วงเวลาได้หลายแบบ</b><br>
          • “สิงหาคม” / “เดือนสิงหาคม ปี 2569”<br>
          • “เดือน 8 ปี 26” / “เดือน 8 ปี 69”<br>
          • “1 เดือน 8 ปี 26” / “1 สิงหาคม 2569” / “1/8/69”<br>
          • “เดือนนี้” / “เดือนที่แล้ว” / “วันนี้” / “เมื่อวาน”
        </div>
        <div id="voiceResult" style="margin-top:18px;text-align:left"></div>
      </div>`;
    document.querySelector('main').appendChild(sec);

    $('voiceSupport').textContent=SpeechRecognition?'พร้อมรับคำสั่งเสียงภาษาไทย ✓':'เบราว์เซอร์นี้ไม่รองรับ Speech Recognition กรุณาใช้ Chrome หรือ Edge';
    $('goVoiceAssistant').onclick=openVoice;
    $('voiceBack').onclick=goHome;
    $('voiceStart').onclick=startFlow;
    $('voiceStop').onclick=()=>stopAll(true);
    $('homeBtn')&&$('homeBtn').addEventListener('click',()=>$('voiceAssistant')?.classList.add('hidden'));
    document.querySelectorAll('[data-home]').forEach(el=>el.addEventListener('click',()=>$('voiceAssistant')?.classList.add('hidden')));
  }

  function openVoice(){
    ['home','travel','ot','travelSummary','otSummary','adminSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('voiceAssistant').classList.remove('hidden');scrollTo(0,0);
  }
  function goHome(){
    stopAll(false);$('voiceAssistant')?.classList.add('hidden');
    ['travel','ot','travelSummary','otSummary','adminSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('home')?.classList.remove('hidden');scrollTo(0,0);
  }
  function stopAll(reset=true){
    try{recognition&&recognition.abort();}catch(_){ }
    try{speechSynthesis.cancel();}catch(_){ }
    if(reset){state={step:'idle',type:'',employeeId:'',startDate:'',endDate:''};setStatus('หยุดการรับคำสั่งเสียงแล้ว');}
  }

  function startFlow(){
    if(!SpeechRecognition){alert('อุปกรณ์นี้ไม่รองรับการรับคำสั่งเสียง กรุณาใช้ Chrome หรือ Edge');return;}
    state={step:'type',type:'',employeeId:'',startDate:'',endDate:''};
    $('voiceResult').innerHTML='';setHeard('');
    ask('สวัสดีครับ ต้องการตรวจสอบค่าเดินทาง หรือ ตรวจสอบโอทีครับ','type');
  }
  function ask(displayMessage,step,spokenMessage=displayMessage){
    state.step=step;setStatus(displayMessage);speak(spokenMessage,listen);
  }
  function listen(){
    if(!SpeechRecognition)return;
    try{recognition&&recognition.abort();}catch(_){ }
    recognition=new SpeechRecognition();
    recognition.lang='th-TH';recognition.interimResults=false;recognition.maxAlternatives=3;recognition.continuous=false;
    recognition.onstart=()=>{$('voiceStart').textContent='🎙️ กำลังฟัง...';};
    recognition.onend=()=>{$('voiceStart').textContent='🎤 เริ่มคำสั่งเสียง';};
    recognition.onerror=()=>{setStatus('ผมฟังไม่ชัดครับ ลองกดเริ่มแล้วพูดใหม่อีกครั้งนะครับ');};
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
    for(const [w,d] of words)s=s.replace(new RegExp(w,'g'),` ${d} `);
    const ds=s.match(/\d/g);return ds?ds.join(''):'';
  }
  function employeeIdSpeech(id){
    const words={'0':'ศูนย์','1':'หนึ่ง','2':'สอง','3':'สาม','4':'สี่','5':'ห้า','6':'หก','7':'เจ็ด','8':'แปด','9':'เก้า'};
    return String(id||'').split('').map(d=>words[d]||d).join(' ');
  }

  const thaiDayWords={
    'หนึ่ง':1,'สอง':2,'สาม':3,'สี่':4,'ห้า':5,'หก':6,'เจ็ด':7,'แปด':8,'เก้า':9,'สิบ':10,
    'สิบเอ็ด':11,'สิบสอง':12,'สิบสาม':13,'สิบสี่':14,'สิบห้า':15,'สิบหก':16,'สิบเจ็ด':17,'สิบแปด':18,'สิบเก้า':19,
    'ยี่สิบ':20,'ยี่สิบเอ็ด':21,'ยี่สิบสอง':22,'ยี่สิบสาม':23,'ยี่สิบสี่':24,'ยี่สิบห้า':25,'ยี่สิบหก':26,'ยี่สิบเจ็ด':27,'ยี่สิบแปด':28,'ยี่สิบเก้า':29,
    'สามสิบ':30,'สามสิบเอ็ด':31
  };
  function normalizeYear(raw,text=''){
    let y=Number(raw);if(!Number.isFinite(y))return 0;
    if(y>=2400)return y-543;
    if(y>=1900)return y;
    if(y<100){
      if(/พ\.?\s*ศ\.?|พุทธ/i.test(text)||y>=60)return 2500+y-543;
      return 2000+y;
    }
    return y;
  }
  function currentYear(){return new Date().getFullYear();}
  function findMonthByName(s){
    for(const [name,n] of Object.entries(monthAliases)){if(s.includes(name))return n;}
    return 0;
  }
  function monthPeriod(y,m){return {kind:'month',start:ymd(y,m,1),end:ymd(y,m,daysInMonth(y,m)),label:`${monthNames[m]} ${y+543}`};}
  function datePeriod(y,m,d){return validYMD(y,m,d)?{kind:'date',date:ymd(y,m,d),label:thaiDate(ymd(y,m,d))}:null;}
  function parsePeriod(text){
    let s=normalizeThaiDigits(text).trim().toLowerCase().replace(/\s+/g,' ');
    const now=new Date();
    if(/เดือนนี้/.test(s))return monthPeriod(now.getFullYear(),now.getMonth()+1);
    if(/เดือนที่แล้ว|เดือนก่อน/.test(s)){const d=new Date(now.getFullYear(),now.getMonth()-1,1);return monthPeriod(d.getFullYear(),d.getMonth()+1);}
    if(/วันนี้/.test(s))return datePeriod(now.getFullYear(),now.getMonth()+1,now.getDate());
    if(/เมื่อวาน/.test(s)){const d=new Date(now);d.setDate(d.getDate()-1);return datePeriod(d.getFullYear(),d.getMonth()+1,d.getDate());}

    let m=s.match(/(?:วันที่\s*)?(\d{1,2})\s*(?:วัน\s*)?(?:เดือน\s*)?(\d{1,2})\s*(?:ปี\s*)?(\d{2,4})/);
    if(m){const d=+m[1],mo=+m[2],y=normalizeYear(m[3],s);if(mo>=1&&mo<=12)return datePeriod(y,mo,d);}
    m=s.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{2,4})/);
    if(m){return datePeriod(normalizeYear(m[3],s),+m[2],+m[1]);}

    const namedMonth=findMonthByName(s);
    if(namedMonth){
      const nums=(s.match(/\d{1,4}/g)||[]).map(Number);
      let day=0,year=0;
      if(nums.length>=2){day=nums[0];year=normalizeYear(nums[nums.length-1],s);}
      else if(nums.length===1){
        if(nums[0]>31||/ปี|พ\.?\s*ศ\.?/.test(s))year=normalizeYear(nums[0],s);
        else day=nums[0];
      }
      if(!day){
        for(const [w,n] of Object.entries(thaiDayWords)){if(new RegExp(`(?:วันที่|วัน)\\s*${w}`).test(s)){day=n;break;}}
      }
      if(!year)year=currentYear();
      if(day)return datePeriod(year,namedMonth,day);
      return monthPeriod(year,namedMonth);
    }

    m=s.match(/(?:เดือน\s*)(\d{1,2})(?:\s*(?:ปี)?\s*(\d{2,4}))?/);
    if(m){const mo=+m[1];if(mo<1||mo>12)return null;const y=m[2]?normalizeYear(m[2],s):currentYear();return monthPeriod(y,mo);}

    const nums=(s.match(/\d+/g)||[]).map(Number);
    if(nums.length>=3){const d=nums[0],mo=nums[1],y=normalizeYear(nums[2],s);return datePeriod(y,mo,d);}
    return null;
  }

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
      ask(
        `รับรหัสพนักงาน ${id} แล้วครับ ต้องการตรวจสอบช่วงไหนครับ`,
        'start',
        `รับรหัสพนักงาน ${employeeIdSpeech(id)} แล้วครับ ต้องการตรวจสอบช่วงไหนครับ พูดชื่อเดือน เช่น สิงหาคม ปี 2569 หรือพูดวันที่เริ่มต้นก็ได้ครับ`
      );
      return;
    }
    if(state.step==='start'){
      const p=parsePeriod(text);
      if(!p){ask('ผมยังจับช่วงเวลาไม่ได้ครับ ลองพูดว่า สิงหาคม ปี 2569 หรือ 1 เดือน 8 ปี 26 ก็ได้ครับ','start');return;}
      if(p.kind==='month'){
        state.startDate=p.start;state.endDate=p.end;state.step='loading';
        setStatus(`กำลังตรวจสอบข้อมูลของรหัส ${state.employeeId} สำหรับเดือน ${p.label}...`);
        speak(`ได้ครับ ผมจะเช็กทั้งเดือน ${p.label} ให้เลย รอสักครู่นะครับ`);lookup();return;
      }
      state.startDate=p.date;
      ask(`เริ่มวันที่ ${thaiDate(p.date)} แล้วครับ วันที่สิ้นสุดเป็นวันไหนครับ`,'end',`ได้ครับ เริ่มวันที่ ${thaiDate(p.date)} แล้ววันที่สิ้นสุดเป็นวันไหนครับ`);
      return;
    }
    if(state.step==='end'){
      if(/วันเดียวกัน|วันเดิม|วันนั้น/.test(text)){
        state.endDate=state.startDate;
      }else{
        const p=parsePeriod(text);
        if(!p){ask('ผมฟังวันที่สิ้นสุดไม่ชัดครับ ลองพูดวันที่อีกครั้ง หรือพูดว่า วันเดียวกัน ก็ได้ครับ','end');return;}
        state.endDate=p.kind==='month'?p.end:p.date;
      }
      if(state.endDate<state.startDate){ask('วันที่สิ้นสุดอยู่ก่อนวันที่เริ่มต้นครับ ขอวันที่สิ้นสุดใหม่อีกครั้งนะครับ','end');return;}
      state.step='loading';setStatus('กำลังตรวจสอบข้อมูลจากฐานข้อมูล...');
      speak('ได้ครับ ผมกำลังเช็กข้อมูลให้ รอสักครู่นะครับ');lookup();
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
        const display=count?`พบค่าเดินทาง ${count} รายการ ระยะทางรวม ${num(km)} กิโลเมตร ค่าเดินทางรวม ${num(amount)} บาท`:`ไม่พบข้อมูลค่าเดินทางของรหัสพนักงาน ${state.employeeId} ในช่วงที่เลือก`;
        const spoken=count?`เจอข้อมูลแล้วครับ มีค่าเดินทางทั้งหมด ${count} รายการ ระยะทางรวม ${num(km)} กิโลเมตร และค่าเดินทางรวม ${num(amount)} บาทครับ`:`ไม่พบข้อมูลค่าเดินทางของรหัสพนักงาน ${employeeIdSpeech(state.employeeId)} ในช่วงที่เลือกครับ`;
        $('voiceResult').innerHTML=`<div class="summary-panel"><h3>🚙 สรุปค่าเดินทาง</h3><p><b>รหัสพนักงาน:</b> ${esc(state.employeeId)} ${x.employeeName?`• ${esc(x.employeeName)}`:''}</p><p><b>ช่วงวันที่:</b> ${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}</p><div class="metric-grid"><div class="metric"><small>จำนวนรายการ</small><strong>${count}</strong></div><div class="metric"><small>ระยะทางรวม</small><strong>${num(km)} กม.</strong></div><div class="metric"><small>ค่าเดินทางรวม</small><strong>${num(amount)} บาท</strong></div></div></div>`;
        setStatus(display);speak(spoken+' ถ้าต้องการเช็กอีกครั้ง กดเริ่มคุยกับระบบได้เลยครับ');
      }else{
        const x=await post({action:'getOTSummary',employeeId:state.employeeId,startDate:state.startDate,endDate:state.endDate,month:''});
        const rows=x.records||[];const count=Number(x.totals?.count||rows.length||0);
        const comp=rows.reduce((s,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
        const paid=rows.reduce((s,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
        const total=rows.reduce((s,r)=>s+Number(r.hours||0),0);
        const display=count?`พบ OT ${count} รายการ • ชดชั่วโมง ${num(comp)} ชม. • จ่ายเงิน ${num(paid)} ชม. • รวม ${num(total)} ชม.`:`ไม่พบข้อมูล OT ของรหัสพนักงาน ${state.employeeId} ในช่วงที่เลือก`;
        const spoken=count?`เจอข้อมูลแล้วครับ มีโอทีทั้งหมด ${count} รายการ เป็นโอทีชดชั่วโมง ${num(comp)} ชั่วโมง โอทีทำจ่ายเงิน ${num(paid)} ชั่วโมง รวมทั้งหมด ${num(total)} ชั่วโมงครับ`:`ไม่พบข้อมูลโอทีของรหัสพนักงาน ${employeeIdSpeech(state.employeeId)} ในช่วงที่เลือกครับ`;
        $('voiceResult').innerHTML=`<div class="summary-panel"><h3>⏰ สรุป OT</h3><p><b>รหัสพนักงาน:</b> ${esc(state.employeeId)} ${x.employeeName?`• ${esc(x.employeeName)}`:''}</p><p><b>ช่วงวันที่:</b> ${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}</p><div class="metric-grid"><div class="metric"><small>OT ชดชั่วโมง</small><strong>${num(comp)} ชม.</strong></div><div class="metric"><small>OT ทำจ่ายเงิน</small><strong>${num(paid)} ชม.</strong></div><div class="metric"><small>OT รวม</small><strong>${num(total)} ชม.</strong></div></div></div>`;
        setStatus(display);speak(spoken+' ถ้าต้องการเช็กอีกครั้ง กดเริ่มคุยกับระบบได้เลยครับ');
      }
      state.step='done';
    }catch(e){setStatus('เกิดข้อผิดพลาด: '+e.message);speak('ขอโทษครับ ตอนนี้ตรวจสอบข้อมูลไม่ได้ ลองใหม่อีกครั้งนะครับ');state.step='idle';}
  }

  function boot(){appendUI();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
