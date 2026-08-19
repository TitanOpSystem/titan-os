-- ═════════════════════════════════════════════════════════════════════════════
-- Titan platform functions — consolidated
--
-- `supabase db pull` is a schema differ and reliably captures tables and columns
-- but not functions, RLS policies, or grants. Almost everything below is a
-- function, so this file is written by hand to make the repository match what is
-- actually deployed on the live instances.
--
-- Every statement is idempotent (`if not exists` / `create or replace`), so this
-- is safe to run against an instance that already has some or all of it, and safe
-- to run twice.
--
-- One thing this file deliberately does NOT do: seed platform_config. That row
-- carries a per-project storage URL and a demo flag, so a shared migration cannot
-- set it correctly. See the note at the bottom.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─── Privilege helper ────────────────────────────────────────────────────────
-- is_admin() resolves auth.uid(), which is null on a service-role connection, so
-- a bare is_admin() gate locks out edge functions and provisioning scripts along
-- with attackers. service_role already bypasses RLS entirely, so recognising it
-- grants no privilege it did not already have. current_user cannot be forged by
-- anon or authenticated: PostgREST connects as the role named in the JWT.
create or replace function public.caller_is_privileged()
returns boolean
  language sql stable security definer set search_path to 'public'
as $$
  select public.is_admin() or current_user in ('service_role','postgres','supabase_admin');
