-- ─────────────────────────────────────────────────────────────────────────────
-- WORKFLOWS: recurring obligations carried to completion with human approval
--
-- Applied to: titanos-demo (2026-07-28), PCM production (2026-07-28)
-- At provisioning, run this file then 20260728_workflows_starter_templates.sql.
--
-- Scheduled Prompts answer "tell me something on a cadence". Workflows are a
-- different shape: they hold state for months, produce artifacts, and stop to
-- wait for a person. Hence separate tables rather than an extension of prompts.
--
-- Four objects:
--   obligations             a recurring commitment (ILIT premium, estimated tax,
--                           RMD, capital call) with an amount and a due date
--   workflow_templates      the reusable playbook: lead times, steps, recipients
--   workflow_instances      one template applied to one obligation for one cycle
--   workflow_instance_steps the individual steps of a live instance, each of
--                           which may carry a draft awaiting approval
--
-- Design rules encoded here:
--   * Nothing sends itself. Any step that communicates externally lands in
--     'awaiting_approval' and requires a named approver.
--   * The platform prepares payment instructions; it never moves money.
--   * Steps that do not apply to a given trust are 'skipped', never deleted, so
--     the record shows they were considered rather than forgotten.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── OBLIGATIONS ──────────────────────────────────────────────────────────────
create table if not exists public.obligations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  -- Where the money ends up (e.g. the ILIT's trust account) and where it comes
  -- from. Both optional: not every obligation is funded from a tracked account.
  destination_account_id uuid references public.portfolio_accounts(id) on delete set null,
  source_account_id uuid references public.portfolio_accounts(id) on delete set null,
  name text not null,
  kind text not null default 'premium'
    check (kind in ('premium','tax','rmd','capital_call','loan_payment','other')),
  amount numeric,
  due_date date not null,                    -- next occurrence
  recurrence text not null default 'annually'
    check (recurrence in ('once','monthly','quarterly','semiannually','annually')),
  -- Identifiers that belong on the outbound paperwork.
  reference_number text,                     -- policy number, EIN, fund name
  counterparty text,                         -- carrier, taxing authority, fund
  grace_date date,                           -- the real drop-dead date, if later
  -- Template-specific settings, e.g. {"crummey_required": true}. Kept as jsonb
  -- so this table stays generic across obligation kinds.
  options jsonb not null default '{}'::jsonb,
  template_key text,                         -- which playbook runs this
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists obligations_family_idx on public.obligations(family_id);
create index if not exists obligations_due_idx on public.obligations(due_date) where active;

-- ── TEMPLATES ────────────────────────────────────────────────────────────────
-- `is_starter` marks the playbooks TitanOS ships with. A tenant may edit their
-- own copy freely; the flag is only used to identify what came from the product.
create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  category text not null default 'General',
  is_starter boolean not null default false,
  trigger_kind text not null default 'obligation_date'
    check (trigger_kind in ('obligation_date','manual','document')),
  -- Ordered array of step definitions. Each step:
  --   key            stable identifier
  --   title          what the Expert sees
  --   offset_days    relative to the obligation due date; negative = before
  --   actor          ai | expert | external
  --   kind           extract | check | draft_document | draft_email | draft_letter
  --                  | confirm | file
  --   recipient      bank | grantor | beneficiaries | trustee | carrier | internal
  --   requires       null, or an options flag that must be true for this step to
  --                  apply (e.g. "crummey_required")
  --   opens_window_days  if set, this step starts a waiting period of N days
  --   attach         artifacts to gather onto the outbound item
  --   note           guidance shown to the reviewer
  steps jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── INSTANCES ────────────────────────────────────────────────────────────────
create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workflow_templates(id) on delete restrict,
  obligation_id uuid references public.obligations(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  cycle_label text,                          -- e.g. "2026 premium"
  due_date date not null,                    -- the date every offset is measured from
  -- Resolved once, at creation, from the obligation's options. Copied onto the
  -- instance so that later changes to the obligation don't silently rewrite the
  -- history of a cycle already in flight.
  --
  -- Generic on purpose: a step declares `requires: "<flag>"` and that flag is
  -- looked up here. This started life as a single crummey_required boolean, which
  -- would have meant a schema change for every new conditional step in every
  -- future playbook.
  resolved_options jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','at_risk','blocked','completed','cancelled')),
  -- Set when the instance was created too late for its own lead times to fit —
  -- surfaced immediately rather than discovered in week six.
  risk_note text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (obligation_id, due_date)
);
create index if not exists workflow_instances_family_idx on public.workflow_instances(family_id);
create index if not exists workflow_instances_status_idx on public.workflow_instances(status);

-- ── INSTANCE STEPS ───────────────────────────────────────────────────────────
create table if not exists public.workflow_instance_steps (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  step_key text not null,
  seq integer not null,
  title text not null,
  actor text not null check (actor in ('ai','expert','external')),
  kind text not null,
  recipient text,
  due_on date,
  status text not null default 'pending'
    check (status in ('pending','ready','awaiting_approval','approved','sent','done','skipped','blocked')),
  -- AI-prepared content, held here until a person approves it. Nothing in this
  -- table is delivered anywhere on its own.
  draft_subject text,
  draft_body text,
  draft_to text,
  -- Documents gathered onto this step (invoice, prepared request, receipt).
  attachment_ids uuid[] not null default '{}',
  produced_document_id uuid references public.documents(id) on delete set null,
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instance_id, step_key)
);
create index if not exists wis_instance_idx on public.workflow_instance_steps(instance_id, seq);
-- Powers the review queue: everything anywhere in the book that needs a person.
create index if not exists wis_review_idx on public.workflow_instance_steps(status, due_on)
  where status in ('ready','awaiting_approval','blocked');

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Same rules as the rest of the schema: admins see everything, Titan Experts see
-- their own families, Partners see families they are linked to but cannot write,
-- Clients see their own family read-only.
alter table public.obligations enable row level security;
alter table public.workflow_instances enable row level security;
alter table public.workflow_instance_steps enable row level security;
alter table public.workflow_templates enable row level security;

