// Tests for the Core / Premier service plan gate.
//
// These call the real functions from src/plans.js. The gate decides what a household has paid for,
// so the assertions worth having are the ones about the edges: a missing plan, an unrecognised
// plan, a misspelt feature name. Each of those resolves in a direction that was chosen on purpose,
// and a future change that flips one should fail here rather than in front of a client.
//
// The database half of the gate — the triggers that refuse workflow, obligation, bill-pay and
// payment-log writes on a Core household, and refuse a downgrade that would strand them — cannot be
// tested from node. It was exercised against the live demo schema with a scratch household: twelve
// checks, all passing, recorded in docs/HANDOFF-plans.md.
//
// Run: node docs/test_plans.mjs

import {
  PLANS, PLAN_LABEL, PLAN_BLURB, PLAN_FEATURES, PLAN_FEATURE_LABEL,
  normalisePlan, planAllows, planLabel, planExclusions,
} from "../src/plans.js";

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}${d ? " — " + d : ""}`); } };

console.log("\nThe two plans");
ok("there are exactly two", PLANS.length === 2);
ok("core and premier, in that order", PLANS[0] === "core" && PLANS[1] === "premier");
ok("every plan has a label", PLANS.every(p => !!PLAN_LABEL[p]));
ok("every plan has a blurb", PLANS.every(p => !!PLAN_BLURB[p]));
ok("every plan has a feature set", PLANS.every(p => !!PLAN_FEATURES[p]));
// A tier whose blurb names a brand would leak the moment a second firm runs this codebase — the
// same bug shipped three times in the edge functions.
ok("no blurb names a brand", PLANS.every(p => !/titan|pcm|accurate/i.test(PLAN_BLURB[p])));
ok("no label names a brand", PLANS.every(p => !/titan|pcm/i.test(PLAN_LABEL[p])));

console.log("\nWhat Core includes");
ok("Core has no assigned expert", planAllows("core", "assignedExpert") === false);
ok("Core has no workflows", planAllows("core", "workflows") === false);
ok("Core has no bill pay", planAllows("core", "billPay") === false);
// The whole point of the tier: it is the full platform minus three things, not a crippled one.
ok("Core withholds exactly three features", planExclusions("core").length === 3);
ok("and they are the three named", planExclusions("core").sort().join(",")
  === ["assignedExpert", "billPay", "workflows"].sort().join(","));

console.log("\nWhat Premier includes");
ok("Premier has an assigned expert", planAllows("premier", "assignedExpert") === true);
ok("Premier has workflows", planAllows("premier", "workflows") === true);
ok("Premier has bill pay", planAllows("premier", "billPay") === true);
ok("Premier withholds nothing", planExclusions("premier").length === 0);
ok("every feature key has a human label",
  Object.keys(PLAN_FEATURES.premier).every(k => !!PLAN_FEATURE_LABEL[k]));

console.log("\nA missing or unrecognised plan");
// This is the decision most likely to be reversed by someone applying the fail-closed rule used
// for the firm-level gates. It is reversed on purpose: the column is NOT NULL DEFAULT 'premier'
// with every row backfilled, so a blank means a stale client or a tier added later — not an unpaid
// household. Resolving to core would hide the payment register from a family paying for bill pay,
// and a family who cannot see that a bill was paid concludes it was not. The database refuses the
// write regardless, so the generous reading here cannot become a real entitlement.
ok("null resolves to premier", normalisePlan(null) === "premier");
ok("undefined resolves to premier", normalisePlan(undefined) === "premier");
ok("an empty string resolves to premier", normalisePlan("") === "premier");
ok("whitespace resolves to premier", normalisePlan("   ") === "premier");
ok("gibberish resolves to premier", normalisePlan("banana") === "premier");
// A tier added above Premier is a superset, so inheriting Premier's features is right.
ok("a future tier resolves to premier", normalisePlan("estate") === "premier");
ok("and so gets bill pay rather than losing it", planAllows("estate", "billPay") === true);

console.log("\nThe legacy 'private' value");
// The upper tier was called 'private' until it was renamed to Premier. The database still accepts
// the old value, because a browser tab opened before the rename shipped will write it and a hard
// failure on an admin action would be worse than an alias. Asserted explicitly: it happens to land
// on premier via the unknown-value branch too, so a future change to that branch could break the
// alias silently and nothing else would notice.
ok("'private' resolves to premier", normalisePlan("private") === "premier");
ok("and it labels as Premier, not as itself", planLabel("private") === "Premier");
ok("and it keeps bill pay", planAllows("private", "billPay") === true);
ok("and it keeps workflows", planAllows("private", "workflows") === true);
ok("and it keeps its assigned expert", planAllows("private", "assignedExpert") === true);
ok("mixed case works too", normalisePlan("Private") === "premier");
// It must NOT appear in the picker — the form renders one button per PLANS entry.
ok("the old name is not offered as a choice", !PLANS.includes("private"));

console.log("\nSloppy input that should still land on the right plan");
ok("case is ignored", normalisePlan("CORE") === "core");
ok("mixed case is ignored", normalisePlan("Premier") === "premier");
ok("padding is trimmed", normalisePlan("  core  ") === "core");
ok("a padded label still gates correctly", planAllows(" Core ", "billPay") === false);
ok("a number does not throw", normalisePlan(7) === "premier");
ok("an object does not throw", normalisePlan({}) === "premier");

console.log("\nAn unknown feature name");
// A typo in a gate must hide the feature and be noticed, not read as "allowed" and open it to
// every tier. `planAllows(plan,"billpay")` — wrong case — is the realistic version of this.
ok("an unknown feature is refused on Premier", planAllows("premier", "nonsense") === false);
ok("an unknown feature is refused on Core", planAllows("core", "nonsense") === false);
ok("a miscased feature name is refused", planAllows("premier", "billpay") === false);
ok("no feature name is refused", planAllows("premier", undefined) === false);
ok("a feature set is never mutated by a lookup",
  planAllows("core", "billPay") === false && PLAN_FEATURES.core.billPay === false);

console.log("\nLabels");
ok("core labels as Core", planLabel("core") === "Core");
ok("premier labels as Premier", planLabel("premier") === "Premier");
ok("an unknown plan labels as Premier rather than blank", planLabel("banana") === "Premier");
ok("a null plan labels rather than throwing", planLabel(null) === "Premier");

console.log("\nThe shape the UI depends on");
// The family form renders one button per PLANS entry and refuses to save until f.plan is one of
// them. If PLANS and PLAN_FEATURES ever disagree, the form offers a plan with no features.
ok("PLANS and PLAN_FEATURES have the same keys",
  PLANS.slice().sort().join(",") === Object.keys(PLAN_FEATURES).sort().join(","));
ok("PLANS and PLAN_LABEL have the same keys",
  PLANS.slice().sort().join(",") === Object.keys(PLAN_LABEL).sort().join(","));
ok("every plan describes every feature",
  PLANS.every(p => Object.keys(PLAN_FEATURE_LABEL)
    .every(k => typeof PLAN_FEATURES[p][k] === "boolean")));
// Premier must be a strict superset of Core, or "upgrade" would take something away.
ok("Premier is a superset of Core",
  Object.keys(PLAN_FEATURES.core).every(k => !PLAN_FEATURES.core[k] || PLAN_FEATURES.premier[k]));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
