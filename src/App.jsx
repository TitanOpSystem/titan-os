// PCM Family Office Platform — App.jsx
// BUILD 2026-05-05 · Cash Flow (income+expenses+reorder) · MoneyInput commas · smart chart axis · client read-only · mobile
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { PCM_LOGO } from "./logo.js";
// PCM tree emblem (transparent PNG) — used as the icon on document cards in place of file-type emoji.
const PCM_MARK="data:image/png;base64,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";
// PCM Platform v5.0 — build 20260429

const SUPABASE_URL = "https://unkirihxtruhdjeldfpm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVua2lyaWh4dHJ1aGRqZWxkZnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTA3MjUsImV4cCI6MjA5MTcyNjcyNX0._Ve9Pr3ooja-YdHYFIupebaZRhDjmJDnz2b-vzrhY04";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── MOBILE DETECTION ──────────────────────────────────────────────────────────
const MOBILE_BREAKPOINT = 768;
function useIsMobile(){
  const[isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<MOBILE_BREAKPOINT);
  useEffect(()=>{
    const onResize=()=>setIsMobile(window.innerWidth<MOBILE_BREAKPOINT);
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  return isMobile;
}

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

// ── CASH FLOW ─────────────────────────────────────────────────────────────────
const CF_EVENT_TYPES=["Salary","Bonus","Sale","RSU","Grant","PE Deal","Rental Income","Distribution","Other Income","Other Expense"];
const CF_EXPENSE_CATEGORIES=["Rent/Mortgage","Utilities","Storage","House Cleaning","Car","School","Life Insurance","Other Insurance","Grocery","Misc","Legal","Shopping","Personal Care","Gym/Spa","Investments","Savings","Other"];
const CF_FREQUENCIES=[
  {value:"once",label:"One-time"},
  {value:"weekly",label:"Weekly"},
  {value:"biweekly",label:"Bi-weekly"},
  {value:"monthly",label:"Monthly"},
  {value:"quarterly",label:"Quarterly"},
  {value:"annually",label:"Annually"},
];
const CF_TAX_TREATMENTS=[
  {value:"ordinary",label:"Ordinary Income (W-2, Salary, Bonus, RSU vesting)"},
  {value:"ltcg",label:"Long-Term Capital Gains (held >1 year)"},
  {value:"stcg",label:"Short-Term Capital Gains (held <1 year, taxed as ordinary)"},
  {value:"qualified_div",label:"Qualified Dividends (LTCG rates)"},
  {value:"none",label:"Non-taxable / Already taxed"},
];
const CF_PROJECTION_OPTIONS=[
  {value:12,label:"12 Months"},
  {value:24,label:"2 Years"},
  {value:36,label:"3 Years"},
  {value:60,label:"5 Years"},
  {value:84,label:"7 Years"},
  {value:120,label:"10 Years"},
];

// 2026 Federal Tax Brackets (projected based on inflation adjustments from 2025)
// Source: IRS Rev. Proc. 2025-32 (official 2026 tax year brackets, OBBBA-permanent structure)
const TAX_BRACKETS_2026={
  single:[
    {min:0,max:12400,rate:0.10},
    {min:12400,max:50400,rate:0.12},
    {min:50400,max:105700,rate:0.22},
    {min:105700,max:201775,rate:0.24},
    {min:201775,max:256225,rate:0.32},
    {min:256225,max:640600,rate:0.35},
    {min:640600,max:Infinity,rate:0.37},
  ],
  mfj:[
    {min:0,max:24800,rate:0.10},
    {min:24800,max:100800,rate:0.12},
    {min:100800,max:211400,rate:0.22},
    {min:211400,max:403550,rate:0.24},
    {min:403550,max:512450,rate:0.32},
    {min:512450,max:768700,rate:0.35},
    {min:768700,max:Infinity,rate:0.37},
  ],
};
// 2026 federal standard deduction (IRS Rev. Proc. 2025-32 / OBBBA). Applied to ordinary income event income, once per tax year, before federal brackets. State/local rates apply to full gross.
const STANDARD_DEDUCTION_2026={single:16100,mfj:32200};
// Long-term capital gains brackets for 2026 (IRS Rev. Proc. 2025-32)
const LTCG_BRACKETS_2026={
  single:[
    {min:0,max:49450,rate:0.00},
    {min:49450,max:545500,rate:0.15},
    {min:545500,max:Infinity,rate:0.20},
  ],
  mfj:[
    {min:0,max:98900,rate:0.00},
    {min:98900,max:613700,rate:0.15},
    {min:613700,max:Infinity,rate:0.20},
  ],
};
// Net Investment Income Tax (NIIT) thresholds — 3.8% on capital gains above this
const NIIT_THRESHOLD={single:200000,mfj:250000};
const NIIT_RATE=0.038;

// State income tax — top marginal rates as of 2025-2026.
// Values are top brackets; using these for high-income family-office clients.
// Sources: state revenue dept publications. Rates change yearly — review annually.
const STATE_TAX_RATES=[
  {code:"AL",name:"Alabama",rate:5.0},
  {code:"AK",name:"Alaska",rate:0.0},
  {code:"AZ",name:"Arizona",rate:2.5},
  {code:"AR",name:"Arkansas",rate:3.9},
  {code:"CA",name:"California",rate:13.3},
  {code:"CO",name:"Colorado",rate:4.4},
  {code:"CT",name:"Connecticut",rate:6.99},
  {code:"DE",name:"Delaware",rate:6.6},
  {code:"DC",name:"District of Columbia",rate:10.75},
  {code:"FL",name:"Florida",rate:0.0},
  {code:"GA",name:"Georgia",rate:5.39},
  {code:"HI",name:"Hawaii",rate:11.0},
  {code:"ID",name:"Idaho",rate:5.695},
  {code:"IL",name:"Illinois",rate:4.95},
  {code:"IN",name:"Indiana",rate:3.0},
  {code:"IA",name:"Iowa",rate:3.8},
  {code:"KS",name:"Kansas",rate:5.58},
  {code:"KY",name:"Kentucky",rate:4.0},
  {code:"LA",name:"Louisiana",rate:3.0},
  {code:"ME",name:"Maine",rate:7.15},
  {code:"MD",name:"Maryland",rate:5.75},
  {code:"MA",name:"Massachusetts",rate:9.0},
  {code:"MI",name:"Michigan",rate:4.25},
  {code:"MN",name:"Minnesota",rate:9.85},
  {code:"MS",name:"Mississippi",rate:4.4},
  {code:"MO",name:"Missouri",rate:4.7},
  {code:"MT",name:"Montana",rate:5.9},
  {code:"NE",name:"Nebraska",rate:5.2},
  {code:"NV",name:"Nevada",rate:0.0},
  {code:"NH",name:"New Hampshire",rate:0.0},
  {code:"NJ",name:"New Jersey",rate:10.75},
  {code:"NM",name:"New Mexico",rate:5.9},
  {code:"NY",name:"New York",rate:10.9},
  {code:"NC",name:"North Carolina",rate:4.5},
  {code:"ND",name:"North Dakota",rate:2.5},
  {code:"OH",name:"Ohio",rate:3.5},
  {code:"OK",name:"Oklahoma",rate:4.75},
  {code:"OR",name:"Oregon",rate:9.9},
  {code:"PA",name:"Pennsylvania",rate:3.07},
  {code:"RI",name:"Rhode Island",rate:5.99},
  {code:"SC",name:"South Carolina",rate:6.2},
  {code:"SD",name:"South Dakota",rate:0.0},
  {code:"TN",name:"Tennessee",rate:0.0},
  {code:"TX",name:"Texas",rate:0.0},
  {code:"UT",name:"Utah",rate:4.55},
  {code:"VT",name:"Vermont",rate:8.75},
  {code:"VA",name:"Virginia",rate:5.75},
  {code:"WA",name:"Washington",rate:0.0},
  {code:"WV",name:"West Virginia",rate:5.12},
  {code:"WI",name:"Wisconsin",rate:7.65},
  {code:"WY",name:"Wyoming",rate:0.0},
];

// Calculate marginal federal tax on an additional dollar at given income level
function marginalRate(income,brackets){
  for(const b of brackets){if(income>=b.min&&income<b.max)return b.rate;}
  return brackets[brackets.length-1].rate;
}
// Calculate effective tax owed on an amount given a base income (for marginal stacking)
function calcOrdinaryTax(amount,baseIncome,filingStatus){
  const brackets=TAX_BRACKETS_2026[filingStatus]||TAX_BRACKETS_2026.mfj;
  let remaining=amount;let tax=0;let cur=baseIncome;
  for(const b of brackets){
    if(remaining<=0)break;
    if(cur>=b.max)continue;
    const room=b.max-Math.max(cur,b.min);
    const inThisBracket=Math.min(remaining,room);
    if(inThisBracket>0){tax+=inThisBracket*b.rate;remaining-=inThisBracket;cur+=inThisBracket;}
  }
  return tax;
}
function calcLTCGTax(amount,baseIncome,filingStatus){
  const brackets=LTCG_BRACKETS_2026[filingStatus]||LTCG_BRACKETS_2026.mfj;
  let remaining=amount;let tax=0;let cur=baseIncome;
  for(const b of brackets){
    if(remaining<=0)break;
    if(cur>=b.max)continue;
    const room=b.max-Math.max(cur,b.min);
    const inThisBracket=Math.min(remaining,room);
    if(inThisBracket>0){tax+=inThisBracket*b.rate;remaining-=inThisBracket;cur+=inThisBracket;}
  }
  return tax;
}
function calcNIIT(capGainsAmount,totalIncome,filingStatus){
  const threshold=NIIT_THRESHOLD[filingStatus]||NIIT_THRESHOLD.mfj;
  if(totalIncome<=threshold)return 0;
  const aboveThreshold=totalIncome-threshold;
  const taxable=Math.min(capGainsAmount,aboveThreshold);
  return Math.max(0,taxable)*NIIT_RATE;
}
// Calculate total tax + net for a single event given the family's tax context
function calcEventTax(grossAmount,treatment,baseIncome,filingStatus,stateRate,localRate){
  const gross=Number(grossAmount)||0;
  if(gross<=0||treatment==="none")return{tax:0,fedTax:0,stateTax:0,localTax:0,niit:0,net:gross};
  let fedTax=0;let niit=0;
  if(treatment==="ordinary"||treatment==="stcg"){
    fedTax=calcOrdinaryTax(gross,baseIncome,filingStatus);
  }else if(treatment==="ltcg"||treatment==="qualified_div"){
    fedTax=calcLTCGTax(gross,baseIncome,filingStatus);
    niit=calcNIIT(gross,baseIncome+gross,filingStatus);
  }
  const stateTax=gross*((Number(stateRate)||0)/100);
  const localTax=gross*((Number(localRate)||0)/100);
  const totalTax=fedTax+stateTax+localTax+niit;
  return{tax:totalTax,fedTax,stateTax,localTax,niit,net:gross-totalTax};
}
// Annualized ordinary income (ordinary + short-term gains) from the projected events, used to place the marginal bracket.
function annualOrdinaryIncome(enrichedEvents,projectionMode,projectionMonths){
  const years=Math.max(1,(projectionMode==="year"?12:(Number(projectionMonths)||12))/12);
  const ord=(enrichedEvents||[]).filter(e=>!e._excluded&&!e._baseSalary&&e.direction!=="expense"&&(e.taxTreatment==="ordinary"||e.taxTreatment==="stcg")).reduce((s,e)=>s+(Number(e.projectedGross)||0),0);
  return ord/years;
}
// All-in marginal rate (%): federal bracket on the next dollar of ordinary income (base salary + annualized ordinary income, after the standard deduction) plus state and local rates.
function marginalTaxRate(baseIncome,annualOrdinary,filingStatus,stateRate,localRate){
  const stdDed=STANDARD_DEDUCTION_2026[filingStatus]||STANDARD_DEDUCTION_2026.mfj;
  const taxable=Math.max(0,(Number(baseIncome)||0)+(Number(annualOrdinary)||0)-stdDed);
  const fed=marginalRate(taxable,TAX_BRACKETS_2026[filingStatus]||TAX_BRACKETS_2026.mfj);
  return fed*100+(Number(stateRate)||0)+(Number(localRate)||0);
}
// Expand a recurring event into monthly occurrences within projection window
// Parse a YYYY-MM-DD string as LOCAL midnight (not UTC) to avoid timezone day/month shifts
function parseLocalDate(s){
  if(!s)return new Date(NaN);
  if(typeof s==="string"){const m=s.slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));}
  return new Date(s);
}
function expandEvent(event,projectionStart,monthsOut){
  const occurrences=[];
  const start=parseLocalDate(event.startDate);
  if(isNaN(start))return occurrences;
  const end=event.endDate?parseLocalDate(event.endDate):null;
  const projEnd=new Date(projectionStart);projEnd.setMonth(projEnd.getMonth()+monthsOut);
  const amount=Number(event.amount)||0;
  if(event.frequency==="once"){
    if(start>=projectionStart&&start<=projEnd&&(!end||start<=end)){
      occurrences.push({date:start,amount});
    }
    return occurrences;
  }
  // Recurring — advance through dates
  let cur=new Date(start);
  let safety=600; // max iterations
  while(cur<=projEnd&&safety-->0){
    if(cur>=projectionStart&&(!end||cur<=end)){
      occurrences.push({date:new Date(cur),amount});
    }
    if(event.frequency==="weekly")cur.setDate(cur.getDate()+7);
    else if(event.frequency==="biweekly")cur.setDate(cur.getDate()+14);
    else if(event.frequency==="monthly")cur.setMonth(cur.getMonth()+1);
    else if(event.frequency==="quarterly")cur.setMonth(cur.getMonth()+3);
    else if(event.frequency==="annually")cur.setFullYear(cur.getFullYear()+1);
    else break;
  }
  return occurrences;
}

// Build a month-by-month cash flow projection. Tax rates are passed in so the same
// inputs can be projected under different state/local tax scenarios (for Compare).
function buildProjection(allEvents,settings,stateRate,localRate){
  const yearMode=settings.projectionMode==="year";
  const start=new Date();
  if(yearMode){start.setMonth(0,1);}else{start.setDate(1);}
  start.setHours(0,0,0,0);
  const projMonths=yearMode?12:settings.projectionMonths;
  const months=[];
  for(let i=0;i<projMonths;i++){
    const d=new Date(start);d.setMonth(d.getMonth()+i);
    months.push({date:new Date(d),label:d.toLocaleDateString("en-US",{month:"short",year:"2-digit"}),income:0,tax:0,expense:0,gross:0,net:0});
  }
  const baseIncome=Number(settings.baseIncome)||0;
  const filing=settings.filingStatus;
  const stdDed=STANDARD_DEDUCTION_2026[filing]||STANDARD_DEDUCTION_2026.mfj;
  const sRate=(Number(stateRate)||0)/100;
  const lRate=(Number(localRate)||0)/100;
  // The standard deduction is consumed by the base salary first (it's the bottom of the income stack);
  // ordinary income events then stack on the post-deduction floor and draw any leftover deduction.
  const floor=Math.max(0,baseIncome-stdDed);
  const eventDedPerYear=Math.max(0,stdDed-baseIncome);
  const salaryIncluded=settings.includeIncome!==false;

  // Base salary: spread evenly across the projection months and taxed as ordinary income (federal from $0 after
  // the standard deduction, plus state/local on full salary). Surfaced as a read-only "Base Salary" income line.
  let salaryEvent=null;
  if(baseIncome>0){
    const monthlyBase=baseIncome/12;
    const annualBaseTax=calcOrdinaryTax(floor,0,filing)+baseIncome*(sRate+lRate);
    const monthlyBaseTax=annualBaseTax/12;
    if(salaryIncluded){months.forEach(m=>{m.income+=monthlyBase;m.gross+=monthlyBase;m.tax+=monthlyBaseTax;m.net+=monthlyBase-monthlyBaseTax;});}
    salaryEvent={id:"__base_salary",eventType:"Base Salary",direction:"income",frequency:"monthly",taxTreatment:"ordinary",amount:monthlyBase,startDate:start.toISOString().slice(0,10),endDate:null,_synthetic:true,_baseSalary:true,_excluded:!salaryIncluded,description:"Annual base salary, spread monthly",projectedGross:salaryIncluded?monthlyBase*projMonths:0,projectedTax:salaryIncluded?monthlyBaseTax*projMonths:0,projectedNet:salaryIncluded?(monthlyBase-monthlyBaseTax)*projMonths:0};
  }

  // Pass 1: expand events into occurrences. Tally expenses immediately; queue income for a chronological pass
  // so the annual standard deduction can be drawn down in date order across all income events.
  const perEvent=new Map();
  const incomeOccs=[];
  allEvents.forEach(ev=>{
    const pe={projGross:0,projTax:0,projExpense:0,excluded:false};perEvent.set(ev,pe);
    const isExpense=ev.direction==="expense";
    const excluded=isExpense?(settings.includeExpense===false):(!ev._synthetic&&settings.includeIncome===false);
    if(excluded){pe.excluded=true;return;}
    expandEvent(ev,start,projMonths).forEach(occ=>{
      const monthIdx=(occ.date.getFullYear()-start.getFullYear())*12+(occ.date.getMonth()-start.getMonth());
      if(monthIdx<0||monthIdx>=months.length)return;
      if(isExpense){
        const amt=Math.abs(Number(occ.amount)||0);
        pe.projExpense+=amt;months[monthIdx].expense+=amt;months[monthIdx].net-=amt;
      }else{
        incomeOccs.push({ev,date:occ.date,amount:Number(occ.amount)||0,treatment:ev.taxTreatment,monthIdx});
      }
    });
  });

  // Pass 2: income in date order. Ordinary income events stack on the post-deduction floor; any standard deduction
  // not used by the base salary shields the first events of each calendar year. State & local apply to full gross.
  incomeOccs.sort((a,b)=>a.date-b.date);
  const dedLeft={};
  incomeOccs.forEach(o=>{
    const pe=perEvent.get(o.ev);
    const gross=o.amount;
    months[o.monthIdx].gross+=gross;months[o.monthIdx].income+=gross;pe.projGross+=gross;
    if(gross<=0||o.treatment==="none"){months[o.monthIdx].net+=gross;return;}
    const yr=o.date.getFullYear();
    if(dedLeft[yr]===undefined)dedLeft[yr]=eventDedPerYear;
    let fedTax=0,niit=0;
    if(o.treatment==="ordinary"||o.treatment==="stcg"){
      const shield=Math.min(dedLeft[yr],gross);dedLeft[yr]-=shield;
      fedTax=calcOrdinaryTax(gross-shield,floor,filing);
    }else if(o.treatment==="ltcg"||o.treatment==="qualified_div"){
      fedTax=calcLTCGTax(gross,floor,filing);
      niit=calcNIIT(gross,baseIncome+gross,filing);
    }
    const tax=fedTax+gross*sRate+gross*lRate+niit;
    months[o.monthIdx].tax+=tax;months[o.monthIdx].net+=gross-tax;pe.projTax+=tax;
  });

  const enriched=allEvents.map(ev=>{
    const pe=perEvent.get(ev);
    if(pe.excluded)return{...ev,projectedGross:0,projectedTax:0,projectedExpense:0,projectedNet:0,_excluded:true};
    if(ev.direction==="expense")return{...ev,projectedGross:0,projectedTax:0,projectedExpense:pe.projExpense,projectedNet:-pe.projExpense};
    return{...ev,projectedGross:pe.projGross,projectedTax:pe.projTax,projectedNet:pe.projGross-pe.projTax};
  });
  if(salaryEvent)enriched.unshift(salaryEvent);
  return{monthlyData:months,enrichedEvents:enriched};
}

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
// Report-grade currency: always 2 decimals + thousands separators ($1,324,486.40). Avoids ragged decimals from raw toLocaleString().
const fmtUSD=n=>n!=null&&n!==""?`$${Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—";
// Smart-abbreviated money for chart axis labels: $5K, $500K, $5M, $1.5M
const fmtMoneyShort=n=>{
  if(n==null||n==="")return"$0";
  const num=Number(n);
  const abs=Math.abs(num);
  const sign=num<0?"-":"";
  if(abs>=1e9)return`${sign}$${(abs/1e9).toFixed(abs>=1e10?0:1).replace(/\.0$/,"")}B`;
  if(abs>=1e6)return`${sign}$${(abs/1e6).toFixed(abs>=1e7?0:1).replace(/\.0$/,"")}M`;
  if(abs>=1e3)return`${sign}$${(abs/1e3).toFixed(abs>=1e4?0:1).replace(/\.0$/,"")}K`;
  return`${sign}$${abs.toFixed(0)}`;
};
const fmtPct=n=>n!=null&&n!==""?`${Number(n).toFixed(2)}%`:"—";
const pctChange=(s,c)=>{const sv=Number(s)||0;const cv=Number(c)||0;if(!sv)return null;return(((cv-sv)/sv)*100).toFixed(2);};

const toClient=obj=>{
  if(!obj)return obj;
  const m={family_id:"familyId",contact_id:"contactId",account_id:"accountId",close_date:"closeDate",due_date:"dueDate",created_at:"createdAt",uploaded_at:"uploadedAt",advisor_name:"advisorName",advisor_email:"advisorEmail",owner_name:"ownerName",property_type:"propertyType",purchase_price:"purchasePrice",purchase_date:"purchaseDate",current_value:"currentValue",loan_balance:"loanBalance",interest_rate:"interestRate",loan_payment:"loanPayment",loan_maturity_date:"loanMaturityDate",loan_type:"loanType",rental_income:"rentalIncome",property_taxes:"propertyTaxes",flood_insurance:"floodInsurance",insurance_company:"insuranceCompany",insurance_premium:"insurancePremium",flood_insurance_company:"floodInsuranceCompany",flood_insurance_premium:"floodInsurancePremium",insurance_expiration:"insuranceExpiration",flood_insurance_expiration:"floodInsuranceExpiration",account_type:"accountType",starting_balance:"startingBalance",current_balance:"currentBalance",banker_name:"bankerName",make_model:"makeModel",estimated_value:"estimatedValue",file_type:"fileType",reminder_days:"reminderDays",reminder_sent:"reminderSent",full_name:"fullName",file_path:"filePath",file_size:"fileSize",uploaded_by:"uploadedBy",event_type:"eventType",start_date:"startDate",end_date:"endDate",tax_treatment:"taxTreatment",filing_status:"filingStatus",state_tax_rate:"stateTaxRate",base_income:"baseIncome",cash_flow_settings:"cashFlowSettings",hoa_fee:"hoaFee",property_management_fee_pct:"propertyManagementFeePct",include_mortgage_in_cashflow:"includeMortgageInCashflow",sort_order:"sortOrder",note_id:"noteId",recurrence_interval:"recurrenceInterval",recurrence_unit:"recurrenceUnit",second_mortgage_balance:"secondMortgageBalance",second_mortgage_payment:"secondMortgagePayment",assistant_name:"assistantName"};
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[m[k]||k,v]));
};

const TABLES=["families","contacts","properties","deals","notes","tasks","portfolio_accounts","valuables","documents","cash_flow_events","note_attachments"];
const FAMILY_SCOPED=["contacts","properties","deals","notes","tasks","portfolio_accounts","valuables","documents","cash_flow_events"];


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
// Formats numbers as US dollars with commas while user types. Stores the raw numeric value (no commas) on change.
function MoneyInput({value,onChange,placeholder,style,disabled}){
  // Format number for display: 1234567.89 → "1,234,567.89"
  const fmt=(v)=>{
    if(v===""||v===null||v===undefined)return"";
    const s=String(v);
    // Allow trailing decimal point and trailing zeros
    const negative=s.startsWith("-");
    const abs=negative?s.slice(1):s;
    if(abs===""||abs===".")return s;
    const parts=abs.split(".");
    const whole=parts[0]||"0";
    const decimal=parts.length>1?"."+parts[1]:"";
    const wholeWithCommas=whole.replace(/\B(?=(\d{3})+(?!\d))/g,",");
    return(negative?"-":"")+wholeWithCommas+decimal;
  };
  // Strip non-numeric (allow leading -, decimal point) on change
  const handleChange=(e)=>{
    let raw=e.target.value;
    // Allow user to type freely; strip commas and any character not digit/period/minus
    raw=raw.replace(/,/g,"").replace(/[^0-9.\-]/g,"");
    // Only one minus, only at start
    if(raw.indexOf("-")>0)raw=raw.replace(/-/g,"");
    // Only one decimal
    const firstDot=raw.indexOf(".");
    if(firstDot!==-1){
      raw=raw.slice(0,firstDot+1)+raw.slice(firstDot+1).replace(/\./g,"");
    }
    // Pass back the cleaned numeric string (or empty)
    onChange&&onChange({target:{value:raw}});
  };
  return <input type="text" inputMode="decimal" style={style||inp} disabled={disabled} value={fmt(value)} onChange={handleChange} placeholder={placeholder||"0"}/>;
}
const Sel=({children,...p})=><select style={{...inp,cursor:"pointer"}} {...p}>{children}</select>;
function AdvisorScopeBar({userProfile,value,onChange,label="Advisor"}){
  const[advisors,setAdvisors]=useState([]);
  const isAdmin=userProfile?.role==="admin";
  useEffect(()=>{
    if(isAdmin)sb.from("user_profiles").select("id,email,full_name,role").in("role",["advisor","admin"]).then(({data:rows,error})=>{if(!error&&rows)setAdvisors(rows);});
  },[isAdmin]);
  if(!isAdmin)return null;
  return <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
    <span style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}</span>
    <div style={{minWidth:150}}>
      <Sel value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">All Advisors</option>
        {advisors.map(a=><option key={a.id} value={(a.email||"").toLowerCase()}>{a.full_name||a.email}</option>)}
      </Sel>
    </div>
  </div>;
}
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
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0)+(Number(p.secondMortgageBalance)||0),0)+accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
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
    ${Number(p.secondMortgageBalance)>0?`<tr><td><b>2nd Mortgage</b></td><td>${fmtMoney(p.secondMortgageBalance)}</td><td><b>2nd Mtg Payment</b></td><td>${p.secondMortgagePayment?`${fmtMoney(p.secondMortgagePayment)}/mo`:"—"}</td></tr>`:""}
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
      {[{l:"Properties",v:properties.length},{l:"Real Estate",v:fmtMoney(totalPortfolio)},{l:"Portfolio",v:fmtMoney(totalAccounts)},{l:"Open Tasks",v:tasks.length}].map(s=><StatBox key={s.l} label={s.l} value={s.v}/>)}
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="gold" onClick={print}>🖨 Print Report</Btn>
    </div>
  </Modal>;
}

// ── FAMILY DASHBOARD ──────────────────────────────────────────────────────────
// ── AI HELP CENTER ────────────────────────────────────────────────────────────
// Builds a compact, family-scoped snapshot of everything on the dashboard, then
// lets the user ask natural-language questions answered by the family-ai-assistant
// Supabase Edge Function. Read-only; no data ever leaves the family's own scope.
function buildFamilySnapshot(family,data){
  const fid=family.id;
  const today=new Date(); today.setHours(0,0,0,0);
  const daysFromNow=d=>{ if(!d)return null; const t=new Date(d); if(isNaN(t.getTime()))return null; const t0=new Date(t.getFullYear(),t.getMonth(),t.getDate()); return Math.round((t0-today)/86400000); };
  const num=v=>{ const n=Number(v); return Number.isFinite(n)?n:0; };

  const properties=(data.properties||[]).filter(p=>p.familyId===fid).map(p=>({
    address:p.address||null, owner:p.ownerName||null, type:p.propertyType||null,
    purchasePrice:num(p.purchasePrice), purchaseDate:p.purchaseDate||null,
    currentValue:num(p.currentValue)||num(p.purchasePrice),
    lender:p.lender||null, loanBalance:num(p.loanBalance),
    interestRatePct:(p.interestRate===""||p.interestRate==null)?null:num(p.interestRate),
    monthlyPayment:num(p.loanPayment), loanType:p.loanType||null,
    loanMaturityDate:p.loanMaturityDate||null, daysUntilLoanMaturity:daysFromNow(p.loanMaturityDate),
    secondMortgageBalance:num(p.secondMortgageBalance), secondMortgagePaymentMonthly:num(p.secondMortgagePayment),
    rentalIncomeMonthly:num(p.rentalIncome), propertyTaxesAnnual:num(p.propertyTaxes), utilitiesMonthly:num(p.utilities),
    insuranceCompany:p.insuranceCompany||null, insurancePremiumAnnual:num(p.insurancePremium),
    insuranceExpirationDate:p.insuranceExpiration||null, daysUntilInsuranceExpiration:daysFromNow(p.insuranceExpiration),
    floodInsurance:!!p.floodInsurance, floodInsuranceCompany:p.floodInsuranceCompany||null,
    floodInsurancePremiumAnnual:num(p.floodInsurancePremium),
    floodInsuranceExpirationDate:p.floodInsuranceExpiration||null, daysUntilFloodInsuranceExpiration:daysFromNow(p.floodInsuranceExpiration),
    hoaFeeMonthly:num(p.hoaFee),
    propertyManagementFeePct:(p.propertyManagementFeePct===""||p.propertyManagementFeePct==null)?null:num(p.propertyManagementFeePct),
    notes:p.notes||null,
  }));

  const portfolioAccounts=(data.portfolio_accounts||[]).filter(a=>a.familyId===fid).map(a=>({
    institution:a.institution||null, type:a.accountType||null, banker:a.bankerName||null,
    startingBalance:num(a.startingBalance), currentBalance:num(a.currentBalance),
    gainSinceInception:num(a.currentBalance)-num(a.startingBalance),
  }));

  const valuables=(data.valuables||[]).filter(v=>v.familyId===fid).map(v=>({
    category:v.category||null, description:v.description||null, makeModel:v.makeModel||null,
    year:v.year||null, estimatedValue:num(v.estimatedValue),
    insured:!!v.insured, insuranceCompany:v.insuranceCompany||null,
  }));

  const tasks=(data.tasks||[]).filter(t=>t.familyId===fid&&!t.done).map(t=>{
    const d=daysFromNow(t.dueDate);
    return { title:t.title||null, dueDate:t.dueDate||null, daysUntilDue:d, priority:t.priority||null,
      status:(d==null)?"open":(d<0?"overdue":(d<=30?"due_soon":"open")) };
  });

  const cashFlowEvents=(data.cash_flow_events||[]).filter(e=>e.familyId===fid).map(e=>({
    name:e.name||e.label||e.title||null, type:e.eventType||null, amount:num(e.amount),
    startDate:e.startDate||null, endDate:e.endDate||null, taxTreatment:e.taxTreatment||null,
  }));

  const documents=(data.documents||[]).filter(d=>d.familyId===fid).map(d=>({
    name:d.name||null, category:d.category||null, fileType:d.fileType||null,
    description:d.description||null, uploadedAt:d.uploadedAt||d.createdAt||null,
  }));

  const totalRE=properties.reduce((s,p)=>s+(p.currentValue||p.purchasePrice||0),0);
  const totalDebt=properties.reduce((s,p)=>s+p.loanBalance+p.secondMortgageBalance,0)
    +portfolioAccounts.filter(a=>a.type==="Line of Credit").reduce((s,a)=>s+a.currentBalance,0);
  const totalPortfolio=portfolioAccounts.filter(a=>a.type!=="Line of Credit").reduce((s,a)=>s+a.currentBalance,0);
  const totalValuables=valuables.reduce((s,v)=>s+v.estimatedValue,0);
  const netWorth=totalRE-totalDebt+totalPortfolio+totalValuables;

  // Tell the model which things are genuinely not in the data, so it answers honestly.
  const notTracked=[];
  const anyInsExp=properties.some(p=>p.insuranceExpirationDate||p.floodInsuranceExpirationDate);
  if(!anyInsExp) notTracked.push("insurance policy expiration / renewal dates (only carrier and annual premium are stored)");

  return {
    today:today.toISOString().slice(0,10),
    family:{ name:family.name||null },
    totals:{ netWorth, realEstate:totalRE, totalDebt, portfolio:totalPortfolio, valuables:totalValuables },
    counts:{ properties:properties.length, portfolioAccounts:portfolioAccounts.length, valuables:valuables.length, openTasks:tasks.length, documents:documents.length },
    properties, portfolioAccounts, valuables, tasks, cashFlowEvents, documents,
    notTracked,
  };
}

// Light formatter: preserves newlines (pre-wrap on container) and renders **bold**.
function renderRich(text){
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((p,i)=>
    (p.startsWith("**")&&p.endsWith("**"))
      ? <strong key={i}>{p.slice(2,-2)}</strong>
      : <span key={i}>{p}</span>);
}

const ASSISTANT_SUGGESTIONS=[
  "What is my current estimated net worth, and how is it broken down?",
  "Do I have any tasks overdue or due in the next 30 days?",
  "List my properties with their current value and loan balance.",
  "Which properties have flood insurance, and with which carrier?",
  "What are my total annual property insurance premiums?",
  "Which loans mature within the next 12 months?",
];

function FamilyAssistant({family,data,reload}){
  const isMobile=useIsMobile();
  // Read the family from the live data set so a rename reflects immediately
  // (the `family` prop passed by parents can be a stale snapshot).
  const fam=(data.families||[]).find(x=>x.id===family.id)||family;
  const assistantName=(fam.assistantName||"").trim()||"Titan";
  const[messages,setMessages]=useState([]); // {role:"user"|"assistant", content}
  const[input,setInput]=useState("");
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState(null);
  const[editingName,setEditingName]=useState(false);
  const[nameInput,setNameInput]=useState(assistantName);
  const[savingName,setSavingName]=useState(false);
  const[nameErr,setNameErr]=useState(null);
  const scrollRef=useRef(null);
  const snapshot=useMemo(()=>buildFamilySnapshot(family,data),[family,data]);

  const saveName=async()=>{
    const nm=(nameInput||"").trim().slice(0,40);
    if(!nm){setEditingName(false);setNameInput(assistantName);return;}
    if(nm===assistantName){setEditingName(false);return;}
    setSavingName(true);setNameErr(null);
    try{
      const{error}=await sb.from("families").update({assistant_name:nm}).eq("id",family.id);
      if(error)throw error;
      if(reload)await reload("families");
      setEditingName(false);
    }catch(e){setNameErr(e&&e.message?e.message:"Couldn't save the name.");}
    finally{setSavingName(false);}
  };

  useEffect(()=>{ if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[messages,busy]);

  const ask=async(q)=>{
    const question=((q!=null?q:input)||"").trim();
    if(!question||busy)return;
    setError(null);
    const history=messages.map(m=>({role:m.role,content:m.content}));
    setMessages(m=>[...m,{role:"user",content:question}]);
    setInput("");
    setBusy(true);
    try{
      const{data:resp,error:fnErr}=await sb.functions.invoke("family-ai-assistant",{body:{question,snapshot,history,assistantName}});
      if(fnErr)throw new Error(fnErr.message||"Could not reach the assistant.");
      if(resp&&resp.error)throw new Error(resp.error);
      setMessages(m=>[...m,{role:"assistant",content:(resp&&resp.answer)||"No response."}]);
    }catch(e){
      setError(e&&e.message?e.message:"Something went wrong reaching the assistant.");
    }finally{
      setBusy(false);
    }
  };

  const onKey=e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); ask(); } };

  return <div style={{maxWidth:820,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
      {editingName
        ? <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?22:26,color:B.navy,fontWeight:600}}>Ask</span>
            <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveName();if(e.key==="Escape"){setEditingName(false);setNameInput(assistantName);}}} maxLength={40} placeholder="Titan"
              style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?20:24,color:B.navy,fontWeight:600,border:`1px solid ${B.border}`,borderRadius:8,padding:"2px 8px",width:160,outline:"none"}}/>
            <Btn small onClick={saveName} disabled={savingName}>{savingName?"…":"Save"}</Btn>
            <button onClick={()=>{setEditingName(false);setNameInput(assistantName);}} style={{background:"none",border:"none",color:B.textSoft,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        : <>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?22:26,color:B.navy,fontWeight:600}}>Ask {assistantName}</div>
            <button onClick={()=>{setNameInput(assistantName==="Titan"?"":assistantName);setEditingName(true);}} title="Rename your assistant" style={{background:"none",border:"none",color:B.gold,fontSize:14,cursor:"pointer",padding:"2px 4px"}}>✎</button>
          </>}
      <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:B.navy,background:"rgba(206,182,132,0.22)",border:`1px solid ${B.gold}`,borderRadius:20,padding:"2px 9px"}}>Beta</span>
    </div>
    {nameErr&&<div style={{fontSize:12,color:"#8b1a1a",marginBottom:8}}>⚠ {nameErr}</div>}
    <div style={{fontSize:13,color:B.textSoft,marginBottom:16}}>
      {assistantName} answers questions about this family's dashboard — net worth, properties, loans, insurance, tasks, and documents. Answers come only from the data on file and are read-only.
    </div>

    {/* Conversation */}
    <div ref={scrollRef} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:14,boxShadow:B.shadow,padding:isMobile?16:22,minHeight:200,maxHeight:isMobile?"46vh":"52vh",overflowY:"auto",marginBottom:14}}>
      {messages.length===0&&!busy&&<div>
        <div style={{fontSize:12,fontWeight:800,color:B.textMute,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>Try asking</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {ASSISTANT_SUGGESTIONS.map(s=><button key={s} onClick={()=>ask(s)} style={{textAlign:"left",background:B.bg,border:`1px solid ${B.border}`,borderRadius:10,padding:"9px 13px",fontSize:13,color:B.navy,cursor:"pointer",fontFamily:"inherit",lineHeight:1.35}}>{s}</button>)}
        </div>
      </div>}

      {messages.map((m,i)=>m.role==="user"
        ? <div key={i} style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <div style={{background:B.navy,color:B.white,borderRadius:"14px 14px 4px 14px",padding:"10px 14px",fontSize:14,maxWidth:"82%",lineHeight:1.45}}>{m.content}</div>
          </div>
        : <div key={i} style={{display:"flex",gap:10,marginBottom:14,alignItems:"flex-start"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${B.navy},${B.navyMid})`,color:B.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:1}}>✦</div>
            <div style={{background:B.bg,border:`1px solid ${B.borderLight}`,borderRadius:"14px 14px 14px 4px",padding:"11px 15px",fontSize:14,color:B.text,maxWidth:"88%",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{renderRich(m.content)}</div>
          </div>)}

      {busy&&<div style={{display:"flex",gap:10,alignItems:"center",color:B.textSoft,fontSize:13}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${B.navy},${B.navyMid})`,color:B.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>✦</div>
        <span style={{fontStyle:"italic"}}>Reviewing the dashboard…</span>
      </div>}
    </div>

    {error&&<div style={{background:"#fde8e8",border:"1px solid #f5c6c6",color:"#8b1a1a",borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:12}}>⚠ {error}</div>}

    {/* Input */}
    <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
      <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask about net worth, a property, a loan, insurance, tasks…" rows={2}
        style={{flex:1,resize:"none",border:`1px solid ${B.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,fontFamily:"inherit",color:B.text,background:B.white,outline:"none",lineHeight:1.4}}/>
      <Btn onClick={()=>ask()} disabled={busy||!input.trim()}>{busy?"…":"Ask"}</Btn>
    </div>
    <div style={{fontSize:11,color:B.textMute,marginTop:8,lineHeight:1.4}}>
      Answers are generated from your dashboard data and may not reflect changes made elsewhere. Not financial, tax, or legal advice — verify important figures with your advisor.
    </div>
  </div>;
}

