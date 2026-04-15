-- ============================================================
-- PCM Family Office Real Estate CRM — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- FAMILIES
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  advisor text,
  color text default '#092b49',
  notes text,
  created_at timestamptz default now()
);

-- PROPERTIES
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  zip text,
  type text check (type in ('Residential','Commercial','Land','Industrial','Mixed Use')),
  estimated_value numeric(15,2),
  purchase_date date,
  status text default 'Active' check (status in ('Active','Pending','Sold','Under Contract')),
  notes text,
  created_at timestamptz default now()
);

-- DOCUMENTS
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  name text not null,
  doc_type text check (doc_type in ('insurance','taxes','bills','legal','mortgage','hoa','inspection','title','other')),
  file_path text,
  file_size bigint,
  mime_type text,
  expiry_date date,
  notes text,
  uploaded_by text,
  created_at timestamptz default now()
);

-- DEADLINES
create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  title text not null,
  due_date date not null,
  deadline_type text check (deadline_type in ('Tax','Insurance','Legal','Mortgage','HOA','Other')),
  priority text default 'medium' check (priority in ('high','medium','low')),
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- ACTIVITY LOG
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz default now()
);

-- ============================================================
-- Storage bucket for documents
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

-- Storage policy: authenticated users can upload/read
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "Authenticated users can read documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "Authenticated users can delete documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents');

-- ============================================================
-- Row Level Security (enable for production multi-tenant use)
-- ============================================================
alter table families enable row level security;
alter table properties enable row level security;
alter table documents enable row level security;
alter table deadlines enable row level security;
alter table activity_log enable row level security;

-- For now: allow all authenticated users full access
-- (Customize these policies for per-user or per-role access)
create policy "Allow all for authenticated" on families for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on properties for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on documents for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on deadlines for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated" on activity_log for all to authenticated using (true) with check (true);

-- ============================================================
-- Sample seed data
-- ============================================================
insert into families (id, name, advisor, color) values
  ('11111111-0000-0000-0000-000000000001', 'Harrington Family', 'Margaret Whitfield', '#092b49'),
  ('11111111-0000-0000-0000-000000000002', 'Whitmore Family', 'James Thornton', '#ceb684'),
  ('11111111-0000-0000-0000-000000000003', 'Castellan Family', 'Susan Park', '#4a7c9e'),
  ('11111111-0000-0000-0000-000000000004', 'Dunmore Family', 'Robert Dale', '#8b6b35');

insert into properties (family_id, name, address, city, state, type, estimated_value, status) values
  ('11111111-0000-0000-0000-000000000001','Palm Beach Estate','100 Ocean Dr','Palm Beach','FL','Residential',14200000,'Active'),
  ('11111111-0000-0000-0000-000000000001','Manhattan Penthouse','432 Park Ave','New York','NY','Residential',9800000,'Active'),
  ('11111111-0000-0000-0000-000000000001','Aspen Chalet','200 Mountain Rd','Aspen','CO','Residential',7100000,'Active'),
  ('11111111-0000-0000-0000-000000000001','Harbour Commerce Center','5 Harbour Blvd','Miami','FL','Commercial',12400000,'Active'),
  ('11111111-0000-0000-0000-000000000001','Pine Acres Land','Route 9','Middleburg','VA','Land',4800000,'Active'),
  ('11111111-0000-0000-0000-000000000002','Nantucket Cottage','18 Harbor Ln','Nantucket','MA','Residential',6200000,'Active'),
  ('11111111-0000-0000-0000-000000000002','Beverly Hills Compound','900 Bel Air Rd','Los Angeles','CA','Residential',18500000,'Active'),
  ('11111111-0000-0000-0000-000000000002','Chicago Office Tower','333 W Wacker Dr','Chicago','IL','Commercial',8400000,'Active'),
  ('11111111-0000-0000-0000-000000000003','Greenwich Estate','55 Round Hill Rd','Greenwich','CT','Residential',11200000,'Active'),
  ('11111111-0000-0000-0000-000000000003','St. Pete Marina Lofts','1 Beach Dr SE','St. Petersburg','FL','Commercial',9800000,'Active'),
  ('11111111-0000-0000-0000-000000000003','Austin Mixed-Use','620 Congress Ave','Austin','TX','Mixed Use',5000000,'Active'),
  ('11111111-0000-0000-0000-000000000004','Southampton Manor','10 Meadow Ln','Southampton','NY','Residential',8900000,'Active'),
  ('11111111-0000-0000-0000-000000000004','Brickell Tower','1221 Brickell Ave','Miami','FL','Commercial',7600000,'Active'),
  ('11111111-0000-0000-0000-000000000004','Blue Ridge Land','County Rd 14','Charlottesville','VA','Land',4000000,'Active');

insert into deadlines (family_id, title, due_date, deadline_type, priority) values
  ('11111111-0000-0000-0000-000000000001','Palm Beach Property Tax Filing','2024-04-30','Tax','high'),
  ('11111111-0000-0000-0000-000000000002','Whitmore Flood Insurance Renewal','2024-05-15','Insurance','high'),
  ('11111111-0000-0000-0000-000000000001','Harrington Umbrella Policy Renewal','2024-06-01','Insurance','medium'),
  ('11111111-0000-0000-0000-000000000004','Dunmore Homeowners Policy Renewal','2024-06-10','Insurance','medium'),
  ('11111111-0000-0000-0000-000000000003','Austin Lease Review','2024-06-30','Legal','low');
