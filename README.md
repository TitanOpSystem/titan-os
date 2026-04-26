# PCM Family Office Platform

Combined CRM + Real Estate Portfolio Management platform for PCM Family Office.

## What's Included

- **Dashboard** — portfolio overview, pipeline, deadlines, family breakdown
- **Families** — group contacts, properties, deals & tasks under one family; print reports
- **Properties** — full loan details, insurance, income/expense tracking per property
- **Contacts** — individuals and LLCs linked to families
- **Deals** — 6-stage pipeline linked to families and contacts
- **Notes** — activity log linked to families and contacts
- **Tasks** — deadlines with 30-day advisor email alerts
- **Family Reports** — printable PDF-style report per family

---

## Step 1: Run the New Database Schema

Go to your Supabase project → SQL Editor → paste and run the file at:
`supabase/schema.sql`

This creates the new `families` and `properties` tables and updates the existing ones.

---

## Step 2: Deploy the App to Vercel via GitHub

### Upload to GitHub
1. Go to https://github.com/PCMFamilyOffice/pcm-realestate (your existing repo)
2. Click **Add file → Upload files**
3. Delete old files if needed, then upload everything from this folder
4. Commit with message: "v2 — Combined platform with CRM + Real Estate"

### Redeploy on Vercel
Vercel will auto-detect the push and redeploy. If not:
1. Go to vercel.com → your project → Deployments
2. Click **Redeploy** on the latest deployment

**Vercel Settings (if needed):**
- Framework Preset: `Vite`
- Root Directory: (leave blank)
- Build Command: `npm run build`
- Output Directory: `dist`

---

## Step 3: Set Up Advisor Email Alerts (30-day deadline notices)

### Configure SMTP in Supabase
1. Go to Supabase → Project Settings → Auth → SMTP Settings
2. Enable Custom SMTP
3. Enter your email provider settings (Gmail, SendGrid, etc.)
   - For Gmail: use smtp.gmail.com, port 587, your Gmail + App Password

### Deploy the Edge Function
If you have the Supabase CLI installed:
```bash
supabase functions deploy deadline-alerts
```

If not, you can deploy via the Supabase Dashboard:
1. Go to Edge Functions → Create new function
2. Name it `deadline-alerts`
3. Paste the contents of `supabase/functions/deadline-alerts/index.ts`
4. Deploy

### Schedule the Function (runs daily at 8am)
1. Go to Supabase → Database → Extensions → enable `pg_cron`
2. Go to SQL Editor and run:
```sql
select cron.schedule(
  'deadline-alerts-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://unkirihxtruhdjeldfpm.supabase.co/functions/v1/deadline-alerts',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```
Replace `YOUR_SERVICE_ROLE_KEY` with your service role key from Supabase → Settings → API.

---

## How Families Work

1. Create a **Family** (e.g. "The Smith Family") and assign an advisor + advisor email
2. Add **Contacts** linked to that family (individuals like John Smith, or LLCs like Smith Holdings LLC)
3. Add **Properties** linked to that family — properties can be owned by an LLC
4. Add **Deals**, **Notes**, and **Tasks** linked to the family
5. Click **🖨 Report** on any family to generate a printable PDF report
6. Any task with a due date 30 days out will trigger an automatic email to the family's advisor

---

## Project Structure

```
pcm-platform/
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   └── App.jsx              ← Full platform application
└── supabase/
    ├── schema.sql            ← Run this first in Supabase SQL Editor
    └── functions/
        └── deadline-alerts/
            └── index.ts      ← Email alert Edge Function
```
