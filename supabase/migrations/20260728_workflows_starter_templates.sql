-- ─────────────────────────────────────────────────────────────────────────────
-- STARTER PLAYBOOKS
--
-- The four workflow templates TitanOS ships with. These are rows rather than
-- schema, but they are kept here as a migration so that provisioning a new tenant
-- is one file to run, not a copy-paste out of an existing database.
--
-- Applied to: titanos-demo (2026-07-28), PCM production (2026-07-28)
--
-- Idempotent on `key`: re-running updates the definitions in place. A tenant that
-- has customised a playbook will have those edits overwritten by a re-run, which
-- is the intended behaviour for shipped starters — a firm wanting a permanent
-- variant should save it under a new key.
--
-- NOTE ON QUOTING: the step bodies are dollar-quoted. Inside dollar
-- quotes an apostrophe is literal and must NOT be doubled. Doubling them here is
-- how "the fund''s instructions" ended up stored verbatim in the demo and had to
-- be repaired. Write plain apostrophes.
--
-- Anchors agreed with PCM (2026-07-28):
--   * The transfer request goes to the bank 60 days before a premium is due.
--   * The firm prepares and submits payment instructions under its existing
--     authority. No client moves money, and the platform never moves money.
--   * Crummey notices are conditional per trust, and that question is resolved
--     before dates are computed because the 30-day window sets the whole schedule.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ILIT Premium Funding ─────────────────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'ilit_premium',
  'ILIT Premium Funding',
  'Carries an irrevocable life insurance trust premium from invoice to paid receipt. The firm prepares and submits the transfer request to the banking institution; the client never moves money themselves. Crummey notices are included only where the trust requires them, and that answer is settled up front because it changes every downstream date.',
  'Insurance',
  true,
  'obligation_date',
  $J$[
    {"key":"invoice_read","title":"Premium invoice received and read","offset_days":-75,"actor":"ai","kind":"extract","recipient":null,
     "note":"Pulls carrier, policy number, premium amount, due date and remittance details from the invoice in the Vault. Flags any change from last cycle."},
    {"key":"verify","title":"Verify amount, capacity and balances","offset_days":-67,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Checks the premium against last cycle, confirms annual exclusion capacity for the gift, and confirms the funding account can cover it. Anything that fails here blocks the cycle rather than proceeding quietly."},
    {"key":"transfer_request","title":"Prepare transfer request for the bank","offset_days":-60,"actor":"expert","kind":"draft_document","recipient":"bank","attach":["invoice"],
     "note":"Produces the completed transfer request: source account, destination trust account, amount tied to the invoice, and the policy number as reference, with the invoice attached as backup. The firm submits this under its existing authority once reviewed. Requires approval before it leaves the platform."},
    {"key":"funds_confirmed","title":"Confirm funds received in trust account","offset_days":-50,"actor":"external","kind":"confirm","recipient":null,
     "note":"Waiting on the bank. The cycle cannot progress until receipt is confirmed, because the gift date sets the Crummey clock."},
    {"key":"crummey_notices","title":"Issue Crummey notices to beneficiaries","offset_days":-48,"actor":"expert","kind":"draft_letter","recipient":"beneficiaries","requires":"crummey_required","opens_window_days":30,
     "note":"Only where the trust requires it. Opens the 30-day withdrawal window; the trustee should not pay the premium until it closes. Drafted from the firm template for review, never sent automatically."},
    {"key":"window_closed","title":"Withdrawal window closed","offset_days":-18,"actor":"ai","kind":"check","recipient":null,"requires":"crummey_required",
     "note":"Confirms the 30 days have run and no withdrawal right was exercised, clearing the trustee to pay."},
    {"key":"authorize_payment","title":"Trustee authorises premium payment","offset_days":-10,"actor":"expert","kind":"draft_email","recipient":"trustee","attach":["invoice","transfer_request"],
     "note":"Assembles invoice, policy number and payment method into one instruction for the trustee. Held for approval; the trustee, not the grantor, pays the carrier."},
    {"key":"payment_confirmed","title":"Premium paid and receipt filed","offset_days":3,"actor":"expert","kind":"confirm","recipient":null,
     "note":"Confirm the carrier received payment and file the receipt to the Vault against the policy."},
    {"key":"close_cycle","title":"Log payment and queue next cycle","offset_days":7,"actor":"ai","kind":"file","recipient":null,
     "note":"Records the payment against cash flow and creates next year's instance from the obligation, so the cycle never has to be remembered."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Property Insurance Renewal ───────────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'insurance_renewal',
  'Property Insurance Renewal',
  'Runs a property policy from renewal offer to bound coverage and a filed declarations page. Includes an optional market-check step for families who want coverage shopped each year.',
  'Insurance',
  true,
  'obligation_date',
  $J$[
    {"key":"offer_read","title":"Renewal offer received and read","offset_days":-75,"actor":"ai","kind":"extract","recipient":null,
     "note":"Pulls carrier, premium, limits, deductibles and effective dates from the renewal offer."},
    {"key":"compare","title":"Compare against expiring coverage","offset_days":-68,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Flags premium movement and any change in limits, deductibles or excluded perils versus the expiring policy. This is where a quietly reduced limit gets caught."},
    {"key":"market_check","title":"Shop the market","offset_days":-55,"actor":"expert","kind":"draft_email","recipient":"internal","requires":"shop_market",
     "note":"Only where the family wants coverage re-bid. Drafts the broker request with the current schedule attached."},
    {"key":"recommend","title":"Recommendation to the client","offset_days":-40,"actor":"expert","kind":"draft_email","recipient":"grantor",
     "note":"Renew as offered, or move carrier, with the reasoning and the premium difference stated plainly."},
    {"key":"payment_request","title":"Prepare premium payment request","offset_days":-25,"actor":"expert","kind":"draft_document","recipient":"bank","attach":["invoice"],
     "note":"Completed request for the bank, referencing the policy number."},
    {"key":"bound","title":"Confirm coverage bound","offset_days":-7,"actor":"expert","kind":"confirm","recipient":null,
     "note":"Confirm the carrier has bound cover before the expiring policy lapses. Blocking: a gap here is uninsured exposure."},
    {"key":"file_dec","title":"File the new declarations page","offset_days":3,"actor":"expert","kind":"file","recipient":null,
     "note":"Files the new dec page to the Vault linked to the property's Insurance Declarations section, so the property card shows current coverage."},
    {"key":"close_cycle","title":"Update record and queue next renewal","offset_days":6,"actor":"ai","kind":"file","recipient":null,
     "note":"Updates premium and expiry on the property record and creates next year's instance."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Quarterly Estimated Tax Payment ──────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'estimated_tax',
  'Quarterly Estimated Tax Payment',
  'Carries a quarterly estimated tax payment from calculation to filed confirmation. Short lead time and no third-party window, so the shape is deliberately tighter than the insurance playbooks.',
  'Tax',
  true,
  'obligation_date',
  $J$[
    {"key":"compute","title":"Confirm the quarter's payment amount","offset_days":-30,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Compares the scheduled amount against year-to-date income and last year's liability, and flags if safe-harbour coverage looks short."},
    {"key":"cpa_confirm","title":"Confirm figure with the CPA","offset_days":-24,"actor":"expert","kind":"draft_email","recipient":"internal","requires":"confirm_with_cpa",
     "note":"Only where the family's accountant signs off on each instalment. Drafted for review."},
    {"key":"transfer_request","title":"Prepare payment request for the bank","offset_days":-21,"actor":"expert","kind":"draft_document","recipient":"bank","attach":["prior_confirmation"],
     "note":"Completed request: source account, taxing authority, amount, and the period as reference. Submitted by the firm after review."},
    {"key":"payment_confirmed","title":"Confirm payment posted","offset_days":2,"actor":"expert","kind":"confirm","recipient":null,
     "note":"Confirm the authority received it and file the confirmation to the Vault."},
    {"key":"close_cycle","title":"Log payment and queue next quarter","offset_days":5,"actor":"ai","kind":"file","recipient":null,
     "note":"Records against cash flow and creates the next instalment."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Private Fund Capital Call ────────────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'capital_call',
  'Private Fund Capital Call',
  'Handles a capital call from notice to wired confirmation. Very short fuse — these often arrive with under two weeks'' notice, so the playbook front-loads the liquidity check.',
  'Investments',
  true,
  'obligation_date',
  $J$[
    {"key":"notice_read","title":"Call notice received and read","offset_days":-12,"actor":"ai","kind":"extract","recipient":null,
     "note":"Pulls fund name, call amount, wire instructions and due date from the notice."},
    {"key":"liquidity","title":"Verify remaining commitment and liquidity","offset_days":-10,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Checks the call against remaining unfunded commitment and confirms the funding account can meet it without a forced sale. Blocks if it cannot."},
    {"key":"transfer_request","title":"Prepare wire request for the bank","offset_days":-7,"actor":"expert","kind":"draft_document","recipient":"bank","attach":["invoice"],
     "note":"Completed wire request using the fund's instructions verbatim, with the call notice attached. Wire details are never re-typed from memory."},
    {"key":"wired","title":"Confirm wire sent and received","offset_days":-1,"actor":"expert","kind":"confirm","recipient":null,
     "note":"Confirm before the deadline. A missed call can carry real penalties under the partnership agreement."},
    {"key":"close_cycle","title":"File confirmation and update commitment","offset_days":3,"actor":"ai","kind":"file","recipient":null,
     "note":"Files the confirmation and reduces the remaining unfunded commitment."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();
