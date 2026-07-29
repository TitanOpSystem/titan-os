-- Assembles the client activity report payload for one household and one period.
--
-- WHY IN SQL RATHER THAN IN THE EDGE FUNCTION
--
-- Every figure in this report is a claim about work performed, and the report is
-- read by a client. Gathering it here means one definition of each number, and it
-- runs under the caller's own permissions: security invoker plus the existing
-- family-scoped RLS means an Expert physically cannot assemble a report for a
-- household outside their book, even by passing someone else's family_id.
--
-- The renderer stays dumb on purpose. It receives facts and lays them out; it
-- never decides what counts as an obligation discharged.
--
-- HONESTY PROPERTIES ENFORCED HERE, NOT IN THE PROSE
--
-- * `approvals` counts steps a person approved. Automated steps are counted
--   separately as `automated_steps`. "Your adviser approved four items" must not
--   silently include work nobody looked at.
-- * A step is only `evidenced` if it produced a document or a sent message.
--   Everything else is reported as "recorded complete", because a ticked checkbox
--   is not proof and this document may end up in a fee conversation.
-- * Periods come from report_period(), so the heading cannot disagree with the
--   data underneath it.
-- * A figure that cannot be measured is returned as null, never as 0, with the
--   reason named in `data_gaps`. The report is allowed to say "we cannot evidence
--   this"; it is not allowed to say "this did not happen" when it does not know.
--
-- THREE CORRECTIONS MADE AFTER FIRST WRITING THIS, ALL THE SAME MISTAKE
--
-- Each of these placed a row in a period using a column that records when the ROW
-- WAS WRITTEN rather than when the WORK HAPPENED. The failure mode is identical
-- every time and silent every time: a plausible number, wrong.
--
-- 1. Steps were placed by coalesce(sent_at, approved_at). Both are null for a step
--    the platform performed itself, so automated work fell outside every period and
--    the report said "0 automated steps". Now completed_at first.
--
-- 2. Statements were placed by account_balances.created_at, the import timestamp.
--    All sixteen of the demo household's statements share one afternoon, so a
--    calendar-2025 report showed zero statements while four 2025 statements sat in
--    the table — and the figure moved whenever data was backfilled. Now as_of, the
--    quarter the statement covers, which is also what the sentence in the report
--    means.
--
-- 3. The provenance block used
--       max(balance) filter (where as_of = max(as_of) over (partition by a.id))
--    which Postgres rejects at plan time (42P20, window function in FILTER). The
--    whole function raised on every call regardless of data. Replaced with a
--    correlated subquery ordered by as_of — and note it takes the balance at the
--    LATEST as_of, not max(balance), which would report the high water mark and
--    overstate a portfolio that fell.

