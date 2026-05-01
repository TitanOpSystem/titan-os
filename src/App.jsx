import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { PCM_LOGO } from "./logo.js";
// PCM Platform v5.0 — build 20260429

const SUPABASE_URL = "https://unkirihxtruhdjeldfpm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2lyaWh4dHJ1aGRqZWxkZnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTA3MjUsImV4cCI6MjA5MTcyNjcyNX0._Ve9Pr3ooja-YdHYFIupebaZRhDjmJDnz2b-vzrhY04";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── BRAND ─────────────────────────────────────────────────────────────────────
const B = {
  navy:"#092b49",navyMid:"#293d5c",gold:"#ceb684",goldLight:"#dfc99a",
  white:"#ffffff",text:"#092b49",textMid:"#293d5c",textSoft:"#5a6e84",
  textMute:"#8fa0b2",border:"#d8cdb8",borderLight:"#ede8de",
  bg:"#f9f7f3",bgCard:"#ffffff",
  shadow:"0 2px 16px rgba(9,43,73,0.07)",shadowMd:"0 8px 40px rgba(9,43,73,0.13)",
};

const STAGES=["Lead","Qualified","Proposal","Negotiation","Closed Won","Closed Lost"];
const STAGE_COLORS={
  "Lead":{bg:"#e8f0f8",text:"#293d5c",dot:"#293d5c"},
  "Qualified":{bg:"#e8f2ec",text:"#1d6b3a",dot:"#2e9e57"},
  "Proposal":{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"},
  "Negotiation":{bg:"#fde8d8",text:"#8b3a12",dot:"#d45d1a"},
  "Closed Won":{bg:"#e0f5e9",text:"#0d5c2b",dot:"#18a850"},
  "Closed Lost":{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"},
};
const PRIORITY_COLORS={
  High:{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"},
  Medium:{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"},
  Low:{bg:"#e8f0f8",text:"#293d5c",dot:"#293d5c"},
};
const PROP_TYPES=["Residential","Commercial","Industrial","Land","Mixed Use","Vacation"];
const LOAN_TYPES=["Fixed","ARM","Interest Only","Balloon","Bridge","HELOC"];
const VALUABLE_CATS=["Car / Vehicle","Jewelry","Art","Watch","Boat / Watercraft","Other"];
const ACCT_TYPES=["Investment","Brokerage","Retirement (IRA)","401(k)","Trust","Savings","Other","Checking","Money Market","Line of Credit"];
const REMINDER_OPTIONS=[
  {label:"1 day before",days:1},
  {label:"3 days before",days:3},
  {label:"7 days before",days:7},
  {label:"14 days before",days:14},
  {label:"30 days before",days:30},
  {label:"60 days before",days:60},
];

const fmt=iso=>iso?new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—";
const fmtMoney=n=>n!=null&&n!==""?`$${Number(n).toLocaleString()}`:"—";
const fmtPct=n=>n!=null&&n!==""?`${Number(n).toFixed(2)}%`:"—";
const pctChange=(s,c)=>{const sv=Number(s)||0;const cv=Number(c)||0;if(!sv)return null;return(((cv-sv)/sv)*100).toFixed(2);};

const toClient=obj=>{
  if(!obj)return obj;
  const m={family_id:"familyId",contact_id:"contactId",account_id:"accountId",close_date:"closeDate",due_date:"dueDate",created_at:"createdAt",uploaded_at:"uploadedAt",advisor_name:"advisorName",advisor_email:"advisorEmail",owner_name:"ownerName",property_type:"propertyType",purchase_price:"purchasePrice",purchase_date:"purchaseDate",current_value:"currentValue",loan_balance:"loanBalance",interest_rate:"interestRate",loan_payment:"loanPayment",loan_maturity_date:"loanMaturityDate",loan_type:"loanType",rental_income:"rentalIncome",property_taxes:"propertyTaxes",flood_insurance:"floodInsurance",insurance_company:"insuranceCompany",insurance_premium:"insurancePremium",flood_insurance_company:"floodInsuranceCompany",flood_insurance_premium:"floodInsurancePremium",account_type:"accountType",starting_balance:"startingBalance",current_balance:"currentBalance",banker_name:"bankerName",make_model:"makeModel",estimated_value:"estimatedValue",file_type:"fileType",reminder_days:"reminderDays",reminder_sent:"reminderSent",full_name:"fullName",file_path:"filePath",file_size:"fileSize",uploaded_by:"uploadedBy"};
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[m[k]||k,v]));
};

const TABLES=["families","contacts","properties","deals","notes","tasks","portfolio_accounts","valuables","documents"];


// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
function Badge({children,scheme}){
  const s=scheme||{bg:B.borderLight,text:B.navyMid,dot:B.navyMid};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:s.bg,color:s.text,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{children}</span>;
}
function GoldLine(){return <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold},transparent)`,margin:"0 0 16px"}}/>;}
function Spinner({size=34}){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:14}}><div style={{width:size,height:size,border:`3px solid ${B.borderLight}`,borderTop:`3px solid ${B.gold}`,borderRadius:"50%",animation:"pcmspin 0.8s linear infinite"}}/><style>{`@keyframes pcmspin{to{transform:rotate(360deg)}}`}</style></div>;}
function Toast({msg,type}){return <div style={{position:"fixed",bottom:24,right:24,zIndex:9000,background:type==="error"?"#fde8e8":B.navy,color:type==="error"?"#8b1a1a":B.white,padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:B.shadowMd,border:`1px solid ${type==="error"?"#f5c6c6":"rgba(206,182,132,0.3)"}`}}>{type==="error"?"⚠ ":"✓ "}{msg}</div>;}

function Modal({title,onClose,wide,children}){
  const mobile=typeof window!=="undefined"&&window.innerWidth<640;
  return <div style={{position:"fixed",inset:0,background:"rgba(9,43,73,0.45)",zIndex:1000,display:"flex",alignItems:mobile?"flex-end":"center",justifyContent:"center",backdropFilter:"blur(3px)",padding:mobile?0:20,overflowY:"auto"}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:B.white,borderRadius:mobile?"16px 16px 0 0":16,padding:mobile?"24px 20px 32px":36,width:"100%",maxWidth:mobile?"100%":wide?780:540,boxShadow:B.shadowMd,border:`1px solid ${B.borderLight}`,margin:mobile?0:"auto",maxHeight:mobile?"90vh":"none",overflowY:"auto"}}>
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
function Field({label,children}){return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,color:B.textSoft,marginBottom:5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</label>{children}</div>;}
function Grid2({children}){
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>{children}</div>;
}
function Btn({children,onClick,variant="primary",small,disabled,style:ex}){
  const v={primary:{background:B.navy,color:B.white,border:"none"},ghost:{background:"transparent",color:B.navyMid,border:`1px solid ${B.border}`},danger:{background:"#fde8e8",color:"#8b1a1a",border:"1px solid #f5c6c6"},gold:{background:B.gold,color:B.navy,border:"none"}};
  return <button onClick={onClick} disabled={disabled} style={{...v[variant],borderRadius:8,padding:small?"5px 13px":"9px 20px",fontSize:small?12:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.03em",opacity:disabled?.65:1,...ex}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".82";}} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}
function IRow({label,value}){return <div style={{display:"flex",gap:10,fontSize:13,padding:"5px 0",borderBottom:`1px solid ${B.borderLight}`}}><span style={{color:B.textSoft,minWidth:120,flexShrink:0,fontSize:12}}>{label}</span><span style={{color:B.text,fontWeight:600}}>{value}</span></div>;}
function SectionLabel({children}){return <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8,marginTop:18,paddingBottom:4,borderBottom:`1px solid ${B.borderLight}`}}>{children}</div>;}
function Empty({text}){return <div style={{fontSize:13,color:B.textMute,padding:"12px 0",textAlign:"center"}}>{text}</div>;}
function StatBox({label,value,accent}){
  return <div style={{background:B.white,borderRadius:10,padding:"12px 14px",border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${accent||B.gold}`,boxShadow:B.shadow}}>
    <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
    <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600,lineHeight:1}}>{value}</div>
  </div>;
}

function PCMLogo({dark=false}){
  if(dark)return <div style={{background:"rgba(255,255,255,0.97)",borderRadius:8,padding:"8px 14px",display:"inline-block"}}><img src={PCM_LOGO} alt="PCM Family Office" style={{height:64,width:"auto",display:"block"}}/></div>;
  return <img src={PCM_LOGO} alt="PCM Family Office" style={{height:110,width:"auto",display:"block",margin:"0 auto"}}/>;
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen(){
  const[mode,setMode]=useState("login");
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
  };
  const handleReset=async()=>{
    if(!email)return setError("Please enter your email address.");
    setLoading(true);setError("");
    const{error:e}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    setLoading(false);
    if(e)setError(e.message);else setResetSent(true);
  };

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${B.navy} 0%,${B.navyMid} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,backgroundImage:`radial-gradient(circle at 20% 80%,rgba(206,182,132,0.07) 0%,transparent 50%)`,pointerEvents:"none"}}/>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"32px 24px",width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(0,0,0,0.3)",border:`1px solid rgba(206,182,132,0.3)`,position:"relative",zIndex:1,margin:"0 16px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><PCMLogo/></div>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold},transparent)`,marginBottom:18}}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>{mode==="reset"?"Reset Password":"Client Portal"}</div>
          <div style={{fontSize:11,color:B.textMute,letterSpacing:"0.1em",marginTop:3}}>{mode==="reset"?"ENTER YOUR EMAIL":"SECURE ACCESS"}</div>
        </div>
        {resetSent?(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>📧</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,marginBottom:8}}>Check your email</div>
            <div style={{fontSize:13,color:B.textSoft,marginBottom:20}}>Password reset link sent to <strong>{email}</strong></div>
            <Btn onClick={()=>{setMode("login");setResetSent(false);}}>Back to Sign In</Btn>
          </div>
        ):(
          <>
            <Field label="Email"><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleReset())} placeholder="you@pcmfamilyoffice.com" autoFocus style={{...inp,fontSize:15,padding:"13px 16px"}}/></Field>
            {mode==="login"&&<Field label="Password"><input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={{...inp,fontSize:15,padding:"13px 16px"}}/></Field>}
            {error&&<div style={{fontSize:12,color:"#d43030",marginBottom:12,fontWeight:600,padding:"8px 12px",background:"#fde8e8",borderRadius:8}}>{error}</div>}
            <button onClick={mode==="login"?handleLogin:handleReset} disabled={loading} style={{width:"100%",background:`linear-gradient(135deg,${B.navy},${B.navyMid})`,color:B.white,border:"none",borderRadius:10,padding:"13px",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.06em",marginBottom:16,opacity:loading?.7:1}}>
              {loading?"Please wait…":mode==="login"?"SIGN IN":"SEND RESET LINK"}
            </button>
            <div style={{textAlign:"center"}}>
              {mode==="login"?<button onClick={()=>{setMode("reset");setError("");}} style={{background:"none",border:"none",color:B.textSoft,fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Forgot your password?</button>:<button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:B.textSoft,fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Back to sign in</button>}
            </div>
          </>
        )}
        <div style={{textAlign:"center",marginTop:24,fontSize:11,color:B.textMute}}>PCM Family Office · DISCOVER · SIMPLIFY · EXECUTE</div>
      </div>
    </div>
  );
}

// ── FAMILY REPORT ─────────────────────────────────────────────────────────────
function FamilyReport({family,data,onClose}){
  const contacts=data.contacts.filter(c=>c.familyId===family.id);
  const properties=data.properties.filter(p=>p.familyId===family.id);
  const deals=data.deals.filter(d=>d.familyId===family.id);
  const tasks=data.tasks.filter(t=>t.familyId===family.id&&!t.done);
  const notes=data.notes.filter(n=>n.familyId===family.id);
  const accounts=(data.portfolio_accounts||[]).filter(a=>a.familyId===family.id);
  const valuables=(data.valuables||[]).filter(v=>v.familyId===family.id);
  const totalPortfolio=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0),0)+accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalAccounts=accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalValuables=valuables.reduce((s,v)=>s+(Number(v.estimatedValue)||0),0);

  const print=()=>{
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title> </title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;color:#092b49;background:#fff;padding:40px;font-size:13px;line-height:1.6;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #ceb684;}
    .logo{font-size:26px;font-weight:700;color:#092b49;}
    .logo-sub{font-size:9px;letter-spacing:.18em;color:#8fa0b2;margin-top:3px;}
    .logo-img{height:120px;width:auto;display:block;}
    h1{font-size:22px;font-weight:700;margin-bottom:2px;}
    .advisor{font-size:12px;color:#5a6e84;margin-top:4px;}
    .date{font-size:11px;color:#8fa0b2;margin-top:2px;}
    h2{font-size:14px;font-weight:800;color:#092b49;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #ceb684;letter-spacing:.06em;text-transform:uppercase;}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;}
    th{background:#092b49;color:#ceb684;padding:6px 10px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
    td{padding:6px 10px;border-bottom:1px solid #ede8de;color:#293d5c;vertical-align:top;}
    tr:nth-child(even) td{background:#f9f7f3;}
    .stats{display:flex;gap:16px;margin-bottom:20px;}
    .stat{background:#f9f7f3;border-radius:8px;padding:12px 16px;flex:1;border-top:2px solid #ceb684;}
    .stat-l{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8fa0b2;margin-bottom:4px;}
    .stat-v{font-size:18px;font-weight:700;color:#092b49;}
    .note{padding:8px 0;border-bottom:1px solid #ede8de;}
    .note-date{font-size:10px;color:#8fa0b2;margin-top:2px;}
    .footer{margin-top:40px;padding-top:14px;border-top:2px solid #ceb684;display:flex;justify-content:space-between;align-items:center;position:fixed;bottom:20px;left:40px;right:40px;}
    .footer-l{font-size:10px;color:#8fa0b2;line-height:1.6;}
    .footer-c{font-size:11px;font-weight:800;color:#092b49;letter-spacing:0.12em;text-transform:uppercase;text-align:right;}
    @media print{body{padding:20px;}}
    </style></head><body>
    <div class="header">
      <div><img src="${PCM_LOGO}" alt="PCM Family Office" class="logo-img"/></div>
      <div style="text-align:right"><h1>${family.name}</h1><div class="advisor">Advisor: ${family.advisorName||"—"} | ${family.advisorEmail||""}</div><div class="date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-l">Real Estate Value</div><div class="stat-v">${fmtMoney(totalPortfolio)}</div></div>
      <div class="stat"><div class="stat-l">Total Debt</div><div class="stat-v">${fmtMoney(totalDebt)}</div></div>
      <div class="stat"><div class="stat-l">Portfolio Value</div><div class="stat-v">${fmtMoney(totalAccounts)}</div></div>
      <div class="stat"><div class="stat-l">Valuables</div><div class="stat-v">${fmtMoney(totalValuables)}</div></div>
    </div>
    <h2>Contacts & Members</h2>
    <table><thead><tr><th>Name</th><th>Type</th><th>Email</th><th>Phone</th></tr></thead><tbody>
    ${contacts.map(c=>`<tr><td>${c.name}</td><td>${c.type}</td><td>${c.email||"—"}</td><td>${c.phone||"—"}</td></tr>`).join("")||"<tr><td colspan='4' style='color:#8fa0b2'>No contacts</td></tr>"}
    </tbody></table>
    <h2>Properties</h2>
    ${properties.map(p=>`<table style="margin-bottom:14px"><thead><tr><th colspan="4">${p.address}${p.ownerName?` — ${p.ownerName}`:""}</th></tr></thead><tbody>
    <tr><td><b>Type</b></td><td>${p.propertyType}</td><td><b>Purchase Price</b></td><td>${fmtMoney(p.purchasePrice)}</td></tr>
    <tr><td><b>Current Value</b></td><td>${fmtMoney(p.currentValue)}</td><td><b>Purchase Date</b></td><td>${fmt(p.purchaseDate)}</td></tr>
    <tr><td><b>Lender</b></td><td>${p.lender||"—"}</td><td><b>Loan Type</b></td><td>${p.loanType}</td></tr>
    <tr><td><b>Loan Balance</b></td><td>${fmtMoney(p.loanBalance)}</td><td><b>Interest Rate</b></td><td>${fmtPct(p.interestRate)}</td></tr>
    <tr><td><b>Monthly Payment</b></td><td>${fmtMoney(p.loanPayment)}</td><td><b>Loan Maturity</b></td><td>${fmt(p.loanMaturityDate)}</td></tr>
    <tr><td><b>Rental Income</b></td><td>${fmtMoney(p.rentalIncome)}/mo</td><td><b>Property Taxes</b></td><td>${fmtMoney(p.propertyTaxes)}/yr</td></tr>
    <tr><td><b>Insurance</b></td><td>${p.insuranceCompany||"—"}</td><td><b>Flood Insurance</b></td><td>${p.floodInsurance?"Yes":"No"}</td></tr>
    </tbody></table>`).join("")||"<p style='color:#8fa0b2;margin-bottom:12px'>No properties</p>"}
    <h2>Portfolio Accounts</h2>
    <table><thead><tr><th>Institution</th><th>Type</th><th>Banker</th><th>Starting</th><th>Current</th><th>Change</th></tr></thead><tbody>
    ${accounts.map(a=>{const pct=pctChange(a.startingBalance,a.currentBalance);return`<tr><td>${a.institution}</td><td>${a.accountType}</td><td>${a.bankerName||"—"}</td><td>${fmtMoney(a.startingBalance)}</td><td>${fmtMoney(a.currentBalance)}</td><td style="color:${Number(pct)>=0?"#18a850":"#d43030"};font-weight:700">${pct!==null?(Number(pct)>=0?"+":"")+pct+"%":"—"}</td></tr>`;}).join("")||"<tr><td colspan='6' style='color:#8fa0b2'>No accounts</td></tr>"}
    </tbody></table>
    <h2>Valuables</h2>
    <table><thead><tr><th>Category</th><th>Description</th><th>Year</th><th>Est. Value</th><th>Insured</th></tr></thead><tbody>
    ${valuables.map(v=>`<tr><td>${v.category}</td><td>${v.description}</td><td>${v.year||"—"}</td><td>${fmtMoney(v.estimatedValue)}</td><td>${v.insured?"Yes":"No"}</td></tr>`).join("")||"<tr><td colspan='5' style='color:#8fa0b2'>No valuables</td></tr>"}
    </tbody></table>
    <h2>Open Deals</h2>
    <table><thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Close Date</th></tr></thead><tbody>
    ${deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won").map(d=>`<tr><td>${d.title}</td><td>${d.stage}</td><td>${fmtMoney(d.value)}</td><td>${fmt(d.closeDate)}</td></tr>`).join("")||"<tr><td colspan='4' style='color:#8fa0b2'>No open deals</td></tr>"}
    </tbody></table>
    <h2>Pending Tasks & Deadlines</h2>
    <table><thead><tr><th>Task</th><th>Priority</th><th>Due Date</th><th>Reminder</th></tr></thead><tbody>
    ${tasks.sort((a,b)=>a.dueDate>b.dueDate?1:-1).map(t=>`<tr><td>${t.title}</td><td>${t.priority}</td><td>${fmt(t.dueDate)}</td><td>${t.reminderDays?t.reminderDays+" days before":"—"}</td></tr>`).join("")||"<tr><td colspan='4' style='color:#8fa0b2'>No pending tasks</td></tr>"}
    </tbody></table>
    <h2>Activity Notes</h2>
    ${notes.slice(0,10).map(n=>`<div class="note"><div>${n.body}</div><div class="note-date">${fmt(n.createdAt)}</div></div>`).join("")||"<p style='color:#8fa0b2'>No notes</p>"}
    </body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),400);
  };

  return <Modal title={`Report — ${family.name}`} onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {[{l:"Properties",v:properties.length},{l:"Real Estate",v:fmtMoney(totalPortfolio)},{l:"Portfolio",v:fmtMoney(totalAccounts)},{l:"Open Tasks",v:tasks.length}].map(s=><StatBox key={s.l} label={s.l} value={s.v}/>)}
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="gold" onClick={print}>🖨 Print Report</Btn>
    </div>
  </Modal>;
}

