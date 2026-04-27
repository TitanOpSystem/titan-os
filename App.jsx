import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://unkirihxtruhdjeldfpm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2lyaWh4dHJ1aGRqZWxkZnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTA3MjUsImV4cCI6MjA5MTcyNjcyNX0._Ve9Pr3ooja-YdHYFIupebaZRhDjmJDnz2b-vzrhY04";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── PASSWORD ──────────────────────────────────────────────────────────────────
// Change this to whatever password you want your team to use
const APP_PASSWORD = "PCMFamily2025!";

// ── BRAND ─────────────────────────────────────────────────────────────────────
const B = {
  navy:"#092b49", navyMid:"#293d5c", gold:"#ceb684", goldLight:"#dfc99a",
  white:"#ffffff", text:"#092b49", textMid:"#293d5c", textSoft:"#5a6e84",
  textMute:"#8fa0b2", border:"#d8cdb8", borderLight:"#ede8de",
  bg:"#f9f7f3", bgCard:"#ffffff",
  shadow:"0 2px 16px rgba(9,43,73,0.08)", shadowMd:"0 8px 40px rgba(9,43,73,0.14)",
};

const STAGES = ["Lead","Qualified","Proposal","Negotiation","Closed Won","Closed Lost"];
const STAGE_COLORS = {
  "Lead":        {bg:"#e8f0f8",text:"#293d5c",dot:"#293d5c"},
  "Qualified":   {bg:"#e8f2ec",text:"#1d6b3a",dot:"#2e9e57"},
  "Proposal":    {bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"},
  "Negotiation": {bg:"#fde8d8",text:"#8b3a12",dot:"#d45d1a"},
  "Closed Won":  {bg:"#e0f5e9",text:"#0d5c2b",dot:"#18a850"},
  "Closed Lost": {bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"},
};
const PRIORITY_COLORS = {
  High:  {bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"},
  Medium:{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"},
  Low:   {bg:"#e8f0f8",text:"#293d5c",dot:"#293d5c"},
};
const PROP_TYPES = ["Residential","Commercial","Industrial","Land","Mixed Use","Vacation"];
const LOAN_TYPES = ["Fixed","ARM","Interest Only","Balloon","Bridge","HELOC"];

const fmt = iso => iso ? new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const fmtMoney = n => n != null && n !== "" ? `$${Number(n).toLocaleString()}` : "—";
const fmtPct = n => n != null && n !== "" ? `${Number(n).toFixed(2)}%` : "—";

// DB field mapping
const toClient = obj => {
  if (!obj) return obj;
  const m = {family_id:"familyId",contact_id:"contactId",close_date:"closeDate",due_date:"dueDate",created_at:"createdAt",advisor_name:"advisorName",advisor_email:"advisorEmail",owner_name:"ownerName",property_type:"propertyType",purchase_price:"purchasePrice",purchase_date:"purchaseDate",current_value:"currentValue",loan_balance:"loanBalance",interest_rate:"interestRate",loan_payment:"loanPayment",loan_maturity_date:"loanMaturityDate",loan_type:"loanType",rental_income:"rentalIncome",property_taxes:"propertyTaxes",flood_insurance:"floodInsurance",insurance_company:"insuranceCompany",insurance_premium:"insurancePremium",flood_insurance_company:"floodInsuranceCompany",flood_insurance_premium:"floodInsurancePremium"};
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[m[k]||k,v]));
};
const toDb = obj => {
  if (!obj) return obj;
  const m = {familyId:"family_id",contactId:"contact_id",closeDate:"close_date",dueDate:"due_date",createdAt:"created_at",advisorName:"advisor_name",advisorEmail:"advisor_email",ownerName:"owner_name",propertyType:"property_type",purchasePrice:"purchase_price",purchaseDate:"purchase_date",currentValue:"current_value",loanBalance:"loan_balance",interestRate:"interest_rate",loanPayment:"loan_payment",loanMaturityDate:"loan_maturity_date",loanType:"loan_type",rentalIncome:"rental_income",propertyTaxes:"property_taxes",floodInsurance:"flood_insurance",insuranceCompany:"insurance_company",insurancePremium:"insurance_premium",floodInsuranceCompany:"flood_insurance_company",floodInsurancePremium:"flood_insurance_premium"};
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[m[k]||k,v]));
};

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
function Badge({children,scheme}){
  const s=scheme||{bg:B.borderLight,text:B.navyMid,dot:B.navyMid};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:s.bg,color:s.text,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{children}</span>;
}
function GoldLine(){return <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold},transparent)`,margin:"0 0 16px"}}/>;}
function Spinner(){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",gap:14,flexDirection:"column"}}><div style={{width:34,height:34,border:`3px solid ${B.borderLight}`,borderTop:`3px solid ${B.gold}`,borderRadius:"50%",animation:"pcm-spin 0.8s linear infinite"}}/><style>{`@keyframes pcm-spin{to{transform:rotate(360deg)}}`}</style><div style={{color:B.textMute,fontSize:13}}>Loading…</div></div>;}
function Toast({msg,type}){return <div style={{position:"fixed",bottom:24,right:24,zIndex:9000,background:type==="error"?"#fde8e8":B.navy,color:type==="error"?"#8b1a1a":B.white,padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:B.shadowMd}}>{type==="error"?"⚠ ":"✓ "}{msg}</div>;}

function Modal({title,onClose,wide,children}){
  return <div style={{position:"fixed",inset:0,background:"rgba(9,43,73,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)",overflowY:"auto",padding:"20px"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:B.white,borderRadius:16,padding:36,width:"100%",maxWidth:wide?780:540,boxShadow:B.shadowMd,border:`1px solid ${B.borderLight}`,margin:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:B.textMute,fontSize:20,cursor:"pointer"}}>✕</button>
      </div>
      <GoldLine/>{children}
    </div>
  </div>;
}

const inp={width:"100%",background:B.bg,border:`1px solid ${B.border}`,borderRadius:8,padding:"9px 13px",color:B.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
const Inp=p=><input style={inp} {...p}/>;
const Sel=({children,...p})=><select style={{...inp,cursor:"pointer"}} {...p}>{children}</select>;
const Tex=p=><textarea style={{...inp,minHeight:80,resize:"vertical"}} {...p}/>;

function Field({label,children,half}){
  return <div style={{marginBottom:14,gridColumn:half?"span 1":undefined}}>
    <label style={{display:"block",fontSize:11,color:B.textSoft,marginBottom:5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</label>
    {children}
  </div>;
}
function Grid2({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{children}</div>;}

function Btn({children,onClick,variant="primary",small,disabled,style:ex}){
  const v={primary:{background:B.navy,color:B.white,border:"none"},ghost:{background:"transparent",color:B.navyMid,border:`1px solid ${B.border}`},danger:{background:"#fde8e8",color:"#8b1a1a",border:"1px solid #f5c6c6"},gold:{background:B.gold,color:B.navy,border:"none"}};
  return <button onClick={onClick} disabled={disabled} style={{...v[variant],borderRadius:8,padding:small?"5px 13px":"9px 20px",fontSize:small?12:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.03em",opacity:disabled?.65:1,...ex}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".82";}} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}

function SectionCard({title,children,action}){
  return <div style={{background:B.bgCard,borderRadius:12,padding:24,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>{title}</div>
      {action}
    </div>
    <GoldLine/>{children}
  </div>;
}

// ── PCM LOGO ──────────────────────────────────────────────────────────────────
function PCMLogo({dark=false}){
  if(dark){
    // Sidebar: show color logo on a white pill background so it's visible
    return <div style={{background:"rgba(255,255,255,0.95)",borderRadius:8,padding:"8px 12px",display:"inline-block"}}>
      <img src="/pcm-logo.jpg" alt="PCM Family Office" style={{height:40,width:"auto",display:"block"}}/>
    </div>;
  }
  // Login screen & reports: full color logo on white background
  return <img src="/pcm-logo.jpg" alt="PCM Family Office" style={{height:72,width:"auto",display:"block",margin:"0 auto"}}/>;
}

// ── FAMILY REPORT (Printable) ─────────────────────────────────────────────────
function FamilyReport({family,data,onClose}){
  const printRef=useRef();
  const contacts=data.contacts.filter(c=>c.familyId===family.id);
  const properties=data.properties.filter(p=>p.familyId===family.id);
  const deals=data.deals.filter(d=>d.familyId===family.id);
  const tasks=data.tasks.filter(t=>t.familyId===family.id&&!t.done);
  const notes=data.notes.filter(n=>n.familyId===family.id);
  const totalPortfolioValue=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalLoanBalance=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0),0);
  const totalRentalIncome=properties.reduce((s,p)=>s+(Number(p.rentalIncome)||0),0);
  const openDeals=deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won");

  const print=()=>{
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>PCM Family Report — ${family.name}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Georgia',serif;color:#092b49;background:#fff;padding:40px;font-size:13px;line-height:1.6;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #ceb684;}
      .logo img{height:56px;width:auto;}
      .sub{font-size:9px;letter-spacing:.15em;color:#8fa0b2;margin-top:4px;}
      .tagline{font-size:8px;color:#8fa0b2;letter-spacing:.12em;margin-top:2px;}
      h1{font-size:22px;font-weight:700;margin-bottom:2px;}
      .advisor{font-size:12px;color:#5a6e84;margin-top:4px;}
      .date{font-size:11px;color:#8fa0b2;margin-top:2px;}
      h2{font-size:15px;font-weight:700;color:#092b49;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #ceb684;}
      table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:12px;}
      th{background:#092b49;color:#ceb684;padding:7px 10px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
      td{padding:7px 10px;border-bottom:1px solid #ede8de;color:#293d5c;vertical-align:top;}
      tr:nth-child(even) td{background:#f9f7f3;}
      .stat-row{display:flex;gap:20px;margin-bottom:16px;}
      .stat{background:#f9f7f3;border-radius:8px;padding:12px 16px;flex:1;border-top:2px solid #ceb684;}
      .stat-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8fa0b2;margin-bottom:4px;}
      .stat-value{font-size:18px;font-weight:700;color:#092b49;}
      .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;}
      .footer{margin-top:40px;padding-top:14px;border-top:2px solid #ceb684;display:flex;justify-content:space-between;align-items:center;}
      .footer-left{font-size:10px;color:#8fa0b2;line-height:1.6;}
      .footer-confidential{font-size:11px;font-weight:800;color:#092b49;letter-spacing:0.12em;text-transform:uppercase;text-align:right;}
      .note-item{padding:8px 0;border-bottom:1px solid #ede8de;}
      .note-date{font-size:10px;color:#8fa0b2;margin-top:2px;}
      @media print{body{padding:20px;} .footer{position:fixed;bottom:20px;left:40px;right:40px;}}
    </style></head><body>
    <div class="header">
      <div class="logo">
        <img src="${window.location.origin}/pcm-logo.jpg" alt="PCM Family Office" style="height:60px;width:auto;"/>
        <div class="sub">DISCOVER · SIMPLIFY · EXECUTE</div>
      </div>
      <div style="text-align:right;">
        <h1>${family.name}</h1>
        <div class="advisor">Advisor: ${family.advisorName||"—"} &nbsp;|&nbsp; ${family.advisorEmail||""}</div>
        <div class="date">Report generated: ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat"><div class="stat-label">Portfolio Value</div><div class="stat-value">${fmtMoney(totalPortfolioValue)}</div></div>
      <div class="stat"><div class="stat-label">Loan Balance</div><div class="stat-value">${fmtMoney(totalLoanBalance)}</div></div>
      <div class="stat"><div class="stat-label">Monthly Rental Income</div><div class="stat-value">${fmtMoney(totalRentalIncome)}</div></div>
      <div class="stat"><div class="stat-label">Open Deals</div><div class="stat-value">${openDeals.length}</div></div>
    </div>

    <h2>Contacts &amp; Members</h2>
    <table><thead><tr><th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th>Tags</th></tr></thead><tbody>
    ${contacts.map(c=>`<tr><td>${c.name}</td><td>${c.type}</td><td>${c.email||"—"}</td><td>${c.phone||"—"}</td><td>${c.tags||"—"}</td></tr>`).join("")||"<tr><td colspan='5' style='color:#8fa0b2'>No contacts</td></tr>"}
    </tbody></table>

    <h2>Property Holdings</h2>
    ${properties.map(p=>`
      <table style="margin-bottom:16px;"><thead><tr><th colspan="4">${p.address}${p.ownerName?` — ${p.ownerName}`:""}</th></tr></thead>
      <tbody>
        <tr><td><b>Type</b></td><td>${p.propertyType||"—"}</td><td><b>Purchase Price</b></td><td>${fmtMoney(p.purchasePrice)}</td></tr>
        <tr><td><b>Current Value</b></td><td>${fmtMoney(p.currentValue)}</td><td><b>Purchase Date</b></td><td>${fmt(p.purchaseDate)}</td></tr>
        <tr><td><b>Lender</b></td><td>${p.lender||"—"}</td><td><b>Loan Type</b></td><td>${p.loanType||"—"}</td></tr>
        <tr><td><b>Loan Balance</b></td><td>${fmtMoney(p.loanBalance)}</td><td><b>Interest Rate</b></td><td>${fmtPct(p.interestRate)}</td></tr>
        <tr><td><b>Monthly Payment</b></td><td>${fmtMoney(p.loanPayment)}</td><td><b>Loan Maturity</b></td><td>${fmt(p.loanMaturityDate)}</td></tr>
        <tr><td><b>Rental Income</b></td><td>${fmtMoney(p.rentalIncome)}/mo</td><td><b>Property Taxes</b></td><td>${fmtMoney(p.propertyTaxes)}/yr</td></tr>
        <tr><td><b>Utilities</b></td><td>${fmtMoney(p.utilities)}/mo</td><td><b>Insurance Co.</b></td><td>${p.insuranceCompany||"—"}</td></tr>
        <tr><td><b>Insurance Premium</b></td><td>${fmtMoney(p.insurancePremium)}/yr</td><td><b>Flood Insurance</b></td><td>${p.floodInsurance?`Yes — ${p.floodInsuranceCompany||""}  ${fmtMoney(p.floodInsurancePremium)}/yr`:"No"}</td></tr>
        ${p.notes?`<tr><td><b>Notes</b></td><td colspan="3">${p.notes}</td></tr>`:""}
      </tbody></table>`).join("")||"<p style='color:#8fa0b2'>No properties</p>"}

    <h2>Open Deals &amp; Pipeline</h2>
    <table><thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Close Date</th></tr></thead><tbody>
    ${openDeals.map(d=>`<tr><td>${d.title}</td><td>${d.stage}</td><td>${fmtMoney(d.value)}</td><td>${fmt(d.closeDate)}</td></tr>`).join("")||"<tr><td colspan='4' style='color:#8fa0b2'>No open deals</td></tr>"}
    </tbody></table>

    <h2>Upcoming Tasks &amp; Deadlines</h2>
    <table><thead><tr><th>Task</th><th>Priority</th><th>Due Date</th></tr></thead><tbody>
    ${tasks.sort((a,b)=>a.dueDate>b.dueDate?1:-1).map(t=>`<tr><td>${t.title}</td><td>${t.priority}</td><td>${fmt(t.dueDate)}</td></tr>`).join("")||"<tr><td colspan='3' style='color:#8fa0b2'>No pending tasks</td></tr>"}
    </tbody></table>

    <h2>Activity Notes</h2>
    ${notes.slice(0,10).map(n=>`<div class="note-item"><div>${n.body}</div><div class="note-date">${fmt(n.createdAt)}</div></div>`).join("")||"<p style='color:#8fa0b2'>No notes</p>"}

    <div class="footer">
      <div class="footer-left">
        <strong>PCM Family Office</strong><br/>
        info@pcmfamilyoffice.com &nbsp;·&nbsp; DISCOVER · SIMPLIFY · EXECUTE
      </div>
      <div class="footer-confidential">
        CONFIDENTIAL<br/>
        <span style="font-size:9px;font-weight:400;color:#5a6e84;">Property of PCM Family Office — For Authorized Recipients Only</span>
      </div>
    </div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(()=>{w.print();},400);
  };

  return <Modal title={`Family Report — ${family.name}`} onClose={onClose} wide>
    <div style={{color:B.textSoft,fontSize:13,marginBottom:20}}>This report includes all contacts, properties, deals, tasks, and notes for <strong>{family.name}</strong>.</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {[
        {label:"Contacts",value:data.contacts.filter(c=>c.familyId===family.id).length},
        {label:"Properties",value:properties.length},
        {label:"Portfolio Value",value:fmtMoney(properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0))},
        {label:"Open Tasks",value:tasks.length},
      ].map(s=><div key={s.label} style={{background:B.bg,borderRadius:10,padding:"14px 16px",borderTop:`2px solid ${B.gold}`}}>
        <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{s.label}</div>
        <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600}}>{s.value}</div>
      </div>)}
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="gold" onClick={print}>🖨 Print Report</Btn>
    </div>
  </Modal>;
}

// ── FAMILY FORM ───────────────────────────────────────────────────────────────
function FamilyForm({initial,onSave,onClose}){
  const [f,setF]=useState(initial||{name:"",advisorName:"",advisorEmail:"",notes:""});
  const [saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Family Name"><Inp placeholder="The Smith Family" value={f.name} onChange={set("name")}/></Field>
    <Grid2>
      <Field label="Advisor Name"><Inp placeholder="John Doe" value={f.advisorName} onChange={set("advisorName")}/></Field>
      <Field label="Advisor Email"><Inp placeholder="advisor@pcmfamilyoffice.com" value={f.advisorEmail} onChange={set("advisorEmail")}/></Field>
    </Grid2>
    <Field label="Notes"><Tex placeholder="General notes about this family…" value={f.notes} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Family"}</Btn>
    </div>
  </div>;
}

// ── FAMILIES VIEW ─────────────────────────────────────────────────────────────
function FamiliesView({data,reload,toast}){
  const {families,contacts,properties,deals,tasks}=data;
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [reportFamily,setReportFamily]=useState(null);
  const [search,setSearch]=useState("");

  const filtered=useMemo(()=>families.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||f.advisorName?.toLowerCase().includes(search.toLowerCase())),[families,search]);

  const add=async f=>{const{error}=await sb.from("families").insert(toDb(f));if(error)toast(error.message,"error");else{toast("Family added");reload("families");}};
  const edit=async f=>{const{error}=await sb.from("families").update(toDb(f)).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Family updated");reload("families");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("families").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Family deleted");reload("families");if(selected?.id===id)setSelected(null);}};

  const fContacts=sel=>contacts.filter(c=>c.familyId===sel.id);
  const fProperties=sel=>properties.filter(p=>p.familyId===sel.id);
  const fDeals=sel=>deals.filter(d=>d.familyId===sel.id&&d.stage!=="Closed Lost"&&d.stage!=="Closed Won");
  const fTasks=sel=>tasks.filter(t=>t.familyId===sel.id&&!t.done);
  const portfolioValue=sel=>fProperties(sel).reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"16px 20px",display:"flex",gap:10,alignItems:"center",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search families…" style={{flex:1}}/>
        <Btn onClick={()=>setModal("add")}>+ New Family</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {filtered.length===0&&<div style={{padding:"60px 24px",color:B.textMute,textAlign:"center",fontSize:14}}>No families yet.</div>}
        {filtered.map(f=>{
          const propCount=fProperties(f).length;
          const pv=portfolioValue(f);
          return <div key={f.id} onClick={()=>setSelected(f)} style={{padding:"14px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===f.id?B.bg:B.white}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:700,color:B.navy,marginBottom:2}}>{f.name}</div>
                <div style={{fontSize:12,color:B.textSoft}}>Advisor: {f.advisorName||"—"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:B.textSoft}}>{propCount} propert{propCount===1?"y":"ies"}</div>
                {pv>0&&<div style={{fontSize:12,color:B.navy,fontWeight:700}}>{fmtMoney(pv)}</div>}
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>

    {selected?(
      <div style={{width:400,overflowY:"auto",flexShrink:0,background:B.bg}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,fontWeight:600}}>{selected.name}</div>
            <div style={{fontSize:12,color:B.textSoft,marginTop:2}}>Advisor: {selected.advisorName||"—"} · {selected.advisorEmail||""}</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <Btn small variant="gold" onClick={()=>setReportFamily(selected)}>🖨 Report</Btn>
            <Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn>
            <Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn>
          </div>
        </div>
        <div style={{padding:"16px 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {l:"Members",v:fContacts(selected).length},
              {l:"Properties",v:fProperties(selected).length},
              {l:"Portfolio Value",v:fmtMoney(portfolioValue(selected))},
              {l:"Open Tasks",v:fTasks(selected).length},
            ].map(s=><div key={s.l} style={{background:B.white,borderRadius:8,padding:"10px 14px",border:`1px solid ${B.borderLight}`,borderTop:`2px solid ${B.gold}`}}>
              <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{s.l}</div>
              <div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600}}>{s.v}</div>
            </div>)}
          </div>

          <SectionLabel>Members</SectionLabel>
          {fContacts(selected).length===0?<Empty text="No contacts linked."/>:fContacts(selected).map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
            <span style={{fontSize:13,color:B.text,fontWeight:600}}>{c.name}</span>
            <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
          </div>)}

          <SectionLabel>Properties</SectionLabel>
          {fProperties(selected).length===0?<Empty text="No properties."/>:fProperties(selected).map(p=><div key={p.id} style={{padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
            <div style={{fontSize:13,color:B.navy,fontWeight:600}}>{p.address}</div>
            <div style={{fontSize:12,color:B.textSoft}}>{p.ownerName?`${p.ownerName} · `:""}{fmtMoney(p.currentValue||p.purchasePrice)}</div>
          </div>)}

          <SectionLabel>Open Deals</SectionLabel>
          {fDeals(selected).length===0?<Empty text="No open deals."/>:fDeals(selected).map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
            <span style={{fontSize:13,color:B.text}}>{d.title}</span>
            <Badge scheme={STAGE_COLORS[d.stage]}>{d.stage}</Badge>
          </div>)}

          <SectionLabel>Pending Tasks</SectionLabel>
          {fTasks(selected).length===0?<Empty text="No pending tasks."/>:fTasks(selected).map(t=>{
            const isOD=t.dueDate&&new Date(t.dueDate)<new Date();
            return <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
              <span style={{fontSize:13,color:B.text}}>{t.title}</span>
              <span style={{fontSize:11,color:isOD?"#d43030":B.textSoft,fontWeight:isOD?700:400}}>{isOD?"⚠ ":""}{fmt(t.dueDate)}</span>
            </div>;
          })}

          {selected.notes&&<><SectionLabel>Notes</SectionLabel><div style={{fontSize:13,color:B.textMid,lineHeight:1.6}}>{selected.notes}</div></>}
        </div>
      </div>
    ):<div style={{width:400,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a family</div>}

    {modal==="add"&&<Modal title="New Family" onClose={()=>setModal(null)}><FamilyForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Family" onClose={()=>setModal(null)}><FamilyForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
    {reportFamily&&<FamilyReport family={reportFamily} data={data} onClose={()=>setReportFamily(null)}/>}
  </div>;
}

// ── PROPERTY FORM ─────────────────────────────────────────────────────────────
function PropertyForm({initial,families,onSave,onClose}){
  const blank={familyId:"",ownerName:"",address:"",propertyType:"Residential",purchasePrice:"",purchaseDate:"",currentValue:"",lender:"",loanBalance:"",interestRate:"",loanPayment:"",loanMaturityDate:"",loanType:"Fixed",rentalIncome:"",propertyTaxes:"",utilities:"",insuranceCompany:"",insurancePremium:"",floodInsurance:false,floodInsuranceCompany:"",floodInsurancePremium:"",notes:""};
  const [f,setF]=useState(initial||blank);
  const [saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const setCheck=k=>e=>setF(p=>({...p,[k]:e.target.checked}));
  const save=async()=>{if(!f.address.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div style={{maxHeight:"75vh",overflowY:"auto",paddingRight:4}}>
    <Grid2>
      <Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— No family —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>
      <Field label="Owner / LLC Name"><Inp placeholder="Smith Holdings LLC" value={f.ownerName||""} onChange={set("ownerName")}/></Field>
    </Grid2>
    <Field label="Property Address"><Inp placeholder="123 Main St, Tampa, FL 33601" value={f.address} onChange={set("address")}/></Field>
    <Grid2>
      <Field label="Property Type"><Sel value={f.propertyType} onChange={set("propertyType")}>{PROP_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field>
      <Field label="Purchase Date"><Inp type="date" value={f.purchaseDate||""} onChange={set("purchaseDate")}/></Field>
    </Grid2>
    <Grid2>
      <Field label="Purchase Price"><Inp type="number" placeholder="500000" value={f.purchasePrice||""} onChange={set("purchasePrice")}/></Field>
      <Field label="Current Value"><Inp type="number" placeholder="600000" value={f.currentValue||""} onChange={set("currentValue")}/></Field>
    </Grid2>

    <div style={{fontSize:12,fontWeight:700,color:B.navyMid,letterSpacing:"0.08em",textTransform:"uppercase",margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${B.borderLight}`}}>Loan Details</div>
    <Grid2>
      <Field label="Lender"><Inp placeholder="First National Bank" value={f.lender||""} onChange={set("lender")}/></Field>
      <Field label="Loan Type"><Sel value={f.loanType} onChange={set("loanType")}>{LOAN_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field>
    </Grid2>
    <Grid2>
      <Field label="Loan Balance"><Inp type="number" placeholder="400000" value={f.loanBalance||""} onChange={set("loanBalance")}/></Field>
      <Field label="Interest Rate (%)"><Inp type="number" step="0.01" placeholder="6.75" value={f.interestRate||""} onChange={set("interestRate")}/></Field>
    </Grid2>
    <Grid2>
      <Field label="Monthly Payment"><Inp type="number" placeholder="2800" value={f.loanPayment||""} onChange={set("loanPayment")}/></Field>
      <Field label="Loan Maturity Date"><Inp type="date" value={f.loanMaturityDate||""} onChange={set("loanMaturityDate")}/></Field>
    </Grid2>

    <div style={{fontSize:12,fontWeight:700,color:B.navyMid,letterSpacing:"0.08em",textTransform:"uppercase",margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${B.borderLight}`}}>Income & Expenses</div>
    <Grid2>
      <Field label="Monthly Rental Income"><Inp type="number" placeholder="3500" value={f.rentalIncome||""} onChange={set("rentalIncome")}/></Field>
      <Field label="Annual Property Taxes"><Inp type="number" placeholder="8000" value={f.propertyTaxes||""} onChange={set("propertyTaxes")}/></Field>
    </Grid2>
    <Field label="Monthly Utilities"><Inp type="number" placeholder="200" value={f.utilities||""} onChange={set("utilities")}/></Field>

    <div style={{fontSize:12,fontWeight:700,color:B.navyMid,letterSpacing:"0.08em",textTransform:"uppercase",margin:"14px 0 10px",paddingBottom:6,borderBottom:`1px solid ${B.borderLight}`}}>Insurance</div>
    <Grid2>
      <Field label="Insurance Company"><Inp placeholder="State Farm" value={f.insuranceCompany||""} onChange={set("insuranceCompany")}/></Field>
      <Field label="Annual Premium"><Inp type="number" placeholder="2400" value={f.insurancePremium||""} onChange={set("insurancePremium")}/></Field>
    </Grid2>
    <div style={{marginBottom:14}}>
      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:f.floodInsurance?"#e8f0f8":B.bg,borderRadius:8,border:`1px solid ${f.floodInsurance?B.navyMid:B.border}`}}>
        <input type="checkbox" checked={!!f.floodInsurance} onChange={setCheck("floodInsurance")} style={{width:16,height:16,accentColor:B.navy}}/>
        <span style={{fontSize:13,color:B.navy,fontWeight:600}}>Flood Insurance</span>
      </label>
    </div>
    {f.floodInsurance&&<Grid2>
      <Field label="Flood Insurance Company"><Inp placeholder="FEMA / Private" value={f.floodInsuranceCompany||""} onChange={set("floodInsuranceCompany")}/></Field>
      <Field label="Flood Annual Premium"><Inp type="number" placeholder="1200" value={f.floodInsurancePremium||""} onChange={set("floodInsurancePremium")}/></Field>
    </Grid2>}

    <Field label="Notes"><Tex placeholder="Additional notes…" value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Property"}</Btn>
    </div>
  </div>;
}

// ── PROPERTIES VIEW ───────────────────────────────────────────────────────────
function PropertiesView({data,reload,toast}){
  const {families,properties}=data;
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [filterFamily,setFilterFamily]=useState("all");
  const [search,setSearch]=useState("");

  const filtered=useMemo(()=>properties.filter(p=>{
    const famMatch=filterFamily==="all"||p.familyId===filterFamily;
    const searchMatch=[p.address,p.ownerName,p.lender,p.insuranceCompany].join(" ").toLowerCase().includes(search.toLowerCase());
    return famMatch&&searchMatch;
  }),[properties,filterFamily,search]);

  const add=async f=>{
    const row={family_id:f.familyId||null,owner_name:f.ownerName||null,address:f.address,property_type:f.propertyType,purchase_price:f.purchasePrice||null,purchase_date:f.purchaseDate||null,current_value:f.currentValue||null,lender:f.lender||null,loan_balance:f.loanBalance||null,interest_rate:f.interestRate||null,loan_payment:f.loanPayment||null,loan_maturity_date:f.loanMaturityDate||null,loan_type:f.loanType,rental_income:f.rentalIncome||null,property_taxes:f.propertyTaxes||null,utilities:f.utilities||null,insurance_company:f.insuranceCompany||null,insurance_premium:f.insurancePremium||null,flood_insurance:!!f.floodInsurance,flood_insurance_company:f.floodInsuranceCompany||null,flood_insurance_premium:f.floodInsurancePremium||null,notes:f.notes||null};
    const{error}=await sb.from("properties").insert(row);
    if(error)toast(error.message,"error");else{toast("Property added");reload("properties");}
  };
  const edit=async f=>{
    const row={family_id:f.familyId||null,owner_name:f.ownerName||null,address:f.address,property_type:f.propertyType,purchase_price:f.purchasePrice||null,purchase_date:f.purchaseDate||null,current_value:f.currentValue||null,lender:f.lender||null,loan_balance:f.loanBalance||null,interest_rate:f.interestRate||null,loan_payment:f.loanPayment||null,loan_maturity_date:f.loanMaturityDate||null,loan_type:f.loanType,rental_income:f.rentalIncome||null,property_taxes:f.propertyTaxes||null,utilities:f.utilities||null,insurance_company:f.insuranceCompany||null,insurance_premium:f.insurancePremium||null,flood_insurance:!!f.floodInsurance,flood_insurance_company:f.floodInsuranceCompany||null,flood_insurance_premium:f.floodInsurancePremium||null,notes:f.notes||null};
    const{error}=await sb.from("properties").update(row).eq("id",modal.id);
    if(error)toast(error.message,"error");else{toast("Property updated");reload("properties");setSelected({...selected,...toClient(row)});}
  };
  const del=async id=>{const{error}=await sb.from("properties").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Property deleted");reload("properties");if(selected?.id===id)setSelected(null);}};
  const getFamily=id=>families.find(f=>f.id===id);
  const totalValue=filtered.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalBalance=filtered.reduce((s,p)=>s+(Number(p.loanBalance)||0),0);

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"14px 20px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search properties…" style={{flex:1,minWidth:140}}/>
        <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:180}}>
          <option value="all">All Families</option>
          {families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </Sel>
        <Btn onClick={()=>setModal("add")}>+ New Property</Btn>
      </div>
      <div style={{padding:"10px 20px",background:B.bg,borderBottom:`1px solid ${B.borderLight}`,display:"flex",gap:20}}>
        <span style={{fontSize:12,color:B.textSoft}}>Portfolio: <strong style={{color:B.navy}}>{fmtMoney(totalValue)}</strong></span>
        <span style={{fontSize:12,color:B.textSoft}}>Total Debt: <strong style={{color:B.navy}}>{fmtMoney(totalBalance)}</strong></span>
        <span style={{fontSize:12,color:B.textSoft}}>{filtered.length} propert{filtered.length===1?"y":"ies"}</span>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {filtered.length===0&&<div style={{padding:"60px 24px",color:B.textMute,textAlign:"center",fontSize:14}}>No properties yet.</div>}
        {filtered.map(p=>{
          const fam=getFamily(p.familyId);
          return <div key={p.id} onClick={()=>setSelected(p)} style={{padding:"13px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===p.id?B.bg:B.white}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:700,color:B.navy,marginBottom:2}}>{p.address}</div>
                <div style={{fontSize:12,color:B.textSoft}}>{p.ownerName?`${p.ownerName} · `:""}{p.propertyType}{fam?` · ${fam.name}`:""}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,color:B.navy,fontWeight:700}}>{fmtMoney(p.currentValue||p.purchasePrice)}</div>
                {p.loanBalance&&<div style={{fontSize:11,color:B.textSoft}}>Balance: {fmtMoney(p.loanBalance)}</div>}
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>

    {selected?(
      <div style={{width:420,overflowY:"auto",flexShrink:0,background:B.bg}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,lineHeight:1.3}}>{selected.address}</div>
            {selected.ownerName&&<div style={{fontSize:12,color:B.textSoft,marginTop:2}}>{selected.ownerName}</div>}
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn>
            <Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn>
          </div>
        </div>
        <div style={{padding:"16px 22px"}}>
          {[
            {section:"Overview",rows:[["Family",getFamily(selected.familyId)?.name||"—"],["Type",selected.propertyType],["Purchase Price",fmtMoney(selected.purchasePrice)],["Purchase Date",fmt(selected.purchaseDate)],["Current Value",fmtMoney(selected.currentValue)]]},
            {section:"Loan",rows:[["Lender",selected.lender||"—"],["Loan Type",selected.loanType],["Balance",fmtMoney(selected.loanBalance)],["Rate",fmtPct(selected.interestRate)],["Payment",`${fmtMoney(selected.loanPayment)}/mo`],["Maturity",fmt(selected.loanMaturityDate)]]},
            {section:"Income & Expenses",rows:[["Rental Income",`${fmtMoney(selected.rentalIncome)}/mo`],["Property Taxes",`${fmtMoney(selected.propertyTaxes)}/yr`],["Utilities",`${fmtMoney(selected.utilities)}/mo`]]},
            {section:"Insurance",rows:[["Company",selected.insuranceCompany||"—"],["Premium",`${fmtMoney(selected.insurancePremium)}/yr`],["Flood Insurance",selected.floodInsurance?"Yes":"No"],...(selected.floodInsurance?[["Flood Company",selected.floodInsuranceCompany||"—"],["Flood Premium",`${fmtMoney(selected.floodInsurancePremium)}/yr`]]:[])]}
          ].map(({section,rows})=><div key={section} style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,paddingBottom:4,borderBottom:`1px solid ${B.borderLight}`}}>{section}</div>
            {rows.map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${B.borderLight}`}}>
              <span style={{fontSize:12,color:B.textSoft}}>{l}</span>
              <span style={{fontSize:12,color:B.text,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
            </div>)}
          </div>)}
          {selected.notes&&<div><div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Notes</div><div style={{fontSize:13,color:B.textMid,lineHeight:1.6}}>{selected.notes}</div></div>}
        </div>
      </div>
    ):<div style={{width:420,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a property</div>}

    {modal==="add"&&<Modal title="New Property" onClose={()=>setModal(null)} wide><PropertyForm families={families} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Property" onClose={()=>setModal(null)} wide><PropertyForm initial={modal} families={families} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── CONTACTS VIEW ─────────────────────────────────────────────────────────────
function ContactForm({initial,families,onSave,onClose}){
  const [f,setF]=useState(initial||{familyId:"",name:"",company:"",email:"",phone:"",type:"Individual",tags:""});
  const [saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2>
      <Field label="Full Name"><Inp placeholder="Jane Smith" value={f.name} onChange={set("name")}/></Field>
      <Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— No family —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>
    </Grid2>
    <Field label="Company / LLC"><Inp placeholder="Smith Holdings LLC" value={f.company||""} onChange={set("company")}/></Field>
    <Grid2>
      <Field label="Email"><Inp placeholder="jane@example.com" value={f.email||""} onChange={set("email")}/></Field>
      <Field label="Phone"><Inp placeholder="+1 555 000" value={f.phone||""} onChange={set("phone")}/></Field>
    </Grid2>
    <Grid2>
      <Field label="Type"><Sel value={f.type} onChange={set("type")}><option>Individual</option><option>Business</option></Sel></Field>
      <Field label="Tags"><Inp placeholder="vip, warm-lead" value={f.tags||""} onChange={set("tags")}/></Field>
    </Grid2>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Contact"}</Btn></div>
  </div>;
}

function ContactsView({data,reload,toast}){
  const {contacts,families,deals,notes}=data;
  const [modal,setModal]=useState(null);
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [filterFamily,setFilterFamily]=useState("all");
  const filtered=useMemo(()=>contacts.filter(c=>{const fm=filterFamily==="all"||c.familyId===filterFamily;const sm=[c.name,c.company,c.email,c.tags].join(" ").toLowerCase().includes(search.toLowerCase());return fm&&sm;}),[contacts,filterFamily,search]);
  const getFamily=id=>families.find(f=>f.id===id);

  const add=async f=>{const{error}=await sb.from("contacts").insert({family_id:f.familyId||null,name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null});if(error)toast(error.message,"error");else{toast("Contact added");reload("contacts");}};
  const edit=async f=>{const{error}=await sb.from("contacts").update({family_id:f.familyId||null,name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Contact updated");reload("contacts");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("contacts").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("contacts");if(selected?.id===id)setSelected(null);}};

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"14px 20px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts…" style={{flex:1}}/>
        <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:170}}>
          <option value="all">All Families</option>
          {families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </Sel>
        <Btn onClick={()=>setModal("add")}>+ New Contact</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {filtered.length===0&&<div style={{padding:"60px 24px",color:B.textMute,textAlign:"center",fontSize:14}}>No contacts yet.</div>}
        {filtered.map(c=>{const fam=getFamily(c.familyId);return <div key={c.id} onClick={()=>setSelected(c)} style={{padding:"13px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===c.id?B.bg:B.white}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontWeight:700,color:B.navy,marginBottom:2}}>{c.name}</div><div style={{fontSize:12,color:B.textSoft}}>{c.company||c.email||"—"}{fam?` · ${fam.name}`:""}</div></div>
            <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
          </div>
        </div>;})}
      </div>
    </div>
    {selected?(
      <div style={{width:370,padding:22,overflowY:"auto",flexShrink:0,background:B.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{selected.name}</div><div style={{fontSize:12,color:B.textSoft}}>{getFamily(selected.familyId)?.name}</div></div>
          <div style={{display:"flex",gap:6}}><Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn></div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:12}}/>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
          {selected.email&&<IRow label="Email" value={selected.email}/>}
          {selected.phone&&<IRow label="Phone" value={selected.phone}/>}
          {selected.company&&<IRow label="Company" value={selected.company}/>}
          {selected.tags&&<IRow label="Tags" value={selected.tags}/>}
          <IRow label="Added" value={fmt(selected.createdAt)}/>
        </div>
        <SectionLabel>Deals ({deals.filter(d=>d.contactId===selected.id).length})</SectionLabel>
        {deals.filter(d=>d.contactId===selected.id).map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><span style={{fontSize:13}}>{d.title}</span><Badge scheme={STAGE_COLORS[d.stage]}>{d.stage}</Badge></div>)}
        <SectionLabel>Notes ({notes.filter(n=>n.contactId===selected.id).length})</SectionLabel>
        {notes.filter(n=>n.contactId===selected.id).slice(0,3).map(n=><div key={n.id} style={{padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><div style={{fontSize:13,color:B.textMid}}>{n.body}</div><div style={{fontSize:11,color:B.textMute,marginTop:2}}>{fmt(n.createdAt)}</div></div>)}
      </div>
    ):<div style={{width:370,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a contact</div>}
    {modal==="add"&&<Modal title="New Contact" onClose={()=>setModal(null)}><ContactForm families={families} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Contact" onClose={()=>setModal(null)}><ContactForm initial={modal} families={families} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── DEALS, NOTES, TASKS (family-aware) ───────────────────────────────────────
function DealsView({data,reload,toast}){
  const{contacts,families,deals}=data;
  const[modal,setModal]=useState(null);
  const[fs,setFs]=useState("All");
  const[filterFamily,setFilterFamily]=useState("all");
  const filtered=useMemo(()=>deals.filter(d=>(fs==="All"||d.stage===fs)&&(filterFamily==="all"||d.familyId===filterFamily)),[deals,fs,filterFamily]);
  const byStage=STAGES.reduce((acc,s)=>({...acc,[s]:filtered.filter(d=>d.stage===s)}),{});
  const pipeline=deals.filter(d=>d.stage!=="Closed Lost").reduce((s,d)=>s+(Number(d.value)||0),0);
  const gc=id=>contacts.find(c=>c.id===id);
  const gf=id=>families.find(f=>f.id===id);

  const add=async f=>{const{error}=await sb.from("deals").insert({family_id:f.familyId||null,contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null});if(error)toast(error.message,"error");else{toast("Deal added");reload("deals");}};
  const edit=async f=>{const{error}=await sb.from("deals").update({family_id:f.familyId||null,contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Deal updated");reload("deals");}};
  const del=async id=>{const{error}=await sb.from("deals").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("deals");}};
  const move=async(deal,dir)=>{const idx=STAGES.indexOf(deal.stage);const next=STAGES[idx+dir];if(!next)return;const{error}=await sb.from("deals").update({stage:next}).eq("id",deal.id);if(error)toast(error.message,"error");else reload("deals");};

  const DealForm=({initial:ini,onSave,onClose})=>{
    const[f,setF]=useState(ini||{familyId:"",contactId:"",title:"",value:"",stage:"Lead",closeDate:""});
    const[saving,setSaving]=useState(false);
    const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
    const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
    return <div>
      <Grid2><Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— None —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>
      <Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field></Grid2>
      <Field label="Deal Title"><Inp placeholder="Estate planning engagement" value={f.title} onChange={set("title")}/></Field>
      <Grid2><Field label="Value ($)"><Inp type="number" value={f.value||""} onChange={set("value")}/></Field><Field label="Close Date"><Inp type="date" value={f.closeDate||""} onChange={set("closeDate")}/></Field></Grid2>
      <Field label="Stage"><Sel value={f.stage} onChange={set("stage")}>{STAGES.map(s=><option key={s}>{s}</option>)}</Sel></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
    </div>;
  };

  return <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
    <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",background:B.white}}>
      <div style={{flex:1,display:"flex",gap:5,flexWrap:"wrap"}}>
        {["All",...STAGES].map(s=><button key={s} onClick={()=>setFs(s)} style={{background:fs===s?(STAGE_COLORS[s]?.bg||B.borderLight):"transparent",border:`1px solid ${fs===s?(STAGE_COLORS[s]?.dot||B.navy):B.border}`,color:fs===s?(STAGE_COLORS[s]?.text||B.navy):B.textSoft,borderRadius:20,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}
      </div>
      <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:160}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
      <div style={{fontSize:12,color:B.textSoft}}>Pipeline: <strong style={{color:B.navy}}>${pipeline.toLocaleString()}</strong></div>
      <Btn onClick={()=>setModal("add")}>+ New Deal</Btn>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
      {filtered.length===0&&<div style={{padding:"60px 24px",color:B.textMute,textAlign:"center",fontSize:14}}>No deals yet.</div>}
      {STAGES.map(stage=>{const list=byStage[stage];if(!list?.length)return null;return <div key={stage}>
        <div style={{padding:"8px 20px 3px",display:"flex",alignItems:"center",gap:7}}><span style={{width:7,height:7,borderRadius:"50%",background:STAGE_COLORS[stage].dot}}/><span style={{fontSize:11,fontWeight:800,color:STAGE_COLORS[stage].dot,letterSpacing:"0.1em",textTransform:"uppercase"}}>{stage}</span><span style={{fontSize:11,color:B.textMute}}>{list.length}</span></div>
        {list.map(deal=>{const contact=gc(deal.contactId);const fam=gf(deal.familyId);return <div key={deal.id} style={{margin:"3px 20px",padding:"12px 15px",background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${STAGE_COLORS[deal.stage].dot}`,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{deal.title}</div>
            <div style={{fontSize:12,color:B.textSoft}}>{fam?`${fam.name} · `:""}{contact?contact.name:"No contact"}{deal.closeDate?` · ${fmt(deal.closeDate)}`:""}</div>
          </div>
          {deal.value&&<div style={{color:B.navy,fontWeight:800,fontSize:14,whiteSpace:"nowrap"}}>${Number(deal.value).toLocaleString()}</div>}
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>move(deal,-1)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}}>←</button>
            <button onClick={()=>move(deal,1)}  style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}}>→</button>
            <Btn small variant="ghost" onClick={()=>setModal(deal)}>Edit</Btn>
            <Btn small variant="danger" onClick={()=>del(deal.id)}>✕</Btn>
          </div>
        </div>;})}
      </div>;})}
    </div>
    {modal==="add"&&<Modal title="New Deal" onClose={()=>setModal(null)}><DealForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Deal" onClose={()=>setModal(null)}><DealForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

function NotesView({data,reload,toast}){
  const{contacts,families,notes}=data;
  const[body,setBody]=useState("");const[cid,setCid]=useState("");const[fid,setFid]=useState("");const[search,setSearch]=useState("");const[saving,setSaving]=useState(false);
  const gc=id=>contacts.find(c=>c.id===id);const gf=id=>families.find(f=>f.id===id);
  const add=async()=>{if(!body.trim())return;setSaving(true);const{error}=await sb.from("notes").insert({body,contact_id:cid||null,family_id:fid||null});setSaving(false);if(error)toast(error.message,"error");else{toast("Note added");setBody("");reload("notes");}};
  const del=async id=>{const{error}=await sb.from("notes").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("notes");}};
  const filtered=notes.filter(n=>n.body.toLowerCase().includes(search.toLowerCase())||(gc(n.contactId)?.name||"").toLowerCase().includes(search.toLowerCase())||(gf(n.familyId)?.name||"").toLowerCase().includes(search.toLowerCase()));
  return <div style={{maxWidth:740,margin:"0 auto",padding:"20px",height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:18,marginBottom:16,boxShadow:B.shadow}}>
      <Tex placeholder="Write a note or activity log entry…" value={body} onChange={e=>setBody(e.target.value)} style={{marginBottom:10}}/>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <Sel value={fid} onChange={e=>setFid(e.target.value)} style={{flex:1,minWidth:130}}><option value="">— Family (opt) —</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
        <Sel value={cid} onChange={e=>setCid(e.target.value)} style={{flex:1,minWidth:130}}><option value="">— Contact (opt) —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
        <Btn onClick={add} disabled={saving}>{saving?"Saving…":"Log Note"}</Btn>
      </div>
    </div>
    <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…" style={{marginBottom:14}}/>
    <div style={{overflowY:"auto",flex:1,paddingBottom:24}}>
      {filtered.length===0&&<div style={{padding:"40px 0",color:B.textMute,textAlign:"center",fontSize:14}}>No notes yet.</div>}
      {filtered.map(n=>{const contact=gc(n.contactId);const fam=gf(n.familyId);return <div key={n.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${B.gold}`,borderRadius:10,padding:"13px 15px",marginBottom:8,boxShadow:B.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8}}><p style={{margin:0,color:B.textMid,fontSize:14,lineHeight:1.6,flex:1}}>{n.body}</p><button onClick={()=>del(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:15,flexShrink:0}}>✕</button></div>
        <div style={{marginTop:8,display:"flex",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:B.textMute}}>{fmt(n.createdAt)}</span>
          {fam&&<span style={{fontSize:11,color:B.navy,fontWeight:700}}>{fam.name}</span>}
          {contact&&<span style={{fontSize:11,color:B.gold,fontWeight:700}}>{contact.name}</span>}
        </div>
      </div>;})}
    </div>
  </div>;
}

function TasksView({data,reload,toast}){
  const{contacts,families,tasks}=data;
  const[modal,setModal]=useState(null);const[filter,setFilter]=useState("Pending");const[filterFamily,setFilterFamily]=useState("all");
  const gc=id=>contacts.find(c=>c.id===id);const gf=id=>families.find(f=>f.id===id);
  const list=tasks.filter(t=>(filter==="All"||(filter==="Pending"?!t.done:t.done))&&(filterFamily==="all"||t.familyId===filterFamily));
  const oc=tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
  const soon=tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)>=new Date()&&(new Date(t.dueDate)-new Date())/(1000*60*60*24)<=30).length;

  const TaskForm=({initial:ini,onSave,onClose})=>{
    const[f,setF]=useState(ini||{familyId:"",contactId:"",title:"",dueDate:"",priority:"Medium",done:false});
    const[saving,setSaving]=useState(false);
    const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
    const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
    return <div>
      <Grid2><Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— None —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>
      <Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field></Grid2>
      <Field label="Task"><Inp placeholder="Follow up on loan maturity" value={f.title} onChange={set("title")}/></Field>
      <Grid2><Field label="Due Date"><Inp type="date" value={f.dueDate||""} onChange={set("dueDate")}/></Field><Field label="Priority"><Sel value={f.priority} onChange={set("priority")}><option>Low</option><option>Medium</option><option>High</option></Sel></Field></Grid2>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
    </div>;
  };

  const add=async f=>{const{error}=await sb.from("tasks").insert({family_id:f.familyId||null,contact_id:f.contactId||null,title:f.title,due_date:f.dueDate||null,priority:f.priority,done:false});if(error)toast(error.message,"error");else{toast("Task added");reload("tasks");}};
  const edit=async f=>{const{error}=await sb.from("tasks").update({family_id:f.familyId||null,contact_id:f.contactId||null,title:f.title,due_date:f.dueDate||null,priority:f.priority}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("tasks");}};
  const tog=async t=>{const{error}=await sb.from("tasks").update({done:!t.done}).eq("id",t.id);if(error)toast(error.message,"error");else reload("tasks");};
  const del=async id=>{const{error}=await sb.from("tasks").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("tasks");}};

  return <div style={{maxWidth:760,margin:"0 auto",padding:"20px",height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:5}}>{["Pending","Done","All"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?B.navy:"transparent",border:`1px solid ${filter===s?B.navy:B.border}`,color:filter===s?B.white:B.textSoft,borderRadius:20,padding:"4px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}</div>
      <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:160}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
      <div style={{flex:1,display:"flex",gap:8,flexWrap:"wrap"}}>
        {oc>0&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>{oc} overdue</Badge>}
        {soon>0&&<Badge scheme={{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"}}>{soon} due in 30 days</Badge>}
      </div>
      <Btn onClick={()=>setModal("add")}>+ New Task</Btn>
    </div>
    <div style={{overflowY:"auto",flex:1}}>
      {list.length===0&&<div style={{padding:"60px 0",color:B.textMute,textAlign:"center",fontSize:14}}>No tasks here.</div>}
      {list.map(t=>{
        const contact=gc(t.contactId);const fam=gf(t.familyId);
        const isOD=!t.done&&t.dueDate&&new Date(t.dueDate)<new Date();
        const isSoon=!t.done&&t.dueDate&&!isOD&&(new Date(t.dueDate)-new Date())/(1000*60*60*24)<=30;
        return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",marginBottom:7,background:B.white,border:`1px solid ${isOD?"#f5c6c6":B.borderLight}`,borderLeft:`3px solid ${isOD?"#d43030":isSoon?"#d4900a":PRIORITY_COLORS[t.priority]?.dot||B.gold}`,borderRadius:10,opacity:t.done?.55:1,boxShadow:B.shadow}}>
          <input type="checkbox" checked={!!t.done} onChange={()=>tog(t)} style={{width:16,height:16,accentColor:B.navy,cursor:"pointer",flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:B.navy,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
            <div style={{fontSize:12,color:B.textSoft,marginTop:1}}>
              {fam&&<span style={{color:B.navyMid,fontWeight:600}}>{fam.name} · </span>}
              {contact&&`${contact.name} · `}
              {t.dueDate?<span style={{color:isOD?"#d43030":isSoon?"#d4900a":B.textSoft}}>{isOD?"⚠ Overdue":isSoon?"⏰ Due soon":""} {fmt(t.dueDate)}</span>:"No due date"}
            </div>
          </div>
          <Badge scheme={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
          <Btn small variant="ghost" onClick={()=>setModal(t)}>Edit</Btn>
          <button onClick={()=>del(t.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:15}}>✕</button>
        </div>;
      })}
    </div>
    {modal==="add"&&<Modal title="New Task" onClose={()=>setModal(null)}><TaskForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Task" onClose={()=>setModal(null)}><TaskForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({data}){
  const{contacts,families,properties,deals,notes,tasks}=data;
  const openDeals=deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won");
  const pipeline=openDeals.reduce((s,d)=>s+(Number(d.value)||0),0);
  const totalPortfolio=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0),0);
  const pending=tasks.filter(t=>!t.done);
  const overdue=pending.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const dueSoon=pending.filter(t=>t.dueDate&&!overdue.includes(t)&&(new Date(t.dueDate)-new Date())/(1000*60*60*24)<=30);
  const stageCounts=STAGES.map(s=>({stage:s,count:deals.filter(d=>d.stage===s).length,value:deals.filter(d=>d.stage===s).reduce((sum,d)=>sum+(Number(d.value)||0),0)}));
  const maxC=Math.max(1,...stageCounts.map(s=>s.count));
  const gf=id=>families.find(f=>f.id===id);
  const hr=new Date().getHours();

  return <div style={{overflowY:"auto",height:"100%",padding:"26px 30px 48px"}}>
    <div style={{marginBottom:24}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600,marginBottom:4}}>Good {hr<12?"Morning":hr<17?"Afternoon":"Evening"}</div>
      <div style={{color:B.textSoft,fontSize:14}}>PCM Family Office — Portfolio & Client Overview</div>
      <div style={{height:2,width:56,background:B.gold,marginTop:10,borderRadius:2}}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
      {[
        {label:"Families",value:families.length,sub:`${contacts.length} total contacts`,accent:B.navy},
        {label:"Portfolio Value",value:fmtMoney(totalPortfolio),sub:`${properties.length} properties`,accent:B.gold},
        {label:"Total Debt",value:fmtMoney(totalDebt),sub:`Loan balances`,accent:B.navyMid},
        {label:"Open Tasks",value:pending.length,sub:overdue.length>0?`${overdue.length} overdue · ${dueSoon.length} due soon`:`${dueSoon.length} due in 30 days`,accent:overdue.length>0?"#d43030":dueSoon.length>0?"#d4900a":B.navyMid},
      ].map(s=><div key={s.label} style={{background:B.bgCard,borderRadius:12,padding:"20px 22px",border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,borderTop:`3px solid ${s.accent}`}}>
        <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
        <div style={{fontSize:26,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600,lineHeight:1}}>{s.value}</div>
        <div style={{fontSize:11,color:B.textSoft,marginTop:5}}>{s.sub}</div>
      </div>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
      <SectionCard title="Pipeline by Stage">
        {stageCounts.map(({stage,count,value})=><div key={stage} style={{marginBottom:11}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:7,height:7,borderRadius:"50%",background:STAGE_COLORS[stage].dot}}/><span style={{fontSize:12,color:B.textMid,fontWeight:600}}>{stage}</span></div>
            <div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:B.textMute}}>{count}</span>{value>0&&<span style={{fontSize:11,color:B.textSoft,fontWeight:700}}>${value.toLocaleString()}</span>}</div>
          </div>
          <div style={{height:5,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(count/maxC)*100}%`,background:`linear-gradient(90deg,${STAGE_COLORS[stage].dot}88,${STAGE_COLORS[stage].dot})`,borderRadius:3}}/></div>
        </div>)}
      </SectionCard>

      <SectionCard title="Deadlines (Next 30 Days)">
        {dueSoon.length===0&&overdue.length===0&&<div style={{color:B.textMute,fontSize:13}}>No upcoming deadlines.</div>}
        {[...overdue,...dueSoon].slice(0,6).map(t=>{
          const isOD=overdue.includes(t);const fam=gf(t.familyId);
          return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:isOD?"#d43030":"#d4900a",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:B.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
              {fam&&<div style={{fontSize:11,color:B.textMute}}>{fam.name}</div>}
            </div>
            <div style={{fontSize:11,color:isOD?"#d43030":"#d4900a",fontWeight:700,whiteSpace:"nowrap"}}>{isOD?"⚠ ":""}{fmt(t.dueDate)}</div>
          </div>;
        })}
      </SectionCard>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <SectionCard title="Portfolio by Family">
        {families.length===0&&<div style={{color:B.textMute,fontSize:13}}>No families yet.</div>}
        {families.map(f=>{
          const fProps=properties.filter(p=>p.familyId===f.id);
          const val=fProps.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
          const pct=totalPortfolio?Math.round((val/totalPortfolio)*100):0;
          return <div key={f.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,color:B.textMid,fontWeight:600}}>{f.name}</span>
              <span style={{fontSize:12,color:B.textSoft}}>{fmtMoney(val)} ({pct}%)</span>
            </div>
            <div style={{height:6,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:B.navy,borderRadius:3}}/></div>
          </div>;
        })}
      </SectionCard>

      <SectionCard title="Recent Notes">
        {notes.length===0&&<div style={{color:B.textMute,fontSize:13}}>No notes yet.</div>}
        {[...notes].sort((a,b)=>b.createdAt>a.createdAt?1:-1).slice(0,4).map(n=>{const fam=gf(n.familyId);return <div key={n.id} style={{padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>
          <div style={{fontSize:13,color:B.textMid,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.body}</div>
          <div style={{display:"flex",gap:10,marginTop:3}}><span style={{fontSize:11,color:B.textMute}}>{fmt(n.createdAt)}</span>{fam&&<span style={{fontSize:11,color:B.gold,fontWeight:700}}>{fam.name}</span>}</div>
        </div>;})}
      </SectionCard>
    </div>
  </div>;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function IRow({label,value}){return <div style={{display:"flex",gap:10,fontSize:13,marginBottom:2}}><span style={{color:B.textMute,minWidth:52,flexShrink:0}}>{label}</span><span style={{color:B.textMid}}>{value}</span></div>;}
function SectionLabel({children}){return <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:7,marginTop:16}}>{children}</div>;}
function Empty({text}){return <div style={{fontSize:13,color:B.textMute,padding:"5px 0"}}>{text}</div>;}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === APP_PASSWORD) {
      sessionStorage.setItem("pcm_auth", "1");
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setPw("");
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg, ${B.navy} 0%, ${B.navyMid} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>

      {/* Background subtle pattern */}
      <div style={{position:"fixed",inset:0,backgroundImage:`radial-gradient(circle at 20% 80%, rgba(206,182,132,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(206,182,132,0.04) 0%, transparent 50%)`,pointerEvents:"none"}}/>

      <div style={{
        background:"rgba(255,255,255,0.97)",
        borderRadius:20,
        padding:"48px 44px",
        width:"100%",
        maxWidth:420,
        boxShadow:"0 32px 80px rgba(0,0,0,0.35)",
        border:`1px solid rgba(206,182,132,0.3)`,
        animation: shake ? "shake 0.6s ease" : "none",
        position:"relative",
        zIndex:1,
      }}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
            <PCMLogo/>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold},transparent)`,marginBottom:20}}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,letterSpacing:"0.02em"}}>Client Portal</div>
          <div style={{fontSize:11,color:B.textMute,letterSpacing:"0.1em",marginTop:4}}>SECURE ACCESS</div>
        </div>

        {/* Password Field */}
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:11,color:B.textSoft,marginBottom:8,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Password</label>
          <input
            type="password"
            value={pw}
            onChange={e=>{setPw(e.target.value);setError(false);}}
            onKeyDown={e=>e.key==="Enter"&&attempt()}
            placeholder="Enter your password"
            autoFocus
            style={{
              width:"100%",
              background: error ? "#fde8e8" : B.bg,
              border:`1.5px solid ${error?"#f5c6c6":B.border}`,
              borderRadius:10,
              padding:"13px 16px",
              color:B.text,
              fontSize:15,
              outline:"none",
              boxSizing:"border-box",
              fontFamily:"inherit",
              transition:"border-color .2s, background .2s",
              letterSpacing:"0.08em",
            }}
          />
          {error && <div style={{fontSize:12,color:"#d43030",marginTop:6,fontWeight:600}}>Incorrect password. Please try again.</div>}
        </div>

        <button
          onClick={attempt}
          style={{
            width:"100%",
            background:`linear-gradient(135deg, ${B.navy}, ${B.navyMid})`,
            color:B.white,
            border:"none",
            borderRadius:10,
            padding:"13px",
            fontSize:14,
            fontWeight:700,
            cursor:"pointer",
            fontFamily:"inherit",
            letterSpacing:"0.06em",
            marginBottom:24,
            boxShadow:`0 4px 16px rgba(9,43,73,0.25)`,
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".88"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >
          SIGN IN
        </button>

        <div style={{textAlign:"center",fontSize:11,color:B.textMute,letterSpacing:"0.05em"}}>
          PCM Family Office &nbsp;·&nbsp; DISCOVER · SIMPLIFY · EXECUTE
        </div>
      </div>
    </div>
  );
}



const NAV_SECTIONS = [
  {
    section: "CLIENT MANAGEMENT",
    items: [
      {id:"dashboard",   label:"Dashboard",   icon:"⬡"},
      {id:"families",    label:"Families",    icon:"⌂"},
      {id:"properties",  label:"Properties",  icon:"◈"},
      {id:"cm-notes",    label:"Notes",       icon:"◧"},
      {id:"cm-tasks",    label:"Tasks",       icon:"◻"},
    ]
  },
  {
    section: "PROSPECTING",
    items: [
      {id:"p-contacts",  label:"Contacts",    icon:"◉"},
      {id:"p-pipeline",  label:"Pipeline",    icon:"◆"},
      {id:"p-notes",     label:"Notes",       icon:"◧"},
      {id:"p-tasks",     label:"Tasks",       icon:"◻"},
    ]
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);
const TABLES = ["families","contacts","properties","deals","notes","tasks"];

// ── PROSPECTING CONTACTS (no family link) ─────────────────────────────────────
function ProspectContactForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{name:"",company:"",email:"",phone:"",type:"Individual",tags:"",source:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2>
      <Field label="Full Name"><Inp placeholder="Jane Smith" value={f.name} onChange={set("name")}/></Field>
      <Field label="Company"><Inp placeholder="Acme Corp" value={f.company||""} onChange={set("company")}/></Field>
    </Grid2>
    <Grid2>
      <Field label="Email"><Inp placeholder="jane@example.com" value={f.email||""} onChange={set("email")}/></Field>
      <Field label="Phone"><Inp placeholder="+1 555 000" value={f.phone||""} onChange={set("phone")}/></Field>
    </Grid2>
    <Grid2>
      <Field label="Type"><Sel value={f.type} onChange={set("type")}><option>Individual</option><option>Business</option></Sel></Field>
      <Field label="Lead Source"><Inp placeholder="Referral, LinkedIn…" value={f.source||""} onChange={set("source")}/></Field>
    </Grid2>
    <Field label="Tags"><Inp placeholder="warm-lead, vip" value={f.tags||""} onChange={set("tags")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Contact"}</Btn>
    </div>
  </div>;
}

function ProspectContactsView({data,reload,toast}){
  const prospects=data.contacts.filter(c=>!c.familyId);
  const[modal,setModal]=useState(null);
  const[search,setSearch]=useState("");
  const[selected,setSelected]=useState(null);
  const filtered=useMemo(()=>prospects.filter(c=>[c.name,c.company,c.email,c.tags].join(" ").toLowerCase().includes(search.toLowerCase())),[prospects,search]);

  const add=async f=>{
    const{error}=await sb.from("contacts").insert({family_id:null,name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null});
    if(error)toast(error.message,"error");else{toast("Contact added");reload("contacts");}
  };
  const edit=async f=>{
    const{error}=await sb.from("contacts").update({name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null}).eq("id",modal.id);
    if(error)toast(error.message,"error");else{toast("Updated");reload("contacts");setSelected({...selected,...f});}
  };
  const del=async id=>{
    const{error}=await sb.from("contacts").delete().eq("id",id);
    if(error)toast(error.message,"error");else{toast("Deleted");reload("contacts");if(selected?.id===id)setSelected(null);}
  };
  const cDeals=selected?data.deals.filter(d=>d.contactId===selected.id):[];
  const cNotes=selected?data.notes.filter(n=>n.contactId===selected.id):[];

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"14px 20px",display:"flex",gap:10,alignItems:"center",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search prospects…" style={{flex:1}}/>
        <Btn onClick={()=>setModal("add")}>+ New Contact</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {filtered.length===0&&<div style={{padding:"60px 24px",color:B.textMute,textAlign:"center",fontSize:14}}>No prospect contacts yet.</div>}
        {filtered.map(c=><div key={c.id} onClick={()=>setSelected(c)} style={{padding:"13px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===c.id?B.bg:B.white}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:700,color:B.navy,marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:12,color:B.textSoft}}>{c.company||c.email||"—"}</div>
            </div>
            <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
          </div>
        </div>)}
      </div>
    </div>
    {selected?(
      <div style={{width:370,padding:22,overflowY:"auto",flexShrink:0,background:B.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{selected.name}</div>
            <div style={{fontSize:12,color:B.textSoft,marginTop:2}}>{selected.company}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn>
            <Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn>
          </div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:12}}/>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
          {selected.email&&<IRow label="Email" value={selected.email}/>}
          {selected.phone&&<IRow label="Phone" value={selected.phone}/>}
          {selected.tags&&<IRow label="Tags" value={selected.tags}/>}
          <IRow label="Added" value={fmt(selected.createdAt)}/>
        </div>
        <SectionLabel>Deals ({cDeals.length})</SectionLabel>
        {cDeals.length===0?<Empty text="No deals linked."/>:cDeals.map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><span style={{fontSize:13}}>{d.title}</span><Badge scheme={STAGE_COLORS[d.stage]}>{d.stage}</Badge></div>)}
        <SectionLabel>Notes ({cNotes.length})</SectionLabel>
        {cNotes.length===0?<Empty text="No notes."/>:cNotes.slice(0,3).map(n=><div key={n.id} style={{padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><div style={{fontSize:13,color:B.textMid}}>{n.body}</div><div style={{fontSize:11,color:B.textMute,marginTop:2}}>{fmt(n.createdAt)}</div></div>)}
      </div>
    ):<div style={{width:370,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a contact</div>}
    {modal==="add"&&<Modal title="New Prospect Contact" onClose={()=>setModal(null)}><ProspectContactForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Contact" onClose={()=>setModal(null)}><ProspectContactForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// Prospecting wrappers — filter to no-family records only
function ProspectPipelineView({data,reload,toast}){
  return <DealsView data={{...data,contacts:data.contacts.filter(c=>!c.familyId),families:[],deals:data.deals.filter(d=>!d.familyId)}} reload={reload} toast={toast}/>;
}
function ProspectNotesView({data,reload,toast}){
  return <NotesView data={{...data,contacts:data.contacts.filter(c=>!c.familyId),families:[],notes:data.notes.filter(n=>!n.familyId)}} reload={reload} toast={toast}/>;
}
function ProspectTasksView({data,reload,toast}){
  return <TasksView data={{...data,contacts:data.contacts.filter(c=>!c.familyId),families:[],tasks:data.tasks.filter(t=>!t.familyId)}} reload={reload} toast={toast}/>;
}

// Client Management wrappers — filter to family-linked records only
function CMNotesView({data,reload,toast}){
  return <NotesView data={{...data,notes:data.notes.filter(n=>n.familyId)}} reload={reload} toast={toast}/>;
}
function CMTasksView({data,reload,toast}){
  return <TasksView data={{...data,tasks:data.tasks.filter(t=>t.familyId)}} reload={reload} toast={toast}/>;
}

// ── APP ────────────────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("dashboard");
  const[data,setData]=useState({families:[],contacts:[],properties:[],deals:[],notes:[],tasks:[]});
  const[loading,setLoading]=useState(true);
  const[toastState,setToastState]=useState(null);
  const[authed,setAuthed]=useState(()=>sessionStorage.getItem("pcm_auth")==="1");

  const logout=()=>{sessionStorage.removeItem("pcm_auth");setAuthed(false);};

  const showToast=useCallback((msg,type="success")=>{setToastState({msg,type});setTimeout(()=>setToastState(null),3000);},[]);

  const fetchTable=useCallback(async table=>{
    const{data:rows,error}=await sb.from(table).select("*").order("created_at",{ascending:false});
    if(error){showToast(`Error loading ${table}`,"error");return;}
    setData(p=>({...p,[table]:rows.map(toClient)}));
  },[showToast]);

  const reload=useCallback(async table=>{
    if(table)await fetchTable(table);
    else await Promise.all(TABLES.map(fetchTable));
  },[fetchTable]);

  useEffect(()=>{
    if(!authed)return;
    (async()=>{setLoading(true);await reload();setLoading(false);})();
  },[authed]);

  const cmStats={
    families:   data.families.length,
    properties: data.properties.length,
    "cm-notes": data.notes.filter(n=>n.familyId).length,
    "cm-tasks": data.tasks.filter(t=>t.familyId&&!t.done).length,
  };
  const pStats={
    "p-contacts": data.contacts.filter(c=>!c.familyId).length,
    "p-pipeline": data.deals.filter(d=>!d.familyId&&d.stage!=="Closed Lost").length,
    "p-notes":    data.notes.filter(n=>!n.familyId).length,
    "p-tasks":    data.tasks.filter(t=>!t.familyId&&!t.done).length,
  };
  const allStats={...cmStats,...pStats};
  const overdue=data.tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
  const currentLabel=ALL_NAV.find(n=>n.id===tab)?.label||"";
  const currentSection=NAV_SECTIONS.find(s=>s.items.some(i=>i.id===tab))?.section||"";

  if(!authed)return <LoginScreen onLogin={()=>setAuthed(true)}/>;

  return <div style={{display:"flex",height:"100vh",background:B.bg,fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:B.text,overflow:"hidden"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

    {/* Sidebar */}
    <div style={{width:232,background:B.navy,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <PCMLogo dark={true}/>
        <div style={{fontSize:8,color:"rgba(206,182,132,0.5)",letterSpacing:"0.18em",marginTop:8}}>DISCOVER · SIMPLIFY · EXECUTE</div>
      </div>
      <nav style={{flex:1,padding:"8px",overflowY:"auto"}}>
        {NAV_SECTIONS.map(({section,items})=><div key={section} style={{marginBottom:6}}>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(206,182,132,0.55)",letterSpacing:"0.16em",padding:"10px 10px 4px",textTransform:"uppercase"}}>{section}</div>
          {items.map(item=><button key={item.id} onClick={()=>setTab(item.id)} style={{
            width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",
            borderRadius:8,border:"none",cursor:"pointer",
            background:tab===item.id?"rgba(206,182,132,0.18)":"transparent",
            color:tab===item.id?B.gold:"rgba(255,255,255,0.85)",
            fontFamily:"inherit",fontSize:13,fontWeight:tab===item.id?700:400,
            marginBottom:1,textAlign:"left",
            borderLeft:tab===item.id?`2px solid ${B.gold}`:"2px solid transparent",
          }}>
            <span style={{fontSize:12}}>{item.icon}</span>
            <span style={{flex:1}}>{item.label}</span>
            {item.id==="cm-tasks"&&overdue>0
              ?<span style={{background:"#d43030",borderRadius:10,padding:"1px 6px",fontSize:9,color:"#fff",fontWeight:700}}>{overdue}</span>
              :allStats[item.id]>0
              ?<span style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"1px 6px",fontSize:9,color:"rgba(255,255,255,0.7)"}}>{allStats[item.id]}</span>
              :null}
          </button>)}
        </div>)}
      </nav>
      <div style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{data.families.length} families · {data.properties.length} properties</div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button onClick={()=>reload()} style={{background:"none",border:"none",color:"rgba(206,182,132,0.6)",fontSize:9,cursor:"pointer",padding:0,fontFamily:"inherit"}}>↺ Refresh</button>
          <button onClick={logout} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:9,cursor:"pointer",padding:0,fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </div>
    </div>

    {/* Main */}
    <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
      <div style={{padding:"13px 28px 11px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:1}}>{currentSection}</div>
          <h1 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,fontWeight:600}}>{currentLabel}</h1>
        </div>
        <div style={{fontSize:11,color:B.textMute}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${B.gold},${B.goldLight}55,transparent)`}}/>
      <div style={{flex:1,minHeight:0,overflow:"hidden",background:B.bg}}>
        {loading?<Spinner/>:<>
          {tab==="dashboard"  &&<Dashboard            data={data}/>}
          {tab==="families"   &&<FamiliesView          data={data} reload={reload} toast={showToast}/>}
          {tab==="properties" &&<PropertiesView        data={data} reload={reload} toast={showToast}/>}
          {tab==="cm-notes"   &&<CMNotesView           data={data} reload={reload} toast={showToast}/>}
          {tab==="cm-tasks"   &&<CMTasksView           data={data} reload={reload} toast={showToast}/>}
          {tab==="p-contacts" &&<ProspectContactsView  data={data} reload={reload} toast={showToast}/>}
          {tab==="p-pipeline" &&<ProspectPipelineView  data={data} reload={reload} toast={showToast}/>}
          {tab==="p-notes"    &&<ProspectNotesView     data={data} reload={reload} toast={showToast}/>}
          {tab==="p-tasks"    &&<ProspectTasksView     data={data} reload={reload} toast={showToast}/>}
        </>}
      </div>
    </div>
    {toastState&&<Toast msg={toastState.msg} type={toastState.type}/>}
  </div>;
}