function FamilyDashboard({family,data,reload,toast,onBack}){
  const isMobile=useIsMobile();
  const[activeTab,setActiveTab]=useState("overview");
  const[reportOpen,setReportOpen]=useState(false);
  const[modal,setModal]=useState(null);
  const[editM,setEditM]=useState(null);

  const contacts=data.contacts.filter(c=>c.familyId===family.id);
  const properties=data.properties.filter(p=>p.familyId===family.id);
  const deals=data.deals.filter(d=>d.familyId===family.id);
  const openDeals=deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won");
  const famNotes=data.notes.filter(n=>n.familyId===family.id);
  const noteAttachments=data.note_attachments||[];
  const famTasks=data.tasks.filter(t=>t.familyId===family.id);
  const pendingTasks=famTasks.filter(t=>!t.done);
  const accounts=(data.portfolio_accounts||[]).filter(a=>a.familyId===family.id);
  const valuables=(data.valuables||[]).filter(v=>v.familyId===family.id);

  const totalRE=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0)+(Number(p.secondMortgageBalance)||0),0)+accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalAccounts=accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalValuables=valuables.reduce((s,v)=>s+(Number(v.estimatedValue)||0),0);
  const netWorth=totalRE-totalDebt+totalAccounts+totalValuables;
  const overdueTasks=pendingTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const soonTasks=pendingTasks.filter(t=>t.dueDate&&!overdueTasks.includes(t)&&(new Date(t.dueDate)-new Date())/(86400000)<=30);

  const TABS=["Overview","Properties","Portfolio","Cash Flow","Valuables","Deals","Notes","Tasks","Documents","Ask Titan"];
  const assistantName=(((data.families||[]).find(x=>x.id===family.id)||family).assistantName||"").trim()||"Titan";

  // Quick add note (with optional file attachments)
  const[noteBody,setNoteBody]=useState("");
  // pendingNoteFiles: array of {file, category}
  const[pendingNoteFiles,setPendingNoteFiles]=useState([]);
  const[noteAttachingId,setNoteAttachingId]=useState(null); // existing note ID we're attaching to
  // Upload a single file as an attachment to a given note
  const uploadNoteAttachment=async(noteId,file,category)=>{
    const ext=file.name.split(".").pop();
    const path=`note-attachments/${family.id}/${Date.now()}_${Math.random().toString(36).slice(2,8)}_${file.name.replace(/\s+/g,"_")}`;
    const{error:uploadError}=await sb.storage.from("documents").upload(path,file,{upsert:false});
    if(uploadError)throw new Error(uploadError.message);
    const{error:dbError}=await sb.from("note_attachments").insert({note_id:noteId,name:file.name,category:category||"General",file_path:path,file_size:file.size,file_type:file.type||ext});
    if(dbError)throw new Error(dbError.message);
  };
  const addNote=async()=>{
    if(!noteBody.trim())return;
    const{data,error}=await sb.from("notes").insert({body:noteBody,family_id:family.id,contact_id:null}).select().single();
    if(error){toast(error.message,"error");return;}
    // Upload any pending attachments
    if(pendingNoteFiles.length>0&&data){
      try{
        for(const pf of pendingNoteFiles){await uploadNoteAttachment(data.id,pf.file,pf.category);}
        toast(`Note added with ${pendingNoteFiles.length} attachment${pendingNoteFiles.length>1?"s":""}`);
      }catch(e){toast("Note saved but attachment failed: "+e.message,"error");}
    }else{
      toast("Note added");
    }
    setNoteBody("");setPendingNoteFiles([]);
    reload("notes");reload("note_attachments");
  };
  // Download a note attachment via signed URL
  const downloadNoteAttachment=async(att)=>{
    const{data,error}=await sb.storage.from("documents").createSignedUrl(att.filePath,300,{download:att.name||true});
    if(error){toast(error.message,"error");return;}
    const a=document.createElement("a");a.href=data.signedUrl;a.download=att.name||"file";document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  // Delete a note attachment (file + DB row)
  const delNoteAttachment=async(att)=>{
    await sb.storage.from("documents").remove([att.filePath]);
    const{error}=await sb.from("note_attachments").delete().eq("id",att.id);
    if(error)toast(error.message,"error");else{toast("Attachment removed");reload("note_attachments");}
  };
  // Attach a file to an existing note (with category)
  const attachToExistingNote=async(noteId,file,category)=>{
    try{
      await uploadNoteAttachment(noteId,file,category);
      toast("File attached");
      reload("note_attachments");
    }catch(e){toast(e.message,"error");}
  };

  // Quick add task
  const addTask=async(f)=>{
    const{error}=await sb.from("tasks").insert({family_id:family.id,contact_id:f.contactId||null,title:f.title,due_date:f.dueDate||null,priority:f.priority,reminder_days:f.reminderDays||7,done:false,recurrence:f.recurrence||null,recurrence_interval:f.recurrence==="Custom"?(Number(f.recurrenceInterval)||1):null,recurrence_unit:f.recurrence==="Custom"?(f.recurrenceUnit||"week"):null});
    if(error)toast(error.message,"error");else{toast("Task added");reload("tasks");}
  };
  const toggleTask=async(t)=>{
    const{error}=await sb.from("tasks").update({done:!t.done}).eq("id",t.id);
    if(error){toast(error.message,"error");return;}
    if(!t.done&&t.recurrence){
      const nd=nextRecurrence(t.dueDate,t.recurrence,t.recurrenceInterval,t.recurrenceUnit);
      if(nd){await sb.from("tasks").insert({family_id:t.familyId||family.id,contact_id:t.contactId||null,title:t.title,due_date:nd,priority:t.priority,reminder_days:t.reminderDays||7,done:false,recurrence:t.recurrence,recurrence_interval:t.recurrence==="Custom"?(t.recurrenceInterval||1):null,recurrence_unit:t.recurrence==="Custom"?(t.recurrenceUnit||"week"):null});toast("Next occurrence: "+fmt(nd));}
    }
    reload("tasks");
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
    const{error}=await sb.from("contacts").insert({family_id:family.id,name:f.name,email:f.email||null,phone:f.phone||null,company:f.company||null,type:f.type||"Individual",dob:f.dob||null,address:f.address||null,tags:null});
    if(error)toast(error.message,"error");else{toast("Member added");reload("contacts");}
  };
  const delMember=async(id)=>{
    const{error}=await sb.from("contacts").delete().eq("id",id);
    if(error)toast(error.message,"error");else{toast("Member removed");reload("contacts");}
  };
  const editMember=async(f)=>{
    const{error}=await sb.from("contacts").update({name:f.name,email:f.email||null,phone:f.phone||null,company:f.company||null,type:f.type||"Individual",dob:f.dob||null,address:f.address||null}).eq("id",editM.id);
    if(error)toast(error.message,"error");else{toast("Member updated");reload("contacts");}
  };
  // Add property
  const addProperty=async(f)=>{
    const row={family_id:family.id,owner_name:f.ownerName||null,address:f.address,property_type:f.propertyType,purchase_price:f.purchasePrice||null,purchase_date:f.purchaseDate||null,current_value:f.currentValue||null,lender:f.lender||null,loan_balance:f.loanBalance||null,interest_rate:f.interestRate||null,loan_payment:f.loanPayment||null,loan_maturity_date:f.loanMaturityDate||null,loan_type:f.loanType,rental_income:f.rentalIncome||null,property_taxes:f.propertyTaxes||null,utilities:f.utilities||null,insurance_company:f.insuranceCompany||null,insurance_premium:f.insurancePremium||null,insurance_expiration:f.insuranceExpiration||null,flood_insurance:!!f.floodInsurance,flood_insurance_company:f.floodInsuranceCompany||null,flood_insurance_premium:f.floodInsurancePremium||null,flood_insurance_expiration:f.floodInsuranceExpiration||null,hoa_fee:Number(f.hoaFee)||0,property_management_fee_pct:Number(f.propertyManagementFeePct)||0,include_mortgage_in_cashflow:f.includeMortgageInCashflow!==false,second_mortgage_balance:f.secondMortgageBalance||null,second_mortgage_payment:f.secondMortgagePayment||null,notes:f.notes||null};
    const{error}=await sb.from("properties").insert(row);
    if(error)toast(error.message,"error");else{toast("Property added");reload("properties");}
  };
  const editProperty=async(id,f)=>{
    const row={owner_name:f.ownerName||null,address:f.address,property_type:f.propertyType,purchase_price:f.purchasePrice||null,purchase_date:f.purchaseDate||null,current_value:f.currentValue||null,lender:f.lender||null,loan_balance:f.loanBalance||null,interest_rate:f.interestRate||null,loan_payment:f.loanPayment||null,loan_maturity_date:f.loanMaturityDate||null,loan_type:f.loanType,rental_income:f.rentalIncome||null,property_taxes:f.propertyTaxes||null,utilities:f.utilities||null,insurance_company:f.insuranceCompany||null,insurance_premium:f.insurancePremium||null,insurance_expiration:f.insuranceExpiration||null,flood_insurance:!!f.floodInsurance,flood_insurance_company:f.floodInsuranceCompany||null,flood_insurance_premium:f.floodInsurancePremium||null,flood_insurance_expiration:f.floodInsuranceExpiration||null,hoa_fee:Number(f.hoaFee)||0,property_management_fee_pct:Number(f.propertyManagementFeePct)||0,include_mortgage_in_cashflow:f.includeMortgageInCashflow!==false,second_mortgage_balance:f.secondMortgageBalance||null,second_mortgage_payment:f.secondMortgagePayment||null,notes:f.notes||null};
    const{error}=await sb.from("properties").update(row).eq("id",id);
    if(error)toast(error.message,"error");else{toast("Property updated");reload("properties");}
  };
  const delProperty=async(id)=>{
    const{error}=await sb.from("properties").delete().eq("id",id);
    if(error)toast(error.message,"error");else reload("properties");
  };
  // Order within a type section: saved sort_order first (unset goes last), then by creation date.
  const propBySort=(a,b)=>((Number.isFinite(Number(a.sortOrder))?Number(a.sortOrder):1e9)-(Number.isFinite(Number(b.sortOrder))?Number(b.sortOrder):1e9))||(new Date(a.createdAt||0)-new Date(b.createdAt||0));
  const moveProperty=async(p,dir)=>{
    const section=properties.filter(x=>x.propertyType===p.propertyType).sort(propBySort);
    const idx=section.findIndex(x=>x.id===p.id);
    const swap=dir==="up"?idx-1:idx+1;
    if(swap<0||swap>=section.length)return;
    const reordered=[...section];[reordered[idx],reordered[swap]]=[reordered[swap],reordered[idx]];
    const results=await Promise.all(reordered.map((x,i)=>sb.from("properties").update({sort_order:i}).eq("id",x.id)));
    if(results.some(r=>r.error))toast("Reorder couldn't be saved — the properties table needs a sort_order column.","error");
    reload("properties");
  };

  // Add valuable
  const addValuable=async(f)=>{
    const{error}=await sb.from("valuables").insert({family_id:family.id,category:f.category,description:f.description,make_model:f.makeModel||null,year:f.year||null,estimated_value:f.estimatedValue||null,insured:!!f.insured,insurance_company:f.insuranceCompany||null,notes:f.notes||null});
    if(error)toast(error.message,"error");else{toast("Valuable added");reload("valuables");}
  };
  const editValuable=async(id,f)=>{
    const{error}=await sb.from("valuables").update({category:f.category,description:f.description,make_model:f.makeModel||null,year:f.year||null,estimated_value:f.estimatedValue||null,insured:!!f.insured,insurance_company:f.insuranceCompany||null,notes:f.notes||null}).eq("id",id);
    if(error)toast(error.message,"error");else{toast("Valuable updated");reload("valuables");}
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
      <div style={{padding:isMobile?"12px 16px":"14px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",alignItems:"center",gap:isMobile?10:16,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textSoft,cursor:"pointer",fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:6,flexShrink:0}}>←</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?18:22,color:B.navy,fontWeight:600,lineHeight:1.1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{family.name}</div>
          {!isMobile&&<div style={{fontSize:12,color:B.textSoft,marginTop:2}}>Advisor: {family.advisorName||"—"}{family.advisorEmail?` · ${family.advisorEmail}`:""}</div>}
          {isMobile&&family.advisorName&&<div style={{fontSize:11,color:B.textSoft,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{family.advisorName}</div>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {overdueTasks.length>0&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>{overdueTasks.length} overdue</Badge>}
          {soonTasks.length>0&&<Badge scheme={{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"}}>{soonTasks.length} due soon</Badge>}
          <Btn variant="gold" small={isMobile} onClick={()=>setReportOpen(true)}>🖨{!isMobile&&" Print Report"}</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{borderBottom:`1px solid ${B.borderLight}`,background:B.white,padding:isMobile?"0 8px":"0 28px",display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {TABS.map(t=><button key={t} onClick={()=>setActiveTab(t.toLowerCase().replace(/\s+/g,""))} style={{background:"none",border:"none",borderBottom:activeTab===t.toLowerCase().replace(/\s+/g,"")?`2px solid ${B.gold}`:"2px solid transparent",color:activeTab===t.toLowerCase().replace(/\s+/g,"")?B.navy:B.textSoft,fontFamily:"inherit",fontSize:13,fontWeight:activeTab===t.toLowerCase().replace(/\s+/g,"")?700:400,padding:isMobile?"12px 12px":"10px 14px",cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap",flexShrink:0}}>{t==="Ask Titan"?("Ask "+assistantName):t}</button>)}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>

        {/* OVERVIEW TAB */}
        {activeTab==="overview"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
            <StatBox label="Net Worth Est." value={fmtMoney(netWorth)} accent={B.navy}/>
            <StatBox label="Real Estate" value={fmtMoney(totalRE)} accent={B.gold}/>
            <StatBox label="Portfolio" value={fmtMoney(totalAccounts)} accent={B.navyMid}/>
            <StatBox label="Valuables" value={fmtMoney(totalValuables)} accent="#8b5cf6"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,marginBottom:20}}>
            {/* Members */}
            <div style={{background:B.white,borderRadius:12,padding:20,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Members</div>
                <Btn small onClick={()=>{setEditM(null);setModal("member");}}>+ Add</Btn>
              </div>
              <GoldLine/>
              {contacts.length===0?<Empty text="No members yet — add the first one"/>:contacts.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                <div>
                  <div style={{fontWeight:600,color:B.navy,fontSize:13}}>{c.name}{c.dob&&(()=>{const d=new Date(c.dob);if(isNaN(d))return null;const t=new Date();let a=t.getFullYear()-d.getFullYear();const m=t.getMonth()-d.getMonth();if(m<0||(m===0&&t.getDate()<d.getDate()))a--;return a>=0?<span style={{fontWeight:400,color:B.textSoft,fontSize:11,marginLeft:6}}>· {a} yrs</span>:null;})()}</div>
                  <div style={{fontSize:11,color:B.textSoft,marginTop:2,display:"flex",gap:10}}>
                    {c.email&&<span>✉ {c.email}</span>}
                    {c.phone&&<span>📞 {c.phone}</span>}
                  </div>
                  {c.company&&<div style={{fontSize:11,color:B.textSoft}}>{c.company}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
                  <button onClick={()=>{setEditM(c);setModal("member");}} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:13}} title="Edit member">✎</button>
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
        {activeTab==="properties"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:13,color:B.textSoft}}>{properties.length} properties · {fmtMoney(totalRE)} total · {fmtMoney(totalDebt)} debt</div>
            <Btn onClick={()=>setModal("property")}>+ Add Property</Btn>
          </div>
          {properties.length===0?<Empty text="No properties yet. Add the first one."/>:(()=>{
            const groups=[...PROP_TYPES,"Other"].map(type=>({type,list:properties.filter(p=>type==="Other"?!PROP_TYPES.includes(p.propertyType):p.propertyType===type).sort(propBySort)})).filter(g=>g.list.length>0);
            const card=(p,section,i)=><div key={p.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${B.gold}`,borderRadius:12,padding:20,marginBottom:14,boxShadow:B.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <button onClick={()=>moveProperty(p,"up")} disabled={i===0} style={{cursor:i===0?"default":"pointer",opacity:i===0?0.3:1,background:B.bg,border:`1px solid ${B.border}`,borderRadius:5,width:24,height:20,fontSize:11,color:B.navy,lineHeight:1,fontFamily:"inherit"}}>↑</button>
                    <button onClick={()=>moveProperty(p,"down")} disabled={i===section.length-1} style={{cursor:i===section.length-1?"default":"pointer",opacity:i===section.length-1?0.3:1,background:B.bg,border:`1px solid ${B.border}`,borderRadius:5,width:24,height:20,fontSize:11,color:B.navy,lineHeight:1,fontFamily:"inherit"}}>↓</button>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>{p.address}</div>
                    {p.ownerName&&<div style={{fontSize:12,color:B.textSoft,marginTop:2}}>{p.ownerName}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:700,color:B.navy}}>{fmtMoney(p.currentValue||p.purchasePrice)}</div>
                    {p.loanBalance&&<div style={{fontSize:11,color:B.textSoft}}>Balance: {fmtMoney(p.loanBalance)}</div>}
                  </div>
                  <Btn small variant="ghost" onClick={()=>window.open(`https://www.zillow.com/homes/${encodeURIComponent(p.address||"")}_rb/`,"_blank","noopener,noreferrer")}>🔗 Zillow</Btn>
                  <Btn small variant="ghost" onClick={()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(`"${p.address||""}" property tax records`)}`,"_blank","noopener,noreferrer")}>🏛 Tax Records</Btn>
                  <Btn small variant="ghost" onClick={()=>setModal({type:"editProperty",property:p})}>Edit</Btn>
                  <Btn small variant="danger" onClick={()=>delProperty(p.id)}>✕</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                {[["Type",p.propertyType],["Purchase Price",fmtMoney(p.purchasePrice)],["Purchase Date",fmt(p.purchaseDate)],["Lender",p.lender||"—"],["Loan Type",p.loanType],["Interest Rate",fmtPct(p.interestRate)],["Monthly Payment",fmtMoney(p.loanPayment)],...(Number(p.secondMortgageBalance)>0?[["2nd Mtg Balance",fmtMoney(p.secondMortgageBalance)],["2nd Mtg Payment",p.secondMortgagePayment?`${fmtMoney(p.secondMortgagePayment)}/mo`:"—"]]:[]),["Loan Maturity",fmt(p.loanMaturityDate)],["Rental Income",p.rentalIncome?`${fmtMoney(p.rentalIncome)}/mo`:"—"],["Property Taxes",p.propertyTaxes?`${fmtMoney(p.propertyTaxes)}/yr`:"—"],["Utilities",p.utilities?`${fmtMoney(p.utilities)}/mo`:"—"],["Insurance Co.",p.insuranceCompany||"—"],["Ins. Premium",p.insurancePremium?`${fmtMoney(p.insurancePremium)}/yr`:"—"],["Flood Insurance",p.floodInsurance?`Yes${p.floodInsuranceCompany?` — ${p.floodInsuranceCompany}`:""}`:("No")]].map(([l,v])=><div key={l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,color:B.text,fontWeight:600}}>{v}</div>
                </div>)}
              </div>
              {p.notes&&<div style={{marginTop:12,fontSize:13,color:B.textSoft,fontStyle:"italic"}}>{p.notes}</div>}
            </div>;
            return groups.map(g=><div key={g.type} style={{marginBottom:22}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${B.gold}`}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:B.navy,fontWeight:700}}>{g.type}</div>
                <div style={{background:B.navy,color:B.white,borderRadius:20,minWidth:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,padding:"0 7px"}}>{g.list.length}</div>
                <div style={{fontSize:12,color:B.textSoft,marginLeft:"auto"}}>{fmtMoney(g.list.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0))}</div>
              </div>
              {g.list.map((p,i)=>card(p,g.list,i))}
            </div>);
          })()}
        </div>}

        {/* PORTFOLIO TAB */}
        {activeTab==="portfolio"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
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

        {/* CASH FLOW TAB */}
        {activeTab==="cashflow"&&<CashFlowView family={family} events={(data.cash_flow_events||[]).filter(e=>e.familyId===family.id)} properties={properties} reload={reload} toast={toast}/>}

        {/* VALUABLES TAB */}
        {activeTab==="valuables"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
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
                  <Btn small variant="ghost" onClick={()=>setModal({type:"editValuable",valuable:v})}>Edit</Btn>
                  <Btn small variant="danger" onClick={()=>delValuable(v.id)}>✕</Btn>
                </div>
              </div>)}
            </div>;
          })}
          {valuables.length===0&&<Empty text="No valuables recorded yet."/>}
        </div>}

        {/* DEALS TAB */}
        {activeTab==="deals"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
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
          <div style={{padding:isMobile?"14px 14px":"20px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
            <div style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}>
              <textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Write a note or activity log entry…" style={{width:"100%",minHeight:80,background:"transparent",border:"none",padding:"14px 16px",color:B.text,fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}/>
              {/* Pending files preview */}
              {pendingNoteFiles.length>0&&<div style={{padding:"8px 14px",borderTop:`1px solid ${B.borderLight}`,background:"#f9f7f3"}}>
                <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Attachments ({pendingNoteFiles.length})</div>
                {pendingNoteFiles.map((pf,idx)=><div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:idx===pendingNoteFiles.length-1?"none":`1px solid ${B.borderLight}`,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,color:B.navy,fontWeight:600,flex:"1 1 200px",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {pf.file.name}</span>
                  <span style={{fontSize:11,color:B.textSoft}}>{(pf.file.size/1024).toFixed(1)}KB</span>
                  <select value={pf.category} onChange={e=>{const next=[...pendingNoteFiles];next[idx]={...next[idx],category:e.target.value};setPendingNoteFiles(next);}} style={{...inp,padding:"4px 8px",fontSize:12,width:"auto",height:"auto"}}>
                    {DOC_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <button onClick={()=>setPendingNoteFiles(pendingNoteFiles.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}}>✕</button>
                </div>)}
              </div>}
              <div style={{padding:"10px 14px",borderTop:`1px solid ${B.borderLight}`,background:B.white,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,cursor:"pointer",fontSize:12,color:B.navy,fontWeight:600}}>
                  📎 Attach file(s)
                  <input type="file" multiple onChange={e=>{
                    const files=Array.from(e.target.files||[]);
                    if(files.length===0)return;
                    setPendingNoteFiles([...pendingNoteFiles,...files.map(f=>({file:f,category:"General"}))]);
                    e.target.value="";
                  }} style={{display:"none"}}/>
                </label>
                <Btn onClick={addNote} disabled={!noteBody.trim()}>Log Note{pendingNoteFiles.length>0?` + ${pendingNoteFiles.length} file${pendingNoteFiles.length>1?"s":""}`:""}</Btn>
              </div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px":"20px 28px"}}>
            {famNotes.length===0?<Empty text="No notes yet."/>:[...famNotes].sort((a,b)=>b.createdAt>a.createdAt?1:-1).map(n=>{
              const atts=noteAttachments.filter(a=>a.noteId===n.id);
              return <div key={n.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,marginBottom:12,boxShadow:B.shadow,overflow:"hidden"}}>
                <div style={{height:3,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`}}/>
                <div style={{padding:"16px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8}}>
                    <p style={{margin:0,color:B.text,fontSize:14,lineHeight:1.7,flex:1,whiteSpace:"pre-wrap"}}>{n.body}</p>
                    <button onClick={()=>delNote(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
                  </div>
                  {/* Attachments list */}
                  {atts.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${B.borderLight}`}}>
                    {atts.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",flexWrap:"wrap"}}>
                      <span style={{fontSize:13,color:B.navy,fontWeight:600,flex:"1 1 200px",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {a.name}</span>
                      <Badge scheme={{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}}>{a.category}</Badge>
                      {a.fileSize&&<span style={{fontSize:10,color:B.textSoft}}>{(a.fileSize/1024).toFixed(1)}KB</span>}
                      <button onClick={()=>downloadNoteAttachment(a)} style={{background:"none",border:`1px solid ${B.border}`,color:B.navy,cursor:"pointer",fontSize:11,padding:"3px 10px",borderRadius:6,fontFamily:"inherit"}}>↓ Download</button>
                      <button onClick={()=>{if(confirm("Remove this attachment?"))delNoteAttachment(a);}} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:13}}>✕</button>
                    </div>)}
                  </div>}
                  {/* Meta row + add-attachment button */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:11,color:B.textMute}}>🕐 {fmt(n.createdAt)}</div>
                    <label style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",background:"transparent",border:`1px dashed ${B.border}`,borderRadius:6,cursor:"pointer",fontSize:11,color:B.textSoft}}>
                      📎 Add file
                      <input type="file" onChange={e=>{
                        const file=e.target.files&&e.target.files[0];
                        if(!file)return;
                        const category=prompt("Category for this file?\n\nOptions: "+DOC_CATEGORIES.join(", "),"General");
                        if(!category){e.target.value="";return;}
                        // Sanitize: ensure it's a known category, else default to "General"
                        const cat=DOC_CATEGORIES.includes(category)?category:"General";
                        attachToExistingNote(n.id,file,cat);
                        e.target.value="";
                      }} style={{display:"none"}}/>
                    </label>
                  </div>
                </div>
              </div>;
            })}
          </div>
        </div>}

        {/* TASKS TAB */}
        {activeTab==="tasks"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
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

      {activeTab==="asktitan"&&<div style={{padding:isMobile?"16px 14px":"24px 28px"}}>
        <FamilyAssistant family={family} data={data} reload={reload}/>
      </div>}

      {/* Modals */}
      {modal==="member"&&<Modal title={editM?"Edit Member":"Add Member"} onClose={()=>{setModal(null);setEditM(null);}}>
        <MemberForm initial={editM?{name:editM.name||"",email:editM.email||"",phone:editM.phone||"",company:editM.company||"",type:editM.type||"Individual",dob:editM.dob||"",address:editM.address||""}:null} onSave={async f=>{editM?await editMember(f):await addMember(f);setModal(null);setEditM(null);}} onClose={()=>{setModal(null);setEditM(null);}}/>
      </Modal>}
      {modal==="task"&&<Modal title="New Task" onClose={()=>setModal(null)}><TaskForm contacts={contacts} onSave={async f=>{await addTask(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="property"&&<Modal title="Add Property" onClose={()=>setModal(null)} wide><PropertyForm canExtract={true} onSave={async f=>{await addProperty(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal&&modal.type==="editProperty"&&<Modal title="Edit Property" onClose={()=>setModal(null)} wide><PropertyForm initial={modal.property} canExtract={true} onSave={async f=>{await editProperty(modal.property.id,f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="valuable"&&<Modal title="Add Valuable" onClose={()=>setModal(null)}><ValuableForm onSave={async f=>{await addValuable(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal&&modal.type==="editValuable"&&<Modal title="Edit Valuable" onClose={()=>setModal(null)}><ValuableForm initial={modal.valuable} onSave={async f=>{await editValuable(modal.valuable.id,f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="deal"&&<Modal title="Add Deal" onClose={()=>setModal(null)}><SimpleDealForm contacts={contacts} onSave={async f=>{await addDeal(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal==="account"&&<Modal title="Add Portfolio Account" onClose={()=>setModal(null)}><AccountForm onSave={async f=>{await addAccount(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {modal&&modal.type==="editAccount"&&<Modal title="Edit Portfolio Account" onClose={()=>setModal(null)}><AccountForm initial={modal.account} onSave={async f=>{await editAccount(modal.account.id,f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
      {reportOpen&&<FamilyReport family={family} data={data} onClose={()=>setReportOpen(false)}/>}
    </div>
  );
}

// ── MEMBER FORM ───────────────────────────────────────────────────────────────
function MemberForm({initial,onSave,onClose}){
  const[f,setF]=useState(initial||{name:"",email:"",phone:"",company:"",type:"Individual",dob:"",address:""});
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
    <Grid2>
      <Field label="Date of Birth"><Inp type="date" value={f.dob||""} onChange={set("dob")}/></Field>
      <Field label="Address"><Inp placeholder="123 Main St, Tampa, FL" value={f.address||""} onChange={set("address")}/></Field>
    </Grid2>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":initial?"Save Changes":"Add Member"}</Btn>
    </div>
  </div>;
}

// ── TASK FORM (with reminder) ─────────────────────────────────────────────────
// Compute the next due date for a recurring task. Returns YYYY-MM-DD or null.
function nextRecurrence(dateStr,recurrence,interval,unit){
  if(!recurrence)return null;
  const base=dateStr?new Date(dateStr+"T00:00:00"):new Date();
  if(isNaN(base))return null;
  let n=1,u="day";
  if(recurrence==="Daily")u="day";
  else if(recurrence==="Weekly")u="week";
  else if(recurrence==="Monthly")u="month";
  else if(recurrence==="Annual")u="year";
  else if(recurrence==="Custom"){n=Math.max(1,Number(interval)||1);u=unit||"week";}
  else return null;
  const d=new Date(base);
  if(u==="day")d.setDate(d.getDate()+n);
  else if(u==="week")d.setDate(d.getDate()+7*n);
  else if(u==="month")d.setMonth(d.getMonth()+n);
  else if(u==="year")d.setFullYear(d.getFullYear()+n);
  const p=x=>String(x).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
const RECUR_OPTS=["Daily","Weekly","Monthly","Annual","Custom"];
const recurLabel=t=>!t.recurrence?"":(t.recurrence==="Custom"?`Every ${t.recurrenceInterval||1} ${(t.recurrenceUnit||"week")}${(t.recurrenceInterval||1)>1?"s":""}`:t.recurrence);

function RecurrenceField({f,setF}){
  return <Field label="Repeat">
    <Sel value={f.recurrence||""} onChange={e=>setF(p=>({...p,recurrence:e.target.value}))}>
      <option value="">Does not repeat</option>
      {RECUR_OPTS.map(o=><option key={o} value={o}>{o}</option>)}
    </Sel>
    {f.recurrence==="Custom"&&<div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
      <span style={{fontSize:13,color:B.textSoft}}>Every</span>
      <input type="number" min={1} value={f.recurrenceInterval||1} onChange={e=>setF(p=>({...p,recurrenceInterval:Math.max(1,Number(e.target.value)||1)}))} style={{width:70,padding:"8px 10px",borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:"'DM Sans',sans-serif"}}/>
      <Sel value={f.recurrenceUnit||"week"} onChange={e=>setF(p=>({...p,recurrenceUnit:e.target.value}))}>
        <option value="day">day(s)</option>
        <option value="week">week(s)</option>
        <option value="month">month(s)</option>
        <option value="year">year(s)</option>
      </Sel>
    </div>}
  </Field>;
}

function TaskForm({initial,contacts=[],onSave,onClose}){
  const[f,setF]=useState(initial||{title:"",contactId:"",dueDate:"",priority:"Medium",reminderDays:7,done:false,recurrence:"",recurrenceInterval:1,recurrenceUnit:"week"});
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
    <RecurrenceField f={f} setF={setF}/>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Task"}</Btn>
    </div>
  </div>;
}

// ── PROPERTY FORM ─────────────────────────────────────────────────────────────
function PropertyForm({initial,onSave,onClose,canExtract=false}){
  const blank={ownerName:"",address:"",propertyType:"Residential",purchasePrice:"",purchaseDate:"",currentValue:"",lender:"",loanBalance:"",interestRate:"",loanPayment:"",loanMaturityDate:"",loanType:"Fixed",secondMortgageBalance:"",secondMortgagePayment:"",rentalIncome:"",propertyTaxes:"",utilities:"",insuranceCompany:"",insurancePremium:"",insuranceExpiration:"",floodInsurance:false,floodInsuranceCompany:"",floodInsurancePremium:"",floodInsuranceExpiration:"",hoaFee:"",propertyManagementFeePct:"",includeMortgageInCashflow:true,notes:""};
  const[f,setF]=useState(()=>{
    // Merge initial with defaults to ensure new fields have sensible values
    return initial?{...blank,...initial,includeMortgageInCashflow:initial.includeMortgageInCashflow!==false}:blank;
  });
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const setChk=k=>e=>setF(p=>({...p,[k]:e.target.checked}));
  const save=async()=>{if(!f.address.trim())return;setSaving(true);await onSave(f);onClose();};
  const[extracting,setExtracting]=useState(false);
  const[extractMsg,setExtractMsg]=useState(null); // {type:"success"|"error", text}
  const fileRef=useRef(null);
  const FILLABLE=["ownerName","address","propertyType","purchasePrice","purchaseDate","currentValue","lender","loanBalance","interestRate","loanPayment","loanMaturityDate","loanType","secondMortgageBalance","secondMortgagePayment","rentalIncome","propertyTaxes","insuranceCompany","insurancePremium","insuranceExpiration","floodInsuranceCompany","floodInsurancePremium","floodInsuranceExpiration"];
  const handleExtract=async(file)=>{
    if(!file)return;
    const okTypes=["application/pdf","image/png","image/jpeg","image/jpg","image/webp"];
    if(!okTypes.includes(file.type)){setExtractMsg({type:"error",text:"Please upload a PDF, PNG, JPG, or WebP file."});if(fileRef.current)fileRef.current.value="";return;}
    if(file.size>15*1024*1024){setExtractMsg({type:"error",text:"File is too large (max 15 MB)."});if(fileRef.current)fileRef.current.value="";return;}
    setExtracting(true);setExtractMsg(null);
    try{
      const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=()=>rej(new Error("Could not read file."));r.readAsDataURL(file);});
      const mediaType=file.type==="image/jpg"?"image/jpeg":file.type;
      const{data:resp,error}=await sb.functions.invoke("extract-property-fields",{body:{fileBase64:base64,mediaType,fileName:file.name}});
      if(error)throw new Error(error.message||"Extraction failed.");
      if(resp&&resp.error)throw new Error(resp.error);
      const fields=(resp&&resp.fields)||{};
      const applied=[];
      setF(prev=>{const next={...prev};FILLABLE.forEach(k=>{const v=fields[k];if(v!==undefined&&v!==null&&String(v).trim()!==""){next[k]=v;applied.push(k);if((k==="floodInsuranceCompany"||k==="floodInsurancePremium"||k==="floodInsuranceExpiration"))next.floodInsurance=true;}});return next;});
      setExtractMsg(applied.length?{type:"success",text:`Filled ${applied.length} field${applied.length>1?"s":""} from the document. Review every value before saving — extracted figures can be misread.`}:{type:"error",text:"No matching property fields were found in that document."});
    }catch(e){setExtractMsg({type:"error",text:e&&e.message?e.message:"Extraction failed."});}
    finally{setExtracting(false);if(fileRef.current)fileRef.current.value="";}
  };
  // Calculate net rental for preview
  const grossRental=Number(f.rentalIncome)||0;
  const taxesM=(Number(f.propertyTaxes)||0)/12;
  const insM=(Number(f.insurancePremium)||0)/12;
  const floodM=(Number(f.floodInsurancePremium)||0)/12;
  const hoaM=Number(f.hoaFee)||0;
  const pmM=grossRental*((Number(f.propertyManagementFeePct)||0)/100);
  const mortgageM=f.includeMortgageInCashflow?((Number(f.loanPayment)||0)+(Number(f.secondMortgagePayment)||0)):0;
  const netRental=grossRental-taxesM-insM-floodM-hoaM-pmM-mortgageM;
  return <div style={{maxHeight:"70vh",overflowY:"auto",paddingRight:4}}>
    {canExtract&&<><input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style={{display:"none"}} onChange={e=>handleExtract(e.target.files&&e.target.files[0])}/>
    <div style={{background:"linear-gradient(135deg,rgba(9,43,73,0.04),rgba(206,182,132,0.10))",border:`1px dashed ${B.gold}`,borderRadius:10,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{fontSize:20}}>✦</div>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontSize:13,fontWeight:700,color:B.navy}}>Auto-fill from a document</div>
        <div style={{fontSize:11,color:B.textSoft,lineHeight:1.4}}>Upload an insurance declaration, mortgage statement, or closing document and AI will pre-fill the fields below for your review.</div>
      </div>
      <Btn small variant="ghost" onClick={()=>fileRef.current&&fileRef.current.click()} disabled={extracting}>{extracting?"Reading…":"Upload document"}</Btn>
    </div>
    {extractMsg&&<div style={{background:extractMsg.type==="success"?"#e0f5e9":"#fde8e8",border:`1px solid ${extractMsg.type==="success"?"#2e9e57":"#d43030"}`,color:extractMsg.type==="success"?"#0d5c2b":"#8b1a1a",borderRadius:8,padding:"10px 13px",fontSize:12,marginBottom:14,lineHeight:1.4}}>{extractMsg.type==="success"?"✓ ":"⚠ "}{extractMsg.text}</div>}</>}
    <Grid2><Field label="Owner / LLC"><Inp placeholder="Smith Holdings LLC" value={f.ownerName||""} onChange={set("ownerName")}/></Field><Field label="Property Type"><Sel value={f.propertyType} onChange={set("propertyType")}>{PROP_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field></Grid2>
    <Field label="Address"><Inp placeholder="123 Main St, Tampa FL" value={f.address} onChange={set("address")}/></Field>
    <Grid2><Field label="Purchase Price"><MoneyInput value={f.purchasePrice||""} onChange={set("purchasePrice")}/></Field><Field label="Current Value"><MoneyInput value={f.currentValue||""} onChange={set("currentValue")}/></Field></Grid2>
    <Grid2><Field label="Purchase Date"><Inp type="date" value={f.purchaseDate||""} onChange={set("purchaseDate")}/></Field><Field label="Loan Type"><Sel value={f.loanType} onChange={set("loanType")}>{LOAN_TYPES.map(t=><option key={t}>{t}</option>)}</Sel></Field></Grid2>
    <Grid2><Field label="Lender"><Inp value={f.lender||""} onChange={set("lender")}/></Field><Field label="Loan Balance"><MoneyInput value={f.loanBalance||""} onChange={set("loanBalance")}/></Field></Grid2>
    <Grid2><Field label="Interest Rate (%)"><Inp type="number" step="0.01" value={f.interestRate||""} onChange={set("interestRate")}/></Field><Field label="Monthly Payment"><MoneyInput value={f.loanPayment||""} onChange={set("loanPayment")}/></Field></Grid2>
    <Grid2><Field label="Second Mortgage Balance"><MoneyInput value={f.secondMortgageBalance||""} onChange={set("secondMortgageBalance")}/></Field><Field label="Second Mortgage Payment/mo"><MoneyInput value={f.secondMortgagePayment||""} onChange={set("secondMortgagePayment")}/></Field></Grid2>
    <Grid2><Field label="Loan Maturity Date"><Inp type="date" value={f.loanMaturityDate||""} onChange={set("loanMaturityDate")}/></Field><Field label="Rental Income/mo"><MoneyInput value={f.rentalIncome||""} onChange={set("rentalIncome")}/></Field></Grid2>
    <Grid2><Field label="Property Taxes/yr"><MoneyInput value={f.propertyTaxes||""} onChange={set("propertyTaxes")}/></Field><Field label="Utilities/mo"><MoneyInput value={f.utilities||""} onChange={set("utilities")}/></Field></Grid2>
    <Grid2><Field label="Insurance Company"><Inp value={f.insuranceCompany||""} onChange={set("insuranceCompany")}/></Field><Field label="Insurance Premium/yr"><MoneyInput value={f.insurancePremium||""} onChange={set("insurancePremium")}/></Field></Grid2>
    <Grid2><Field label="Insurance Expiration"><Inp type="date" value={f.insuranceExpiration||""} onChange={set("insuranceExpiration")}/></Field><div/></Grid2>
    <div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:f.floodInsurance?"#e8f0f8":B.bg,borderRadius:8,border:`1px solid ${f.floodInsurance?B.navyMid:B.border}`}}><input type="checkbox" checked={!!f.floodInsurance} onChange={setChk("floodInsurance")} style={{width:16,height:16,accentColor:B.navy}}/><span style={{fontSize:13,color:B.navy,fontWeight:600}}>Flood Insurance</span></label></div>
    {f.floodInsurance&&<Grid2><Field label="Flood Insurance Co."><Inp value={f.floodInsuranceCompany||""} onChange={set("floodInsuranceCompany")}/></Field><Field label="Flood Premium/yr"><MoneyInput value={f.floodInsurancePremium||""} onChange={set("floodInsurancePremium")}/></Field></Grid2>}
    {f.floodInsurance&&<Grid2><Field label="Flood Insurance Expiration"><Inp type="date" value={f.floodInsuranceExpiration||""} onChange={set("floodInsuranceExpiration")}/></Field><div/></Grid2>}

    {/* Rental Expenses section */}
    <div style={{marginTop:18,marginBottom:8,paddingTop:14,borderTop:`1px solid ${B.borderLight}`}}>
      <div style={{fontSize:11,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Rental Expenses (used in Cash Flow projections)</div>
    </div>
    <Grid2>
      <Field label="HOA / Monthly Fee ($)"><MoneyInput placeholder="350" value={f.hoaFee||""} onChange={set("hoaFee")}/></Field>
      <Field label="Property Management Fee (%)"><Inp type="number" step="0.1" placeholder="e.g., 8" value={f.propertyManagementFeePct||""} onChange={set("propertyManagementFeePct")}/></Field>
    </Grid2>
    <div style={{marginBottom:14}}>
      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:f.includeMortgageInCashflow?"#e8f0f8":B.bg,borderRadius:8,border:`1px solid ${f.includeMortgageInCashflow?B.navyMid:B.border}`}}>
        <input type="checkbox" checked={!!f.includeMortgageInCashflow} onChange={setChk("includeMortgageInCashflow")} style={{width:16,height:16,accentColor:B.navy}}/>
        <span style={{fontSize:13,color:B.navy,fontWeight:600}}>Subtract mortgage payment from rental cash flow</span>
      </label>
    </div>
    {grossRental>0&&<div style={{background:netRental>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${netRental>=0?"#2e9e57":"#d43030"}`,borderRadius:8,padding:"12px 14px",marginBottom:14,fontSize:12}}>
      <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Estimated Monthly Net Rental</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:4,color:B.textMid,fontFamily:"inherit"}}>
        <span>Gross rental</span><span style={{fontWeight:600,textAlign:"right"}}>{fmtMoney(grossRental)}</span>
        <span>– Property taxes (1/12)</span><span style={{textAlign:"right"}}>−{fmtMoney(taxesM)}</span>
        <span>– Insurance (1/12)</span><span style={{textAlign:"right"}}>−{fmtMoney(insM)}</span>
        {floodM>0&&<><span>– Flood insurance (1/12)</span><span style={{textAlign:"right"}}>−{fmtMoney(floodM)}</span></>}
        <span>– HOA</span><span style={{textAlign:"right"}}>−{fmtMoney(hoaM)}</span>
        <span>– Property mgmt ({Number(f.propertyManagementFeePct)||0}%)</span><span style={{textAlign:"right"}}>−{fmtMoney(pmM)}</span>
        {f.includeMortgageInCashflow&&<><span>– Mortgage payment</span><span style={{textAlign:"right"}}>−{fmtMoney(mortgageM)}</span></>}
        <span style={{fontWeight:700,paddingTop:4,borderTop:`1px solid ${netRental>=0?"#2e9e57":"#d43030"}`,color:netRental>=0?"#0d5c2b":"#8b1a1a"}}>Net per month</span>
        <span style={{fontWeight:700,paddingTop:4,borderTop:`1px solid ${netRental>=0?"#2e9e57":"#d43030"}`,textAlign:"right",color:netRental>=0?"#0d5c2b":"#8b1a1a"}}>{netRental<0?"−":""}{fmtMoney(Math.abs(netRental))}</span>
      </div>
    </div>}

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
    <Grid2><Field label="Make / Model"><Inp value={f.makeModel||""} onChange={set("makeModel")}/></Field><Field label="Estimated Value"><MoneyInput value={f.estimatedValue||""} onChange={set("estimatedValue")}/></Field></Grid2>
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
    <Grid2><Field label="Value ($)"><MoneyInput value={f.value||""} onChange={set("value")}/></Field><Field label="Close Date"><Inp type="date" value={f.closeDate||""} onChange={set("closeDate")}/></Field></Grid2>
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
    <Grid2><Field label="Starting Balance"><MoneyInput value={f.startingBalance||""} onChange={set("startingBalance")}/></Field><Field label="Current Balance"><MoneyInput value={f.currentBalance||""} onChange={set("currentBalance")}/></Field></Grid2>
    {pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>{Number(pct)>=0?"📈":"📉"}</span>
      <div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}% performance</div>
    </div>}
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Account"}</Btn></div>
  </div>;
}

// ── CASH FLOW EVENT FORM ──────────────────────────────────────────────────────
function CashFlowEventForm({initial,onSave,onClose}){
  const blank={direction:"income",eventType:"Salary",description:"",amount:"",frequency:"once",startDate:new Date().toISOString().slice(0,10),endDate:"",taxTreatment:"ordinary",notes:""};
  const[f,setF]=useState(()=>{
    if(!initial)return blank;
    return{...blank,...initial,direction:initial.direction||"income"};
  });
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  // When user switches direction, swap default eventType to a sensible value
  const setDirection=(dir)=>{
    setF(p=>{
      const next={...p,direction:dir};
      // If the eventType doesn't fit the new direction, switch to a default
      if(dir==="expense"&&!CF_EXPENSE_CATEGORIES.includes(p.eventType))next.eventType="Rent/Mortgage";
      if(dir==="income"&&!CF_EVENT_TYPES.includes(p.eventType))next.eventType="Salary";
      return next;
    });
  };
  const save=async()=>{if(!f.amount||!f.startDate)return;setSaving(true);await onSave(f);onClose();};
  const isExpense=f.direction==="expense";
  const typeOptions=isExpense?CF_EXPENSE_CATEGORIES:CF_EVENT_TYPES;
  return <div>
    {/* Direction toggle */}
    <Field label="Type">
      <div style={{display:"flex",gap:8,background:B.bg,borderRadius:8,padding:4}}>
        <button type="button" onClick={()=>setDirection("income")} style={{flex:1,background:!isExpense?B.white:"transparent",border:!isExpense?`1px solid ${B.border}`:"1px solid transparent",borderRadius:6,padding:"8px 12px",fontSize:13,fontWeight:!isExpense?700:500,color:!isExpense?"#0d5c2b":B.textSoft,cursor:"pointer",fontFamily:"inherit",boxShadow:!isExpense?B.shadow:"none"}}>📈 Income</button>
        <button type="button" onClick={()=>setDirection("expense")} style={{flex:1,background:isExpense?B.white:"transparent",border:isExpense?`1px solid ${B.border}`:"1px solid transparent",borderRadius:6,padding:"8px 12px",fontSize:13,fontWeight:isExpense?700:500,color:isExpense?"#8b1a1a":B.textSoft,cursor:"pointer",fontFamily:"inherit",boxShadow:isExpense?B.shadow:"none"}}>📉 Expense</button>
      </div>
    </Field>
    <Grid2>
      <Field label={isExpense?"Category":"Event Type"}><Sel value={f.eventType} onChange={set("eventType")}>{typeOptions.map(t=><option key={t}>{t}</option>)}</Sel></Field>
      <Field label="Frequency"><Sel value={f.frequency} onChange={set("frequency")}>{CF_FREQUENCIES.map(fr=><option key={fr.value} value={fr.value}>{fr.label}</option>)}</Sel></Field>
    </Grid2>
    <Field label="Description"><Inp placeholder={isExpense?"e.g., Monthly grocery budget":"e.g., Acme Corp Q4 Bonus"} value={f.description||""} onChange={set("description")}/></Field>
    {isExpense?
      <Field label="Amount ($)"><MoneyInput value={f.amount||""} onChange={set("amount")}/></Field>
    :<Grid2>
      <Field label="Gross Amount ($)"><MoneyInput value={f.amount||""} onChange={set("amount")}/></Field>
      <Field label="Tax Treatment"><Sel value={f.taxTreatment} onChange={set("taxTreatment")}>{CF_TAX_TREATMENTS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</Sel></Field>
    </Grid2>}
    <Grid2>
      <Field label={f.frequency==="once"?"Date":"Start Date"}><Inp type="date" value={f.startDate||""} onChange={set("startDate")}/></Field>
      {f.frequency!=="once"&&<Field label="End Date (optional)"><Inp type="date" value={f.endDate||""} onChange={set("endDate")}/></Field>}
    </Grid2>
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn onClick={save} disabled={saving||!f.amount||!f.startDate}>{saving?"Saving…":"Save"}</Btn>
    </div>
  </div>;
}

// ── CASH FLOW REPORT (printable) ──────────────────────────────────────────────
function CashFlowReport({family,projectionMonths,projectionMode,filingStatus,baseIncome,stateRate,stateName,localRate,monthlyData,events,onClose}){
  const totalIncome=monthlyData.reduce((s,m)=>s+(m.income||0),0);
  const totalGross=monthlyData.reduce((s,m)=>s+m.gross,0);
  const totalTax=monthlyData.reduce((s,m)=>s+m.tax,0);
  const totalExpense=monthlyData.reduce((s,m)=>s+(m.expense||0),0);
  const totalNet=monthlyData.reduce((s,m)=>s+m.net,0);
  const marginalAllIn=marginalTaxRate(baseIncome,annualOrdinaryIncome(events,projectionMode,projectionMonths),filingStatus,Number(stateRate)||0,Number(localRate)||0);
  const incomeEvents=events.filter(e=>e.direction!=="expense");
  const expenseEvents=events.filter(e=>e.direction==="expense");
  const projOption=CF_PROJECTION_OPTIONS.find(o=>o.value===projectionMonths);
  const projectionLabel=projectionMode==="year"?`Current Year (${new Date().getFullYear()})`:(projOption?projOption.label:projectionMonths+" months");
  const filingLabel=filingStatus==="mfj"?"Married Filing Jointly":"Single";
  const print=()=>{
    const w=window.open("","_blank");
    // Build SVG bar chart (stacked: income gold positive; expenses red negative)
    const chartW=700,chartH=200,padL=50,padR=10,padT=20,padB=40;
    const innerW=chartW-padL-padR;
    const innerH=chartH-padT-padB;
    const barW=innerW/monthlyData.length;
    const incomeNet=monthlyData.map(m=>(m.income||0)-(m.tax||0));
    const expenseArr=monthlyData.map(m=>m.expense||0);
    const maxPos=Math.max(...incomeNet,0);
    const maxNeg=Math.max(...expenseArr,0)+Math.max(...incomeNet.map(v=>v<0?Math.abs(v):0),0);
    const range=maxPos+maxNeg;
    const zeroY=range>0?padT+innerH-(maxNeg/range)*innerH:padT+innerH;
    const cumulative=[];
    let runTotal=0;
    monthlyData.forEach(m=>{runTotal+=m.net;cumulative.push(runTotal);});
    const minCum=Math.min(...cumulative,0);
    const maxCum2=Math.max(...cumulative,0);
    const cumRange=maxCum2-minCum||1;
    const cumPath=cumulative.map((v,i)=>{
      const x=padL+barW*i+barW/2;
      const y=padT+innerH-((v-minCum)/cumRange)*innerH;
      return(i===0?"M":"L")+x.toFixed(1)+","+y.toFixed(1);
    }).join(" ");
    const bars=monthlyData.map((m,i)=>{
      if(range<=0)return"";
      const x=padL+barW*i+1;
      const w=barW-2;
      const inc=incomeNet[i];
      const exp=expenseArr[i];
      let svg="";
      if(inc>=0){
        const h=(inc/range)*innerH;
        svg+=`<rect x="${x}" y="${zeroY-h}" width="${w}" height="${h}" fill="#1f9d57" opacity="0.85"/>`;
      }else{
        const h=(Math.abs(inc)/range)*innerH;
        svg+=`<rect x="${x}" y="${zeroY}" width="${w}" height="${h}" fill="#d43030" opacity="0.55"/>`;
      }
      if(exp>0){
        const h=(exp/range)*innerH;
        const yStart=inc<0?zeroY+(Math.abs(inc)/range)*innerH:zeroY;
        svg+=`<rect x="${x}" y="${yStart}" width="${w}" height="${h}" fill="#d43030" opacity="0.78"/>`;
      }
      return svg;
    }).join("");
    const yLabels=`<text x="${padL-6}" y="${padT+10}" font-size="9" fill="#8fa0b2" text-anchor="end">${fmtMoneyShort(maxPos)}</text>
      <text x="${padL-6}" y="${zeroY+3}" font-size="9" fill="#8fa0b2" text-anchor="end">$0</text>
      ${maxNeg>0?`<text x="${padL-6}" y="${padT+innerH-3}" font-size="9" fill="#8fa0b2" text-anchor="end">−${fmtMoneyShort(maxNeg)}</text>`:""}`;
    const xLabels=monthlyData.filter((_,i)=>i%Math.max(1,Math.floor(monthlyData.length/8))===0).map((m,idx,arr)=>{
      const realIdx=monthlyData.findIndex(x=>x.label===m.label);
      const x=padL+barW*realIdx+barW/2;
      return`<text x="${x}" y="${padT+innerH+15}" font-size="8" fill="#8fa0b2" text-anchor="middle">${m.label}</text>`;
    }).join("");
    const zeroLine=maxNeg>0?`<line x1="${padL}" x2="${chartW-padR}" y1="${zeroY}" y2="${zeroY}" stroke="#5a6e84" stroke-width="0.5" stroke-dasharray="2,2"/>`:"";
    w.document.write(`<!DOCTYPE html><html><head><title> </title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;color:#092b49;background:#fff;padding:40px;font-size:12px;line-height:1.6;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #ceb684;}
    .logo-img{height:120px;width:auto;display:block;}
    h1{font-size:22px;font-weight:700;margin-bottom:2px;}
    .sub{font-size:12px;color:#5a6e84;margin-top:4px;}
    .date{font-size:11px;color:#8fa0b2;margin-top:2px;}
    h2{font-size:13px;font-weight:800;color:#092b49;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #ceb684;letter-spacing:.06em;text-transform:uppercase;}
    .assumptions{background:#f9f7f3;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;}
    .a-l{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8fa0b2;margin-bottom:3px;}
    .a-v{font-size:13px;font-weight:700;color:#092b49;white-space:nowrap;overflow:visible;}
    .stats{display:flex;gap:14px;margin-bottom:18px;flex-wrap:wrap;}
    .stat{background:#f9f7f3;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;border-top:2px solid #ceb684;}
    .stat-l{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8fa0b2;margin-bottom:4px;}
    .stat-v{font-size:18px;font-weight:700;color:#092b49;white-space:nowrap;overflow:visible;}
    .stat-red{border-top-color:#d43030;}
    table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;}
    th{background:#092b49;color:#ceb684;padding:6px 10px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
    td{padding:5px 10px;border-bottom:1px solid #ede8de;color:#293d5c;vertical-align:top;}
    tr:nth-child(even) td{background:#f9f7f3;}
    .num{text-align:right;font-variant-numeric:tabular-nums;}
    .neg{color:#8b1a1a;}
    .legend{display:flex;gap:14px;font-size:9px;color:#5a6e84;margin-top:6px;}
    .legend span{display:flex;align-items:center;gap:4px;}
    .legend i{display:inline-block;width:8px;height:8px;border-radius:1px;}
    .chart-box{background:#f9f7f3;border-radius:8px;padding:14px;margin-bottom:14px;}
    .disclaimer{margin-top:24px;padding:12px 14px;background:#fef3e2;border:1px solid #fcd97d;border-radius:6px;font-size:10px;color:#8a5c00;line-height:1.5;}
    @media print{body{padding:20px;}}
    </style></head><body>
    <div class="header">
      <div><img src="${PCM_LOGO}" alt="PCM Family Office" class="logo-img"/></div>
      <div style="text-align:right"><h1>Cash Flow Projection</h1><div class="sub">${family.name}</div><div class="date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div>
    </div>
    <div class="assumptions">
      <div><div class="a-l">Projection</div><div class="a-v">${projectionLabel}</div></div>
      <div><div class="a-l">Filing Status</div><div class="a-v">${filingLabel}</div></div>
      <div><div class="a-l">Base Income</div><div class="a-v">${fmtUSD(baseIncome)}</div></div>
      <div><div class="a-l">State (${stateName||"—"})</div><div class="a-v">${(Number(stateRate)||0).toFixed(2)}%</div></div>
      <div><div class="a-l">Local / City</div><div class="a-v">${(Number(localRate)||0).toFixed(2)}%</div></div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-l">Total Gross Income</div><div class="stat-v">${fmtUSD(totalGross)}</div></div>
      <div class="stat stat-red"><div class="stat-l">Total Tax</div><div class="stat-v">${fmtUSD(totalTax)}</div></div>
      <div class="stat stat-red"><div class="stat-l">Total Expenses</div><div class="stat-v">${fmtUSD(totalExpense)}</div></div>
      <div class="stat"><div class="stat-l">Total Net</div><div class="stat-v ${totalNet<0?"neg":""}">${totalNet<0?"−":""}${fmtUSD(Math.abs(totalNet))}</div></div>
      <div class="stat"><div class="stat-l">Marginal Rate</div><div class="stat-v">${marginalAllIn.toFixed(1)}%</div></div>
    </div>
    <h2>Cash Flow by Month</h2>
    <div class="chart-box">
      <svg viewBox="0 0 ${chartW} ${chartH}" width="100%" style="display:block">
        ${bars}
        ${zeroLine}
        <path d="${cumPath}" fill="none" stroke="#092b49" stroke-width="1.5"/>
        ${yLabels}
        ${xLabels}
      </svg>
      <div class="legend"><span><i style="background:#1f9d57"></i>Income (net)</span><span><i style="background:#d43030"></i>Expenses</span><span><i style="background:#092b49;width:14px;height:2px;border-radius:0"></i>Cumulative</span></div>
    </div>
    ${incomeEvents.length>0?`<h2>Income Events</h2>
    <table><thead><tr><th>Type</th><th>Description</th><th>Frequency</th><th>Start</th><th class="num">Gross</th><th>Tax</th><th class="num">Net (proj.)</th></tr></thead><tbody>
    ${incomeEvents.map(e=>{
      const treatLabel=CF_TAX_TREATMENTS.find(t=>t.value===e.taxTreatment)?.label.split(" (")[0]||e.taxTreatment;
      const freqLabel=CF_FREQUENCIES.find(fr=>fr.value===e.frequency)?.label||e.frequency;
      return`<tr><td>${e.eventType}</td><td>${e.description||"—"}</td><td>${freqLabel}</td><td>${fmt(e.startDate)}</td><td class="num">${fmtUSD(e.amount)}</td><td>${treatLabel}</td><td class="num">${fmtUSD(e.projectedNet||0)}</td></tr>`;
    }).join("")}
    </tbody></table>`:""}
    ${expenseEvents.length>0?`<h2>Expense Items</h2>
    <table><thead><tr><th>Category</th><th>Description</th><th>Frequency</th><th>Start</th><th class="num">Amount</th><th class="num">Total (proj.)</th></tr></thead><tbody>
    ${expenseEvents.map(e=>{
      const freqLabel=CF_FREQUENCIES.find(fr=>fr.value===e.frequency)?.label||e.frequency;
      return`<tr><td>${e.eventType}</td><td>${e.description||"—"}</td><td>${freqLabel}</td><td>${fmt(e.startDate)}</td><td class="num neg">−${fmtUSD(e.amount)}</td><td class="num neg">−${fmtUSD(Math.abs(e.projectedNet||0))}</td></tr>`;
    }).join("")}
    </tbody></table>`:""}
    <h2>Monthly Breakdown</h2>
    <table><thead><tr><th>Month</th><th class="num">Income</th><th class="num">Tax</th><th class="num">Expenses</th><th class="num">Net</th><th class="num">Cumulative</th></tr></thead><tbody>
    ${(()=>{let cum=0;return monthlyData.map(m=>{cum+=m.net;const negNet=m.net<0;const negCum=cum<0;return`<tr><td>${m.label}</td><td class="num">${fmtUSD(m.income||0)}</td><td class="num">${fmtUSD(m.tax)}</td><td class="num neg">${m.expense?"−"+fmtUSD(m.expense):"$0"}</td><td class="num ${negNet?"neg":""}">${negNet?"−":""}${fmtUSD(Math.abs(m.net))}</td><td class="num ${negCum?"neg":""}"><strong>${negCum?"−":""}${fmtUSD(Math.abs(cum))}</strong></td></tr>`;}).join("");})()}
    </tbody></table>
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This cash flow projection is a planning estimate only and is not tax advice. Tax calculations use 2026 federal brackets applied marginally on top of base income, with the federal standard deduction for the filing status applied to ordinary income once per tax year (state and local rates apply to full gross). Expenses are treated as after-tax outflows. Actual taxes vary based on deductions, credits, AMT, phase-outs, additional Medicare tax, state-specific rules, and other factors. Consult a qualified tax professional before making decisions based on these figures.
    </div>
    </body></html>`);
    w.document.close();w.focus();
    // Shrink-to-fit: any stat/assumption value wider than its tile gets stepped down (to a 9px floor) so large figures never clip.
    setTimeout(()=>{
      try{
        w.document.querySelectorAll(".stat-v,.a-v").forEach(el=>{
          let size=parseFloat(w.getComputedStyle(el).fontSize)||18;let guard=0;
          while(el.scrollWidth>el.clientWidth+1&&size>9&&guard<40){size-=0.5;el.style.fontSize=size+"px";guard++;}
        });
      }catch(e){}
      w.print();
    },400);
  };

  return <Modal title="Cash Flow Report" onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
      <StatBox label="Total Gross" value={fmtMoney(totalGross)} accent={B.gold}/>
      <StatBox label="Total Tax" value={fmtMoney(totalTax)} accent="#d43030"/>
      <StatBox label="Total Expenses" value={fmtMoney(totalExpense)} accent="#d43030"/>
      <StatBox label="Total Net" value={(totalNet<0?"−":"")+fmtMoney(Math.abs(totalNet))} accent={B.navy}/>
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="gold" onClick={print}>🖨 Print Report</Btn>
    </div>
  </Modal>;
}

// ── CASH FLOW VIEW (the tab content) ──────────────────────────────────────────
function CashFlowView({family,events,properties,reload,toast,readOnly=false}){
  const isMobile=useIsMobile();
  const[modal,setModal]=useState(null);
  const[reportOpen,setReportOpen]=useState(false);
  const[expandedBreakdowns,setExpandedBreakdowns]=useState({});
  const toggleBreakdown=(id)=>setExpandedBreakdowns(p=>({...p,[id]:!p[id]}));
  // Settings: DB (family.cashFlowSettings) is source of truth, localStorage is fallback
  const settingsKey=`cf_settings_${family.id}`;
  const defaults={projectionMonths:60,projectionMode:"rolling",filingStatus:"mfj",baseIncome:0,stateCode:"FL",stateTaxRate:0,localTaxRate:0,localTaxLabel:"",includeRental:false,includeIncome:true,includeExpense:true,compareStateCode:"",compareLocalTaxRate:0};
  const loadSettings=()=>{
    // 1) Try DB
    if(family.cashFlowSettings&&typeof family.cashFlowSettings==="object"){
      return{...defaults,...family.cashFlowSettings};
    }
    // 2) Fallback to localStorage
    try{const s=JSON.parse(localStorage.getItem(settingsKey)||"{}");return{...defaults,...s};}
    catch{return defaults;}
  };
  const[settings,setSettings]=useState(loadSettings);
  // Reload settings when family.cashFlowSettings changes (e.g., after advisor saves and client reloads)
  useEffect(()=>{setSettings(loadSettings());// eslint-disable-next-line
  },[family.id,family.cashFlowSettings]);
  const updateSetting=async(k,v)=>{
    if(readOnly)return;
    const next={...settings,[k]:v};
    setSettings(next);
    // Save to localStorage (immediate UX) and DB (so client view sees same)
    try{localStorage.setItem(settingsKey,JSON.stringify(next));}catch{}
    const{error}=await sb.from("families").update({cash_flow_settings:next}).eq("id",family.id);
    if(error){toast&&toast("Could not save settings: "+error.message,"error");return;}
    if(reload)reload("families");
  };
  const updateSettings=async(patch)=>{
    if(readOnly)return;
    const next={...settings,...patch};
    setSettings(next);
    try{localStorage.setItem(settingsKey,JSON.stringify(next));}catch{}
    const{error}=await sb.from("families").update({cash_flow_settings:next}).eq("id",family.id);
    if(error){toast&&toast("Could not save settings: "+error.message,"error");return;}
    if(reload)reload("families");
  };

  // Add synthetic rental events if toggled (with full expense math)
  const allEvents=useMemo(()=>{
    // Backfill direction='income' for any legacy events without it; sort by sortOrder asc
    const e=events.map(ev=>({...ev,direction:ev.direction||"income"}));
    if(settings.includeRental){
      properties.filter(p=>Number(p.rentalIncome)>0).forEach(p=>{
        const grossRental=Number(p.rentalIncome)||0;
        const taxesM=(Number(p.propertyTaxes)||0)/12;
        const insM=(Number(p.insurancePremium)||0)/12;
        const floodM=(Number(p.floodInsurancePremium)||0)/12;
        const hoaM=Number(p.hoaFee)||0;
        const pmPct=Number(p.propertyManagementFeePct)||0;
        const pmM=grossRental*(pmPct/100);
        const includesMortgage=p.includeMortgageInCashflow!==false;
        const mortgageM=includesMortgage?((Number(p.loanPayment)||0)+(Number(p.secondMortgagePayment)||0)):0;
        const netRental=grossRental-taxesM-insM-floodM-hoaM-pmM-mortgageM;
        e.push({
          id:`rental_${p.id}`,
          _synthetic:true,
          direction:"income",
          _breakdown:{
            grossRental,propertyTaxesMonthly:taxesM,insuranceMonthly:insM,floodInsuranceMonthly:floodM,
            hoaMonthly:hoaM,pmFeeMonthly:pmM,pmFeePct:pmPct,mortgageMonthly:mortgageM,includesMortgage,netRental,
          },
          eventType:"Rental Income (Net)",
          description:p.address,
          amount:netRental,
          frequency:"monthly",
          startDate:new Date().toISOString().slice(0,10),
          endDate:null,
          taxTreatment:netRental>0?"ordinary":"none",
          notes:`From property: ${p.address}`,
          sortOrder:999999, // synthetic always at the end of income list
        });
      });
    }
    // Sort: synthetic events go after manual events by their sortOrder
    return e.sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
  },[events,settings.includeRental,properties]);

  // Comparison scenario: same inputs under a different state's tax (and no/explicit city tax)
  const compareState=settings.compareStateCode?STATE_TAX_RATES.find(st=>st.code===settings.compareStateCode):null;
  const compareActive=!!compareState;
  const compareLocalRate=Number(settings.compareLocalTaxRate)||0;
  // Build month-by-month projection (current state)
  const{monthlyData,enrichedEvents}=useMemo(()=>buildProjection(allEvents,settings,Number(settings.stateTaxRate)||0,Number(settings.localTaxRate)||0),[allEvents,settings]);
  // Comparison projection (only when a compare state is chosen)
  const compareProj=useMemo(()=>compareActive?buildProjection(allEvents,settings,compareState.rate,compareLocalRate):null,[allEvents,settings,compareActive,compareLocalRate]);

  const totalIncome=monthlyData.reduce((s,m)=>s+m.income,0);
  const totalGross=monthlyData.reduce((s,m)=>s+m.gross,0);
  const totalTax=monthlyData.reduce((s,m)=>s+m.tax,0);
  const totalExpense=monthlyData.reduce((s,m)=>s+m.expense,0);
  const totalNet=monthlyData.reduce((s,m)=>s+m.net,0);
  const marginalAllIn=marginalTaxRate(settings.baseIncome,annualOrdinaryIncome(enrichedEvents,settings.projectionMode,settings.projectionMonths),settings.filingStatus,Number(settings.stateTaxRate)||0,Number(settings.localTaxRate)||0);
  // For chart scaling: max positive (income net), min (expenses + negative net rentals)
  const cumulative=[];let run=0;monthlyData.forEach(m=>{run+=m.net;cumulative.push(run);});
  // Comparison scenario totals + cumulative
  const cTotalTax=compareProj?compareProj.monthlyData.reduce((s,m)=>s+m.tax,0):0;
  const cTotalNet=compareProj?compareProj.monthlyData.reduce((s,m)=>s+m.net,0):0;
  const compareCumulative=[];if(compareProj){let cr=0;compareProj.monthlyData.forEach(m=>{cr+=m.net;compareCumulative.push(cr);});}
  const netDelta=cTotalNet-totalNet; // positive = comparison state keeps more (saves)
  // Standalone print: side-by-side relocation tax comparison (current state vs compare state)
  const printComparison=()=>{
    if(!compareActive){toast&&toast("Select a comparison state first.");return;}
    const w=window.open("","_blank");
    const curName=STATE_TAX_RATES.find(s=>s.code===settings.stateCode)?.name||settings.stateCode||"Current State";
    const curRate=Number(settings.stateTaxRate)||0;
    const curLocal=Number(settings.localTaxRate)||0;
    const cmpRate=Number(compareState.rate)||0;
    const cmpLocal=Number(compareLocalRate)||0;
    const cTotalGross=totalGross; // identical income base; only the tax jurisdiction differs
    const curEff=totalGross>0?(totalTax/totalGross)*100:0;
    const cmpEff=cTotalGross>0?(cTotalTax/cTotalGross)*100:0;
    const projOption=CF_PROJECTION_OPTIONS.find(o=>o.value===settings.projectionMonths);
    const projectionLabel=settings.projectionMode==="year"?`Current Year (${new Date().getFullYear()})`:(projOption?projOption.label:settings.projectionMonths+" months");
    const filingLabel=settings.filingStatus==="mfj"?"Married Filing Jointly":"Single";
    const saves=netDelta>=0;
    const taxDiff=totalTax-cTotalTax; // positive = compare state has the lower tax
    const cMonthly=compareProj?compareProj.monthlyData:[];
    const rows=monthlyData.map((m,i)=>{
      const cn=cMonthly[i]?cMonthly[i].net:0;
      const diff=cn-m.net;
      const negA=m.net<0,negB=cn<0,negD=diff<0;
      return `<tr><td>${m.label}</td><td class="num ${negA?"neg":""}">${negA?"−":""}${fmtUSD(Math.abs(m.net))}</td><td class="num ${negB?"neg":""}">${negB?"−":""}${fmtUSD(Math.abs(cn))}</td><td class="num ${negD?"neg":"pos"}">${diff>=0?"+":"−"}${fmtUSD(Math.abs(diff))}</td></tr>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html><head><title> </title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;color:#092b49;background:#fff;padding:40px;font-size:12px;line-height:1.6;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #ceb684;}
    .logo-img{height:120px;width:auto;display:block;}
    h1{font-size:22px;font-weight:700;margin-bottom:2px;}
    .sub{font-size:12px;color:#5a6e84;margin-top:4px;}
    .date{font-size:11px;color:#8fa0b2;margin-top:2px;}
    h2{font-size:13px;font-weight:800;color:#092b49;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #ceb684;letter-spacing:.06em;text-transform:uppercase;}
    .assumptions{background:#f9f7f3;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;}
    .a-l{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8fa0b2;margin-bottom:3px;}
    .a-v{font-size:13px;font-weight:700;color:#092b49;white-space:nowrap;overflow:visible;}
    .cols{display:flex;gap:14px;margin-bottom:14px;flex-wrap:wrap;}
    .col{flex:1;min-width:220px;background:#f9f7f3;border-radius:10px;padding:16px 18px;border-top:3px solid #ceb684;}
    .col.cmp{border-top-color:#092b49;}
    .col-name{font-size:15px;font-weight:800;color:#092b49;margin-bottom:2px;}
    .col-meta{font-size:10px;color:#8fa0b2;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;}
    .line{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:5px 0;border-bottom:1px solid #ede8de;overflow:hidden;}
    .line:last-child{border-bottom:none;}
    .line .k{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#5a6e84;flex:0 0 auto;}
    .line .v{font-size:15px;font-weight:700;color:#092b49;white-space:nowrap;text-align:right;}
    .line .v.tax{color:#8b1a1a;}
    .verdict{border-radius:10px;padding:16px 20px;margin-bottom:16px;text-align:center;}
    .verdict.save{background:#e0f5e9;border:1px solid #18a850;}
    .verdict.cost{background:#fde8e8;border:1px solid #d43030;}
    .verdict-l{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#5a6e84;margin-bottom:4px;}
    .verdict-v{font-size:26px;font-weight:800;white-space:nowrap;}
    .verdict.save .verdict-v{color:#0d5c2b;}
    .verdict.cost .verdict-v{color:#8b1a1a;}
    .verdict-sub{font-size:11px;color:#5a6e84;margin-top:4px;}
    table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;}
    th{background:#092b49;color:#ceb684;padding:6px 10px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
    td{padding:5px 10px;border-bottom:1px solid #ede8de;color:#293d5c;}
    tr:nth-child(even) td{background:#f9f7f3;}
    .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
    .neg{color:#8b1a1a;}.pos{color:#0d5c2b;}
    tfoot td{font-weight:800;border-top:2px solid #092b49;background:#fff;}
    .disclaimer{margin-top:24px;padding:12px 14px;background:#fef3e2;border:1px solid #fcd97d;border-radius:6px;font-size:10px;color:#8a5c00;line-height:1.5;}
    @media print{body{padding:20px;}}
    </style></head><body>
    <div class="header">
      <div><img src="${PCM_LOGO}" alt="PCM Family Office" class="logo-img"/></div>
      <div style="text-align:right"><h1>Relocation Tax Comparison</h1><div class="sub">${family.name}</div><div class="date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div>
    </div>
    <div class="assumptions">
      <div><div class="a-l">Projection</div><div class="a-v">${projectionLabel}</div></div>
      <div><div class="a-l">Filing Status</div><div class="a-v">${filingLabel}</div></div>
      <div><div class="a-l">Base Income</div><div class="a-v">${fmtUSD(settings.baseIncome)}</div></div>
      <div><div class="a-l">Projected Gross</div><div class="a-v">${fmtUSD(totalGross)}</div></div>
    </div>
    <h2>Scenario Comparison</h2>
    <div class="cols">
      <div class="col">
        <div class="col-name">${curName}</div>
        <div class="col-meta">Current &middot; ${curRate.toFixed(2)}% state${curLocal>0?` + ${curLocal.toFixed(2)}% local`:""}</div>
        <div class="line"><span class="k">Total Tax</span><span class="v tax">${fmtUSD(totalTax)}</span></div>
        <div class="line"><span class="k">Effective Rate</span><span class="v">${curEff.toFixed(1)}%</span></div>
        <div class="line"><span class="k">Net (after tax)</span><span class="v">${fmtUSD(totalNet)}</span></div>
      </div>
      <div class="col cmp">
        <div class="col-name">${compareState.name}</div>
        <div class="col-meta">Relocation &middot; ${cmpRate.toFixed(2)}% state${cmpLocal>0?` + ${cmpLocal.toFixed(2)}% local`:" &middot; no city tax"}</div>
        <div class="line"><span class="k">Total Tax</span><span class="v tax">${fmtUSD(cTotalTax)}</span></div>
        <div class="line"><span class="k">Effective Rate</span><span class="v">${cmpEff.toFixed(1)}%</span></div>
        <div class="line"><span class="k">Net (after tax)</span><span class="v">${fmtUSD(cTotalNet)}</span></div>
      </div>
    </div>
    <div class="verdict ${saves?"save":"cost"}">
      <div class="verdict-l">${saves?`Potential Net Gain &mdash; Relocating to ${compareState.name}`:`Additional Net Cost &mdash; Relocating to ${compareState.name}`}</div>
      <div class="verdict-v">${saves?"+":"−"}${fmtUSD(Math.abs(netDelta))}</div>
      <div class="verdict-sub">${Math.abs(taxDiff)>0.005?`${fmtUSD(Math.abs(taxDiff))} ${taxDiff>0?"less":"more"} tax`:"Identical tax burden"} &middot; ${settings.projectionMode==="year"?`calendar year ${new Date().getFullYear()}`:`${settings.projectionMonths}-month projection`}</div>
    </div>
    <h2>Monthly Net &mdash; Side by Side</h2>
    <table><thead><tr><th>Month</th><th class="num">${curName} Net</th><th class="num">${compareState.name} Net</th><th class="num">Difference</th></tr></thead><tbody>
    ${rows}
    </tbody><tfoot><tr><td>Total</td><td class="num ${totalNet<0?"neg":""}">${totalNet<0?"−":""}${fmtUSD(Math.abs(totalNet))}</td><td class="num ${cTotalNet<0?"neg":""}">${cTotalNet<0?"−":""}${fmtUSD(Math.abs(cTotalNet))}</td><td class="num ${netDelta<0?"neg":"pos"}">${netDelta>=0?"+":"−"}${fmtUSD(Math.abs(netDelta))}</td></tr></tfoot></table>
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This relocation comparison models identical income and expense inputs under each state's tax rate (plus any specified local tax), using 2026 federal brackets applied marginally on top of base income, with the federal standard deduction for the filing status applied to ordinary income once per tax year (state and local rates apply to full gross). It does not account for differences in property tax, sales tax, cost of living, homestead or residency-establishment rules, part-year allocation, or state-specific deductions and credits. It is a planning estimate only and not tax or relocation advice. Consult a qualified tax professional before acting on these figures.
    </div>
    </body></html>`);
    w.document.close();w.focus();
    setTimeout(()=>{
      try{
        w.document.querySelectorAll(".a-v,.verdict-v,.col .v").forEach(el=>{
          let size=parseFloat(w.getComputedStyle(el).fontSize)||14;let guard=0;
          while(el.scrollWidth>el.clientWidth+1&&size>9&&guard<40){size-=0.5;el.style.fontSize=size+"px";guard++;}
        });
      }catch(e){}
      w.print();
    },400);
  };
  // Monthly net breakdown
  const monthsCount=monthlyData.length||1;
  const avgInflow=(totalIncome-totalTax)/monthsCount;
  const avgOutflow=totalExpense/monthsCount;
  const avgNet=totalNet/monthsCount;
  const negMonths=monthlyData.filter(m=>m.net<0).length;

  // Add/edit/delete/reorder event
  const addEvent=async(f)=>{
    // New events go to the end of the list
    const maxSort=Math.max(0,...events.map(e=>Number(e.sortOrder)||0));
    const{error}=await sb.from("cash_flow_events").insert({family_id:family.id,direction:f.direction||"income",event_type:f.eventType,description:f.description||null,amount:Number(f.amount)||0,frequency:f.frequency,start_date:f.startDate,end_date:f.endDate||null,tax_treatment:f.taxTreatment||"ordinary",notes:f.notes||null,sort_order:maxSort+10});
    if(error)toast(error.message,"error");else{toast("Event added");reload("cash_flow_events");}
  };
  const editEvent=async(id,f)=>{
    const{error}=await sb.from("cash_flow_events").update({direction:f.direction||"income",event_type:f.eventType,description:f.description||null,amount:Number(f.amount)||0,frequency:f.frequency,start_date:f.startDate,end_date:f.endDate||null,tax_treatment:f.taxTreatment||"ordinary",notes:f.notes||null}).eq("id",id);
    if(error)toast(error.message,"error");else{toast("Event updated");reload("cash_flow_events");}
  };
  const delEvent=async(id)=>{
    const{error}=await sb.from("cash_flow_events").delete().eq("id",id);
    if(error)toast(error.message,"error");else{toast("Event deleted");reload("cash_flow_events");}
  };
  // Reorder: swap sort_order with neighbor (within same direction list, in user-visible order)
  const moveEvent=async(eventId,direction)=>{
    // Build sorted list per direction so up/down only moves within income or within expenses
    const list=[...events].sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
    const idx=list.findIndex(e=>e.id===eventId);
    if(idx===-1)return;
    const target=direction==="up"?idx-1:idx+1;
    if(target<0||target>=list.length)return;
    // Swap sort_order values
    const a=list[idx];
    const b=list[target];
    const aSort=Number(a.sortOrder)||0;
    const bSort=Number(b.sortOrder)||0;
    const{error:e1}=await sb.from("cash_flow_events").update({sort_order:bSort}).eq("id",a.id);
    const{error:e2}=await sb.from("cash_flow_events").update({sort_order:aSort}).eq("id",b.id);
    if(e1||e2){toast((e1||e2).message,"error");return;}
    reload("cash_flow_events");
  };

  return <div style={{padding:readOnly?0:(isMobile?"16px 14px":"24px 28px")}}>
    {/* Settings Bar */}
    <div style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:isMobile?14:18,marginBottom:18,boxShadow:B.shadow}}>
      <div style={{fontSize:11,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Projection Settings{readOnly?" (read-only)":""}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <Field label="Projection Window">
          <Sel value={settings.projectionMode==="year"?"year":String(settings.projectionMonths)} disabled={readOnly} onChange={e=>{const v=e.target.value;if(v==="year")updateSettings({projectionMode:"year"});else updateSettings({projectionMode:"rolling",projectionMonths:Number(v)});}}>
            <option value="year">Current Year ({new Date().getFullYear()})</option>
            {CF_PROJECTION_OPTIONS.map(o=><option key={o.value} value={String(o.value)}>{o.label}</option>)}
          </Sel>
        </Field>
        <Field label="Filing Status">
          <Sel value={settings.filingStatus} disabled={readOnly} onChange={e=>updateSetting("filingStatus",e.target.value)}>
            <option value="mfj">Married Filing Jointly</option>
            <option value="single">Single</option>
          </Sel>
        </Field>
        <Field label="Base Annual Income">
          <MoneyInput disabled={readOnly} value={settings.baseIncome||""} onChange={e=>updateSetting("baseIncome",Number(e.target.value)||0)} placeholder="0"/>
        </Field>
        <Field label="State">
          <Sel value={settings.stateCode} disabled={readOnly} onChange={e=>{
            const code=e.target.value;
            const st=STATE_TAX_RATES.find(s=>s.code===code);
            updateSettings({stateCode:code,stateTaxRate:st?st.rate:0});
          }}>
            {STATE_TAX_RATES.map(s=><option key={s.code} value={s.code}>{s.name} ({s.rate.toFixed(2)}%)</option>)}
          </Sel>
        </Field>
        <Field label="Local / City Tax (%)">
          <Inp type="number" step="0.01" disabled={readOnly} value={settings.localTaxRate||""} onChange={e=>updateSetting("localTaxRate",Number(e.target.value)||0)} placeholder="e.g., NYC 3.876"/>
        </Field>
      </div>
      <div style={{marginTop:12,display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:readOnly?"not-allowed":"pointer",fontSize:13,color:B.text,opacity:readOnly?0.7:1}}>
          <input type="checkbox" disabled={readOnly} checked={!!settings.includeRental} onChange={e=>updateSetting("includeRental",e.target.checked)} style={{width:16,height:16,accentColor:B.navy}}/>
          <span>Include rental income from properties</span>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:readOnly?"not-allowed":"pointer",fontSize:13,color:B.text,opacity:readOnly?0.7:1}}>
          <input type="checkbox" disabled={readOnly} checked={settings.includeIncome!==false} onChange={e=>updateSetting("includeIncome",e.target.checked)} style={{width:16,height:16,accentColor:B.navy}}/>
          <span>Include income items</span>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:readOnly?"not-allowed":"pointer",fontSize:13,color:B.text,opacity:readOnly?0.7:1}}>
          <input type="checkbox" disabled={readOnly} checked={settings.includeExpense!==false} onChange={e=>updateSetting("includeExpense",e.target.checked)} style={{width:16,height:16,accentColor:B.navy}}/>
          <span>Include expense items</span>
        </label>
        {!readOnly&&<div style={{fontSize:11,color:B.textSoft,marginLeft:"auto"}}>State rate auto-fills from selection. Common local rates: NYC 3.876% · Philadelphia 3.75% · Detroit 2.4%</div>}
      </div>
      <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${B.borderLight}`,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,alignItems:"end"}}>
        <Field label="Compare To (relocation)">
          <Sel value={settings.compareStateCode||""} disabled={readOnly} onChange={e=>{
            const code=e.target.value;const st=STATE_TAX_RATES.find(s=>s.code===code);
            updateSettings({compareStateCode:code,compareStateRate:st?st.rate:0});
          }}>
            <option value="">— Off —</option>
            {STATE_TAX_RATES.map(s=><option key={s.code} value={s.code}>{s.name} ({s.rate.toFixed(2)}%)</option>)}
          </Sel>
        </Field>
        {compareActive&&<Field label="Compare Local / City Tax (%)">
          <Inp type="number" step="0.01" disabled={readOnly} value={settings.compareLocalTaxRate||""} onChange={e=>updateSetting("compareLocalTaxRate",Number(e.target.value)||0)} placeholder="0 (no city tax)"/>
        </Field>}
        {compareActive&&<div style={{fontSize:11,color:B.textSoft}}>Models the identical inputs as if the client were taxed in {compareState.name}{compareLocalRate>0?` + ${compareLocalRate}% local`:" with no city tax"}.</div>}
      </div>
    </div>

    {/* Comparison summary */}
    {compareActive&&<div style={{background:"linear-gradient(135deg,#f9f7f3,#f2ede3)",border:`1px solid ${B.gold}`,borderRadius:12,padding:isMobile?16:20,marginBottom:18,boxShadow:B.shadow}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:8,marginBottom:14}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?17:20,color:B.navy,fontWeight:600}}>Relocation Comparison</div>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{fontSize:12,color:B.textSoft}}>{settings.projectionMode==="year"?`calendar year ${new Date().getFullYear()}`:`over ${settings.projectionMonths}-month projection`}</div>
          <Btn small variant="gold" onClick={printComparison}>🖨 Print Comparison</Btn>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
        <div style={{background:B.white,borderRadius:10,padding:"14px 16px",border:`1px solid ${B.borderLight}`}}>
          <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{STATE_TAX_RATES.find(s=>s.code===settings.stateCode)?.name||settings.stateCode} · Current</div>
          <div style={{fontSize:13,color:B.textSoft}}>Tax <strong style={{color:"#8b1a1a"}}>{fmtMoney(totalTax)}</strong></div>
          <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:700,marginTop:4}}>{fmtMoney(totalNet)} <span style={{fontSize:11,color:B.textSoft,fontWeight:400}}>net</span></div>
        </div>
        <div style={{background:B.white,borderRadius:10,padding:"14px 16px",border:`1px solid ${B.gold}`}}>
          <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{compareState.name} · Compare</div>
          <div style={{fontSize:13,color:B.textSoft}}>Tax <strong style={{color:"#8b1a1a"}}>{fmtMoney(cTotalTax)}</strong></div>
          <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:700,marginTop:4}}>{fmtMoney(cTotalNet)} <span style={{fontSize:11,color:B.textSoft,fontWeight:400}}>net</span></div>
        </div>
        <div style={{background:netDelta>=0?"#e0f5e9":"#fde8e8",borderRadius:10,padding:"14px 16px",border:`1px solid ${netDelta>=0?"#18a850":"#d43030"}`,display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{netDelta>=0?"Potential Savings":"Additional Cost"}</div>
          <div style={{fontSize:24,fontFamily:"'Cormorant Garamond',serif",color:netDelta>=0?"#0d5c2b":"#8b1a1a",fontWeight:700}}>{netDelta>=0?"+":"−"}{fmtMoney(Math.abs(netDelta))}</div>
          <div style={{fontSize:11,color:B.textSoft,marginTop:2}}>{Math.abs(totalTax-cTotalTax)>0?`${fmtMoney(Math.abs(totalTax-cTotalTax))} ${cTotalTax<totalTax?"less":"more"} tax`:"Same tax"}</div>
        </div>
      </div>
    </div>}

    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
      <StatBox label="Projected Gross" value={fmtMoney(totalGross)} accent={B.gold}/>
      <StatBox label="Projected Tax" value={fmtMoney(totalTax)} accent="#d43030"/>
      <StatBox label="Projected Net" value={fmtMoney(totalNet)} accent={B.navy}/>
      <StatBox label="Marginal Rate" value={marginalAllIn.toFixed(1)+"%"} accent={B.navyMid}/>
    </div>

    {/* Monthly net breakdown */}
    {monthlyData.length>0&&<div style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:isMobile?14:16,marginBottom:18,boxShadow:B.shadow}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:B.navy,fontWeight:600}}>Average Monthly Net</div>
        {negMonths>0?<div style={{fontSize:12,color:"#8b1a1a",fontWeight:700,background:"#fde8e8",padding:"3px 10px",borderRadius:14}}>{negMonths} of {monthlyData.length} months run negative</div>
          :<div style={{fontSize:12,color:"#0d5c2b",fontWeight:700,background:"#e0f5e9",padding:"3px 10px",borderRadius:14}}>All months positive</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?10:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:120}}>
          <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Inflow (income net)</div>
          <div style={{fontSize:isMobile?17:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#1f9d57"}}>+{fmtMoney(avgInflow)}<span style={{fontSize:11,color:B.textSoft,fontWeight:400}}>/mo</span></div>
        </div>
        <div style={{fontSize:22,color:B.textMute,fontWeight:300}}>−</div>
        <div style={{flex:1,minWidth:120}}>
          <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Outflow (expenses)</div>
          <div style={{fontSize:isMobile?17:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#d43030"}}>−{fmtMoney(avgOutflow)}<span style={{fontSize:11,color:B.textSoft,fontWeight:400}}>/mo</span></div>
        </div>
        <div style={{fontSize:22,color:B.textMute,fontWeight:300}}>=</div>
        <div style={{flex:1,minWidth:120,background:avgNet>=0?"#e0f5e9":"#fde8e8",borderRadius:10,padding:"8px 12px",border:`1px solid ${avgNet>=0?"#18a850":"#d43030"}`}}>
          <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Net per month</div>
          <div style={{fontSize:isMobile?18:22,fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:avgNet>=0?"#0d5c2b":"#8b1a1a"}}>{avgNet>=0?"+":"−"}{fmtMoney(Math.abs(avgNet))}<span style={{fontSize:11,color:B.textSoft,fontWeight:400}}>/mo</span></div>
        </div>
      </div>
      {avgNet<0&&<div style={{fontSize:12,color:B.textSoft,marginTop:10,lineHeight:1.5}}>The cumulative line declines because average monthly outflow exceeds inflow.</div>}
    </div>}

    {/* Chart */}
    {monthlyData.length>0&&<div style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:isMobile?14:20,marginBottom:18,boxShadow:B.shadow}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Cash Flow by Month</div>
        <div style={{display:"flex",gap:14,fontSize:11,color:B.textSoft,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,background:"#1f9d57",borderRadius:2,display:"inline-block"}}/>Income (net)</span>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,background:"#d43030",borderRadius:2,display:"inline-block"}}/>Expenses</span>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:16,height:2.5,background:B.navy,display:"inline-block",borderRadius:2}}/>Cumulative net</span>
          {compareActive&&<span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:16,height:0,borderTop:`2.5px dashed ${B.gold}`,display:"inline-block"}}/>{compareState.name}</span>}
        </div>
      </div>
      <GoldLine/>
      <svg viewBox={`0 0 ${Math.max(720,monthlyData.length*18)} 260`} style={{width:"100%",height:isMobile?200:270,display:"block"}}>
        {(() => {
          const W=Math.max(720,monthlyData.length*18);const H=260;const padL=60,padR=compareActive?64:54,padT=18,padB=34;
          const innerW=W-padL-padR;const innerH=H-padT-padB;
          const barW=innerW/monthlyData.length;
          const incomeNetByMonth=monthlyData.map(m=>m.income-m.tax);
          const maxPos=Math.max(...incomeNetByMonth,0);
          const minNeg=-Math.max(...monthlyData.map(m=>m.expense),0);
          const rentalNegativeFloor=Math.min(...monthlyData.map(m=>Math.min(0,m.income-m.tax)),0);
          const minOverall=Math.min(minNeg,rentalNegativeFloor);
          const range=(maxPos-minOverall)||1;
          const zeroY=padT+innerH-(Math.abs(minOverall)/range)*innerH;
          // Shared cumulative scale across current + comparison lines
          const allCum=compareActive?cumulative.concat(compareCumulative):cumulative;
          const cMin=Math.min(...allCum,0);const cMax=Math.max(...allCum,0);const cRange=(cMax-cMin)||1;
          const cumY=v=>padT+innerH-((v-cMin)/cRange)*innerH;
          const lineFor=arr=>arr.map((v,i)=>{const x=padL+barW*i+barW/2;return(i===0?"M":"L")+x.toFixed(1)+","+cumY(v).toFixed(1);}).join(" ");
          const cumPath=lineFor(cumulative);
          const comparePath=compareActive?lineFor(compareCumulative):"";
          const lastX=padL+barW*(monthlyData.length-1)+barW/2;
          const areaPath=`${cumPath} L${lastX.toFixed(1)},${cumY(cMin).toFixed(1)} L${(padL+barW/2).toFixed(1)},${cumY(cMin).toFixed(1)} Z`;
          const stepLabel=Math.max(1,Math.floor(monthlyData.length/(isMobile?6:12)));
          const yTicks=[0,0.25,0.5,0.75,1].map(p=>minOverall+p*range);
          const cTicks=[cMin,cMin+cRange/2,cMax].filter((v,i,a)=>a.indexOf(v)===i);
          return <>
            <defs>
              <linearGradient id="cfIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34b36b"/><stop offset="100%" stopColor="#1f9d57"/></linearGradient>
              <linearGradient id="cfExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e05a5a"/><stop offset="100%" stopColor="#c92e2e"/></linearGradient>
              <linearGradient id="cfArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#092b49" stopOpacity="0.16"/><stop offset="100%" stopColor="#092b49" stopOpacity="0"/></linearGradient>
            </defs>
            {/* Horizontal gridlines + left $ axis */}
            {yTicks.map((v,i)=>{const y=padT+innerH-((v-minOverall)/range)*innerH;return <g key={i}>
              <line x1={padL} x2={W-padR} y1={y} y2={y} stroke={B.borderLight} strokeWidth={Math.abs(v)<0.01?0.9:0.5} strokeDasharray={Math.abs(v)<0.01?"0":"3,3"}/>
              <text x={padL-8} y={y+3} fontSize="9" fill={B.textMute} textAnchor="end">{fmtMoneyShort(v)}</text>
            </g>;})}
            {/* Bars */}
            {monthlyData.map((m,i)=>{
              const x=padL+barW*i+barW*0.16;const w=barW*0.68;
              const incomeNet=m.income-m.tax;const expense=m.expense;const els=[];
              if(incomeNet>=0){const h=(incomeNet/range)*innerH;if(h>0.4)els.push(<rect key={`ig-${i}`} x={x} y={zeroY-h} width={w} height={h} rx={Math.min(2.5,w/2)} fill="url(#cfIncome)"/>);}
              else{const h=(Math.abs(incomeNet)/range)*innerH;els.push(<rect key={`in-${i}`} x={x} y={zeroY} width={w} height={h} rx={Math.min(2.5,w/2)} fill="url(#cfExpense)" opacity="0.6"/>);}
              if(expense>0){const h=(expense/range)*innerH;const yStart=incomeNet<0?zeroY+(Math.abs(incomeNet)/range)*innerH:zeroY;els.push(<rect key={`ex-${i}`} x={x} y={yStart} width={w} height={h} rx={Math.min(2.5,w/2)} fill="url(#cfExpense)"/>);}
              return els;
            })}
            {/* Zero baseline */}
            <line x1={padL} x2={W-padR} y1={zeroY} y2={zeroY} stroke={B.navyMid} strokeWidth="0.8"/>
            {/* Cumulative area + line (current) */}
            <path d={areaPath} fill="url(#cfArea)" stroke="none"/>
            {compareActive&&comparePath&&<path d={comparePath} fill="none" stroke={B.gold} strokeWidth="2.2" strokeDasharray="6,4" strokeLinejoin="round" strokeLinecap="round"/>}
            <path d={cumPath} fill="none" stroke={B.navy} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
            {/* End-point markers + labels */}
            <circle cx={lastX} cy={cumY(cumulative[cumulative.length-1])} r="3" fill={B.navy}/>
            {compareActive&&<circle cx={lastX} cy={cumY(compareCumulative[compareCumulative.length-1])} r="3" fill={B.gold}/>}
            {/* Right axis cumulative ticks */}
            {cTicks.map((v,i)=><text key={i} x={W-padR+6} y={cumY(v)+3} fontSize="9" fill={B.textMute} textAnchor="start">{fmtMoneyShort(v)}</text>)}
            {/* X axis labels */}
            {monthlyData.map((m,i)=>i%stepLabel!==0?null:<text key={i} x={padL+barW*i+barW/2} y={padT+innerH+15} fontSize="9" fill={B.textMute} textAnchor="middle">{m.label}</text>)}
            <line x1={padL} x2={W-padR} y1={padT+innerH} y2={padT+innerH} stroke={B.border} strokeWidth="1"/>
          </>;
        })()}
      </svg>
    </div>}

    {/* Events Table */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:10,flexWrap:"wrap"}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Events ({events.length})</div>
      {!readOnly&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <Btn variant="gold" onClick={()=>setReportOpen(true)}>🖨 Print Report</Btn>
        <Btn onClick={()=>setModal({type:"add"})}>+ New Event</Btn>
      </div>}
    </div>

    {enrichedEvents.length===0?<Empty text={readOnly?"No cash flow events yet.":"No cash flow events yet. Add your first event."}/>:enrichedEvents.map((e,idx)=>{
      const freqLabel=CF_FREQUENCIES.find(fr=>fr.value===e.frequency)?.label||e.frequency;
      const treatLabel=CF_TAX_TREATMENTS.find(t=>t.value===e.taxTreatment)?.label.split(" (")[0]||e.taxTreatment;
      const isExpense=e.direction==="expense";
      const isNegative=Number(e.amount)<0;
      const isExpanded=!!expandedBreakdowns[e.id];
      const bd=e._breakdown;
      // Real (non-synthetic) events that can be reordered
      const reorderable=!e._synthetic&&!readOnly;
      // Find prev/next reorderable event in the visible list
      const reorderableEvents=enrichedEvents.filter(ev=>!ev._synthetic);
      const myReorderIdx=reorderableEvents.findIndex(ev=>ev.id===e.id);
      const canMoveUp=reorderable&&myReorderIdx>0;
      const canMoveDown=reorderable&&myReorderIdx<reorderableEvents.length-1;
      const accentColor=isExpense?"#d43030":(e._synthetic?(isNegative?"#d43030":B.navyMid):B.gold);
      return <div key={e.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${accentColor}`,borderRadius:10,padding:isMobile?14:16,marginBottom:8,boxShadow:B.shadow,opacity:e._excluded?0.55:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontWeight:700,color:B.navy,fontSize:14}}>{e.eventType}</span>
              <Badge scheme={isExpense?{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}:{bg:"#e0f5e9",text:"#0d5c2b",dot:"#18a850"}}>{isExpense?"Expense":"Income"}</Badge>
              <Badge scheme={{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}}>{freqLabel}</Badge>
              {e._synthetic&&<Badge scheme={{bg:"#fef3e2",text:"#8a5c00",dot:"#d4900a"}}>Auto</Badge>}
              {e._synthetic&&isNegative&&<Badge scheme={{bg:"#fde8e8",text:"#8b1a1a",dot:"#d43030"}}>Net Outflow</Badge>}
              {e._excluded&&<Badge scheme={{bg:B.bg,text:B.textMute,dot:B.textMute}}>Excluded</Badge>}
            </div>
            {e.description&&<div style={{fontSize:13,color:B.textMid,marginBottom:4}}>{e.description}</div>}
            <div style={{fontSize:11,color:B.textSoft}}>{fmt(e.startDate)}{e.endDate?` → ${fmt(e.endDate)}`:""}{!isExpense?` · ${treatLabel}`:""}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:12,color:B.textSoft}}>{e.frequency==="once"?"Amount":"Per occurrence"}</div>
            <div style={{fontSize:16,fontWeight:700,color:isExpense||isNegative?"#8b1a1a":B.navy}}>{isExpense?"−":(isNegative?"−":"")}{fmtMoney(Math.abs(e.amount))}</div>
            <div style={{fontSize:11,color:B.textSoft,marginTop:6}}>Projected ({CF_PROJECTION_OPTIONS.find(o=>o.value===settings.projectionMonths)?.label||""})</div>
            <div style={{fontSize:13,fontWeight:700,color:e.projectedNet>=0?"#0d5c2b":"#8b1a1a"}}>{e.projectedNet<0?"−":""}{fmtMoney(Math.abs(e.projectedNet||0))} <span style={{fontSize:10,color:B.textSoft,fontWeight:400}}>{isExpense?"total":"net"}</span></div>
          </div>
        </div>
        {/* Breakdown for synthetic rental events */}
        {e._synthetic&&bd&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${B.borderLight}`}}>
          <button onClick={()=>toggleBreakdown(e.id)} style={{background:"none",border:"none",color:B.navyMid,fontSize:12,fontWeight:600,cursor:"pointer",padding:0,fontFamily:"inherit"}}>
            {isExpanded?"▼ Hide calculation":"▶ Show calculation"}
          </button>
          {isExpanded&&<div style={{marginTop:8,background:B.bg,borderRadius:8,padding:"10px 14px",fontSize:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:4,color:B.textMid}}>
              <span>Gross rental</span><span style={{fontWeight:600,textAlign:"right"}}>{fmtMoney(bd.grossRental)}</span>
              <span>– Property taxes (1/12)</span><span style={{textAlign:"right"}}>−{fmtMoney(bd.propertyTaxesMonthly)}</span>
              <span>– Insurance (1/12)</span><span style={{textAlign:"right"}}>−{fmtMoney(bd.insuranceMonthly)}</span>
              {bd.floodInsuranceMonthly>0&&<><span>– Flood insurance (1/12)</span><span style={{textAlign:"right"}}>−{fmtMoney(bd.floodInsuranceMonthly)}</span></>}
              <span>– HOA</span><span style={{textAlign:"right"}}>−{fmtMoney(bd.hoaMonthly)}</span>
              <span>– Property mgmt ({bd.pmFeePct}%)</span><span style={{textAlign:"right"}}>−{fmtMoney(bd.pmFeeMonthly)}</span>
              {bd.includesMortgage&&<><span>– Mortgage payment</span><span style={{textAlign:"right"}}>−{fmtMoney(bd.mortgageMonthly)}</span></>}
              <span style={{fontWeight:700,paddingTop:4,borderTop:`1px solid ${B.border}`,color:bd.netRental>=0?"#0d5c2b":"#8b1a1a"}}>Net per month</span>
              <span style={{fontWeight:700,paddingTop:4,borderTop:`1px solid ${B.border}`,textAlign:"right",color:bd.netRental>=0?"#0d5c2b":"#8b1a1a"}}>{bd.netRental<0?"−":""}{fmtMoney(Math.abs(bd.netRental))}</span>
            </div>
            <div style={{marginTop:8,fontSize:10,color:B.textMute,fontStyle:"italic"}}>To change these, edit the property in the Properties tab.</div>
          </div>}
        </div>}
        {/* Action row: reorder + edit + delete (only for non-synthetic, non-readOnly) */}
        {reorderable&&<div style={{display:"flex",gap:6,marginTop:10,paddingTop:10,borderTop:`1px solid ${B.borderLight}`,justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>moveEvent(e.id,"up")} disabled={!canMoveUp} title="Move up" style={{background:"none",border:`1px solid ${B.border}`,borderRadius:6,padding:"4px 10px",cursor:canMoveUp?"pointer":"not-allowed",color:canMoveUp?B.navy:B.textMute,fontSize:13,fontFamily:"inherit",opacity:canMoveUp?1:0.4}}>↑</button>
            <button onClick={()=>moveEvent(e.id,"down")} disabled={!canMoveDown} title="Move down" style={{background:"none",border:`1px solid ${B.border}`,borderRadius:6,padding:"4px 10px",cursor:canMoveDown?"pointer":"not-allowed",color:canMoveDown?B.navy:B.textMute,fontSize:13,fontFamily:"inherit",opacity:canMoveDown?1:0.4}}>↓</button>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn small variant="ghost" onClick={()=>setModal({type:"edit",event:e})}>Edit</Btn>
            <Btn small variant="danger" onClick={()=>{if(confirm("Delete this event?"))delEvent(e.id);}}>Delete</Btn>
          </div>
        </div>}
      </div>;
    })}

    {/* Disclaimer */}
    <div style={{background:"#fef3e2",border:"1px solid #fcd97d",borderRadius:8,padding:"10px 14px",marginTop:18,fontSize:11,color:"#8a5c00",lineHeight:1.5}}>
      <strong>Planning estimate only.</strong> Tax calculations use 2026 federal brackets applied marginally on top of base income, with the federal standard deduction for the filing status applied to ordinary income once per tax year (state and local rates apply to full gross). Actual taxes vary based on deductions, credits, AMT, phase-outs, additional Medicare tax, and other factors. Not tax advice — consult a qualified tax professional.
    </div>

    {/* Modals */}
    {modal&&modal.type==="add"&&<Modal title="New Cash Flow Event" onClose={()=>setModal(null)} wide><CashFlowEventForm onSave={async f=>{await addEvent(f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal.type==="edit"&&<Modal title={modal.event.direction==="expense"?"Edit Expense":"Edit Income Event"} onClose={()=>setModal(null)} wide><CashFlowEventForm initial={modal.event} onSave={async f=>{await editEvent(modal.event.id,f);setModal(null);}} onClose={()=>setModal(null)}/></Modal>}
    {reportOpen&&<CashFlowReport family={family} projectionMonths={settings.projectionMonths} projectionMode={settings.projectionMode} filingStatus={settings.filingStatus} baseIncome={settings.baseIncome} stateRate={settings.stateTaxRate} stateName={STATE_TAX_RATES.find(s=>s.code===settings.stateCode)?.name||settings.stateCode} localRate={settings.localTaxRate} monthlyData={monthlyData} events={enrichedEvents} onClose={()=>setReportOpen(false)}/>}
  </div>;
}

// ── FAMILY FORM ──────────────────────────────────────────────────────────────
function FamilyForm({initial,onSave,onClose,userProfile,advisors=[]}){
  const isAdmin=userProfile?.role==="admin";
  const[f,setF]=useState(initial||{
    name:"",
    advisorName: isAdmin ? "" : (userProfile?.fullName||""),
    advisorEmail: isAdmin ? "" : (userProfile?.email||""),
    notes:""
  });
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const pickAdvisor=e=>{
    const email=e.target.value;
    const adv=advisors.find(a=>a.email===email);
    setF(p=>({...p,advisorEmail:email,advisorName:adv?(adv.full_name||""):""}));
  };
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Family Name"><Inp placeholder="The Smith Family" value={f.name} onChange={set("name")}/></Field>
    {isAdmin
      ? <Field label="Assign Advisor">
          <select value={f.advisorEmail||""} onChange={pickAdvisor} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",background:B.white,color:B.navy}}>
            <option value="">— Select an advisor —</option>
            {advisors.map(a=><option key={a.id} value={a.email}>{(a.full_name||a.email)}{a.full_name?` (${a.email})`:""}</option>)}
          </select>
        </Field>
      : <Field label="Advisor"><Inp value={userProfile?.fullName||userProfile?.email||""} disabled/></Field>
    }
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Family"}</Btn></div>
  </div>;
}

// ── FAMILIES LIST VIEW ────────────────────────────────────────────────────────
function printAdvisorReport(adv,data){
  const email=adv.email||"";
  const fmtD=d=>d?new Date(d).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"—";
  const esc=s=>String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const families=(data.families||[]).filter(f=>(f.advisorEmail||"")===email);
  const famIds=new Set(families.map(f=>f.id));
  const prospects=(data.contacts||[]).filter(c=>!c.familyId&&(c.advisorEmail||"")===email);
  const prospectIds=new Set(prospects.map(c=>c.id));
  const cById=id=>(data.contacts||[]).find(c=>c.id===id);
  const fById=id=>(data.families||[]).find(f=>f.id===id);
  const mine=rec=>rec.familyId?famIds.has(rec.familyId):(rec.contactId&&prospectIds.has(rec.contactId));
  const deals=(data.deals||[]).filter(mine);
  const tasks=(data.tasks||[]).filter(mine);
  const notes=(data.notes||[]).filter(mine).sort((a,b)=>(b.createdAt||"")>(a.createdAt||"")?1:-1);
  const now=new Date();
  const famStat=f=>{
    const props=(data.properties||[]).filter(p=>p.familyId===f.id);
    const accts=(data.portfolio_accounts||[]).filter(a=>a.familyId===f.id);
    const openT=(data.tasks||[]).filter(t=>t.familyId===f.id&&!t.done).length;
    const value=props.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0)+accts.reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
    return{props:props.length,accts:accts.length,openT,value};
  };
  const aum=families.reduce((s,f)=>s+famStat(f).value,0);
  const openDeals=deals.filter(d=>d.stage!=="Closed Won"&&d.stage!=="Closed Lost");
  const wonDeals=deals.filter(d=>d.stage==="Closed Won");
  const pipelineVal=openDeals.reduce((s,d)=>s+(Number(d.value)||0),0);
  const openTasks=tasks.filter(t=>!t.done);
  const overdue=openTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<now);
  const relOf=rec=>rec.familyId?(fById(rec.familyId)?.name||"—"):(cById(rec.contactId)?.name||"—");
  const stat=(l,v)=>`<div class="stat"><div class="stat-l">${l}</div><div class="stat-v">${v}</div></div>`;
  const w=window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><title> </title>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;color:#092b49;background:#fff;padding:40px;font-size:13px;line-height:1.6;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #ceb684;}
  .logo-img{height:110px;width:auto;display:block;}
  h1{font-size:22px;font-weight:700;margin-bottom:2px;}
  .advisor{font-size:12px;color:#5a6e84;margin-top:4px;}
  .date{font-size:11px;color:#8fa0b2;margin-top:2px;}
  h2{font-size:14px;font-weight:800;color:#092b49;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #ceb684;letter-spacing:.06em;text-transform:uppercase;}
  table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;}
  th{background:#092b49;color:#ceb684;padding:6px 10px;text-align:left;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
  td{padding:6px 10px;border-bottom:1px solid #ede8de;color:#293d5c;vertical-align:top;}
  tr:nth-child(even) td{background:#f9f7f3;}
  .stats{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;}
  .stat{background:#f9f7f3;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;border-top:2px solid #ceb684;}
  .stat-l{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#8fa0b2;margin-bottom:4px;}
  .stat-v{font-size:18px;font-weight:700;color:#092b49;}
  .note{padding:8px 0;border-bottom:1px solid #ede8de;}
  .note-meta{font-size:10px;color:#8fa0b2;margin-top:2px;}
  @media print{body{padding:20px;}}
  </style></head><body>
  <div class="header">
    <div><img src="${PCM_LOGO}" alt="PCM Family Office" class="logo-img"/></div>
    <div style="text-align:right"><h1>Advisor Activity Report</h1><div class="advisor">${esc(adv.name||email)}${email?` | ${esc(email)}`:""}</div><div class="date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div></div>
  </div>
  <div class="stats">
    ${stat("Families",families.length)}${stat("AUM (Est.)",fmtMoney(aum))}${stat("Prospects",prospects.length)}${stat("Open Deals",openDeals.length)}${stat("Pipeline $",fmtMoney(pipelineVal))}${stat("Open Tasks",openTasks.length)}${stat("Overdue",overdue.length)}
  </div>
  <h2>Families (${families.length})</h2>
  <table><thead><tr><th>Family</th><th>Properties</th><th>Accounts</th><th>Est. Value</th><th>Open Tasks</th></tr></thead><tbody>
  ${families.map(f=>{const s=famStat(f);return`<tr><td>${esc(f.name)}</td><td>${s.props}</td><td>${s.accts}</td><td>${fmtMoney(s.value)}</td><td>${s.openT}</td></tr>`;}).join("")||"<tr><td colspan='5' style='color:#8fa0b2'>No families assigned</td></tr>"}
  </tbody></table>
  <h2>Prospects (${prospects.length})</h2>
  <table><thead><tr><th>Name</th><th>Company</th><th>Type</th><th>Email</th><th>Phone</th></tr></thead><tbody>
  ${prospects.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.company)||"—"}</td><td>${esc(c.type)||"—"}</td><td>${esc(c.email)||"—"}</td><td>${esc(c.phone)||"—"}</td></tr>`).join("")||"<tr><td colspan='5' style='color:#8fa0b2'>No prospects</td></tr>"}
  </tbody></table>
  <h2>Pipeline — Open Deals (${openDeals.length}) · Won (${wonDeals.length})</h2>
  <table><thead><tr><th>Deal</th><th>Related To</th><th>Stage</th><th>Value</th><th>Close Date</th></tr></thead><tbody>
  ${deals.sort((a,b)=>(b.value||0)-(a.value||0)).map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(relOf(d))}</td><td>${esc(d.stage)}</td><td>${fmtMoney(d.value)}</td><td>${fmtD(d.closeDate)}</td></tr>`).join("")||"<tr><td colspan='5' style='color:#8fa0b2'>No deals</td></tr>"}
  </tbody></table>
  <h2>Open Tasks (${openTasks.length})</h2>
  <table><thead><tr><th>Task</th><th>Related To</th><th>Priority</th><th>Due Date</th></tr></thead><tbody>
  ${openTasks.sort((a,b)=>(a.dueDate||"")>(b.dueDate||"")?1:-1).map(t=>{const od=t.dueDate&&new Date(t.dueDate)<now;return`<tr><td>${esc(t.title)}</td><td>${esc(relOf(t))}</td><td>${esc(t.priority)||"—"}</td><td style="${od?"color:#8b1a1a;font-weight:700":""}">${fmtD(t.dueDate)}${od?" (overdue)":""}</td></tr>`;}).join("")||"<tr><td colspan='4' style='color:#8fa0b2'>No open tasks</td></tr>"}
  </tbody></table>
  <h2>Recent Notes (${Math.min(notes.length,15)} of ${notes.length})</h2>
  ${notes.slice(0,15).map(n=>`<div class="note"><div>${esc(n.body)}</div><div class="note-meta">${esc(relOf(n))} · ${fmtD(n.createdAt)}</div></div>`).join("")||"<p style='color:#8fa0b2'>No notes</p>"}
  </body></html>`);
  w.document.close();w.focus();setTimeout(()=>w.print(),400);
}

function FamiliesView({data,reload,toast,userProfile}){
  const{families}=data;
  const[advisors,setAdvisors]=useState([]);
  useEffect(()=>{
    if(userProfile?.role==="admin"){
      sb.from("user_profiles").select("id,email,full_name,role").in("role",["advisor","admin"]).then(({data:rows,error})=>{if(!error&&rows)setAdvisors(rows);});
    }
  },[userProfile]);
  const[selected,setSelected]=useState(null);
  const[modal,setModal]=useState(null);
  const[search,setSearch]=useState("");
  const isAdmin=userProfile?.role==="admin";
  const[viewMode,setViewMode]=useState("families"); // admin only: "families" | "advisors"
  const[advisorFilter,setAdvisorFilter]=useState(""); // when set, families list is scoped to this advisor email
  const filtered=useMemo(()=>families.filter(f=>{
    if(advisorFilter&&(f.advisorEmail||"")!==advisorFilter)return false;
    return [f.name,f.advisorName,f.advisorEmail].join(" ").toLowerCase().includes(search.toLowerCase());
  }),[families,search,advisorFilter]);

  // Per-advisor roll-up (admin only)
  const advisorSummary=useMemo(()=>{
    const statsFor=f=>{
      const props=(data.properties||[]).filter(p=>p.familyId===f.id);
      const accts=(data.portfolio_accounts||[]).filter(a=>a.familyId===f.id);
      const openTasks=(data.tasks||[]).filter(t=>t.familyId===f.id&&!t.done);
      const overdue=openTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
      const value=props.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0)+
                  accts.reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
      return{value,openTasks:openTasks.length,overdue:overdue.length};
    };
    const groups={};
    families.forEach(f=>{
      const key=f.advisorEmail||"__unassigned__";
      if(!groups[key])groups[key]={email:f.advisorEmail||"",name:f.advisorName||"Unassigned",unassigned:!f.advisorEmail,families:0,value:0,openTasks:0,overdue:0};
      const st=statsFor(f);
      groups[key].families+=1;groups[key].value+=st.value;groups[key].openTasks+=st.openTasks;groups[key].overdue+=st.overdue;
    });
    advisors.forEach(a=>{if(!groups[a.email])groups[a.email]={email:a.email,name:a.full_name||a.email,unassigned:false,families:0,value:0,openTasks:0,overdue:0};});
    return Object.values(groups).sort((a,b)=>(b.value-a.value)||(b.families-a.families));
  },[families,data,advisors]);

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
    <div style={{padding:"14px 24px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
      {isAdmin&&<div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
        {[{k:"families",l:"Families"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"7px 14px",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
      </div>}
      {viewMode==="families"&&<>
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search families…" style={{flex:1,minWidth:160}}/>
        {advisorFilter&&<button onClick={()=>setAdvisorFilter("")} style={{border:`1px solid ${B.gold}`,background:"#fbf6ec",color:B.navy,borderRadius:16,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{(advisorSummary.find(a=>a.email===advisorFilter)?.name)||advisorFilter} ✕</button>}
        <Btn onClick={()=>setModal("add")}>+ New Family</Btn>
      </>}
      {viewMode==="advisors"&&<div style={{flex:1,fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Advisor Summary</div>}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
      {viewMode==="advisors"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
        {advisorSummary.length===0&&<Empty text="No advisors or families yet."/>}
        {advisorSummary.map(a=>(
          <div key={a.email||"unassigned"} onClick={()=>{if(!a.unassigned){setAdvisorFilter(a.email);setViewMode("families");}}}
            style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${a.unassigned?B.textMute:B.gold}`,padding:20,cursor:a.unassigned?"default":"pointer",boxShadow:B.shadow,transition:"box-shadow .15s"}}
            onMouseEnter={e=>{if(!a.unassigned)e.currentTarget.style.boxShadow=B.shadowMd;}}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=B.shadow}>
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:a.unassigned?B.textMute:B.navy,fontWeight:600,marginBottom:2}}>{a.name}</div>
              <div style={{fontSize:12,color:B.textSoft}}>{a.email||"Families with no advisor assigned"}</div>
            </div>
            <div style={{height:1,background:`linear-gradient(90deg,${a.unassigned?B.textMute:B.gold},transparent)`,marginBottom:12}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{l:"AUM (Est.)",v:fmtMoney(a.value)},{l:"Families",v:a.families},{l:"Open Tasks",v:a.openTasks},{l:"Overdue",v:a.overdue}].map(item=>(
                <div key={item.l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{item.l}</div>
                  <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",color:item.l==="Overdue"&&a.overdue>0?"#8b1a1a":B.navy,fontWeight:600}}>{item.v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              {!a.unassigned&&<div style={{fontSize:12,color:B.gold,fontWeight:600}}>View families →</div>}
              <button onClick={e=>{e.stopPropagation();printAdvisorReport(a,data);}} style={{marginLeft:"auto",border:`1px solid ${B.navy}`,background:B.white,color:B.navy,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🖨 Print Report</button>
            </div>
          </div>
        ))}
      </div>}
      {viewMode!=="advisors"&&<>
      {filtered.length===0&&<Empty text={advisorFilter?"No families for this advisor.":"No families yet. Add your first one."}/>}
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:8,marginBottom:12}}>
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
      </>}
    </div>
    {modal==="add"&&<Modal title="New Family" onClose={()=>setModal(null)}><FamilyForm userProfile={userProfile} advisors={advisors} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Family" onClose={()=>setModal(null)}><FamilyForm initial={modal} userProfile={userProfile} advisors={advisors} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
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
    <Grid2><Field label="Starting Balance"><MoneyInput value={f.startingBalance||""} onChange={set("startingBalance")}/></Field><Field label="Current Balance"><MoneyInput value={f.currentBalance||""} onChange={set("currentBalance")}/></Field></Grid2>
    {pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{Number(pct)>=0?"📈":"📉"}</span><div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}% performance</div></div>}
    <Field label="Notes"><Tex value={f.notes||""} onChange={set("notes")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

// ── PORTFOLIO VIEW (global) ───────────────────────────────────────────────────
function PortfolioView({data,reload,toast,userProfile}){
  const isMobile=useIsMobile();
  const{families,portfolio_accounts=[]}=data;
  const[modal,setModal]=useState(null);
  const[filterFamily,setFilterFamily]=useState("all");
  const[advScope,setAdvScope]=useState("");
  const[selected,setSelected]=useState(null);
  const gf=id=>families.find(f=>f.id===id);
  const accounts=portfolio_accounts.filter(a=>(filterFamily==="all"||a.familyId===filterFamily)&&(!advScope||(gf(a.familyId)?.advisorEmail||"").toLowerCase()===advScope));
  const totalValue=accounts.reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalStart=accounts.reduce((s,a)=>s+(Number(a.startingBalance)||0),0);
  const totalPct=totalStart>0?(((totalValue-totalStart)/totalStart)*100).toFixed(2):null;

  const add=async f=>{const{error}=await sb.from("portfolio_accounts").insert({family_id:f.familyId||null,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null});if(error)toast(error.message,"error");else{toast("Account added");reload("portfolio_accounts");}};
  const edit=async f=>{const{error}=await sb.from("portfolio_accounts").update({family_id:f.familyId||null,institution:f.institution,banker_name:f.bankerName||null,account_type:f.accountType,starting_balance:f.startingBalance||null,current_balance:f.currentBalance||null,notes:f.notes||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("portfolio_accounts");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("portfolio_accounts").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("portfolio_accounts");if(selected?.id===id)setSelected(null);}};

  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    {/* List (hidden on mobile when detail is showing) */}
    {(!isMobile||!selected)&&<div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:isMobile?"none":`1px solid ${B.borderLight}`}}>
      <div style={{padding:isMobile?"10px 14px":"12px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:isMobile?"100%":200,order:isMobile?2:0}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
        <AdvisorScopeBar userProfile={userProfile} value={advScope} onChange={setAdvScope}/>
        <div style={{flex:1,fontSize:12,color:B.textSoft,order:isMobile?1:0}}>Total: <strong style={{color:B.navy}}>{fmtMoney(totalValue)}</strong>{totalPct!==null&&<span style={{color:Number(totalPct)>=0?"#18a850":"#d43030",fontWeight:700,marginLeft:8}}>{Number(totalPct)>=0?"+":""}{totalPct}%</span>}</div>
        <Btn onClick={()=>setModal("add")}>+ New Account</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {accounts.length===0&&<Empty text="No portfolio accounts yet."/>}
        {ACCT_TYPES.map(type=>{
          const list=accounts.filter(a=>a.accountType===type);
          if(!list.length)return null;
          return <div key={type}>
            <div style={{padding:isMobile?"10px 14px 4px":"10px 20px 4px",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11,fontWeight:800,color:B.textMute,letterSpacing:"0.1em",textTransform:"uppercase"}}>{type}</span>
              <span style={{fontSize:11,color:B.textSoft,fontWeight:700}}>{fmtMoney(list.reduce((s,a)=>s+(Number(a.currentBalance)||0),0))}</span>
            </div>
            {list.map(a=>{const pct=pctChange(a.startingBalance,a.currentBalance);const fam=gf(a.familyId);return <div key={a.id} onClick={()=>setSelected(a)} style={{padding:isMobile?"14px 14px":"12px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===a.id?B.bg:B.white,borderLeft:`3px solid ${B.gold}`}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                <div style={{minWidth:0}}><div style={{fontWeight:700,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.institution}</div><div style={{fontSize:12,color:B.textSoft,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.bankerName?`${a.bankerName} · `:""}{fam?fam.name:""}</div></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:14,fontWeight:700,color:B.navy}}>{fmtMoney(a.currentBalance)}</div>{pct!==null&&<div style={{fontSize:11,fontWeight:700,color:Number(pct)>=0?"#18a850":"#d43030"}}>{Number(pct)>=0?"+":""}{pct}%</div>}</div>
              </div>
            </div>;})}
          </div>;
        })}
      </div>
    </div>}
    {/* Detail panel — full width on mobile, fixed sidebar on desktop */}
    {selected?(
      <div style={{width:isMobile?"100%":360,overflowY:"auto",flexShrink:0,background:B.bg,padding:isMobile?16:22}}>
        {isMobile&&<button onClick={()=>setSelected(null)} style={{background:"none",border:`1px solid ${B.border}`,color:B.textSoft,cursor:"pointer",fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:6,marginBottom:14}}>← Back</button>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:10}}>
          <div style={{minWidth:0}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.institution}</div><div style={{fontSize:12,color:B.textSoft}}>{selected.accountType}</div></div>
          <div style={{display:"flex",gap:6,flexShrink:0}}><Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn></div>
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:14}}/>
        {(()=>{const pct=pctChange(selected.startingBalance,selected.currentBalance);const gain=(Number(selected.currentBalance)||0)-(Number(selected.startingBalance)||0);return pct!==null&&<div style={{background:Number(pct)>=0?"#e0f5e9":"#fde8e8",border:`1px solid ${Number(pct)>=0?"#2e9e57":"#d43030"}`,borderRadius:10,padding:"14px 18px",marginBottom:16,display:"flex",gap:14,alignItems:"center"}}><div style={{fontSize:28}}>{Number(pct)>=0?"📈":"📉"}</div><div><div style={{fontSize:24,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:Number(pct)>=0?"#0d5c2b":"#8b1a1a"}}>{Number(pct)>=0?"+":""}{pct}%</div><div style={{fontSize:12,color:Number(pct)>=0?"#18a850":"#d43030",fontWeight:700}}>{Number(gain)>=0?"+":"-"}{fmtMoney(Math.abs(gain))}</div></div></div>;})()}
        <IRow label="Family" value={gf(selected.familyId)?.name||"—"}/>
        <IRow label="Banker" value={selected.bankerName||"—"}/>
        <IRow label="Starting Balance" value={fmtMoney(selected.startingBalance)}/>
        <IRow label="Current Balance" value={fmtMoney(selected.currentBalance)}/>
        {selected.notes&&<><SectionLabel>Notes</SectionLabel><div style={{fontSize:13,color:B.textMid,lineHeight:1.6}}>{selected.notes}</div></>}
      </div>
    ):(!isMobile&&<div style={{width:360,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select an account</div>)}
    {modal==="add"&&<Modal title="New Portfolio Account" onClose={()=>setModal(null)}><PortfolioAccountForm families={families} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Portfolio Account" onClose={()=>setModal(null)}><PortfolioAccountForm initial={modal} families={families} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── NOTES VIEW ────────────────────────────────────────────────────────────────
function NotesView({data,reload,toast,userProfile,prospectMode=false}){
  const isMobile=useIsMobile();
  const{contacts,families,notes}=data;
  const noteAttachments=data.note_attachments||[];
  const[body,setBody]=useState("");const[cid,setCid]=useState("");const[fid,setFid]=useState("");const[search,setSearch]=useState("");const[saving,setSaving]=useState(false);
  const[editId,setEditId]=useState(null);const[editBody,setEditBody]=useState("");
  const[pendingFiles,setPendingFiles]=useState([]);
  const gc=id=>contacts.find(c=>c.id===id);const gf=id=>families.find(f=>f.id===id);
  const adminProspect=prospectMode&&userProfile?.role==="admin";
  const[viewMode,setViewMode]=useState("notes");
  const[advisorFilter,setAdvisorFilter]=useState("");
  const[advisors,setAdvisors]=useState([]);
  useEffect(()=>{if(adminProspect){sb.from("user_profiles").select("id,email,full_name,role").in("role",["advisor","admin"]).then(({data:rows,error})=>{if(!error&&rows)setAdvisors(rows);});}},[adminProspect]);
  const advisorOfNote=n=>{const c=contacts.find(x=>x.id===n.contactId);return c&&c.advisorEmail?{email:c.advisorEmail,name:c.advisorName||c.advisorEmail}:null;};
  const[cmAdvScope,setCmAdvScope]=useState("");
  const advisorSummary=useMemo(()=>{
    const groups={};
    notes.forEach(n=>{
      const c=contacts.find(x=>x.id===n.contactId);
      const adv=c&&c.advisorEmail?{email:c.advisorEmail,name:c.advisorName||c.advisorEmail}:null;
      const key=adv?adv.email:"__unassigned__";
      if(!groups[key])groups[key]={email:adv?adv.email:"",name:adv?adv.name:"Unassigned",unassigned:!adv,notes:0,contacts:new Set()};
      groups[key].notes+=1; if(n.contactId)groups[key].contacts.add(n.contactId);
    });
    advisors.forEach(a=>{if(!groups[a.email])groups[a.email]={email:a.email,name:a.full_name||a.email,unassigned:false,notes:0,contacts:new Set()};});
    return Object.values(groups).map(g=>({...g,contacts:g.contacts.size})).sort((a,b)=>b.notes-a.notes);
  },[notes,contacts,advisors]);
  const uploadAttachment=async(noteId,file,category,familyIdForPath)=>{
    const ext=file.name.split(".").pop();
    const path=`note-attachments/${familyIdForPath||"general"}/${Date.now()}_${Math.random().toString(36).slice(2,8)}_${file.name.replace(/\s+/g,"_")}`;
    const{error:uploadError}=await sb.storage.from("documents").upload(path,file,{upsert:false});
    if(uploadError)throw new Error(uploadError.message);
    const{error:dbError}=await sb.from("note_attachments").insert({note_id:noteId,name:file.name,category:category||"General",file_path:path,file_size:file.size,file_type:file.type||ext});
    if(dbError)throw new Error(dbError.message);
  };
  const add=async()=>{
    if(!body.trim())return;
    setSaving(true);
    const{data:noteRow,error}=await sb.from("notes").insert({body,contact_id:cid||null,family_id:fid||null}).select().single();
    if(error){toast(error.message,"error");setSaving(false);return;}
    if(pendingFiles.length>0&&noteRow){
      try{
        for(const pf of pendingFiles){await uploadAttachment(noteRow.id,pf.file,pf.category,fid);}
        toast(`Note added with ${pendingFiles.length} attachment${pendingFiles.length>1?"s":""}`);
      }catch(e){toast("Note saved but attachment failed: "+e.message,"error");}
    }else{
      toast("Note added");
    }
    setBody("");setPendingFiles([]);setSaving(false);
    reload("notes");reload("note_attachments");
  };
  const del=async id=>{const{error}=await sb.from("notes").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("notes");reload("note_attachments");}};
  const saveEdit=async id=>{if(!editBody.trim())return;const{error}=await sb.from("notes").update({body:editBody}).eq("id",id);if(error)toast(error.message,"error");else{toast("Note updated");setEditId(null);setEditBody("");reload("notes");}};
  const download=async(att)=>{
    const{data,error}=await sb.storage.from("documents").createSignedUrl(att.filePath,300,{download:att.name||true});
    if(error){toast(error.message,"error");return;}
    const a=document.createElement("a");a.href=data.signedUrl;a.download=att.name||"file";document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  const delAtt=async(att)=>{
    await sb.storage.from("documents").remove([att.filePath]);
    const{error}=await sb.from("note_attachments").delete().eq("id",att.id);
    if(error)toast(error.message,"error");else{toast("Attachment removed");reload("note_attachments");}
  };
  const attachToExisting=async(noteId,file,category,famId)=>{
    try{await uploadAttachment(noteId,file,category,famId);toast("File attached");reload("note_attachments");}
    catch(e){toast(e.message,"error");}
  };
  const filtered=notes.filter(n=>{
    if(advisorFilter&&(advisorOfNote(n)?.email||"")!==advisorFilter)return false;
    if(prospectMode&&userProfile?.role!=="admin"&&(advisorOfNote(n)?.email||"").toLowerCase()!==(userProfile?.email||"").toLowerCase())return false;
    if(!prospectMode&&cmAdvScope&&(gf(n.familyId)?.advisorEmail||"").toLowerCase()!==cmAdvScope)return false;
    return n.body.toLowerCase().includes(search.toLowerCase())||(gc(n.contactId)?.name||"").toLowerCase().includes(search.toLowerCase())||(gf(n.familyId)?.name||"").toLowerCase().includes(search.toLowerCase());
  });
  if(adminProspect&&viewMode==="advisors"){
    return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
          {[{k:"notes",l:"Notes"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
        </div>
        <div style={{flex:1,fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Notes by Advisor</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {advisorSummary.length===0&&<Empty text="No advisors or notes yet."/>}
          {advisorSummary.map(a=>(
            <div key={a.email||"unassigned"} onClick={()=>{if(!a.unassigned){setAdvisorFilter(a.email);setViewMode("notes");}}}
              style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${a.unassigned?B.textMute:B.gold}`,padding:20,cursor:a.unassigned?"default":"pointer",boxShadow:B.shadow,transition:"box-shadow .15s"}}
              onMouseEnter={e=>{if(!a.unassigned)e.currentTarget.style.boxShadow=B.shadowMd;}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=B.shadow}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:a.unassigned?B.textMute:B.navy,fontWeight:600,marginBottom:2}}>{a.name}</div>
                <div style={{fontSize:12,color:B.textSoft}}>{a.email||"Notes not linked to an advisor's contact"}</div>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,${a.unassigned?B.textMute:B.gold},transparent)`,marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Notes",v:a.notes},{l:"Contacts",v:a.contacts}].map(item=>(
                  <div key={item.l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{item.l}</div>
                    <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600}}>{item.v}</div>
                  </div>
                ))}
              </div>
              {!a.unassigned&&<div style={{marginTop:10,fontSize:12,color:B.gold,fontWeight:600}}>View notes →</div>}
            </div>
          ))}
        </div>
      </div>
    </div>;
  }

  return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    {adminProspect&&<div style={{padding:"10px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
        {[{k:"notes",l:"Notes"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
      </div>
      {advisorFilter&&<button onClick={()=>setAdvisorFilter("")} style={{border:`1px solid ${B.gold}`,background:"#fbf6ec",color:B.navy,borderRadius:16,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{(advisorSummary.find(a=>a.email===advisorFilter)?.name)||advisorFilter} ✕</button>}
    </div>}
    {!prospectMode&&userProfile?.role==="admin"&&<div style={{padding:"10px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
      <AdvisorScopeBar userProfile={userProfile} value={cmAdvScope} onChange={setCmAdvScope}/>
      {cmAdvScope&&<span style={{fontSize:12,color:B.textSoft}}>Showing notes for this advisor's families</span>}
    </div>}
    <div style={{padding:isMobile?"14px 14px":"20px 28px",borderBottom:`1px solid ${B.borderLight}`,background:B.white}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{background:B.bg,border:`1px solid ${B.border}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write a note or activity log entry…" style={{width:"100%",minHeight:88,background:"transparent",border:"none",padding:"14px 16px",color:B.text,fontSize:14,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}/>
          {pendingFiles.length>0&&<div style={{padding:"8px 14px",borderTop:`1px solid ${B.borderLight}`,background:"#f9f7f3"}}>
            <div style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Attachments ({pendingFiles.length})</div>
            {pendingFiles.map((pf,idx)=><div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:idx===pendingFiles.length-1?"none":`1px solid ${B.borderLight}`,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:B.navy,fontWeight:600,flex:"1 1 200px",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {pf.file.name}</span>
              <span style={{fontSize:11,color:B.textSoft}}>{(pf.file.size/1024).toFixed(1)}KB</span>
              <select value={pf.category} onChange={e=>{const next=[...pendingFiles];next[idx]={...next[idx],category:e.target.value};setPendingFiles(next);}} style={{...inp,padding:"4px 8px",fontSize:12,width:"auto",height:"auto"}}>
                {DOC_CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
              <button onClick={()=>setPendingFiles(pendingFiles.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}}>✕</button>
            </div>)}
          </div>}
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 14px",borderTop:`1px solid ${B.borderLight}`,background:B.white,flexWrap:"wrap"}}>
            <select value={fid} onChange={e=>setFid(e.target.value)} style={{...inp,flex:1,minWidth:130,padding:"6px 10px",fontSize:13}}><option value="">🏠 Family</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select value={cid} onChange={e=>setCid(e.target.value)} style={{...inp,flex:1,minWidth:130,padding:"6px 10px",fontSize:13}}><option value="">👤 Contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:6,cursor:"pointer",fontSize:12,color:B.navy,fontWeight:600,flexShrink:0}}>
              📎 Attach
              <input type="file" multiple onChange={e=>{
                const files=Array.from(e.target.files||[]);
                if(files.length===0)return;
                setPendingFiles([...pendingFiles,...files.map(f=>({file:f,category:"General"}))]);
                e.target.value="";
              }} style={{display:"none"}}/>
            </label>
            <Btn onClick={add} disabled={saving||!body.trim()}>{saving?"Saving…":`Log Note${pendingFiles.length>0?` + ${pendingFiles.length}`:""}`}</Btn>
          </div>
        </div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px 14px":"20px 28px"}}>
      <div style={{maxWidth:800,margin:"0 auto"}}>
        <div style={{marginBottom:14,position:"relative"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search notes…" style={{...inp,padding:"9px 14px",boxShadow:B.shadow}}/>
        </div>
        {filtered.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:B.textMute}}><div style={{fontSize:32,marginBottom:12}}>📝</div>No notes yet.</div>}
        {filtered.map(n=>{
          const contact=gc(n.contactId);const fam=gf(n.familyId);
          const atts=noteAttachments.filter(a=>a.noteId===n.id);
          return <div key={n.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,marginBottom:12,boxShadow:B.shadow,overflow:"hidden"}}>
            <div style={{height:3,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`}}/>
            <div style={{padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:8}}>
                {editId===n.id
                  ? <div style={{flex:1}}>
                      <textarea value={editBody} onChange={e=>setEditBody(e.target.value)} autoFocus style={{width:"100%",minHeight:80,background:B.bg,border:`1px solid ${B.border}`,borderRadius:8,padding:"10px 12px",color:B.text,fontSize:14,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.65,boxSizing:"border-box"}}/>
                      <div style={{display:"flex",gap:8,marginTop:8}}>
                        <Btn small onClick={()=>saveEdit(n.id)} disabled={!editBody.trim()}>Save</Btn>
                        <Btn small variant="ghost" onClick={()=>{setEditId(null);setEditBody("");}}>Cancel</Btn>
                      </div>
                    </div>
                  : <p style={{margin:0,color:B.text,fontSize:14,lineHeight:1.7,flex:1,whiteSpace:"pre-wrap"}}>{n.body}</p>}
                {editId!==n.id&&<div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>{setEditId(n.id);setEditBody(n.body);}} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}} title="Edit note">✎</button>
                  <button onClick={()=>del(n.id)} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:14}} title="Delete note">✕</button>
                </div>}
              </div>
              {atts.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${B.borderLight}`}}>
                {atts.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",flexWrap:"wrap"}}>
                  <span style={{fontSize:13,color:B.navy,fontWeight:600,flex:"1 1 200px",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {a.name}</span>
                  <span style={{background:"#e8f0f8",color:B.navyMid,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{a.category}</span>
                  {a.fileSize&&<span style={{fontSize:10,color:B.textSoft}}>{(a.fileSize/1024).toFixed(1)}KB</span>}
                  <button onClick={()=>download(a)} style={{background:"none",border:`1px solid ${B.border}`,color:B.navy,cursor:"pointer",fontSize:11,padding:"3px 10px",borderRadius:6,fontFamily:"inherit"}}>↓ Download</button>
                  <button onClick={()=>{if(confirm("Remove this attachment?"))delAtt(a);}} style={{background:"none",border:"none",color:B.textMute,cursor:"pointer",fontSize:13}}>✕</button>
                </div>)}
              </div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:B.textMute}}>🕐 {fmt(n.createdAt)}</span>
                  {fam&&<span style={{background:"#e8f0f8",color:B.navyMid,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>🏠 {fam.name}</span>}
                  {contact&&<span style={{background:"#fef3e2",color:"#8a5c00",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>👤 {contact.name}</span>}
                </div>
                <label style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",background:"transparent",border:`1px dashed ${B.border}`,borderRadius:6,cursor:"pointer",fontSize:11,color:B.textSoft}}>
                  📎 Add file
                  <input type="file" onChange={e=>{
                    const file=e.target.files&&e.target.files[0];
                    if(!file)return;
                    const category=prompt("Category for this file?\n\nOptions: "+DOC_CATEGORIES.join(", "),"General");
                    if(!category){e.target.value="";return;}
                    const cat=DOC_CATEGORIES.includes(category)?category:"General";
                    attachToExisting(n.id,file,cat,n.familyId);
                    e.target.value="";
                  }} style={{display:"none"}}/>
                </label>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

// ── TASKS VIEW ────────────────────────────────────────────────────────────────
function TasksView({data,reload,toast,userProfile,prospectMode=false}){
  const{contacts,families,tasks}=data;
  const[modal,setModal]=useState(null);const[filter,setFilter]=useState("Pending");const[filterFamily,setFilterFamily]=useState("all");
  const adminProspect=prospectMode&&userProfile?.role==="admin";
  const[viewMode,setViewMode]=useState("tasks");
  const[advisorFilter,setAdvisorFilter]=useState("");
  const[advisors,setAdvisors]=useState([]);
  useEffect(()=>{if(adminProspect){sb.from("user_profiles").select("id,email,full_name,role").in("role",["advisor","admin"]).then(({data:rows,error})=>{if(!error&&rows)setAdvisors(rows);});}},[adminProspect]);
  const advisorOfTask=t=>{const c=contacts.find(x=>x.id===t.contactId);return c&&c.advisorEmail?{email:c.advisorEmail,name:c.advisorName||c.advisorEmail}:null;};
  const gc=id=>contacts.find(c=>c.id===id);const gf=id=>families.find(f=>f.id===id);
  const[cmAdvScope,setCmAdvScope]=useState("");
  const list=tasks.filter(t=>(filter==="All"||(filter==="Pending"?!t.done:t.done))&&(filterFamily==="all"||t.familyId===filterFamily)&&(!advisorFilter||(advisorOfTask(t)?.email||"")===advisorFilter)&&(prospectMode||!cmAdvScope||(gf(t.familyId)?.advisorEmail||"").toLowerCase()===cmAdvScope)&&(!prospectMode||userProfile?.role==="admin"||(advisorOfTask(t)?.email||"").toLowerCase()===(userProfile?.email||"").toLowerCase()));
  const oc=tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
  const soon=tasks.filter(t=>!t.done&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30&&new Date(t.dueDate)>=new Date()).length;
  const advisorSummary=useMemo(()=>{
    const groups={};const now=new Date();
    tasks.forEach(t=>{
      const c=contacts.find(x=>x.id===t.contactId);
      const adv=c&&c.advisorEmail?{email:c.advisorEmail,name:c.advisorName||c.advisorEmail}:null;
      const key=adv?adv.email:"__unassigned__";
      if(!groups[key])groups[key]={email:adv?adv.email:"",name:adv?adv.name:"Unassigned",unassigned:!adv,open:0,overdue:0,done:0};
      if(t.done)groups[key].done+=1;
      else{groups[key].open+=1;if(t.dueDate&&new Date(t.dueDate)<now)groups[key].overdue+=1;}
    });
    advisors.forEach(a=>{if(!groups[a.email])groups[a.email]={email:a.email,name:a.full_name||a.email,unassigned:false,open:0,overdue:0,done:0};});
    return Object.values(groups).sort((a,b)=>(b.open-a.open)||(b.overdue-a.overdue));
  },[tasks,contacts,advisors]);

  const add=async f=>{const{error}=await sb.from("tasks").insert({family_id:f.familyId||null,contact_id:f.contactId||null,title:f.title,due_date:f.dueDate||null,priority:f.priority,reminder_days:Number(f.reminderDays)||7,done:false,recurrence:f.recurrence||null,recurrence_interval:f.recurrence==="Custom"?(Number(f.recurrenceInterval)||1):null,recurrence_unit:f.recurrence==="Custom"?(f.recurrenceUnit||"week"):null});if(error)toast(error.message,"error");else{toast("Task added");reload("tasks");}};
  const tog=async t=>{const{error}=await sb.from("tasks").update({done:!t.done}).eq("id",t.id);if(error){toast(error.message,"error");return;}if(!t.done&&t.recurrence){const nd=nextRecurrence(t.dueDate,t.recurrence,t.recurrenceInterval,t.recurrenceUnit);if(nd){await sb.from("tasks").insert({family_id:t.familyId||null,contact_id:t.contactId||null,title:t.title,due_date:nd,priority:t.priority,reminder_days:t.reminderDays||7,done:false,recurrence:t.recurrence,recurrence_interval:t.recurrence==="Custom"?(t.recurrenceInterval||1):null,recurrence_unit:t.recurrence==="Custom"?(t.recurrenceUnit||"week"):null});toast("Next occurrence: "+fmt(nd));}}reload("tasks");};
  const del=async id=>{const{error}=await sb.from("tasks").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("tasks");}};


  if(adminProspect&&viewMode==="advisors"){
    return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
          {[{k:"tasks",l:"Tasks"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
        </div>
        <div style={{flex:1,fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Tasks by Advisor</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {advisorSummary.length===0&&<Empty text="No advisors or tasks yet."/>}
          {advisorSummary.map(a=>(
            <div key={a.email||"unassigned"} onClick={()=>{if(!a.unassigned){setAdvisorFilter(a.email);setViewMode("tasks");}}}
              style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${a.unassigned?B.textMute:B.gold}`,padding:20,cursor:a.unassigned?"default":"pointer",boxShadow:B.shadow,transition:"box-shadow .15s"}}
              onMouseEnter={e=>{if(!a.unassigned)e.currentTarget.style.boxShadow=B.shadowMd;}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=B.shadow}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:a.unassigned?B.textMute:B.navy,fontWeight:600,marginBottom:2}}>{a.name}</div>
                <div style={{fontSize:12,color:B.textSoft}}>{a.email||"Tasks not linked to an advisor's contact"}</div>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,${a.unassigned?B.textMute:B.gold},transparent)`,marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[{l:"Open",v:a.open},{l:"Overdue",v:a.overdue},{l:"Done",v:a.done}].map(item=>(
                  <div key={item.l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{item.l}</div>
                    <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",color:item.l==="Overdue"&&a.overdue>0?"#8b1a1a":B.navy,fontWeight:600}}>{item.v}</div>
                  </div>
                ))}
              </div>
              {!a.unassigned&&<div style={{marginTop:10,fontSize:12,color:B.gold,fontWeight:600}}>View tasks →</div>}
            </div>
          ))}
        </div>
      </div>
    </div>;
  }

  return <div style={{maxWidth:760,margin:"0 auto",padding:"20px",height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
      {adminProspect&&<div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
        {[{k:"tasks",l:"Tasks"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"5px 11px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
      </div>}
      {adminProspect&&advisorFilter&&<button onClick={()=>setAdvisorFilter("")} style={{border:`1px solid ${B.gold}`,background:"#fbf6ec",color:B.navy,borderRadius:16,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{(advisorSummary.find(a=>a.email===advisorFilter)?.name)||advisorFilter} ✕</button>}
      <div style={{display:"flex",gap:5}}>{["Pending","Done","All"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?B.navy:"transparent",border:`1px solid ${filter===s?B.navy:B.border}`,color:filter===s?B.white:B.textSoft,borderRadius:20,padding:"4px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}</div>
      <Sel value={filterFamily} onChange={e=>setFilterFamily(e.target.value)} style={{width:170}}><option value="all">All Families</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Sel>
      {!prospectMode&&<AdvisorScopeBar userProfile={userProfile} value={cmAdvScope} onChange={setCmAdvScope}/>}
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
              {t.recurrence&&<span style={{color:B.gold,fontWeight:600}}>↻ {recurLabel(t)}</span>}
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
  const[f,setF]=useState(initial||{familyId:"",contactId:"",title:"",dueDate:"",priority:"Medium",reminderDays:7,done:false,recurrence:"",recurrenceInterval:1,recurrenceUnit:"week"});
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
    <RecurrenceField f={f} setF={setF}/>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Task"}</Btn></div>
  </div>;
}

// ── PROSPECT VIEWS ────────────────────────────────────────────────────────────
function ProspectContactForm({initial,onSave,onClose,userProfile,advisors=[]}){
  const isAdmin=userProfile?.role==="admin";
  const[f,setF]=useState(initial||{name:"",company:"",email:"",phone:"",type:"Individual",tags:"",source:"",
    advisorName:isAdmin?"":(userProfile?.fullName||""),advisorEmail:isAdmin?"":(userProfile?.email||"")});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const pickAdvisor=e=>{const email=e.target.value;const adv=advisors.find(a=>a.email===email);setF(p=>({...p,advisorEmail:email,advisorName:adv?(adv.full_name||""):""}));};
  const save=async()=>{if(!f.name.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Grid2><Field label="Full Name"><Inp placeholder="Jane Smith" value={f.name} onChange={set("name")}/></Field><Field label="Company"><Inp value={f.company||""} onChange={set("company")}/></Field></Grid2>
    <Grid2><Field label="Email"><Inp type="email" value={f.email||""} onChange={set("email")}/></Field><Field label="Phone"><Inp value={f.phone||""} onChange={set("phone")}/></Field></Grid2>
    <Grid2><Field label="Type"><Sel value={f.type} onChange={set("type")}><option>Individual</option><option>Business</option></Sel></Field><Field label="Lead Source"><Inp placeholder="Referral, LinkedIn…" value={f.source||""} onChange={set("source")}/></Field></Grid2>
    {isAdmin
      ? <Field label="Assign Advisor">
          <select value={f.advisorEmail||""} onChange={pickAdvisor} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",background:B.white,color:B.navy}}>
            <option value="">— Select an advisor —</option>
            {advisors.map(a=><option key={a.id} value={a.email}>{(a.full_name||a.email)}{a.full_name?` (${a.email})`:""}</option>)}
          </select>
        </Field>
      : <Field label="Advisor"><Inp value={f.advisorName||f.advisorEmail||userProfile?.fullName||userProfile?.email||""} disabled/></Field>
    }
    <Field label="Tags"><Inp placeholder="warm-lead, vip" value={f.tags||""} onChange={set("tags")}/></Field>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

function ProspectContactsView({data,reload,toast,userProfile}){
  const isMobile=useIsMobile();
  const isAdmin=userProfile?.role==="admin";
  const prospects=data.contacts.filter(c=>!c.familyId&&(isAdmin||(c.advisorEmail||"").toLowerCase()===(userProfile?.email||"").toLowerCase()));
  const[modal,setModal]=useState(null);const[search,setSearch]=useState("");const[selected,setSelected]=useState(null);
  const[viewMode,setViewMode]=useState("contacts"); // admin only: "contacts" | "advisors"
  const[advisorFilter,setAdvisorFilter]=useState("");
  const[advisors,setAdvisors]=useState([]);
  useEffect(()=>{
    if(isAdmin){
      sb.from("user_profiles").select("id,email,full_name,role").in("role",["advisor","admin"]).then(({data:rows,error})=>{if(!error&&rows)setAdvisors(rows);});
    }
  },[isAdmin]);
  const filtered=useMemo(()=>prospects.filter(c=>{
    if(advisorFilter&&(c.advisorEmail||"")!==advisorFilter)return false;
    return [c.name,c.company,c.email,c.tags].join(" ").toLowerCase().includes(search.toLowerCase());
  }),[prospects,search,advisorFilter]);
  const advisorSummary=useMemo(()=>{
    const dealsFor=id=>data.deals.filter(d=>!d.familyId&&d.contactId===id);
    const groups={};
    prospects.forEach(c=>{
      const key=c.advisorEmail||"__unassigned__";
      if(!groups[key])groups[key]={email:c.advisorEmail||"",name:c.advisorName||"Unassigned",unassigned:!c.advisorEmail,prospects:0,openDeals:0,pipeline:0,won:0};
      groups[key].prospects+=1;
      dealsFor(c.id).forEach(d=>{
        if(d.stage==="Closed Won")groups[key].won+=1;
        else if(d.stage!=="Closed Lost"){groups[key].openDeals+=1;groups[key].pipeline+=Number(d.value)||0;}
      });
    });
    advisors.forEach(a=>{if(!groups[a.email])groups[a.email]={email:a.email,name:a.full_name||a.email,unassigned:false,prospects:0,openDeals:0,pipeline:0,won:0};});
    return Object.values(groups).sort((a,b)=>(b.pipeline-a.pipeline)||(b.prospects-a.prospects));
  },[prospects,data.deals,advisors]);
  const add=async f=>{const{error}=await sb.from("contacts").insert({family_id:null,name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null,advisor_email:f.advisorEmail||null,advisor_name:f.advisorName||null});if(error)toast(error.message,"error");else{toast("Contact added");reload("contacts");}};
  const edit=async f=>{const{error}=await sb.from("contacts").update({name:f.name,company:f.company||null,email:f.email||null,phone:f.phone||null,type:f.type,tags:f.tags||null,advisor_email:f.advisorEmail||null,advisor_name:f.advisorName||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("contacts");setSelected({...selected,...f});}};
  const del=async id=>{const{error}=await sb.from("contacts").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("contacts");if(selected?.id===id)setSelected(null);}};

  if(isAdmin&&viewMode==="advisors"){
    return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
      <div style={{padding:isMobile?"12px 14px":"14px 20px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
          {[{k:"contacts",l:"Contacts"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"7px 14px",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
        </div>
        <div style={{flex:1,fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Prospecting by Advisor</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
          {advisorSummary.length===0&&<Empty text="No advisors or prospects yet."/>}
          {advisorSummary.map(a=>(
            <div key={a.email||"unassigned"} onClick={()=>{if(!a.unassigned){setAdvisorFilter(a.email);setViewMode("contacts");}}}
              style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${a.unassigned?B.textMute:B.gold}`,padding:20,cursor:a.unassigned?"default":"pointer",boxShadow:B.shadow,transition:"box-shadow .15s"}}
              onMouseEnter={e=>{if(!a.unassigned)e.currentTarget.style.boxShadow=B.shadowMd;}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=B.shadow}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:a.unassigned?B.textMute:B.navy,fontWeight:600,marginBottom:2}}>{a.name}</div>
                <div style={{fontSize:12,color:B.textSoft}}>{a.email||"Prospects with no advisor assigned"}</div>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,${a.unassigned?B.textMute:B.gold},transparent)`,marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Prospects",v:a.prospects},{l:"Open Deals",v:a.openDeals},{l:"Pipeline $",v:fmtMoney(a.pipeline)},{l:"Won",v:a.won}].map(item=>(
                  <div key={item.l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{item.l}</div>
                    <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600}}>{item.v}</div>
                  </div>
                ))}
              </div>
              {!a.unassigned&&<div style={{marginTop:10,fontSize:12,color:B.gold,fontWeight:600}}>View prospects →</div>}
            </div>
          ))}
        </div>
      </div>
      {modal==="add"&&<Modal title="New Prospect" onClose={()=>setModal(null)}><ProspectContactForm userProfile={userProfile} advisors={advisors} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    </div>;
  }

  const cDeals=selected?data.deals.filter(d=>d.contactId===selected.id):[];
  const cNotes=selected?data.notes.filter(n=>n.contactId===selected.id):[];
  return <div style={{display:"flex",height:"100%",minHeight:0}}>
    {(!isMobile||!selected)&&<div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",borderRight:isMobile?"none":`1px solid ${B.borderLight}`}}>
      <div style={{padding:isMobile?"12px 14px":"14px 20px",display:"flex",gap:10,alignItems:"center",borderBottom:`1px solid ${B.borderLight}`,background:B.white,flexWrap:"wrap"}}>
        {isAdmin&&<div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
          {[{k:"contacts",l:"Contacts"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
        </div>}
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search prospects…" style={{flex:1,minWidth:140}}/>
        {advisorFilter&&<button onClick={()=>setAdvisorFilter("")} style={{border:`1px solid ${B.gold}`,background:"#fbf6ec",color:B.navy,borderRadius:16,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{(advisorSummary.find(a=>a.email===advisorFilter)?.name)||advisorFilter} ✕</button>}
        <Btn onClick={()=>setModal("add")}>+ New</Btn>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {filtered.length===0&&<Empty text="No prospect contacts yet."/>}
        {filtered.map(c=><div key={c.id} onClick={()=>setSelected(c)} style={{padding:isMobile?"14px 14px":"13px 20px",cursor:"pointer",borderBottom:`1px solid ${B.borderLight}`,background:selected?.id===c.id?B.bg:B.white}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
            <div style={{minWidth:0}}><div style={{fontWeight:700,color:B.navy,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div><div style={{fontSize:12,color:B.textSoft,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.company||c.email||"—"}</div></div>
            <Badge scheme={c.type==="Business"?{bg:"#e8f0f8",text:B.navyMid,dot:B.navyMid}:{bg:"#f3edf7",text:"#5c2d91",dot:"#8b5cf6"}}>{c.type}</Badge>
          </div>
        </div>)}
      </div>
    </div>}
    {selected?<div style={{width:isMobile?"100%":360,padding:isMobile?16:22,overflowY:"auto",flexShrink:0,background:B.bg}}>
      {isMobile&&<button onClick={()=>setSelected(null)} style={{background:"none",border:`1px solid ${B.border}`,color:B.textSoft,cursor:"pointer",fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:6,marginBottom:14}}>← Back</button>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:10}}>
        <div style={{minWidth:0}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.name}</div><div style={{fontSize:12,color:B.textSoft}}>{selected.company}</div></div>
        <div style={{display:"flex",gap:6,flexShrink:0}}><Btn small variant="ghost" onClick={()=>setModal(selected)}>Edit</Btn><Btn small variant="danger" onClick={()=>del(selected.id)}>Delete</Btn></div>
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${B.gold},transparent)`,marginBottom:12}}/>
      {selected.email&&<IRow label="Email" value={selected.email}/>}
      {selected.phone&&<IRow label="Phone" value={selected.phone}/>}
      {selected.tags&&<IRow label="Tags" value={selected.tags}/>}
      <SectionLabel>Deals ({cDeals.length})</SectionLabel>
      {cDeals.length===0?<Empty text="No deals"/>:cDeals.map(d=><div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><span style={{fontSize:13}}>{d.title}</span><Badge scheme={STAGE_COLORS[d.stage]}>{d.stage}</Badge></div>)}
      <SectionLabel>Notes ({cNotes.length})</SectionLabel>
      {cNotes.length===0?<Empty text="No notes"/>:cNotes.slice(0,3).map(n=><div key={n.id} style={{padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}><div style={{fontSize:13,color:B.textMid}}>{n.body}</div><div style={{fontSize:11,color:B.textMute,marginTop:2}}>{fmt(n.createdAt)}</div></div>)}
    </div>:(!isMobile&&<div style={{width:360,display:"flex",alignItems:"center",justifyContent:"center",color:B.textMute,fontSize:13,background:B.bg}}>Select a contact</div>)}
    {modal==="add"&&<Modal title="New Prospect" onClose={()=>setModal(null)}><ProspectContactForm userProfile={userProfile} advisors={advisors} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Contact" onClose={()=>setModal(null)}><ProspectContactForm initial={modal} userProfile={userProfile} advisors={advisors} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

function ProspectDealForm({initial,contacts=[],onSave,onClose,userProfile,advisors=[]}){
  const isAdmin=userProfile?.role==="admin";
  const[f,setF]=useState(initial||{contactId:"",title:"",value:"",stage:"Lead",closeDate:"",
    advisorName:isAdmin?"":(userProfile?.fullName||""),advisorEmail:isAdmin?"":(userProfile?.email||"")});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const pickAdvisor=e=>{const email=e.target.value;const adv=advisors.find(a=>a.email===email);setF(p=>({...p,advisorEmail:email,advisorName:adv?(adv.full_name||""):""}));};
  const save=async()=>{if(!f.title.trim())return;setSaving(true);await onSave(f);onClose();};
  return <div>
    <Field label="Opportunity Title"><Inp value={f.title} onChange={set("title")}/></Field>
    <Field label="Contact"><Sel value={f.contactId||""} onChange={set("contactId")}><option value="">— None —</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Field>
    <Grid2><Field label="Value ($)"><MoneyInput value={f.value||""} onChange={set("value")}/></Field><Field label="Close Date"><Inp type="date" value={f.closeDate||""} onChange={set("closeDate")}/></Field></Grid2>
    <Field label="Stage"><Sel value={f.stage} onChange={set("stage")}>{STAGES.map(s=><option key={s}>{s}</option>)}</Sel></Field>
    {isAdmin
      ? <Field label="Assign Advisor">
          <select value={f.advisorEmail||""} onChange={pickAdvisor} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",background:B.white,color:B.navy}}>
            <option value="">— Select an advisor —</option>
            {advisors.map(a=><option key={a.id} value={a.email}>{(a.full_name||a.email)}{a.full_name?` (${a.email})`:""}</option>)}
          </select>
        </Field>
      : <Field label="Advisor"><Inp value={f.advisorName||f.advisorEmail||userProfile?.fullName||userProfile?.email||""} disabled/></Field>
    }
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:10}}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn></div>
  </div>;
}

function ProspectPipelineView({data,reload,toast,userProfile}){
  const isAdmin=userProfile?.role==="admin";
  const allContacts=data.contacts.filter(c=>!c.familyId);
  const contacts=allContacts;
  const[modal,setModal]=useState(null);const[fs,setFs]=useState("All");
  const[viewMode,setViewMode]=useState("pipeline"); // admin only: "pipeline" | "advisors"
  const[advisorFilter,setAdvisorFilter]=useState("");
  const[advisors,setAdvisors]=useState([]);
  useEffect(()=>{if(isAdmin){sb.from("user_profiles").select("id,email,full_name,role").in("role",["advisor","admin"]).then(({data:rows,error})=>{if(!error&&rows)setAdvisors(rows);});}},[isAdmin]);
  const advisorOf=d=>{if(d.advisorEmail)return{email:d.advisorEmail,name:d.advisorName||d.advisorEmail};const c=allContacts.find(x=>x.id===d.contactId);return c&&c.advisorEmail?{email:c.advisorEmail,name:c.advisorName||c.advisorEmail}:null;};
  const myEmail=(userProfile?.email||"").toLowerCase();
  // Visibility is authoritative on the deal's OWN advisor stamp — no live contact fallback, which leaked legacy/contact-derived deals across advisors. Admin still sees all.
  const allDeals=data.deals.filter(d=>!d.familyId).filter(d=>isAdmin||(d.advisorEmail||"").toLowerCase()===myEmail);
  const deals=allDeals.filter(d=>!advisorFilter||(advisorOf(d)?.email||"")===advisorFilter);
  const filtered=useMemo(()=>deals.filter(d=>fs==="All"||d.stage===fs),[deals,fs]);
  const byStage=STAGES.reduce((acc,s)=>({...acc,[s]:filtered.filter(d=>d.stage===s)}),{});
  const pipeline=deals.filter(d=>d.stage!=="Closed Lost").reduce((s,d)=>s+(Number(d.value)||0),0);
  const gc=id=>allContacts.find(c=>c.id===id);
  const advisorSummary=useMemo(()=>{
    const groups={};
    allDeals.forEach(d=>{
      const c=allContacts.find(x=>x.id===d.contactId);
      const adv=d.advisorEmail?{email:d.advisorEmail,name:d.advisorName||d.advisorEmail}:(c&&c.advisorEmail?{email:c.advisorEmail,name:c.advisorName||c.advisorEmail}:null);
      const key=adv?adv.email:"__unassigned__";
      if(!groups[key])groups[key]={email:adv?adv.email:"",name:adv?adv.name:"Unassigned",unassigned:!adv,deals:0,openDeals:0,pipeline:0,won:0,lost:0};
      groups[key].deals+=1;
      if(d.stage==="Closed Won")groups[key].won+=1;
      else if(d.stage==="Closed Lost")groups[key].lost+=1;
      else{groups[key].openDeals+=1;groups[key].pipeline+=Number(d.value)||0;}
    });
    advisors.forEach(a=>{if(!groups[a.email])groups[a.email]={email:a.email,name:a.full_name||a.email,unassigned:false,deals:0,openDeals:0,pipeline:0,won:0,lost:0};});
    return Object.values(groups).sort((a,b)=>(b.pipeline-a.pipeline)||(b.openDeals-a.openDeals));
  },[allDeals,allContacts,advisors]);

  const add=async f=>{const{error}=await sb.from("deals").insert({family_id:null,contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null,advisor_email:f.advisorEmail||null,advisor_name:f.advisorName||null});if(error)toast(error.message,"error");else{toast("Opportunity added");reload("deals");}};
  const edit=async f=>{const{error}=await sb.from("deals").update({contact_id:f.contactId||null,title:f.title,value:f.value||null,stage:f.stage,close_date:f.closeDate||null,advisor_email:f.advisorEmail||null,advisor_name:f.advisorName||null}).eq("id",modal.id);if(error)toast(error.message,"error");else{toast("Updated");reload("deals");}};
  const del=async id=>{const{error}=await sb.from("deals").delete().eq("id",id);if(error)toast(error.message,"error");else{toast("Deleted");reload("deals");}};
  const move=async(deal,dir)=>{const idx=STAGES.indexOf(deal.stage);const next=STAGES[idx+dir];if(!next)return;const{error}=await sb.from("deals").update({stage:next}).eq("id",deal.id);if(error)toast(error.message,"error");else reload("deals");};

  if(isAdmin&&viewMode==="advisors"){
    return <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",background:B.white}}>
        <div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
          {[{k:"pipeline",l:"Pipeline"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
        </div>
        <div style={{flex:1,fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:600}}>Pipeline by Advisor</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
          {advisorSummary.length===0&&<Empty text="No advisors or deals yet."/>}
          {advisorSummary.map(a=>(
            <div key={a.email||"unassigned"} onClick={()=>{if(!a.unassigned){setAdvisorFilter(a.email);setViewMode("pipeline");}}}
              style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,borderTop:`3px solid ${a.unassigned?B.textMute:B.gold}`,padding:20,cursor:a.unassigned?"default":"pointer",boxShadow:B.shadow,transition:"box-shadow .15s"}}
              onMouseEnter={e=>{if(!a.unassigned)e.currentTarget.style.boxShadow=B.shadowMd;}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=B.shadow}>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:a.unassigned?B.textMute:B.navy,fontWeight:600,marginBottom:2}}>{a.name}</div>
                <div style={{fontSize:12,color:B.textSoft}}>{a.email||"Opportunities not linked to an advisor's contact"}</div>
              </div>
              <div style={{height:1,background:`linear-gradient(90deg,${a.unassigned?B.textMute:B.gold},transparent)`,marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Open Opps",v:a.openDeals},{l:"Pipeline $",v:fmtMoney(a.pipeline)},{l:"Won",v:a.won},{l:"Lost",v:a.lost}].map(item=>(
                  <div key={item.l} style={{background:B.bg,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{item.l}</div>
                    <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600}}>{item.v}</div>
                  </div>
                ))}
              </div>
              {!a.unassigned&&<div style={{marginTop:10,fontSize:12,color:B.gold,fontWeight:600}}>View pipeline →</div>}
            </div>
          ))}
        </div>
      </div>
      {modal==="add"&&<Modal title="New Opportunity" onClose={()=>setModal(null)}><ProspectDealForm contacts={contacts} userProfile={userProfile} advisors={advisors} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    </div>;
  }

  return <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
    <div style={{padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",background:B.white}}>
      {isAdmin&&<div style={{display:"flex",background:B.bg,borderRadius:8,padding:3,border:`1px solid ${B.borderLight}`}}>
        {[{k:"pipeline",l:"Pipeline"},{k:"advisors",l:"By Advisor"}].map(t=><button key={t.k} onClick={()=>setViewMode(t.k)} style={{border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:viewMode===t.k?B.navy:"transparent",color:viewMode===t.k?B.white:B.textSoft}}>{t.l}</button>)}
      </div>}
      <div style={{flex:1,display:"flex",gap:5,flexWrap:"wrap"}}>{["All",...STAGES].map(s=><button key={s} onClick={()=>setFs(s)} style={{background:fs===s?(STAGE_COLORS[s]?.bg||B.borderLight):"transparent",border:`1px solid ${fs===s?(STAGE_COLORS[s]?.dot||B.navy):B.border}`,color:fs===s?(STAGE_COLORS[s]?.text||B.navy):B.textSoft,borderRadius:20,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}</div>
      {advisorFilter&&<button onClick={()=>setAdvisorFilter("")} style={{border:`1px solid ${B.gold}`,background:"#fbf6ec",color:B.navy,borderRadius:16,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{(advisorSummary.find(a=>a.email===advisorFilter)?.name)||advisorFilter} ✕</button>}
      <div style={{fontSize:12,color:B.textSoft}}>Pipeline: <strong style={{color:B.navy}}>{fmtMoney(pipeline)}</strong></div>
      <Btn onClick={()=>setModal("add")}>+ New Opportunity</Btn>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
      {filtered.length===0&&<Empty text="No prospect opportunities yet."/>}
      {STAGES.map(stage=>{const list=byStage[stage];if(!list?.length)return null;return <div key={stage}>
        <div style={{padding:"8px 20px 3px",display:"flex",alignItems:"center",gap:7}}><span style={{width:7,height:7,borderRadius:"50%",background:STAGE_COLORS[stage].dot}}/><span style={{fontSize:11,fontWeight:800,color:STAGE_COLORS[stage].dot,letterSpacing:"0.1em",textTransform:"uppercase"}}>{stage}</span></div>
        {list.map(deal=>{const contact=gc(deal.contactId);return <div key={deal.id} style={{margin:"3px 20px",padding:"12px 15px",background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`3px solid ${STAGE_COLORS[deal.stage].dot}`,borderRadius:10,display:"flex",alignItems:"center",gap:10,boxShadow:B.shadow}}>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{deal.title}</div><div style={{fontSize:12,color:B.textSoft}}>{contact?contact.name:"No contact"}{deal.closeDate?` · ${fmt(deal.closeDate)}`:""}</div>{isAdmin&&<div style={{fontSize:11,color:deal.advisorEmail?B.gold:B.textMute,fontWeight:600,marginTop:2}}>{deal.advisorName||deal.advisorEmail||"Unassigned"}</div>}</div>
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
    {modal==="add"&&<Modal title="New Opportunity" onClose={()=>setModal(null)}><ProspectDealForm contacts={contacts} userProfile={userProfile} advisors={advisors} onSave={add} onClose={()=>setModal(null)}/></Modal>}
    {modal&&modal!=="add"&&<Modal title="Edit Opportunity" onClose={()=>setModal(null)}><ProspectDealForm initial={modal} contacts={contacts} userProfile={userProfile} advisors={advisors} onSave={edit} onClose={()=>setModal(null)}/></Modal>}
  </div>;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({data,userProfile}){
  const isMobile=useIsMobile();
  const{families:_families,contacts:_contacts,properties:_properties,deals:_deals,notes:_notes,tasks:_tasks,portfolio_accounts:_accts=[]}=data;
  const isAdmin=userProfile?.role==="admin";
  const myEmail=(userProfile?.email||"").toLowerCase();
  // Admins default to "All Advisors" and can switch; non-admins are locked to their own scope so unscoped prospect records (family_id null) don't leak in.
  const[scope,setScope]=useState(isAdmin?"":myEmail);
  const _famIds=new Set(_families.filter(f=>!scope||(f.advisorEmail||"").toLowerCase()===scope).map(f=>f.id));
  const _cAdv=id=>{const c=_contacts.find(x=>x.id===id);return (c?.advisorEmail||"").toLowerCase();};
  const families=scope?_families.filter(f=>(f.advisorEmail||"").toLowerCase()===scope):_families;
  const contacts=scope?_contacts.filter(c=>(c.advisorEmail||"").toLowerCase()===scope):_contacts;
  const properties=scope?_properties.filter(p=>_famIds.has(p.familyId)):_properties;
  const portfolio_accounts=scope?_accts.filter(a=>_famIds.has(a.familyId)):_accts;
  const notes=scope?_notes.filter(n=>n.familyId?_famIds.has(n.familyId):_cAdv(n.contactId)===scope):_notes;
  const tasks=scope?_tasks.filter(t=>t.familyId?_famIds.has(t.familyId):_cAdv(t.contactId)===scope):_tasks;
  const deals=scope?_deals.filter(d=>d.familyId?_famIds.has(d.familyId):((d.advisorEmail||"").toLowerCase()===scope)):_deals;
  const openDeals=deals.filter(d=>d.stage!=="Closed Lost"&&d.stage!=="Closed Won");
  const pipeline=openDeals.reduce((s,d)=>s+(Number(d.value)||0),0);
  const totalRE=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0)+(Number(p.secondMortgageBalance)||0),0)+portfolio_accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalPortfolio=portfolio_accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const pending=tasks.filter(t=>!t.done);
  const overdue=pending.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const dueSoon=pending.filter(t=>t.dueDate&&!overdue.includes(t)&&(new Date(t.dueDate)-new Date())/(86400000)<=30);
  const stageCounts=STAGES.map(s=>({stage:s,count:deals.filter(d=>d.stage===s).length,value:deals.filter(d=>d.stage===s).reduce((sum,d)=>sum+(Number(d.value)||0),0)}));
  const maxC=Math.max(1,...stageCounts.map(s=>s.count));
  const gf=id=>families.find(f=>f.id===id);
  const hr=new Date().getHours();

  return <div style={{overflowY:"auto",height:"100%",padding:isMobile?"18px 14px 32px":"26px 30px 48px"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:isMobile?16:24}}>
      <div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?22:28,color:B.navy,fontWeight:600,marginBottom:4}}>Good {hr<12?"Morning":hr<17?"Afternoon":"Evening"}</div>
        <div style={{color:B.textSoft,fontSize:isMobile?12:14}}>PCM Family Office — Portfolio & Client Overview{isAdmin&&scope?" · filtered by advisor":""}</div>
        <div style={{height:2,width:56,background:B.gold,marginTop:10,borderRadius:2}}/>
      </div>
      <AdvisorScopeBar userProfile={userProfile} value={scope} onChange={setScope}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
      {[{label:"Families",value:families.length,sub:`${contacts.length} contacts`,accent:B.navy},{label:"Real Estate",value:fmtMoney(totalRE),sub:`${properties.length} properties`,accent:B.gold},{label:"Portfolio",value:fmtMoney(totalPortfolio),sub:`${portfolio_accounts.length} accounts`,accent:B.navyMid},{label:"Open Tasks",value:pending.length,sub:overdue.length>0?`${overdue.length} overdue`:dueSoon.length>0?`${dueSoon.length} due soon`:"All on track",accent:overdue.length>0?"#d43030":dueSoon.length>0?"#d4900a":B.navyMid}].map(s=><div key={s.label} style={{background:B.bgCard,borderRadius:12,padding:"20px 22px",border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,borderTop:`3px solid ${s.accent}`}}>
        <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
        <div style={{fontSize:26,fontFamily:"'Cormorant Garamond',serif",color:B.navy,fontWeight:600,lineHeight:1}}>{s.value}</div>
        <div style={{fontSize:11,color:B.textSoft,marginTop:5}}>{s.sub}</div>
      </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18,marginBottom:18}}>
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>
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

      {/* Users grouped by access level: Admin · Advisor · Client */}
      {loading?<Spinner/>:(()=>{
        const HEADERS=["Name","Email","Role","Family (clients)","Status","Actions"];
        const COLS="1.2fr 1.4fr 130px 1fr 110px 130px";
        const renderRow=u=>(
          <div key={u.id} style={{display:"grid",gridTemplateColumns:COLS,padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,alignItems:"center",gap:8,opacity:u.active?1:0.6}}>
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
          </div>
        );
        const renderSection=(label,accent,desc,list,key)=>(
          <div key={key} style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,overflow:"hidden",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${accent}`,flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:B.navy,fontWeight:700}}>{label}</div>
              <div style={{background:accent,color:B.white,borderRadius:20,minWidth:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,padding:"0 7px"}}>{list.length}</div>
              <div style={{fontSize:11,color:B.textMute,marginLeft:4}}>{desc}</div>
            </div>
            {list.length>0?<>
              <div style={{display:"grid",gridTemplateColumns:COLS,padding:"10px 20px",background:B.bg,borderBottom:`1px solid ${B.borderLight}`,gap:8}}>
                {HEADERS.map(h=><div key={h} style={{fontSize:10,fontWeight:800,color:B.textMute,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {list.map(renderRow)}
            </>:<div style={{padding:"16px 20px",color:B.textMute,fontSize:13}}>No {label.toLowerCase()} in this group yet.</div>}
          </div>
        );
        if(users.length===0)return <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.borderLight}`,boxShadow:B.shadow,padding:"40px",textAlign:"center",color:B.textMute,fontSize:14,marginBottom:24}}>No users yet. Add your first user above.</div>;
        const GROUPS=[
          {key:"admin",label:"Admins",accent:B.navy,desc:"Full access to all families, users, and settings"},
          {key:"advisor",label:"Advisors",accent:B.gold,desc:"Scoped to their assigned families and prospects"},
          {key:"client",label:"Clients",accent:B.navyMid,desc:"Read-only portal access to their own family"},
        ];
        const known=GROUPS.map(g=>g.key);
        const roleOf=u=>(u.role||"").toLowerCase();
        const others=users.filter(u=>!known.includes(roleOf(u)));
        return <div style={{marginBottom:24}}>
          {GROUPS.map(g=>renderSection(g.label,g.accent,g.desc,users.filter(u=>roleOf(u)===g.key),g.key))}
          {others.length>0&&renderSection("Unassigned",B.textMute,"Users with no recognized role — set one below",others,"__unassigned")}
        </div>;
      })()}

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

function DocumentsView({familyId,readOnly=false,canUpload,canDelete,toast}){
  // Backward compat: if readOnly passed, default canUpload=false canDelete=false
  // If canUpload/canDelete passed explicitly, use those
  const allowUpload=canUpload!==undefined?canUpload:!readOnly;
  const allowDelete=canDelete!==undefined?canDelete:!readOnly;
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
    try{
      const{data,error}=await sb.storage.from("documents").createSignedUrl(doc.filePath,300,{download:doc.name||true});
      if(error||!data?.signedUrl){toast("Could not get download link","error");return;}
      // Use anchor element to bypass popup blockers
      const a=document.createElement("a");
      a.href=data.signedUrl;
      a.download=doc.name||"document";
      a.target="_blank";
      a.rel="noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }catch(e){toast("Download failed: "+e.message,"error");}
  };

  const del=async(doc)=>{
    await sb.storage.from("documents").remove([doc.filePath]);
    await sb.from("documents").delete().eq("id",doc.id);
    toast("Document deleted");loadDocs();
  };

  const openEdit=doc=>{setName(doc.name||"");setDescription(doc.description||"");setCategory(doc.category||"General");setModal({edit:doc});};
  const saveEdit=async()=>{
    const doc=modal?.edit;if(!doc||!name.trim())return;
    setUploading(true);
    const{error}=await sb.from("documents").update({name:name.trim(),description:description||null,category}).eq("id",doc.id);
    if(error){toast(error.message,"error");setUploading(false);return;}
    toast("Document updated");
    setModal(null);setName("");setDescription("");setCategory("General");
    loadDocs();setUploading(false);
  };

  const fmtSize=bytes=>{if(!bytes)return"—";if(bytes<1024)return bytes+"B";if(bytes<1024*1024)return(bytes/1024).toFixed(1)+"KB";return(bytes/(1024*1024)).toFixed(1)+"MB";};
  const fileLabel=(type,name)=>{const t=(type||"").toLowerCase();const ext=(name||"").split(".").pop().toLowerCase();if(t.includes("pdf")||ext==="pdf")return"PDF";if(t.includes("image")||["png","jpg","jpeg","gif","webp","svg","heic","bmp","tiff"].includes(ext))return"IMAGE";if(t.includes("word")||["doc","docx"].includes(ext))return"WORD";if(t.includes("sheet")||t.includes("excel")||["xls","xlsx","csv"].includes(ext))return"EXCEL";if(t.includes("presentation")||["ppt","pptx","key"].includes(ext))return"SLIDES";if(["zip","rar","7z","gz"].includes(ext))return"ARCHIVE";if(["txt","rtf","md"].includes(ext))return"TEXT";return ext&&ext.length<=4?ext.toUpperCase():"FILE";};

  const filtered=docs.filter(d=>filterCat==="All"||d.category===filterCat);

  return <div style={{height:"100%",display:"flex",flexDirection:"column",minHeight:0}}>
    <div style={{padding:"14px 24px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{flex:1,display:"flex",gap:6,flexWrap:"wrap"}}>
        {["All",...DOC_CATEGORIES].map(c=><button key={c} onClick={()=>setFilterCat(c)} style={{background:filterCat===c?B.navy:"transparent",border:`1px solid ${filterCat===c?B.navy:B.border}`,color:filterCat===c?B.white:B.textSoft,borderRadius:20,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{c}</button>)}
      </div>
      {allowUpload&&<Btn onClick={()=>setModal("upload")}>⬆ Upload Document</Btn>}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
      {loading?<Spinner/>:filtered.length===0?<div style={{padding:"60px 0",textAlign:"center",color:B.textMute}}><div style={{fontSize:40,marginBottom:12}}>📁</div>No documents yet.</div>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map(doc=><div key={doc.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:12,padding:18,boxShadow:B.shadow,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{flexShrink:0,width:46,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <img src={PCM_MARK} alt="PCM" style={{height:40,width:"auto",display:"block"}}/>
              <span style={{fontSize:8.5,fontWeight:800,letterSpacing:"0.06em",color:B.navyMid,background:B.bg,border:`1px solid ${B.borderLight}`,borderRadius:4,padding:"1px 5px",lineHeight:1.45,whiteSpace:"nowrap"}}>{fileLabel(doc.fileType,doc.name)}</span>
            </div>
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
            {allowUpload&&<Btn small variant="ghost" onClick={()=>openEdit(doc)}>✏ Edit</Btn>}
            {allowDelete&&<Btn small variant="danger" onClick={()=>del(doc)}>✕</Btn>}
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

    {modal&&modal.edit&&<Modal title="Edit Document" onClose={()=>setModal(null)}>
      <Field label="Document Name"><Inp placeholder="Q4 2024 Statement" value={name} onChange={e=>setName(e.target.value)}/></Field>
      <Field label="Category"><Sel value={category} onChange={e=>setCategory(e.target.value)}>{DOC_CATEGORIES.map(c=><option key={c}>{c}</option>)}</Sel></Field>
      <Field label="Description"><Inp placeholder="Optional description" value={description} onChange={e=>setDescription(e.target.value)}/></Field>
      <div style={{fontSize:11,color:B.textMute,marginBottom:14}}>Renaming changes the display title only; the stored file itself is unchanged.</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setModal(null)}>Cancel</Btn>
        <Btn onClick={saveEdit} disabled={uploading||!name.trim()}>{uploading?"Saving…":"Save"}</Btn>
      </div>
    </Modal>}
  </div>;
}

// ── CLIENT DASHBOARD ──────────────────────────────────────────────────────────
function ClientDashboard({family,data,userProfile,logout,toast,reload}){
  const isMobile=useIsMobile();
  const[activeTab,setActiveTab]=useState("summary");
  const assistantName=(((data.families||[]).find(x=>x.id===family.id)||family).assistantName||"").trim()||"Titan";
  const properties=(data.properties||[]).filter(p=>p.familyId===family.id);
  const accounts=(data.portfolio_accounts||[]).filter(a=>a.familyId===family.id);
  const valuables=(data.valuables||[]).filter(v=>v.familyId===family.id);
  const tasks=(data.tasks||[]).filter(t=>t.familyId===family.id&&!t.done);
  const totalRE=properties.reduce((s,p)=>s+(Number(p.currentValue)||Number(p.purchasePrice)||0),0);
  const totalDebt=properties.reduce((s,p)=>s+(Number(p.loanBalance)||0)+(Number(p.secondMortgageBalance)||0),0)+accounts.filter(a=>a.accountType==="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalAccounts=accounts.filter(a=>a.accountType!=="Line of Credit").reduce((s,a)=>s+(Number(a.currentBalance)||0),0);
  const totalValuables=valuables.reduce((s,v)=>s+(Number(v.estimatedValue)||0),0);
  const netWorth=totalRE-totalDebt+totalAccounts+totalValuables;
  const overdue=tasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const soon=tasks.filter(t=>!overdue.includes(t)&&t.dueDate&&(new Date(t.dueDate)-new Date())/(86400000)<=30);

  const TABS=[
    {id:"summary",   label:"Summary",    icon:"◈"},
    {id:"portfolio", label:"Portfolio",  icon:"◇"},
    {id:"properties",label:"Properties", icon:"⌂"},
    {id:"cashflow",  label:"Cash Flow",  icon:"$"},
    {id:"valuables", label:"Valuables",  icon:"◆"},
    {id:"tasks",     label:"Tasks",      icon:"◻"},
    {id:"documents", label:"Documents",  icon:"📁"},
    {id:"assistant", label:"Ask "+assistantName,   icon:"✦"},
  ];

  return <div style={{minHeight:"100vh",background:B.bg,fontFamily:"'DM Sans','Helvetica Neue',sans-serif",paddingBottom:isMobile?70:0}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

    {/* Header (navy banner with logo, family name, sign out) */}
    <div style={{background:B.navy,padding:isMobile?"0 16px":"0 32px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"12px 0":"16px 0",gap:10,flexWrap:isMobile?"wrap":"nowrap"}}>
        <PCMLogo dark/>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?8:16,flex:isMobile?"1 1 auto":"none",justifyContent:isMobile?"flex-end":"flex-start"}}>
          <div style={{textAlign:"right",minWidth:0}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?16:22,color:B.white,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{family.name}</div>
            <div style={{fontSize:isMobile?10:11,color:"rgba(206,182,132,0.7)",marginTop:2}}>{isMobile?"Client Portal":`Client Portal · ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`}</div>
          </div>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.7)",borderRadius:8,padding:isMobile?"6px 10px":"6px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Sign Out</button>
        </div>
      </div>
    </div>

    {/* Gold accent line */}
    <div style={{height:2,background:`linear-gradient(90deg,${B.gold},${B.goldLight}55,transparent)`}}/>

    {/* Top Tabs (desktop only) — white bar matching advisor view */}
    {!isMobile&&<div style={{borderBottom:`1px solid ${B.borderLight}`,background:B.white,padding:"0 32px",display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"none",border:"none",borderBottom:activeTab===t.id?`2px solid ${B.gold}`:"2px solid transparent",color:activeTab===t.id?B.navy:B.textSoft,fontFamily:"inherit",fontSize:13,fontWeight:activeTab===t.id?700:400,padding:"12px 18px",cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap",flexShrink:0}}>{t.label}</button>)}
    </div>}

    {/* Bottom Tab Bar (mobile only) */}
    {isMobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:B.white,borderTop:`1px solid ${B.borderLight}`,display:"flex",justifyContent:"space-around",padding:"8px 4px 10px",zIndex:50,boxShadow:"0 -2px 12px rgba(0,0,0,0.08)",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"none",border:"none",borderTop:activeTab===t.id?`2px solid ${B.gold}`:"2px solid transparent",cursor:"pointer",padding:"8px 6px",display:"flex",alignItems:"center",justifyContent:"center",flex:1,minWidth:0,color:activeTab===t.id?B.navy:B.textSoft,fontFamily:"inherit",marginTop:-2}}>
        <span style={{fontSize:11,fontWeight:activeTab===t.id?800:600,letterSpacing:"0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{t.label}</span>
      </button>)}
    </div>}

    {/* Content */}
    <div style={{maxWidth:1100,margin:"0 auto",padding:isMobile?"16px 14px":"28px 24px"}}>

      {/* SUMMARY */}
      {activeTab==="summary"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:B.navy,fontWeight:600,marginBottom:6}}>
          Good {new Date().getHours()<12?"Morning":new Date().getHours()<17?"Afternoon":"Evening"}
        </div>
        <div style={{color:B.textSoft,fontSize:14,marginBottom:24}}>Here is your financial overview as of {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>

        {/* Net Worth Hero */}
        <div style={{background:`linear-gradient(135deg,${B.navy},${B.navyMid})`,borderRadius:16,padding:isMobile?"22px 20px":"32px 36px",marginBottom:isMobile?16:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:200,height:200,borderRadius:"50%",background:"rgba(206,182,132,0.08)"}}/>
          <div style={{fontSize:isMobile?11:12,color:"rgba(206,182,132,0.8)",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Estimated Net Worth</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?36:52,color:B.white,fontWeight:600,lineHeight:1,marginBottom:8}}>{fmtMoney(netWorth)}</div>
          <div style={{height:1,background:"rgba(206,182,132,0.3)",margin:"16px 0"}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:20,marginTop:4}}>
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14}}>
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
        {properties.length===0?<Empty text="No properties on file."/>:(()=>{
          const bySort=(a,b)=>((Number.isFinite(Number(a.sortOrder))?Number(a.sortOrder):1e9)-(Number.isFinite(Number(b.sortOrder))?Number(b.sortOrder):1e9))||(new Date(a.createdAt||0)-new Date(b.createdAt||0));
          const groups=[...PROP_TYPES,"Other"].map(type=>({type,list:properties.filter(p=>type==="Other"?!PROP_TYPES.includes(p.propertyType):p.propertyType===type).sort(bySort)})).filter(g=>g.list.length>0);
          const card=p=><div key={p.id} style={{background:B.white,border:`1px solid ${B.borderLight}`,borderLeft:`4px solid ${B.gold}`,borderRadius:12,padding:24,marginBottom:16,boxShadow:B.shadow}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:600}}>{p.address}</div>{p.ownerName&&<div style={{fontSize:13,color:B.textSoft,marginTop:2}}>{p.ownerName}</div>}</div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600}}>{fmtMoney(p.currentValue||p.purchasePrice)}</div>
              <div style={{fontSize:12,color:B.textSoft}}>Current Value</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            {[["Property Type",p.propertyType],["Purchase Price",fmtMoney(p.purchasePrice)],["Purchase Date",fmt(p.purchaseDate)],["Lender",p.lender||"—"],["Loan Balance",fmtMoney(p.loanBalance)],["Interest Rate",fmtPct(p.interestRate)],["Monthly Payment",fmtMoney(p.loanPayment)],...(Number(p.secondMortgageBalance)>0?[["2nd Mtg Balance",fmtMoney(p.secondMortgageBalance)],["2nd Mtg Payment",p.secondMortgagePayment?`${fmtMoney(p.secondMortgagePayment)}/mo`:"—"]]:[]),["Loan Maturity",fmt(p.loanMaturityDate)],["Rental Income",p.rentalIncome?`${fmtMoney(p.rentalIncome)}/mo`:"—"],["Property Taxes",p.propertyTaxes?`${fmtMoney(p.propertyTaxes)}/yr`:"—"],["Insurance",p.insuranceCompany||"—"],["Insurance Expires",p.insuranceExpiration?fmt(p.insuranceExpiration):"—"],["Flood Insurance",p.floodInsurance?"Yes":"No"]].map(([l,v])=><div key={l} style={{background:B.bg,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:B.textMute,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{l}</div>
              <div style={{fontSize:13,color:B.text,fontWeight:600}}>{v}</div>
            </div>)}
          </div>
        </div>;
          return groups.map(g=><div key={g.type} style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${B.gold}`}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:B.navy,fontWeight:700}}>{g.type}</div>
              <div style={{background:B.navy,color:B.white,borderRadius:20,minWidth:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,padding:"0 7px"}}>{g.list.length}</div>
            </div>
            {g.list.map(card)}
          </div>);
        })()}
      </div>}

      {/* CASH FLOW (read-only) */}
      {activeTab==="cashflow"&&<div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:B.navy,fontWeight:600,marginBottom:8}}>Cash Flow Projection</div>
        <div style={{fontSize:14,color:B.textSoft,marginBottom:20}}>Projection of expected cash flow events configured by your advisor.</div>
        <CashFlowView family={family} events={(data.cash_flow_events||[]).filter(e=>e.familyId===family.id)} properties={properties} reload={()=>{}} toast={toast||(()=>{})} readOnly={true}/>
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
        <DocumentsView familyId={family.id} canUpload={true} canDelete={false} toast={toast||(()=>{})}/>
      </div>}

      {/* ASK AI */}
      {activeTab==="assistant"&&<FamilyAssistant family={family} data={data} reload={reload}/>}

    </div>

    {/* Footer */}
    <div style={{background:B.navy,padding:isMobile?"12px 16px":"16px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:isMobile?20:40,gap:8,flexDirection:isMobile?"column":"row",textAlign:"center"}}>
      <div style={{fontSize:isMobile?10:11,color:"rgba(255,255,255,0.4)"}}>PCM Family Office · info@pcmfamilyoffice.com</div>
      <div style={{fontSize:isMobile?9:10,color:"rgba(206,182,132,0.5)",letterSpacing:"0.1em"}}>CONFIDENTIAL · FOR AUTHORIZED RECIPIENTS ONLY</div>
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
  const[data,setData]=useState({families:[],contacts:[],properties:[],deals:[],notes:[],tasks:[],portfolio_accounts:[],valuables:[],documents:[],cash_flow_events:[],note_attachments:[]});
  const[loading,setLoading]=useState(true);
  const[toastState,setToastState]=useState(null);
  const[authed,setAuthed]=useState(false);
  const[userProfile,setUserProfile]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const isMobile=useIsMobile();
  const logout=async()=>{await sb.auth.signOut();setAuthed(false);setUserProfile(null);};
  const showToast=useCallback((msg,type="success")=>{setToastState({msg,type});setTimeout(()=>setToastState(null),3500);},[]);

  const profileRef=useRef(null);
  const allowedFamilyIdsRef=useRef(null); // null = unrestricted (admin)

  const loadProfile=useCallback(async userId=>{
    const{data:d}=await sb.from("user_profiles").select("*").eq("id",userId).single();
    if(d){const p={id:d.id,email:d.email,role:d.role,fullName:d.full_name,active:d.active,familyId:d.family_id};profileRef.current=p;setUserProfile(p);}
  },[]);

  useEffect(()=>{
    sb.auth.getSession().then(({data:{session}})=>{if(session?.user){setAuthed(true);loadProfile(session.user.id);}setAuthLoading(false);});
    const{data:{subscription}}=sb.auth.onAuthStateChange((_,session)=>{if(session?.user){setAuthed(true);loadProfile(session.user.id);}else{setAuthed(false);setUserProfile(null);}setAuthLoading(false);});
    return()=>subscription.unsubscribe();
  },[loadProfile]);

  const fetchTable=useCallback(async table=>{
    const prof=profileRef.current;
    let q=sb.from(table).select("*").order("created_at",{ascending:false});
    if(prof?.role==="advisor"){
      if(table==="families"){
        q=q.eq("advisor_email",prof.email);
      } else if(FAMILY_SCOPED.includes(table)){
        const ids=allowedFamilyIdsRef.current||[];
        const idList=ids.length?ids.join(","):"00000000-0000-0000-0000-000000000000";
        q=q.or(`family_id.is.null,family_id.in.(${idList})`);
      }
    }
    const{data:rows,error}=await q;
    if(error){showToast(`Error loading ${table}`,"error");return;}
    if(table==="families"&&prof?.role==="advisor")allowedFamilyIdsRef.current=rows.map(r=>r.id);
    setData(p=>({...p,[table]:rows.map(toClient)}));
  },[showToast]);

  const reload=useCallback(async table=>{
    if(table){await fetchTable(table);return;}
    await fetchTable("families"); // load families first so allowed-id cache is set
    await Promise.all(TABLES.filter(t=>t!=="families").map(fetchTable));
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

  const _isAdmin=userProfile?.role==="admin";
  const _myEmail=(userProfile?.email||"").toLowerCase();
  const _contactAdv=id=>{const c=data.contacts.find(x=>x.id===id);return (c?.advisorEmail||"").toLowerCase();};
  const _dealAdv=d=>(d.advisorEmail||"").toLowerCase();
  const _mine=e=>_isAdmin||(!!e&&e===_myEmail);
  const cmStats={families:data.families.length,portfolio:(data.portfolio_accounts||[]).length,"cm-notes":data.notes.filter(n=>n.familyId).length,"cm-tasks":data.tasks.filter(t=>t.familyId&&!t.done).length};
  const pStats={"p-contacts":data.contacts.filter(c=>!c.familyId&&_mine((c.advisorEmail||"").toLowerCase())).length,"p-pipeline":data.deals.filter(d=>!d.familyId&&d.stage!=="Closed Lost"&&_mine(_dealAdv(d))).length,"p-notes":data.notes.filter(n=>!n.familyId&&_mine(_contactAdv(n.contactId))).length,"p-tasks":data.tasks.filter(t=>!t.familyId&&!t.done&&_mine(_contactAdv(t.contactId))).length};
  const allStats={...cmStats,...pStats,users:0};
  const overdue=data.tasks.filter(t=>t.familyId&&!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
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
    return <><ClientDashboard family={clientFamily} data={data} userProfile={userProfile} logout={logout} toast={showToast} reload={reload}/>{toastState&&<Toast msg={toastState.msg} type={toastState.type}/>}</>;
  }


  // For families tab, header shows differently when inside a family dashboard
  const isFamiliesTab=tab==="families";

  return <div style={{display:"flex",height:"100vh",background:B.bg,fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:B.text,overflow:"hidden",flexDirection:"row"}}>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

    {/* Mobile backdrop */}
    {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:99,backdropFilter:"blur(2px)"}}/>}

    {/* Sidebar */}
    <div style={{width:isMobile?260:232,background:B.navy,display:"flex",flexDirection:"column",flexShrink:0,position:isMobile?"fixed":"relative",top:0,bottom:0,left:isMobile?(sidebarOpen?0:-280):0,zIndex:100,transition:isMobile?"left 0.25s ease":"none",boxShadow:isMobile&&sidebarOpen?"4px 0 24px rgba(0,0,0,0.3)":"none"}}>
      <div style={{padding:"14px 16px 12px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
        <div style={{flex:1}}>
          <PCMLogo dark/>
          <div style={{fontSize:8,color:"rgba(206,182,132,0.5)",letterSpacing:"0.18em",marginTop:8}}>DISCOVER · SIMPLIFY · EXECUTE</div>
        </div>
        {isMobile&&<button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",fontSize:22,cursor:"pointer",padding:4,marginTop:-2}}>✕</button>}
      </div>
      <nav style={{flex:1,padding:"8px",overflowY:"auto"}}>
        {NAV_SECTIONS.filter(s=>s.section!=="ADMIN"||userProfile?.role==="admin").map(({section,items})=><div key={section} style={{marginBottom:6}}>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(206,182,132,0.55)",letterSpacing:"0.16em",padding:"10px 10px 4px",textTransform:"uppercase"}}>{section}</div>
          {items.map(item=><button key={item.id} onClick={()=>{setTab(item.id);if(isMobile)setSidebarOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:isMobile?"13px 12px":"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:tab===item.id?"rgba(206,182,132,0.18)":"transparent",color:tab===item.id?B.gold:"rgba(255,255,255,0.85)",fontFamily:"inherit",fontSize:isMobile?15:13,fontWeight:tab===item.id?700:400,marginBottom:1,textAlign:"left",borderLeft:tab===item.id?`2px solid ${B.gold}`:"2px solid transparent"}}>
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
        <div style={{padding:isMobile?"10px 14px":"13px 28px 11px",borderBottom:`1px solid ${B.borderLight}`,background:B.white,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:1}}>
            {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:6,fontSize:22,color:B.navy,flexShrink:0,display:"flex",alignItems:"center"}} aria-label="Open menu">☰</button>}
            <div style={{minWidth:0}}>
              {!isMobile&&<div style={{fontSize:9,color:B.textMute,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:1}}>{currentSection}</div>}
              <h1 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?18:22,color:B.navy,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentLabel}</h1>
            </div>
          </div>
          {!isMobile&&<div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:11,color:B.textMute}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            {userProfile&&<div style={{background:B.bg,border:`1px solid ${B.borderLight}`,borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#18a850"}}/>
              <span style={{fontSize:11,color:B.textMid,fontWeight:600}}>{userProfile.fullName||userProfile.email}</span>
              <span style={{fontSize:10,color:B.textMute,background:B.borderLight,borderRadius:10,padding:"1px 6px"}}>{userProfile.role}</span>
            </div>}
          </div>}
        </div>
        <div style={{height:2,background:`linear-gradient(90deg,${B.gold},${B.goldLight}55,transparent)`}}/>
      </>}

      {/* Mobile-only floating hamburger when in families tab (which has its own header) */}
      {isMobile&&tab==="families"&&<button onClick={()=>setSidebarOpen(true)} style={{position:"fixed",top:14,left:14,zIndex:50,background:B.white,border:`1px solid ${B.borderLight}`,borderRadius:8,padding:"8px 10px",fontSize:18,color:B.navy,cursor:"pointer",boxShadow:B.shadow,display:"flex",alignItems:"center"}} aria-label="Open menu">☰</button>}

      <div style={{flex:1,minHeight:0,overflow:"hidden",background:B.bg,paddingBottom:"0"}}>
        {loading&&tab!=="families"&&tab!=="users"?<Spinner/>:<>
          {tab==="dashboard"   &&<Dashboard data={data} userProfile={userProfile}/>}
          {tab==="families"    &&<FamiliesView data={data} reload={reload} toast={showToast} userProfile={userProfile}/>}
          {tab==="portfolio"   &&<PortfolioView data={data} reload={reload} toast={showToast} userProfile={userProfile}/>}
          {tab==="cm-notes"    &&<NotesView data={{...data,notes:data.notes.filter(n=>n.familyId)}} reload={reload} toast={showToast} userProfile={userProfile}/>}
          {tab==="cm-tasks"    &&<TasksView data={{...data,tasks:data.tasks.filter(t=>t.familyId)}} reload={reload} toast={showToast} userProfile={userProfile}/>}
          {tab==="users"       &&<UserManagementView userProfile={userProfile} data={data} toast={showToast}/>}
          {tab==="p-contacts"  &&<ProspectContactsView data={data} reload={reload} toast={showToast} userProfile={userProfile}/>}
          {tab==="p-pipeline"  &&<ProspectPipelineView data={data} reload={reload} toast={showToast} userProfile={userProfile}/>}
          {tab==="p-notes"     &&<NotesView data={{...data,notes:data.notes.filter(n=>!n.familyId),families:[]}} reload={reload} toast={showToast} userProfile={userProfile} prospectMode={true}/>}
          {tab==="p-tasks"     &&<TasksView data={{...data,tasks:data.tasks.filter(t=>!t.familyId),families:[]}} reload={reload} toast={showToast} userProfile={userProfile} prospectMode={true}/>}
        </>}
      </div>
    </div>
    {toastState&&<Toast msg={toastState.msg} type={toastState.type}/>}
  </div>;
}