// ── FAMILY DASHBOARD ──────────────────────────────────────────────────────────
function FamilyDashboard({family,data,reload,toast,onBack}){
  const[activeTab,setActiveTab]=useState("overview");
  const[reportOpen,setReportOpen]=useState(false);
  const[modal,setModal]=useState(null);

  const contacts=data.contacts.filter(c=>c.familyId===family.id);
  const properties=data.properties.filter(p=>p.familyId===family.id);
  const deals=data.deals.filter(d=>d.familyId===family.id);
  const openDeals=deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won");
  const famNotes=data.notes.filter(n=>n.familyId===family.id);
  const famTasks=data.tasks.filter(t=>t.familyId===family.id);
  const pendingTasks=famTasks.filter(t=>!t.done);
  const accounts=(data.portfolio_accounts||[]).filter(a=>a.familyId===family.id);
  const valuables=(data.valuables||[]).filter(v=>v.familyId===family.id);

  const totalRE=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0),0)+accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalAccounts=accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalValuables=valuables.reduce((s,v)=>s+(Number(v.estimatedValue)||0),0);
  const netWorth=totalRE-totalDebt+totalAccounts+totalValuables;
  const overdueTasks=pendingTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const soonTasks=pendingTasks.filter(t=>t.dueDate&&!overdueTasks.includes(t)&&(new Date(t.dueDate)-new Date())/(86400000)<=30);

  const TABS=["Overview","Properties","Portfolio","Valuables","Deals","Notes","Tasks","Documents"];

  // Quick add note
  const[noteBody,setNoteBody]=useState("");
  const addNote=async()=>{
    if(!noteBody.trim())return;
    const{error}=await sb.from("notes").insert({body:noteBody,family_id:family.id,contact_id:null});
    if(error)toast(error.message,"error");else{toast("Note added");setNoteBody("");reload("notes");}
  };

  // Quick add task
  const addTask=async(f)=>{
    const{error}=await sb.from("tasks").insert({family_id:family.id,contact_id:f.contactId||null,title:f.title,due_date:f.dueDate||null,priority:f.priority,reminder_days:f.reminderDays||7,done:false});
    if(error)toast(error.message,"error");else{toast("Task added");reload("tasks");}
  };
  const toggleTask=async(t)=>{
    const{error}=await sb.from("tasks").update({done:!t.done}).eq("id",t.id);
    if(error)toast(error.message,"error");else reload("tasks");
  };
  const delTask=async(id)=>{
    const{error}=await sb.from("tasks").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("tasks");
  };
  const delNote=async(id)=>{
    const{error}=await sb.from("notes").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("notes");
  };

  // Add/remove members
  const addMember=async(f)=>{
    const{error}=await sb.from("contacts").insert({family_id:family.id,name:f.name,email:f.email||null,phone:f.phone||null,company:f.company||null,type:f.type||"Individual",tags:null});
    if(error)toast(error.message,"error");else{toast("Member added");reload("contacts");}
  };
  const delMember=async(id)=>{
    const{error}=await sb.from("contacts").delete().eq("id",id);
    if(error)toast(error.message,"error");else{toast("Member removed");reload("contacts");}
  };
  // Add property
  const addProperty=async(f)=>{
    const row={family_id:family.id,owner_name:f.ownerName||null,address:f.address,property_type:f.propertyType,purchase_price:f.purchasePrice||null,purchase_date:f.purchaseDate||null,current_value:f.currentValue||null,lender:f.lender||null,loan_balance:f.loanBalance||null,interest_rate:f.interestRate||null,loan_payment:f.loanPayment||null,loan_maturity_date:f.loanMaturityDate||null,loan_type:f.loanType,rental_income:f.rentalIncome||null,property_taxes:f.propertyTaxes||null,utilities:f.utilities||null,insurance_company:f.insuranceCompany||null,insurance_premium:f.insurancePremium||null,flood_insurance:!!f.floodInsurance,flood_insurance_company:f.floodInsuranceCompany||null,flood_insurance_premium:f.floodInsurancePremium||null,notes:f.notes||null};
    const{error}=await sb.from("properties").insert(row);
    if(error)toast(error.message,"error");else{toast("Property added");reload("properties");}
  };
  const delProperty=async(id)=>{
    const{error}=await sb.from("properties").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("properties");
  };

  // Add valuable
  const addValuable=async(f)=>{
    const{error}=await sb.from("valuables").insert({family_id:family.id,category:f.category,description:f.description,make_model:f.makeModel||null,year:f.year||null,estimated_value:f.estimatedValue||null,insured:!!f.insured,insurance_company:f.insuranceCompany||null,notes:f.notes||null});
    if(error)toast(error.message,"error");else{toast("Valuable added");reload("valuables");}
  };
  const delValuable=async(id)=>{
    const{error}=await sb.from("valuables").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("valuables");
  };

  // Add deal
  const addDeal=async(f)=>{
    const{error}=await sb.from("deals").insert({family_id:family.id,contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null});
    if(error)toast(error.message,"error");else{toast("Deal added");reload("deals");}
  };
  const moveDeal=async(deal,dir)=>{
    const idx=STAGES.indexOf(deal.stage);const next=STAGES[idx+dir];if(!next)return;
    const{error}=await sb.from("deals").update({stage:next}).eq("id",deal.id);
    if(error)toast(error.message,"error");else reload("deals");
  };
  const delDeal=async(id)=>{
    const{error}=await sb.from("deals").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("deals");
  };

  // Add portfolio account
  const addAccount=async(f)=>{
    const{error}=await sb.from("portfolio_accounts").insert({family_id:family.id,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null});
    if(error)toast(error.message,"error");else{toast("Account added");reload("portfolio_accounts");}
  };
  const editAccount=async(id,f)=>{
    const{error}=await sb.from("portfolio_accounts").update({institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null}).eq("id",id);
    if(error)toast(error.message,"error");else{toast("Account updated");reload("portfolio_accounts");}
  };
  const delAccount=async(id)=>{
    const{error}=await sb.from("portfolio_accounts").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("portfolio_accounts");
  };

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {/* Header */}
      <div style={{padding:"14px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textSoft,cursor:"pointer",fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:6,flexShrink:0}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,fontWeight:600,lineHeight:1}}>{family.name}</div>
          <div style={{fontSize:12,color:B.textSoft,marginTop:2}}>Advisor: {family.advisorName||"—"}{family.advisorEmail?` · ${family.advisorEmail}`:""}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {overdueTasks.length>0&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>{overdueTasks.length} overdue</Badge>}
          {soonTasks.length>0&&<Badge scheme={{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"}}>{soonTasks.length} due soon</Badge>}
          <Btn variant="gold" onClick={()=>setReportOpen(true)}>🖨 Print Report</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{borderBottom:`1px solid ${B.borderLight}`,background:B.white,padding:"0 28px",display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {TABS.map(t=><button key={t} onClick={()=>setActiveTab(t.toLowerCase())} style={{background:"none",border:"none",borderBottom:activeTab===t.toLowerCase()?`2px solid ${B.gold}`:"2px solid transparent",color:activeTab===t.toLowerCase()?B.navy:B.textSoft,fontFamily:"inherit",fontSize:13,fontWeight:activeTab===t.toLowerCase()?700:400,padding:"10px 14px",cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap",flexShrink:0}}>{t}</button>)}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>

        {/* OVERVIEW TAB */}
        {activeTab==="overview"&&<div style={{padding:"24px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            <StatBox label="Net Worth Est." value={fmtMoney(netWorth)} accent={B.navy}/>
            <StatBox label="Real Estate" value={fmtMoney(totalRE)} accent={B.gold}/>
            <StatBox label="Portfolio" value={fmtMoney(totalAccounts)} accent={B.navyMid}/>
            <StatBox label="Valuables" value={fmtMoney(totalValuables)} accent="#8b5cf6"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
            {/* Members */}
            <div style={{background:B.white,borderRadius:12,padding:20,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Members</div>
                <Btn small onClick={()=>setModal("member")}>+ Add</Btn>
              </div>
              <GoldLine/>
              {contacts.length===0?<Empty text="No members yet — add the first one"/>:contacts.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                <div>
                  <div style={{fontWeight:600,color:B.navy,fontSize:13}}>{c.name}</div>
                  <div style={{fontSize:11,color:B.textSoft,marginTop:2,display:"flex",gap:10}}>
                    {c.email&&<span>✉ {c.email}</span>}
                    {c.phone&&<span>📞 {c.phone}</span>}
                  </div>
                  {c.company&&<div style={{fontSize:11,color:B.textSoft}}>{c.company}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
                  <button onClick={()=>delMember(c.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:13}}>✕</button>
                </div>
              </div>)}
            </div>
            {/* Upcoming Tasks */}
            <div style={{background:B.white,borderRadius:12,padding:20,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Upcoming Tasks</div>
                <Btn small onClick={()=>setModal("task")}>+ Add</Btn>
              </div>
              <GoldLine/>
              {pendingTasks.length===0?<Empty text="No pending tasks"/>:[...pendingTasks].sort((a,b)=>a.dueDate>b.dueDate?1:-1).slice(0,5).map(t=>{
                const isOD=t.dueDate&&new Date(t.dueDate)<new Date();
                const isSoon=!isOD&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30;
                return <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                  <input type="checkbox" checked={!!t.done} onChange={()=>toggleTask(t)} style={{accentColor:B.navy,cursor:"pointer",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:B.navy,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                    {t.dueDate&&<div style={{fontSize:11,color:isOD?"#d43030":isSoon?"#d4900a":B.textSoft}}>{isOD?"⚠ Overdue · ":isSoon?"⏰ ":" "}{fmt(t.dueDate)}</div>}
                  </div>
                  <Badge scheme={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
                </div>;
              })}
            </div>
          </div>
          {/* Recent Notes */}
          <div style={{background:B.white,borderRadius:12,padding:20,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,marginBottom:20}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,marginBottom:4}}>Recent Notes</div>
            <GoldLine/>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <input value={noteBody} onChange={e=>setNoteBody(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&addNote()} placeholder="Quick note… (Enter to save)" style={{...inp,flex:1}}/>
              <Btn onClick={addNote} disabled={!noteBody.trim()}>Add</Btn>
            </div>
            {famNotes.length===0?<Empty text="No notes yet"/>:[...famNotes].sort((a,b)=>b.createdAt>a.createdAt?1:-1).slice(0,4).map(n=><div key={n.id} style={{padding:"10px 0",borderBottom:`1px solid ${B.borderLight}`,display:"flex",justifyContent:"space-between",gap:10}}>
              <div><div style={{fontSize:13,color:B.textMid,lineHeight:1.55}}>{n.body}</div><div style={{fontSize:11,color:B.textMute,marginTop:3}}>{fmt(n.createdAt)}</div></div>
              <button onClick={()=>delNote(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
            </div>)}
          </div>
        </div>}

        {/* PROPERTIES TAB */}
        {activeTab==="properties"&&<div style={{padding:"24px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:B.textSoft}}>{properties.length} properties · {fmtMoney(totalRE)} total · {fmtMoney(totalDebt)} debt</div>
            <Btn onClick={()=>setModal("property")}>+ Add Property</Btn>
          </div>
          {properties.length===0?<Empty text="No properties yet. Add the first one."/>:properties.map(p=><div key={p.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${B.gold}`,borderRadius:12,padding:20,marginBottom:14,boxShadow:B.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>{p.address}</div>
                {p.ownerName&&<div style={{fontSize:12,color:B.textSoft,marginTop:2}}>{p.ownerName}</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:16,fontWeight:700,color:B.navy}}>{fmtMoney(p.currentValue||p.purchasePrice)}</div>
                  {p.loanBalance&&<div style={{fontSize:11,color:B.textSoft}}>Balance: {fmtMoney(p.loanBalance)}</div>}
                </div>
                <Btn small variant="danger" onClick={()=>delProperty(p.id)}>✕</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[["Type",p.propertyType],["Purchase Price",fmtMoney(p.purchasePrice)],["Purchase Date",fmt(p.purchaseDate)],["Lender",p.lender||"—"],["Loan Type",p.loanType],["Interest Rate",fmtPct(p.interestRate)],["Monthly Payment",fmtMoney(p.loanPayment)],["Loan Maturity",fmt(p.loanMaturityDate)],["Rental Income",p.rentalIncome?`${fmtMoney(p.rentalIncome)}/mo`:"—"],["Property Taxes",p.propertyTaxes?`${fmtMoney(p.propertyTaxes)}/yr`:"—"],["Utilities",p.utilities?`${fmtMoney(p.utilities)}/mo`:"—"],["Insurance Co.",p.insuranceCompany||"—"],["Ins. Premium",p.insurancePremium?`${fmtMoney(p.insurancePremium)}/yr`:"—"],["Flood Insurance",p.floodInsurance?`Yes${p.floodInsuranceCompany?` — ${p.floodInsuranceCompany}`:""}`:("No")]].map(([l,v])=><div key={l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                <div style={{fontSize:12,color:B.text,fontWeight:600}}>{v}</div>
              </div>)}
            </div>
            {p.notes&&<div style={{marginTop:12,fontSize:13,color:B.textSoft,fontStyle:"italic"}}>{p.notes}</div>}
          </div>)}
        </div>}

        {/* PORTFOLIO TAB */}
        {activeTab==="portfolio"&&<div style={{padding:"24px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:B.textSoft}}>{accounts.length} accounts · {fmtMoney(totalAccounts)} total</div>
            <Btn onClick={()=>setModal("account")}>+ Add Account</Btn>
          </div>
          {accounts.length===0?<Empty text="No portfolio accounts yet."/>:accounts.map(a=>{
            const pct=pctChange(a.startingBalance,a.currentBalance);
            const gain=(Number(a.currentBalance)||0)-(Number(a.startingBalance)||0);
            return <div key={a.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${B.navyMid}`,borderRadius:12,padding:20,marginBottom:12,boxShadow:B.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>{a.institution}</div>
                  <div style={{fontSize:12,color:B.textSoft}}>{a.accountType}{a.bankerName?` · ${a.bankerName}`:""}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:700,color:B.navy}}>{fmtMoney(a.currentBalance)}</div>
                    {pct!==null&&<div style={{fontSize:12,fontWeight:700,color:Number(pct)>=0?"#18a850":"#d43030"}}>{Number(pct)>=0?"+":""}{pct}% ({Number(gain)>=0?"+":"-"}{fmtMoney(Math.abs(gain))})</div>}
                  </div>
                  <Btn small variant="ghost" onClick={()=>setModal({type:"editAccount",account:a})}>Edit</Btn>
                  <Btn small variant="danger" onClick={()=>delAccount(a.id)}>✕</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["Starting Balance",fmtMoney(a.startingBalance)],["Current Balance",fmtMoney(a.currentBalance)],["Performance",pct!==null?`${Number(pct)>=0?"+":""}${pct}%`:"—"]].map(([l,v])=><div key={l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:13,color:B.text,fontWeight:700}}>{v}</div>
                </div>)}
              </div>
            </div>;
          })}
        </div>}

        {/* VALUABLES TAB */}
        {activeTab==="valuables"&&<div style={{padding:"24px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:B.textSoft}}>{valuables.length} items · {fmtMoney(totalValuables)} est. value</div>
            <Btn onClick={()=>setModal("valuable")}>+ Add Valuable</Btn>
          </div>
          {VALUABLE_CATS.map(cat=>{
            const items=valuables.filter(v=>v.category===cat);
            if(!items.length)return null;
            return <div key={cat} style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{cat}</div>
              {items.map(v=><div key={v.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid #8b5cf6`,borderRadius:10,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start",boxShadow:B.shadow}}>
                <div>
                  <div style={{fontWeight:700,color:B.navy,fontSize:13}}>{v.description}</div>
                  {v.makeModel&&<div style={{fontSize:12,color:B.textSoft}}>{v.makeModel}{v.year?` · ${v.year}`:""}</div>}
                  {v.insured&&<div style={{fontSize:11,color:"#18a850",fontWeight:600,marginTop:3}}>✓ Insured{v.insuranceCompany?` — ${v.insuranceCompany}`:""}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:15,fontWeight:700,color:B.navy}}>{fmtMoney(v.estimatedValue)}</div>
                  <Btn small variant="danger" onClick={()=>delValuable(v.id)}>✕</Btn>
                </div>
              </div>)}
            </div>;
          })}
          {valuables.length===0&&<Empty text="No valuables recorded yet."/>}
        </div>}

        {/* DEALS TAB */}
        {activeTab==="deals"&&<div style={{padding:"24px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:B.textSoft}}>{openDeals.length} open deals · {fmtMoney(openDeals.reduce((s,d)=>s+(Number(d.value)||0),0))} pipeline</div>
            <Btn onClick={()=>setModal("deal")}>+ Add Deal</Btn>
          </div>
          {deals.length===0?<Empty text="No deals yet."/>:STAGES.map(stage=>{
            const list=deals.filter(d=>d.stage===stage);
            if(!list.length)return null;
            return <div key={stage} style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:STAGE_COLORS[stage].dot}}/>
                <span style={{fontSize:11,fontWeight:800,color:STAGE_COLORS[stage].dot,letterSpacing:"0.1em",textTransform:"uppercase"}}>{stage}</span>
              </div>
              {list.map(d=><div key={d.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${STAGE_COLORS[d.stage].dot}`,borderRadius:10,padding:"12px 16px",marginBottom:6,display:"flex",alignItems:"center",gap:12,boxShadow:B.shadow}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:B.navy}}>{d.title}</div>
                  {d.closeDate&&<div style={{fontSize:12,color:B.textSoft}}>Close: {fmt(d.closeDate)}</div>}
                </div>
                {d.value&&<div style={{fontWeight:800,color:B.navy}}>{fmtMoney(d.value)}</div>}
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>moveDeal(d,-1)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:15}}>←</button>
                  <button onClick={()=>moveDeal(d,1)}  style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:15}}>→</button>
                  <Btn small variant="danger" onClick={()=>delDeal(d.id)}>✕</Btn>
                </div>
              </div>)}
            </div>;
          })}
        </div>}

        {/* NOTES TAB */}
        {activeTab==="notes"&&<div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
          <div style={{padding:"20px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
            <div style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}>
              <textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Write a note or activity log entry…" style={{width:"100%",minHeight:80,background:"transparent",border:"none",padding:"14px 16px",color:B.text,fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}/>
              <div style={{padding:"10px 14px",borderTop:`1px solid ${B.borderLight}`,background:B.white,display:"flex",justifyContent:"flex-end"}}>
                <Btn onClick={addNote} disabled={!noteBody.trim()}>Log Note</Btn>
              </div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
            {famNotes.length===0?<Empty text="No notes yet."/>:[...famNotes].sort((a,b)=>b.createdAt>a.createdAt?1:-1).map(n=><div key={n.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,marginBottom:12,boxShadow:B.shadow,overflow:"hidden"}}>
              <div style={{height:3,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`}}/>
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8}}>
                  <p style={{margin:0,color:B.text,fontSize:14,lineHeight:1.7,flex:1}}>{n.body}</p>
                  <button onClick={()=>delNote(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
                </div>
                <div style={{fontSize:11,color:B.textMute}}>🕐 {fmt(n.createdAt)}</div>
              </div>
            </div>)}
          </div>
        </div>}

        {/* TASKS TAB */}
        {activeTab==="tasks"&&<div style={{padding:"24px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",gap:8}}>
              {overdueTasks.length>0&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>{overdueTasks.length} overdue</Badge>}
              {soonTasks.length>0&&<Badge scheme={{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"}}>{soonTasks.length} due in 30 days</Badge>}
            </div>
            <Btn onClick={()=>setModal("task")}>+ New Task</Btn>
          </div>
          {famTasks.length===0?<Empty text="No tasks yet."/>:famTasks.map(t=>{
            const isOD=!t.done&&t.dueDate&&new Date(t.dueDate)<new Date();
            const isSoon=!t.done&&!isOD&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30;
            return <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:8,background:B.white,border:`1px solid ${isOD?"#f5c6c6":B.borderLight}`,borderLeft:`3px solid ${isOD?"#d43030":isSoon?"#d4900a":PRIORITY_COLORS[t.priority]?.dot||B.gold}`,borderRadius:10,opacity:t.done?.55:1,boxShadow:B.shadow}}>
              <input type="checkbox" checked={!!t.done} onChange={()=>toggleTask(t)} style={{width:16,height:16,accentColor:B.navy,cursor:"pointer",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:B.navy,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                <div style={{fontSize:12,color:B.textSoft,marginTop:2,display:"flex",gap:10}}>
                  {t.dueDate&&<span style={{color:isOD?"#d43030":isSoon?"#d4900a":B.textSoft}}>{isOD?"⚠ Overdue · ":isSoon?"⏰ · ":""}{fmt(t.dueDate)}</span>}
                  {t.reminderDays&&<span style={{color:B.textMute}}>🔔 {t.reminderDays}d reminder</span>}
                </div>
              </div>
              <Badge scheme={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
              <Btn small variant="danger" onClick={()=>delTask(t.id)}>✕</Btn>
            </div>;
          })}
        </div>}
      </div>

      {/* DOCUMENTS TAB */}
      {activeTab==="documents"&&<div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
        <DocumentsView familyId={family.id} readOnly={false} toast={toast}/>
      </div>}

      {/* Modals */}
      {modal==="member"&&<Modal title="Add Member" onClose={()=>setModal(null)}>
        <MemberForm onSave={async f=>{await addMember(f);setModal(null);}} onClose={()=>setModal(null)}/>
      </Modal>}
      {modal==="task"&&<Modal title="New Task" onClose={()=>setModal(null)}><TaskForm contacts={contacts} onSave={async f=>{await addTask(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="property"&&<Modal title="Add Property" onClose={()=>setModal(null)} wide><PropertyForm onSave={async f=>{await addProperty(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="valuable"&&<Modal title="Add Valuable" onClose={()=>setModal(null)}><ValuableForm onSave={async f=>{await addValuable(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="deal"&&<Modal title="Add Deal" onClose={()=>setModal(null)}><SimpleDealForm contacts={contacts} onSave={async f=>{await addDeal(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="account"&&<Modal title="Add Portfolio Account" onClose={()=>setModal(null)}><AccountForm onSave={async f=>{await addAccount(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal&&modal.type==="editAccount"&&<Modal title="Edit Portfolio Account" onClose={()=>setModal(null)}><AccountForm initial={modal.account} onSave={async f=>{await editAccount(modal.account.id,f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {reportOpen&&<FamilyReport family={family} data={data} onClose={()=>setReportOpen(false)}/>}
    </div>
  );
}

// ── MEMBER FORM ───────────────────────────────────────────────────────────────
function MemberForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{name:"",email:"",phone:"",company:"",type:"Individual"});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Full Name"><Inp placeholder="Jane Smith" value={f.name} onChange={set("name")}/></Field>
    <Grid2>
      <Field label="Email"><Inp type="email" placeholder="jane@email.com" value={f.email||""} onChange={set("email")}/></Field>
      <Field label="Phone"><Inp placeholder="+1 555 000" value={f.phone||""} onChange={set("phone")}/></Field>
    </Grid2>
    <Grid2>
      <Field label="Company / LLC"><Inp placeholder="Smith Holdings LLC" value={f.company||""} onChange={set("company")}/></Field>
      <Field label="Type"><Sel value={f.type} onChange={set("type")}><option>Individual</option><option>Business</option></Sel></Field>
    </Grid2>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Add Member"}</Btn>
    </div>
  </div>;
}

// ── TASK FORM (with reminder) ─────────────────────────────────────────────────
function TaskForm({initial,contacts=[],onSave,onClose}){
  const[f,setF]=useState(initial||{title:"",contactId:"",dueDate:"",priority:"Medium",reminderDays:7,done:false});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Task"><Inp placeholder="Follow up on loan maturity" value={f.title} onChange={set("title")}/></Field>
    {contacts.length>0&&<Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field>}
    <Grid2>
      <Field label="Due Date"><Inp type="date" value={f.dueDate||""} onChange={set("dueDate")}/></Field>
      <Field label="Priority"><Sel value={f.priority} onChange={set("priority")}><option>Low</option><option>Medium</option><option>High</option></Sel></Field>
    </Grid2>
    <Field label="Email Reminder">
      <Sel value={f.reminderDays||7} onChange={e=>setF(p=>({...p,reminderDays:Number(e.target.value)}))}>
        <option value={0}>No reminder</option>
        {REMINDER_OPTIONS.map(r=><option key={r.days} value={r.days}>{r.label}</option>)}
      </Sel>
    </Field>
    {f.reminderDays>0&&f.dueDate&&<div style={{background:"#e8f0f8",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:B.navyMid}}>
      🔔 Advisor will be emailed on {new Date(new Date(f.dueDate).setDate(new Date(f.dueDate).getDate()-f.reminderDays)).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
    </div>}
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Task"}</Btn>
    </div>
  </div>;
}

// ── PROPERTY FORM ─────────────────────────────────────────────────────────────
function PropertyForm({initial,onSave,onClose}){
  const blank={ownerName:"",address:"",propertyType:"Residential",purchasePrice:"",purchaseDate:"",currentValue:"",lender:"",loanBalance:"",interestRate:"",loanPayment:"",loanMaturityDate:"",loanType:"Fixed",rentalIncome:"",propertyTaxes:"",utilities:"",insuranceCompany:"",insurancePremium:"",floodInsurance:false,floodInsuranceCompany:"",floodInsurancePremium:"",notes:""};
  const[f,setF]=useState(initial||blank);
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const setChk=k=>e=>setF(p=>({...p,[k]:e.target.checked}));
  const save=async()=>{if(!f.address.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div style={{maxHeight:"70vh",overflowY:"auto",paddingRight:4}}>
    <Grid2><Field label="Owner / LLC"><Inp placeholder="Smith Holdings LLC" value={f.ownerName||""} onChange={set("ownerName")}/></Field><Field label="Property Type"><Sel value={f.propertyType} onChange={set("propertyType")}>{PROP_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field></Grid2>
    <Field label="Address"><Inp placeholder="123 Main St, Tampa FL" value={f.address} onChange={set("address")}/></Field>
    <Grid2><Field label="Purchase Price"><Inp type="number" value={f.purchasePrice||""} onChange={set("purchasePrice")}/></Field><Field label="Current Value"><Inp type="number" value={f.currentValue||""} onChange={set("currentValue")}/></Field></Grid2>
    <Grid2><Field label="Purchase Date"><Inp type="date" value={f.purchaseDate||""} onChange={set("purchaseDate")}/></Field><Field label="Loan Type"><Sel value={f.loanType} onChange={set("loanType")}>{LOAN_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field></Grid2>
    <Grid2><Field label="Lender"><Inp value={f.lender||""} onChange={set("lender")}/></Field><Field label="Loan Balance"><Inp type="number" value={f.loanBalance||""} onChange={set("loanBalance")}/></Field></Grid2>
    <Grid2><Field label="Interest Rate (%)"><Inp type="number" step="0.01" value={f.interestRate||""} onChange={set("interestRate")}/></Field><Field label="Monthly Payment"><Inp type="number" value={f.loanPayment||""} onChange={set("loanPayment")}/></Field></Grid2>
    <Grid2><Field label="Loan Maturity Date"><Inp type="date" value={f.loanMaturityDate||""} onChange={set("loanMaturityDate")}/></Field><Field label="Rental Income/mo"><Inp type="number" value={f.rentalIncome||""} onChange={set("rentalIncome")}/></Field></Grid2>
    <Grid2><Field label="Property Taxes/yr"><Inp type="number" value={f.propertyTaxes||""} onChange={set("propertyTaxes")}/></Field><Field label="Utilities/mo"><Inp type="number" value={f.utilities||""} onChange={set("utilities")}/></Field></Grid2>
    <Grid2><Field label="Insurance Company"><Inp value={f.insuranceCompany||""} onChange={set("insuranceCompany")}/></Field><Field label="Insurance Premium/yr"><Inp type="number" value={f.insurancePremium||""} onChange={set("insurancePremium")}/></Field></Grid2>
    <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:f.floodInsurance?"#e8f0f8":B.bg,borderRadius:8,border:`1px solid ${f.floodInsurance?B.navyMid:B.border}`}}><input type="checkbox" checked={!!f.floodInsurance} onChange={setChk("floodInsurance")} style={{width:16,height:16,accentColor:B.navy}}/><span style={{fontSize:13,color:B.navy,fontWeight:600}}>Flood Insurance</span></label></div>
    {f.floodInsurance&&<Grid2><Field label="Flood Insurance Co."><Inp value={f.floodInsuranceCompany||""} onChange={set("floodInsuranceCompany")}/></Field><Field label="Flood Premium/yr"><Inp type="number" value={f.floodInsurancePremium||""} onChange={set("floodInsurancePremium")}/></Field></Grid2>}
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Property"}</Btn></div>
  </div>;
}

// ── VALUABLE FORM ─────────────────────────────────────────────────────────────
function ValuableForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{category:"Car / Vehicle",description:"",makeModel:"",year:"",estimatedValue:"",insured:false,insuranceCompany:"",notes:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.description.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2><Field label="Category"><Sel value={f.category} onChange={set("category")}>{VALUABLE_CATS.map(c=><option key={c}>{c}</option>)}</Sel></Field><Field label="Year"><Inp type="number" placeholder="2023" value={f.year||""} onChange={set("year")}/></Field></Grid2>
    <Field label="Description"><Inp placeholder="2023 Ferrari Roma" value={f.description} onChange={set("description")}/></Field>
    <Grid2><Field label="Make / Model"><Inp value={f.makeModel||""} onChange={set("makeModel")}/></Field><Field label="Estimated Value"><Inp type="number" value={f.estimatedValue||""} onChange={set("estimatedValue")}/></Field></Grid2>
    <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:f.insured?"#e8f0f8":B.bg,borderRadius:8,border:`1px solid ${f.insured?B.navyMid:B.border}`}}><input type="checkbox" checked={!!f.insured} onChange={e=>setF(p=>({...p,insured:e.target.checked}))} style={{width:16,height:16,accentColor:B.navy}}/><span style={{fontSize:13,color:B.navy,fontWeight:600}}>Insured</span></label></div>
    {f.insured&&<Field label="Insurance Company"><Inp value={f.insuranceCompany||""} onChange={set("insuranceCompany")}/></Field>}
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

// ── SIMPLE DEAL FORM ──────────────────────────────────────────────────────────
function SimpleDealForm({contacts=[],onSave,onClose}){
  const[f,setF]=useState({contactId:"",title:"",value:"",stage:"Lead",closeDate:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Deal Title"><Inp placeholder="Estate planning engagement" value={f.title} onChange={set("title")}/></Field>
    {contacts.length>0&&<Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field>}
    <Grid2><Field label="Value ($)"><Inp type="number" value={f.value||""} onChange={set("value")}/></Field><Field label="Close Date"><Inp type="date" value={f.closeDate||""} onChange={set("closeDate")}/></Field></Grid2>
    <Field label="Stage"><Sel value={f.stage} onChange={set("stage")}>{STAGES.map(s=><option key={s}>{s}</option>)}</Sel></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Deal"}</Btn></div>
  </div>;
}

// ── ACCOUNT FORM ──────────────────────────────────────────────────────────────
function AccountForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{institution:"",bankerName:"",accountType:"Investment",startingBalance:"",currentBalance:"",notes:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.institution.trim())return;setSaving(true);await onSave(f);onClose();};
  const pct=pctChange(f.startingBalance,f.currentBalance);
  return <div>
    <Grid2><Field label="Institution"><Inp placeholder="Merrill Lynch" value={f.institution} onChange={set("institution")}/></Field><Field label="Banker Name"><Inp value={f.bankerName||""} onChange={set("bankerName")}/></Field></Grid2>
    <Field label="Account Type"><Sel value={f.accountType} onChange={set("accountType")}>{ACCT_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field>
    <Grid2><Field label="Starting Balance"><Inp type="number" value={f.startingBalance||""} onChange={set("startingBalance")}/></Field><Field label="Current Balance"><Inp type="number" value={f.currentBalance||""} onChange={set("currentBalance")}/></Field></Grid2>
    {pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>{Number(pct)>=0?"📈":"📉"}</span>
      <div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}% performance</div>
    </div>}
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Account"}</Btn></div>
  </div>;
}

// ── FAMILY FORM ──────────────────────────────────────────────────────────────
function FamilyForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{name:"",advisorName:"",advisorEmail:"",notes:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Family Name"><Inp placeholder="The Smith Family" value={f.name} onChange={set("name")}/></Field>
    <Grid2><Field label="Advisor Name"><Inp value={f.advisorName||""} onChange={set("advisorName")}/></Field><Field label="Advisor Email"><Inp type="email" value={f.advisorEmail||""} onChange={set("advisorEmail")}/></Field></Grid2>
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Family"}</Btn></div>
  </div>;
}

// ── FAMILIES LIST VIEW ────────────────────────────────────────────────────────
function FamiliesView({data,reload,toast}){
  const{families}=data;
  const[selected,setSelected]=useState(null);
  const[modal,setModal]=useState(null);
  const[search,setSearch]=useState("");
  const filtered=useMemo(()=>families.filter(f=>[f.name,f.advisorName,f.advisorEmail].join(" ").toLowerCase().includes(search.toLowerCase())),[families,search]);

  const add=async f=>{const{error}=await sb.from("families").insert({name:f.name,advisor_name:f.advisorName||null,advisor_email:f.advisorEmail||null,notes:f.notes||null});if(error)toast(error.message,"error");else{toast("Family added");reload("families");}};
  const edit=async f=>{const{error}=await sb.from("families").update({name:f.name,advisor_name:f.advisorName||null,advisor_email:f.advisorEmail||null,notes:f.notes||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("families");}};
  const del=async id=>{const{error}=await sb.from("families").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("families");if(selected?.id===id)setSelected(null);}};

  // If a family is selected, show its dashboard
  if(selected) return <FamilyDashboard family={selected} data={data} reload={reload} toast={toast} onBack={()=>setSelected(null)}/>;

  const getStats=f=>({
    properties:(data.properties||[]).filter(p=>p.familyId===f.id).length,
    accounts:(data.portfolio_accounts||[]).filter(a=>a.familyId===f.id).length,
    tasks:(data.tasks||[]).filter(t=>t.familyId===f.id&&!t.done).length,
    value:(data.properties||[]).filter(p=>p.familyId===f.id).reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0)+
          (data.portfolio_accounts||[]).filter(a=>a.familyId===f.id).reduce((s,a)=>s+(Number(a.currentBalance)||0),0),
  });

  return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{padding:"14px 24px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center"}}>
      <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search families…" style={{flex:1}}/>
      <Btn onClick={()=>setModal("add")}>+ New Family</Btn>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
      {filtered.length===0&&<Empty text="No families yet. Add your first one."/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {filtered.map(f=>{
          const s=getStats(f);
          const overdue=(data.tasks||[]).filter(t=>t.familyId===f.id&&!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
          return <div key={f.id} onClick={()=>setSelected(f)} style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${B.gold}`,padding:20,cursor:"pointer",boxShadow:B.shadow,transition:"box-shadow .15s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=B.shadowMd}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=B.shadow}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600,marginBottom:2}}>{f.name}</div>
                <div style={{fontSize:12,color:B.textSoft}}>{f.advisorName||"No advisor assigned"}</div>
              </div>
              <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                <Btn small variant="ghost" onClick={()=>setModal(f)}>Edit</Btn>
                <Btn small variant="danger" onClick={()=>del(f.id)}>✕</Btn>
              </div>
            </div>
            <div style={{height:1,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:12}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[{l:"Est. Value",v:fmtMoney(s.value)},{l:"Properties",v:s.properties},{l:"Accounts",v:s.accounts},{l:"Open Tasks",v:s.tasks}].map(item=><div key={item.l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{item.l}</div>
                <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600}}>{item.v}</div>
              </div>)}
            </div>
            {overdue>0&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>{overdue} overdue task{overdue>1?"s":""}</Badge>}
            <div style={{marginTop:10,fontSize:12,color:B.gold,fontWeight:600}}>Click to open dashboard →</div>
          </div>;
        })}
      </div>
    </div>
    {modal==="add"&&<Modal title="New Family" onClose={()=>setModal(null)}><FamilyForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Family" onClose={()=>setModal(null)}><FamilyForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── PORTFOLIO ACCOUNT FORM (top-level) ──────────────────────────────────────
function PortfolioAccountForm({initial,families=[],onSave,onClose}){
  const[f,setF]=useState(initial||{familyId:"",institution:"",bankerName:"",accountType:"Investment",startingBalance:"",currentBalance:"",notes:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.institution.trim())return;setSaving(true);await onSave(f);onClose();};
  const pct=pctChange(f.startingBalance,f.currentBalance);
  return <div>
    {families.length>0&&<Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— No family —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>}
    <Grid2><Field label="Institution"><Inp placeholder="Merrill Lynch" value={f.institution} onChange={set("institution")}/></Field><Field label="Banker Name"><Inp value={f.bankerName||""} onChange={set("bankerName")}/></Field></Grid2>
    <Field label="Account Type"><Sel value={f.accountType} onChange={set("accountType")}>{ACCT_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field>
    <Grid2><Field label="Starting Balance"><Inp type="number" value={f.startingBalance||""} onChange={set("startingBalance")}/></Field><Field label="Current Balance"><Inp type="number" value={f.currentBalance||""} onChange={set("currentBalance")}/></Field></Grid2>
    {pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{Number(pct)>=0?"📈":"📉"}</span><div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}% performance</div></div>}
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

// ── PORTFOLIO VIEW (global) ───────────────────────────────────────────────────
function PortfolioView({data,reload,toast}){
  const{families,portfolio_accounts=[]}=data;
  const[modal,setModal]=useState(null);
  const[filterFamily,setFilterFamily]=useState("all");
  const[selected,setSelected]=useState(null);
  const gf=id=>families.find(f=>f.id===id);
  const accounts=portfolio_accounts.filter(a=>filterFamily==="all"||a.familyId===filterFamily);
  const totalValue=accounts.reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalStart=accounts.reduce((s,a)=>s+(Number(a.startingBalance)||0),0);
  const totalPct=totalStart>0?(((totalValue-totalStart)/totalStart)*100).toFixed(2):null;

  const add=async f=>{const{error}=await sb.from("portfolio_accounts").insert({family_id:f.familyId||null,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null});if(error)toast(error.message,"error");else{toast("Account added");reload("portfolio_accounts");}};
  const edit=async f=>{const{error}=await sb.from("portfolio_accounts").update({family_id:f.familyId||null,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("portfolio_accounts");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("portfolio_accounts").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("portfolio_accounts");if(selected?.id===id)setSelected(null);}};

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:200}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
        <div style={{flex:1,fontSize:12,color:B.textSoft}}>Total: <strong style={{color:B.navy}}>{fmtMoney(totalValue)}</strong>{totalPct!==null&&<span style={{color:Number(totalPct)>=0?"#18a850":"#d43030",fontWeight:700,marginLeft:8}}>{Number(totalPct)>=0?"+":""}{totalPct}%</span>}</div>
        <Btn onClick={()=>setModal("add")}>+ New Account</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {accounts.length===0&&<Empty text="No portfolio accounts yet."/>}
        {ACCT_TYPES.map(type=>{
          const list=accounts.filter(a=>a.accountType===type);
          if(!list.length)return null;
          return <div key={type}>
            <div style={{padding:"10px 20px 4px",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase"}}>{type}</span>
              <span style={{fontSize:11,color:B.textSoft,fontWeight:700}}>{fmtMoney(list.reduce((s,a)=>s+(Number(a.currentBalance)||0),0))}</span>
            </div>
            {list.map(a=>{const pct=pctChange(a.startingBalance,a.currentBalance);const fam=gf(a.familyId);return <div key={a.id} onClick={()=>setSelected(a)} style={{padding:"12px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===a.id?B.bg:B.white,borderLeft:`3px solid ${B.gold}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><div style={{fontWeight:700,color:B.navy}}>{a.institution}</div><div style={{fontSize:12,color:B.textSoft}}>{a.bankerName?`${a.bankerName} · `:""}{fam?fam.name:""}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:B.navy}}>{fmtMoney(a.currentBalance)}</div>{pct!==null&&<div style={{fontSize:11,fontWeight:700,color:Number(pct)>=0?"#18a850":"#d43030"}}>{Number(pct)>=0?"+":""}{pct}%</div>}</div>
              </div>
            </div>;})}
          </div>;
        })}
      </div>
    </div>
    {selected?(
      <div style={{width:360,overflowY:"auto",flexShrink:0,background:B.bg,padding:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{selected.institution}</div><div style={{fontSize:12,color:B.textSoft}}>{selected.accountType}</div></div>
          <div style={{display:"flex",gap:6}}><Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn></div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:14}}/>
        {(()=>{const pct=pctChange(selected.startingBalance,selected.currentBalance);const gain=(Number(selected.currentBalance)||0)-(Number(selected.startingBalance)||0);return pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",gap:14,alignItems:"center"}}><div style={{fontSize:28}}>{Number(pct)>=0?"📈":"📉"}</div><div><div style={{fontSize:24,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}%</div><div style={{fontSize:12,color:Number(pct)>=0?"#18a850":"#d43030",fontWeight:700}}>{Number(gain)>=0?"+":"-"}{fmtMoney(Math.abs(gain))}</div></div></div>;})()}
        <IRow label="Family" value={gf(selected.familyId)?.name||"—"}/>
        <IRow label="Banker" value={selected.bankerName||"—"}/>
        <IRow label="Starting Balance" value={fmtMoney(selected.startingBalance)}/>
        <IRow label="Current Balance" value={fmtMoney(selected.currentBalance)}/>
        {selected.notes&&<><SectionLabel>Notes</SectionLabel><div style={{fontSize:13,color:B.textMid,lineHeight:1.6}}>{selected.notes}</div></>}
      </div>
    ):<div style={{width:360,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select an account</div>}
    {modal==="add"&&<Modal title="New Portfolio Account" onClose={()=>setModal(null)}><PortfolioAccountForm families={families} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Portfolio Account" onClose={()=>setModal(null)}><PortfolioAccountForm initial={modal} families={families} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── NOTES VIEW ────────────────────────────────────────────────────────────────
function NotesView({data,reload,toast}){
  const{contacts,families,notes}=data;
  const[body,setBody]=useState("");const[cid,setCid]=useState("");const[fid,setFid]=useState("");const[search,setSearch]=useState("");const[saving,setSaving]=useState(false);
  const gc=id=>contacts.find(c=>c.id===id);const gf=id=>families.find(f=>f.id===id);
  const add=async()=>{if(!body.trim())return;setSaving(true);const{error}=await sb.from("notes").insert({body,contact_id:cid||null,family_id:fid||null});setSaving(false);if(error)toast(error.message,"error");else{toast("Note added");setBody("");reload("notes");}};
  const del=async id=>{const{error}=await sb.from("notes").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("notes");}};
  const filtered=notes.filter(n=>n.body.toLowerCase().includes(search.toLowerCase())||(gc(n.contactId)?.name||"").toLowerCase().includes(search.toLowerCase())||(gf(n.familyId)?.name||"").toLowerCase().includes(search.toLowerCase()));
  return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{padding:"20px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write a note or activity log entry…" style={{width:"100%",minHeight:88,background:"transparent",border:"none",padding:"14px 16px",color:B.text,fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 14px",borderTop:`1px solid ${B.borderLight}`,background:B.white,flexWrap:"wrap"}}>
            <select value={fid} onChange={e=>setFid(e.target.value)} style={{...inp,flex:1,minWidth:130,padding:"6px 10px",fontSize:13}}><option value="">🏠 Family</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select value={cid} onChange={e=>setCid(e.target.value)} style={{...inp,flex:1,minWidth:130,padding:"6px 10px",fontSize:13}}><option value="">👤 Contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <Btn onClick={add} disabled={saving||!body.trim()}>{saving?"Saving…":"Log Note"}</Btn>
          </div>
        </div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"20px 28px"}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:14,position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search notes…" style={{...inp,padding:"9px 14px",boxShadow:B.shadow}}/>
        </div>
        {filtered.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:B.textMute}}><div style={{fontSize:32,marginBottom:12}}>📝</div>No notes yet.</div>}
        {filtered.map(n=>{const contact=gc(n.contactId);const fam=gf(n.familyId);return <div key={n.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,marginBottom:12,boxShadow:B.shadow,overflow:"hidden"}}>
          <div style={{height:3,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`}}/>
          <div style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8}}><p style={{margin:0,color:B.text,fontSize:14,lineHeight:1.7,flex:1}}>{n.body}</p><button onClick={()=>del(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:B.textMute}}>🕐 {fmt(n.createdAt)}</span>
              {fam&&<span style={{background:"#e8f0f8",color:B.navyMid,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>🏠 {fam.name}</span>}
              {contact&&<span style={{background:"#fef3e2",color:"#8a5c00",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>👤 {contact.name}</span>}
            </div>
          </div>
        </div>;})}
      </div>
    </div>
  </div>;
}

// ── TASKS VIEW ────────────────────────────────────────────────────────────────
function TasksView({data,reload,toast}){
  const{contacts,families,tasks}=data;
  const[modal,setModal]=useState(null);const[filter,setFilter]=useState("Pending");const[filterFamily,setFilterFamily]=useState("all");
  const gc=id=>contacts.find(c=>c.id===id);const gf=id=>families.find(f=>f.id===id);
  const list=tasks.filter(t=>(filter==="All"||(filter==="Pending"?!t.done:t.done))&&(filterFamily==="all"||t.familyId===filterFamily));
  const oc=tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
  const soon=tasks.filter(t=>!t.done&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30&&new Date(t.dueDate)>=new Date()).length;

  const add=async f=>{const{error}=await sb.from("tasks").insert({family_id:f.familyId||null,contact_id:f.contactId||null,title:f.title,due_date:f.dueDate||null,priority:f.priority,reminder_days:Number(f.reminderDays)||7,done:false});if(error)toast(error.message,"error");else{toast("Task added");reload("tasks");}};
  const tog=async t=>{const{error}=await sb.from("tasks").update({done:!t.done}).eq("id",t.id);if(error)toast(error.message,"error");else reload("tasks");};
  const del=async id=>{const{error}=await sb.from("tasks").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("tasks");}};


  return <div style={{maxWidth:760,margin:"0 auto",padding:"20px",height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:5}}>{["Pending","Done","All"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?B.navy:"transparent",border:`1px solid ${filter===s?B.navy:B.border}`,color:filter===s?B.white:B.textSoft,borderRadius:20,padding:"4px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}</div>
      <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:170}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
      <div style={{flex:1,display:"flex",gap:8}}>
        {oc>0&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>{oc} overdue</Badge>}
        {soon>0&&<Badge scheme={{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"}}>{soon} due in 30 days</Badge>}
      </div>
      <Btn onClick={()=>setModal("add")}>+ New Task</Btn>
    </div>
    <div style={{overflowY:"auto",flex:1}}>
      {list.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:B.textMute,fontSize:14}}>No tasks here.</div>}
      {list.map(t=>{
        const contact=gc(t.contactId);const fam=gf(t.familyId);
        const isOD=!t.done&&t.dueDate&&new Date(t.dueDate)<new Date();
        const isSoon=!t.done&&!isOD&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30;
        return <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:8,background:B.white,border:`1px solid ${isOD?"#f5c6c6":B.borderLight}`,borderLeft:`3px solid ${isOD?"#d43030":isSoon?"#d4900a":PRIORITY_COLORS[t.priority]?.dot||B.gold}`,borderRadius:10,opacity:t.done?.55:1,boxShadow:B.shadow}}>
          <input type="checkbox" checked={!!t.done} onChange={()=>tog(t)} style={{width:16,height:16,accentColor:B.navy,cursor:"pointer",flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:B.navy,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
            <div style={{fontSize:12,color:B.textSoft,marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
              {fam&&<span style={{color:B.navyMid,fontWeight:600}}>{fam.name}</span>}
              {contact&&<span>{contact.name}</span>}
              {t.dueDate&&<span style={{color:isOD?"#d43030":isSoon?"#d4900a":B.textSoft}}>{isOD?"⚠ ":isSoon?"⏰ ":""}{fmt(t.dueDate)}</span>}
              {t.reminderDays>0&&<span style={{color:B.textMute}}>🔔 {t.reminderDays}d</span>}
            </div>
          </div>
          <Badge scheme={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
          <Btn small variant="danger" onClick={()=>del(t.id)}>✕</Btn>
        </div>;
      })}
    </div>
    {modal==="add"&&<Modal title="New Task" onClose={()=>setModal(null)}><GlobalTaskForm families={families} contacts={contacts} onSave={add} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── GLOBAL TASK FORM (top-level) ─────────────────────────────────────────────
function GlobalTaskForm({initial,families=[],contacts=[],onSave,onClose}){
  const[f,setF]=useState(initial||{familyId:"",contactId:"",title:"",dueDate:"",priority:"Medium",reminderDays:7,done:false});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2><Field label="Family"><Sel value={f.familyId||""} onChange={set("familyId")}><option value="">— None —</option>{families.map(fm=><option key={fm.id} value={fm.id}>{fm.name}</option>)}</Sel></Field>
    <Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field></Grid2>
    <Field label="Task"><Inp placeholder="Follow up on loan maturity" value={f.title} onChange={set("title")}/></Field>
    <Grid2><Field label="Due Date"><Inp type="date" value={f.dueDate||""} onChange={set("dueDate")}/></Field><Field label="Priority"><Sel value={f.priority} onChange={set("priority")}><option>Low</option><option>Medium</option><option>High</option></Sel></Field></Grid2>
    <Field label="Email Reminder"><Sel value={f.reminderDays||7} onChange={e=>setF(p=>({...p,reminderDays:Number(e.target.value)}))}><option value={0}>No reminder</option>{REMINDER_OPTIONS.map(r=><option key={r.days} value={r.days}>{r.label}</option>)}</Sel></Field>
    {Number(f.reminderDays)>0&&f.dueDate&&<div style={{background:"#e8f0f8",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:B.navyMid}}>🔔 Advisor emailed on {new Date(new Date(f.dueDate).setDate(new Date(f.dueDate).getDate()-Number(f.reminderDays))).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>}
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Task"}</Btn></div>
  </div>;
}

// ── PROSPECT VIEWS ────────────────────────────────────────────────────────────
function ProspectContactForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{name:"",company:"",email:"",phone:"",type:"Individual",tags:"",source:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2><Field label="Full Name"><Inp placeholder="Jane Smith" value={f.name} onChange={set("name")}/></Field><Field label="Company"><Inp value={f.company||""} onChange={set("company")}/></Field></Grid2>
    <Grid2><Field label="Email"><Inp type="email" value={f.email||""} onChange={set("email")}/></Field><Field label="Phone"><Inp value={f.phone||""} onChange={set("phone")}/></Field></Grid2>
    <Grid2><Field label="Type"><Sel value={f.type} onChange={set("type")}><option>Individual</option><option>Business</option></Sel></Field><Field label="Lead Source"><Inp placeholder="Referral, LinkedIn…" value={f.source||""} onChange={set("source")}/></Field></Grid2>
    <Field label="Tags"><Inp placeholder="warm-lead, vip" value={f.tags||""} onChange={set("tags")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

function ProspectContactsView({data,reload,toast}){
  const prospects=data.contacts.filter(c=>!c.familyId);
  const[modal,setModal]=useState(null);const[search,setSearch]=useState("");const[selected,setSelected]=useState(null);
  const filtered=useMemo(()=>prospects.filter(c=>[c.name,c.company,c.email,c.tags].join(" ").toLowerCase().includes(search.toLowerCase())),[prospects,search]);
  const add=async f=>{const{error}=await sb.from("contacts").insert({family_id:null,name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null});if(error)toast(error.message,"error");else{toast("Contact added");reload("contacts");}};
  const edit=async f=>{const{error}=await sb.from("contacts").update({name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("contacts");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("contacts").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("contacts");if(selected?.id===id)setSelected(null);}};
  const cDeals=selected?data.deals.filter(d=>d.contactId===selected.id):[];
  const cNotes=selected?data.notes.filter(n=>n.contactId===selected.id):[];
  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${B.borderLight}`}}>
      <div style={{padding:"14px 20px",display:"flex",gap:10,alignItems:"center",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search prospects…" style={{flex:1}}/>
        <Btn onClick={()=>setModal("add")}>+ New Contact</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {filtered.length===0&&<Empty text="No prospect contacts yet."/>}
        {filtered.map(c=><div key={c.id} onClick={()=>setSelected(c)} style={{padding:"13px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===c.id?B.bg:B.white}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontWeight:700,color:B.navy,marginBottom:2}}>{c.name}</div><div style={{fontSize:12,color:B.textSoft}}>{c.company||c.email||"—"}</div></div>
            <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
          </div>
        </div>)}
      </div>
    </div>
    {selected?<div style={{width:360,padding:22,overflowY:"auto",flexShrink:0,background:B.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{selected.name}</div><div style={{fontSize:12,color:B.textSoft}}>{selected.company}</div></div>
        <div style={{display:"flex",gap:6}}><Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn></div>
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:12}}/>
      {selected.email&&<IRow label="Email" value={selected.email}/>}
      {selected.phone&&<IRow label="Phone" value={selected.phone}/>}
      {selected.tags&&<IRow label="Tags" value={selected.tags}/>}
      <SectionLabel>Deals ({cDeals.length})</SectionLabel>
      {cDeals.length===0?<Empty text="No deals"/>:cDeals.map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><span style={{fontSize:13}}>{d.title}</span><Badge scheme={STAGE_COLORS[d.stage]}>{d.stage}</Badge></div>)}
      <SectionLabel>Notes ({cNotes.length})</SectionLabel>
      {cNotes.length===0?<Empty text="No notes"/>:cNotes.slice(0,3).map(n=><div key={n.id} style={{padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><div style={{fontSize:13,color:B.textMid}}>{n.body}</div><div style={{fontSize:11,color:B.textMute,marginTop:2}}>{fmt(n.createdAt)}</div></div>)}
    </div>:<div style={{width:360,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a contact</div>}
    {modal==="add"&&<Modal title="New Prospect" onClose={()=>setModal(null)}><ProspectContactForm onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Contact" onClose={()=>setModal(null)}><ProspectContactForm initial={modal} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

function ProspectDealForm({initial,contacts=[],onSave,onClose}){
  const[f,setF]=useState(initial||{contactId:"",title:"",value:"",stage:"Lead",closeDate:""});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Deal Title"><Inp value={f.title} onChange={set("title")}/></Field>
    <Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field>
    <Grid2><Field label="Value ($)"><Inp type="number" value={f.value||""} onChange={set("value")}/></Field><Field label="Close Date"><Inp type="date" value={f.closeDate||""} onChange={set("closeDate")}/></Field></Grid2>
    <Field label="Stage"><Sel value={f.stage} onChange={set("stage")}>{STAGES.map(s=><option key={s}>{s}</option>)}</Sel></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

function ProspectPipelineView({data,reload,toast}){
  const deals=data.deals.filter(d=>!d.familyId);
  const contacts=data.contacts.filter(c=>!c.familyId);
  const[modal,setModal]=useState(null);const[fs,setFs]=useState("All");
  const filtered=useMemo(()=>deals.filter(d=>fs==="All"||d.stage===fs),[deals,fs]);
  const byStage=STAGES.reduce((acc,s)=>({...acc,[s]:filtered.filter(d=>d.stage===s)}),{});
  const pipeline=deals.filter(d=>d.stage!=="Closed Lost").reduce((s,d)=>s+(Number(d.value)||0),0);
  const gc=id=>contacts.find(c=>c.id===id);

  const add=async f=>{const{error}=await sb.from("deals").insert({family_id:null,contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null});if(error)toast(error.message,"error");else{toast("Deal added");reload("deals");}};
  const edit=async f=>{const{error}=await sb.from("deals").update({contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("deals");}};
  const del=async id=>{const{error}=await sb.from("deals").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("deals");}};
  const move=async(deal,dir)=>{const idx=STAGES.indexOf(deal.stage);const next=STAGES[idx+dir];if(!next)return;const{error}=await sb.from("deals").update({stage:next}).eq("id",deal.id);if(error)toast(error.message,"error");else reload("deals");};

  return <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
    <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",background:B.white}}>
      <div style={{flex:1,display:"flex",gap:5,flexWrap:"wrap"}}>{["All",...STAGES].map(s=><button key={s} onClick={()=>setFs(s)} style={{background:fs===s?(STAGE_COLORS[s]?.bg||B.borderLight):"transparent",border:`1px solid ${fs===s?(STAGE_COLORS[s]?.dot||B.navy):B.border}`,color:fs===s?(STAGE_COLORS[s]?.text||B.navy):B.textSoft,borderRadius:20,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}</div>
      <div style={{fontSize:12,color:B.textSoft}}>Pipeline: <strong style={{color:B.navy}}>{fmtMoney(pipeline)}</strong></div>
      <Btn onClick={()=>setModal("add")}>+ New Deal</Btn>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
      {filtered.length===0&&<Empty text="No prospect deals yet."/>}
      {STAGES.map(stage=>{const list=byStage[stage];if(!list?.length)return null;return <div key={stage}>
        <div style={{padding:"8px 20px 3px",display:"flex",alignItems:"center",gap:7}}><span style={{width:7,height:7,borderRadius:"50%",background:STAGE_COLORS[stage].dot}}/><span style={{fontSize:11,fontWeight:800,color:STAGE_COLORS[stage].dot,letterSpacing:"0.1em",textTransform:"uppercase"}}>{stage}</span></div>
        {list.map(deal=>{const contact=gc(deal.contactId);return <div key={deal.id} style={{margin:"3px 20px",padding:"12px 15px",background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${STAGE_COLORS[deal.stage].dot}`,borderRadius:10,display:"flex",alignItems:"center",gap:10,boxShadow:B.shadow}}>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{deal.title}</div><div style={{fontSize:12,color:B.textSoft}}>{contact?contact.name:"No contact"}{deal.closeDate?` · ${fmt(deal.closeDate)}`:""}</div></div>
          {deal.value&&<div style={{color:B.navy,fontWeight:800,fontSize:14}}>{fmtMoney(deal.value)}</div>}
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>move(deal,-1)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}}>←</button>
            <button onClick={()=>move(deal,1)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}}>→</button>
            <Btn small variant="ghost" onClick={()=>setModal(deal)}>Edit</Btn>
            <Btn small variant="danger" onClick={()=>del(deal.id)}>✕</Btn>
          </div>
        </div>;})}
      </div>;})}
    </div>
    {modal==="add"&&<Modal title="New Deal" onClose={()=>setModal(null)}><ProspectDealForm contacts={contacts} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Deal" onClose={()=>setModal(null)}><ProspectDealForm initial={modal} contacts={contacts} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({data}){
  const{families,contacts,properties,deals,notes,tasks,portfolio_accounts=[]}=data;
  const openDeals=deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won");
  const pipeline=openDeals.reduce((s,d)=>s+(Number(d.value)||0),0);
  const totalRE=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0),0)+portfolio_accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalPortfolio=portfolio_accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const pending=tasks.filter(t=>!t.done);
  const overdue=pending.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const dueSoon=pending.filter(t=>t.dueDate&&!overdue.includes(t)&&(new Date(t.dueDate)-new Date())/(86400000)<=30);
  const stageCounts=STAGES.map(s=>({stage:s,count:deals.filter(d=>d.stage===s).length,value:deals.filter(d=>d.stage===s).reduce((sum,d)=>sum+(Number(d.value)||0),0)}));
  const maxC=Math.max(1,...stageCounts.map(s=>s.count));
  const gf=id=>families.find(f=>f.id===id);
  const hr=new Date().getHours();

  return <div style={{overflowY:"auto",height:"100%",padding:"26px 30px 48px"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <div style={{marginBottom:24}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600,marginBottom:4}}>Good {hr<12?"Morning":hr<17?"Afternoon":"Evening"}</div>
      <div style={{color:B.textSoft,fontSize:14}}>PCM Family Office — Portfolio & Client Overview</div>
      <div style={{height:2,width:56,background:B.gold,marginTop:10,borderRadius:2}}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
      {[{label:"Families",value:families.length,sub:`${contacts.length} contacts`,accent:B.navy},{label:"Real Estate",value:fmtMoney(totalRE),sub:`${properties.length} properties`,accent:B.gold},{label:"Portfolio",value:fmtMoney(totalPortfolio),sub:`${portfolio_accounts.length} accounts`,accent:B.navyMid},{label:"Open Tasks",value:pending.length,sub:overdue.length>0?`${overdue.length} overdue`:dueSoon.length>0?`${dueSoon.length} due soon`:"All on track",accent:overdue.length>0?"#d43030":dueSoon.length>0?"#d4900a":B.navyMid}].map(s=><div key={s.label} style={{background:B.bgCard,borderRadius:12,padding:"20px 22px",border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,borderTop:`3px solid ${s.accent}`}}>
        <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
        <div style={{fontSize:26,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600,lineHeight:1}}>{s.value}</div>
        <div style={{fontSize:11,color:B.textSoft,marginTop:5}}>{s.sub}</div>
      </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
      <div style={{background:B.bgCard,borderRadius:12,padding:24,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,marginBottom:4}}>Pipeline by Stage</div>
        <GoldLine/>
        {stageCounts.map(({stage,count,value})=><div key={stage} style={{marginBottom:11}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:7,height:7,borderRadius:"50%",background:STAGE_COLORS[stage].dot}}/><span style={{fontSize:12,color:B.textMid,fontWeight:600}}>{stage}</span></div>
            <div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:B.textMute}}>{count}</span>{value>0&&<span style={{fontSize:11,color:B.textSoft,fontWeight:700}}>{fmtMoney(value)}</span>}</div>
          </div>
          <div style={{height:5,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(count/maxC)*100}%`,background:`linear-gradient(90deg,${STAGE_COLORS[stage].dot}88,${STAGE_COLORS[stage].dot})`,borderRadius:3}}/></div>
        </div>)}
      </div>
      <div style={{background:B.bgCard,borderRadius:12,padding:24,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,marginBottom:4}}>Upcoming Deadlines</div>
        <GoldLine/>
        {[...overdue,...dueSoon].length===0&&<Empty text="No upcoming deadlines."/>}
        {[...overdue,...dueSoon].slice(0,6).map(t=>{const isOD=overdue.includes(t);const fam=gf(t.familyId);return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:isOD?"#d43030":"#d4900a",flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:B.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>{fam&&<div style={{fontSize:11,color:B.textMute}}>{fam.name}</div>}</div>
          <div style={{fontSize:11,color:isOD?"#d43030":"#d4900a",fontWeight:700,whiteSpace:"nowrap"}}>{isOD?"⚠ ":""}{fmt(t.dueDate)}</div>
        </div>;})}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={{background:B.bgCard,borderRadius:12,padding:24,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,marginBottom:4}}>Portfolio by Family</div>
        <GoldLine/>
        {families.map(f=>{const val=properties.filter(p=>p.familyId===f.id).reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0)+portfolio_accounts.filter(a=>a.familyId===f.id).reduce((s,a)=>s+(Number(a.currentBalance)||0),0);const pct=totalRE+totalPortfolio>0?Math.round((val/(totalRE+totalPortfolio))*100):0;return <div key={f.id} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:B.textMid,fontWeight:600}}>{f.name}</span><span style={{fontSize:12,color:B.textSoft}}>{fmtMoney(val)}</span></div>
          <div style={{height:6,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:B.navy,borderRadius:3}}/></div>
        </div>;})}
        {families.length===0&&<Empty text="No families yet."/>}
      </div>
      <div style={{background:B.bgCard,borderRadius:12,padding:24,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600,marginBottom:4}}>Recent Notes</div>
        <GoldLine/>
        {[...notes].sort((a,b)=>b.createdAt>a.createdAt?1:-1).slice(0,4).map(n=>{const fam=gf(n.familyId);return <div key={n.id} style={{padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>
          <div style={{fontSize:13,color:B.textMid,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.body}</div>
          <div style={{display:"flex",gap:8,marginTop:3}}><span style={{fontSize:11,color:B.textMute}}>{fmt(n.createdAt)}</span>{fam&&<span style={{fontSize:11,color:B.gold,fontWeight:700}}>{fam.name}</span>}</div>
        </div>;})}
        {notes.length===0&&<Empty text="No notes yet."/>}
      </div>
    </div>
  </div>;
}

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────
function UserManagementView({userProfile,data={},toast}){
  const families=data.families||[];
  const[users,setUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  // New user form state
  const[newEmail,setNewEmail]=useState("");
  const[newName,setNewName]=useState("");
  const[newRole,setNewRole]=useState("advisor");
  const[newFamily,setNewFamily]=useState("");
  const[newPassword,setNewPassword]=useState("");
  const[creating,setCreating]=useState(false);
  const[created,setCreated]=useState(null);

  const loadUsers=async()=>{
    const{data:rows}=await sb.from("user_profiles").select("*").order("created_at",{ascending:false});
    if(rows)setUsers(rows);
    setLoading(false);
  };
  useEffect(()=>{loadUsers();},[]);

  const toggleActive=async u=>{
    const{error}=await sb.from("user_profiles").update({active:!u.active}).eq("id",u.id);
    if(error)toast(error.message,"error");else{toast(u.active?"Deactivated":"Activated");loadUsers();}
  };
  const changeRole=async(u,role)=>{
    const{error}=await sb.from("user_profiles").update({role}).eq("id",u.id);
    if(error)toast(error.message,"error");else{toast("Role updated");loadUsers();}
  };
  const assignFamily=async(u,familyId)=>{
    const{error}=await sb.from("user_profiles").update({family_id:familyId||null}).eq("id",u.id);
    if(error)toast(error.message,"error");else{toast("Family assigned");loadUsers();}
  };

  const createUser=async()=>{
    if(!newEmail.trim()||!newPassword.trim())return toast("Email and password are required","error");
    if(newPassword.length<8)return toast("Password must be at least 8 characters","error");
    setCreating(true);
    // Sign up the new user
    const{data:authData,error:authError}=await sb.auth.signUp({
      email:newEmail.trim(),
      password:newPassword,
      options:{data:{full_name:newName,role:newRole}}
    });
    if(authError){setCreating(false);return toast(authError.message,"error");}
    // Insert/update their profile with role and family
    const userId=authData?.user?.id;
    if(userId){
      await sb.from("user_profiles").upsert({
        id:userId,
        email:newEmail.trim(),
        full_name:newName||newEmail.trim(),
        role:newRole,
        family_id:newFamily||null,
        active:true,
      });
    }
    setCreating(false);
    setCreated({email:newEmail,role:newRole,password:newPassword});
    setNewEmail("");setNewName("");setNewRole("advisor");setNewFamily("");setNewPassword("");
    setTimeout(loadUsers,1500);
  };

  const resetPass=u=>{
    sb.auth.resetPasswordForEmail(u.email,{redirectTo:window.location.origin});
    toast(`Password reset email sent to ${u.email}`);
  };

  if(!userProfile)return <Spinner/>;
  if(userProfile.role!=="admin")return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:12,color:B.textMute}}>
      <div style={{fontSize:40}}>🔒</div>
      <div style={{fontSize:16,color:B.navy,fontWeight:600}}>Admin Access Only</div>
    </div>
  );

  return <div style={{height:"100%",overflow:"auto",padding:"28px 32px"}}>
    <div style={{maxWidth:920,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:B.navy,fontWeight:600}}>User Management</div>
        <Btn onClick={()=>setModal("create")}>+ Add User</Btn>
      </div>

      {/* User table */}
      {loading?<Spinner/>:<div style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,overflow:"hidden",marginBottom:24}}>
        <div style={{display:"grid",gridTemplateColumns:"1.2fr 1.4fr 130px 1fr 110px 130px",padding:"10px 20px",background:B.bg,borderBottom:`1px solid ${B.borderLight}`,gap:8}}>
          {["Name","Email","Role","Family (clients)","Status","Actions"].map(h=><div key={h} style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {users.map(u=><div key={u.id} style={{display:"grid",gridTemplateColumns:"1.2fr 1.4fr 130px 1fr 110px 130px",padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,alignItems:"center",gap:8,opacity:u.active?1:0.6}}>
          <div>
            <div style={{fontWeight:700,color:B.navy,fontSize:13}}>{u.full_name||"—"}</div>
            {u.id===userProfile?.id&&<div style={{fontSize:10,color:B.gold,fontWeight:700}}>You</div>}
          </div>
          <div style={{fontSize:12,color:B.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
          <div>
            {u.id===userProfile?.id
              ?<Badge scheme={{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}}>{u.role}</Badge>
              :<select value={u.role||"advisor"} onChange={e=>changeRole(u,e.target.value)} style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,padding:"4px 8px",fontSize:12,color:B.text,outline:"none",fontFamily:"inherit",cursor:"pointer",width:"100%"}}>
                <option value="admin">Admin</option>
                <option value="advisor">Advisor</option>
                <option value="client">Client</option>
              </select>}
          </div>
          <div>
            {u.role==="client"
              ?<select value={u.family_id||""} onChange={e=>assignFamily(u,e.target.value)} style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,padding:"4px 8px",fontSize:11,color:B.text,outline:"none",fontFamily:"inherit",cursor:"pointer",width:"100%"}}>
                <option value="">— Assign Family —</option>
                {families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              :<span style={{fontSize:11,color:B.textMute}}>—</span>}
          </div>
          <div>
            <span style={{background:u.active?"#e0f5e9":"#fde8e8",color:u.active?"#0d5c2b":"#8b1a1a",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
              {u.active?"Active":"Inactive"}
            </span>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {u.id!==userProfile?.id&&<>
              <Btn small variant={u.active?"danger":"ghost"} onClick={()=>toggleActive(u)}>{u.active?"Deactivate":"Activate"}</Btn>
              <Btn small variant="ghost" onClick={()=>resetPass(u)}>Reset PW</Btn>
            </>}
          </div>
        </div>)}
        {users.length===0&&<div style={{padding:"40px",textAlign:"center",color:B.textMute,fontSize:14}}>No users yet. Add your first user above.</div>}
      </div>}

      {/* Create User Modal */}
      {modal==="create"&&<Modal title="Add New User" onClose={()=>{setModal(null);setCreated(null);}}>
        {created?(
          <div style={{textAlign:"center",padding:"10px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,marginBottom:8}}>User Created!</div>
            <div style={{fontSize:13,color:B.textSoft,marginBottom:20}}>Share these credentials with <strong>{created.email}</strong></div>
            <div style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:10,padding:"16px 20px",textAlign:"left",marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                <span style={{fontSize:12,color:B.textSoft}}>Email</span>
                <span style={{fontSize:13,fontWeight:700,color:B.navy}}>{created.email}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                <span style={{fontSize:12,color:B.textSoft}}>Password</span>
                <span style={{fontSize:13,fontWeight:700,color:B.navy,fontFamily:"monospace"}}>{created.password}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
                <span style={{fontSize:12,color:B.textSoft}}>Role</span>
                <span style={{fontSize:13,fontWeight:700,color:B.navy}}>{created.role}</span>
              </div>
            </div>
            <div style={{background:"#fef3e2",border:"1px solid #fcd97d",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#8a5c00",marginBottom:20,textAlign:"left"}}>
              ⚠️ Save this password now — it cannot be retrieved later. The user can reset it from the login screen.
            </div>
            <Btn onClick={()=>{setModal(null);setCreated(null);}}>Done</Btn>
          </div>
        ):(
          <div>
            <Grid2>
              <Field label="Full Name"><Inp placeholder="Jane Smith" value={newName} onChange={e=>setNewName(e.target.value)}/></Field>
              <Field label="Email Address"><Inp type="email" placeholder="jane@email.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></Field>
            </Grid2>
            <Field label="Temporary Password">
              <div style={{display:"flex",gap:8}}>
                <Inp placeholder="Min 8 characters" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{flex:1}}/>
                <Btn variant="ghost" onClick={()=>setNewPassword(Math.random().toString(36).slice(2,10)+"Aa1!")}>Generate</Btn>
              </div>
            </Field>
            <Grid2>
              <Field label="Role">
                <Sel value={newRole} onChange={e=>setNewRole(e.target.value)}>
                  <option value="advisor">Advisor — sees assigned families</option>
                  <option value="admin">Admin — sees everything</option>
                  <option value="client">Client — read-only portal</option>
                </Sel>
              </Field>
              {newRole==="client"&&<Field label="Assign to Family">
                <Sel value={newFamily} onChange={e=>setNewFamily(e.target.value)}>
                  <option value="">— Select family —</option>
                  {families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                </Sel>
              </Field>}
            </Grid2>
            {newRole==="client"&&!newFamily&&<div style={{background:"#fef3e2",border:"1px solid #fcd97d",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#8a5c00",marginBottom:14}}>Select a family so the client can see their portal.</div>}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Cancel</Btn>
              <Btn onClick={createUser} disabled={creating||!newEmail||!newPassword}>{creating?"Creating…":"Create User"}</Btn>
            </div>
          </div>
        )}
      </Modal>}
    </div>
  </div>;
}

// ── DOCUMENTS VIEW ────────────────────────────────────────────────────────────
const DOC_CATEGORIES = ["General","Tax","Legal","Insurance","Investment","Real Estate","Estate Planning","Other"];

function DocumentsView({familyId,readOnly=false,toast}){
  const[docs,setDocs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[uploading,setUploading]=useState(false);
  const[modal,setModal]=useState(null);
  const[filterCat,setFilterCat]=useState("All");
  const[name,setName]=useState("");
  const[description,setDescription]=useState("");
  const[category,setCategory]=useState("General");
  const[file,setFile]=useState(null);

  const loadDocs=async()=>{
    const q=sb.from("documents").select("*").order("created_at",{ascending:false});
    if(familyId) q.eq("family_id",familyId);
    const{data}=await q;
    if(data)setDocs(data.map(toClient));
    setLoading(false);
  };
  useEffect(()=>{loadDocs();},[familyId]);

  const upload=async()=>{
    if(!file||!name.trim())return;
    setUploading(true);
    try{
      // Upload file to Supabase storage
      const ext=file.name.split(".").pop();
      const path=`${familyId||"general"}/${Date.now()}_${file.name.replace(/\s+/g,"_")}`;
      const{error:uploadError}=await sb.storage.from("documents").upload(path,file,{upsert:false});
      if(uploadError)throw new Error(uploadError.message);
      // Save record
      const{error:dbError}=await sb.from("documents").insert({family_id:familyId||null,name,description:description||null,category,file_path:path,file_size:file.size,file_type:file.type||ext});
      if(dbError)throw new Error(dbError.message);
      toast("Document uploaded");
      setModal(null);setName("");setDescription("");setCategory("General");setFile(null);
      loadDocs();
    }catch(e){toast(e.message,"error");}
    setUploading(false);
  };

  const download=async(doc)=>{
    const{data,error}=await sb.storage.from("documents").createSignedUrl(doc.filePath,300);
    if(error)return toast("Could not get download link","error");
    window.open(data.signedUrl,"_blank");
  };

  const del=async(doc)=>{
    await sb.storage.from("documents").remove([doc.filePath]);
    await sb.from("documents").delete().eq("id",doc.id);
    toast("Document deleted");loadDocs();
  };

  const fmtSize=bytes=>{if(!bytes)return"—";if(bytes<1024)return bytes+"B";if(bytes<1024*1024)return(bytes/1024).toFixed(1)+"KB";return(bytes/(1024*1024)).toFixed(1)+"MB";};
  const fileIcon=type=>{if(!type)return"📄";if(type.includes("pdf"))return"📕";if(type.includes("image"))return"🖼";if(type.includes("word")||type.includes("document"))return"📝";if(type.includes("sheet")||type.includes("excel"))return"📊";if(type.includes("presentation"))return"📊";return"📄";};

  const filtered=docs.filter(d=>filterCat==="All"||d.category===filterCat);

  return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{padding:"14px 24px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{flex:1,display:"flex",gap:6,flexWrap:"wrap"}}>
        {["All",...DOC_CATEGORIES].map(c=><button key={c} onClick={()=>setFilterCat(c)} style={{background:filterCat===c?B.navy:"transparent",border:`1px solid ${filterCat===c?B.navy:B.border}`,color:filterCat===c?B.white:B.textSoft,borderRadius:20,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{c}</button>)}
      </div>
      {!readOnly&&<Btn onClick={()=>setModal("upload")}>⬆ Upload Document</Btn>}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
      {loading?<Spinner/>:filtered.length===0?<div style={{padding:"60px 0",textAlign:"center",color:B.textMute}}><div style={{fontSize:40,marginBottom:12}}>📁</div>No documents yet.</div>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map(doc=><div key={doc.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:18,boxShadow:B.shadow,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{fontSize:32,flexShrink:0}}>{fileIcon(doc.fileType)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,color:B.navy,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div>
              {doc.description&&<div style={{fontSize:12,color:B.textSoft,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.description}</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <Badge scheme={{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}}>{doc.category}</Badge>
            <span style={{fontSize:11,color:B.textMute}}>{fmtSize(doc.fileSize)}</span>
          </div>
          <div style={{fontSize:11,color:B.textMute}}>{fmt(doc.createdAt)}</div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <Btn small onClick={()=>download(doc)} style={{flex:1}}>⬇ Download</Btn>
            {!readOnly&&<Btn small variant="danger" onClick={()=>del(doc)}>✕</Btn>}
          </div>
        </div>)}
      </div>}
    </div>

    {modal==="upload"&&<Modal title="Upload Document" onClose={()=>setModal(null)}>
      <Field label="Document Name"><Inp placeholder="Q4 2024 Statement" value={name} onChange={e=>setName(e.target.value)}/></Field>
      <Field label="Category"><Sel value={category} onChange={e=>setCategory(e.target.value)}>{DOC_CATEGORIES.map(c=><option key={c}>{c}</option>)}</Sel></Field>
      <Field label="Description"><Inp placeholder="Optional description" value={description} onChange={e=>setDescription(e.target.value)}/></Field>
      <Field label="File">
        <div style={{border:`2px dashed ${file?B.gold:B.border}`,borderRadius:10,padding:"20px",textAlign:"center",cursor:"pointer",background:file?"#fef9f0":B.bg,transition:"all .2s"}} onClick={()=>document.getElementById("file-upload").click()}>
          <input id="file-upload" type="file" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])}/>
          {file?<><div style={{fontSize:24,marginBottom:6}}>✅</div><div style={{fontSize:13,color:B.navy,fontWeight:600}}>{file.name}</div><div style={{fontSize:11,color:B.textSoft}}>{(file.size/1024/1024).toFixed(2)} MB</div></>:<><div style={{fontSize:32,marginBottom:6}}>📁</div><div style={{fontSize:13,color:B.textSoft}}>Click to select a file</div><div style={{fontSize:11,color:B.textMute,marginTop:4}}>PDF, Word, Excel, images supported</div></>}
        </div>
      </Field>
      <div style={{background:"#e8f0f8",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:B.navyMid}}>
        ⚠️ First create a Storage bucket named <strong>documents</strong> in Supabase → Storage → New Bucket (Private)
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setModal(null)}>Cancel</Btn>
        <Btn onClick={upload} disabled={uploading||!file||!name.trim()}>{uploading?"Uploading…":"Upload"}</Btn>
      </div>
    </Modal>}
  </div>;
}

// ── CLIENT DASHBOARD ──────────────────────────────────────────────────────────
function ClientDashboard({family,data,userProfile,logout}){
  const[activeTab,setActiveTab]=useState("summary");
  const properties=(data.properties||[]).filter(p=>p.familyId===family.id);
  const accounts=(data.portfolio_accounts||[]).filter(a=>a.familyId===family.id);
  const valuables=(data.valuables||[]).filter(v=>v.familyId===family.id);
  const tasks=(data.tasks||[]).filter(t=>t.familyId===family.id&&!t.done);
  const totalRE=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0),0)+accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalAccounts=accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalValuables=valuables.reduce((s,v)=>s+(Number(v.estimatedValue)||0),0);
  const netWorth=totalRE-totalDebt+totalAccounts+totalValuables;
  const overdue=tasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const soon=tasks.filter(t=>!overdue.includes(t)&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30);

  const TABS=[
    {id:"summary",   label:"Summary",    icon:"◈"},
    {id:"portfolio", label:"Portfolio",  icon:"◇"},
    {id:"properties",label:"Properties", icon:"⌂"},
    {id:"valuables", label:"Valuables",  icon:"◆"},
    {id:"tasks",     label:"Tasks",      icon:"◻"},
    {id:"documents", label:"Documents",  icon:"📁"},
  ];

  return <div style={{minHeight:"100vh",background:B.bg,fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

    {/* Header */}
    <div style={{background:B.navy,padding:"0 32px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <PCMLogo dark/>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.white,fontWeight:600}}>{family.name}</div>
            <div style={{fontSize:11,color:"rgba(206,182,132,0.7)",marginTop:2}}>Client Portal · {new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
          </div>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.7)",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </div>
      {/* Tabs */}
      <div style={{display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"none",border:"none",borderBottom:activeTab===t.id?`2px solid ${B.gold}`:"2px solid transparent",color:activeTab===t.id?B.gold:"rgba(255,255,255,0.6)",fontFamily:"inherit",fontSize:13,fontWeight:activeTab===t.id?700:400,padding:"12px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:-1}}>
          <span>{t.icon}</span>{t.label}
        </button>)}
      </div>
    </div>

    {/* Content */}
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>

      {/* SUMMARY */}
      {activeTab==="summary"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600,marginBottom:6}}>
          Good {new Date().getHours()<12?"Morning":new Date().getHours()<17?"Afternoon":"Evening"}
        </div>
        <div style={{color:B.textSoft,fontSize:14,marginBottom:24}}>Here is your financial overview as of {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>

        {/* Net Worth Hero */}
        <div style={{background:`linear-gradient(135deg,${B.navy},${B.navyMid})`,borderRadius:16,padding:"32px 36px",marginBottom:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:200,height:200,borderRadius:"50%",background:"rgba(206,182,132,0.08)"}}/>
          <div style={{fontSize:12,color:"rgba(206,182,132,0.8)",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Estimated Net Worth</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:52,color:B.white,fontWeight:600,lineHeight:1,marginBottom:8}}>{fmtMoney(netWorth)}</div>
          <div style={{height:1,background:"rgba(206,182,132,0.3)",margin:"16px 0"}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20,marginTop:4}}>
            {[{l:"Real Estate",v:fmtMoney(totalRE)},{l:"Total Debt",v:fmtMoney(totalDebt),neg:true},{l:"Portfolio",v:fmtMoney(totalAccounts)},{l:"Valuables",v:fmtMoney(totalValuables)}].map(s=><div key={s.l}>
              <div style={{fontSize:10,color:"rgba(206,182,132,0.6)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:s.neg?"#f87171":B.white,fontWeight:600}}>{s.v}</div>
            </div>)}
          </div>
        </div>

        {/* Alert banners */}
        {overdue.length>0&&<div style={{background:"#fde8e8",border:"1px solid #f5c6c6",borderRadius:10,padding:"12px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div><div style={{fontWeight:700,color:"#8b1a1a",fontSize:14}}>Overdue Tasks</div><div style={{fontSize:13,color:"#8b1a1a"}}>{overdue.length} task{overdue.length>1?"s":""} past due — please contact your advisor.</div></div>
        </div>}
        {soon.length>0&&<div style={{background:"#fef3e2",border:"1px solid #fcd97d",borderRadius:10,padding:"12px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>⏰</span>
          <div><div style={{fontWeight:700,color:"#8a5c00",fontSize:14}}>Upcoming Deadlines</div><div style={{fontSize:13,color:"#8a5c00"}}>{soon.length} task{soon.length>1?"s":""} due within 30 days.</div></div>
        </div>}

        {/* Quick stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {[{l:"Properties",v:properties.length,icon:"🏠"},{l:"Portfolio Accounts",v:accounts.length,icon:"📈"},{l:"Valuables",v:valuables.length,icon:"💎"},{l:"Pending Tasks",v:tasks.length,icon:"✅"}].map(s=><div key={s.l} style={{background:B.white,borderRadius:12,padding:"20px",border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600,lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:11,color:B.textMute,marginTop:4,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.l}</div>
          </div>)}
        </div>
      </div>}

      {/* PORTFOLIO */}
      {activeTab==="portfolio"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600,marginBottom:20}}>Investment Portfolio</div>
        {accounts.length===0?<Empty text="No portfolio accounts on file."/>:accounts.map(a=>{
          const pct=pctChange(a.startingBalance,a.currentBalance);
          const gain=(Number(a.currentBalance)||0)-(Number(a.startingBalance)||0);
          return <div key={a.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${B.gold}`,borderRadius:12,padding:24,marginBottom:16,boxShadow:B.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,fontWeight:600}}>{a.institution}</div><div style={{fontSize:13,color:B.textSoft}}>{a.accountType}{a.bankerName?` · ${a.bankerName}`:""}</div></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600}}>{fmtMoney(a.currentBalance)}</div>
                {pct!==null&&<div style={{fontSize:13,fontWeight:700,color:Number(pct)>=0?"#18a850":"#d43030"}}>{Number(pct)>=0?"+":""}{pct}% ({Number(gain)>=0?"+":"-"}{fmtMoney(Math.abs(gain))})</div>}
              </div>
            </div>
            {pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:32}}>{Number(pct)>=0?"📈":"📉"}</div>
              <div>
                <div style={{fontSize:11,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Performance Since Inception</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a",fontWeight:600}}>{Number(pct)>=0?"+":""}{pct}%</div>
                <div style={{fontSize:12,color:B.textSoft}}>Starting balance: {fmtMoney(a.startingBalance)}</div>
              </div>
            </div>}
          </div>;
        })}
        <div style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:20,boxShadow:B.shadow,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14,color:B.textSoft,fontWeight:600}}>Total Portfolio Value</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600}}>{fmtMoney(totalAccounts)}</div>
        </div>
      </div>}

      {/* PROPERTIES */}
      {activeTab==="properties"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600,marginBottom:20}}>Property Holdings</div>
        {properties.length===0?<Empty text="No properties on file."/>:properties.map(p=><div key={p.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${B.gold}`,borderRadius:12,padding:24,marginBottom:16,boxShadow:B.shadow}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{p.address}</div>{p.ownerName&&<div style={{fontSize:13,color:B.textSoft,marginTop:2}}>{p.ownerName}</div>}</div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600}}>{fmtMoney(p.currentValue||p.purchasePrice)}</div>
              <div style={{fontSize:12,color:B.textSoft}}>Current Value</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[["Property Type",p.propertyType],["Purchase Price",fmtMoney(p.purchasePrice)],["Purchase Date",fmt(p.purchaseDate)],["Lender",p.lender||"—"],["Loan Balance",fmtMoney(p.loanBalance)],["Interest Rate",fmtPct(p.interestRate)],["Monthly Payment",fmtMoney(p.loanPayment)],["Loan Maturity",fmt(p.loanMaturityDate)],["Rental Income",p.rentalIncome?`${fmtMoney(p.rentalIncome)}/mo`:"—"],["Property Taxes",p.propertyTaxes?`${fmtMoney(p.propertyTaxes)}/yr`:"—"],["Insurance",p.insuranceCompany||"—"],["Flood Insurance",p.floodInsurance?"Yes":"No"]].map(([l,v])=><div key={l} style={{background:B.bg,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{l}</div>
              <div style={{fontSize:13,color:B.text,fontWeight:600}}>{v}</div>
            </div>)}
          </div>
        </div>)}
      </div>}

      {/* VALUABLES */}
      {activeTab==="valuables"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600,marginBottom:8}}>Personal Property & Valuables</div>
        <div style={{fontSize:14,color:B.textSoft,marginBottom:20}}>Total estimated value: <strong style={{color:B.navy}}>{fmtMoney(totalValuables)}</strong></div>
        {valuables.length===0?<Empty text="No valuables on file."/>:VALUABLE_CATS.map(cat=>{
          const items=valuables.filter(v=>v.category===cat);
          if(!items.length)return null;
          return <div key={cat} style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{cat}</div>
            {items.map(v=><div key={v.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid #8b5cf6`,borderRadius:10,padding:"16px 20px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:B.shadow}}>
              <div>
                <div style={{fontWeight:700,color:B.navy,fontSize:14}}>{v.description}</div>
                {v.makeModel&&<div style={{fontSize:12,color:B.textSoft}}>{v.makeModel}{v.year?` · ${v.year}`:""}</div>}
                {v.insured&&<div style={{fontSize:11,color:"#18a850",fontWeight:600,marginTop:3}}>✓ Insured{v.insuranceCompany?` — ${v.insuranceCompany}`:""}</div>}
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,fontWeight:600}}>{fmtMoney(v.estimatedValue)}</div>
            </div>)}
          </div>;
        })}
      </div>}

      {/* TASKS */}
      {activeTab==="tasks"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600,marginBottom:20}}>Tasks & Deadlines</div>
        {tasks.length===0?<div style={{textAlign:"center",padding:"60px 0",color:B.textMute}}><div style={{fontSize:40,marginBottom:12}}>✅</div>All caught up — no pending tasks.</div>:[...tasks].sort((a,b)=>a.dueDate>b.dueDate?1:-1).map(t=>{
          const isOD=t.dueDate&&new Date(t.dueDate)<new Date();
          const isSoon=!isOD&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30;
          return <div key={t.id} style={{background:B.white,border:`1px solid ${isOD?"#f5c6c6":B.borderLight}`,borderLeft:`4px solid ${isOD?"#d43030":isSoon?"#d4900a":PRIORITY_COLORS[t.priority]?.dot||B.gold}`,borderRadius:10,padding:"16px 20px",marginBottom:10,boxShadow:B.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:700,color:B.navy,fontSize:14}}>{t.title}</div>
                {t.dueDate&&<div style={{fontSize:12,color:isOD?"#d43030":isSoon?"#d4900a":B.textSoft,marginTop:4,fontWeight:isOD||isSoon?700:400}}>{isOD?"⚠ Overdue · ":isSoon?"⏰ Due soon · ":""}{fmt(t.dueDate)}</div>}
              </div>
              <Badge scheme={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
            </div>
          </div>;
        })}
      </div>}

      {/* DOCUMENTS */}
      {activeTab==="documents"&&<div style={{height:"calc(100vh - 200px)"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600,marginBottom:20}}>Documents</div>
        <DocumentsView familyId={family.id} readOnly={true} toast={()=>{}}/>
      </div>}

    </div>

    {/* Footer */}
    <div style={{background:B.navy,padding:"16px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:40}}>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>PCM Family Office · info@pcmfamilyoffice.com</div>
      <div style={{fontSize:10,color:"rgba(206,182,132,0.5)",letterSpacing:"0.1em"}}>CONFIDENTIAL · FOR AUTHORIZED RECIPIENTS ONLY</div>
    </div>
  </div>;
}


// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV_SECTIONS=[
  {section:"CLIENT MANAGEMENT",items:[
    {id:"dashboard",label:"Dashboard",icon:"⬡"},
    {id:"families", label:"Families", icon:"⌂"},
    {id:"portfolio",label:"Portfolio",icon:"◇"},
    {id:"cm-notes", label:"Notes",    icon:"◧"},
    {id:"cm-tasks", label:"Tasks",    icon:"◻"},
  ]},
  {section:"PROSPECTING",items:[
    {id:"p-contacts",label:"Contacts", icon:"◉"},
    {id:"p-pipeline",label:"Pipeline", icon:"◆"},
    {id:"p-notes",   label:"Notes",    icon:"◧"},
    {id:"p-tasks",   label:"Tasks",    icon:"◻"},
  ]},
  {section:"ADMIN",items:[
    {id:"users",label:"Users",icon:"⊕"},
  ]},
];
const ALL_NAV=NAV_SECTIONS.flatMap(s=>s.items);

// ── APP ────────────────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("dashboard");
  const[data,setData]=useState({families:[],contacts:[],properties:[],deals:[],notes:[],tasks:[],portfolio_accounts:[],valuables:[],documents:[]});
  const[loading,setLoading]=useState(true);
  const[toastState,setToastState]=useState(null);
  const[authed,setAuthed]=useState(false);
  const[userProfile,setUserProfile]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const logout=async()=>{await sb.auth.signOut();setAuthed(false);setUserProfile(null);};
  const showToast=useCallback((msg,type="success")=>{setToastState({msg,type});setTimeout(()=>setToastState(null),3500);},[]);

  const loadProfile=useCallback(async userId=>{
    const{data:d}=await sb.from("user_profiles").select("*").eq("id",userId).single();
    if(d)setUserProfile({id:d.id,email:d.email,role:d.role,fullName:d.full_name,active:d.active,familyId:d.family_id});
  },[]);

  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>{if(session?.user){setAuthed(true);loadProfile(session.user.id);}setAuthLoading(false);});
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{if(session?.user){setAuthed(true);loadProfile(session.user.id);}else{setAuthed(false);setUserProfile(null);}setAuthLoading(false);});
    return()=>subscription.unsubscribe();
  },[loadProfile]);

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
    (async()=>{
      setLoading(true);
      if(userProfile.role==="client"){
        // Client: only load their family's data
        await Promise.all(TABLES.map(fetchTable));
      } else {
        await reload();
      }
      setLoading(false);
    })();
  },[authed,userProfile]);

  const cmStats={families:data.families.length,portfolio:(data.portfolio_accounts||[]).length,"cm-notes":data.notes.filter(n=>n.familyId).length,"cm-tasks":data.tasks.filter(t=>t.familyId&&!t.done).length};
  const pStats={"p-contacts":data.contacts.filter(c=>!c.familyId).length,"p-pipeline":data.deals.filter(d=>!d.familyId&&d.stage!=="Closed Lost").length,"p-notes":data.notes.filter(n=>!n.familyId).length,"p-tasks":data.tasks.filter(t=>!t.familyId&&!t.done).length};
  const allStats={...cmStats,...pStats,users:0};
  const overdue=data.tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
  const currentLabel=ALL_NAV.find(n=>n.id===tab)?.label||"";
  const currentSection=NAV_SECTIONS.find(s=>s.items.some(i=>i.id===tab))?.section||"";

  if(authLoading)return <div style={{minHeight:"100vh",background:B.navy,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!authed||!userProfile)return <LoginScreen/>;
  if(userProfile.active===false)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:B.bg,fontFamily:"'DM Sans',sans-serif",color:B.navy,fontSize:16,flexDirection:"column",gap:12}}><div style={{fontSize:40}}>🔒</div>Your account has been deactivated. Contact your administrator.</div>;

  // Client role — show read-only family dashboard
  if(userProfile.role==="client"){
    const clientFamily=data.families.find(f=>f.id===userProfile.familyId);
    if(loading)return <div style={{minHeight:"100vh",background:B.navy,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
    if(!clientFamily)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:B.bg,flexDirection:"column",gap:12,color:B.navy,fontFamily:"'DM Sans',sans-serif"}}><PCMLogo/><div style={{marginTop:20,fontSize:16}}>No family assigned to your account. Contact your advisor.</div><button onClick={logout} style={{marginTop:12,background:"none",border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 16px",cursor:"pointer",fontFamily:"inherit",color:B.textSoft}}>Sign Out</button></div>;
    return <ClientDashboard family={clientFamily} data={data} userProfile={userProfile} logout={logout}/>;
  }


  // For families tab, header shows differently when inside a family dashboard
  const isFamiliesTab=tab==="families";

  return <div style={{display:"flex",height:"100vh",background:B.bg,fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:B.text,overflow:"hidden",flexDirection:"row"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

    {/* Sidebar */}
    <div style={{width:232,background:B.navy,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"14px 16px 12px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <PCMLogo dark/>
        <div style={{fontSize:8,color:"rgba(206,182,132,0.5)",letterSpacing:"0.18em",marginTop:8}}>DISCOVER · SIMPLIFY · EXECUTE</div>
      </div>
      <nav style={{flex:1,padding:"8px",overflowY:"auto"}}>
        {NAV_SECTIONS.filter(s=>s.section!=="ADMIN"||userProfile?.role==="admin").map(({section,items})=><div key={section} style={{marginBottom:6}}>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(206,182,132,0.55)",letterSpacing:"0.16em",padding:"10px 10px 4px",textTransform:"uppercase"}}>{section}</div>
          {items.map(item=><button key={item.id} onClick={()=>setTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:tab===item.id?"rgba(206,182,132,0.18)":"transparent",color:tab===item.id?B.gold:"rgba(255,255,255,0.85)",fontFamily:"inherit",fontSize:13,fontWeight:tab===item.id?700:400,marginBottom:1,textAlign:"left",borderLeft:tab===item.id?`2px solid ${B.gold}`:"2px solid transparent"}}>
            <span style={{fontSize:12}}>{item.icon}</span>
            <span style={{flex:1}}>{item.label}</span>
            {item.id==="cm-tasks"&&overdue>0?<span style={{background:"#d43030",borderRadius:10,padding:"1px 6px",fontSize:9,color:"#fff",fontWeight:700}}>{overdue}</span>:allStats[item.id]>0?<span style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"1px 6px",fontSize:9,color:"rgba(255,255,255,0.7)"}}>{allStats[item.id]}</span>:null}
          </button>)}
        </div>)}
      </nav>
      <div style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        {userProfile&&<div style={{marginBottom:8}}><div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userProfile.fullName||userProfile.email}</div><div style={{fontSize:9,color:B.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:1}}>{userProfile.role}</div></div>}
        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginBottom:4}}>{data.families.length} families · {(data.portfolio_accounts||[]).length} accounts</div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <button onClick={()=>reload()} style={{background:"none",border:"none",color:"rgba(206,182,132,0.6)",fontSize:9,cursor:"pointer",padding:0,fontFamily:"inherit"}}>↺ Refresh</button>
          <button onClick={logout} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:9,cursor:"pointer",padding:0,fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </div>
    </div>

    {/* Main */}
    <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
      {/* Only show header when NOT in families tab (family dashboard has its own header) */}
      {tab!=="families"&&<>
        <div style={{padding:"13px 28px 11px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:1}}>{currentSection}</div>
            <h1 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:B.navy,fontWeight:600}}>{currentLabel}</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:11,color:B.textMute}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            {userProfile&&<div style={{background:B.bg,border:`1px solid ${B.borderLight}`,borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#18a850"}}/>
              <span style={{fontSize:11,color:B.textMid,fontWeight:600}}>{userProfile.fullName||userProfile.email}</span>
              <span style={{fontSize:10,color:B.textMute,background:B.borderLight,borderRadius:10,padding:"1px 6px"}}>{userProfile.role}</span>
            </div>}
          </div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${B.gold},${B.goldLight}55,transparent)`}}/>
      </>}

      <div style={{flex:1,minHeight:0,overflow:"hidden",background:B.bg,paddingBottom:"0"}}>
        {loading&&tab!=="families"&&tab!=="users"?<Spinner/>:<>
          {tab==="dashboard"   &&<Dashboard data={data}/>}
          {tab==="families"    &&<FamiliesView data={data} reload={reload} toast={showToast}/>}
          {tab==="portfolio"   &&<PortfolioView data={data} reload={reload} toast={showToast}/>}
          {tab==="cm-notes"    &&<NotesView data={{...data,notes:data.notes.filter(n=>n.familyId)}} reload={reload} toast={showToast}/>}
          {tab==="cm-tasks"    &&<TasksView data={{...data,tasks:data.tasks.filter(t=>t.familyId)}} reload={reload} toast={showToast}/>}
          {tab==="users"       &&<UserManagementView userProfile={userProfile} data={data} toast={showToast}/>}
          {tab==="p-contacts"  &&<ProspectContactsView data={data} reload={reload} toast={showToast}/>}
          {tab==="p-pipeline"  &&<ProspectPipelineView data={data} reload={reload} toast={showToast}/>}
          {tab==="p-notes"     &&<NotesView data={{...data,notes:data.notes.filter(n=>!n.familyId),families:[]}} reload={reload} toast={showToast}/>}
          {tab==="p-tasks"     &&<TasksView data={{...data,tasks:data.tasks.filter(t=>!t.familyId),families:[]}} reload={reload} toast={showToast}/>}
        </>}
      </div>
    </div>
    {toastState&&<Toast msg={toastState.msg} type={toastState.type}/>}
  </div>;
}
