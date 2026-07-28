-- ─────────────────────────────────────────────────────────────────────────────
-- FIVE MORE STARTER PLAYBOOKS
--
-- Applied to: PCM production (2026-07-28), titanos-demo (2026-07-28)
--
-- Chosen by consequence of failure rather than frequency. A missed GRAT annuity
-- unwinds the entire technique; unpaid intra-family loan interest can be
-- recharacterised as a gift years later; an unreviewed universal life policy
-- lapses quietly on an elderly insured; a short RMD carries a penalty; and a late
-- K-1 blocks a whole return.
--
-- LEAD TIMES ARE A STARTING POINT, NOT ADVICE. Deadlines and thresholds vary by
-- jurisdiction and change with legislation. Each firm should have its tax and legal
-- counsel confirm the offsets before a playbook runs against a real family, which
-- is why these are editable rows rather than code.
--
-- Idempotent on `key`: re-running updates the definitions in place.
--
-- QUOTING: step bodies are dollar-quoted. Inside dollar quotes an apostrophe is
-- literal and must NOT be doubled.
-- ─────────────────────────────────────────────────────────────────────────────

-- New obligation kinds. The frontend dropdown (OBLIGATION_KINDS in App.jsx) is
-- updated to match; a kind the database accepts but the UI cannot offer is a kind
-- nobody can use.
alter table public.obligations drop constraint if exists obligations_kind_check;
alter table public.obligations add constraint obligations_kind_check
  check (kind in ('premium','tax','rmd','capital_call','loan_payment',
                  'grat_annuity','note_interest','policy_review','tax_document','other'));