$$;
revoke execute on function public.caller_is_privileged() from public;
grant  execute on function public.caller_is_privileged() to authenticated, service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- BRAND SKINS
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.create_brand_skin(
  p_brand_name text, p_brand_short text default null, p_label text default null,
  p_tagline text default '', p_contact_email text default '', p_email_domain text default '',
  p_color_primary text default null, p_color_primary_mid text default null,
  p_color_accent text default null, p_color_accent_light text default null,
  p_color_bg text default null, p_color_border text default null,
  p_color_border_light text default null, p_color_text_soft text default null,
  p_color_text_mute text default null, p_logo_url text default null,
  p_mark_url text default null, p_app_url text default null,
  p_default_monthly_fee numeric default null, p_default_onboarding_fee numeric default null,
  p_derive_property_costs boolean default false, p_notes text default null,
  p_activate boolean default false, p_clone_documents_from uuid default null
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  v_id uuid; v_domain text; v_short text; v_label text;
  v_hex text := '^#[0-9a-fA-F]{6}$';
begin
  if not public.caller_is_privileged() then
    raise exception 'Only admins can create brand skins';
  end if;
  if coalesce(btrim(p_brand_name),'') = '' then
    raise exception 'brand_name is required';
  end if;

  v_short := coalesce(nullif(btrim(p_brand_short),''), split_part(btrim(p_brand_name),' ',1));
  v_label := coalesce(nullif(btrim(p_label),''), btrim(p_brand_name));

  -- Accept "@acme.com", "https://acme.com/", "ACME.com" and store "acme.com".
  v_domain := lower(btrim(coalesce(p_email_domain,'')));
  v_domain := regexp_replace(v_domain, '^https?://', '');
  v_domain := regexp_replace(v_domain, '^@', '');
  v_domain := regexp_replace(v_domain, '/.*$', '');

  -- A malformed hex renders an unstyled page, which is hard to diagnose from the UI.
  if p_color_primary      is not null and p_color_primary      !~ v_hex then raise exception 'color_primary must be a 6-digit hex like #092b49 (got %)', p_color_primary; end if;
  if p_color_primary_mid  is not null and p_color_primary_mid  !~ v_hex then raise exception 'color_primary_mid must be a 6-digit hex (got %)', p_color_primary_mid; end if;
  if p_color_accent       is not null and p_color_accent       !~ v_hex then raise exception 'color_accent must be a 6-digit hex (got %)', p_color_accent; end if;
  if p_color_accent_light is not null and p_color_accent_light !~ v_hex then raise exception 'color_accent_light must be a 6-digit hex (got %)', p_color_accent_light; end if;
  if p_color_bg           is not null and p_color_bg           !~ v_hex then raise exception 'color_bg must be a 6-digit hex (got %)', p_color_bg; end if;
  if p_color_border       is not null and p_color_border       !~ v_hex then raise exception 'color_border must be a 6-digit hex (got %)', p_color_border; end if;
  if p_color_border_light is not null and p_color_border_light !~ v_hex then raise exception 'color_border_light must be a 6-digit hex (got %)', p_color_border_light; end if;
  if p_color_text_soft    is not null and p_color_text_soft    !~ v_hex then raise exception 'color_text_soft must be a 6-digit hex (got %)', p_color_text_soft; end if;
  if p_color_text_mute    is not null and p_color_text_mute    !~ v_hex then raise exception 'color_text_mute must be a 6-digit hex (got %)', p_color_text_mute; end if;

  insert into public.brand_profiles (
    label, brand_name, brand_short, tagline, contact_email, email_domain,
    logo_url, mark_url, color_primary, color_primary_mid, color_accent, color_accent_light,
    color_bg, color_border, color_border_light, color_text_soft, color_text_mute,
    app_url, default_monthly_fee, default_onboarding_fee, derive_property_costs, notes, is_active
  ) values (
    v_label, btrim(p_brand_name), v_short, coalesce(p_tagline,''),
    coalesce(lower(btrim(p_contact_email)),''), v_domain, p_logo_url, p_mark_url,
    coalesce(p_color_primary,'#092b49'), coalesce(p_color_primary_mid,'#293d5c'),
    coalesce(p_color_accent,'#ceb684'),  coalesce(p_color_accent_light,'#dfc99a'),
    coalesce(p_color_bg,'#f9f7f3'),      coalesce(p_color_border,'#d8cdb8'),
    coalesce(p_color_border_light,'#ede8de'), coalesce(p_color_text_soft,'#5a6e84'),
    coalesce(p_color_text_mute,'#8fa0b2'),
    p_app_url, p_default_monthly_fee, p_default_onboarding_fee,
    coalesce(p_derive_property_costs,false), p_notes, false
  ) returning id into v_id;

  -- Inherits doc keys and field maps, but points at the SAME stored PDFs, which
  -- still carry the source firm's letterhead. Saves re-mapping; the files must
  -- still be replaced before anything reaches a real client.
  if p_clone_documents_from is not null then
    insert into public.brand_documents (
      brand_profile_id, doc_key, storage_path, original_filename,
      byte_size, field_names, missing_fields, notes)
    select v_id, doc_key, storage_path, original_filename, byte_size, field_names, missing_fields,
           coalesce(notes || ' | ','') || 'cloned from ' || p_clone_documents_from::text
    from public.brand_documents where brand_profile_id = p_clone_documents_from;
  end if;

  -- Activation is exclusive, so it is opt-in: creating a skin must never silently
  -- reskin a live instance mid-session.
  if p_activate then perform public.activate_brand_profile(v_id); end if;
  return v_id;
end;
$$;
revoke execute on function public.create_brand_skin(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,numeric,numeric,boolean,text,boolean,uuid) from public;
grant  execute on function public.create_brand_skin(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,numeric,numeric,boolean,text,boolean,uuid) to authenticated, service_role;


create or replace function public.activate_brand_profile(target uuid)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.caller_is_privileged() then
    raise exception 'Only admins can change branding';
  end if;
  update public.brand_profiles set is_active = false, updated_at = now() where is_active;
  update public.brand_profiles set is_active = true,  updated_at = now() where id = target;
  if not found then raise exception 'Brand profile not found'; end if;
end;
$$;
revoke execute on function public.activate_brand_profile(uuid) from public;
grant  execute on function public.activate_brand_profile(uuid) to authenticated, service_role;


-- A brand row existing is not the same as a skin being presentable.
create or replace function public.brand_skin_readiness(p_brand_id uuid default null)
returns table(check_name text, ok boolean, detail text)
  language plpgsql stable security definer set search_path to 'public'
as $$
declare
  b public.brand_profiles; o public.outbound_email_settings; v_docs int;
begin
  if not public.caller_is_privileged() then
    raise exception 'Only admins can inspect brand readiness';
  end if;

  if p_brand_id is null then
    select * into b from public.brand_profiles where is_active limit 1;
  else
    select * into b from public.brand_profiles where id = p_brand_id;
  end if;
  if b.id is null then
    return query select 'brand exists'::text, false, 'No such brand profile'::text; return;
  end if;

  select * into o from public.outbound_email_settings limit 1;
  select count(*) into v_docs from public.brand_documents where brand_profile_id = b.id;

  return query select 'brand name'::text, coalesce(btrim(b.brand_name),'') <> '', b.brand_name;
  return query select 'logo uploaded'::text, b.logo_url is not null,
    coalesce(b.logo_url, 'No logo_url — the header will fall back to text');
  return query select 'icon / mark uploaded'::text, b.mark_url is not null,
    coalesce(b.mark_url, 'No mark_url — favicon and compact header have no icon');
  return query select 'tagline'::text, coalesce(btrim(b.tagline),'') <> '',
    coalesce(nullif(b.tagline,''), 'Empty — acceptable, but the login page looks unfinished');
  return query select 'email domain'::text, coalesce(btrim(b.email_domain),'') <> '',
    coalesce(nullif(b.email_domain,''), 'Not set — outbound mail cannot resolve a sender from the brand');
  return query select 'app url'::text, coalesce(btrim(b.app_url),'') <> '',
    coalesce(nullif(b.app_url,''), 'Not set — email CTA links will be wrong');
  return query select 'document templates'::text, v_docs > 0,
    v_docs || ' template(s) registered for this brand';
  return query select 'outbound email configured'::text,
    o.sending_domain is not null and coalesce(o.sender_verified,false),
    case when o.sending_domain is null then 'sending_domain is not set — workflow sends will be refused'
         when not coalesce(o.sender_verified,false) then 'sending_domain ' || o.sending_domain || ' is not verified — workflow sends will be refused'
         else 'verified: ' || o.sending_domain end;
  -- The mismatch that actually bites: a skin can look perfect while mail leaves
  -- under another firm's identity.
  return query select 'outbound domain matches brand'::text,
    o.sending_domain is not null and lower(o.sending_domain) = lower(coalesce(b.email_domain,'')),
    case when o.sending_domain is null then 'No sending domain to compare'
         when lower(o.sending_domain) = lower(coalesce(b.email_domain,'')) then 'match'
         else 'MISMATCH: brand is ' || coalesce(nullif(b.email_domain,''),'(unset)') ||
              ' but mail sends from ' || o.sending_domain || ' — recipients will see the wrong firm' end;
end;
$$;
revoke execute on function public.brand_skin_readiness(uuid) from public;
grant  execute on function public.brand_skin_readiness(uuid) to authenticated, service_role;


-- ─── Per-project settings ────────────────────────────────────────────────────
create table if not exists public.platform_config (
  id                  boolean primary key default true check (id),
  storage_public_base text,
  demo_mode           boolean not null default false,
  updated_at          timestamptz not null default now()
);

alter table public.platform_config enable row level security;
drop policy if exists read_access  on public.platform_config;
drop policy if exists write_access on public.platform_config;
create policy read_access  on public.platform_config for select to authenticated using (true);
create policy write_access on public.platform_config for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- Uploading a logo should be the only manual step in adding a skin: this finds the
-- files in the public brand bucket, works out which is the wordmark and which the
-- icon from their filenames, and builds the URLs.
create or replace function public.create_skin_from_logo(
  p_folder text, p_brand_name text, p_tagline text default '',
  p_contact_email text default null, p_email_domain text default '',
  p_color_primary text default null, p_color_accent text default null,
  p_color_primary_mid text default null, p_color_accent_light text default null,
  p_color_bg text default null, p_app_url text default null,
  p_brand_short text default null, p_activate boolean default false,
  p_clone_documents_from uuid default null
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  v_base text; v_demo boolean; v_folder text; v_logo text; v_mark text;
  v_count int; v_contact text; v_appurl text; v_id uuid;
begin
  if not public.caller_is_privileged() then
    raise exception 'Only admins can create brand skins';
  end if;

  select storage_public_base, demo_mode into v_base, v_demo from public.platform_config where id;
  if coalesce(v_base,'') = '' then
    raise exception 'platform_config.storage_public_base is not set for this project';
  end if;

  v_folder := btrim(coalesce(p_folder,''), '/');
  if v_folder = '' then
    raise exception 'p_folder is required (the folder name inside the brand bucket)';
  end if;

  select count(*) into v_count from storage.objects
  where bucket_id = 'brand' and name like v_folder || '/%';
  if v_count = 0 then
    raise exception 'No files found in brand/%/ — upload the logo there first', v_folder;
  end if;

  -- Wordmark: prefer a filename saying so, else the largest image, which in
  -- practice is the full lockup rather than the icon.
  select v_base || name into v_logo from storage.objects
  where bucket_id = 'brand' and name like v_folder || '/%'
    and (lower(name) like '%logo%' or lower(name) like '%wordmark%')
  order by (metadata->>'size')::bigint desc nulls last limit 1;
  if v_logo is null then
    select v_base || name into v_logo from storage.objects
    where bucket_id = 'brand' and name like v_folder || '/%'
      and coalesce(metadata->>'mimetype','') like 'image/%'
    order by (metadata->>'size')::bigint desc nulls last limit 1;
  end if;

  select v_base || name into v_mark from storage.objects
  where bucket_id = 'brand' and name like v_folder || '/%'
    and (lower(name) like '%mark%' or lower(name) like '%icon%' or lower(name) like '%favicon%')
  order by (metadata->>'size')::bigint asc nulls last limit 1;
  if v_mark is null then
    select v_base || name into v_mark from storage.objects
    where bucket_id = 'brand' and name like v_folder || '/%'
      and coalesce(metadata->>'mimetype','') like 'image/%'
      and v_base || name is distinct from v_logo
    order by (metadata->>'size')::bigint asc nulls last limit 1;
  end if;

  -- On a demo instance every skin routes enquiries to the operator rather than to
  -- the firm being impersonated. Never on a live client instance.
  v_contact := coalesce(nullif(btrim(coalesce(p_contact_email,'')),''),
                        case when v_demo then 'wperez@titanopsystem.com' else '' end);

  v_appurl := coalesce(nullif(btrim(coalesce(p_app_url,'')),''),
    (select app_url from public.brand_profiles where coalesce(app_url,'') <> ''
      order by is_active desc, created_at limit 1));

  v_id := public.create_brand_skin(
    p_brand_name => p_brand_name, p_brand_short => p_brand_short, p_tagline => p_tagline,
    p_contact_email => v_contact, p_email_domain => p_email_domain,
    p_color_primary => p_color_primary, p_color_primary_mid => p_color_primary_mid,
    p_color_accent => p_color_accent, p_color_accent_light => p_color_accent_light,
    p_color_bg => p_color_bg, p_logo_url => v_logo, p_mark_url => v_mark,
    p_app_url => v_appurl,
    p_notes => 'Created from brand/' || v_folder || '/ (' || v_count || ' file(s))',
    p_activate => p_activate, p_clone_documents_from => p_clone_documents_from);
  return v_id;
end;
$$;
revoke execute on function public.create_skin_from_logo(text,text,text,text,text,text,text,text,text,text,text,text,boolean,uuid) from public;
grant  execute on function public.create_skin_from_logo(text,text,text,text,text,text,text,text,text,text,text,text,boolean,uuid) to authenticated, service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- AI INVESTMENT GUARDRAIL
--
-- The licensed firm, not the platform, holds the fiduciary relationship. An
-- assistant that evaluates an allocation or suggests a change would put unlicensed
-- investment advice in front of that firm's clients under the firm's own branding.
-- Advice is refused under every setting; what varies is how much FACTUAL account
-- information may be surfaced first.
--
-- facts_only is the house default: reporting what a client's own records say is not
-- advice, and refusing someone their own balance reads as hiding their money from
-- them rather than as a compliance boundary.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.brand_profiles
  add column if not exists ai_investment_policy text not null default 'facts_only';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'brand_profiles_ai_investment_policy_chk') then
    alter table public.brand_profiles
      add constraint brand_profiles_ai_investment_policy_chk
      check (ai_investment_policy in ('redirect_all','facts_only','open'));
  end if;
end $$;

comment on column public.brand_profiles.ai_investment_policy is
  'Controls the AI assistant for client/partner users. facts_only (default) = may state figures from the family''s own documents but never evaluate, compare or recommend; redirect_all = hand every investment topic to the adviser including balances; open = no topic restriction. Investment ADVICE is prohibited under all three.';


-- ═════════════════════════════════════════════════════════════════════════════
-- LEAD ADVISOR
--
-- Two different people sit against a family and the difference is regulatory:
--   families.advisor_email → the Titan Expert. Administration: bill pay, documents,
--                            deadlines. NOT a licensed adviser. The column name is
--                            historical and is never shown to a user.
--   family_partners        → the firm's licensed advisers. Read-only by design;
--                            they hold the investment relationship.
--
-- This flag is a DESIGNATION, not a permission. Partner stays read-only exactly as
-- before. It decides who the assistant hands investment questions to.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.family_partners
  add column if not exists is_lead_advisor boolean not null default false;

comment on column public.family_partners.is_lead_advisor is
  'Designates this partner as lead adviser for the family: who the AI assistant hands investment questions to, and who the UI shows as owning the relationship. Grants no additional permissions.';

create unique index if not exists family_partners_one_lead_per_family
  on public.family_partners (family_id) where is_lead_advisor;


-- Who should an investment question go to? An explicit lead, else a sole partner
-- (unambiguous even without the flag), else the Titan Expert — better to reach the
-- administrator than to tell a client there is nobody to ask. The caller decides
-- whether that last fallback is appropriate: for an investment hand-off it is not,
-- and family-ai-assistant discards it rather than naming an unlicensed person.
create or replace function public.family_lead_advisor(p_family_id uuid)
returns table(full_name text, email text, source text)
  language plpgsql stable security definer set search_path to 'public'
as $$
declare v_partner_count int;
begin
  -- SECURITY DEFINER is needed to join user_profiles, which a client cannot read
  -- directly, so re-assert access here.
  if not (public.caller_is_privileged()
          or p_family_id in (select public.current_user_allowed_family_ids())) then
    raise exception 'Not authorized for this family';
  end if;

  return query
    select u.full_name, u.email, 'lead_advisor'::text
    from public.family_partners fp
    join public.user_profiles u on u.id = fp.user_id
    where fp.family_id = p_family_id and fp.is_lead_advisor and coalesce(u.active,true)
    limit 1;
  if found then return; end if;

  select count(*) into v_partner_count
  from public.family_partners fp
  join public.user_profiles u on u.id = fp.user_id
  where fp.family_id = p_family_id and coalesce(u.active,true);

  if v_partner_count = 1 then
    return query
      select u.full_name, u.email, 'sole_partner'::text
      from public.family_partners fp
      join public.user_profiles u on u.id = fp.user_id
      where fp.family_id = p_family_id and coalesce(u.active,true)
      limit 1;
    return;
  end if;

  return query
    select f.advisor_name, f.advisor_email,
           case when v_partner_count > 1 then 'expert_fallback_multiple_partners'
                else 'expert_fallback_no_partner' end::text
    from public.families f where f.id = p_family_id limit 1;
end;
$$;
revoke execute on function public.family_lead_advisor(uuid) from public;
grant  execute on function public.family_lead_advisor(uuid) to authenticated, service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- BILL PAYMENT REMINDERS
--
-- Until now only tasks could raise a reminder. A bill the firm is responsible for
-- had a due date, a "we pay this" flag, and no alert at all. For a Premier
-- household, where bill pay IS the service being sold, a missed bill is the
-- failure that loses the account.
--
-- WHY NOT A BOOLEAN: tasks.reminder_sent works because a task fires once. A monthly
-- bill recurs forever, so a boolean would need clearing every cycle by something,
-- and whatever cleared it would be a second moving part that can fail silently and
-- leave a household with no reminders at all. reminder_sent_for stores the
-- OCCURRENCE the last reminder covered, making the decision a comparison rather
-- than a reset — nothing has to run for it to stay correct.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.cash_flow_events
  add column if not exists reminder_days     integer not null default 7,
  add column if not exists reminder_sent_for date;

comment on column public.cash_flow_events.reminder_days is
  'Days before the due date to raise a reminder. 0 disables reminders for this bill.';
comment on column public.cash_flow_events.reminder_sent_for is
  'The occurrence date the most recent reminder covered. Compared against the next due occurrence to decide whether a reminder is outstanding — deliberately not a boolean, so recurring bills need no per-cycle reset.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cash_flow_events_reminder_days_chk') then
    alter table public.cash_flow_events
      add constraint cash_flow_events_reminder_days_chk
      check (reminder_days >= 0 and reminder_days <= 365);
  end if;
