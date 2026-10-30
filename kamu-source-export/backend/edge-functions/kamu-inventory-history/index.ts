import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession:false, autoRefreshToken:false } });
const cors = {
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
};
const enc = new TextEncoder();
const json = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
function bearer(req:Request){const h=req.headers.get("authorization")||"";return h.toLowerCase().startsWith("bearer ")?h.slice(7).trim():""}
function hex(bytes:Uint8Array){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function sha256(s:string){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s))))}
async function userFromToken(token:string){
  if(!token||token.includes("."))return null;
  const token_hash=await sha256(token);
  const {data:session}=await db.from("kamu_inventory_sessions").select("user_id,expires_at").eq("token_hash",token_hash).gt("expires_at",new Date().toISOString()).maybeSingle();
  if(!session)return null;
  const {data:user}=await db.from("kamu_inventory_users").select("id,username,is_active").eq("id",session.user_id).eq("is_active",true).maybeSingle();
  return user||null;
}
async function logEvent(event_type:string,user:any,detail:Record<string,unknown>={}){
  await db.from("kamu_inventory_logs").insert({user_id:user.id,username:user.username,event_type,detail});
}
function cleanText(v:unknown,max=500){return String(v??"").trim().slice(0,max)}
function cleanSnapshot(input:any){
  if(!Array.isArray(input))throw new Error("INVALID_SNAPSHOT");
  if(input.length>2000)throw new Error("TOO_MANY_ROWS");
  return input.map((x:any)=>({
    rm:cleanText(x?.rm,80),desc:cleanText(x?.desc,300),unit:cleanText(x?.unit,80),
    usageSource:cleanText(x?.usageSource,80),usageCupSize:cleanText(x?.usageCupSize,40),
    usageValue:x?.usageValue==null?null:Number(x.usageValue)||0,calc:x?.calc==null?null:Number(x.calc)||0,
    reportTheory:Number(x?.reportTheory)||0,reportActual:Number(x?.reportActual)||0,
    count:x?.count==null||x?.count===""?null:Number(x.count),diff:x?.diff==null?null:Number(x.diff),
    diffp:x?.diffp==null?null:Number(x.diffp),cost:Number(x?.cost)||0,vc:Number(x?.vc)||0,
    status:cleanText(x?.status,80)
  })).filter((x:any)=>x.rm);
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
  let body:any={};try{body=await req.json()}catch{return json({ok:false,error:"INVALID_JSON"},400)}
  try{
    const user=await userFromToken(bearer(req));
    if(!user)return json({ok:false,error:"UNAUTHORIZED"},401);
    const action=String(body.action||"");
    if(action==="list"){
      const {data,error}=await db.from("kamu_inventory_audit_history")
        .select("id,title,branch_code,branch_name,item_sale_date,stock_date,custom_check,note,inspected_at,rows_count,variance_cost,created_at,updated_at")
        .eq("user_id",user.id).order("inspected_at",{ascending:false}).limit(500);
      if(error)throw error;return json({ok:true,items:data||[]});
    }
    if(action==="get"){
      const id=cleanText(body.id,80);const {data,error}=await db.from("kamu_inventory_audit_history").select("*").eq("id",id).eq("user_id",user.id).maybeSingle();if(error)throw error;if(!data)return json({ok:false,error:"NOT_FOUND"},404);return json({ok:true,item:data});
    }
    if(action==="create"){
      const snapshot=cleanSnapshot(body.snapshot);if(!snapshot.length)return json({ok:false,error:"EMPTY_SNAPSHOT"},400);
      const variance=snapshot.reduce((s:number,x:any)=>s+(Number(x.vc)||0),0);
      const row={user_id:user.id,title:cleanText(body.title,150),branch_code:cleanText(body.branch_code,80),branch_name:cleanText(body.branch_name,200),item_sale_date:cleanText(body.item_sale_date,80),stock_date:cleanText(body.stock_date,80),custom_check:cleanText(body.custom_check,150),note:cleanText(body.note,1000),inspected_at:body.inspected_at?new Date(body.inspected_at).toISOString():new Date().toISOString(),rows_count:snapshot.length,variance_cost:variance,snapshot};
      const {data,error}=await db.from("kamu_inventory_audit_history").insert(row).select("*").single();if(error)throw error;await logEvent("AUDIT_HISTORY_CREATE",user,{id:data.id,branch_code:data.branch_code,rows:data.rows_count});return json({ok:true,item:data});
    }
    if(action==="update"){
      const id=cleanText(body.id,80);if(!id)return json({ok:false,error:"INVALID_ID"},400);
      const {data:old}=await db.from("kamu_inventory_audit_history").select("snapshot").eq("id",id).eq("user_id",user.id).maybeSingle();if(!old)return json({ok:false,error:"NOT_FOUND"},404);
      const snapshot=body.snapshot===undefined?(Array.isArray(old.snapshot)?old.snapshot:[]):cleanSnapshot(body.snapshot);
      if(!snapshot.length)return json({ok:false,error:"EMPTY_SNAPSHOT"},400);
      const variance=snapshot.reduce((s:number,x:any)=>s+(Number(x.vc)||0),0);
      const patch:any={updated_at:new Date().toISOString(),rows_count:snapshot.length,variance_cost:variance,snapshot};
      for(const [k,max] of [["title",150],["branch_code",80],["branch_name",200],["item_sale_date",80],["stock_date",80],["custom_check",150],["note",1000]] as const)if(body[k]!==undefined)patch[k]=cleanText(body[k],max);
      if(body.inspected_at!==undefined)patch.inspected_at=new Date(body.inspected_at).toISOString();
      const {data,error}=await db.from("kamu_inventory_audit_history").update(patch).eq("id",id).eq("user_id",user.id).select("*").single();if(error)throw error;await logEvent("AUDIT_HISTORY_UPDATE",user,{id,branch_code:data.branch_code,rows:data.rows_count});return json({ok:true,item:data});
    }
    if(action==="delete"){
      const id=cleanText(body.id,80);const {data,error}=await db.from("kamu_inventory_audit_history").delete().eq("id",id).eq("user_id",user.id).select("id,branch_code").maybeSingle();if(error)throw error;if(!data)return json({ok:false,error:"NOT_FOUND"},404);await logEvent("AUDIT_HISTORY_DELETE",user,{id,branch_code:data.branch_code});return json({ok:true});
    }
    return json({ok:false,error:"UNKNOWN_ACTION"},400);
  }catch(e){console.error(e);return json({ok:false,error:"SERVER_ERROR",message:String((e as any)?.message||e)},500)}
});
