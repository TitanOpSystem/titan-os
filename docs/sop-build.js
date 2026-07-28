// Renders both SOP manuals from sop-content.js.
//
// Two audiences, one model. If a capability is added to the model without both
// voices this script throws rather than quietly shipping a manual with a hole in
// it — the failure mode that makes documentation untrustworthy.

const fs = require("fs");
const CAPS = require("./sop-content.js");
const LISTS = require("./sop-checklists.js");
const {Document,Packer,Paragraph,TextRun,AlignmentType,Table,TableRow,TableCell,
       WidthType,BorderStyle,ShadingType,LevelFormat,PageBreak} = require("docx");
const BRAND = require("./brand.js");

// ── Guard rails ──────────────────────────────────────────────────────────────
const problems = [];
CAPS.forEach((c, i) => {
  if (!c.id) problems.push(`capability ${i} has no id`);
  if (!c.title) problems.push(`${c.id}: no title`);
  if (!Array.isArray(c.internal) || !c.internal.length) problems.push(`${c.id}: no internal steps`);
  if (!Array.isArray(c.firm) || !c.firm.length) problems.push(`${c.id}: no firm-facing text`);
});
const ids = CAPS.map(c => c.id);
if (new Set(ids).size !== ids.length) problems.push("duplicate capability ids");
LISTS.forEach(l => {
  if (!l.id || !l.title) problems.push(`checklist ${l.id||"?"}: missing id or title`);
  if (!Array.isArray(l.groups) || !l.groups.length) problems.push(`${l.id}: no groups`);
  (l.refs||[]).forEach(r => {
    if (!CAPS.some(c => c.id === r)) problems.push(`${l.id}: refers to unknown capability "${r}"`);
  });
});
if (problems.length) { console.error("CONTENT PROBLEMS:\n  " + problems.join("\n  ")); process.exit(1); }

const NAVY="092B49", GOLD="CEB684", SOFT="5A6E84", BODY="1E293B", RED="8B1A1A", WARN="7A5A19";
const CW = 10240;
const bd = () => ({style:BorderStyle.SINGLE,size:4,color:"D8CDB8"});
const cellB = {top:bd(),bottom:bd(),left:bd(),right:bd()};

const P = (t,o) => { o=o||{}; return new Paragraph({
  spacing:{after:o.after==null?70:o.after, before:o.before||0}, alignment:o.align,
  children:[new TextRun({text:t,size:o.size||21,color:o.color||BODY,font:"Calibri",bold:o.bold,italics:o.italics})]}); };

const H1 = t => new Paragraph({spacing:{before:190,after:70},keepNext:true,
  border:{bottom:{style:BorderStyle.SINGLE,size:8,color:GOLD}},
  children:[new TextRun({text:t,bold:true,size:25,color:NAVY,font:"Georgia"})]});

const H2 = t => new Paragraph({spacing:{before:130,after:45},
  children:[new TextRun({text:t,bold:true,size:19,color:NAVY,font:"Calibri"})]});

const LABEL = t => new Paragraph({spacing:{before:85,after:30},keepNext:true,
  children:[new TextRun({text:t,bold:true,size:15,color:SOFT,font:"Calibri",
    allCaps:true})]});

const numbered = (t,n) => new Paragraph({spacing:{after:36},indent:{left:340,hanging:250},
  children:[
    new TextRun({text:`${n}.  `,bold:true,size:19,color:GOLD,font:"Calibri"}),
    new TextRun({text:t,size:20,color:BODY,font:"Calibri"})]});

const bullet = (t,color) => new Paragraph({numbering:{reference:"b",level:0},spacing:{after:36},
  children:[new TextRun({text:t,size:20,color:color||BODY,font:"Calibri"})]});

const pull = (t,kind) => new Paragraph({spacing:{before:60,after:70},
  shading:{type:ShadingType.CLEAR,fill:kind==="red"?"FDEAEA":kind==="warn"?"FBF3E3":"F4F1EA"},
  border:{left:{style:BorderStyle.SINGLE,size:18,color:kind==="red"?"E09A9A":kind==="warn"?"E4CE9A":GOLD}},
  indent:{left:200,right:120},
  children:[new TextRun({text:t,size:20,
    color:kind==="red"?RED:kind==="warn"?WARN:NAVY,font:"Calibri",italics:true})]});