end $$;


-- Next occurrence on or after p_from. Null when the schedule has ended or a one-off
-- has passed.
--
-- Month-based frequencies re-anchor on the ORIGINAL day of month and clamp to the
-- month's length. Repeatedly adding interval '1 month' to 31 January walks to
-- 28 February and stays on the 28th thereafter, which would quietly move every
-- month-end mortgage three days early, permanently.
create or replace function public.next_bill_due_date(
  p_start date, p_frequency text, p_end date default null, p_from date default current_date
) returns date
  language plpgsql immutable
as $$
declare
  v_freq text := coalesce(lower(p_frequency),'once');
  v_next date; v_step interval; v_months int; v_anchor_day int;
  v_month_start date; v_dim int; v_n int; v_guard int := 0;
begin
  if p_start is null then return null; end if;

  if v_freq in ('once','one-time','onetime','') then
    return case when p_start >= p_from then p_start else null end;
  end if;

  v_months := case v_freq
    when 'monthly' then 1 when 'quarterly' then 3
    when 'semiannually' then 6 when 'semi-annually' then 6
    when 'annually' then 12 when 'yearly' then 12 else null end;

  if v_months is not null then
    v_anchor_day := extract(day from p_start)::int;
    v_n := greatest(0, (
      ((extract(year from p_from) - extract(year from p_start))::int * 12
        + (extract(month from p_from) - extract(month from p_start))::int) / v_months) - 1);
    loop
      v_month_start := (date_trunc('month', p_start) + make_interval(months => v_months * v_n))::date;
      v_dim := extract(day from (date_trunc('month', v_month_start) + interval '1 month - 1 day'))::int;
      v_next := v_month_start + (least(v_anchor_day, v_dim) - 1);
      exit when v_next >= p_from;
      v_n := v_n + 1; v_guard := v_guard + 1;
      if v_guard > 2000 then return null; end if;
    end loop;
    if p_end is not null and v_next > p_end then return null; end if;
    return v_next;
  end if;

  v_step := case v_freq when 'weekly' then interval '1 week'
                        when 'biweekly' then interval '2 weeks' else null end;
  -- An unrecognised frequency must not silently behave like a one-off; return null
  -- so the caller skips it rather than reminding on a date nobody expects.
  if v_step is null then return null; end if;

  if p_start >= p_from then
    v_next := p_start;
  else
    v_n := greatest(0, ((p_from - p_start) / greatest(1,(extract(epoch from v_step)/86400)::int)) - 1);
    v_next := (p_start + (v_step * v_n))::date;
    while v_next < p_from loop
      v_next := (v_next + v_step)::date;
      v_guard := v_guard + 1;
      if v_guard > 5000 then return null; end if;
    end loop;
  end if;

  if p_end is not null and v_next > p_end then return null; end if;
  return v_next;
