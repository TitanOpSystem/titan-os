-- Reporting is for signed-in users. Remove the anonymous grant.
--
-- Postgres grants EXECUTE to PUBLIC on every new function, so `anon` — the role
-- PostgREST uses for unauthenticated requests — could call these. It was fail-safe
-- rather than a leak: all three are security invoker, so an anonymous caller runs
-- under anon's own RLS, sees no households, and client_activity_payload raises. The
-- message is also deliberately identical whether the household exists or is merely
-- outside the caller's book, so it cannot be used to enumerate families.
--
-- Fail-safe is not the same as unreachable, and there is no reason for an
-- unauthenticated request to reach a function whose entire purpose is assembling a
-- client's private activity. Least privilege: revoke, then grant only the roles
-- that should have it.
--
-- This must be re-run after any CREATE OR REPLACE of these functions. Replacing a
-- function does not reset its ACL, but creating one that had been dropped does, and
-- the default is PUBLIC — so the check at the bottom exists to catch a future
-- migration that silently reopens the grant.

revoke execute on function public.client_activity_payload(uuid, text, date, date, date, text) from public, anon;
revoke execute on function public.client_exception_summary(uuid, timestamptz, timestamptz)     from public, anon;
revoke execute on function public.report_period(text, date, date, date, text)                  from public, anon;

grant execute on function public.client_activity_payload(uuid, text, date, date, date, text) to authenticated, service_role;
grant execute on function public.client_exception_summary(uuid, timestamptz, timestamptz)     to authenticated, service_role;
grant execute on function public.report_period(text, date, date, date, text)                  to authenticated, service_role;

do $$
declare bad text;
begin
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('client_activity_payload','client_exception_summary','report_period')
     and (has_function_privilege('anon', p.oid, 'EXECUTE')
          or not has_function_privilege('authenticated', p.oid, 'EXECUTE'));
  if bad is not null then
    raise exception 'Grants are wrong after this migration for: %', bad;
  end if;
end $$;
