-- Per-tenant document templates for the Resources tab.
--
-- WHY THIS EXISTS
--
-- The six fillable documents on the Resources tab shipped as base64-encoded PDFs
-- compiled into the frontend bundle (src/pcm*Template.js). Those PDFs are PCM's:
-- PCM letterhead images, and — far more seriously — PCM named in the legal body
-- text. The Client Services Agreement names "PCM Family Office" as the
-- contracting party sixteen times, including the defining clause
-- (`PCM Family Office ("PCM," "we," or "us")`) and the signature block. The ACH
-- authorization directs debits into "PCM Family Office's bank".
--
-- Because the templates were bundled rather than looked up, EVERY tenant served
-- them. A licensed firm generating a Client Services Agreement produced a
-- contract between their client and a different legal entity, and an ACH form
-- authorising debits to that entity's account. That is a legal and
-- funds-movement exposure, not a branding blemish, and no amount of logo
-- swapping fixes it — the prose has to change.
--
-- So templates become per-tenant data, stored in Storage and resolved at runtime
-- from the brand record, exactly like brand_profiles.logo_url already is.
--
-- THE DELIBERATE ABSENCE OF A FALLBACK
--
-- There is no cross-tenant default. If a firm has not supplied its own template,
-- the platform refuses to generate the document. Generating nothing is strictly
-- safer than generating another firm's contract, and a fallback is precisely the
-- mechanism that caused this. Absence must fail closed.

-- ── brand_profiles ──────────────────────────────────────────────────────────
-- Created in the demo project via the dashboard and never captured as a
-- migration, so PCM production has no branding tables at all — which is the
-- root cause of the drift above: there was nowhere for PCM to record that these
-- documents were PCM's. Created here if absent so one schema covers every
-- tenant. Nothing is inserted and nothing is activated, so a project that
-- currently brands itself through VITE_BRAND_* env vars is unaffected: the
-- frontend only reads this table when VITE_BRAND_RUNTIME=1.
create table if not exists public.brand_profiles (
  id                 uuid primary key default gen_random_uuid(),
  label              text        not null,
  is_active          boolean     not null default false,
  brand_name         text        not null,
  brand_short        text        not null,
  tagline            text        not null default '',
  contact_email      text        not null default '',
  email_domain       text        not null default '',
  logo_url           text,
  mark_url           text,
  color_primary      text        not null default '#092b49',
  color_primary_mid  text        not null default '#293d5c',
  color_accent       text        not null default '#ceb684',
  color_accent_light text        not null default '#dfc99a',
  color_bg           text        not null default '#f9f7f3',
  color_border       text        not null default '#d8cdb8',
  color_border_light text        not null default '#ede8de',
  color_text_soft    text        not null default '#5a6e84',
  color_text_mute    text        not null default '#8fa0b2',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.brand_profiles enable row level security;

-- At most one active profile. A second active row would make "the tenant's
-- identity" ambiguous, and the frontend's maybeSingle() would start erroring.
create unique index if not exists brand_profiles_one_active
  on public.brand_profiles ((true)) where is_active;

do $$ begin
  -- Anonymous-readable by design: the login screen must be branded before
  -- anyone has signed in.
  if not exists (select 1 from pg_policies
                 where tablename='brand_profiles' and policyname='brand_profiles_read') then
    create policy brand_profiles_read on public.brand_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies
                 where tablename='brand_profiles' and policyname='brand_profiles_admin_write') then
    create policy brand_profiles_admin_write on public.brand_profiles
      for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- ── brand_documents ────────────────────────────────────────────────────────
