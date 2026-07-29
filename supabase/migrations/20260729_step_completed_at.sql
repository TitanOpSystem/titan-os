-- A step could be marked done with no record of WHEN.
--
-- THE GAP
--
-- workflow_instance_steps carried approved_at and sent_at. Both are conditional:
-- approved_at exists only when a person approved the step, sent_at only when
-- something went out. A step the platform performed itself — read the invoice,
-- verify the balance, close the withdrawal window, log the payment — was marked
-- done and left no timestamp anywhere.
--
-- WHY THAT MATTERED
--
-- The client activity report places work in a reporting period. With no completion
-- date, automated steps fell outside every period, and the report printed
--
--     Automated steps ................ 0
--
-- on a document a client reads and a fee conversation may rest on. Zero reads as
-- "the platform did nothing", the exact opposite of the truth, and nothing in the
-- document exposes the difference between "none happened" and "we cannot tell".
--
-- updated_at is not a substitute: it defaults to now() and is touched by any edit,
-- so rows representing 2025 work read as today.
--
-- ORDERING CONSTRAINT
--
-- src/App.jsx stepTransitionPatch() writes this column on every step transition,
-- and one codebase serves every tenant. This migration must be applied to a
-- project BEFORE the frontend that writes it reaches that project, or step
-- advances fail with "column completed_at does not exist".

alter table public.workflow_instance_steps
  add column if not exists completed_at timestamptz;

comment on column public.workflow_instance_steps.completed_at is
  'When the step was completed, for any step including automated ones. approved_at and sent_at only cover human approvals and outbound sends; without this, a done step by the platform cannot be placed in a reporting period.';

-- Backfill only what is genuinely knowable.
--
-- Steps with neither an approval nor a send stay NULL rather than being given a
-- plausible date. An invented timestamp would be indistinguishable from a real one
-- forever, and the report is built to say "this cannot be attributed to a period"
-- — it cannot say that about a row that has been quietly filled in.
update public.workflow_instance_steps
   set completed_at = coalesce(sent_at, approved_at)
 where status = 'done' and completed_at is null
   and coalesce(sent_at, approved_at) is not null;

-- The report's hot path: steps for one household within one period.
create index if not exists workflow_steps_completed_idx
  on public.workflow_instance_steps (family_id, completed_at) where completed_at is not null;