end;
$$;
grant execute on function public.next_bill_due_date(date,text,date,date) to authenticated, service_role;


-- Bills needing a reminder today: firm responsible, reminders enabled, inside the
-- window, that occurrence not already reminded, and not already settled.
create or replace function public.bills_due_for_reminder(p_today date default current_date)
returns table(
  event_id uuid, family_id uuid, family_name text, expert_name text, expert_email text,
  description text, event_type text, category text, amount numeric, frequency text,
  due_date date, days_until integer, reminder_days integer)
  language sql stable security definer set search_path to 'public'
as $$
  with candidates as (
    select e.id, e.family_id, e.description, e.event_type, e.category, e.amount,
           e.frequency, e.reminder_days, e.reminder_sent_for, e.paid,
           public.next_bill_due_date(e.start_date, e.frequency, e.end_date, p_today) as due
    from public.cash_flow_events e
    where e.direction = 'expense'
      and coalesce(e.pcm_responsible,false)
      and coalesce(e.reminder_days,0) > 0
  )
  select c.id, c.family_id, f.name, f.advisor_name, f.advisor_email,
         c.description, c.event_type, c.category, c.amount, c.frequency,
         c.due, (c.due - p_today)::int, c.reminder_days
  from candidates c
  join public.families f on f.id = c.family_id
  where c.due is not null
    and c.due - p_today <= c.reminder_days
    and c.due >= p_today
    and (c.reminder_sent_for is distinct from c.due)
    -- A one-off uses the row's own paid flag; a recurring bill records each period
    -- separately in the payment log, so check there instead.
    and not (
      case when coalesce(lower(c.frequency),'once') in ('once','one-time','onetime','')
           then coalesce(c.paid,false)
           else exists (select 1 from public.cash_flow_payment_log l
                        where l.event_id = c.id and l.period = c.due and coalesce(l.paid,false))
      end)
  order by c.due, f.name;
