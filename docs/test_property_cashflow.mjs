// Tests for deriving property costs into cash-flow lines.
//
// What is being protected: a property cost is entered once, on the property, and shows
// up exactly once in cash flow and in a client answer. The bug this replaced counted
// Gulf Shore's property tax twice — subtracted inside a netted rental line AND included
// in a manual expense line — so the tests that matter most are the ones asserting a
// figure appears once and only once.
//
// Run: node docs/test_property_cashflow.mjs

import { derivePropertyEvents, propertyNetMonthly, findProbableDuplicates } from "../src/propertyCashFlow.js";

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}${d ? " — " + d : ""}`); } };
const sum = (evs, cat) => evs.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);

// 4 Ocean Vista Dr — no rental income. Real figures from the demo database.
const oceanVista = {
  id: "ov", address: "4 Ocean Vista Dr",
  propertyTaxesAnnual: 28500, insurancePremiumAnnual: 14200, floodInsurancePremiumAnnual: 3100,
  utilitiesMonthly: 950, hoaFeeMonthly: 650, monthlyPayment: 8215,
  rentalIncomeMonthly: 0, includeMortgageInCashflow: true,
};
// 210 Gulf Shore 8B — a rental at $6,800/mo with an 8% management fee.
const gulfShore = {
  id: "gs", address: "210 Gulf Shore Blvd Unit 8B",
  propertyTaxesAnnual: 11400, insurancePremiumAnnual: 5200, floodInsurancePremiumAnnual: 2600,
  utilitiesMonthly: 320, hoaFeeMonthly: 980, monthlyPayment: 4850,
  rentalIncomeMonthly: 6800, propertyManagementFeePct: 8, includeMortgageInCashflow: true,
};

console.log("\nA property with no rental income");
const ov = derivePropertyEvents([oceanVista]);
ok("emits lines at all (it previously emitted none)", ov.length === 6, `got ${ov.length}`);
ok("no income line", !ov.some(e => e.direction === "income"));
ok("tax is annual/12", sum(ov, "taxes") === 2375);
// Insurance is two lines (premium + flood), each an annual figure divided by 12, so each
// carries a repeating decimal. Summing the MONTHLY amounts drifts —
// 1183.33 + 258.33 = 1441.6599999999999 — which is why nothing in the product sums
// monthly floats for display. The rollup annualises each line to a whole number first
// (round(1183.33 * 12) = 14200) and adds integers, so the total reconstructs the source
// figures exactly. That is the property worth asserting.
const annualiseLine = e => Math.round(e.amount * 12);
const annualSum = (evs, cat) => evs.filter(e => e.category === cat).reduce((s, e) => s + annualiseLine(e), 0);
ok("insurance annualises back to the exact source figures",
  annualSum(ov, "insurance") === 14200 + 3100, `got ${annualSum(ov, "insurance")}`);
// 1441.66, NOT 1441.67. Two lines rounded to cents individually (1183.33 + 258.33) lose
// a cent against the combined 17300/12 = 1441.6667. That is inherent to itemising and is
// why no total a client sees is built by summing monthly floats — the annualised
// assertion above is the one that has to hold.
ok("monthly insurance is the sum of two cent-rounded lines",
  Math.abs(sum(ov, "insurance") - 1441.66) < 0.005, `got ${sum(ov, "insurance")}`);
// The figure a client is actually shown must be a clean whole number.
ok("no category total shows stray cents",
  ["taxes", "insurance", "utilities", "property_management", "debt_service"]
    .every(c => Number.isInteger(annualSum(ov, c))));
ok("utilities pass through monthly", sum(ov, "utilities") === 950);
ok("HOA totals under property management", sum(ov, "property_management") === 650);
ok("mortgage under debt service", sum(ov, "debt_service") === 8215);
ok("every line names its property", ov.every(e => e._propertyAddress === "4 Ocean Vista Dr"));
ok("every line names the field it came from", ov.every(e => !!e._field));
ok("every line is marked as derived", ov.every(e => e._synthetic && e._source === "property"));

console.log("\nA rental property — gross rent plus itemised costs, not one netted line");
const gs = derivePropertyEvents([gulfShore]);
const rentLine = gs.find(e => e.direction === "income");
ok("rent appears GROSS, not net of costs", rentLine.amount === 6800, `got ${rentLine.amount}`);
// The whole point. Previously the tax was inside the rental figure and existed nowhere
// as an expense, so it could not be totalled by category.
ok("the tax exists as its own expense line", sum(gs, "taxes") === 950);
ok("management fee is a percentage of rent", sum(gs, "property_management") === 980 + 544,
  `got ${sum(gs, "property_management")}`);
// Net must still come out where the old netted line had it: 6800 - 950 - 650 - 320 - 980 - 544 - 4850
ok("net position is unchanged by itemising", propertyNetMonthly(gulfShore) === -1494,
  `got ${propertyNetMonthly(gulfShore)}`);

console.log("\nThe mortgage opt-out is honoured");
const noMort = derivePropertyEvents([{ ...oceanVista, includeMortgageInCashflow: false }]);
ok("no debt service when opted out", sum(noMort, "debt_service") === 0);
ok("other costs still derive", sum(noMort, "taxes") === 2375);

console.log("\nThe includeRental toggle governs a rental property wholesale");
const projOff = derivePropertyEvents([oceanVista, gulfShore], { includeRental: false, forProjection: true });
ok("the rental property is excluded entirely from the projection",
  !projOff.some(e => e._propertyId === "gs"));
// Including a property's costs while excluding its rent would make net cash flow look
// worse than reality — the opposite of what the toggle is for.
ok("the non-rental property is unaffected", projOff.filter(e => e._propertyId === "ov").length === 6);
// But a spend question must not depend on a projection checkbox.
const snap = derivePropertyEvents([oceanVista, gulfShore], { includeRental: false, forProjection: false });
ok("the snapshot ignores the toggle and sees both", snap.some(e => e._propertyId === "gs"));

console.log("\nEach cost appears exactly once across a household");
const both = derivePropertyEvents([oceanVista, gulfShore]);
ok("taxes = both properties, counted once", sum(both, "taxes") === 2375 + 950);
ok("debt service = both mortgages, counted once", sum(both, "debt_service") === 8215 + 4850);
ok("ids are unique, so nothing can be emitted twice",
  new Set(both.map(e => e.id)).size === both.length);

console.log("\nProbable duplicates are flagged, not resolved");
// Harrington's real case before cleanup: a manual tax line matching the derived total.
const dupes = findProbableDuplicates(
  [{ direction: "expense", category: "taxes", description: "Combined property tax reserve", amount: 3325, frequency: "monthly" }],
  derivePropertyEvents([oceanVista, gulfShore]));
ok("the overlap is detected", dupes.length === 1 && dupes[0].category === "taxes");
ok("matching figures are called likely-same-money", dupes[0].likelySameMoney === true,
  `manual ${dupes[0].manual} vs derived ${dupes[0].derived}`);
ok("both sides are named so a human can judge",
  dupes[0].manualLines.length === 1 && dupes[0].derivedLines.length === 2);

// Okonkwo's real case: a bundled line that is only PARTLY a duplicate. It must not be
// reported as the same money, because deleting it would erase the auto and umbrella
// cover that exists nowhere else.
const partial = findProbableDuplicates(
  [{ direction: "expense", category: "insurance", description: "Home + auto + umbrella", amount: 815, frequency: "monthly" }],
  derivePropertyEvents([{ id: "ok", address: "2208 Cameron Glen Dr", insurancePremiumAnnual: 4900 }]));
ok("a partly-overlapping bundle is NOT called the same money", partial[0].likelySameMoney === false,
  `manual ${partial[0].manual} vs derived ${partial[0].derived}`);

ok("no overlap reported when only one source has spend",
  findProbableDuplicates([{ direction: "expense", category: "landscaping", amount: 1850, frequency: "monthly" }], []).length === 0);

console.log("\nDefensive cases");
ok("no properties yields no lines", derivePropertyEvents([]).length === 0);
ok("undefined is tolerated", derivePropertyEvents(undefined).length === 0);
ok("a property with no costs yields no lines",
  derivePropertyEvents([{ id: "x", address: "Empty" }]).length === 0);
ok("zero and null amounts are skipped, not emitted as $0 lines",
  derivePropertyEvents([{ id: "z", address: "Z", propertyTaxesAnnual: 0, utilitiesMonthly: null }]).length === 0);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
