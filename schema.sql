-- ============================================================
-- PCM Family Office Platform — Full Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- FAMILIES
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  advisor_name text,
  advisor_email text,
  notes text,
  created_at timestamptz default now()
);

-- CONTACTS (updated to support family linking)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete set null,
  name text not null,
  company text,
  email text,
  phone text,
  type text default 'Individual',
  tags text,
  created_at timestamptz default now()
);

-- PROPERTIES
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete set null,
  -- Ownership
  owner_name text,           -- Could be individual or LLC name
  address text not null,
  property_type text default 'Residential',
  -- Purchase
  purchase_price numeric,
  purchase_date date,
  current_value numeric,
  -- Loan
  lender text,
  loan_balance numeric,
  interest_rate numeric,
  loan_payment numeric,
  loan_maturity_date date,
  loan_type text default 'Fixed',
  -- Income
  rental_income numeric,
  -- Expenses
  property_taxes numeric,
  utilities numeric,
  -- Insurance
  insurance_company text,
  insurance_premium numeric,
  flood_insurance boolean default false,
  flood_insurance_company text,
  flood_insurance_premium numeric,
  -- Notes
  notes text,
  created_at timestamptz default now()
);

-- DEALS (updated with family_id)
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  value numeric,
  stage text default 'Lead',
  close_date date,
  created_at timestamptz default now()
);

-- NOTES (updated with family_id)
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

-- TASKS (updated with family_id)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  title text not null,
  due_date date,
  priority text default 'Medium',
  done boolean default false,
  created_at timestamptz default now()
);

-- ADVISOR ALERT LOG (prevents duplicate emails)
create table if not exists advisor_alert_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  family_id uuid references families(id) on delete cascade,
  advisor_email text,
  sent_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (allow all for now)
-- ============================================================
alter table families           enable row level security;
alter table contacts           enable row level security;
alter table properties         enable row level security;
alter table deals              enable row level security;
alter table notes              enable row level security;
alter table tasks              enable row level security;
alter table advisor_alert_log  enable row level security;

create policy "Allow all" on families           for all using (true) with check (true);
create policy "Allow all" on contacts           for all using (true) with check (true);
create policy "Allow all" on properties         for all using (true) with check (true);
create policy "Allow all" on deals              for all using (true) with check (true);
create policy "Allow all" on notes              for all using (true) with check (true);
create policy "Allow all" on tasks              for all using (true) with check (true);
create policy "Allow all" on advisor_alert_log  for all using (true) with check (true);
