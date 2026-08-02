// Tests for the Core / Private service plan gate.
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
ok("core and private, in that order", PLANS[0] === "core" && PLANS[1] === "private");
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

console.log("\nWhat Private includes");
ok("Private has an assigned expert", planAllows("private", "assignedExpert") === true);
ok("Private has workflows", planAllows("private", "workflows") === true);
ok("Private has bill pay", planAllows("private", "billPay") === true);
ok("Private withholds nothing", planExclusions("private").length === 0);
ok("every feature key has a human label",
  Object.keys(PLAN_FEATURES.private).every(k => !!PLAN_FEATURE_LABEL[k]));

console.log("\nA missing or unrecognised plan");
// This is the decision most likely to be reversed by someone applying the fail-closed rule used
// for the firm-level gates. It is reversed on purpose: the column is NOT NULL DEFAULT 'private'
// with every row backfilled, so a blank means a stale client or a tier added later — not an unpaid
// household. Resolving to core would hide the payment register from a family paying for bill pay,
// and a family who cannot see that a bill was paid concludes it was not. The database refuses the
// write regardless, so the generous reading here cannot become a real entitlement.
ok("null resolves to private", normalisePlan(null) === "private");
ok("undefined resolves to private", normalisePlan(undefined) === "private");
ok("an empty string resolves to private", normalisePlan("") === "private");
ok("whitespace resolves to private", normalisePlan("   ") === "private");
ok("gibberish resolves to private", normalisePlan("banana") === "private");
// A tier added above Private is a superset, so inheriting Private's features is right.
ok("a future tier resolves to private", normalisePlan("estate") === "private");
ok("and so gets bill pay rather than losing it", planAllows("estate", "billPay") === true);

console.log("\nSloppy input that should still land on the right plan");
ok("case is ignored", normalisePlan("CORE") === "core");
ok("mixed case is ignored", normalisePlan("Private") === "private");
ok("padding is trimmed", normalisePlan("  core  ") === "core");
ok("a padded label still gates correctly", planAllows(" Core ", "billPay") === false);
ok("a number does not throw", normalisePlan(7) === "private");
ok("an object does not throw", normalisePlan({}) === "private");

console.log("\nAn unknown feature name");
// A typo in a gate must hide the feature and be noticed, not read as "allowed" and open it to
// every tier. `planAllows(plan,"billpay")` — wrong case — is the realistic version of this.
ok("an unknown feature is refused on Private", planAllows("private", "nonsense") === false);
ok("an unknown feature is refused on Core", planAllows("core", "nonsense") === false);
ok("a miscased feature name is refused", planAllows("private", "billpay") === false);
ok("no feature name is refused", planAllows("private", undefined) === false);
ok("a feature set is never mutated by a lookup",
  planAllows("core", "billPay") === false && PLAN_FEATURES.core.billPay === false);

console.log("\nLabels");
ok("core labels as Core", planLabel("core") === "Core");
ok("private labels as Private", planLabel("private") === "Private");
ok("an unknown plan labels as Private rather than blank", planLabel("banana") === "Private");
ok("a null plan labels rather than throwing", planLabel(null) === "Private");

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
// Private must be a strict superset of Core, or "upgrade" would take something away.
ok("Private is a superset of Core",
  Object.keys(PLAN_FEATURES.core).every(k => !PLAN_FEATURES.core[k] || PLAN_FEATURES.private[k]));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
