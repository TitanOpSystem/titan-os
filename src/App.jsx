import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://unkirihxtruhdjeldfpm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2lyaWh4dHJ1aGRqZWxkZnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTA3MjUsImV4cCI6MjA5MTcyNjcyNX0._Ve9Pr3ooja-YdHYFIupebaZRhDjmJDnz2b-vzrhY04";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── LOGO (embedded — no external file needed) ─────────────────────────────────
const PCM_LOGO = "data:image/jpeg;base64,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";

// ── AUTH ─────────────────────────────────────────────────────────────────────
// Supabase Auth handles login — managed via Supabase dashboard

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
  const m = {family_id:"familyId",contact_id:"contactId",account_id:"accountId",close_date:"closeDate",due_date:"dueDate",created_at:"createdAt",uploaded_at:"uploadedAt",advisor_name:"advisorName",advisor_email:"advisorEmail",owner_name:"ownerName",property_type:"propertyType",purchase_price:"purchasePrice",purchase_date:"purchaseDate",current_value:"currentValue",loan_balance:"loanBalance",interest_rate:"interestRate",loan_payment:"loanPayment",loan_maturity_date:"loanMaturityDate",loan_type:"loanType",rental_income:"rentalIncome",property_taxes:"propertyTaxes",flood_insurance:"floodInsurance",insurance_company:"insuranceCompany",insurance_premium:"insurancePremium",flood_insurance_company:"floodInsuranceCompany",flood_insurance_premium:"floodInsurancePremium",account_type:"accountType",starting_balance:"startingBalance",current_balance:"currentBalance",banker_name:"bankerName",make_model:"makeModel",estimated_value:"estimatedValue",file_type:"fileType"};
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

