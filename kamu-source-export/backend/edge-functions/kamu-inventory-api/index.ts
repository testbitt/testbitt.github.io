import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_PASS_HASH = "28995a2c0d04b66d5c7c818536bb00cd1fc1ac422aea47627de0999782fee3f4";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const j = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });

const te = new TextEncoder();
function bytesToHex(bytes: Uint8Array) { return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function b64url(bytes: Uint8Array) { let s=""; for(const b of bytes)s+=String.fromCharCode(b); return btoa(s).replaceAll("+","-").replaceAll("/","_").replaceAll("=",""); }
function b64urlText(s: string) { return b64url(te.encode(s)); }
function fromB64url(s: string) { const p=s.replaceAll("-","+").replaceAll("_","/"); const pad=p+"=".repeat((4-(p.length%4))%4); const raw=atob(pad); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
async function sha256Hex(s:string){const d=await crypto.subtle.digest("SHA-256",te.encode(s));return bytesToHex(new Uint8Array(d));}
function randomToken(n=32){const b=new Uint8Array(n);crypto.getRandomValues(b);return b64url(b);}
async function pbkdf2(password:string,salt:string){const key=await crypto.subtle.importKey("raw",te.encode(password),{name:"PBKDF2"},false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:fromB64url(salt),iterations:140000},key,256);return bytesToHex(new Uint8Array(bits));}
async function hmacHex(message:string){const key=await crypto.subtle.importKey("raw",te.encode(SERVICE_ROLE_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,te.encode(message));return bytesToHex(new Uint8Array(sig));}
async function makeAdminToken(){const payload=b64urlText(JSON.stringify({role:"admin",exp:Date.now()+12*60*60*1000,nonce:randomToken(12)}));return `${payload}.${await hmacHex(payload)}`;}
async function verifyAdminToken(token:string){const [payload,sig]=token.split(".");if(!payload||!sig||(await hmacHex(payload))!==sig)return false;try{const obj=JSON.parse(new TextDecoder().decode(fromB64url(payload)));return obj.role==="admin"&&Number(obj.exp)>Date.now()}catch{return false}}
function bearer(req:Request){const h=req.headers.get("authorization")||"";return h.toLowerCase().startsWith("bearer ")?h.slice(7).trim():""}
async function userFromToken(token:string){if(!token||token.includes("."))return null;const token_hash=await sha256Hex(token);const{data:session}=await db.from("kamu_inventory_sessions").select("user_id,expires_at").eq("token_hash",token_hash).gt("expires_at",new Date().toISOString()).maybeSingle();if(!session)return null;const{data:user}=await db.from("kamu_inventory_users").select("id,username,is_active,created_at,last_login_at").eq("id",session.user_id).eq("is_active",true).maybeSingle();return user||null}
async function logEvent(event_type:string,user_id:string|null,username:string|null,detail:Record<string,unknown>={}){await db.from("kamu_inventory_logs").insert({user_id,username,event_type,detail})}
async function materializeDataset(row:any,type:string){
 if(!row)return null;
 if(row.metadata?.storage!=="chunks-v1"||!row.metadata?.upload_id)return row;
 const{data,error}=await db.from("kamu_inventory_dataset_chunks").select("chunk_index,payload").eq("upload_id",row.metadata.upload_id).order("chunk_index");
 if(error)throw error;
 const records=(data||[]).flatMap((x:any)=>Array.isArray(x.payload)?x.payload:[]);
 if(type==="bom"){
  row.payload={recipe:records.filter((x:any)=>x?.section==="recipe").map((x:any)=>x.row),wip:records.filter((x:any)=>x?.section==="wip").map((x:any)=>x.row)};
 }else row.payload=records;
 return row;
}
async function getDataset(owner_id:string|null,type:string){let q=db.from("kamu_inventory_datasets").select("payload,metadata,updated_at").eq("dataset_type",type);q=owner_id?q.eq("owner_id",owner_id):q.is("owner_id",null);const{data,error}=await q.maybeSingle();if(error)throw error;return materializeDataset(data,type)}
async function saveDataset(owner_id:string|null,type:string,payload:unknown,metadata:Record<string,unknown>){let q=db.from("kamu_inventory_datasets").select("id").eq("dataset_type",type);q=owner_id?q.eq("owner_id",owner_id):q.is("owner_id",null);const{data:existing}=await q.maybeSingle();const row={owner_id,dataset_type:type,payload,metadata,updated_at:new Date().toISOString()};if(existing?.id){const{error}=await db.from("kamu_inventory_datasets").update(row).eq("id",existing.id);if(error)throw error}else{const{error}=await db.from("kamu_inventory_datasets").insert(row);if(error)throw error}}
async function getCustomChecks(user_id:string){const{data}=await db.from("kamu_inventory_custom_checks").select("name,rm_codes").eq("user_id",user_id).order("name");const out:Record<string,string[]>={};for(const r of data||[])out[r.name]=Array.isArray(r.rm_codes)?r.rm_codes:[];return out}
async function getSharedCustomChecks(){const{data,error}=await db.from("kamu_inventory_shared_custom_checks").select("name,rm_codes,updated_at").eq("is_active",true).order("name");if(error)throw error;return data||[]}
async function getCounts(user_id:string){const{data}=await db.from("kamu_inventory_counts").select("branch_code,stock_date,rm_code,count_value").eq("user_id",user_id);return data||[]}
async function loadBundle(user_id:string){const[stock,item,bom,convert,cupMapping,usageSource,ratio,customChecks,counts]=await Promise.all([getDataset(user_id,"stock"),getDataset(user_id,"item"),getDataset(null,"bom"),getDataset(null,"convert"),getDataset(null,"cup_mapping"),getDataset(null,"usage_source"),getDataset(null,"ratio"),getCustomChecks(user_id),getCounts(user_id)]);return{datasets:{stock:stock?.payload||[],item:item?.payload||[],bom:bom?.payload||{recipe:[],wip:[]},convert:convert?.payload||[],cup_mapping:cupMapping?.payload||[],usage_source:usageSource?.payload||[],ratio:ratio?.payload||[]},metadata:{stock:stock?.metadata||{},item:item?.metadata||{},bom:bom?.metadata||{},convert:convert?.metadata||{},cup_mapping:cupMapping?.metadata||{},usage_source:usageSource?.metadata||{},ratio:ratio?.metadata||{}},customChecks,counts}}

function ownerScope(user_id:string|null){return user_id?`user:${user_id}`:"admin"}
async function beginUpload(owner_id:string|null,username:string,type:string,expected_chunks:number,expected_rows:number,metadata:any){
 const scope=ownerScope(owner_id);
 const{data,error}=await db.from("kamu_inventory_uploads").insert({owner_scope:scope,owner_id,username,dataset_type:type,expected_chunks,expected_rows,metadata:metadata||{}}).select("id").single();
 if(error)throw error;return data.id as string;
}
async function ownedUpload(upload_id:string,owner_id:string|null){
 const scope=ownerScope(owner_id);const{data,error}=await db.from("kamu_inventory_uploads").select("id,owner_scope,owner_id,username,dataset_type,status,expected_chunks,expected_rows,metadata").eq("id",upload_id).eq("owner_scope",scope).maybeSingle();
 if(error)throw error;return data||null;
}
async function uploadChunk(upload:any,chunk_index:number,payload:any[]){
 if(upload.status!=="staging")throw Error("UPLOAD_NOT_STAGING");
 if(!Number.isInteger(chunk_index)||chunk_index<0||chunk_index>=upload.expected_chunks)throw Error("INVALID_CHUNK_INDEX");
 if(!Array.isArray(payload)||payload.length>500)throw Error("INVALID_CHUNK_PAYLOAD");
 const row={upload_id:upload.id,owner_scope:upload.owner_scope,dataset_type:upload.dataset_type,chunk_index,row_count:payload.length,payload};
 const{error}=await db.from("kamu_inventory_dataset_chunks").upsert(row,{onConflict:"upload_id,chunk_index"});if(error)throw error;
}
async function commitUpload(upload:any){
 const{data:chunks,error}=await db.from("kamu_inventory_dataset_chunks").select("chunk_index,row_count").eq("upload_id",upload.id).order("chunk_index");if(error)throw error;
 const received=chunks||[],rows=received.reduce((s:number,x:any)=>s+Number(x.row_count||0),0);
 if(received.length!==upload.expected_chunks||rows!==upload.expected_rows)throw Error(`UPLOAD_INCOMPLETE:${received.length}/${upload.expected_chunks}:${rows}/${upload.expected_rows}`);
 const metadata={...(upload.metadata||{}),storage:"chunks-v1",upload_id:upload.id,chunk_count:received.length,rows};
 await saveDataset(upload.owner_id,upload.dataset_type,[],metadata);
 const{error:updateError}=await db.from("kamu_inventory_uploads").update({status:"committed",committed_at:new Date().toISOString()}).eq("id",upload.id);if(updateError)throw updateError;
 const{data:old}=await db.from("kamu_inventory_uploads").select("id").eq("owner_scope",upload.owner_scope).eq("dataset_type",upload.dataset_type).eq("status","committed").neq("id",upload.id);
 if(old?.length)await db.from("kamu_inventory_uploads").delete().in("id",old.map((x:any)=>x.id));
 return{chunks:received.length,rows};
}

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return j({ok:false,error:"METHOD_NOT_ALLOWED"},405);
 let body:any;try{body=await req.json()}catch{return j({ok:false,error:"INVALID_JSON"},400)}
 const action=String(body?.action||"");
 try{
  if(action==="register"){
   return j({ok:false,error:"REGISTRATION_DISABLED"},403);
  }
  if(action==="login"){
   const username=String(body.username||"").trim().toLowerCase(),password=String(body.password||"");const{data:user}=await db.from("kamu_inventory_users").select("id,username,password_hash,password_salt,is_active,created_at").ilike("username",username).maybeSingle();if(!user||!user.is_active)return j({ok:false,error:"INVALID_LOGIN"},401);const h=await pbkdf2(password,user.password_salt);if(h!==user.password_hash){await logEvent("LOGIN_FAILED",user.id,user.username,{});return j({ok:false,error:"INVALID_LOGIN"},401)}const token=randomToken();await db.from("kamu_inventory_sessions").insert({user_id:user.id,token_hash:await sha256Hex(token),expires_at:new Date(Date.now()+30*24*60*60*1000).toISOString()});const now=new Date().toISOString();await db.from("kamu_inventory_users").update({last_login_at:now}).eq("id",user.id);await logEvent("LOGIN",user.id,user.username,{});return j({ok:true,role:"user",token,user:{id:user.id,username:user.username,created_at:user.created_at,last_login_at:now}})
  }
  if(action==="admin_login"){
   if((await sha256Hex(String(body.password||"")))!==ADMIN_PASS_HASH){await logEvent("ADMIN_LOGIN_FAILED",null,"admin",{});return j({ok:false,error:"INVALID_LOGIN"},401)}const token=await makeAdminToken();await logEvent("ADMIN_LOGIN",null,"admin",{});return j({ok:true,role:"admin",token})
  }
  const token=bearer(req),isAdmin=await verifyAdminToken(token);
  if(action==="logout"){if(!isAdmin&&token)await db.from("kamu_inventory_sessions").delete().eq("token_hash",await sha256Hex(token));return j({ok:true})}
  if(["begin_upload","upload_chunk","upload_status","commit_upload","abort_upload"].includes(action)){
   const uploadUser=isAdmin?null:await userFromToken(token);if(!isAdmin&&!uploadUser)return j({ok:false,error:"UNAUTHORIZED"},401);
   const owner_id=isAdmin?null:uploadUser.id,username=isAdmin?"admin":uploadUser.username;
   if(action==="begin_upload"){
    const type=String(body.dataset_type||"");
    if(!["stock","item","bom","convert"].includes(type))return j({ok:false,error:"INVALID_DATASET"},400);
    if(!isAdmin&&!["stock","item"].includes(type))return j({ok:false,error:"FORBIDDEN"},403);
    const expected_chunks=Number(body.expected_chunks||0),expected_rows=Number(body.expected_rows||0);
    if(!Number.isInteger(expected_chunks)||expected_chunks<1||expected_chunks>500||!Number.isInteger(expected_rows)||expected_rows<0)return j({ok:false,error:"INVALID_UPLOAD_SIZE"},400);
    const upload_id=await beginUpload(owner_id,username,type,expected_chunks,expected_rows,body.metadata||{});return j({ok:true,upload_id});
   }
   const upload=await ownedUpload(String(body.upload_id||""),owner_id);if(!upload)return j({ok:false,error:"UPLOAD_NOT_FOUND"},404);
   if(!isAdmin&&!["stock","item"].includes(upload.dataset_type))return j({ok:false,error:"FORBIDDEN"},403);
   if(action==="upload_chunk"){
    await uploadChunk(upload,Number(body.chunk_index),body.payload);const{count}=await db.from("kamu_inventory_dataset_chunks").select("id",{count:"exact",head:true}).eq("upload_id",upload.id);return j({ok:true,received_chunks:count||0,expected_chunks:upload.expected_chunks});
   }
   if(action==="upload_status"){
    const{data}=await db.from("kamu_inventory_dataset_chunks").select("chunk_index,row_count").eq("upload_id",upload.id).order("chunk_index");return j({ok:true,status:upload.status,received_chunks:data?.length||0,expected_chunks:upload.expected_chunks,received_rows:(data||[]).reduce((s:number,x:any)=>s+Number(x.row_count||0),0),expected_rows:upload.expected_rows});
   }
   if(action==="abort_upload"){if(upload.status==="staging")await db.from("kamu_inventory_uploads").delete().eq("id",upload.id);return j({ok:true})}
   const result=await commitUpload(upload);const event_type=(isAdmin?"ADMIN_UPLOAD_":"UPLOAD_")+String(upload.dataset_type).toUpperCase();
   await logEvent(event_type,owner_id,username,{file_name:upload.metadata?.file_name||"",rows:result.rows,branches:upload.metadata?.branches||0,stock_date:upload.metadata?.stock_date||"",chunks:result.chunks});return j({ok:true,...result});
  }
  if(action==="load_shared_custom_checks"){
   const sharedUser=isAdmin?null:await userFromToken(token);if(!isAdmin&&!sharedUser)return j({ok:false,error:"UNAUTHORIZED"},401);
   const rows=await getSharedCustomChecks();
   return j({ok:true,groups:rows});
  }
  if(action==="admin_save_shared_custom_check"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);
   const name=String(body.name||"").trim(),codes=Array.isArray(body.rm_codes)?[...new Set(body.rm_codes.map((x:any)=>String(x||"").trim()).filter(Boolean))]:[];
   if(!name||name.length>120)return j({ok:false,error:"INVALID_GROUP_NAME"},400);
   if(name.toLowerCase()==="standard"||name.startsWith("🌐"))return j({ok:false,error:"RESERVED_GROUP_NAME"},400);
   if(!codes.length||codes.length>3000)return j({ok:false,error:"INVALID_GROUP_ITEMS"},400);
   const row={name,rm_codes:codes,is_active:true,updated_at:new Date().toISOString()};
   const{error}=await db.from("kamu_inventory_shared_custom_checks").upsert(row,{onConflict:"name"});if(error)throw error;
   await logEvent("ADMIN_SHARE_CUSTOM_CHECK",null,"admin",{name,rows:codes.length});
   return j({ok:true,name,rows:codes.length});
  }
  if(action==="admin_delete_shared_custom_check"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);
   const name=String(body.name||"").trim();if(!name)return j({ok:false,error:"INVALID_GROUP_NAME"},400);
   const{error}=await db.from("kamu_inventory_shared_custom_checks").delete().eq("name",name);if(error)throw error;
   await logEvent("ADMIN_DELETE_SHARED_CUSTOM_CHECK",null,"admin",{name});return j({ok:true});
  }
  if(action==="admin_rename_shared_custom_check"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);
   const oldName=String(body.old_name||"").trim(),newName=String(body.new_name||"").trim();
   if(!oldName||!newName||newName.length>120)return j({ok:false,error:"INVALID_GROUP_NAME"},400);
   if(newName.toLowerCase()==="standard"||newName.startsWith("🌐"))return j({ok:false,error:"RESERVED_GROUP_NAME"},400);
   const{data:dup}=await db.from("kamu_inventory_shared_custom_checks").select("id").eq("name",newName).neq("name",oldName).maybeSingle();
   if(dup)return j({ok:false,error:"GROUP_NAME_EXISTS"},409);
   const{data,error}=await db.from("kamu_inventory_shared_custom_checks").update({name:newName,updated_at:new Date().toISOString()}).eq("name",oldName).select("id").maybeSingle();
   if(error)throw error;if(!data)return j({ok:false,error:"GROUP_NOT_FOUND"},404);
   await logEvent("ADMIN_RENAME_SHARED_CUSTOM_CHECK",null,"admin",{old_name:oldName,new_name:newName});return j({ok:true});
  }
  if(action==="admin_overview"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);const[{data:users},{data:logs},bom,convert,cupMapping,usageSource,ratio]=await Promise.all([db.from("kamu_inventory_users").select("id,username,is_active,created_at,last_login_at").order("created_at"),db.from("kamu_inventory_logs").select("id,user_id,username,event_type,detail,created_at").order("created_at",{ascending:false}).limit(300),getDataset(null,"bom"),getDataset(null,"convert"),getDataset(null,"cup_mapping"),getDataset(null,"usage_source"),getDataset(null,"ratio")]);return j({ok:true,users:users||[],logs:logs||[],masters:{bom:{metadata:bom?.metadata||{},has_data:!!bom},convert:{metadata:convert?.metadata||{},has_data:!!convert},cup_mapping:{metadata:cupMapping?.metadata||{},has_data:!!cupMapping},usage_source:{metadata:usageSource?.metadata||{},has_data:!!usageSource},ratio:{metadata:ratio?.metadata||{},has_data:!!ratio}}})
  }
  if(action==="admin_load_user"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);const user_id=String(body.user_id||"");const{data:user}=await db.from("kamu_inventory_users").select("id,username,is_active,created_at,last_login_at").eq("id",user_id).maybeSingle();if(!user)return j({ok:false,error:"USER_NOT_FOUND"},404);const bundle=await loadBundle(user_id);await logEvent("ADMIN_VIEW_USER",user.id,user.username,{});return j({ok:true,user,...bundle})
  }
  if(action==="admin_load_masters"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);const[stock,item,bom,convert,cupMapping,usageSource,ratio]=await Promise.all([getDataset(null,"stock"),getDataset(null,"item"),getDataset(null,"bom"),getDataset(null,"convert"),getDataset(null,"cup_mapping"),getDataset(null,"usage_source"),getDataset(null,"ratio")]);return j({ok:true,datasets:{stock:stock?.payload||[],item:item?.payload||[],bom:bom?.payload||{recipe:[],wip:[]},convert:convert?.payload||[],cup_mapping:cupMapping?.payload||[],usage_source:usageSource?.payload||[],ratio:ratio?.payload||[]},metadata:{stock:stock?.metadata||{},item:item?.metadata||{},bom:bom?.metadata||{},convert:convert?.metadata||{},cup_mapping:cupMapping?.metadata||{},usage_source:usageSource?.metadata||{},ratio:ratio?.metadata||{}}})
  }
  if(action==="admin_save_master"){
   if(!isAdmin)return j({ok:false,error:"UNAUTHORIZED"},401);const type=String(body.dataset_type||"");if(!["bom","convert","cup_mapping","usage_source","ratio","wip_conversion"].includes(type))return j({ok:false,error:"INVALID_DATASET"},400);await saveDataset(null,type,body.payload??[],body.metadata||{});if(body.silent!==true){const eventType=type==="cup_mapping"?"ADMIN_SAVE_CUP_MAPPING":type==="usage_source"?"ADMIN_SAVE_USAGE_SOURCE":"ADMIN_UPLOAD_"+type.toUpperCase();await logEvent(eventType,null,"admin",{file_name:body.metadata?.file_name||"",rows:body.metadata?.rows||0})}return j({ok:true})
  }
  if(action==="load_planning"){
   if(isAdmin){
    const wipConversion=await getDataset(null,"wip_conversion");
    return j({ok:true,wip_conversion:wipConversion?.payload||[],wip_conversion_metadata:wipConversion?.metadata||{},reorder_settings:[]});
   }
   const planningUser=await userFromToken(token);if(!planningUser)return j({ok:false,error:"UNAUTHORIZED"},401);
   const[wipConversion,{data:reorderSettings,error:reorderError}]=await Promise.all([
    getDataset(null,"wip_conversion"),
    db.from("kamu_inventory_reorder_settings").select("branch_code,rm_code,lead_time_days,updated_at").eq("user_id",planningUser.id)
   ]);
   if(reorderError)throw reorderError;
   return j({ok:true,wip_conversion:wipConversion?.payload||[],wip_conversion_metadata:wipConversion?.metadata||{},reorder_settings:reorderSettings||[]});
  }
  if(action==="save_reorder_settings"){
   const planningUser=await userFromToken(token);if(!planningUser)return j({ok:false,error:"UNAUTHORIZED"},401);
   const input=Array.isArray(body.settings)?body.settings:[];
   if(input.length>2000)return j({ok:false,error:"TOO_MANY_SETTINGS"},400);
   const now=new Date().toISOString();
   const rows=input.map((x:any)=>({
    user_id:planningUser.id,
    branch_code:String(x.branch_code||""),
    rm_code:String(x.rm_code||""),
    lead_time_days:Math.max(0,Math.min(365,Math.trunc(Number(x.lead_time_days||0)))),
    updated_at:now
   })).filter((x:any)=>x.rm_code);
   if(rows.length){
    const{error}=await db.from("kamu_inventory_reorder_settings").upsert(rows,{onConflict:"user_id,branch_code,rm_code"});if(error)throw error;
   }
   await logEvent("SAVE_REORDER_SETTINGS",planningUser.id,planningUser.username,{rows:rows.length});
   return j({ok:true,saved:rows.length});
  }
  const user=await userFromToken(token);if(!user)return j({ok:false,error:"UNAUTHORIZED"},401);
  if(action==="load_user"){const bundle=await loadBundle(user.id);return j({ok:true,user,...bundle})}
  if(action==="save_dataset"){
   const type=String(body.dataset_type||"");if(!["stock","item"].includes(type))return j({ok:false,error:"INVALID_DATASET"},400);await saveDataset(user.id,type,body.payload??[],body.metadata||{});await logEvent("UPLOAD_"+type.toUpperCase(),user.id,user.username,{file_name:body.metadata?.file_name||"",rows:body.metadata?.rows||0,branches:body.metadata?.branches||0,stock_date:body.metadata?.stock_date||""});return j({ok:true})
  }
  if(action==="save_custom_checks"){
   const obj=body.custom_checks&&typeof body.custom_checks==="object"?body.custom_checks:{};await db.from("kamu_inventory_custom_checks").delete().eq("user_id",user.id);const rows=Object.entries(obj).map(([name,codes])=>({user_id:user.id,name:String(name),rm_codes:Array.isArray(codes)?codes:[],updated_at:new Date().toISOString()}));if(rows.length){const{error}=await db.from("kamu_inventory_custom_checks").insert(rows);if(error)throw error}return j({ok:true})
  }
  if(action==="save_counts_bulk"){
   const input=Array.isArray(body.counts)?body.counts:[];if(input.length>1000)return j({ok:false,error:"TOO_MANY_COUNTS"},400);const rows=input.map((x:any)=>({user_id:user.id,branch_code:String(x.branch_code||""),stock_date:String(x.stock_date||""),rm_code:String(x.rm_code||""),count_value:x.count_value===null||x.count_value===""?null:Number(x.count_value),updated_at:new Date().toISOString()})).filter((x:any)=>x.branch_code&&x.rm_code);if(rows.length){const{error}=await db.from("kamu_inventory_counts").upsert(rows,{onConflict:"user_id,branch_code,stock_date,rm_code"});if(error)throw error}return j({ok:true,saved:rows.length})
  }
  if(action==="save_count"){
   const row={user_id:user.id,branch_code:String(body.branch_code||""),stock_date:String(body.stock_date||""),rm_code:String(body.rm_code||""),count_value:body.count_value===null||body.count_value===""?null:Number(body.count_value),updated_at:new Date().toISOString()};if(!row.branch_code||!row.rm_code)return j({ok:false,error:"INVALID_COUNT"},400);const{error}=await db.from("kamu_inventory_counts").upsert(row,{onConflict:"user_id,branch_code,stock_date,rm_code"});if(error)throw error;return j({ok:true})
  }
  if(action==="clear_counts"){
   let q=db.from("kamu_inventory_counts").delete().eq("user_id",user.id).eq("branch_code",String(body.branch_code||""));if(body.stock_date!==undefined)q=q.eq("stock_date",String(body.stock_date||""));const{error}=await q;if(error)throw error;return j({ok:true})
  }
  return j({ok:false,error:"UNKNOWN_ACTION"},400)
 }catch(e){console.error(e);return j({ok:false,error:"SERVER_ERROR",message:String(e?.message||e)},500)}
});
