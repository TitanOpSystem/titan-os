# PCM Family Office — Real Estate Portfolio CRM

A full-stack real estate portfolio management platform for PCM Family Office. Manage families, properties, documents, and deadlines — all in one place.

---

## Tech Stack

- **Frontend**: React 18, React Router 6
- **Backend / DB**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel (recommended) or Netlify

---

## Setup Guide

### Step 1 — Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign in (free account works)
2. Click **New Project**, fill in name + password, choose a region
3. Wait ~2 minutes for it to provision

### Step 2 — Run the Database Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase_schema.sql` from this project
4. Paste the entire contents and click **Run**
5. You should see "Success" — this creates all tables, storage, policies, and seed data

### Step 3 — Get Your API Keys

1. In Supabase, go to **Settings → API**
2. Copy your **Project URL** (looks like `https://xxxx.supabase.co`)
3. Copy your **anon / public** key (long string starting with `eyJ...`)

### Step 4 — Configure Environment Variables

1. In this project folder, copy the example file:
   ```
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your values:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 5 — Create Your First User

1. In Supabase, go to **Authentication → Users**
2. Click **Add User → Create new user**
3. Enter an email and password for your PCM admin account
4. Click **Create User**

### Step 6 — Run Locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the user you created.

---

## Deploy to Vercel (Recommended)

1. Push this project to a GitHub repository
2. Go to [https://vercel.com](https://vercel.com) and click **New Project**
3. Import your GitHub repository
4. In **Environment Variables**, add:
   - `REACT_APP_SUPABASE_URL` = your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy** — your app will be live in ~1 minute

---

## Deploy to Netlify (Alternative)

1. Push to GitHub
2. Go to [https://netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add the same environment variables under **Site Settings → Environment Variables**
6. Deploy

---

## Features

### Families
- Create and manage client families with custom advisor assignment and accent colors
- Each family has its own property portfolio, document vault, and deadlines
- View family-level portfolio value aggregated across all properties

### Properties
- Add properties with type (Residential, Commercial, Land, Industrial, Mixed Use)
- Track address, estimated value, purchase date, and status
- Filter and search across all families

### Document Vault
- Drag-and-drop file upload (PDF, DOCX, XLSX, JPG, PNG)
- Categorize by type: Insurance, Taxes, Bills, Legal, Mortgage, HOA, Inspection, Title
- Track expiry dates with visual alerts for upcoming expirations
- Files stored securely in Supabase Storage with signed URLs
- Filter by family and document type

### Deadlines
- Track tax deadlines, insurance renewals, legal reviews, mortgage payments
- Color-coded priority system (High / Medium / Low)
- Days-until-due counter with overdue highlighting
- Mark complete or delete from dashboard

### Dashboard
- Portfolio overview with aggregate stats
- Recent activity feed
- Upcoming deadlines widget
- Alert banner for urgent items

---

## Project Structure

```
src/
  lib/
    supabase.js          # All database & storage operations
  components/
    Sidebar.jsx          # Navigation sidebar
    Shared.jsx           # Reusable UI components + helpers
  pages/
    LoginPage.jsx        # Authentication
    DashboardPage.jsx    # Overview dashboard
    FamiliesPage.jsx     # Families list + detail + property management
    PropertiesDocumentsPages.jsx  # All properties + document vault
    DeadlinesPage.jsx    # Deadlines tracker
  hooks/
    useAuth.js           # Auth context
  App.jsx                # Router + layout
  styles.css             # Global PCM-branded styles
supabase_schema.sql      # Database schema + seed data
```

---

## Customization

- **Colors**: Edit CSS variables in `src/styles.css` (`:root` block)
- **Fonts**: Change the Google Fonts import at the top of `styles.css`
- **Document types**: Add options to the `doc_type` check constraint in `supabase_schema.sql`
- **Adding users**: Done through Supabase Authentication dashboard
- **Multi-tenant / per-advisor access**: Update Row Level Security policies in Supabase to restrict by user ID

---

## Support

Built for PCM Family Office by [your team].
