const FETCH_PATH="/api/bizplan";
const $=(id)=>document.getElementById(id);
const out=$("output");
$("btn-generate").addEventListener("click",async()=>{
  const payload={company:$("company").value.trim(),industry:$("industry").value.trim(),target:$("target").value.trim(),product:$("product").value.trim(),revenue:$("revenue").value.trim(),stage:$("stage").value.trim(),goals:$("goals").value.trim(),tone:$("tone").value};
  if(!payload.company||!payload.industry){out.textContent="Please fill in required fields: Company and Industry.";return;}
  out.textContent="Generating plan…";
  try{
    const res=await fetch(FETCH_PATH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    out.textContent=(data.markdown||"").trim();
  }catch(e){out.textContent=`Error generating plan: ${e.message}`;}
});
$("btn-copy").addEventListener("click",async()=>{const t=out.textContent.trim();if(!t)return;try{await navigator.clipboard.writeText(t);}catch(e){}});
$("btn-download").addEventListener("click",()=>{const t=out.textContent.trim();if(!t)return;const blob=new Blob([t],{type:"text/markdown"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bizplan.md";a.click();URL.revokeObjectURL(a.href);});
$("btn-clear").addEventListener("click",()=>{out.textContent="";});
