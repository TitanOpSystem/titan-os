# Handoff — spend by vendor / property-derived cash flow

Paused 30 July 2026. Everything below is verified, not assumed.

## State right now

| | |
|---|---|
| `main` | `37c70ac` — rolled back to `b29cdee`'s `src/App.jsx`. **Family card works.** |
| Deployed | titanosdemo build `37c70ac`, confirmed against the live bundle |
| WIP branch | `wip-spend-vendor` (also tag `wip/spend-vendor-work`), pushed to origin — all six commits |
| Database | All migrations applied to **both** projects. Unread by `main`, which is harmless. |
| Demo data | Vendor links, itemised utility lines and the vendor contacts are all still in place |

## The bug — found, with a stack trace

```
ReferenceError: Cannot access 'derivedPropertyEvents' before initialization
    at buildFamilySnapshot (app.probe.mjs:2183)
```

In `buildFamilySnapshot` the declaration order is:

1. `cashFlowEvents`
2. `expenseByCategory` — spreads `...derivedPropertyEvents`  ← **throws here**
3. `uncategorisedExpenses`
4. `derivedPropertyEvents` — declared *after* it is used
5. `duplicateWarnings`, `spendByVendor`

A temporal dead zone error on a `const`. Introduced in `547682a`. `buildFamilySnapshot`
runs on family-card mount, so the card threw every time.

**Fix:** move `const derivedPropertyEvents = …` (and `duplicateWarnings`, which depends on
it) above `expenseByCategory`. Nothing else about the design changes.

## Why three green builds shipped it

Worth writing down, because each of these is a hole to close:

- **Vite does not check that identifiers resolve.** `npm run build` passed every time.
- **`no-undef` cannot catch a TDZ error.** The variable *is* declared — just not yet
  initialised. `npm run lint:undef` (added in `24cdaf4`) is still worth having, and it did
  find a real latent bug, but it would never have caught this one.
- **The test suites mirror the logic instead of importing it.** `docs/test_expense_rollup.mjs`
  re-implements the rollup, so 114 assertions were green while the real function was broken.
  This is the important one.

## How the bug was actually found — reuse this

`buildFamilySnapshot` could not be imported in node because `App.jsx` uses `import.meta.env`
and JSX. Bundle it with esbuild and the real function becomes callable:

```sh
cp <wip App.jsx> /tmp/probe/App.jsx
echo 'export { buildFamilySnapshot, buildVendorOptions };' >> /tmp/probe/App.jsx
npx --yes esbuild@0.23 /tmp/probe/App.jsx --bundle --format=esm --jsx=automatic \
  --external:react --external:react-dom --external:react/jsx-runtime \
  --external:@supabase/supabase-js --external:pdf-lib \
  --define:import.meta.env='{"VITE_SUPABASE_URL":"https://example.supabase.co","VITE_SUPABASE_ANON_KEY":"x","VITE_BRAND_RUNTIME":"1"}' \
  --outfile=./app.probe.mjs
# must sit inside the repo so node resolves react from node_modules
node -e 'import("./app.probe.mjs").then(m=>m.buildFamilySnapshot(family,data))'
```

## Do before re-landing

1. **Fix the TDZ order** and re-run the probe against real demo data — it must not throw.
2. **Extract `buildFamilySnapshot` into `src/familySnapshot.js`** with no React or Vite
   dependency, the same treatment `activityReport.js` and `propertyCashFlow.js` got. Then
   the tests import the real function instead of a copy of its logic, and a deletion or a
   reordering fails a test rather than shipping.
3. **Two further bugs found while reading the real data, both still unfixed on the WIP branch:**
   - The snapshot's `properties` objects **carry no `id`**. So `derivePropertyEvents` emits
     `prop_undefined_propertyTaxesAnnual` for *every* property — duplicate React keys — and
     `suppressionKey` becomes `"undefined::utilities"`, which never matches a manual line's
     real `propertyId`. **The suppression rule therefore never fires in the live app**, so
     itemised utilities would be double-counted against the property's blended figure. The
     unit tests passed because the fixtures supply an `id` the real snapshot does not.
   - `vendor_family_contact_id` / `vendor_property_contact_id` were **never added to the
     snake→camel mapper** (`m`, around line 695). The client shape keeps the snake_case
     keys, so `vendorNameFor` always returns null and `spendByVendor` is always empty.
4. **Re-apply the render error boundary** (`4096756`). A blank screen with no message is
   what made this take three rounds.
5. **Re-apply the `closeModal` → `setModal(null)` fix** in `ScheduledPromptsSection`.

## Still outstanding from before

- Repo copies of 6 of 8 edge functions are stale; `family-ai-assistant` v14 exists only in
  Supabase (task #106).
- PCM production has not been audited for manual cash-flow lines that duplicate property
  fields (task #109).
