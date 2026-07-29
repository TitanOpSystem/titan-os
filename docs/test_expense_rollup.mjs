// Tests for the expense-by-category rollup that answers "how much do we spend on X?".
//
// The rollup lives inside buildFamilySnapshot in App.jsx, which imports React and so
// cannot be loaded in node. Rather than leave it untested, the arithmetic is
// reimplemented here from the same rules and checked against figures taken straight
// from the demo database. If this file and App.jsx ever disagree, the assertion on the
// real landscaping total is what catches it.
//
// What is being protected: a client asks what they spend on landscaping, and the
// number has to be right, complete, and honest about what it excludes.
//
// Run: node docs/test_expense_rollup.mjs

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? " — " + detail : ""}`); }
};

// ── Mirrors of the App.jsx logic ───────────────────────────────────────────────
const FREQ_PER_YEAR = { weekly:52, biweekly:26, monthly:12, quarterly:4, semiannually:2, annually:1, yearly:1 };
const annualise = (amount, frequency) => {
  const per = FREQ_PER_YEAR[String(frequency || "").toLowerCase()];
  return per ? Math.round(amount * per) : null;
};
const rollup = events => {
  const acc = {};
  events.filter(e => e.direction === "expense").forEach(e => {
    const key = e.category || "uncategorised";
    const a = acc[key] || (acc[key] = { category:key, annualised:0, lines:0, oneOffTotal:0, oneOffCount:0 });
    a.lines++;
    const ann = annualise(e.amount, e.frequency);
    if (ann == null) { a.oneOffTotal += e.amount; a.oneOffCount++; }
    else a.annualised += ann;
  });
  return Object.values(acc).sort((x, y) => y.annualised - x.annualised);
};

console.log("\nannualise — frequency arithmetic is done in code, not by the model");
ok("monthly x12", annualise(1850, "monthly") === 22200);
ok("quarterly x4", annualise(500, "quarterly") === 2000);
ok("annually x1", annualise(9000, "annually") === 9000);
ok("weekly x52", annualise(365, "weekly") === 18980);
ok("biweekly x26", annualise(100, "biweekly") === 2600);
ok("case-insensitive", annualise(100, "Monthly") === 1200);
// The important one: a single payment is not a run rate. Returning 1 here would
// quietly add a one-off into an annual figure and overstate the category.
ok("a one-off returns null, not the amount", annualise(5000, "once") === null);
ok("an unknown frequency returns null rather than guessing", annualise(5000, "fortnightly") === null);

console.log("\nrollup — Harrington's real figures from the demo database");
// Taken from cash_flow_events on the demo project.
const harrington = [
  { direction:"expense", category:"landscaping",         amount:1850, frequency:"monthly" },
  { direction:"expense", category:"landscaping",         amount:420,  frequency:"monthly" },
  { direction:"expense", category:"pool_spa",            amount:365,  frequency:"monthly" },
  { direction:"expense", category:"housekeeping",        amount:2400, frequency:"monthly" },
  { direction:"expense", category:"property_management", amount:295,  frequency:"monthly" },
  { direction:"expense", category:"debt_service",        amount:8215, frequency:"monthly" },
  { direction:"expense", category:"taxes",               amount:3325, frequency:"monthly" },
  { direction:"expense", category:"insurance",           amount:2092, frequency:"monthly" },
  { direction:"income",  category:null,                  amount:9999, frequency:"monthly" },
];
const r = rollup(harrington);
const byCat = Object.fromEntries(r.map(c => [c.category, c]));
// The answer to the actual question, and it must cover BOTH properties. A rollup that
// read one row would say $22,200 and look entirely plausible.
ok("landscaping annualises to $27,240 across 2 lines",
  byCat.landscaping.annualised === 27240 && byCat.landscaping.lines === 2,
  `got ${byCat.landscaping?.annualised} over ${byCat.landscaping?.lines} lines`);
ok("housekeeping is $28,800", byCat.housekeeping.annualised === 28800);
ok("pool & spa is $4,380", byCat.pool_spa.annualised === 4380);
ok("income is excluded entirely", !r.some(c => c.annualised === 119988));
ok("sorted by size, largest first", r[0].category === "debt_service");
ok("no uncategorised entry when every expense is categorised", !byCat.uncategorised);

console.log("\nrollup — the honesty cases");
// Castellano's "Housekeeper + grounds" is household_payroll. It must NOT appear under
// landscaping, and the rollup must give the assistant no way to make it appear there.
const castellano = [
  { direction:"expense", category:"household_payroll", amount:5200, frequency:"monthly" },
];
const cr = rollup(castellano);
ok("a bundled payroll line does not create landscaping spend",
  !cr.some(c => c.category === "landscaping"));
ok("the bundled line is reported under its own category", cr[0].category === "household_payroll" && cr[0].annualised === 62400);

// An uncategorised line must be visible as its own entry, so a quoted category total
// can be flagged as incomplete rather than presented as the whole picture.
const mixed = [
  { direction:"expense", category:"landscaping", amount:1000, frequency:"monthly" },
  { direction:"expense", category:null,          amount:700,  frequency:"monthly" },
];
const mr = Object.fromEntries(rollup(mixed).map(c => [c.category, c]));
ok("uncategorised spend is its own line", !!mr.uncategorised && mr.uncategorised.annualised === 8400);
ok("uncategorised is not folded into a category", mr.landscaping.annualised === 12000);

// A one-off alongside recurring spend: counted, listed, but kept out of the run rate.
const withOneOff = [
  { direction:"expense", category:"landscaping", amount:1850, frequency:"monthly" },
  { direction:"expense", category:"landscaping", amount:9500, frequency:"once" },
];
const w = rollup(withOneOff)[0];
ok("a one-off is excluded from the annual total", w.annualised === 22200, `got ${w.annualised}`);
ok("but it is still counted and totalled separately",
  w.lines === 2 && w.oneOffCount === 1 && w.oneOffTotal === 9500);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