create table if not exists public.brand_documents (
  id                uuid primary key default gen_random_uuid(),

  -- NULL means "this project's default", for a tenant that does not use runtime
  -- brand switching (PCM production). A non-NULL value ties the template to one
  -- switchable skin, which is what the demo project needs so that pitching as
  -- Accurate Advisory does not surface TitanOS paperwork.
  brand_profile_id  uuid references public.brand_profiles(id) on delete cascade,

  doc_key           text        not null,
  storage_path      text        not null,
  original_filename text,
  byte_size         integer,

  -- The AcroForm field names actually present in the uploaded PDF, recorded at
  -- upload time. fillPdfTemplate() sets fields by name and silently skips any it
  -- cannot find, so a template with renamed fields generates a document that
  -- looks successful and is blank. Storing what was found lets the UI show the
  -- firm exactly which fields will not populate, and lets generation refuse
  -- rather than emit an empty contract.
  field_names       text[]      not null default '{}',
  missing_fields    text[]      not null default '{}',

  uploaded_by       uuid references auth.users(id) on delete set null,
  uploaded_at       timestamptz not null default now(),
  notes             text,

  constraint brand_documents_doc_key_chk check (doc_key in (
    'agreement','ach','checklist','wire','pfs','lifestyle','user_guide'))
);

-- One template per document per brand. Expressed as two partial indexes rather
-- than a single index over a coalesced sentinel uuid, so the constraint reads as
-- what it means and needs no magic value.
create unique index if not exists brand_documents_per_brand_uq
  on public.brand_documents (brand_profile_id, doc_key) where brand_profile_id is not null;
create unique index if not exists brand_documents_project_default_uq
  on public.brand_documents (doc_key) where brand_profile_id is null;

alter table public.brand_documents enable row level security;

do $$ begin
  -- Any signed-in user may read: generating a client document is ordinary
  -- Titan Expert work, not an admin action. Anonymous users get nothing — unlike
  -- the logo, a blank letterhead has no reason to be world-readable.
  if not exists (select 1 from pg_policies
                 where tablename='brand_documents' and policyname='brand_documents_read') then
    create policy brand_documents_read on public.brand_documents
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies
                 where tablename='brand_documents' and policyname='brand_documents_admin_write') then
    create policy brand_documents_admin_write on public.brand_documents
      for all to authenticated using (is_admin()) with check (is_admin());
  end if;
end $$;

-- ── Resolver ───────────────────────────────────────────────────────────────
-- Returns the template set for whichever brand is currently active, with the
-- project default standing in for any document the active brand has not
-- overridden. Precedence lives here rather than in the client so every caller
-- resolves it identically.
--
-- `order by (brand_profile_id is null)` sorts false before true, i.e. a
-- brand-specific row wins over the project default.
create or replace function public.active_brand_documents()
returns table (
  doc_key           text,
  storage_path      text,
  original_filename text,
  field_names       text[],
  missing_fields    text[],
  uploaded_at       timestamptz,
  is_project_default boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (d.doc_key)
         d.doc_key, d.storage_path, d.original_filename,
         d.field_names, d.missing_fields, d.uploaded_at,
         d.brand_profile_id is null
  from public.brand_documents d
  where d.brand_profile_id is null
     or d.brand_profile_id = (select p.id from public.brand_profiles p where p.is_active limit 1)
  order by d.doc_key, (d.brand_profile_id is null);
$$;

comment on function public.active_brand_documents() is
  'Document templates for the active brand, falling back to the project default. No cross-tenant fallback: a missing doc_key means the firm has not supplied that template and generation must be blocked.';

-- ── Storage ────────────────────────────────────────────────────────────────
-- Private, unlike the public logo bucket. A blank agreement is not a secret, but
-- wire-instruction letterhead is worth keeping off a guessable public URL, so
-- the frontend fetches these through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('brand-documents','brand-documents', false)
on conflict (id) do update set public = false;

do $$ begin
  if not exists (select 1 from pg_policies
                 where schemaname='storage' and tablename='objects'
                   and policyname='brand_documents_objects_read') then
    create policy brand_documents_objects_read on storage.objects
      for select to authenticated using (bucket_id = 'brand-documents');
  end if;
  if not exists (select 1 from pg_policies
                 where schemaname='storage' and tablename='objects'
                   and policyname='brand_documents_objects_admin_write') then
    create policy brand_documents_objects_admin_write on storage.objects
      for all to authenticated
      using (bucket_id = 'brand-documents' and is_admin())
      with check (bucket_id = 'brand-documents' and is_admin());
  end if;
end $$;