-- ── GRAT Annuity Payment ─────────────────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'grat_annuity',
  'GRAT Annuity Payment',
  'Carries the annual annuity payment out of a grantor retained annuity trust. The least forgiving obligation in the set: the annuity must be paid in full and on time or the structure can fail, and the required amount usually steps up each year, so the arithmetic is easy to get wrong. Handles payment in kind, which needs a defensible valuation, and the final term year, where the remainder passes to the beneficiaries.',
  'Trusts & Estates',
  true,
  'obligation_date',
  $J$[
    {"key":"amount_confirmed","title":"Confirm this year's annuity amount","offset_days":-60,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Reads the annuity schedule from the trust instrument in the Vault and confirms this year's required payment, including any permitted step-up over last year. Flags immediately if the trust does not hold enough liquid value to pay it."},
    {"key":"liquidity_or_kind","title":"Decide cash or in-kind, and value it","offset_days":-45,"actor":"expert","kind":"check","recipient":"internal","requires":"in_kind_payment",
     "note":"Only where the annuity will be satisfied with assets rather than cash. A defensible valuation as at the distribution date is required; without it the payment amount is arguable after the fact."},
    {"key":"transfer_request","title":"Prepare the distribution instruction","offset_days":-30,"actor":"expert","kind":"draft_document","recipient":"bank","attach":["valuation"],
     "note":"Completed instruction moving cash or securities from the trust to the grantor, referencing the trust and the annuity year. The firm submits it under existing authority once reviewed."},
    {"key":"distribution_confirmed","title":"Confirm the distribution was made","offset_days":-14,"actor":"external","kind":"confirm","recipient":null,
     "note":"Blocking. Everything about this playbook exists to make sure this happened, in full, before the annuity date."},
    {"key":"receipt_recorded","title":"Record receipt by the grantor","offset_days":-5,"actor":"expert","kind":"confirm","recipient":null,
     "note":"Record the date and amount actually received. This is the evidence that the annuity was satisfied for the year."},
    {"key":"final_year_remainder","title":"Handle the remainder at end of term","offset_days":-3,"actor":"expert","kind":"draft_email","recipient":"trustee","requires":"final_term_year",
     "note":"Only in the final year of the GRAT term. Confirms with counsel and the trustee how the remaining assets pass to the remainder beneficiaries, and what filings follow."},
    {"key":"file_evidence","title":"File the confirmation against the trust","offset_days":3,"actor":"expert","kind":"file","recipient":null,
     "note":"Files proof of payment to the Vault so the year is documented if the structure is ever examined."},
    {"key":"close_cycle","title":"Log payment and queue next annuity","offset_days":7,"actor":"ai","kind":"file","recipient":null,
     "note":"Records against cash flow and creates next year's instance at the stepped-up amount, or closes the obligation if the term has ended."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Intra-Family Loan Interest ───────────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'note_interest',
  'Intra-Family Loan Interest',
  'Collects the annual interest due on a loan between family members or family entities. This one fails silently: if interest is not actually paid, the arrangement can be recharacterised as a gift long after the fact, and nobody notices in the meantime. Also watches for the note approaching maturity, where a renewal has to be priced at a current rate.',
  'Trusts & Estates',
  true,
  'obligation_date',
  $J$[
    {"key":"note_read","title":"Read the note and compute interest due","offset_days":-45,"actor":"ai","kind":"extract","recipient":null,
     "note":"Pulls principal, rate, payment dates and maturity from the promissory note in the Vault, and computes the interest due for the period. Flags any difference from last year."},
    {"key":"verify","title":"Verify the rate and check maturity","offset_days":-35,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Confirms the stated rate is the one required as at origination, that the note has not been modified without documentation, and whether maturity falls within the next twelve months."},
    {"key":"borrower_notice","title":"Remind the borrower what is due","offset_days":-21,"actor":"expert","kind":"draft_email","recipient":"grantor",
     "note":"Addressed to the borrowing family member. States the amount, the due date, and where to pay. Held for approval before it goes anywhere."},
    {"key":"renewal_analysis","title":"Price a renewal before maturity","offset_days":-18,"actor":"expert","kind":"draft_document","recipient":"internal","requires":"maturity_within_year",
     "note":"Only where the note matures within the year. Sets out the options: repay, renew at a current rate, or refinance, with the consequence of each stated plainly."},
    {"key":"payment_received","title":"Confirm the interest was actually paid","offset_days":-7,"actor":"external","kind":"confirm","recipient":null,
     "note":"Blocking, and the whole point of the playbook. An accrued-but-unpaid entry is not a payment. Confirm money moved."},
    {"key":"file_evidence","title":"File proof of payment against the note","offset_days":3,"actor":"expert","kind":"file","recipient":null,
     "note":"Files the bank record to the Vault linked to the note, so the payment history is provable years later."},
    {"key":"close_cycle","title":"Log payment and queue next year","offset_days":7,"actor":"ai","kind":"file","recipient":null,
     "note":"Records against cash flow and creates next year's instance, carrying forward the maturity warning if it now falls inside twelve months."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Life Insurance In-Force Review ───────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'policy_review',
  'Life Insurance In-Force Review',
  'Requests a current in-force illustration each year and checks whether the policy still does what it was bought to do. This is the quiet catastrophe of the set: a universal life policy whose costs have risen and whose crediting rate has fallen can be heading for lapse on an elderly insured while every statement still looks unremarkable. Cheap to run, and the year you catch it is the year it pays for the platform.',
  'Insurance',
  true,
  'obligation_date',
  $J$[
    {"key":"request_illustration","title":"Request a current in-force illustration","offset_days":-90,"actor":"expert","kind":"draft_email","recipient":"carrier",
     "note":"Asks the carrier or agent for an in-force illustration on current assumptions and again on guaranteed assumptions. The guaranteed run is the one that shows the real risk."},
    {"key":"illustration_received","title":"Illustration received","offset_days":-60,"actor":"external","kind":"confirm","recipient":null,
     "note":"Waiting on the carrier. Carriers are slow, which is why this starts ninety days out."},
    {"key":"analyse","title":"Compare against last year and against target","offset_days":-50,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Reads the illustration and reports the age the policy is now projected to lapse, how that has moved since last year, and whether current funding sustains it to the target age. Rising cost of insurance on an ageing insured is the usual culprit."},
    {"key":"remediation","title":"Set out the options","offset_days":-35,"actor":"expert","kind":"draft_document","recipient":"internal","requires":"remediation_needed",
     "note":"Only where the policy is projected to fall short. Lays out increasing premium, reducing face amount, exchanging to a better-suited policy, or letting it go, with the cost and consequence of each."},
    {"key":"client_summary","title":"Tell the client where the policy stands","offset_days":-21,"actor":"expert","kind":"draft_email","recipient":"grantor",
     "note":"Plain language, no illustration jargon: is the coverage still doing its job, and is anything needed. If nothing is needed, say so."},
    {"key":"trustee_copy","title":"Copy the trustee","offset_days":-14,"actor":"expert","kind":"draft_email","recipient":"trustee","requires":"owned_by_trust",
     "note":"Only where the policy is trust-owned. The trustee, not the insured, is the owner and carries the duty to monitor it."},
    {"key":"file_illustration","title":"File the illustration against the policy","offset_days":5,"actor":"expert","kind":"file","recipient":null,
     "note":"Files it to the Vault linked to the policy, so next year's comparison has something to compare against."},
    {"key":"close_cycle","title":"Update the record and queue next review","offset_days":10,"actor":"ai","kind":"file","recipient":null,
     "note":"Records the projected lapse age on the policy so deterioration is visible as a trend, and creates next year's review."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Required Minimum Distribution ────────────────────────────────────────────
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'rmd',
  'Required Minimum Distribution',
  'Takes a required distribution before the deadline, in the full amount. A shortfall carries a penalty on the amount not taken, and the arithmetic has traps: inherited accounts generally cannot be aggregated with the account owner''s own, and a charitable distribution has to go directly from the custodian to the charity to count.',
  'Tax',
  true,
  'obligation_date',
  $J$[
    {"key":"compute","title":"Compute the required amount","offset_days":-90,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Works from the prior year end balance and the applicable life expectancy factor for each account. Separates accounts that may be aggregated from inherited accounts that generally may not, because treating them alike is how a shortfall happens."},
    {"key":"cpa_confirm","title":"Confirm the figure with the CPA","offset_days":-75,"actor":"expert","kind":"draft_email","recipient":"internal","requires":"confirm_with_cpa",
     "note":"Only where the family's accountant signs off on the calculation."},
    {"key":"qcd_instruction","title":"Direct it to charity instead","offset_days":-60,"actor":"expert","kind":"draft_document","recipient":"bank","requires":"use_qcd",
     "note":"Only where some or all of the distribution goes to charity. The instruction must send funds directly from the custodian to the charity; money that touches the client's own account first does not achieve the same treatment."},
    {"key":"distribution_request","title":"Prepare the distribution request","offset_days":-45,"actor":"expert","kind":"draft_document","recipient":"bank","attach":["prior_confirmation"],
     "note":"Completed request to the custodian, including the withholding election. Late in the year custodians get busy, which is why this is not left to December."},
    {"key":"distribution_confirmed","title":"Confirm the distribution was taken","offset_days":-20,"actor":"external","kind":"confirm","recipient":null,
     "note":"Blocking. Waiting on the custodian, with enough time left to chase before the deadline."},
    {"key":"shortfall_check","title":"Check the full amount was distributed","offset_days":-5,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Compares what was actually distributed against what was required, across every account. A partial distribution is the failure this step exists to catch, while there is still time to fix it."},
    {"key":"file_evidence","title":"File the confirmation","offset_days":3,"actor":"expert","kind":"file","recipient":null,
     "note":"Files the distribution confirmation to the Vault, and notes the tax form to expect for the year."},
    {"key":"close_cycle","title":"Log the distribution and queue next year","offset_days":7,"actor":"ai","kind":"file","recipient":null,
     "note":"Records against cash flow and creates next year's instance."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();

-- ── Partnership K-1 Collection ───────────────────────────────────────────────
--
-- NOTE ON SHAPE. This is properly a chase: nudge repeatedly until the document
-- arrives. The engine cannot express that yet — steps are a fixed list, and
-- conditional flags are resolved when the cycle is created rather than evaluated
-- later, so a step cannot ask "is this still outstanding?" at the time it runs.
-- What follows is therefore a fixed-cadence approximation: scheduled follow-ups
-- that the Expert marks done or skipped depending on what has actually arrived.
-- It works, and it is honest about being a workaround rather than the real thing.
insert into public.workflow_templates (key, name, description, category, is_starter, trigger_kind, steps)
values (
  'k1_collection',
  'Partnership K-1 Collection',
  'Chases the tax documents that a return cannot be filed without. Fund administrators deliver late and unevenly, and a single outstanding document holds up everything. Runs backwards from the filing deadline with scheduled follow-ups and a decision point on extending, so the extension is a choice made in good time rather than a scramble in the last week.',
  'Tax',
  true,
  'obligation_date',
  $J$[
    {"key":"inventory","title":"List every document expected","offset_days":-75,"actor":"ai","kind":"check","recipient":"internal",
     "note":"Builds the expected list from the family's partnership and fund holdings, and marks which are already in the Vault. The list is the thing that makes the rest of this manageable."},
    {"key":"initial_request","title":"Ask each administrator for a delivery date","offset_days":-60,"actor":"expert","kind":"draft_email","recipient":"internal",
     "note":"A request for the expected delivery date, not just the document. Knowing which ones will be late is what makes the extension decision possible."},
    {"key":"follow_up_1","title":"First follow-up on anything outstanding","offset_days":-40,"actor":"expert","kind":"draft_email","recipient":"internal",
     "note":"Chase whatever has not arrived. Mark this step skipped if everything is already in — a skipped step stays visible, so the record still shows it was considered."},
    {"key":"follow_up_2","title":"Second follow-up, escalated","offset_days":-25,"actor":"expert","kind":"draft_email","recipient":"internal",
     "note":"Escalate to the relationship contact rather than the administrator inbox. Skip if not needed."},
    {"key":"extension_decision","title":"Decide on an extension","offset_days":-14,"actor":"expert","kind":"draft_document","recipient":"internal",
     "note":"With two weeks left, decide and document whether to extend. Made deliberately here rather than by default in the final days."},
    {"key":"deliver_to_accountant","title":"Send everything received to the accountant","offset_days":-7,"actor":"expert","kind":"draft_email","recipient":"internal","attach":["invoice"],
     "note":"Delivers the documents collected so far, with an explicit list of anything still missing so nothing is assumed."},
    {"key":"file_documents","title":"File the documents to the Vault","offset_days":3,"actor":"expert","kind":"file","recipient":null,
     "note":"Files each document against the holding it relates to."},
    {"key":"close_cycle","title":"Record which arrived late and queue next year","offset_days":10,"actor":"ai","kind":"file","recipient":null,
     "note":"Notes which administrators delivered late, so next year's cycle can start earlier on those, and creates the next instance."}
  ]$J$::jsonb
)
on conflict (key) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  is_starter = true, trigger_kind = excluded.trigger_kind, steps = excluded.steps, updated_at = now();