create policy read_access on public.obligations for select
  using (is_admin() or family_id in (select current_user_allowed_family_ids()));
create policy write_access on public.obligations for all
  using (is_admin() or (family_id in (select current_user_allowed_family_ids()) and current_user_role() <> 'partner'))
  with check (is_admin() or (family_id in (select current_user_allowed_family_ids()) and current_user_role() <> 'partner'));

create policy read_access on public.workflow_instances for select
  using (is_admin() or family_id in (select current_user_allowed_family_ids()));
create policy write_access on public.workflow_instances for all
  using (is_admin() or (family_id in (select current_user_allowed_family_ids()) and current_user_role() <> 'partner'))
  with check (is_admin() or (family_id in (select current_user_allowed_family_ids()) and current_user_role() <> 'partner'));

create policy read_access on public.workflow_instance_steps for select
  using (is_admin() or family_id in (select current_user_allowed_family_ids()));
create policy write_access on public.workflow_instance_steps for all
  using (is_admin() or (family_id in (select current_user_allowed_family_ids()) and current_user_role() <> 'partner'))
  with check (is_admin() or (family_id in (select current_user_allowed_family_ids()) and current_user_role() <> 'partner'));

-- Templates are firm-wide, not family-scoped: any signed-in staff member may read
-- them, but only admins may change the playbooks themselves.
create policy staff_read on public.workflow_templates for select
  using (current_user_role() in ('admin','advisor','partner'));
create policy admin_write on public.workflow_templates for all
  using (is_admin()) with check (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- STARTER PLAYBOOKS
--
-- The four playbooks that ship with the product live in
-- 20260728_workflows_starter_templates.sql, as runnable SQL rather than a pointer
-- into repo history. Run it after this file.
-- ─────────────────────────────────────────────────────────────────────────────
