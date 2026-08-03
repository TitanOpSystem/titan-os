# Core / Premier service plans

Two tiers on the household, chosen when the family is created. Core is the full platform minus the
three things the firm sells as service rather than software.

| | Core | Premier |
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
- **`docs/test_plans.mjs`** — 50 assertions on the module.
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
| `families` | a Premier → Core change that would strand existing work |

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
| 7 | all four writes after upgrading to Premier | **allowed**, as intended |
| 8 | downgrade to Core with work on file | refused, naming 1 / 1 / 1 |
| 9 | `plan = 'enterprise'` | refused by the check constraint |
| 10 | downgrade once the work is cleared | **allowed**, as intended |

## Two decisions that look wrong and are not

**An unrecognised or missing plan resolves to Premier, not Core.** This reverses the fail-closed rule
used for the firm-level feature gates (`derive_property_costs`), on purpose. The column is
`NOT NULL DEFAULT 'premier'` with every row backfilled, so a blank means a stale client or a tier
added later — not an unpaid household. Resolving to Core would hide the payment register from a
family paying for bill pay, and **a family who cannot see that a bill was paid concludes it was
not**. That is a worse failure than briefly showing a control to someone who did not buy it, because
the database refuses that write anyway. A future tier above Premier is also a superset, so
inheriting Premier's features is the right default for it.

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
| Client portal "configured by your Titan Expert" copy | reads "your lead partner" on Core |
| Family card and dashboard header | plan badge; expert row reads "Partner-led" |
| **Client portal banner** | tier pill beside the household name — gold fill for Premier, gold outline for Core |

The client-facing pill is outlined rather than filled on Core, not greyed. The client sees this one
on every screen, and the lower tier should read as a membership mark rather than as a demotion.

## The rename from Private to Premier

The upper tier shipped as `private` and was renamed to `premier` in
`20260802_plan_rename_premier.sql`. The **stored value** was renamed, not just the label — a column
reading `private` while every screen says "Premier" is the mismatch that costs someone an hour later.
The trigger functions only ever compare against `'core'`, so none of them needed touching; only the
default and the check constraint mentioned the upper tier.

**`private` remains a valid value, permanently.** A browser tab opened before the rename still holds
the old bundle and will write `private` on the next family it creates. Narrowing the constraint would
turn that into a hard failure on an admin action, so the old value is accepted and `normalisePlan()`
maps it to `premier` through an explicit `ALIASES` table. The triggers compare against `'core'`, so a
`private` row is correctly granted everything — there is no state in which a stale client produces a
household with the wrong entitlements. It is not in `PLANS`, so it never appears in the picker.

Two things went wrong writing that migration, both caught:

- **The statement order was backwards.** Moving rows to `premier` before dropping the old constraint
  fails, because the constraint being dropped is still in force and only permits
  `('core','private')` — so it is the UPDATE that gets rejected, not the constraint that gets
  violated. Postgres refused it. Drop first, move second, re-add third.
- **The alias was implicit.** `normalisePlan('private')` already returned `premier` by falling
  through the unknown-value branch. Same answer, but only by accident: a later change to that branch
  would have broken the alias silently. Now mapped on purpose and asserted.

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

- **Adding a third tier** means a migration (the check constraint), a `PLAN_FEATURES` entry, a label and a blurb. Renaming one means an entry in `ALIASES`, as the Private → Premier rename did.
- **No UI shows what a Core household would gain by upgrading.** `planExclusions()` exists and
  returns the three feature labels; nothing renders it yet. That is the natural home for an upsell
  prompt if one is ever wanted.
- **All four PCM production households are on Premier**, which preserves exactly what they have
  today. Nothing has been moved to Core.
