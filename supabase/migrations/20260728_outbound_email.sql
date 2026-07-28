-- ─────────────────────────────────────────────────────────────────────────────
-- OUTBOUND EMAIL: sending workflow correspondence from the platform
--
-- Applied to: PCM production (2026-07-28), titanos-demo (2026-07-28)
-- At provisioning: run this, then set the tenant's sending domain and verify it
-- with the email provider. A tenant with no verified domain cannot send —
-- deliberately, rather than borrowing another firm's identity.
--
-- WHO THE MAIL COMES FROM
-- Correspondence goes out as the responsible Titan Expert, from their own address,
-- because the recipient is a banker or trustee who knows that person by name. What
-- varies per tenant is the DOMAIN: PCM's Experts send on pcmfamilyoffice.com, the
-- next RIA's send on theirs. Providers verify a domain, not individual mailboxes,
-- so one verified domain per tenant covers every Expert on it.
--
-- This is therefore tenant configuration and belongs in onboarding: a new firm
-- verifies its domain before workflow mail can leave. It lives in the database
-- rather than an env var so it is editable from the Branding screen without a
-- redeploy.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.outbound_email_settings (
  -- Single row per tenant database. The check pins the primary key so a second
  -- row cannot be inserted and quietly compete to be "the" sender.
  id boolean primary key default true check (id),

  -- The verified domain, e.g. 'pcmfamilyoffice.com'. Every sending address must
  -- sit on it, or the provider rejects the message and a bank instruction
  -- silently fails to arrive.
  sending_domain text,

  -- 'advisor'  — send as the family's own Titan Expert (the default, and what
  --              recipients expect)
  -- 'fixed'    — send everything from one address, for a firm that prefers a
  --              central outbound mailbox
  from_mode text not null default 'advisor'
    check (from_mode in ('advisor','fixed')),

  -- Used when from_mode='fixed', and as the fallback when an Expert's own address
  -- is not on the verified domain.
  fixed_from_email text,

  -- Appended after the person's name so the firm is visible in the From line:
  --   "Antonio Ocasio · PCM Family Office <AOcasio@pcmfamilyoffice.com>"
  from_org_label text,

  -- Set only once the domain is verified with the provider. Sending is refused
  -- while false.
  sender_verified boolean not null default false,

  -- Belt and braces against a bug becoming a mass mailing.
  max_recipients_per_send integer not null default 10,

  notes text,
  updated_at timestamptz not null default now(),
  updated_by text
);

comment on table public.outbound_email_settings is
  'This tenant''s outbound sending identity. Mail goes out as the responsible Titan '
  'Expert on this tenant''s verified domain. Part of branding, and a required step '
  'in onboarding a new firm.';
comment on column public.outbound_email_settings.sending_domain is
  'Verified sending domain for this tenant. An Expert address off this domain is '
  'refused rather than sent unverified.';

alter table public.outbound_email_settings enable row level security;

-- Any signed-in staff member may read it (the review screen shows who mail will
-- come from). Only admins may change it, because it determines the firm's identity
-- as recipients see it.
drop policy if exists staff_read on public.outbound_email_settings;
drop policy if exists admin_write on public.outbound_email_settings;
create policy staff_read on public.outbound_email_settings for select
  using (public.current_user_role() in ('admin','advisor','partner'));
create policy admin_write on public.outbound_email_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed the row so the Branding screen has something to edit. Unverified, so
-- nothing can send until a human completes it.
insert into public.outbound_email_settings (id) values (true)
on conflict (id) do nothing;

-- ── Send outcome, recorded per step ──────────────────────────────────────────
-- Sending can fail, and a failure must not look like a success.
alter table public.workflow_instance_steps
  add column if not exists sent_message_id text,
  add column if not exists send_error text,
  add column if not exists send_attempts integer not null default 0,
  add column if not exists sent_from text,
  -- What was actually on the envelope, snapshotted at send time. draft_to and
  -- draft_cc stay editable afterwards; this does not.
  add column if not exists sent_recipients text,
  -- True when a recipient was not among the family's known contacts and the
  -- reviewer sent anyway. Keeps the override accountable instead of invisible.
  add column if not exists recipients_unverified boolean not null default false;

comment on column public.workflow_instance_steps.sent_message_id is
  'Provider message id. Present only if the provider accepted the message, so this '
  'is the evidence that "sent" means sent.';
comment on column public.workflow_instance_steps.send_error is
  'Why the last send attempt failed. The step stays approved, not sent, when set.';
comment on column public.workflow_instance_steps.recipients_unverified is
  'The reviewer sent to an address not on file for this family. Recorded because a '
  'draft recipient is partly derived from uploaded document text.';

-- ── Known-good recipients for a family ───────────────────────────────────────
-- A draft's recipient is written by the model from facts that include extracted
-- document text, which is untrusted input. This answers "is this an address the
-- firm already knows for this client?", so one that appeared out of nowhere is
-- flagged to the reviewer before anything leaves.
create or replace function public.family_known_emails(p_family_id uuid)
returns table(email text, source text, label text)
language sql stable security invoker as $$
  select lower(trim(c.email)), 'member', c.name
    from public.contacts c
   where c.family_id = p_family_id and coalesce(c.email,'') <> ''
  union
  select lower(trim(fc.email)), 'professional contact', fc.name
    from public.family_contacts fc
   where fc.family_id = p_family_id and coalesce(fc.email,'') <> ''
  union
  select lower(trim(pc.email)), 'property vendor', pc.name
    from public.property_contacts pc
    join public.properties p on p.id = pc.property_id
   where p.family_id = p_family_id and coalesce(pc.email,'') <> ''
  union
  select lower(trim(f.advisor_email)), 'primary Titan Expert', f.advisor_name
    from public.families f
   where f.id = p_family_id and coalesce(f.advisor_email,'') <> '';
$$;

comment on function public.family_known_emails(uuid) is
  'Addresses already on file for a family. Used to flag a draft recipient the firm '
  'has no record of, since draft recipients derive partly from document text.';
