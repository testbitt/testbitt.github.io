import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const j=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
const te=new TextEncoder();
function fromB64url(s:string){const p=s.replaceAll("-","+").replaceAll("_","/");const pad=p+"=".repeat((4-(p.length%4))%4);const raw=atob(pad);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function hex(bytes:Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
function b64url(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
function randomToken(n=18){const b=new Uint8Array(n);crypto.getRandomValues(b);return b64url(b)}
async function hmacHex(message:string){const key=await crypto.subtle.importKey("raw",te.encode(SERVICE_ROLE_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,te.encode(message));return hex(new Uint8Array(sig));}
async function verifyAdminToken(token:string){const [payload,sig]=token.split(".");if(!payload||!sig||(await hmacHex(payload))!==sig)return false;try{const obj=JSON.parse(new TextDecoder().decode(fromB64url(payload)));return obj.role==="admin"&&Number(obj.exp)>Date.now()}catch{return false}}
function bearer(req:Request){const h=req.headers.get("authorization")||"";return h.toLowerCase().startsWith("bearer ")?h.slice(7).trim():""}
async function pbkdf2(password:string,salt:string){const key=await crypto.subtle.importKey("raw",te.encode(password),{name:"PBKDF2"},false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:fromB64url(salt),iterations:140000},key,256);return hex(new Uint8Array(bits));}
async function getDataset(type:string){
 const{data,error}=await db.from("kamu_inventory_datasets").select("payload,metadata,updated_at").is("owner_id",null).eq("dataset_type",type).maybeSingle();
 if(error)throw error;if(!data)return null;
 if(data.metadata?.storage!=="chunks-v1"||!data.metadata?.upload_id)return data;
 const{data:chunks,error:chunkError}=await db.from("kamu_inventory_dataset_chunks").select("chunk_index,payload").eq("upload_id",data.metadata.upload_id).order("chunk_index");
 if(chunkError)throw chunkError;
 data.payload=(chunks||[]).flatMap((x:any)=>Array.isArray(x.payload)?x.payload:[]);
 return data;
}
async function saveDataset(type:string,payload:unknown,metadata:Record<string,unknown>){let{data:existing,error:e1}=await db.from("kamu_inventory_datasets").select("id").is("owner_id",null).eq("dataset_type",type).maybeSingle();if(e1)throw e1;const row={owner_id:null,dataset_type:type,payload,metadata,updated_at:new Date().toISOString()};if(existing?.id){const{error}=await db.from("kamu_inventory_datasets").update(row).eq("id",existing.id);if(error)throw error}else{const{error}=await db.from("kamu_inventory_datasets").insert(row);if(error)throw error}}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return j({ok:false,error:"METHOD_NOT_ALLOWED"},405);
 if(!await verifyAdminToken(bearer(req)))return j({ok:false,error:"UNAUTHORIZED"},401);
 let body:any;try{body=await req.json()}catch{return j({ok:false,error:"INVALID_JSON"},400)}
 try{
  const action=String(body?.action||"");
  if(action==="load"){
    const[stock,item]=await Promise.all([getDataset("stock"),getDataset("item")]);
    return j({ok:true,datasets:{stock:stock?.payload||[],item:item?.payload||[]},metadata:{stock:stock?.metadata||{},item:item?.metadata||{}}});
  }
  if(action==="save"){
    const type=String(body?.dataset_type||"");if(!["stock","item"].includes(type))return j({ok:false,error:"INVALID_DATASET"},400);
    await saveDataset(type,body.payload??[],body.metadata||{});
    await db.from("kamu_inventory_logs").insert({user_id:null,username:"admin",event_type:"ADMIN_UPLOAD_"+type.toUpperCase(),detail:{file_name:body.metadata?.file_name||"",rows:body.metadata?.rows||0,branches:body.metadata?.branches||0,stock_date:body.metadata?.stock_date||""}});
    return j({ok:true});
  }
  if(action==="create_user"){
    const username=String(body?.username||"").trim().toLowerCase(),password=String(body?.password||"");
    if(username.length<2||username.length>40)return j({ok:false,error:"USERNAME_LENGTH"},400);
    if(!/^[a-z0-9._-]+$/.test(username))return j({ok:false,error:"USERNAME_FORMAT"},400);
    if(password.length<4||password.length>100)return j({ok:false,error:"PASSWORD_LENGTH"},400);
    const{data:dup}=await db.from("kamu_inventory_users").select("id").ilike("username",username).maybeSingle();
    if(dup)return j({ok:false,error:"USERNAME_EXISTS"},409);
    const salt=randomToken(),password_hash=await pbkdf2(password,salt);
    const{data:user,error}=await db.from("kamu_inventory_users").insert({username,password_hash,password_salt:salt,is_active:true}).select("id,username,is_active,created_at,last_login_at").single();
    if(error){if(String(error.message||"").includes("USER_LIMIT_REACHED"))return j({ok:false,error:"USER_LIMIT_REACHED"},409);throw error}
    await db.from("kamu_inventory_logs").insert({user_id:user.id,username:user.username,event_type:"ADMIN_CREATE_USER",detail:{created_by:"admin"}});
    return j({ok:true,user});
  }
  if(action==="delete_user"){
    const userId=String(body?.user_id||"");if(!userId)return j({ok:false,error:"USER_NOT_FOUND"},404);
    const{data:user,error:ue}=await db.from("kamu_inventory_users").select("id,username").eq("id",userId).maybeSingle();if(ue)throw ue;if(!user)return j({ok:false,error:"USER_NOT_FOUND"},404);
    await db.from("kamu_inventory_logs").insert({user_id:user.id,username:user.username,event_type:"ADMIN_DELETE_USER",detail:{deleted_by:"admin"}});
    const{error}=await db.from("kamu_inventory_users").delete().eq("id",user.id);if(error)throw error;
    return j({ok:true,username:user.username});
  }
  if(action==="reset_password"){
    const userId=String(body?.user_id||""),password=String(body?.password||"");
    if(!userId)return j({ok:false,error:"USER_NOT_FOUND"},404);
    if(password.length<4||password.length>100)return j({ok:false,error:"PASSWORD_LENGTH"},400);
    const{data:user,error:ue}=await db.from("kamu_inventory_users").select("id,username").eq("id",userId).maybeSingle();if(ue)throw ue;if(!user)return j({ok:false,error:"USER_NOT_FOUND"},404);
    const salt=randomToken(),password_hash=await pbkdf2(password,salt);
    const{error}=await db.from("kamu_inventory_users").update({password_hash,password_salt:salt}).eq("id",userId);if(error)throw error;
    await db.from("kamu_inventory_sessions").delete().eq("user_id",userId);
    await db.from("kamu_inventory_logs").insert({user_id:userId,username:user.username,event_type:"ADMIN_RESET_PASSWORD",detail:{reset:true}});
    return j({ok:true,username:user.username});
  }
  return j({ok:false,error:"UNKNOWN_ACTION"},400);
 }catch(e){console.error(e);return j({ok:false,error:"SERVER_ERROR",message:String(e?.message||e)},500)}
});