$$;
revoke execute on function public.bills_due_for_reminder(date) from public;
grant  execute on function public.bills_due_for_reminder(date) to authenticated, service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- DOCUMENT SUPERSESSION
--
-- A renewal replaces a policy without the old one ceasing to matter: a claim on a
-- prior period needs the policy that was in force then. So nothing is deleted and
-- nothing moves — the file stays in the same (property_id, property_section) it was
-- filed under, and this column records which document retired it.
--
-- WHY A POINTER RATHER THAN AN is_current FLAG: a flag can drift into saying two
-- documents are current, or none, and nothing in the schema prevents it. A pointer
-- cannot contradict itself, and it records what replaced what.
--
-- ON DELETE SET NULL is deliberate: deleting a mistaken upload restores the
-- document it had superseded to current, rather than leaving a family with no
-- current policy on file.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.documents
  add column if not exists superseded_by_id uuid references public.documents(id) on delete set null;

comment on column public.documents.superseded_by_id is
  'The document that replaced this one. NULL means this is the current version. Set rather than deleting, so a claim on a prior period can still reach the policy in force at the time.';

create index if not exists documents_current_idx
  on public.documents (property_id, property_section)
  where superseded_by_id is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'documents_no_self_supersede') then
    alter table public.documents
      add constraint documents_no_self_supersede
      check (superseded_by_id is null or superseded_by_id <> id);
  end if;
