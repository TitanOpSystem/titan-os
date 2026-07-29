-- The firm's standard advisory fee, as data rather than a code default.
--
-- The Client Services Agreement and the ACH authorisation modals pre-filled
-- 5,000.00 monthly / 60,000.00 annual and $5,000.00 monthly. Those are PCM's
-- commercial terms, hardcoded, and every tenant firm inherited them as the
-- starting point on a document they were about to put in front of a client.
-- Editable, so not dangerous in the way a wrong counterparty is — but it is
-- another firm's pricing appearing as the suggested answer.
--
-- Stored as a number, not a formatted string. The two documents want it written
-- differently ("5,000.00" on the agreement, "$5,000.00" on the ACH form) and the
-- annual figure is derived from it, so formatting belongs at the point of use.
--
-- Nullable on purpose. A firm that has not set a standard fee gets an empty field
-- and types the number, which is obvious and harmless. There is no shared default
-- to fall back to, for the same reason there is none for document templates.
alter table public.brand_profiles
  add column if not exists default_monthly_fee numeric(12,2);

comment on column public.brand_profiles.default_monthly_fee is
  'The firm''s standard monthly advisory fee, used to pre-fill the agreement and ACH forms. Null means no standard fee: the field is left blank for the Expert to complete. The annual figure is derived as twelve times this value.';

-- A negative or absurd fee is a data-entry slip, not a business model.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='brand_profiles_default_monthly_fee_chk') then
    alter table public.brand_profiles
      add constraint brand_profiles_default_monthly_fee_chk
      check (default_monthly_fee is null or (default_monthly_fee >= 0 and default_monthly_fee < 10000000));
  end if;
end $$;