// ── PCM LOGO ─────────────────────────────────────────────────────────────────
function PCMLogo({dark=false}){
  if(dark){
    // Sidebar: logo on a white rounded background so it shows on navy
    return (
      <div style={{background:"#ffffff",borderRadius:8,padding:"6px 10px",display:"inline-block"}}>
        <img src={PCM_LOGO} alt="PCM Family Office" style={{height:38,width:"auto",display:"block"}}/>
      </div>
    );
  }
  // Login screen: full size color logo
  return <img src={PCM_LOGO} alt="PCM Family Office" style={{height:80,width:"auto",display:"block",margin:"0 auto"}}/>;
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
        <img src="${PCM_LOGO}" alt="PCM Family Office" style="height:60px;width:auto;"/>
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
  const {families,contacts,properties,deals,tasks,valuables=[]}=data;
  const [familyTab,setFamilyTab]=useState("overview"); // overview | properties | valuables
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
  const fValuables=sel=>valuables.filter(v=>v.familyId===sel.id);
  const valuablesTotal=sel=>fValuables(sel).reduce((s,v)=>s+(Number(v.estimatedValue)||0),0);

  const addValuable=async(f,famId)=>{const row={family_id:famId,category:f.category,description:f.description,make_model:f.makeModel||null,year:f.year||null,estimated_value:f.estimatedValue||null,insured:!!f.insured,insurance_company:f.insuranceCompany||null,notes:f.notes||null};const{error}=await sb.from("valuables").insert(row);if(error)toast(error.message,"error");else{toast("Valuable added");reload("valuables");}};
  const delValuable=async id=>{const{error}=await sb.from("valuables").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("valuables");}};
  const [valuableModal,setValuableModal]=useState(null);

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
          {/* Family sub-tabs */}
          <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${B.borderLight}`,paddingBottom:8}}>
            {["Overview","Properties","Valuables"].map(t=><button key={t} onClick={()=>setFamilyTab(t.toLowerCase())} style={{background:familyTab===t.toLowerCase()?B.navy:"transparent",border:"none",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:600,color:familyTab===t.toLowerCase()?B.white:B.textSoft,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
          </div>

          {familyTab==="overview"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {l:"Members",v:fContacts(selected).length},
              {l:"Properties",v:fProperties(selected).length},
              {l:"Valuables",v:fValuables(selected).length},
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

          <SectionLabel>Open Deals</SectionLabel>
          {fDeals(selected).length===0?<Empty text="No open deals."/>:fDeals(selected).map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
            <span style={{fontSize:13,color:B.text}}>{d.title}</span>
            <Badge scheme={STAGE_COLORS[d.stage]}>{d.stage}</Badge>
          </div>)}
          </>}

          {familyTab==="properties"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:12,color:B.textSoft}}>{fProperties(selected).length} properties · {fmtMoney(portfolioValue(selected))} total</span>
          </div>
          {fProperties(selected).length===0?<Empty text="No properties. Add from the Properties page."/>:fProperties(selected).map(p=><div key={p.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${B.gold}`,borderRadius:8,padding:"12px 14px",marginBottom:8}}>
            <div style={{fontWeight:700,color:B.navy,marginBottom:4}}>{p.address}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {p.ownerName&&<div style={{fontSize:11,color:B.textSoft}}>Owner: {p.ownerName}</div>}
              <div style={{fontSize:11,color:B.textSoft}}>Value: {fmtMoney(p.currentValue||p.purchasePrice)}</div>
              {p.loanBalance&&<div style={{fontSize:11,color:B.textSoft}}>Balance: {fmtMoney(p.loanBalance)}</div>}
              {p.interestRate&&<div style={{fontSize:11,color:B.textSoft}}>Rate: {fmtPct(p.interestRate)}</div>}
              {p.rentalIncome&&<div style={{fontSize:11,color:B.textSoft}}>Rental: {fmtMoney(p.rentalIncome)}/mo</div>}
              {p.loanMaturityDate&&<div style={{fontSize:11,color:B.textSoft}}>Matures: {fmt(p.loanMaturityDate)}</div>}
            </div>
          </div>)}
          </>}

          {familyTab==="valuables"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:12,color:B.textSoft}}>{fValuables(selected).length} items · {fmtMoney(valuablesTotal(selected))} est. value</span>
            <Btn small onClick={()=>setValuableModal({familyId:selected.id})}>+ Add</Btn>
          </div>
          {fValuables(selected).length===0?<Empty text="No valuables recorded."/>:VALUABLE_CATS.map(cat=>{
            const items=fValuables(selected).filter(v=>v.category===cat);
            if(!items.length)return null;
            return <div key={cat} style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{cat}</div>
              {items.map(v=><div key={v.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${B.navyMid}`,borderRadius:8,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontWeight:600,color:B.navy,fontSize:13}}>{v.description}</div>
                  {v.makeModel&&<div style={{fontSize:11,color:B.textSoft}}>{v.makeModel}{v.year?` · ${v.year}`:""}</div>}
                  {v.insured&&<div style={{fontSize:11,color:"#18a850",fontWeight:600}}>✓ Insured{v.insuranceCompany?` — ${v.insuranceCompany}`:""}</div>}
                </div>
                <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  <div style={{fontSize:13,fontWeight:700,color:B.navy}}>{fmtMoney(v.estimatedValue)}</div>
                  <button onClick={()=>delValuable(v.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:13}}>✕</button>
                </div>
              </div>)}
            </div>;
          })}
          </>}

          <SectionLabel>Pending Tasks</SectionLabel>
          {fTasks(selected).length===0?<Empty text="No pending tasks."/>:fTasks(selected).map(t=>{
            const isOD=t.dueDate&&new Date(t.dueDate)<new Date();
            return <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
              <span style={{fontSize:13,color:B.text}}>{t.title}</span>
              <span style={{fontSize:11,color:isOD?"#d43030":B.textSoft,fontWeight:isOD?700:400}}>{isOD?"⚠ ":""}{fmt(t.dueDate)}</span>
            </div>;
          })}

          {familyTab==="overview"&&selected.notes&&<><SectionLabel>Notes</SectionLabel><div style={{fontSize:13,color:B.textMid,lineHeight:1.6}}>{selected.notes}</div></>}
        </div>
      </div>
    ):<div style={{width:400,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a family</div>}

    {modal==="add"&&<Modal title="New Family" onClose={()=>setModal(null)}><FamilyForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Family" onClose={()=>setModal(null)}><FamilyForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
    {reportFamily&&<FamilyReport family={reportFamily} data={data} onClose={()=>setReportFamily(null)}/>}
    {valuableModal&&<Modal title="Add Valuable" onClose={()=>setValuableModal(null)}><ValuableForm onSave={f=>addValuable(f,valuableModal.familyId)} onClose={()=>setValuableModal(null)}/></Modal>}
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
  const[body,setBody]=useState("");
  const[cid,setCid]=useState("");
  const[fid,setFid]=useState("");
  const[search,setSearch]=useState("");
  const[saving,setSaving]=useState(false);
  const gc=id=>contacts.find(c=>c.id===id);
  const gf=id=>families.find(f=>f.id===id);

  const add=async()=>{if(!body.trim())return;setSaving(true);const{error}=await sb.from("notes").insert({body,contact_id:cid||null,family_id:fid||null});setSaving(false);if(error)toast(error.message,"error");else{toast("Note added");setBody("");reload("notes");}};
  const del=async id=>{const{error}=await sb.from("notes").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("notes");}};
  const filtered=notes.filter(n=>n.body.toLowerCase().includes(search.toLowerCase())||(gc(n.contactId)?.name||"").toLowerCase().includes(search.toLowerCase())||(gf(n.familyId)?.name||"").toLowerCase().includes(search.toLowerCase()));

  return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    {/* Compose area */}
    <div style={{padding:"20px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:8,fontSize:12,color:B.textSoft,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>New Activity Note</div>
        <div style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}>
          <textarea
            value={body}
            onChange={e=>setBody(e.target.value)}
            placeholder="Write a note, meeting summary, or activity log entry…"
            style={{width:"100%",minHeight:90,background:"transparent",border:"none",padding:"14px 16px",color:B.text,fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}
          />
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 14px",borderTop:`1px solid ${B.borderLight}`,background:B.white,flexWrap:"wrap"}}>
            <select value={fid} onChange={e=>setFid(e.target.value)} style={{...{background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,padding:"6px 10px",color:B.text,fontSize:13,outline:"none",fontFamily:"inherit"},flex:1,minWidth:130}}>
              <option value="">🏠 Family (optional)</option>
              {families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select value={cid} onChange={e=>setCid(e.target.value)} style={{...{background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,padding:"6px 10px",color:B.text,fontSize:13,outline:"none",fontFamily:"inherit"},flex:1,minWidth:130}}>
              <option value="">👤 Contact (optional)</option>
              {contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Btn onClick={add} disabled={saving||!body.trim()} style={{flexShrink:0}}>{saving?"Saving…":"Log Note"}</Btn>
          </div>
        </div>
      </div>
    </div>

    {/* Search + feed */}
    <div style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:16,position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…"
            style={{width:"100%",background:B.white,border:`1px solid ${B.border}`,borderRadius:8,padding:"9px 14px 9px 36px",color:B.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",boxShadow:B.shadow}}/>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:B.textMute,fontSize:14}}>🔍</span>
        </div>

        {filtered.length===0&&<div style={{padding:"60px 0",color:B.textMute,textAlign:"center",fontSize:14}}>
          <div style={{fontSize:32,marginBottom:12}}>📝</div>
          No notes yet. Start logging activity above.
        </div>}

        {filtered.map(n=>{
          const contact=gc(n.contactId);
          const fam=gf(n.familyId);
          return <div key={n.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,marginBottom:12,boxShadow:B.shadow,overflow:"hidden"}}>
            {/* Color bar top */}
            <div style={{height:3,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`}}/>
            <div style={{padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
                <p style={{margin:0,color:B.text,fontSize:14,lineHeight:1.7,flex:1,fontFamily:"'Georgia',serif"}}>{n.body}</p>
                <button onClick={()=>del(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14,flexShrink:0,padding:"2px 4px",borderRadius:4}} title="Delete">✕</button>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:B.textMute,display:"flex",alignItems:"center",gap:4}}>🕐 {fmt(n.createdAt)}</span>
                {fam&&<span style={{background:"#e8f0f8",color:B.navyMid,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>🏠 {fam.name}</span>}
                {contact&&<span style={{background:"#fef3e2",color:"#8a5c00",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>👤 {contact.name}</span>}
              </div>
            </div>
          </div>;
        })}
      </div>
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

// ── LOGIN SCREEN (Supabase Auth) ─────────────────────────────────────────────
function LoginScreen({onLogin}){
  const[mode,setMode]=useState("login"); // login | reset
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);
  const[resetSent,setResetSent]=useState(false);

  const handleLogin=async()=>{
    if(!email||!password)return setError("Please enter your email and password.");
    setLoading(true);setError("");
    const{error:e}=await sb.auth.signInWithPassword({email,password});
    setLoading(false);
    if(e)setError(e.message);
    else onLogin();
  };

  const handleReset=async()=>{
    if(!email)return setError("Please enter your email address.");
    setLoading(true);setError("");
    const{error:e}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    setLoading(false);
    if(e)setError(e.message);
    else setResetSent(true);
  };

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.navy} 0%,${B.navyMid} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div style={{position:"fixed",inset:0,backgroundImage:`radial-gradient(circle at 20% 80%,rgba(206,182,132,0.06) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(206,182,132,0.04) 0%,transparent 50%)`,pointerEvents:"none"}}/>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"48px 44px",width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(0,0,0,0.35)",border:`1px solid rgba(206,182,132,0.3)`,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><PCMLogo/></div>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold},transparent)`,marginBottom:20}}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>{mode==="reset"?"Reset Password":"Client Portal"}</div>
          <div style={{fontSize:11,color:B.textMute,letterSpacing:"0.1em",marginTop:4}}>{mode==="reset"?"ENTER YOUR EMAIL":"SECURE ACCESS"}</div>
        </div>

        {resetSent?(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>📧</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,marginBottom:8}}>Check your email</div>
            <div style={{fontSize:13,color:B.textSoft,marginBottom:24}}>We've sent a password reset link to <strong>{email}</strong></div>
            <Btn onClick={()=>{setMode("login");setResetSent(false);}}>Back to Sign In</Btn>
          </div>
        ):(
          <>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,color:B.textSoft,marginBottom:6,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Email</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleReset())}
                placeholder="you@pcmfamilyoffice.com" autoFocus
                style={{width:"100%",background:B.bg,border:`1.5px solid ${error?B.border:B.border}`,borderRadius:10,padding:"13px 16px",color:B.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            {mode==="login"&&(
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,color:B.textSoft,marginBottom:6,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Password</label>
                <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  placeholder="••••••••"
                  style={{width:"100%",background:B.bg,border:`1.5px solid ${B.border}`,borderRadius:10,padding:"13px 16px",color:B.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            )}
            {error&&<div style={{fontSize:12,color:"#d43030",marginBottom:12,fontWeight:600,padding:"8px 12px",background:"#fde8e8",borderRadius:8}}>{error}</div>}
            <button onClick={mode==="login"?handleLogin:handleReset} disabled={loading}
              style={{width:"100%",background:`linear-gradient(135deg,${B.navy},${B.navyMid})`,color:B.white,border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.06em",marginBottom:16,opacity:loading?.7:1}}>
              {loading?"Please wait…":mode==="login"?"SIGN IN":"SEND RESET LINK"}
            </button>
            <div style={{textAlign:"center"}}>
              {mode==="login"?(
                <button onClick={()=>{setMode("reset");setError("");}} style={{background:"none",border:"none",color:B.textSoft,fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Forgot your password?</button>
              ):(
                <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:B.textSoft,fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Back to sign in</button>
              )}
            </div>
          </>
        )}
        <div style={{textAlign:"center",marginTop:24,fontSize:11,color:B.textMute,letterSpacing:"0.05em"}}>PCM Family Office · DISCOVER · SIMPLIFY · EXECUTE</div>
      </div>
    </div>
  );
}

// ── PORTFOLIO VIEW ────────────────────────────────────────────────────────────
function PortfolioView({data,reload,toast}){
  const{families,portfolio_accounts=[]}=data;
  const[modal,setModal]=useState(null);
  const[filterFamily,setFilterFamily]=useState("all");
  const[selected,setSelected]=useState(null);
  const gf=id=>families.find(f=>f.id===id);

  const accounts=portfolio_accounts.filter(a=>filterFamily==="all"||a.familyId===filterFamily);
  const totalValue=accounts.reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalStart=accounts.reduce((s,a)=>s+(Number(a.startingBalance)||0),0);
  const totalGain=totalValue-totalStart;
  const totalPct=totalStart>0?((totalGain/totalStart)*100).toFixed(2):null;

  const pctChange=(a)=>{
    const s=Number(a.startingBalance)||0;
    const c=Number(a.currentBalance)||0;
    if(!s) return null;
    return (((c-s)/s)*100).toFixed(2);
  };

  const AcctForm=({initial,onSave,onClose})=>{
    const[f,setF]=useState(initial||{familyId:"",institution:"",bankerName:"",accountType:"Investment",startingBalance:"",currentBalance:"",notes:""});
    const[saving,setSaving]=useState(false);
    const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
    const save=async()=>{if(!f.institution.trim())return;setSaving(true);await onSave(f);onClose();};
    const pct=pctChange({startingBalance:f.startingBalance,currentBalance:f.currentBalance});
    return <div>
      <Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— No family —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>
      <Grid2>
        <Field label="Institution"><Inp placeholder="Merrill Lynch" value={f.institution} onChange={set("institution")}/></Field>
        <Field label="Banker / Advisor Name"><Inp placeholder="John Smith" value={f.bankerName||""} onChange={set("bankerName")}/></Field>
      </Grid2>
      <Field label="Account Type"><Sel value={f.accountType} onChange={set("accountType")}><option>Investment</option><option>Brokerage</option><option>Retirement (IRA)</option><option>401(k)</option><option>Trust</option><option>Savings</option><option>Other</option></Sel></Field>
      <Grid2>
        <Field label="Starting Balance"><Inp type="number" placeholder="500000" value={f.startingBalance||""} onChange={set("startingBalance")}/></Field>
        <Field label="Current Balance"><Inp type="number" placeholder="620000" value={f.currentBalance||""} onChange={set("currentBalance")}/></Field>
      </Grid2>
      {pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#18a850":"#d43030"}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{Number(pct)>=0?"📈":"📉"}</span>
        <div>
          <div style={{fontSize:11,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Performance</div>
          <div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}%</div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <div style={{fontSize:11,color:B.textMute}}>Gain / Loss</div>
          <div style={{fontSize:14,fontWeight:700,color:Number(pct)>=0?"#18a850":"#d43030"}}>{fmtMoney(Math.abs(Number(f.currentBalance||0)-Number(f.startingBalance||0)))}</div>
        </div>
      </div>}
      <Field label="Notes"><Tex placeholder="Additional notes…" value={f.notes||""} onChange={set("notes")}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Account"}</Btn>
      </div>
    </div>;
  };

  const add=async f=>{const row={family_id:f.familyId||null,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null};const{error}=await sb.from("portfolio_accounts").insert(row);if(error)toast(error.message,"error");else{toast("Account added");reload("portfolio_accounts");}};
  const edit=async f=>{const row={family_id:f.familyId||null,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null};const{error}=await sb.from("portfolio_accounts").update(row).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("portfolio_accounts");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("portfolio_accounts").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("portfolio_accounts");if(selected?.id===id)setSelected(null);}};

  const ACCT_TYPES=["Investment","Brokerage","Retirement (IRA)","401(k)","Trust","Savings","Other"];

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:180}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
        <div style={{flex:1,display:"flex",gap:16}}>
          <div style={{fontSize:12,color:B.textSoft}}>Total Value: <strong style={{color:B.navy}}>{fmtMoney(totalValue)}</strong></div>
          {totalPct!==null&&<div style={{fontSize:12,color:Number(totalPct)>=0?"#18a850":"#d43030",fontWeight:700}}>{Number(totalPct)>=0?"+":""}{totalPct}% overall</div>}
        </div>
        <Btn onClick={()=>setModal("add")}>+ New Account</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {accounts.length===0&&<div style={{padding:"60px 24px",color:B.textMute,textAlign:"center",fontSize:14}}>No portfolio accounts yet.</div>}
        {ACCT_TYPES.map(type=>{
          const list=accounts.filter(a=>a.accountType===type);
          if(!list.length)return null;
          const typeTotal=list.reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
          return <div key={type}>
            <div style={{padding:"10px 20px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase"}}>{type}</span>
              <span style={{fontSize:11,color:B.textSoft,fontWeight:700}}>{fmtMoney(typeTotal)}</span>
            </div>
            {list.map(a=>{
              const pct=pctChange(a);
              const fam=gf(a.familyId);
              return <div key={a.id} onClick={()=>setSelected(a)} style={{padding:"13px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===a.id?B.bg:B.white,borderLeft:`3px solid ${B.gold}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:700,color:B.navy,marginBottom:2}}>{a.institution}</div>
                    <div style={{fontSize:12,color:B.textSoft}}>{a.bankerName?`${a.bankerName} · `:""}{fam?fam.name:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:700,color:B.navy}}>{fmtMoney(a.currentBalance)}</div>
                    {pct!==null&&<div style={{fontSize:11,fontWeight:700,color:Number(pct)>=0?"#18a850":"#d43030"}}>{Number(pct)>=0?"+":""}{pct}%</div>}
                  </div>
                </div>
              </div>;
            })}
          </div>;
        })}
      </div>
    </div>

    {selected?(
      <div style={{width:380,overflowY:"auto",flexShrink:0,background:B.bg}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{selected.institution}</div>
            <div style={{fontSize:12,color:B.textSoft,marginTop:2}}>{selected.accountType}</div>
          </div>
          <div style={{display:"flex",gap:6}}><Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn></div>
        </div>
        <div style={{padding:"16px 22px"}}>
          {(()=>{const pct=pctChange(selected);const gain=(Number(selected.currentBalance)||0)-(Number(selected.startingBalance)||0);return pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:10,padding:"14px 18px",marginBottom:18,display:"flex",gap:16,alignItems:"center"}}>
            <div style={{fontSize:28}}>{Number(pct)>=0?"📈":"📉"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Performance</div>
              <div style={{fontSize:26,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}%</div>
              <div style={{fontSize:12,color:Number(pct)>=0?"#18a850":"#d43030",fontWeight:700,marginTop:2}}>{Number(gain)>=0?"+":""}{fmtMoney(Math.abs(gain))} total</div>
            </div>
          </div>;})()}
          {[
            {section:"Account",rows:[["Family",gf(selected.familyId)?.name||"—"],["Banker",selected.bankerName||"—"],["Type",selected.accountType]]},
            {section:"Balances",rows:[["Starting",fmtMoney(selected.startingBalance)],["Current",fmtMoney(selected.currentBalance)]]},
          ].map(({section,rows})=><div key={section} style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,paddingBottom:4,borderBottom:`1px solid ${B.borderLight}`}}>{section}</div>
            {rows.map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${B.borderLight}`}}>
              <span style={{fontSize:12,color:B.textSoft}}>{l}</span>
              <span style={{fontSize:12,color:B.text,fontWeight:600}}>{v}</span>
            </div>)}
          </div>)}
          {selected.notes&&<><div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Notes</div><div style={{fontSize:13,color:B.textMid,lineHeight:1.6}}>{selected.notes}</div></>}
        </div>
      </div>
    ):<div style={{width:380,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select an account</div>}

    {modal==="add"&&<Modal title="New Portfolio Account" onClose={()=>setModal(null)}><AcctForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Account" onClose={()=>setModal(null)}><AcctForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── VALUABLES FORM/VIEW (embedded in Family) ──────────────────────────────────
const VALUABLE_CATS=["Car / Vehicle","Jewelry","Art","Watch","Boat / Watercraft","Other"];

function ValuableForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{category:"Car / Vehicle",description:"",makeModel:"",year:"",estimatedValue:"",insured:false,insuranceCompany:"",notes:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const setChk=k=>e=>setF(p=>({...p,[k]:e.target.checked}));
  const save=async()=>{if(!f.description.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2>
      <Field label="Category"><Sel value={f.category} onChange={set("category")}>{VALUABLE_CATS.map(c=><option key={c}>{c}</option>)}</Sel></Field>
      <Field label="Year"><Inp type="number" placeholder="2023" value={f.year||""} onChange={set("year")}/></Field>
    </Grid2>
    <Field label="Description"><Inp placeholder="2023 Ferrari Roma" value={f.description} onChange={set("description")}/></Field>
    <Grid2>
      <Field label="Make / Model"><Inp placeholder="Ferrari Roma" value={f.makeModel||""} onChange={set("makeModel")}/></Field>
      <Field label="Estimated Value"><Inp type="number" placeholder="250000" value={f.estimatedValue||""} onChange={set("estimatedValue")}/></Field>
    </Grid2>
    <div style={{marginBottom:14}}>
      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:f.insured?"#e8f0f8":B.bg,borderRadius:8,border:`1px solid ${f.insured?B.navyMid:B.border}`}}>
        <input type="checkbox" checked={!!f.insured} onChange={setChk("insured")} style={{width:16,height:16,accentColor:B.navy}}/>
        <span style={{fontSize:13,color:B.navy,fontWeight:600}}>Insured</span>
      </label>
    </div>
    {f.insured&&<Field label="Insurance Company"><Inp placeholder="Chubb, AIG…" value={f.insuranceCompany||""} onChange={set("insuranceCompany")}/></Field>}
    <Field label="Notes"><Tex placeholder="Additional notes…" value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn>
    </div>
  </div>;
}


// ── USER MANAGEMENT (Admin only) ─────────────────────────────────────────────
function UserManagementView({userProfile,toast}){
  const[users,setUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[invEmail,setInvEmail]=useState("");
  const[invName,setInvName]=useState("");
  const[invRole,setInvRole]=useState("advisor");
  const[inviting,setInviting]=useState(false);

  const loadUsers=async()=>{
    const{data}=await sb.from("user_profiles").select("*").order("created_at",{ascending:false});
    if(data)setUsers(data);
    setLoading(false);
  };

  useEffect(()=>{loadUsers();},[]);

  const invite=async()=>{
    if(!invEmail.trim())return;
    setInviting(true);
    // Create user via Supabase Admin API — uses service role key on backend
    // For now, we use signUp which sends confirmation email
    const{error}=await sb.auth.admin?.inviteUserByEmail
      ? sb.auth.admin.inviteUserByEmail(invEmail,{data:{full_name:invName,role:invRole}})
      : sb.auth.signUp({email:invEmail,password:Math.random().toString(36).slice(2,12)+"Aa1!",options:{data:{full_name:invName,role:invRole}}});
    
    if(error){
      // Fallback: just insert profile and let admin set up user in Supabase dashboard
      toast(`Note: User invite requires Supabase admin setup. Add ${invEmail} in your Supabase dashboard → Authentication → Users, then set role to '${invRole}' in user_profiles table.`,"error");
    } else {
      toast(`Invite sent to ${invEmail}. They'll receive an email to set their password.`);
      setModal(null);
      setInvEmail("");setInvName("");setInvRole("advisor");
      setTimeout(loadUsers,1000);
    }
    setInviting(false);
  };

  const toggleActive=async(user)=>{
    const{error}=await sb.from("user_profiles").update({active:!user.active}).eq("id",user.id);
    if(error)toast(error.message,"error");
    else{toast(user.active?"Account deactivated":"Account activated");loadUsers();}
  };

  const changeRole=async(user,role)=>{
    const{error}=await sb.from("user_profiles").update({role}).eq("id",user.id);
    if(error)toast(error.message,"error");
    else{toast("Role updated");loadUsers();}
  };

  if(userProfile?.role!=="admin") return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:12,color:B.textMute}}>
      <div style={{fontSize:40}}>🔒</div>
      <div style={{fontSize:16,color:B.navy,fontWeight:600}}>Admin Access Only</div>
      <div style={{fontSize:13}}>You need admin privileges to manage users.</div>
    </div>
  );

  return(
    <div style={{height:"100%",overflow:"auto",padding:"28px 32px"}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:B.navy,fontWeight:600,marginBottom:4}}>User Management</div>
            <div style={{fontSize:13,color:B.textSoft}}>{users.length} employee accounts</div>
          </div>
          <Btn onClick={()=>setModal("invite")}>+ Invite Employee</Btn>
        </div>

        {loading?<Spinner/>:(
          <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 140px 120px 100px",padding:"10px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.bg}}>
              {["Name","Email","Role","Status",""].map(h=><div key={h} style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase"}}>{h}</div>)}
            </div>
            {users.map(u=>(
              <div key={u.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 140px 120px 100px",padding:"14px 20px",borderBottom:`1px solid ${B.borderLight}`,alignItems:"center",opacity:u.active?1:0.6}}>
                <div>
                  <div style={{fontWeight:700,color:B.navy,fontSize:13}}>{u.full_name||"—"}</div>
                  {u.id===userProfile?.id&&<div style={{fontSize:10,color:B.gold,fontWeight:700}}>You</div>}
                </div>
                <div style={{fontSize:13,color:B.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                <div>
                  {u.id===userProfile?.id?(
                    <Badge scheme={{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}}>{u.role}</Badge>
                  ):(
                    <select value={u.role} onChange={e=>changeRole(u,e.target.value)}
                      style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,padding:"4px 8px",fontSize:12,color:B.text,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
                      <option value="advisor">Advisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </div>
                <div>
                  <span style={{background:u.active?"#e0f5e9":"#fde8e8",color:u.active?"#0d5c2b":"#8b1a1a",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                    {u.active?"Active":"Inactive"}
                  </span>
                </div>
                <div>
                  {u.id!==userProfile?.id&&(
                    <Btn small variant={u.active?"danger":"ghost"} onClick={()=>toggleActive(u)}>
                      {u.active?"Deactivate":"Activate"}
                    </Btn>
                  )}
                </div>
              </div>
            ))}
            {users.length===0&&<div style={{padding:"40px",textAlign:"center",color:B.textMute,fontSize:14}}>No users yet.</div>}
          </div>
        )}

        {/* Setup instructions */}
        <div style={{marginTop:24,background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,padding:24,boxShadow:B.shadow}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,marginBottom:8}}>How to Add Employees</div>
          <div style={{height:1,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:14}}/>
          <div style={{fontSize:13,color:B.textMid,lineHeight:1.8}}>
            <strong>1.</strong> Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:B.gold}}>supabase.com</a> → your project → <strong>Authentication → Users → Invite User</strong><br/>
            <strong>2.</strong> Enter their email — they'll receive a magic link to set their password<br/>
            <strong>3.</strong> Once they've signed in once, come back here and set their role to <strong>Admin</strong> or <strong>Advisor</strong><br/>
            <strong>4.</strong> Advisors automatically see only families where their email matches the assigned advisor email
          </div>
        </div>
      </div>

      {modal==="invite"&&<Modal title="Invite Employee" onClose={()=>setModal(null)}>
        <div style={{fontSize:13,color:B.textSoft,marginBottom:20}}>An invitation email will be sent. They'll set their own password.</div>
        <Field label="Full Name"><Inp placeholder="Jane Smith" value={invName} onChange={e=>setInvName(e.target.value)}/></Field>
        <Field label="Email Address"><Inp type="email" placeholder="jane@pcmfamilyoffice.com" value={invEmail} onChange={e=>setInvEmail(e.target.value)}/></Field>
        <Field label="Role">
          <Sel value={invRole} onChange={e=>setInvRole(e.target.value)}>
            <option value="advisor">Advisor — sees only assigned families</option>
            <option value="admin">Admin — sees everything, manages users</option>
          </Sel>
        </Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
          <Btn variant="ghost" onClick={()=>setModal(null)}>Cancel</Btn>
          <Btn onClick={invite} disabled={inviting}>{inviting?"Sending…":"Send Invite"}</Btn>
        </div>
      </Modal>}
    </div>
  );
}


const NAV_SECTIONS = [
  {
    section: "CLIENT MANAGEMENT",
    items: [
      {id:"dashboard",   label:"Dashboard",   icon:"⬡"},
      {id:"families",    label:"Families",    icon:"⌂"},
      {id:"portfolio",   label:"Portfolio",   icon:"◇"},
      {id:"cm-notes",    label:"Notes",       icon:"◧"},
      {id:"cm-tasks",    label:"Tasks",       icon:"◻"},
    ]
  },
  {
    section: "ADMIN",
    items: [
      {id:"users", label:"Users", icon:"⊕"},
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
const TABLES = ["families","contacts","properties","deals","notes","tasks","portfolio_accounts","valuables"];

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
  const[data,setData]=useState({families:[],contacts:[],properties:[],deals:[],notes:[],tasks:[],portfolio_accounts:[],valuables:[]});
  const[loading,setLoading]=useState(true);
  const[toastState,setToastState]=useState(null);
  const[authed,setAuthed]=useState(false);
  const[userProfile,setUserProfile]=useState(null); // {id, email, role, fullName}
  const[authLoading,setAuthLoading]=useState(true);

  const logout=async()=>{
    await sb.auth.signOut();
    setAuthed(false);
    setUserProfile(null);
  };

  // Load user profile after auth
  const loadProfile=useCallback(async(userId)=>{
    const{data}=await sb.from("user_profiles").select("*").eq("id",userId).single();
    if(data) setUserProfile({id:data.id,email:data.email,role:data.role,fullName:data.full_name,active:data.active});
  },[]);

  // Check auth on mount and listen for changes
  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>{
      if(session?.user){setAuthed(true);loadProfile(session.user.id);}
      setAuthLoading(false);
    });
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{
      if(session?.user){setAuthed(true);loadProfile(session.user.id);}
      else{setAuthed(false);setUserProfile(null);}
      setAuthLoading(false);
    });
    return()=>subscription.unsubscribe();
  },[loadProfile]);

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
    if(!authed||!userProfile)return;
    (async()=>{setLoading(true);await reload();setLoading(false);})();
  },[authed,userProfile]);

  const cmStats={
    families:   data.families.length,
    portfolio:  (data.portfolio_accounts||[]).length,
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

  if(authLoading)return <div style={{minHeight:"100vh",background:B.navy,display:"flex",alignItems:"center",justifyContent:"center"}}><PCMLogo dark/></div>;
  if(!authed||!userProfile)return <LoginScreen onLogin={()=>setAuthed(true)}/>;
  if(!userProfile.active)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:B.bg,fontFamily:"'DM Sans',sans-serif",color:B.navy,fontSize:16}}>Your account has been deactivated. Contact your administrator.</div>;

  return <div style={{display:"flex",height:"100vh",background:B.bg,fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:B.text,overflow:"hidden"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

    {/* Sidebar */}
    <div style={{width:232,background:B.navy,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <PCMLogo dark={true}/>
        <div style={{fontSize:8,color:"rgba(206,182,132,0.5)",letterSpacing:"0.18em",marginTop:8}}>DISCOVER · SIMPLIFY · EXECUTE</div>
      </div>
      <nav style={{flex:1,padding:"8px",overflowY:"auto"}}>
        {NAV_SECTIONS.filter(s=>s.section!=="ADMIN"||userProfile?.role==="admin").map(({section,items})=><div key={section} style={{marginBottom:6}}>
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
        {userProfile&&<div style={{marginBottom:8}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userProfile.fullName||userProfile.email}</div>
          <div style={{fontSize:9,color:B.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:1}}>{userProfile.role}</div>
        </div>}
        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginBottom:4}}>{data.families.length} families · {(data.portfolio_accounts||[]).length} accounts</div>
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
          {tab==="portfolio"  &&<PortfolioView         data={data} reload={reload} toast={showToast}/>}
          {tab==="cm-notes"   &&<CMNotesView           data={data} reload={reload} toast={showToast}/>}
          {tab==="cm-tasks"   &&<CMTasksView           data={data} reload={reload} toast={showToast}/>}
          {tab==="users"      &&<UserManagementView    userProfile={userProfile} toast={showToast}/>}
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