const hdrCell = (t,w) => new TableCell({width:{size:w,type:WidthType.DXA},borders:cellB,
  shading:{type:ShadingType.CLEAR,fill:NAVY},margins:{top:50,bottom:50,left:100,right:100},
  children:[new Paragraph({children:[new TextRun({text:t,bold:true,size:17,color:"FFFFFF",font:"Calibri"})]})]});

const txtCell = (t,w,o) => { o=o||{}; return new TableCell({width:{size:w,type:WidthType.DXA},borders:cellB,
  margins:{top:48,bottom:48,left:100,right:100},
  children:[new Paragraph({spacing:{after:0},alignment:o.align,
    children:[new TextRun({text:String(t),size:o.size||19,color:o.color||BODY,font:"Calibri",bold:o.bold})]})]}); };

const table = (cols,rows) => new Table({width:{size:CW,type:WidthType.DXA},
  columnWidths:cols.map(c=>c.w),
  rows:[new TableRow({tableHeader:true,children:cols.map(c=>hdrCell(c.t,c.w))})]
    .concat(rows.map(r=>new TableRow({children:r.map((cell,i)=>
      txtCell(cell&&cell.t!==undefined?cell.t:cell, cols[i].w, cell&&cell.t!==undefined?cell:{}))})))});

function cover(k,{title,strap,warn,intro}){
  // The real artwork, not a typeset approximation. The wordmark is two-tone -
  // navy TITAN, gold OS - which no single-colour text run can reproduce.
  BRAND.masthead().forEach(p=>k.push(p));
  k.push(new Paragraph({spacing:{before:200,after:0},alignment:AlignmentType.CENTER,
    border:{top:{style:BorderStyle.SINGLE,size:6,color:GOLD}},
    children:[new TextRun({text:title,bold:true,size:31,color:NAVY,font:"Georgia"})]}));
  k.push(new Paragraph({spacing:{after:warn?40:110},alignment:AlignmentType.CENTER,
    children:[new TextRun({text:strap,size:18,color:SOFT,font:"Calibri"})]}));
  if(warn) k.push(new Paragraph({spacing:{after:110},alignment:AlignmentType.CENTER,
    children:[new TextRun({text:warn,size:18,color:RED,font:"Calibri",bold:true})]}));
  intro.forEach(t=>k.push(P(t,{size:20})));
  k.push(P("Revised 28 July 2026.",{size:18,color:SOFT,italics:true}));
}

function contents(k,label){
  k.push(H1("Contents"));
  k.push(P(label,{after:60,size:19,color:SOFT}));
  CAPS.forEach((c,i)=>k.push(new Paragraph({spacing:{after:22},indent:{left:200,hanging:200},
    children:[
      new TextRun({text:`${String(i+1).padStart(2," ")}   `,size:19,color:GOLD,font:"Calibri",bold:true}),
      new TextRun({text:c.title,size:20,color:BODY,font:"Calibri"})]})));
}

function rolesTable(c){
  return table([{t:"Role",w:2400},{t:"What they can reach",w:7840}],
    c.roles.map(([r,d])=>[{t:r,bold:true},d]));
}

// Section numbers are looked up, never written down, so a reordered manual cannot
// leave a checklist pointing at the wrong chapter.
const sectionNo = id => {
  const i = CAPS.findIndex(c => c.id === id);
  if (i < 0) throw new Error(`unknown capability id: ${id}`);
  return i + 1;
};
const refLine = refs => {
  if (!refs || !refs.length) return null;
  const ns = refs.map(sectionNo).sort((a,b)=>a-b);
  if (ns.length === 1) return `See section ${ns[0]}.`;
  const last = ns.pop();
  return `See sections ${ns.join(", ")} and ${last}.`;
};

// A bordered empty cell rather than a ballot-box character: the glyph is not in
// every font and would silently become a blank or a box-with-cross depending on
// what the reader has installed. A cell is a cell everywhere, and prints.
const tick = () => new TableCell({
  width:{size:260,type:WidthType.DXA},
  borders:{top:bd(),bottom:bd(),left:bd(),right:bd()},
  margins:{top:40,bottom:40,left:40,right:40},
  children:[new Paragraph({spacing:{after:0},children:[new TextRun({text:"",size:18})]})]});

