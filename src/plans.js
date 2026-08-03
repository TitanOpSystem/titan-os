// Service plans: which tier a household is on, and what that tier includes.
//
// WHY THIS IS A MODULE AND NOT INLINE IN App.jsx
//
// The plan decides whether a family sees workflows and bill pay — features the firm charges for.
// A gate that is written out longhand at each of the six places it applies will drift, and the
// direction it drifts in is the expensive one: a household that stops paying keeps the feature, or
// one that is paying loses it. One function, called everywhere, tested by calling the real thing.
//
// THE UI IS NOT THE ENFORCEMENT
//
// Everything here is presentation. A determined caller with a valid session can reach the tables
// directly, so the actual refusal lives in the database: see
// supabase/migrations/20260802_family_plan.sql, which raises on any attempt to write an
// obligation, a workflow instance, a bill-pay flag or a payment-log row against a Core family.
// These functions decide what to *draw*. The triggers decide what is *allowed*.

export const PLANS = ["core", "premier"];

export const PLAN_LABEL = { core: "Core", premier: "Premier" };

// Deliberately brand-neutral. "Titan Core" would be a white-label leak the moment a second firm
// runs this codebase — the same bug already shipped three times in the edge functions.
export const PLAN_BLURB = {
  core: "Full platform. Partner is the lead — no assigned expert, no workflows, no bill pay.",
  premier: "Full platform with an assigned expert, workflows and bill pay.",
};

export const PLAN_FEATURES = {
  core: { assignedExpert: false, workflows: false, billPay: false },
  premier: { assignedExpert: true, workflows: true, billPay: true },
};

export const PLAN_FEATURE_LABEL = {
  assignedExpert: "Assigned expert",
  workflows: "Workflows and obligations",
  billPay: "Bill pay and payment register",
};

// The upper tier was called 'private' before it was renamed to 'premier'. The database still
// accepts the old value, because a browser tab opened before the rename shipped will write it, and
// turning that into a hard failure on an admin action would be worse than carrying an alias. Mapped
// explicitly rather than left to fall through the unknown-value branch below: it lands on the same
// answer either way, but only one of those says so on purpose.
const ALIASES = { private: "premier" };

/**
 * Resolve whatever is on the row to a plan we have features for.
 *
 * An unrecognised or missing value resolves to `premier`, NOT to the lesser tier, and that is a
 * deliberate reversal of the fail-closed rule used for the firm-level feature gates.
 *
 * The reasoning: the column is NOT NULL DEFAULT 'premier' with every existing row backfilled, so
 * a blank here means a row read by a stale client or a tier added later — not an unpaid family.
 * Resolving those to `core` would hide the payment register from a household that is paying for
 * bill pay, and a family who cannot see that a bill was paid concludes it was not. That is a worse
 * failure than briefly showing a control to someone who did not buy it, because the database
 * refuses that write anyway. A future tier above Premier also inherits Premier's features, which
 * is the right default for a tier that is a superset.
 */
export function normalisePlan(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (PLANS.includes(v)) return v;
  if (ALIASES[v]) return ALIASES[v];
  return "premier";
}

/**
 * Does this plan include this feature?
 *
 * @param plan     Raw value from families.plan.
 * @param feature  Key of PLAN_FEATURES entries.
 *
 * An unknown feature name returns false. A typo in a gate should hide the feature and be noticed,
 * rather than read as "allowed" and silently open it to every tier.
 */
export function planAllows(plan, feature) {
  const f = PLAN_FEATURES[normalisePlan(plan)];
  return f ? f[feature] === true : false;
}

/** Label for a plan, for badges and form options. */
export function planLabel(plan) {
  return PLAN_LABEL[normalisePlan(plan)];
}

/** Feature keys a plan does NOT include, for "what changes if we upgrade" copy. */
export function planExclusions(plan) {
  const f = PLAN_FEATURES[normalisePlan(plan)];
  return Object.keys(PLAN_FEATURE_LABEL).filter(k => f[k] !== true);
}

// NO familyIdsAllowing HELPER HERE, DELIBERATELY
//
// The obvious next function is one that filters a cross-book list — the review queue — down to
// families whose plan allows a feature. It is not needed, and writing it would imply the invariant
// is weaker than it is: workflow_instance_steps has no family_id, so filtering it would cost an
// extra query to resolve instance -> family, and that query can never remove a row. A Core
// household cannot hold a workflow instance (the trigger refuses the insert) and a household
// holding instances cannot be moved to Core (the downgrade trigger refuses that too), so no step
// in the table can belong to a Core family. Both halves are proved in docs/test_plans.mjs and were
// exercised against the live schema before this shipped.
