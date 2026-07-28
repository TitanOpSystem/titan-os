-- ─────────────────────────────────────────────────────────────────────────────
-- PORTFOLIO: BALANCES THAT CAN BE TRACED TO A STATEMENT
--
-- Applied to: PCM production (2026-07-28), titanos-demo (2026-07-28)
--
-- Two problems being fixed.
--
-- 1. A balance was a bare number. portfolio_accounts.current_balance had no "as
--    of" date and nothing behind it, so a figure in a client meeting could not be
--    sourced. Balances are now a dated history, each entry optionally linked to
--    the statement it came from.
--
-- 2. Statements lived outside the vault. portfolio_documents is a parallel store
--    holding a bare url, so account statements never got the things property
--    documents got: AI reading, the download audit log, signed URLs, and a place
--    in the vault. Statements now go in `documents` like everything else.
--
-- NON-BREAKING BY DESIGN. current_balance is read by net worth calculations all
-- over the application, so it stays the canonical field. A trigger keeps it in
-- step with the newest history entry, rather than asking every caller to learn a
-- new way to read a balance. Nothing that works today stops working.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Statements belong in the vault ───────────────────────────────────────────
alter table public.documents
  add column if not exists account_id uuid references public.portfolio_accounts(id) on delete set null,
  -- Free text rather than an enum: firms label periods differently (2026-Q2,
  -- June 2026, FY26) and forcing one convention would just cause fights.
  add column if not exists account_period text;

comment on column public.documents.account_id is
  'The portfolio account this document belongs to, for statements and confirmations.';
comment on column public.documents.account_period is
  'Statement period as the firm labels it, e.g. 2026-Q2 or June 2026.';

create index if not exists documents_account_idx
  on public.documents(account_id, account_period)
  where account_id is not null;

-- ── Balance history ──────────────────────────────────────────────────────────
create table if not exists public.account_balances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.portfolio_accounts(id) on delete cascade,
  -- Denormalised so row-level security can scope without a join, matching the
  -- pattern used by every other family-scoped table here.
  family_id uuid not null references public.families(id) on delete cascade,
  as_of date not null,
  balance numeric not null,
  -- The statement this figure came from. Nullable: an opening figure or a verbal
  -- confirmation from a banker is still worth recording, and pretending otherwise
  -- would push people into inventing a document.
  source_document_id uuid references public.documents(id) on delete set null,
  -- Where the number came from. 'extracted' means an AI read it from a statement
  -- and a person confirmed it; the platform never records a balance unattended.
  source text not null default 'manual'
    check (source in ('manual','extracted','opening')),
  entered_by text,
  note text,
  created_at timestamptz not null default now(),
  -- One figure per account per date. A second statement for the same period
  -- corrects the first rather than sitting beside it looking equally true.
  unique (account_id, as_of)
);

comment on table public.account_balances is
  'Dated balance history per account. The newest entry is mirrored onto '
  'portfolio_accounts.current_balance by trigger, so existing net worth '
  'calculations keep working unchanged.';

create index if not exists account_balances_account_idx
  on public.account_balances(account_id, as_of desc);
create index if not exists account_balances_family_idx
  on public.account_balances(family_id);

-- ── Where the current figure came from ───────────────────────────────────────
alter table public.portfolio_accounts
  add column if not exists balance_as_of date,
  add column if not exists balance_source_document_id uuid
    references public.documents(id) on delete set null;

comment on column public.portfolio_accounts.balance_as_of is
  'Date current_balance is good as at. Maintained by trigger from account_balances.';
comment on column public.portfolio_accounts.balance_source_document_id is
  'Statement behind current_balance, where there is one. Maintained by trigger.';

-- ── Keep the account in step with its newest balance ─────────────────────────
-- A trigger rather than application code: the invariant has to hold no matter
-- who writes, including a future import script or a correction made by hand.
create or replace function public.sync_account_current_balance()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_account uuid; v_latest record;
begin
  v_account := coalesce(new.account_id, old.account_id);

  select balance, as_of, source_document_id
    into v_latest
    from public.account_balances
   where account_id = v_account
   order by as_of desc, created_at desc
   limit 1;

  if v_latest is null then
    -- Last history entry removed. Leave current_balance alone rather than zeroing
    -- it: a deleted correction should not silently wipe a family's net worth.
    update public.portfolio_accounts
       set balance_as_of = null, balance_source_document_id = null
     where id = v_account;
  else
    update public.portfolio_accounts
       set current_balance             = v_latest.balance,
           balance_as_of              = v_latest.as_of,
           balance_source_document_id = v_latest.source_document_id
     where id = v_account;
  end if;

  return null;
end $$;

drop trigger if exists account_balances_sync on public.account_balances;
create trigger account_balances_sync
  after insert or update or delete on public.account_balances
  for each row execute function public.sync_account_current_balance();

-- ── Row level security ───────────────────────────────────────────────────────
-- Same rules as the rest of the schema: admins see everything, Titan Experts see
-- their own families, Partners read-only, Clients their own family read-only.
alter table public.account_balances enable row level security;

drop policy if exists read_access on public.account_balances;
drop policy if exists write_access on public.account_balances;
create policy read_access on public.account_balances for select
  using (public.is_admin() or family_id in (select public.current_user_allowed_family_ids()));
create policy write_access on public.account_balances for all
  using (public.is_admin() or (family_id in (select public.current_user_allowed_family_ids())
                               and public.current_user_role() <> 'partner'))
  with check (public.is_admin() or (family_id in (select public.current_user_allowed_family_ids())
                                    and public.current_user_role() <> 'partner'));

-- ── Retire the parallel document store ───────────────────────────────────────
-- portfolio_documents held a bare url with no file behind it in either tenant
-- (one demo placeholder, path 'DEMO-NO-FILE/...'), so there is nothing real to
-- move. Any row that does have a usable path is copied into the vault; the old
-- table is left in place and readable rather than dropped, so this is reversible.
insert into public.documents (family_id, name, category, account_id, created_at, file_path)
select pd.family_id, pd.name, 'Statements', pd.account_id, pd.uploaded_at, pd.url
  from public.portfolio_documents pd
 where pd.url is not null
   and pd.url not like 'http%'
   and pd.url not like 'DEMO-NO-FILE/%'
   and not exists (
     select 1 from public.documents d
      where d.family_id = pd.family_id and d.name = pd.name and d.account_id = pd.account_id);

comment on table public.portfolio_documents is
  'SUPERSEDED by documents.account_id. Kept readable for reference; do not write '
  'to it. Statements now live in the vault so they are AI-readable and audited.';