create or replace function public.client_activity_payload(
  p_family_id uuid,
  p_kind      text default 'trailing_12',
  p_anchor    date default current_date,
  p_from      date default null,
  p_to        date default null,
  p_tz        text default 'UTC'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  per          record;
  fam          record;
  exc          record;
  d_from       date;
  d_to         date;                    -- exclusive
  v_obligations jsonb;
  v_exposures   jsonb;
  v_provenance  jsonb;
  v_in_flight   jsonb;
  v_gaps        text[] := '{}';
  v_statements  int;
  v_stmt_total  int;
  v_approvals   int;
  v_automated   int;
  v_untimed     int;
  v_closed      int;
begin
  select * into per from report_period(p_kind, p_anchor, p_from, p_to, p_tz);

  -- Date-typed columns (as_of, due_on) are compared against these, so a statement
  -- dated 30 June is never pushed into July by a timezone conversion.
  d_from := (per.period_from at time zone p_tz)::date;
  d_to   := (per.period_to   at time zone p_tz)::date;

  -- RLS does the authorising. If the caller cannot see the household this returns
  -- no row, and the function refuses rather than emitting an empty report that
  -- looks like a household with nothing happening.
  select id, name into fam from families where id = p_family_id;
  if fam.id is null then
    raise exception 'No household visible with id % (it may not exist, or may be outside your book).', p_family_id;
  end if;

  select * into exc from client_exception_summary(p_family_id, per.period_from, per.period_to);

  -- ── Obligations completed within the period ──────────────────────────────
  select coalesce(jsonb_agg(o order by o->>'closed'), '[]'::jsonb) into v_obligations
  from (
    select jsonb_build_object(
             'cycle',  i.cycle_label,
             'closed', to_char(i.completed_at at time zone p_tz, 'FMDD FMMonth YYYY'),
             'due',    to_char(i.due_date, 'FMDD FMMonth YYYY'),
             'steps',  (select coalesce(jsonb_agg(jsonb_build_object(
                                 'title', s.title,
                                 'due',   to_char(s.due_on, 'FMDD Mon'),
                                 -- completed_at first: it is the only column that
                                 -- exists for a step no human touched.
                                 'done',  to_char(coalesce(s.completed_at, s.sent_at, s.approved_at) at time zone p_tz, 'FMDD Mon'),
                                 'note',  s.notes,
                                 -- Proof, not a tick. Drives the wording the
                                 -- renderer is allowed to use for this step.
                                 --
                                 -- sent_at counts as evidence alongside the two
                                 -- foreign keys. Requiring sent_message_id alone
                                 -- was too strict and understated the work: a step
                                 -- advanced to "sent" records an outbound send even
                                 -- where no message row was linked, and on the demo
                                 -- household that produced "0 of 9 steps evidenced"
                                 -- for a cycle that demonstrably sent a transfer
                                 -- request. Understating is a smaller sin than
                                 -- overstating but it is still a wrong number.
                                 'evidenced', (s.produced_document_id is not null
                                               or s.sent_message_id is not null
                                               or s.sent_at is not null)
                               ) order by s.seq), '[]'::jsonb)
                        from workflow_instance_steps s where s.instance_id = i.id),
             'step_count',   (select count(*) from workflow_instance_steps s where s.instance_id = i.id),
             'approvals',    (select count(*) from workflow_instance_steps s where s.instance_id = i.id and s.approved_by is not null),
             'sent',         (select count(*) from workflow_instance_steps s where s.instance_id = i.id and s.sent_at is not null)
           ) as o
    from workflow_instances i
    where i.family_id = p_family_id
      and i.status = 'completed'
      and i.completed_at >= per.period_from
      and i.completed_at <  per.period_to
  ) t;

  -- ── Exposures raised in the period ───────────────────────────────────────
  select coalesce(jsonb_agg(jsonb_build_object(
           'raised',  to_char(raised_at at time zone p_tz, 'FMDD Mon'),
           'title',   title,
           'source',  case when source = 'expert' then 'Adviser' else 'Platform' end,
           'severity', severity,
           'closed',  case when resolved_at is null then null
                           else to_char(resolved_at at time zone p_tz, 'FMDD Mon') end,
           'outcome', case when resolved_at is null then detail else resolution end
         ) order by raised_at), '[]'::jsonb) into v_exposures
  from client_exceptions
  where family_id = p_family_id and raised_at >= per.period_from and raised_at < per.period_to;

  -- ── Provenance: statements read, per account ─────────────────────────────
  -- `bal` is the account's closing position within the period: the balance
  -- attached to the latest as_of, not max(balance), which would report the high
  -- water mark and overstate a portfolio that fell.
  select coalesce(jsonb_agg(jsonb_build_object(
           'institution',  institution,
           'quarters',     quarters,
           'latest_as_of', to_char(latest, 'FMDD Mon YYYY'),
           'balance',      '$' || to_char(bal, 'FM999,999,999'),
           'sourced',      sourced
         ) order by bal desc), '[]'::jsonb) into v_provenance
  from (
    select a.institution,
           count(*)                     as quarters,
           count(b.source_document_id)  as sourced,
           max(b.as_of)                 as latest,
           (select b2.balance
              from account_balances b2
             where b2.account_id = a.id
               and b2.as_of >= d_from and b2.as_of < d_to
             order by b2.as_of desc, b2.created_at desc
             limit 1)                   as bal
    from portfolio_accounts a
    join account_balances b on b.account_id = a.id
    where a.family_id = p_family_id
      and b.as_of >= d_from and b.as_of < d_to
    group by a.id, a.institution
  ) q;

  -- Statements READ vs balances RECORDED. The report claims the first, so it must
  -- count the first, and it must know when the two disagree.
  select count(*) filter (where source_document_id is not null), count(*)
    into v_statements, v_stmt_total
  from account_balances
  where family_id = p_family_id and as_of >= d_from and as_of < d_to;

  if v_stmt_total > v_statements then
    v_gaps := v_gaps || format(
      '%s of %s balance updates in this period have no source statement attached, so they are excluded from the statements figure.',
      v_stmt_total - v_statements, v_stmt_total);
  end if;

  select count(*) filter (where s.approved_by is not null),
         count(*) filter (where s.approved_by is null)
    into v_approvals, v_automated
  from workflow_instance_steps s
  join workflow_instances i on i.id = s.instance_id
  where i.family_id = p_family_id
    and s.status = 'done'
    and coalesce(s.completed_at, s.sent_at, s.approved_at) >= per.period_from
    and coalesce(s.completed_at, s.sent_at, s.approved_at) <  per.period_to;

  -- Steps completed but carrying no completion time at all. These cannot be
  -- attributed to any period, so they are neither counted nor silently dropped.
  select count(*) into v_untimed
  from workflow_instance_steps s
  join workflow_instances i on i.id = s.instance_id
  where i.family_id = p_family_id
    and s.status = 'done'
    and coalesce(s.completed_at, s.sent_at, s.approved_at) is null;

  if v_untimed > 0 then
    v_gaps := v_gaps || format(
      '%s completed step%s carr%s no completion date and cannot be attributed to a reporting period, so %s not included in the figures above.',
      v_untimed, case when v_untimed = 1 then '' else 's' end,
      case when v_untimed = 1 then 'ies' else 'y' end,
      case when v_untimed = 1 then 'it is' else 'they are' end);

    -- The dangerous case: nothing measurable AND something unmeasured. Returning 0
    -- here would print "no automated work" over the top of work that happened.
    if v_automated = 0 then
      v_automated := null;
    end if;
  end if;

  -- ── Open at the close of the period ──────────────────────────────────────
  select coalesce(jsonb_agg(x order by x->>'sort'), '[]'::jsonb) into v_in_flight
  from (
    select jsonb_build_object('sort','1','text',
             title || ' — raised ' || to_char(raised_at at time zone p_tz,'FMDD Mon') ||
             case when severity='urgent' then ', urgent' else '' end || ', unresolved.') as x
    from client_exceptions
    where family_id = p_family_id and raised_at < per.period_to
      and (resolved_at is null or resolved_at >= per.period_to)
    union all
    select jsonb_build_object('sort','2','text',
             cycle_label || ' — due ' || to_char(due_date,'FMDD FMMonth') ||
             ', ' || (select count(*) from workflow_instance_steps s where s.instance_id=i.id and s.status='done')
             || ' of ' || (select count(*) from workflow_instance_steps s where s.instance_id=i.id)
             || ' steps complete' || case when status='at_risk' then ', flagged at risk.' else '.' end)
    from workflow_instances i
    where i.family_id = p_family_id and i.status in ('active','at_risk','blocked')
  ) y;

  select count(*) into v_closed
  from workflow_instances
  where family_id = p_family_id and status='completed'
    and completed_at >= per.period_from and completed_at < per.period_to;

  return jsonb_build_object(
    'period', jsonb_build_object(
       'kind', p_kind,
       'from', to_char(d_from, 'YYYY-MM-DD'),
       'to',   to_char(d_to,   'YYYY-MM-DD'),
       'tz',   p_tz,
       -- Included for cross-checking only. The renderer derives its own heading
       -- and should refuse if the two disagree.
       'label_from_db', per.label),
    'meta', jsonb_build_object('household', fam.name),
    'summary', jsonb_build_object(
       'obligations_closed', v_closed,
       'exposures_raised',   exc.raised_in_period,
       'exposures_closed',   exc.closed_in_period,
       'exposures_open',     exc.open_at_period_end,
       'approvals',          v_approvals,
       -- null, not 0, when the underlying rows carry no completion date. The
       -- renderer must print a sentence for null and must never coerce it.
       'automated_steps',    v_automated,
       'statements',         v_statements),
    'obligations', v_obligations,
    'exposures',   v_exposures,
    'provenance',  v_provenance,
    'in_flight',   v_in_flight,
    -- Named, printable reasons a figure is absent or lower than expected. Empty
    -- array is the normal case; the renderer prints nothing for it.
    'data_gaps',   to_jsonb(v_gaps)
  );
end;
$$;

comment on function public.client_activity_payload(uuid, text, date, date, date, text) is
  'Everything the client activity report needs for one household and one period, as JSON. security invoker so family-scoped RLS decides what the caller may assemble. Statements are placed in a period by the quarter they cover (as_of), not by when the row was written. Counts human approvals separately from automated steps; marks a step evidenced only when it produced a document or a sent message; returns a figure as null rather than 0 when the underlying rows cannot be placed in the period, with the reason in data_gaps.';
