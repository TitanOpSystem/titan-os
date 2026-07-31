// Tests that call the REAL buildFamilySnapshot, not a copy of what it does.
//
// WHY THIS FILE EXISTS
//
// docs/test_expense_rollup.mjs re-implements the rollup arithmetic and asserts against it.
// That let 114 assertions stay green while the real function was broken three separate
// ways at once:
//
//   1. A temporal dead zone error — expenseByCategory spread ...derivedPropertyEvents
//      before that const was initialised — so the function threw on every call and the
//      family card rendered as a blank panel. Three commits shipped it.
//   2. The snapshot's property objects carried no `id`, so every derived line got the id
//      "prop_undefined_<field>" and every suppression key collapsed to "undefined::x".
//      The suppression rule could never match, and itemised costs were double-counted.
//      The mirrored tests passed because their fixtures supplied an id the snapshot did not.
//   3. The two vendor columns were missing from the snake_case→camelCase field map, so
//      spendByVendor was always empty in the running app.
//
// None of those are visible to a test that reimplements the logic, to `npm run build`
// (Vite does not check that identifiers resolve) or to no-undef (a TDZ identifier IS
// declared). Only calling the real thing finds them.
//
// HOW IT LOADS App.jsx
//
// App.jsx cannot be imported in node: it uses import.meta.env and JSX. esbuild bundles it
// with those resolved, React and friends left external, and a test-only export appended.
// The bundle must be written inside the repo so node resolves react from node_modules.
//
// Run: node docs/test_family_snapshot.mjs

