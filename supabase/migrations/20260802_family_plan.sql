-- Service plan on the household: Core or Private.
--
-- Core is the full platform minus the three things the firm sells as service rather than software:
-- an assigned expert, workflows, and bill pay. The Partner is the lead on a Core household.
--
-- WHY THIS IS ENFORCED HERE AND NOT ONLY IN THE UI
--
-- The plan is a commercial boundary — it decides what a family has paid for. A gate that lives
-- only in App.jsx is a suggestion: anyone holding a valid session for that family can insert a
-- workflow instance or set pcm_responsible straight through the API. Worse, two of the three gated
-- features touch client money (bill-pay flags and the payment register), so an unenforced gate
-- would let a record appear saying a bill was handled by the firm on a household the firm does not
-- pay bills for. The triggers below refuse those writes outright.
--
-- EXISTING HOUSEHOLDS DEFAULT TO PRIVATE, NOT CORE
--
-- Deliberate. Defaulting to Core would strip bill pay from the households already using it, and a
-- family who cannot see that a bill was paid concludes it was not. New households pick a plan
-- explicitly in the form; the default only ever applies to rows that predate this migration.

alter table families
  add column if not exists plan text not null default 'private';

alter table families
  drop constraint if exists families_plan_check;

alter table families
  add constraint families_plan_check check (plan in ('core', 'private'));

comment on column families.plan is
  'Service tier. core = full platform, Partner-led, no assigned expert / workflows / bill pay. '
  'private = everything. Enforced by the triggers in 20260802_family_plan.sql, not just the UI.';

-- SECURITY DEFINER because the triggers must read families.plan regardless of who is writing to
-- cash_flow_events or obligations, and a trigger function otherwise runs with the caller's rights.
-- search_path is pinned so the function cannot be redirected at a shadowed families table.
-- The only thing this exposes is a tier string for a family id, which is not client data.
create or replace function family_plan(p_family_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select plan from families where id = p_family_id;
$$;

revoke all on function family_plan(uuid) from public;
grant execute on function family_plan(uuid) to authenticated, service_role;

-- ── Workflows ────────────────────────────────────────────────────────────────
-- Obligations are the recurring commitments workflows run against, so both are blocked. Blocking
-- workflow_instances is enough to keep workflow_instance_steps empty as well: a step requires an
-- instance, and no instance can exist for a Core household in the first place.

create or replace function refuse_when_core()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if family_plan(new.family_id) = 'core' then
    raise exception
      'This household is on the Core plan, which does not include %. Move it to Private first.',
      tg_argv[0]
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists obligations_refuse_core on obligations;
create trigger obligations_refuse_core
  before insert or update on obligations
  for each row execute function refuse_when_core('obligations');

drop trigger if exists workflow_instances_refuse_core on workflow_instances;
create trigger workflow_instances_refuse_core
  before insert or update on workflow_instances
  for each row execute function refuse_when_core('workflows');

-- ── Bill pay ─────────────────────────────────────────────────────────────────
-- A cash-flow event itself is fine on Core; the household still tracks its own expenses. What is
-- refused is the claim that the FIRM is responsible for paying it, and the per-period payment
-- register that records the firm having done so.

create or replace function refuse_billpay_when_core()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pcm_responsible is true and family_plan(new.family_id) = 'core' then
    raise exception
      'This household is on the Core plan, which does not include bill pay.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists cash_flow_events_refuse_core_billpay on cash_flow_events;
create trigger cash_flow_events_refuse_core_billpay
  before insert or update on cash_flow_events
  for each row execute function refuse_billpay_when_core();

-- The payment log gets its OWN function rather than reusing refuse_when_core, because
-- cash_flow_payment_log.family_id is nullable. A caller who simply omitted it would make
-- family_plan(null) return null, `null = 'core'` evaluate to null rather than true, and the write
-- sail straight through the gate. event_id is NOT NULL, so the family is resolved through the
-- event and the row's own family_id is only a fallback.
create or replace function refuse_payment_log_when_core()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  select family_id into fid from cash_flow_events where id = new.event_id;
  if family_plan(coalesce(fid, new.family_id)) = 'core' then
    raise exception
      'This household is on the Core plan, which does not include bill pay.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists cash_flow_payment_log_refuse_core on cash_flow_payment_log;
create trigger cash_flow_payment_log_refuse_core
  before insert or update on cash_flow_payment_log
  for each row execute function refuse_payment_log_when_core();

-- ── Downgrades ───────────────────────────────────────────────────────────────
-- Dropping a household from Private to Core while it holds open workflows and bill-pay flags would
-- leave that data in place with nothing in the UI drawing it: the rows still say the firm is paying
-- a bill, and no screen shows it. Same failure as deleting a Vault folder that still holds
-- documents. Refusing and naming the counts is the honest option, and the message says what to
-- clear first.

create or replace function refuse_downgrade_with_open_work()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n_obligations int;
  n_workflows int;
  n_billpay int;
begin
  if old.plan = 'core' or new.plan <> 'core' then
    return new;
  end if;

  select count(*) into n_obligations from obligations where family_id = new.id;
  select count(*) into n_workflows from workflow_instances where family_id = new.id;
  select count(*) into n_billpay from cash_flow_events
    where family_id = new.id and pcm_responsible is true;

  if n_obligations + n_workflows + n_billpay > 0 then
    raise exception
      'Cannot move this household to Core while it has % obligation(s), % workflow(s) and % '
      'bill-pay expense(s) on file. Clear or reassign those first, so nothing is left recorded '
      'that no screen will show.',
      n_obligations, n_workflows, n_billpay
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists families_refuse_downgrade on families;
create trigger families_refuse_downgrade
  before update of plan on families
  for each row execute function refuse_downgrade_with_open_work();