const checkRow = t => new TableRow({children:[
  tick(),
  new TableCell({width:{size:CW-260,type:WidthType.DXA},
    borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},
             left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}},
    margins:{top:40,bottom:40,left:130,right:60},
    children:[new Paragraph({spacing:{after:0},
      children:[new TextRun({text:t,size:19,color:BODY,font:"Calibri"})]})]})]});

// Fill-in line at the top of each standalone checklist. A ticked list with no
// household, period or name on it proves nothing after the fact.
const fillIn = fields => new Table({
  width:{size:CW,type:WidthType.DXA},
  columnWidths:fields.map(()=>Math.floor(CW/fields.length)),
  rows:[new TableRow({children:fields.map(f=>new TableCell({
    width:{size:Math.floor(CW/fields.length),type:WidthType.DXA},
    borders:{top:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},
             right:{style:BorderStyle.NONE},
             bottom:{style:BorderStyle.SINGLE,size:4,color:"B9C3CE"}},
    margins:{top:90,bottom:60,left:0,right:150},
    children:[new Paragraph({spacing:{after:0},
      children:[new TextRun({text:f,size:16,color:SOFT,font:"Calibri",allCaps:true,bold:true})]})]}))})]});

const checkTable = items => new Table({
  width:{size:CW,type:WidthType.DXA}, columnWidths:[260, CW-260],
  rows: items.map(checkRow)});

function buildChecklists(k){
  k.push(new Paragraph({children:[new PageBreak()]}));
  k.push(H1("Checklists"));
  k.push(P("Organised by the moment they are used rather than by capability, because that is when a checklist is reached for. Each points back to the sections that explain the detail.",{after:90}));
  LISTS.forEach(l => {
    k.push(H2(l.title));
    k.push(P(l.when,{size:18,italics:true,color:SOFT,after:30}));
    const r = refLine(l.refs);
    if (r) k.push(P(r,{size:17,color:SOFT,after:60}));
    l.groups.forEach(([heading, items]) => {
      k.push(LABEL(heading));
      k.push(checkTable(items));
    });
  });
}