import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, rmSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(repo, ".probe-tmp");
const bundle = join(repo, "app.probe.mjs");

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}${d ? " — " + d : ""}`); } };

// ── Build a callable copy of the real App.jsx ─────────────────────────────────
mkdirSync(tmp, { recursive: true });
const appSrc = readFileSync(join(repo, "src/App.jsx"), "utf8")
  + "\n\nexport { buildFamilySnapshot, buildVendorOptions, FIRM_DEFAULTS };\n";
writeFileSync(join(tmp, "App.jsx"), appSrc);
// Copy EVERY sibling module, not a hardcoded list. App.jsx gained an import of
// vaultFolders.js and the hardcoded list silently broke the bundle — the test failed for a
// reason that had nothing to do with what it was testing.
for (const f of readdirSync(join(repo, "src")).filter(f => f.endsWith(".js"))) {
  writeFileSync(join(tmp, f), readFileSync(join(repo, "src", f), "utf8"));
}
execFileSync("npx", ["--yes", "esbuild@0.23", join(tmp, "App.jsx"),
  "--bundle", "--format=esm", "--jsx=automatic",
  "--external:react", "--external:react-dom", "--external:react/jsx-runtime",
  "--external:@supabase/supabase-js", "--external:pdf-lib",
  `--define:import.meta.env={"VITE_SUPABASE_URL":"https://example.supabase.co","VITE_SUPABASE_ANON_KEY":"x","VITE_BRAND_RUNTIME":"1"}`,
  `--outfile=${bundle}`, "--log-level=error"], { stdio: ["ignore", "ignore", "inherit"] });

const { buildFamilySnapshot, FIRM_DEFAULTS } = await import("../app.probe.mjs");

// Deriving property costs into cash flow is opt-in per firm (brand_profiles
// .derive_property_costs, default false). loadFirmDefaults() reads it from the brand
// record and is never called here, so the flag starts false — which is exactly the state a
// firm that has not categorised its expenses is in. Both paths are asserted.
FIRM_DEFAULTS.derivePropertyCosts = true;

// ── Real rows from the demo database, in the client (camelCase) shape ─────────
const FID = "21133f57-f245-4643-ad20-4b6ce4f2a0d0";
const OV = "6624b878-fad5-4f87-8b96-a9b0e07714e8";   // 4 Ocean Vista Dr, no rental
const GS = "daa56f78-e07d-4c08-95fe-5a71d925106e";   // 210 Gulf Shore 8B, rental
const LAWN = "e9d776b4-639f-49a0-bab9-bef0ba9a9857"; // Robert @ ABC Landscaping
const FPL = "3fa091fc-7ef4-4cd4-9bc4-71a505db95ec";  // Florida Power & Light

const family = { id: FID, name: "Harrington Family [DEMO]" };
const data = {
  families: [family],
  properties: [
    { id: OV, familyId: FID, address: "4 Ocean Vista Dr", ownerName: "James & Elizabeth Harrington",
      propertyType: "Commercial", currentValue: 3450000, purchasePrice: 2600000,
      lender: "Goldman Sachs Private Bank", loanBalance: 1150000, loanPayment: 8215,
      rentalIncome: null, propertyTaxes: 28500, utilities: 950, hoaFee: 650,
      insuranceCompany: "Chubb", insurancePremium: 14200,
      floodInsuranceCompany: "FEMA NFIP", floodInsurancePremium: 3100,
      propertyManagementFeePct: 0, includeMortgageInCashflow: true },
    { id: GS, familyId: FID, address: "210 Gulf Shore Blvd Unit 8B", ownerName: "Harrington Family Trust",
      propertyType: "Condo", currentValue: 1225000, purchasePrice: 980000,
      lender: "Charles Schwab Bank", loanBalance: 610000, loanPayment: 4850,
      rentalIncome: 6800, propertyTaxes: 11400, utilities: 320, hoaFee: 980,
      insuranceCompany: "Citizens Property Insurance", insurancePremium: 5200,
      floodInsuranceCompany: "FEMA NFIP", floodInsurancePremium: 2600,
      propertyManagementFeePct: 8, includeMortgageInCashflow: true },
  ],
  cash_flow_events: [
    { id: "i1", familyId: FID, direction: "income", eventType: "Salary",
      description: "James Harrington - executive compensation", amount: 42000,
      frequency: "monthly", category: null, propertyId: null },
    { id: "e1", familyId: FID, direction: "expense", eventType: "Landscaping",
      description: "ABC Landscaping — 4 Ocean Vista Dr grounds & irrigation", amount: 1850,
      frequency: "monthly", category: "landscaping", propertyId: OV,
      vendorPropertyContactId: LAWN },
    { id: "e2", familyId: FID, direction: "expense", eventType: "Landscaping",
      description: "Gulf Shore unit 8B — shared grounds assessment", amount: 420,
      frequency: "monthly", category: "landscaping", propertyId: null },
    // The three itemised utility lines for Ocean Vista. Together $950/mo — exactly the
    // blended `utilities` figure on that property record, which must now step aside.
    { id: "e3", familyId: FID, direction: "expense", eventType: "Utilities",
      description: "Florida Power & Light — electric", amount: 520, frequency: "monthly",
      category: "utilities", propertyId: OV, vendorPropertyContactId: FPL },
    { id: "e4", familyId: FID, direction: "expense", eventType: "Utilities",
      description: "City of Vero Beach — water & sewer", amount: 180, frequency: "monthly",
      category: "utilities", propertyId: OV },
    { id: "e5", familyId: FID, direction: "expense", eventType: "Utilities",
      description: "TECO — natural gas", amount: 250, frequency: "monthly",
      category: "utilities", propertyId: OV },
  ],
  cash_flow_payment_log: [], documents: [], tasks: [], valuables: [],
  portfolio_accounts: [], account_balances: [], contacts: [],
  family_contacts: [
    { id: "fc1", familyId: FID, name: "Daniel Cho, Esq.", role: "Estate Attorney",
      company: "Cho & Whitfield LLP", isAdvisor: true },
  ],
  property_contacts: [
    { id: LAWN, familyId: FID, propertyId: OV, name: "Robert", role: "Landscaper", company: "ABC Landscaping" },
    { id: FPL, familyId: FID, propertyId: OV, name: "Customer Care", role: "Utility — electric", company: "Florida Power & Light" },
  ],
};

// ── 1. It runs at all ─────────────────────────────────────────────────────────
console.log("\nThe function executes (this is the test the TDZ error failed)");
let snap = null, threw = null;
try { snap = buildFamilySnapshot(family, data); } catch (e) { threw = e; }
ok("buildFamilySnapshot does not throw", !threw, threw && threw.message);
if (threw) { console.log(`\n${pass} passed, ${fail} failed\n`); rmSync(bundle, { force: true }); rmSync(tmp, { recursive: true, force: true }); process.exit(1); }

ok("it returns every key the caller reads", [
  "properties", "portfolioAccounts", "valuables", "tasks", "cashFlowEvents", "documents",
  "familyMembers", "serviceProviders", "expenseByCategory", "spendByVendor",
  "dataSourceNotes", "notTracked", "totals", "counts",
].every(k => k in snap));

const cat = Object.fromEntries((snap.expenseByCategory || []).map(c => [c.category, c]));
const ven = Object.fromEntries((snap.spendByVendor || []).map(v => [v.vendor, v]));

// ── 2. The property id, and the suppression rule it makes possible ───────────
console.log("\nProperty ids reach the derivation, so suppression can match");
ok("snapshot properties carry an id", snap.properties.every(p => !!p.id));
ok("both property ids are distinct", new Set(snap.properties.map(p => p.id)).size === 2);
// The bug: utilities itemised for Ocean Vista AND the blended $950 derived alongside it.
// $520+$180+$250 = $950/mo itemised, plus Gulf Shore's $320 derived = $1,270/mo = $15,240.
ok("utilities are NOT double-counted", cat.utilities.annualised === 15240,
  `got ${cat.utilities?.annualised} — 26640 means the blended figure was added on top`);
ok("utilities cover 4 lines: 3 itemised plus Gulf Shore derived", cat.utilities.lines === 4,
  `got ${cat.utilities?.lines}`);
ok("Ocean Vista's blended utilities figure was suppressed",
  !cat.utilities.items.some(i => i.source === "property record" && i.property === "4 Ocean Vista Dr"));
ok("Gulf Shore's utilities still derive, it was not itemised",
  cat.utilities.items.some(i => i.source === "property record" && i.property === "210 Gulf Shore Blvd Unit 8B"));

// ── 3. Vendors resolve through the field mapper ───────────────────────────────
console.log("\nVendor columns survive the snake_case to camelCase mapping");
ok("spendByVendor is not empty", (snap.spendByVendor || []).length > 0,
  "empty means vendorFamilyContactId / vendorPropertyContactId did not map");
ok("ABC Landscaping resolves from the contact record", !!ven["ABC Landscaping"]);
ok("ABC Landscaping is $22,200 a year", ven["ABC Landscaping"]?.annualised === 22200,
  `got ${ven["ABC Landscaping"]?.annualised}`);
ok("Florida Power & Light is $6,240 a year", ven["Florida Power & Light"]?.annualised === 6240,
  `got ${ven["Florida Power & Light"]?.annualised}`);
// Vendors named on the property record itself, at no extra data-entry cost.
ok("the insurance carrier is picked up from the property", !!ven["Chubb"]);
ok("the lender is picked up from the property", !!ven["Goldman Sachs Private Bank"]);

// ── 4. Figures a client would be told ────────────────────────────────────────
console.log("\nThe figures themselves");
ok("landscaping is $27,240 across 2 lines",
  cat.landscaping.annualised === 27240 && cat.landscaping.lines === 2,
  `got ${cat.landscaping?.annualised} over ${cat.landscaping?.lines}`);
ok("landscaping monthly average is $2,270", cat.landscaping.monthlyAverage === 2270);
ok("landscaping is genuinely monthly, so it may be stated as a payment",
  cat.landscaping.everyLineIsMonthly === true);
// Tax and premiums are held as ANNUAL figures and smoothed to a monthly amount for the
// projection. Reporting them as a monthly payment would be a false statement.
ok("insurance is flagged as NOT a monthly payment", cat.insurance.everyLineIsMonthly === false);
ok("insurance is billed annually", cat.insurance.frequencies.includes("annually"));
ok("insurance totals both properties' premiums and flood",
  cat.insurance.annualised === 14200 + 3100 + 5200 + 2600, `got ${cat.insurance?.annualised}`);
ok("taxes total both properties", cat.taxes.annualised === 28500 + 11400);
ok("debt service covers both mortgages", cat.debt_service.annualised === (8215 + 4850) * 12);
ok("income never appears as spend", !Object.values(cat).some(c => c.annualised === 42000 * 12));

// ── 5. Honesty output ─────────────────────────────────────────────────────────
console.log("\nWhat the assistant is told about the figures");
ok("every expense item names its source",
  Object.values(cat).every(c => c.items.every(i => !!i.source)));
ok("smoothed categories are named in dataSourceNotes",
  (snap.dataSourceNotes || []).some(n => /SMOOTHED average/.test(n)));
ok("no duplicate warning fires when nothing is duplicated",
  (snap.probableDuplicateSpend || []).length === 0,
  JSON.stringify((snap.probableDuplicateSpend || []).map(d => d.category)));

// A manual line duplicating a property figure must be flagged, not silently merged.
const dupData = structuredClone(data);
dupData.cash_flow_events.push({ id: "dup", familyId: FID, direction: "expense",
  eventType: "Property Tax Reserve", description: "Combined property tax reserve",
  amount: 3325, frequency: "monthly", category: "taxes", propertyId: null });
const dupSnap = buildFamilySnapshot(family, dupData);
ok("a duplicate manual tax line IS flagged",
  (dupSnap.probableDuplicateSpend || []).some(d => d.category === "taxes" && d.likelySameMoney));

// ── 6. Degenerate inputs must not throw ──────────────────────────────────────
console.log("\nA household with nothing recorded");
const bare = { families: [family], properties: [], cash_flow_events: [], cash_flow_payment_log: [],
  documents: [], tasks: [], valuables: [], portfolio_accounts: [], account_balances: [],
  contacts: [], family_contacts: [], property_contacts: [] };
let bareSnap = null;
try { bareSnap = buildFamilySnapshot(family, bare); } catch (e) { bareSnap = e; }
ok("an empty household returns a snapshot rather than throwing", !(bareSnap instanceof Error),
  bareSnap instanceof Error ? bareSnap.message : "");
ok("with no spend, expenseByCategory is empty", (bareSnap.expenseByCategory || []).length === 0);
ok("with no vendors, spendByVendor is empty", (bareSnap.spendByVendor || []).length === 0);

rmSync(bundle, { force: true });
rmSync(tmp, { recursive: true, force: true });
// ── The opt-out path: a firm that has not categorised its expenses ───────────
//
// This is the state PCM production was in. Derived lines must NOT appear, because they
// would be added on top of bundled manual lines and double-count real client money. But
// the assistant must still not claim the spend is zero — the figures ARE on the property
// records, so they are named in dataSourceNotes instead.
console.log("\nWith derivation opted out (the default)");
FIRM_DEFAULTS.derivePropertyCosts = false;
const off = buildFamilySnapshot(family, data);
const offCat = Object.fromEntries((off.expenseByCategory || []).map(c => [c.category, c]));
ok("no property-derived items appear anywhere",
  !Object.values(offCat).some(c => c.items.some(i => i.source === "property record")));
ok("utilities show ONLY the three itemised lines", offCat.utilities.annualised === 11400,
  `got ${offCat.utilities?.annualised}`);
ok("categories held only on the property vanish from spend", !offCat.taxes && !offCat.insurance);
// The honesty requirement. Silence here would read as "you spend nothing on tax".
ok("the property-held figures are still named for the assistant",
  (off.dataSourceNotes || []).some(n => /does NOT feed them into the Cash Flow tab/.test(n)));
ok("and it is told not to say nothing is recorded",
  (off.dataSourceNotes || []).some(n => /do NOT say that nothing is recorded/.test(n)));
ok("the note carries the real annual tax figure",
  (off.dataSourceNotes || []).some(n => n.includes("39,900")));
ok("no duplicate warning fires when nothing is derived",
  (off.probableDuplicateSpend || []).length === 0);
FIRM_DEFAULTS.derivePropertyCosts = true;

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
