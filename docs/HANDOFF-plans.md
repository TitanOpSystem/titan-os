# Core / Private service plans

Two tiers on the household, chosen when the family is created. Core is the full platform minus the
three things the firm sells as service rather than software.

| | Core | Private |
|---|---|---|
| Everything else in the platform | yes | yes |
| Assigned expert | no — Partner is the lead | yes |
| Workflows and obligations | no | yes |
| Bill pay and payment register | no | yes |

Pricing for the two tiers is in `docs/PRICING-per-family.md`. The names here are deliberately
brand-neutral (`Core`, not "Titan Core") — a tier label carrying a brand would leak the moment a
second firm runs this codebase, which has already happened three times in the edge functions.

## Where it lives

- **`src/plans.js`** — `PLANS`, `PLAN_FEATURES`, `planAllows`, `normalisePlan`, `planLabel`,
  `planExclusions`. No React, so it is tested by calling the real functions.
- **`supabase/migrations/20260802_family_plan.sql`** — the `plan` column and the triggers.
- **`docs/test_plans.mjs`** — 43 assertions on the module.
- **`docs/test_family_snapshot.mjs`** — 26 further assertions running the plan through the real
  `buildFamilySnapshot`.

Applied to **both** projects on 2 August 2026: demo `tkryueqzvgcigvxgjzsp` and PCM production
`unkirihxtruhdjeldfpm`. Production was migrated *before* the frontend shipped, because the insert
now writes `plan` and would have failed against a database without the column.

## The UI is not the enforcement

Every gate in `App.jsx` decides what to **draw**. The database decides what is **allowed**, because
the plan is a commercial boundary and anyone holding a valid session for a household could otherwise
insert a workflow instance or set `pcm_responsible` straight through the API. Two of the three gated
features touch client money, so an unenforced gate would let a record appear saying the firm paid a
bill on a household the firm has no mandate to pay bills for.

Five triggers, all `security definer` with a pinned `search_path`:

| Table | Refuses |
|---|---|
| `obligations` | any insert/update for a Core household |
| `workflow_instances` | any insert/update for a Core household |
| `cash_flow_events` | `pcm_responsible = true` for a Core household |
| `cash_flow_payment_log` | any insert/update for a Core household |
| `families` | a Private → Core change that would strand existing work |

`cash_flow_payment_log` gets its own function rather than reusing `refuse_when_core`, because its
`family_id` is **nullable**. A caller who simply omitted it would make `family_plan(null)` return
null, `null = 'core'` evaluate to null rather than true, and the write pass straight through. The
family is resolved through `event_id` (which is NOT NULL) instead. That hole existed in the first
version of this migration and was caught before it shipped.

## Proof the triggers refuse what they claim to

Run against the live demo schema with a scratch household, 2 August 2026. All twelve passed.

| | Check | Result |
|---|---|---|
| 1 | obligation insert on Core | refused |
| 2 | workflow instance insert on Core | refused |
| 3 | `pcm_responsible = true` insert on Core | refused |
| 4 | ordinary expense insert on Core | **allowed**, as intended |
| 5 | payment log insert on Core **with `family_id` omitted** | refused |
| 6 | update flipping `pcm_responsible` on Core | refused |
| 7 | all four writes after upgrading to Private | **allowed**, as intended |
| 8 | downgrade to Core with work on file | refused, naming 1 / 1 / 1 |
| 9 | `plan = 'enterprise'` | refused by the check constraint |
| 10 | downgrade once the work is cleared | **allowed**, as intended |

## Two decisions that look wrong and are not

**An unrecognised or missing plan resolves to Private, not Core.** This reverses the fail-closed rule
used for the firm-level feature gates (`derive_property_costs`), on purpose. The column is
`NOT NULL DEFAULT 'private'` with every row backfilled, so a blank means a stale client or a tier
added later — not an unpaid household. Resolving to Core would hide the payment register from a
family paying for bill pay, and **a family who cannot see that a bill was paid concludes it was
not**. That is a worse failure than briefly showing a control to someone who did not buy it, because
the database refuses that write anyway. A future tier above Private is also a superset, so
inheriting Private's features is the right default for it.

**Core households still get an `advisor_email`.** `fetchTable` scopes an advisor's families by
`advisor_email`, so leaving it null would make every Core household invisible to everyone but an
admin the moment it was created — every Core support request would escalate. The field is an expert
**of record for access**, not a service level: the client is never shown a Titan Expert, the header
reads "Partner-led", and the "Email my Titan Expert" button is not rendered.

## What is gated where

| Surface | Gate |
|---|---|
| Obligations tab (advisor) | absent from `TABS`, and the panel re-checks in case the plan changed mid-session |
| Bill-pay checkbox on the expense form | `billPay` prop on `CashFlowEventForm` |
| "Firm Pays" badge, paid stamp, payment register | `billPay` in `CashFlowView` |
| Snapshot fields `pcmResponsibleForPayment`, `paidByPcm`, `paidDate`, `paidBy`, `paymentRegister` | omitted entirely, not sent as `false` |
| Snapshot `family.servicePlan` / `firmPaysBills` / `runsWorkflows` | always stated, both plans |
| Client portal "Email my Titan Expert" | `clientHasExpert` |
| Client portal "contact your Titan Expert" copy | reads "your lead partner" on Core |
| Family card and dashboard header | plan badge; expert row reads "Partner-led" |

The snapshot fields are **omitted rather than set to false** because `false` still invites the
assistant to discuss who pays a bill. An absent key gives it nothing to discuss. `servicePlan` is
always present so the assistant can answer "do you pay my bills?" from a fact rather than inferring
it from an empty register — an empty register could equally mean nothing has been recorded yet, and
those two deserve different answers.

## Deliberately not built

**No plan filter on the review queue.** `workflow_instance_steps` has no `family_id`, so filtering it
would need an extra `instance -> family` lookup, and that query can never remove a row: a Core
household cannot hold a workflow instance, and a household holding instances cannot be moved to
Core. Both halves are trigger-enforced and proved above. There is a note to this effect at the foot
of `src/plans.js` so the "missing" helper is not added later by someone assuming it was forgotten.

## Still open

- **Renaming a plan is unsupported**, by design — the two values are referenced in SQL triggers.
  Adding a third tier means a migration, a `PLAN_FEATURES` entry and a blurb.
- **No UI shows what a Core household would gain by upgrading.** `planExclusions()` exists and
  returns the three feature labels; nothing renders it yet. That is the natural home for an upsell
  prompt if one is ever wanted.
- **All four PCM production households are on Private**, which preserves exactly what they have
  today. Nothing has been moved to Core.
