from pathlib import Path
import re

p=Path('travel-expense/voice-assistant.js')
s=p.read_text()

def sub(pattern,repl,label,count=1):
    global s
    s2,n=re.subn(pattern,repl,s,count=count,flags=re.S)
    if n!=count:
        raise SystemExit(f'{label}: expected {count}, got {n}')
    s=s2

platform_block=r'''  let recognition=null;
  let thaiVoice=null;
  let state={step:'idle',type:'',employeeId:'',employeeName:'',startDate:'',endDate:'',periodLabel:''};
  const ua=navigator.userAgent||'';
  const isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isAndroid=/Android/i.test(ua);
  const isLine=/Line\//i.test(ua);
  const isLineAndroid=isAndroid&&isLine;
  let listenStartedAt=0;
  let silentRetryCount=0;
  const resultCache=new Map();

  function chooseThaiVoice(){
    if(!window.speechSynthesis)return;
    const voices=speechSynthesis.getVoices()||[];
    const thai=voices.filter(v=>/^th(?:-|_)/i.test(v.lang||'')||/thai|ไทย/i.test(v.name||''));
    if(isIOS){
      thaiVoice=thai.find(v=>v.localService&&/kanya|narisa|premwadee|siri|thai|ไทย/i.test(v.name||''))||thai.find(v=>v.localService)||thai[0]||null;
    }else{
      thaiVoice=thai.find(v=>/google.*thai|google.*ไทย/i.test(v.name||''))||thai.find(v=>v.localService)||thai[0]||null;
    }
  }
  chooseThaiVoice();
  if(window.speechSynthesis){
    if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',chooseThaiVoice);
    else speechSynthesis.onvoiceschanged=chooseThaiVoice;
  }

  function speak(text,after){
    if(!window.speechSynthesis){after&&after();return;}
    try{speechSynthesis.cancel();}catch(_){ }
    chooseThaiVoice();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='th-TH';
    if(thaiVoice)u.voice=thaiVoice;
    u.rate=isIOS?0.96:1.04;
    u.pitch=isIOS?1.00:1.06;
    u.volume=1;
    const delay=isLineAndroid?950:260;
    u.onend=()=>after&&setTimeout(after,delay);
    u.onerror=()=>after&&setTimeout(after,delay);
    speechSynthesis.speak(u);
  }

  function setStatus'''
sub(r"  let recognition=null;.*?  function setStatus",platform_block,'platform block')

s=s.replace("$('voiceStart').onclick=startFlow;","$('voiceStart').onclick=()=>{if(state.step&&!['idle','done','loading'].includes(state.step))listen(true);else startFlow();};",1)

sub(r"  function openVoice\(\)\{.*?  function goHome\(\)\{",r'''  function openVoice(){
    ['home','travel','ot','travelSummary','otSummary','adminSummary'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
    $('voiceAssistant').classList.remove('hidden');scrollTo(0,0);
  }
  function goHome(){''','open/warmup block')

s=s.replace("    summaryCache={travel:null,ot:null};","    silentRetryCount=0;",1)

listen_block=r'''  function listen(manual=false){
    if(!SpeechRecognition)return;
    try{recognition&&recognition.abort();}catch(_){ }
    recognition=new SpeechRecognition();
    recognition.lang='th-TH';recognition.interimResults=false;recognition.maxAlternatives=3;recognition.continuous=false;
    listenStartedAt=Date.now();
    recognition.onstart=()=>{$('voiceStart').textContent='🎙️ กำลังฟัง...';setStatus('กำลังฟังอยู่ค่ะ พูดได้เลย');};
    recognition.onend=()=>{$('voiceStart').textContent='🎤 เริ่มคำสั่งเสียง';};
    recognition.onerror=e=>{
      const code=String(e&&e.error||'');
      const elapsed=Date.now()-listenStartedAt;
      if(code==='aborted')return;
      if(code==='no-speech'&&isLineAndroid){
        if(silentRetryCount<2){silentRetryCount++;setStatus('กำลังฟังอยู่ค่ะ พูดได้เลย');setTimeout(()=>listen(false),900);}
        else setStatus('ยังไม่ได้รับเสียงค่ะ แตะปุ่มไมค์แล้วพูดได้เลย');
        return;
      }
      if(code==='no-speech'&&elapsed<1800){setStatus('กำลังฟังอยู่ค่ะ พูดได้เลย');return;}
      if(code==='not-allowed'||code==='service-not-allowed'){
        setStatus(isLineAndroid?'กรุณาอนุญาตไมโครโฟนให้ LINE แล้วแตะปุ่มไมค์อีกครั้ง':'กรุณาอนุญาตการใช้ไมโครโฟน แล้วลองอีกครั้ง');
        return;
      }
      setStatus('รับเสียงไม่สำเร็จค่ะ แตะปุ่มไมค์แล้วลองพูดอีกครั้ง');
    };
    recognition.onresult=e=>{
      silentRetryCount=0;
      const text=Array.from(e.results[0]).map(x=>x.transcript).join(' ');
      setHeard(text);handleAnswer(text);
    };
    try{recognition.start();}catch(_){if(manual)setStatus('แตะปุ่มไมค์อีกครั้งแล้วพูดได้เลย');}
  }

  function normalizeThaiDigits'''
