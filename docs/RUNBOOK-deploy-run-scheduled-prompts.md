# Deploying the Run Now / CORS fix

Commit `b2dedca`. Run these from Terminal on your MacBook. Copy one block at a time and read the
output before moving on.

---

## ⚠️ Read this first

**Your Supabase CLI is linked to PCM PRODUCTION.** `supabase/.temp/linked-project.json` says
`unkirihxtruhdjeldfpm`, which is the live client database. A bare
`supabase functions deploy run-scheduled-prompts` **would deploy straight to production.**

Every command below passes `--project-ref` explicitly for that reason. Do not drop that flag.

**Also keep `--no-verify-jwt`.** Both projects currently run this function with JWT verification off.
The hourly cron job does send an `Authorization` header, so verification would probably survive — but
"probably" is not a good enough reason to change an auth setting while fixing something else. One
change at a time.

---

## 1. Get the fix

```bash
cd ~/Documents/GitHub/pcm-realestate
git pull
```

Expect to see `b2dedca` arrive. If `git pull` complains about local changes, the only untracked file
should be `PCM_Referral_Partner_Deck.pptx`, which is harmless — a pull will not touch it.

## 2. Confirm the fix is actually in the file

Don't skip this. It is two seconds and it tells you the deploy will carry the change.

```bash
grep -n 'corsHeaders\|method === "OPTIONS"' supabase/functions/run-scheduled-prompts/index.ts
```

Expect four lines: the `corsHeaders` declaration, its use in `json()`, and the `OPTIONS` branch with
its response. If you get nothing, the pull didn't land — stop and tell me.

## 3. Check the CLI is there and you're signed in

```bash
supabase --version
supabase projects list
```

If `supabase` is not found:

```bash
brew install supabase/tap/supabase
```

If `projects list` asks you to log in:

```bash
supabase login
```

`projects list` should show both `tkryueqzvgcigvxgjzsp` (demo) and `unkirihxtruhdjeldfpm` (PCM).

## 4. Deploy to DEMO first

Demo first, always. It is the same code path with no client consequences.

```bash
supabase functions deploy run-scheduled-prompts \
  --project-ref tkryueqzvgcigvxgjzsp \
  --no-verify-jwt
```

Expect `Deployed Functions on project tkryueqzvgcigvxgjzsp` and a new version number (v13 → v14).

## 5. Test it on demo

1. Open the demo app and sign in as `expert@titanosdemo.com`.
2. Resources → Scheduled Prompts.
3. Hit **Run Now** on one of the "Find me a boat" cards.

**What good looks like:** the toast says it's running, and within a minute or two the card shows a
real result — success or a specific failure. Either is a pass. The point is that something is
recorded, where before nothing was.

**What still-broken looks like:** "Failed to send a request to the Edge Function" again. If you see
that, tell me — it means the preflight is still being rejected and I was wrong about the cause.

## 6. Confirm in the database

Supabase dashboard → SQL Editor, on the **demo** project:

```sql
select name, last_run_at, last_run_status, last_run_error
from scheduled_prompts
order by last_run_at desc nulls last;
```

`last_run_status` must no longer be `null` for the prompt you ran. That column is the whole test:
before this fix, `runOne` was never entered, so nothing could ever be written there.

Expect `error` rather than `success`, with a message about the sending identity — see the note at the
bottom. **That is still a pass for this fix.** It means the run happened; the email is a separate
problem.

## 7. Deploy to PCM production

Only after step 6 shows a status written on demo.

```bash
supabase functions deploy run-scheduled-prompts \
  --project-ref unkirihxtruhdjeldfpm \
  --no-verify-jwt
```

Production is on v12 and has never had the OPTIONS branch either, so Run Now has been broken there
too — the hourly cron kept working because it calls the function server-side, where CORS does not
apply. That is why this went unnoticed.

## 8. Confirm on production

Same SQL as step 6, against `unkirihxtruhdjeldfpm`.

---

## If something goes wrong

**Roll back.** Deploys are versioned and the previous version is still there:

```bash
supabase functions list --project-ref tkryueqzvgcigvxgjzsp
```

Then in the dashboard → Edge Functions → run-scheduled-prompts → version history, promote the
previous version. Nothing about this change touches data, so a rollback is clean.

**`Access token not provided`** — run `supabase login` again.

**`failed to bundle`** — Docker isn't running. Recent CLI versions don't need it for
`functions deploy`; if yours does, start Docker Desktop and retry.

---

## Expect the email to fail, for a different reason

Separate from this fix, and it will show up as soon as the run actually happens:
`outbound_email_settings` on demo is empty — `from_mode` is `advisor`, with no `fixed_from_email` and
no `sending_domain`. The from-address therefore falls through to the active brand row and resolves to
`alerts@accurateadvisory.com`, which is almost certainly not verified in Resend.

So step 6 will likely record an error about the sending identity or a Resend rejection. **That is the
fix working**, not failing: the run reached the point of trying to send, which it never did before.

Two decisions needed to close that out: which domain the demo should send as, and verifying it in
Resend. Related — the demo's active brand is still Accurate Advisory Group, so any report email
currently goes out branded as them.
