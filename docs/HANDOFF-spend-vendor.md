# Handoff — spend by vendor / property-derived cash flow

Updated 30 July 2026, end of session. **The feature work is complete and shipped.** One
housekeeping item remains.

## State

| | |
|---|---|
| `main` | `95e4e59` |
| Demo | titanosdemo build `95e4e59`, family card working, derivation ON |
| PCM production | pcm-realestate-phi build `95e4e59`, derivation **OFF**, numbers unchanged from before this work |
| Tests | `npm test` — lint plus four suites, **154 assertions** |
| WIP branch | `wip-spend-vendor` / tag `wip/spend-vendor-work` — the pre-fix commits, kept for reference only. Safe to delete. |

## THE ONE REMAINING ITEM

**Back up the deployed edge functions into the repo** (tasks #106, #78).

Six of eight repo copies are stale. Most important: **`family-ai-assistant` v14 exists only
inside Supabase.** It carries all of this session's assistant work — the spend-by-category
rules, the spend-by-vendor rules, the "two places a cost can live" block, the
smoothed-average rule, and the fix replacing "contact your Titan Expert" with the firm name
resolved from the brand record. If that project is ever reset, it is gone.

Also stale: `run-scheduled-prompts`, `admin-set-password`, and three others. Confirm with
`mcp list_edge_functions` then `get_edge_function` per slug, and write each to
`supabase/functions/<slug>/index.ts`.

Do this in a session with plenty of context — each function's full source has to pass
through, and stopping halfway is how the repo got into this state.

## What shipped this session

- Expense **categories** on `cash_flow_events`, constrained, with a picklist that is the
  single source of truth (`EXPENSE_CATEGORIES` in App.jsx must match the check constraint).
- **Property costs derived into cash flow** — entered once on the property, appearing as
  itemised lines. Rental income is now GROSS with costs beside it rather than netted.
- **Vendor granularity**: `property_id` plus two vendor foreign keys on `cash_flow_events`,
  and `spendByVendor` pre-totalled in the snapshot.
- **Monthly and annual views**, with `everyLineIsMonthly` so a smoothed average is never
  described as a payment.
- **The suppression rule**: an itemised line naming a property and category replaces the
  property record's blended figure for that pair, so itemising never double-counts.
- **`brand_profiles.derive_property_costs`** — opt-in per firm, default false.
- **The client activity report** (earlier in the session) — Resources tab, five periods.

## Bugs found and fixed, and how

Five, all in this session's own work. Worth reading before extending it.

1. **TDZ crash.** `expenseByCategory` spread `...derivedPropertyEvents` before that `const`
   was initialised, so `buildFamilySnapshot` threw on every call and the family card was
   blank. Shipped three times behind a green build.
2. **Property `id` missing from the snapshot.** Every derived line got the id
   `prop_undefined_<field>` and every suppression key collapsed to `"undefined::x"`, so the
   suppression rule could never fire and itemised costs double-counted. The mirrored tests
   passed because their fixtures supplied an id the real snapshot did not.
3. **Vendor columns absent from the snake→camel field map** (`m`, ~line 695), so
   `spendByVendor` was always empty in the app while correct in the database.
4. **`findProbableDuplicates` ignored property**, flagging Ocean Vista's itemised utilities
   as duplicating Gulf Shore's derived line. A false duplicate warning tells an adviser a
   correct total is double-counted and invites deleting a real line.
5. **Derivation shipped ON to PCM production**, where nothing is categorised, so derived
   lines were added to bundled manual lines and the projection double-counted live client
   money. Hence the opt-in gate.

### Why the guards missed them

- `npm run build` passes regardless: **Vite does not check that identifiers resolve.**
- `no-undef` cannot see a TDZ error — the identifier *is* declared, just not initialised.
- `docs/test_expense_rollup.mjs` **re-implements** the rollup, so 114 assertions were green
  while the real function was in pieces.

### What catches them now

`docs/test_family_snapshot.mjs` calls the **real** `buildFamilySnapshot`. It bundles
App.jsx with esbuild (resolving `import.meta.env` and JSX, React external), appends a
test-only export, and runs it against rows copied from the demo database. Every bug above
fails it. It asserts both the opted-in and opted-out paths.

`npm run lint:undef` checks unresolved identifiers, duplicate declarations and unreachable
code. Narrow on purpose — a noisy lint gets ignored.

## Open items elsewhere

- **PCM data anomalies, not touched** — they are the firm's records to judge. Lamb's
  Raintree shows HOA of $72,420/yr ($6,035/mo); Lamb's property taxes read $1,834 and $707,
  which look like monthly figures in annual fields.
- **PCM has no categorised expenses.** Turning `derive_property_costs` on there requires
  categorising lines and attaching them to properties first. Bennett's "Monthly Expense for
  Home and 6 Unit Rental Building: Mortgage and Utilities" bundles two categories and has
  no clean split.
- The reporting functions (`client_activity_payload`, `report_period`, `client_exceptions`)
  are demo-only; PCM has `workflow_instance_steps.completed_at` but not the rest (#109).
- Tasks #82, #84, #85, #86, #89, #92, #102, #107 unchanged.
