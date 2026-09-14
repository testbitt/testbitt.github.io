/* Version 3.24 — Inventory Audit cloud history */
(()=>{
const H='https://jbagitudrjpentdneiju.supabase.co/functions/v1/kamu-inventory-history';
const role=()=>localStorage.getItem('kamuInvCloudRole')||'';
const auth=()=>localStorage.getItem('kamuInvCloudToken')||'';
async function histApi(action,data={}){const h={'Content-Type':'application/json'};h['Authorization']=['Bearer',auth()].join(' ');const r=await fetch(H,{method:'POST',headers:h,body:JSON.stringify({action,...data})});const x=await r.json();if(!r.ok||x.ok===false)throw Error(x.message||x.error||'Cloud History error');return x}
window.kamuInventoryHistoryApi=histApi;
})();