sub(r"  function listen\(\)\{.*?  function normalizeThaiDigits",listen_block,'listen block')

cache_block=r'''  function employeeNameKey(id){return 'kamu_voice_emp_'+String(id||'').toUpperCase();}
  function getEmployeeName(id){
    try{return localStorage.getItem(employeeNameKey(id))||'';}catch(_){return '';}
  }
  function rememberEmployeeName(id,name){
    if(!name)return;
    try{localStorage.setItem(employeeNameKey(id),String(name).trim());}catch(_){ }
  }
  function resultCacheKey(type){return [type,state.employeeId,state.startDate,state.endDate].join('|');}
  async function getSummaryFast(type,action){
    const key=resultCacheKey(type),cached=resultCache.get(key);
    if(cached&&Date.now()-cached.time<300000)return cached.data;
    const x=await post({action,employeeId:state.employeeId,startDate:state.startDate,endDate:state.endDate,month:''});
    resultCache.set(key,{time:Date.now(),data:x});
    const name=String(x.employeeName||x.records?.[0]?.employeeName||'').trim();
    if(name)rememberEmployeeName(state.employeeId,name);
    return x;
  }
  function nameForSpeech'''
sub(r"  async function getEmployeeName\(id\)\{.*?  function nameForSpeech",cache_block,'employee cache block')

sub(r"      setStatus\(`กำลังตรวจสอบรหัสพนักงาน \$\{id\}\.\.\.`\);\n      state\.employeeName=await getEmployeeName\(id\);\n      const nameText=state\.employeeName\?` • \$\{state\.employeeName\}`:'';\n      const spokenName=state\.employeeName\?` \$\{nameForSpeech\(state\.employeeName\)\}`:' ยังไม่พบชื่อในรายการย้อนหลัง';",
    r"""      setStatus(`รับรหัสพนักงาน ${id} แล้วค่ะ`);
      state.employeeName=getEmployeeName(id);
      const nameText=state.employeeName?` • ${state.employeeName}`:'';
      const spokenName=state.employeeName?` ${nameForSpeech(state.employeeName)}`:'';""",'employee step')

sub(r"        const cached=cachedRows\('travel'\);\n        const x=cached===null\?await post\(\{action:'getTravelSummary'.*?const name=x\.employeeName\|\|rows\[0\]\?\.employeeName\|\|state\.employeeName\|\|'';state\.employeeName=name;",
    r"""        const hadName=!!state.employeeName;
        const x=await getSummaryFast('travel','getTravelSummary');
        const rows=(x.records||[]).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
        const count=rows.length,km=rows.reduce((s,r)=>s+Number(r.totalKm||0),0),amount=rows.reduce((s,r)=>s+Number(r.amount||0),0);
        const name=x.employeeName||rows[0]?.employeeName||state.employeeName||'';state.employeeName=name;if(name)rememberEmployeeName(state.employeeId,name);""",'travel lookup')

sub(r"        const cached=cachedRows\('ot'\);\n        const x=cached===null\?await post\(\{action:'getOTSummary'.*?const rows=\(cached===null\?\(x\.records\|\|\[\]\):cached\)\.slice\(\)\.sort\(\(a,b\)=>String\(a\.date\|\|''\)\.localeCompare\(String\(b\.date\|\|''\)\)\);",
    r"""        const hadName=!!state.employeeName;
        const x=await getSummaryFast('ot','getOTSummary');
        const rows=(x.records||[]).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));""",'ot lookup')

s=s.replace("const name=x.employeeName||state.employeeName||'';state.employeeName=name;","const name=x.employeeName||rows[0]?.employeeName||state.employeeName||'';state.employeeName=name;if(name)rememberEmployeeName(state.employeeId,name);",1)
old="setStatus(message);speak(message+' รายละเอียดแยกตามวันแสดงอยู่ด้านล่างค่ะ');"
if s.count(old)!=2:
    raise SystemExit(f'summary speak count {s.count(old)}')
s=s.replace(old,"setStatus(message);speak((!hadName&&name?nameForSpeech(name)+' ':'')+message+' รายละเอียดแยกตามวันแสดงอยู่ด้านล่างค่ะ');",2)

p.write_text(s)

idx=Path('travel-expense/index.html')
h=idx.read_text()
h,n=re.subn(r'voice-assistant\.js\?v=[^"\']+', 'voice-assistant.js?v=20260903-voice15-fast-ios-line', h, count=1)
if n!=1:
    raise SystemExit('index cache ref missing')
idx.write_text(h)