end $$;


create or replace function public.supersede_document(p_old_id uuid, p_new_id uuid)
returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare
  v_old_family uuid;
  v_new_family uuid;
begin
  if p_old_id = p_new_id then
    raise exception 'A document cannot supersede itself';
  end if;

  select family_id into v_old_family from public.documents where id = p_old_id;
  select family_id into v_new_family from public.documents where id = p_new_id;

  if v_old_family is null or v_new_family is null then
    raise exception 'Document not found';
  end if;
  -- Superseding across households would hide a policy from the family that owns it.
  if v_old_family is distinct from v_new_family then
    raise exception 'Both documents must belong to the same family';
  end if;

  if not (
    public.caller_is_privileged()
    or v_old_family in (select public.current_user_allowed_family_ids())
  ) then
    raise exception 'Not authorized for this family';
  end if;

  -- Refuse to build a cycle: if the new document is already superseded by the old
  -- one, pointing the old at the new would make both unreachable.
  if exists (select 1 from public.documents where id = p_new_id and superseded_by_id = p_old_id) then
    raise exception 'That would create a loop — the newer document is already marked as replaced by this one';
  end if;

  update public.documents set superseded_by_id = p_new_id where id = p_old_id;
end;
$$;

revoke execute on function public.supersede_document(uuid, uuid) from public;
grant  execute on function public.supersede_document(uuid, uuid) to authenticated, service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- PER-PROJECT SEED — NOT INCLUDED ABOVE, AND DELIBERATELY SO
--
-- platform_config carries a storage URL that differs per Supabase project and a
-- demo flag that must never be true on a live client. A shared migration cannot
-- set either correctly, so run this by hand once per instance:
--
--   insert into public.platform_config (id, storage_public_base, demo_mode)
--   values (true,
--           'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/brand/',
--           false)          -- true ONLY on the demo instance
--   on conflict (id) do update
--     set storage_public_base = excluded.storage_public_base,
--         demo_mode           = excluded.demo_mode,
--         updated_at          = now();
-- ═════════════════════════════════════════════════════════════════════════════
