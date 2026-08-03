-- Rename the upper tier from 'private' to 'premier'.
--
-- The stored value is renamed, not just the label. A column holding 'private' while every screen
-- says "Premier" is the kind of mismatch that costs someone an hour six months from now, and the
-- rename is cheap here: the trigger functions in 20260802_family_plan.sql only ever compare against
-- 'core', so none of them need touching. Only the default and the check constraint mention the
-- upper tier.
--
-- 'private' STAYS VALID, PERMANENTLY
--
-- Not laziness. A browser tab opened before this shipped still holds the old bundle and will write
-- 'private' on the next family it creates. Narrowing the constraint to ('core','premier') would
-- turn that into a hard failure on an admin action, so the old value is accepted and treated as an
-- alias for premier — normalisePlan() in src/plans.js maps it, and the triggers compare against
-- 'core' so a 'private' row is correctly granted everything. There is no state in which a stale
-- client can produce a household with the wrong entitlements.

-- ORDER MATTERS, AND THE OBVIOUS ORDER IS WRONG.
--
-- The first version of this file moved the rows first, reasoning that no row should ever be in
-- violation of the constraint about to be added. That fails: the constraint about to be *dropped* is
-- still in force, and it only permits ('core','private'), so the UPDATE to 'premier' is what gets
-- rejected. Postgres caught it. Drop first, move second, re-add third.
alter table families drop constraint if exists families_plan_check;

update families set plan = 'premier' where plan = 'private';

alter table families alter column plan set default 'premier';

alter table families
  add constraint families_plan_check check (plan in ('core', 'premier', 'private'));

comment on column families.plan is
  'Service tier. core = full platform, Partner-led, no assigned expert / workflows / bill pay. '
  'premier = everything. ''private'' is a legacy alias for premier, accepted so a stale browser tab '
  'cannot fail a write; src/plans.js normalises it. Enforced by the triggers in '
  '20260802_family_plan.sql, not just the UI.';