// ── INTERNAL SOP ─────────────────────────────────────────────────────────────
function buildInternal(){
  const k=[];
  cover(k,{
    title:"Standard Operating Procedures",
    strap:"Every capability, how to run it, and what goes wrong",
    warn:"Internal — TitanOS and PCM staff.  Not for circulation.",
    intro:[
      "One section per area of the platform, in the order you would meet them working a household. Each covers what the capability is for, the procedure, what to check before you move on, and the traps — the things that have actually caught someone.",
      "Where a procedure says the platform refuses to do something, that refusal is deliberate and enforced. It is not a bug to be worked around, and the reason is given so you can explain it to a client or a compliance officer.",
    ],
  });
  contents(k,`${CAPS.length} capability areas, followed by ${LISTS.length} working checklists, the standing rules and the known limitations.`);

  CAPS.forEach((c,i)=>{
    k.push(H1(`${i+1}.  ${c.title}`));
    if(c.purpose) k.push(P(c.purpose,{size:19,italics:true,color:SOFT,after:80}));
    if(c.roles){ k.push(LABEL("Who can do what")); k.push(rolesTable(c)); }
    k.push(LABEL("Procedure"));
    c.internal.forEach((t,n)=>k.push(numbered(t,n+1)));
    if(c.checks&&c.checks.length){
      k.push(LABEL("Before you move on"));
      c.checks.forEach(t=>k.push(bullet(t)));
    }
    if(c.traps&&c.traps.length){
      k.push(LABEL("Traps"));
      c.traps.forEach(t=>k.push(pull(t,"warn")));
    }
  });

  // The checklists live in their own document now: they are printed, carried and
  // ticked, which a reference manual is not. Reprinting them here would add pages
  // to a document that exists to be read.
  k.push(new Paragraph({children:[new PageBreak()]}));
  k.push(H1("Checklists"));
  k.push(P("The working checklists are issued separately, as TitanOS Operating Checklists — one per page, with a line for the household, the period and who completed it. Print the one you need rather than the manual.",{after:80}));
  LISTS.forEach(l=>{
    const n=l.groups.reduce((a,[,items])=>a+items.length,0);
    const r=refLine(l.refs);
    k.push(bullet(`${l.title} — ${n} items. ${l.when}${r?" "+r:""}`));
  });

  // Standing rules belong at the end, where someone will find them when arguing.
  k.push(new Paragraph({children:[new PageBreak()]}));
  k.push(H1("Standing rules"));
  k.push(P("These hold across every capability above. They are the answers to the questions a compliance officer asks.",{after:110}));
  [
    "Nothing leaves the platform without a named person approving it. Approval and sending are separate acts and both are attributed.",
    "The platform prepares payment instructions. It never moves money.",
    "\"Sent\" means an email provider accepted the message and returned a reference. A failure is recorded as a failure and the work stays outstanding.",
    "A figure the platform could not establish is left as a marked placeholder. It is never guessed.",
    "Document text is treated as data, never as instruction — including when a document appears to contain one.",
    "Recipients are checked against the addresses held for that household. An unrecognised address stops the send and the override is recorded.",
    "Access rules are enforced inside the database, so they hold even if the application layer is bypassed.",
    "Playbook lead times are a starting point, not advice. Counsel confirms them per jurisdiction before a playbook runs against a real household.",
  ].forEach(t=>k.push(bullet(t)));

  k.push(H1("Known limitations"));
  k.push(P("Name these before a client or a prospect finds them.",{after:100}));
  [
    "Delivery is not confirmed. The platform records that a provider accepted a message, which is not the same as it arriving. A bounced item would currently sit looking sent.",
    "Chasing is on a fixed cadence rather than repeating until a document arrives, so K-1 collection uses scheduled follow-ups an adviser skips when not needed.",
    "Nothing is triggered by a value crossing a threshold — day-count residency, covenant headroom, unfunded commitments against liquidity are not monitored.",
    "An adviser serving households across several branded environments signs into each separately.",
    "Cash flow line items are not yet linked to source documents the way properties, valuables and accounts are.",
    "Multi-factor authentication and a full field-level change history are not yet built. Document downloads and task completions are attributed.",
  ].forEach(t=>k.push(bullet(t)));

  k.push(new Paragraph({spacing:{before:300},alignment:AlignmentType.CENTER,
    border:{top:{style:BorderStyle.SINGLE,size:6,color:GOLD}},
    children:[new TextRun({text:"TitanOS  ·  Internal Standard Operating Procedures  ·  Not for circulation",
      size:17,color:SOFT,font:"Calibri"})]}));
  return k;
}

// ── FIRM HANDBOOK ────────────────────────────────────────────────────────────
function buildFirm(){
  const k=[];
  cover(k,{
    title:"Platform Handbook",
    strap:"For adviser teams",
    warn:null,
    intro:[
      "This handbook covers what the platform does and how your team uses it, area by area. It is written to be issued to your advisers as it stands, or reissued under your own firm's name and brand.",
      "Two themes run through all of it. The platform will not send anything without one of your people approving it, and it will not present a figure it cannot support. Where it cannot establish something it says so rather than filling the gap.",
    ],
  });
  contents(k,`${CAPS.length} areas of the platform.`);

  CAPS.forEach((c,i)=>{
    k.push(H1(`${i+1}.  ${c.title}`));
    if(c.roles){ k.push(LABEL("Who can reach what")); k.push(rolesTable(c)); k.push(P("",{after:30})); }
    c.firm.forEach(t=>k.push(bullet(t)));
  });

  k.push(new Paragraph({children:[new PageBreak()]}));
  k.push(H1("What the platform will not do"));
  k.push(P("Worth knowing plainly, because these are the questions your clients and your compliance function will ask.",{after:110}));
  [
    "It does not send anything on its own. Every outbound item waits for one of your advisers to approve it, and the approval is recorded against them by name.",
    "It does not move money. It prepares instructions for your firm to submit under its own authority.",
    "It does not invent figures. Anything it cannot establish from your records is marked for an adviser to complete.",
    "It does not follow instructions found inside documents. Uploaded material is treated as information to read, not direction to act on.",
    "It does not send to an address you have no record of without an adviser explicitly confirming it first.",
    "It does not let one adviser see another's book, or one firm see another's clients. Your environment is separate at the database level.",
  ].forEach(t=>k.push(bullet(t)));

  k.push(H1("Before you go live"));
  [
    "Your sending domain is verified with the email provider. Until it is, your team can prepare and approve correspondence but not send it.",
    "Every adviser's email address sits on that verified domain.",
    "Each household has a responsible adviser and a designated primary contact.",
    "Your households' counterparties — bankers, trustees, carriers, accountants, fund administrators — are recorded, so correspondence to them is recognised rather than queried.",
    "Your team has read the playbooks you intend to run, and your counsel has confirmed the lead times for your jurisdiction.",
  ].forEach(t=>k.push(bullet(t)));

  k.push(new Paragraph({spacing:{before:300},alignment:AlignmentType.CENTER,
    border:{top:{style:BorderStyle.SINGLE,size:6,color:GOLD}},
    children:[new TextRun({text:"Platform Handbook  ·  For adviser teams  ·  Confidential",
      size:17,color:SOFT,font:"Calibri"})]}));
  return k;
}

