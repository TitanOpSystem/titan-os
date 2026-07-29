-- Exposures noticed on a household's behalf, and what happened to them.
--
-- WHY THIS EXISTS
--
-- The platform's most persuasive moment in a live demo was the assistant
-- volunteering that a $3.1M Ferrari sitting in the valuables schedule was
-- currently uninsured. Nobody had asked about insurance. That is precisely the
-- work a family office is paid for — and it left no trace whatsoever. The next
-- day there was nothing to point at.
--
-- Every other kind of work already has a record: workflow steps carry dates and
-- actors, balances carry the statement they came from, payments carry who paid
-- them. Risk noticed and closed had nowhere to live, which meant an activity
-- report could only ever show work completed, never risk avoided. The second is
-- what justifies a fee.
--
-- DESIGN NOTES
--
-- `source` separates what a person spotted from what the platform detected. The
-- report must be able to say "your Expert identified" and "the platform flagged"
-- as different sentences, because blending them overstates the software and
-- understates the adviser — and because a client is entitled to know which it was.
--
-- `resolved_at` is nullable and stays that way until something actually closes.
-- An unresolved exposure is not an embarrassment to hide; a report that shows six
-- raised and five closed is more credible than one showing six and six.

create table if not exists public.client_exceptions (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,

  title        text not null,
  detail       text,

  -- Deliberately coarse. A long taxonomy invites miscategorisation and nobody
  -- reports on the tail of it.
  category     text not null default 'other'
                 check (category in ('insurance','provenance','deadline','document','tax','liquidity','other')),

  severity     text not null default 'attention'
                 check (severity in ('note','attention','urgent')),

  -- Who noticed. Not who owns it.
  source       text not null default 'expert'
                 check (source in ('expert','platform')),

  raised_at    timestamptz not null default now(),
  raised_by    text,                    -- display label, as tasks.completed_by does

  resolved_at  timestamptz,
  resolution   text,
  resolved_by  text,

  -- What it concerns, when it concerns one specific thing. All optional: an
  -- exposure can be about the household generally.
  property_id  uuid references public.properties(id) on delete set null,
  account_id   uuid references public.portfolio_accounts(id) on delete set null,
  document_id  uuid references public.documents(id) on delete set null,

  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,

  -- A resolution note without a resolution date, or vice versa, is a half-closed
  -- record that would report as both open and handled.
  constraint client_exceptions_resolution_chk
    check ((resolved_at is null and resolution is null and resolved_by is null)
        or (resolved_at is not null))
);

create index if not exists client_exceptions_family_raised_idx
  on public.client_exceptions (family_id, raised_at desc);
-- Open items are the common query: the review queue and the report both want them.
create index if not exists client_exceptions_open_idx
  on public.client_exceptions (family_id, severity) where resolved_at is null;

alter table public.client_exceptions enable row level security;

-- Identical shape to account_balances and tasks: family-scoped read, and partners
-- may read but not write. Copied rather than reinvented so there is one rule to
-- reason about across every family-scoped table.
do $$ begin
  if not exists (select 1 from pg_policies
                 where tablename='client_exceptions' and policyname='read_access') then
    create policy read_access on public.client_exceptions for select
      using (is_admin() or family_id in (select current_user_allowed_family_ids()));
  end if;
  if not exists (select 1 from pg_policies
                 where tablename='client_exceptions' and policyname='write_access') then
    create policy write_access on public.client_exceptions for all
      using (is_admin() or (family_id in (select current_user_allowed_family_ids())
                            and current_user_role() <> 'partner'))
      with check (is_admin() or (family_id in (select current_user_allowed_family_ids())
                            and current_user_role() <> 'partner'));
  end if;
end $$;

comment on table public.client_exceptions is
  'Exposures noticed on a household''s behalf and their outcome. Feeds the "risk avoided" section of the client activity report, which is the part that evidences value rather than activity. source distinguishes what a person spotted from what the platform detected; the report must not blend them.';

-- ── Reporting view ──────────────────────────────────────────────────────────
-- The report needs counts by period without every caller rewriting the same date
-- arithmetic, and without any of them quietly choosing different period edges.
create or replace function public.client_exception_summary(
  p_family_id uuid,
  p_from      timestamptz,
  p_to        timestamptz
)
returns table (
  raised_in_period   integer,
  closed_in_period   integer,
  open_at_period_end integer,
  by_expert          integer,
  by_platform        integer,
  urgent_open        integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*) filter (where raised_at >= p_from and raised_at < p_to)::int,
    count(*) filter (where resolved_at >= p_from and resolved_at < p_to)::int,
    -- Open AT THE END OF THE PERIOD, not open today. A report covering last
    -- quarter must not be changed by something closed this morning.
    count(*) filter (where raised_at < p_to and (resolved_at is null or resolved_at >= p_to))::int,
    count(*) filter (where raised_at >= p_from and raised_at < p_to and source = 'expert')::int,
    count(*) filter (where raised_at >= p_from and raised_at < p_to and source = 'platform')::int,
    count(*) filter (where severity = 'urgent' and raised_at < p_to
                       and (resolved_at is null or resolved_at >= p_to))::int
  from public.client_exceptions
  where family_id = p_family_id;
$$;

comment on function public.client_exception_summary(uuid, timestamptz, timestamptz) is
  'Exception counts for one household over one period. open_at_period_end is as at the period boundary, not as at today, so a report about a past period does not change when something is closed later.';
