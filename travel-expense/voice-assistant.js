(()=>{
  const API=window.KAMU_API||'';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const USER_AGENT=navigator.userAgent||'';
  const IS_IOS=/iPhone|iPad|iPod/i.test(USER_AGENT);
  const IS_ANDROID=/Android/i.test(USER_AGENT);
  const IS_LINE=/\\bLine\\//i.test(USER_AGENT)||/LIFF/i.test(USER_AGENT);
  const monthNames=['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const monthAliases={
    'มกราคม':1,'มกรา':1,'มค':1,'กุมภาพันธ์':2,'กุมภา':2,'กพ':2,'มีนาคม':3,'มีนา':3,'มีค':3,
    'เมษายน':4,'เมษา':4,'เมย':4,'พฤษภาคม':5,'พฤษภา':5,'พค':5,'มิถุนายน':6,'มิถุนา':6,'มิย':6,
    'กรกฎาคม':7,'กรกฎา':7,'กค':7,'สิงหาคม':8,'สิงหา':8,'สค':8,'กันยายน':9,'กันยา':9,'กย':9,
    'ตุลาคม':10,'ตุลา':10,'ตค':10,'พฤศจิกายน':11,'พฤศจิกา':11,'พย':11,'ธันวาคม':12,'ธันวา':12,'ธค':12
  };
  const thaiDayWords={
    'หนึ่ง':1,'สอง':2,'สาม':3,'สี่':4,'ห้า':5,'หก':6,'เจ็ด':7,'แปด':8,'เก้า':9,'สิบ':10,
    'สิบเอ็ด':11,'สิบสอง':12,'สิบสาม':13,'สิบสี่':14,'สิบห้า':15,'สิบหก':16,'สิบเจ็ด':17,'สิบแปด':18,'สิบเก้า':19,
    'ยี่สิบ':20,'ยี่สิบเอ็ด':21,'ยี่สิบสอง':22,'ยี่สิบสาม':23,'ยี่สิบสี่':24,'ยี่สิบห้า':25,'ยี่สิบหก':26,'ยี่สิบเจ็ด':27,'ยี่สิบแปด':28,'ยี่สิบเก้า':29,
    'สามสิบ':30,'สามสิบเอ็ด':31
  };

  let recognition=null;
  let recognitionRetry=0;
  let youthfulThaiVoice=null;
  let state={step:'idle',type:'',employeeId:'',employeeName:'',startDate:'',endDate:'',periodLabel:''};

  function chooseYouthfulThaiVoice(){
    if(!window.speechSynthesis)return;
    const voices=speechSynthesis.getVoices()||[];
    const thai=voices.filter(v=>/^th(?:-|_)/i.test(v.lang||'')||/thai|ไทย/i.test(v.name||''));
    const femaleHint=/female|woman|girl|young|youth|anime|หญิง|สาว|kanya|narisa|premwadee|pim|ploy|suda|siri|woranuch|nicha/i;
    youthfulThaiVoice=thai.find(v=>femaleHint.test(v.name||''))||thai.find(v=>/google.*ไทย|google.*thai/i.test(v.name||''))||thai.find(v=>v.localService)||thai[0]||null;
    if(IS_IOS){
      const iosNatural=thai.find(v=>v.localService&&/kanya|narisa|siri|thai|ไทย/i.test(v.name||''))||thai.find(v=>v.localService)||thai[0]||null;
      if(iosNatural)youthfulThaiVoice=iosNatural;
    }
  }
  chooseYouthfulThaiVoice();
  if(window.speechSynthesis){
    if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',chooseYouthfulThaiVoice);
    else speechSynthesis.onvoiceschanged=chooseYouthfulThaiVoice;
  }

  function speak(text,after){
    if(!window.speechSynthesis){after&&after();return;}
    try{speechSynthesis.cancel();}catch(_){ }
    chooseYouthfulThaiVoice();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='th-TH';
    if(youthfulThaiVoice)u.voice=youthfulThaiVoice;
    u.rate=IS_IOS?0.98:1.10;
    u.pitch=IS_IOS?1.02:1.22;
    u.volume=1;
    const listenDelay=(IS_LINE&&IS_ANDROID)?750:(IS_IOS?360:260);
    u.onend=()=>after&&setTimeout(after,listenDelay);
    u.onerror=()=>after&&setTimeout(after,listenDelay);
    speechSynthesis.speak(u);
  }

  function setStatus(text){const el=$('voiceStatus');if(el)el.textContent=text;}
  function setHeard(text){const el=$('voiceHeard');if(el)el.textContent=text?`ได้ยิน: ${text}`:'';}
  function pad(n){return String(n).padStart(2,'0');}
  function ymd(y,m,d){return `${y}-${pad(m)}-${pad(d)}`;}
  function daysInMonth(y,m){return new Date(y,m,0).getDate();}
  function validYMD(y,m,d){const dt=new Date(y,m-1,d);return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d;}
  function thaiDate(value){if(!value)return '-';const [y,m,d]=String(value).slice(0,10).split('-').map(Number);return `${d}/${pad(m)}/${y+543}`;}

  function appendUI(){
    if($('goVoiceAssistant'))return;
    const grid=document.querySelector('#home .grid2');
    if(!grid)return;
    const style=document.createElement('style');
    style.id='voiceDailyStyle';
    style.textContent=`
      .voice-daily{margin-top:22px}.voice-day{border:1px solid #dfeae2;border-radius:16px;background:#fff;margin:12px 0;overflow:hidden}.voice-day-head{padding:12px 14px;background:#f3faf5;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.voice-day-head strong{color:#24573a}.voice-day-total{font-size:12px;color:#617068}.voice-detail-wrap{overflow:auto}.voice-detail-table{width:100%;min-width:860px;border-collapse:collapse;font-size:12px}.voice-detail-table th,.voice-detail-table td{padding:9px 10px;border-bottom:1px solid #edf2ee;text-align:left;vertical-align:top}.voice-detail-table th{background:#fbfdfb;color:#66736b;white-space:nowrap}.voice-detail-table tr:last-child td{border-bottom:0}.voice-empty{padding:18px;text-align:center;color:#7a867f}.voice-emp{margin:10px 0;padding:12px 14px;border-radius:13px;background:#eef8f1;border:1px solid #d7eadc;font-weight:800;color:#28543a}@media(max-width:760px){.voice-day-head{align-items:flex-start}.voice-detail-table{min-width:760px}}
    `;
    document.head.appendChild(style);
    style.textContent += '#voiceFlow,#voiceSupport,#voiceAssistant .desc{display:none!important}';

    const card=document.createElement('div');
    card.className='card';card.id='goVoiceAssistant';
    card.innerHTML='<div class="ico">🎙️</div><h3>6. ตรวจสอบด้วยเสียง</h3><p>พูดเพื่อตรวจสอบค่าเดินทางหรือ OT และดูรายละเอียดรายวัน</p><span class="tag">VOICE CHECK →</span>';
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
          <b>พูดรหัสได้ทั้งไทย / English</b><br>• DVT-Y223 → “ดี วี ที ขีด วาย สอง สอง สาม”<br>• M-3002 → “เอ็ม ขีด สาม ศูนย์ ศูนย์ สอง”<br><br><b>พูดช่วงเวลาได้หลายแบบ</b><br>
          • “สิงหาคม” / “เดือนสิงหาคม ปี 2569”<br>
          • “เดือน 8 ปี 26” / “เดือน 8 ปี 69”<br>
          • “1 เดือน 8 ปี 26” / “1 สิงหาคม 2569” / “1/8/69”<br>
          • “เดือนนี้” / “เดือนที่แล้ว” / “วันนี้” / “เมื่อวาน”
        </div>
        <div id="voiceResult" style="margin-top:18px;text-align:left"></div>
      </div>`;
    document.querySelector('main').appendChild(sec);

    $('voiceSupport').textContent=SpeechRecognition?'พร้อมรับรหัสพนักงานด้วยเสียงภาษาไทย / English ✓':'เบราว์เซอร์นี้ไม่รองรับ Speech Recognition กรุณาใช้ Chrome หรือ Edge';
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
    if(reset){state={step:'idle',type:'',employeeId:'',employeeName:'',startDate:'',endDate:'',periodLabel:''};setStatus('หยุดการรับคำสั่งเสียงแล้ว');}
  }

  function startFlow(){
    if(!SpeechRecognition){alert('อุปกรณ์นี้ไม่รองรับการรับคำสั่งเสียง กรุณาใช้ Chrome หรือ Edge');return;}
    recognitionRetry=0;
    state={step:'type',type:'',employeeId:'',employeeName:'',startDate:'',endDate:'',periodLabel:''};
    $('voiceResult').innerHTML='';setHeard('');
    ask('สวัสดีค่ะ ต้องการตรวจสอบค่าเดินทาง หรือ ตรวจสอบโอทีคะ','type');
  }
  function ask(displayMessage,step,spokenMessage=displayMessage){state.step=step;setStatus(displayMessage);speak(spokenMessage,listen);}
  function listen(){
    if(!SpeechRecognition)return;
    try{recognition&&recognition.abort();}catch(_){ }
    recognition=new SpeechRecognition();
    recognition.lang='th-TH';recognition.interimResults=false;recognition.maxAlternatives=3;recognition.continuous=false;
    recognition.onstart=()=>{$('voiceStart').textContent='🎙️ กำลังฟัง...';if(state.step!=='loading')setStatus('กำลังฟังอยู่ค่ะ พูดได้เลย');};
    recognition.onend=()=>{$('voiceStart').textContent='🎤 เริ่มคำสั่งเสียง';};
    recognition.onerror=e=>{
      const err=String(e&&e.error||'');
      if(err==='aborted')return;
      if(err==='no-speech'){
        setStatus('กำลังรอฟังอยู่ค่ะ พูดได้เลย');
        if(IS_LINE&&IS_ANDROID&&recognitionRetry<1&&!['idle','loading','done'].includes(state.step)){
          recognitionRetry++;
          setTimeout(()=>listen(),500);
        }
        return;
      }
      if(err==='not-allowed'||err==='service-not-allowed'){
        setStatus(IS_LINE&&IS_ANDROID?'กรุณาอนุญาตไมโครโฟนให้ LINE ก่อนใช้งานค่ะ':'กรุณาอนุญาตการใช้ไมโครโฟนก่อนค่ะ');
        return;
      }
      if(err==='audio-capture'){
        setStatus('ยังไม่สามารถเปิดไมโครโฟนได้ค่ะ กรุณาตรวจสิทธิ์ไมโครโฟนแล้วลองใหม่');
        return;
      }
      setStatus('รับเสียงไม่สำเร็จค่ะ กดเริ่มคำสั่งเสียงแล้วลองอีกครั้ง');
    };
    recognition.onresult=e=>{
      recognitionRetry=0;
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
    let raw=normalizeThaiDigits(text).trim().replace(/[–—]/g,'-');
    const upper=raw.toUpperCase();
    const direct=upper.match(/(?:[A-Z]{1,12}(?:-[A-Z0-9]{1,16}|[A-Z0-9]{1,16})|\d{2,16})/);
    if(direct && /[A-Z0-9]/.test(direct[0])) return direct[0].replace(/^-+|-+$/g,'');
    let s=raw.toLowerCase();
    const replacements=[
      ['ดับเบิลยู','W'],['double u','W'],['เอ็กซ์','X'],['เอช','H'],['เอฟ','F'],['แอล','L'],['เอ็ม','M'],['เอ็น','N'],['อาร์','R'],['เอส','S'],['แซด','Z'],
      ['เอ','A'],['บี','B'],['ซี','C'],['ดี','D'],['อี','E'],['จี','G'],['ไอ','I'],['เจ','J'],['เค','K'],['โอ','O'],['พี','P'],['คิว','Q'],['ที','T'],['ยู','U'],['วี','V'],['วาย','Y'],
      ['dee','D'],['vee','V'],['tee','T'],['why','Y'],['em','M'],['en','N'],['bee','B'],['see','C'],['gee','G'],['jay','J'],['kay','K'],['pee','P'],['cue','Q'],['are','R'],['you','U'],['ex','X'],['zed','Z'],
      ['ขีดกลาง','-'],['เครื่องหมายขีด','-'],['ขีด','-'],['dash','-'],['hyphen','-'],
      ['ศูนย์','0'],['หนึ่ง','1'],['เอ็ด','1'],['สอง','2'],['สาม','3'],['สี่','4'],['ห้า','5'],['หก','6'],['เจ็ด','7'],['แปด','8'],['เก้า','9'],
      ['zero','0'],['one','1'],['two','2'],['three','3'],['four','4'],['five','5'],['six','6'],['seven','7'],['eight','8'],['nine','9']
    ];
    for(const [from,to] of replacements){
      s=s.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),` ${to} `);
    }
    let id=s.toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9-]/g,'');
    id=id.replace(/-+/g,'-').replace(/^-+|-+$/g,'');
    return /[A-Z0-9]/.test(id)?id:'';
  }
  function employeeIdSpeech(id){
    const digit={'0':'ศูนย์','1':'หนึ่ง','2':'สอง','3':'สาม','4':'สี่','5':'ห้า','6':'หก','7':'เจ็ด','8':'แปด','9':'เก้า'};
    const letter={A:'เอ',B:'บี',C:'ซี',D:'ดี',E:'อี',F:'เอฟ',G:'จี',H:'เอช',I:'ไอ',J:'เจ',K:'เค',L:'แอล',M:'เอ็ม',N:'เอ็น',O:'โอ',P:'พี',Q:'คิว',R:'อาร์',S:'เอส',T:'ที',U:'ยู',V:'วี',W:'ดับเบิลยู',X:'เอ็กซ์',Y:'วาย',Z:'แซด'};
    return String(id||'').toUpperCase().split('').map(ch=>digit[ch]||letter[ch]||(ch==='-'?'ขีด':ch)).join(' ');
  }

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
  function findMonthByName(s){for(const [name,n] of Object.entries(monthAliases)){if(s.includes(name))return n;}return 0;}
  function monthPeriod(y,m){return {kind:'month',start:ymd(y,m,1),end:ymd(y,m,daysInMonth(y,m)),label:`${monthNames[m]} ${y+543}`};}
  function datePeriod(y,m,d){return validYMD(y,m,d)?{kind:'date',date:ymd(y,m,d),label:thaiDate(ymd(y,m,d))}:null;}
  function parsePeriod(text){
    let s=normalizeThaiDigits(text).trim().toLowerCase().replace(/\s+/g,' ');
    const now=new Date();
    if(/เดือนนี้/.test(s))return monthPeriod(now.getFullYear(),now.getMonth()+1);
    if(/เดือนที่แล้ว|เดือนก่อน/.test(s)){const d=new Date(now.getFullYear(),now.getMonth()-1,1);return monthPeriod(d.getFullYear(),d.getMonth()+1);}
    if(/วันนี้/.test(s))return datePeriod(now.getFullYear(),now.getMonth()+1,now.getDate());
    if(/เมื่อวาน/.test(s)){const d=new Date(now);d.setDate(d.getDate()-1);return datePeriod(d.getFullYear(),d.getMonth()+1,d.getDate());}

    let m=s.match(/(?:วันที่\s*)?(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{2,4})/);
    if(m){const d=+m[1],mo=+m[2],y=normalizeYear(m[3],s);return datePeriod(y,mo,d);}

    m=s.match(/(?:วันที่\s*)?(\d{1,2})\s*(?:เดือน)?\s*(\d{1,2})\s*(?:ปี)?\s*(\d{2,4})/);
    if(m&&/เดือน|ปี|วันที่/.test(s)){const d=+m[1],mo=+m[2],y=normalizeYear(m[3],s);return datePeriod(y,mo,d);}

    let month=findMonthByName(s);
    if(month){
      const nums=(s.match(/\d{1,4}/g)||[]).map(Number);
      let day=0;
      const dayMatch=s.match(/(?:วันที่\s*)?(\d{1,2})\s*(?=[ก-๙])/);
      if(dayMatch)day=+dayMatch[1];
      if(!day){for(const [word,n] of Object.entries(thaiDayWords)){if(new RegExp(`(?:วันที่\\s*)?${word}(?=\\s|${monthNames[month]}|$)`).test(s)){day=n;break;}}}
      let year=0;
      const ym=s.match(/(?:ปี|พ\.?ศ\.?)\s*(\d{2,4})/);if(ym)year=normalizeYear(ym[1],s);
      if(!year){const candidate=[...nums].reverse().find(n=>n>31);if(candidate)year=normalizeYear(candidate,s);}
      if(!year)year=now.getFullYear();
      return day?datePeriod(year,month,day):monthPeriod(year,month);
    }

    m=s.match(/(?:เดือน\s*)?(\d{1,2})\s*(?:ปี\s*)?(\d{2,4})?/);
    if(m&&/เดือน/.test(s)){
      const mo=+m[1];if(mo<1||mo>12)return null;
      const year=m[2]?normalizeYear(m[2],s):now.getFullYear();return monthPeriod(year,mo);
    }

    m=s.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})$/);
    if(m)return datePeriod(normalizeYear(m[3],s),+m[2],+m[1]);
    return null;
  }

  async function post(payload){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const t=await r.text();let x;try{x=JSON.parse(t)}catch{throw Error('Apps Script ตอบกลับไม่ถูกต้อง');}
    if(!x.success)throw Error(x.message||'ค้นข้อมูลไม่สำเร็จ');return x;
  }
  async function getEmployeeName(id){
    const actions=state.type==='travel'?['getTravelSummary','getOTSummary']:['getOTSummary','getTravelSummary'];
    for(const action of actions){
      try{const x=await post({action,employeeId:id,month:'',startDate:'',endDate:''});if(String(x.employeeName||'').trim())return String(x.employeeName).trim();}catch(_){ }
    }
    return '';
  }
  function nameForSpeech(fullName){
    const parts=String(fullName||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return '';
    const first=parts.shift(),last=parts.join(' ');return last?`ชื่อ ${first} นามสกุล ${last}`:`ชื่อ ${first}`;
  }

  async function handleAnswer(text){
    if(state.step==='type'){
      if(/เดินทาง|ค่าเดินทาง/.test(text)){state.type='travel';ask('ขอรหัสพนักงานค่ะ','employee');return;}
      if(/โอ\s*ที|OT|ot|โอที/.test(text)){state.type='ot';ask('ขอรหัสพนักงานค่ะ','employee');return;}
      ask('ขออีกครั้งนะคะ ต้องการเช็กค่าเดินทาง หรือโอทีคะ','type');return;
    }
    if(state.step==='employee'){
      const id=parseEmployeeId(text);
      if(!id){ask('ขอรหัสพนักงานอีกครั้งค่ะ','employee');return;}
      state.employeeId=id;
      setHeard(`รหัสพนักงาน: ${id}`);
      setStatus(`กำลังตรวจสอบรหัสพนักงาน ${id}...`);
      state.employeeName=await getEmployeeName(id);
      const nameText=state.employeeName?` • ${state.employeeName}`:'';
      const spokenName=state.employeeName?` ${nameForSpeech(state.employeeName)}`:' ยังไม่พบชื่อในรายการย้อนหลัง';
      ask(`รหัสพนักงาน ${id}${nameText} • ต้องการตรวจสอบช่วงไหน`,'start',`รหัสพนักงาน ${employeeIdSpeech(id).replace('ดี วี ที','ดีวีที').replace(/ ขีด /g,' ')}${spokenName} ต้องการตรวจสอบช่วงไหนคะ`);
      return;
    }
    if(state.step==='start'){
      const p=parsePeriod(text);
      if(!p){ask('ได้ยินช่วงเวลาไม่ชัดค่ะ ลองพูดชื่อเดือน เช่น สิงหาคม หรือพูด 1 เดือน 8 ปี 26 อีกครั้งนะคะ','start');return;}
      if(p.kind==='month'){
        state.startDate=p.start;state.endDate=p.end;state.periodLabel=p.label;state.step='loading';
        setStatus(`กำลังตรวจสอบข้อมูลเดือน ${p.label}...`);speak(`ได้ค่ะ จะตรวจสอบทั้งเดือน ${p.label} กำลังค้นข้อมูลให้นะคะ`);lookup();return;
      }
      state.startDate=p.date;state.periodLabel=p.label;
      ask(`เริ่มวันที่ ${p.label} • กรุณาระบุวันที่สิ้นสุด`,'end',`ได้ค่ะ เริ่มวันที่ ${p.label} แล้ววันที่สิ้นสุดเป็นวันไหนคะ`);return;
    }
    if(state.step==='end'){
      const p=parsePeriod(text);
      if(!p){ask('ได้ยินวันที่สิ้นสุดไม่ชัดค่ะ ลองพูดใหม่อีกครั้งนะคะ','end');return;}
      const d=p.kind==='month'?p.end:p.date;
      if(d<state.startDate){ask('วันที่สิ้นสุดอยู่ก่อนวันที่เริ่มต้นค่ะ ขอวันที่สิ้นสุดใหม่อีกครั้งนะคะ','end');return;}
      state.endDate=d;state.periodLabel=`${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}`;state.step='loading';
      setStatus('กำลังตรวจสอบข้อมูลจากฐานข้อมูล...');speak('ได้ค่ะ กำลังเช็กข้อมูลให้ รอสักครู่นะคะ');lookup();
    }
  }

  function groupByDate(rows){
    const map={};(rows||[]).forEach(r=>{const d=String(r.date||'').slice(0,10)||'ไม่ระบุวันที่';(map[d]||(map[d]=[])).push(r);});
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  }
  function attachmentLinks(r){
    const links=[];
    if(r.receiptOutUrl)links.push(`<a href="${esc(r.receiptOutUrl)}" target="_blank" rel="noopener">ขาไป</a>`);
    if(r.receiptBackUrl)links.push(`<a href="${esc(r.receiptBackUrl)}" target="_blank" rel="noopener">ขากลับ</a>`);
    return links.length?links.join(' / '):'-';
  }
  function renderTravelDays(rows){
    if(!rows.length)return '<div class="voice-empty">ไม่พบรายละเอียดค่าเดินทางในช่วงที่เลือก</div>';
    return `<div class="voice-daily"><h3>📅 รายละเอียดค่าเดินทางรายวัน</h3>${groupByDate(rows).map(([date,items])=>{
      const km=items.reduce((s,r)=>s+Number(r.totalKm||0),0),amount=items.reduce((s,r)=>s+Number(r.amount||0),0);
      return `<div class="voice-day"><div class="voice-day-head"><strong>${thaiDate(date)} • ${items.length} รายการ</strong><span class="voice-day-total">${num(km)} กม. • ${num(amount)} บาท</span></div><div class="voice-detail-wrap"><table class="voice-detail-table"><thead><tr><th>ต้นทาง → ปลายทาง</th><th>สาเหตุ</th><th>ประเภท</th><th>ระยะทาง</th><th>ค่าเดินทาง</th><th>เอกสาร</th><th>สถานะ</th></tr></thead><tbody>${items.map(r=>`<tr><td>${esc(r.origin||'-')} → ${esc(r.destination||'-')}</td><td>${esc(r.travelReason||'-')}</td><td>${esc(r.transportType||'-')}</td><td>${num(r.totalKm)} กม.</td><td>${num(r.amount)} บาท</td><td>${attachmentLinks(r)}</td><td>${esc(r.status||'-')}</td></tr>`).join('')}</tbody></table></div></div>`;
    }).join('')}</div>`;
  }
  function renderOTDays(rows){
    if(!rows.length)return '<div class="voice-empty">ไม่พบรายละเอียด OT ในช่วงที่เลือก</div>';
    return `<div class="voice-daily"><h3>📅 รายละเอียด OT รายวัน</h3>${groupByDate(rows).map(([date,items])=>{
      const comp=items.reduce((s,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
      const paid=items.reduce((s,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
      const total=items.reduce((s,r)=>s+Number(r.hours||0),0);
      return `<div class="voice-day"><div class="voice-day-head"><strong>${thaiDate(date)} • ${items.length} รายการ</strong><span class="voice-day-total">ชด ${num(comp)} ชม. • จ่าย ${num(paid)} ชม. • รวม ${num(total)} ชม.</span></div><div class="voice-detail-wrap"><table class="voice-detail-table"><thead><tr><th>สาขา</th><th>เวลา</th><th>ชั่วโมง</th><th>ประเภท OT</th><th>เหตุผล</th><th>สถานะ</th></tr></thead><tbody>${items.map(r=>`<tr><td>${esc(r.branch||'-')}</td><td>${esc(r.startTime||'-')} - ${esc(r.endTime||'-')}</td><td>${num(r.hours)}</td><td>${esc(r.otType||'-')}</td><td>${esc(r.reason||'-')}</td><td>${esc(r.status||'-')}</td></tr>`).join('')}</tbody></table></div></div>`;
    }).join('')}</div>`;
  }

  async function lookup(){
    try{
      if(state.type==='travel'){
        const x=await post({action:'getTravelSummary',employeeId:state.employeeId,startDate:state.startDate,endDate:state.endDate,month:''});
        const rows=(x.records||[]).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
        const count=Number(x.totals?.count||rows.length||0),km=Number(x.totals?.totalKm||0),amount=Number(x.totals?.totalAmount||0);
        const name=x.employeeName||state.employeeName||'';state.employeeName=name;
        const message=count?`พบข้อมูลค่าเดินทาง ${count} รายการ ระยะทางรวม ${num(km)} กิโลเมตร ค่าเดินทางรวม ${num(amount)} บาทค่ะ`:`ไม่พบข้อมูลค่าเดินทางของรหัสพนักงาน ${employeeIdSpeech(state.employeeId)} ในช่วงที่เลือกค่ะ`;
        $('voiceResult').innerHTML=`<div class="summary-panel"><h3>🚙 สรุปค่าเดินทาง</h3><div class="voice-emp">รหัสพนักงาน ${esc(state.employeeId)}${name?` • ${esc(name)}`:''}</div><p><b>ช่วงเวลา:</b> ${esc(state.periodLabel||`${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}`)}</p><div class="metric-grid"><div class="metric"><small>จำนวนรายการ</small><strong>${count}</strong></div><div class="metric"><small>ระยะทางรวม</small><strong>${num(km)} กม.</strong></div><div class="metric"><small>ค่าเดินทางรวม</small><strong>${num(amount)} บาท</strong></div></div>${renderTravelDays(rows)}</div>`;
        setStatus(message);speak(message+' รายละเอียดแยกตามวันแสดงอยู่ด้านล่างค่ะ');
      }else{
        const x=await post({action:'getOTSummary',employeeId:state.employeeId,startDate:state.startDate,endDate:state.endDate,month:''});
        const rows=(x.records||[]).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
        const count=Number(x.totals?.count||rows.length||0);
        const comp=rows.reduce((s,r)=>/ชดชั่วโมง/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
        const paid=rows.reduce((s,r)=>/ทำจ่ายเงิน/i.test(String(r.otType||''))?s+Number(r.hours||0):s,0);
        const total=rows.reduce((s,r)=>s+Number(r.hours||0),0);
        const name=x.employeeName||state.employeeName||'';state.employeeName=name;
        const message=count?`พบโอที ${count} รายการ โอทีชดชั่วโมง ${num(comp)} ชั่วโมง โอทีทำจ่ายเงิน ${num(paid)} ชั่วโมง รวม ${num(total)} ชั่วโมงค่ะ`:`ไม่พบข้อมูลโอทีของรหัสพนักงาน ${employeeIdSpeech(state.employeeId)} ในช่วงที่เลือกค่ะ`;
        $('voiceResult').innerHTML=`<div class="summary-panel"><h3>⏰ สรุป OT</h3><div class="voice-emp">รหัสพนักงาน ${esc(state.employeeId)}${name?` • ${esc(name)}`:''}</div><p><b>ช่วงเวลา:</b> ${esc(state.periodLabel||`${thaiDate(state.startDate)} - ${thaiDate(state.endDate)}`)}</p><div class="metric-grid"><div class="metric"><small>OT ชดชั่วโมง</small><strong>${num(comp)} ชม.</strong></div><div class="metric"><small>OT ทำจ่ายเงิน</small><strong>${num(paid)} ชม.</strong></div><div class="metric"><small>OT รวม</small><strong>${num(total)} ชม.</strong></div></div>${renderOTDays(rows)}</div>`;
        setStatus(message);speak(message+' รายละเอียดแยกตามวันแสดงอยู่ด้านล่างค่ะ');
      }
      state.step='done';
    }catch(e){setStatus('เกิดข้อผิดพลาด: '+e.message);speak('ไม่สามารถตรวจสอบข้อมูลได้ค่ะ กรุณาลองใหม่อีกครั้ง');state.step='idle';}
  }

  function boot(){appendUI();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();