function buildChecklistBook(){
  const k=[];
  cover(k,{
    title:"Operating Checklists",
    strap:"What must not be missed, at the moment it matters",
    warn:"Internal — TitanOS and PCM staff.  Not for circulation.",
    intro:[
      "Seven checklists, one per page, arranged by the moment they are used. Print the one you need and work down it. Each carries a line for the household, the period and who completed it, because a ticked list with no name on it proves nothing afterwards.",
      "These are the companion to the Standard Operating Procedures, which explain how each capability works and why. Where an item here needs more than a line of explanation, the referenced section has it.",
    ],
  });

  k.push(H1("Contents"));
  LISTS.forEach((l,i)=>{
    const n=l.groups.reduce((a,[,items])=>a+items.length,0);
    k.push(new Paragraph({spacing:{after:26},indent:{left:260,hanging:260},
      children:[
        new TextRun({text:`${i+1}   `,size:19,color:GOLD,font:"Calibri",bold:true}),
        new TextRun({text:l.title,size:20,color:BODY,font:"Calibri"}),
        new TextRun({text:`   ${n} items`,size:17,color:SOFT,font:"Calibri"})]}));
  });

  LISTS.forEach((l,i)=>{
    k.push(new Paragraph({children:[new PageBreak()]}));
    k.push(H1(`${i+1}.  ${l.title}`));
    k.push(P(l.when,{size:19,italics:true,color:SOFT,after:40}));
    const r=refLine(l.refs);
    if(r) k.push(P(`${r}  Standard Operating Procedures.`,{size:17,color:SOFT,after:70}));
    k.push(fillIn(l.id==="statement-cycle"
      ? ["Household","Account","Period","Completed by","Date"]
      : l.id==="monthly-review"||l.id==="hygiene"
        ? ["Titan Expert","Month","Completed by","Date"]
        : ["Household","Completed by","Date"]));
    k.push(P("",{after:40}));
    l.groups.forEach(([heading,items])=>{
      k.push(LABEL(heading));
      k.push(checkTable(items));
    });
  });

  k.push(new Paragraph({spacing:{before:300},alignment:AlignmentType.CENTER,
    border:{top:{style:BorderStyle.SINGLE,size:6,color:GOLD}},
    children:[new TextRun({text:"TitanOS  ·  Operating Checklists  ·  Not for circulation",
      size:17,color:SOFT,font:"Calibri"})]}));
  return k;
}

function write(children,file){
  const doc=new Document({
    numbering:{config:[{reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",
      style:{paragraph:{indent:{left:340,hanging:190}}}}]}]},
    sections:[{properties:{page:{size:{width:12240,height:15840},
      margin:{top:850,bottom:800,left:950,right:950}}},children}],
  });
  return Packer.toBuffer(doc).then(b=>{fs.writeFileSync(file,b);console.log("wrote",file);});
}

Promise.all([
  write(buildInternal(),"TitanOS_SOP_Internal.docx"),
  write(buildFirm(),"TitanOS_Platform_Handbook.docx"),
  write(buildChecklistBook(),"TitanOS_Operating_Checklists.docx"),
]).then(()=>{
  const items=LISTS.reduce((a,l)=>a+l.groups.reduce((b,[,i])=>b+i.length,0),0);
  console.log(`${CAPS.length} capabilities in both manuals; ${LISTS.length} checklists / ${items} items in the checklist book`);
});
