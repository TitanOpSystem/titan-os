-- ─────────────────────────────────────────────────────────────────────────────
-- PRIMARY FAMILY CONTACT, AND A CC LINE ON WORKFLOW DRAFTS
--
-- Applied to: PCM production (2026-07-28), titanos-demo (2026-07-28)
--
-- Every outbound workflow draft copies the family's principal, so the client sees
-- what is being done in their name. That requires knowing WHICH member is the
-- principal, and the data could not answer that: the Harrington family's three
-- members share an identical created_at (they were seeded in one statement), so
-- "the first contact" is not a stable answer. Guessing between a husband and wife
-- on a bank instruction is not an acceptable failure mode, so the choice is now
-- explicit and recorded.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Which member is the principal ────────────────────────────────────────────
alter table public.contacts
  add column if not exists is_primary boolean not null default false;

comment on column public.contacts.is_primary is
  'The family principal. Copied on every outbound workflow draft. At most one per '
  'family, enforced by contacts_one_primary_per_family.';

-- "At most one per family" as a database guarantee rather than a UI convention.
-- Partial index, so the many false rows never collide.
create unique index if not exists contacts_one_primary_per_family
  on public.contacts (family_id) where is_primary;

-- Resolving the primary is needed in more than one place (the edge function today,
-- reports later), so it lives here rather than being reimplemented per caller.
--
-- Order of preference:
--   1. the member explicitly marked primary
--   2. if the family has exactly ONE member with an email, that member — an
--      unambiguous case does not need a human to confirm it
--   3. nothing. Deliberately not "pick the oldest": a silent wrong answer here
--      puts client correspondence in front of the wrong person.
create or replace function public.family_primary_contact(p_family_id uuid)
returns table(name text, email text, was_explicit boolean)
language sql stable security invoker as $$
  with explicit as (
    select c.name, c.email, true as was_explicit
    from public.contacts c
    where c.family_id = p_family_id
      and c.is_primary
      and coalesce(c.email,'') <> ''
    limit 1
  ),
  sole as (
    select c.name, c.email, false as was_explicit
    from public.contacts c
    where c.family_id = p_family_id
      and coalesce(c.is_advisor,false) = false
      and coalesce(c.email,'') <> ''
      -- Only when there is exactly one candidate. Counted in a subquery rather
      -- than with HAVING, which would make this an aggregate query and forbid
      -- selecting the row's own columns.
      and (select count(*) from public.contacts c2
            where c2.family_id = p_family_id
              and coalesce(c2.is_advisor,false) = false
              and coalesce(c2.email,'') <> '') = 1
  )
  select * from explicit
  union all
  select * from sole where not exists (select 1 from explicit);
$$;

comment on function public.family_primary_contact(uuid) is
  'The family principal to copy on outbound correspondence. Returns no row rather '
  'than guessing when several members have emails and none is marked primary.';

-- ── The CC itself ────────────────────────────────────────────────────────────
alter table public.workflow_instance_steps
  add column if not exists draft_cc text;

comment on column public.workflow_instance_steps.draft_cc is
  'Copy line for the prepared draft, defaulted to the family principal. Editable '
  'by the reviewer before approval, like every other part of the draft.';
