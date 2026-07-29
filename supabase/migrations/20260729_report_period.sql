-- One definition of what a reporting period is.
--
-- WHY THIS IS A FUNCTION AND NOT ARITHMETIC AT EACH CALL SITE
--
-- A report has at least three consumers of its period: the query that counts
-- exceptions, the queries that gather obligations and balances, and the heading
-- printed on the document. If any of them computes the boundaries independently
-- they will eventually disagree, and the failure is invisible — a document titled
-- "Q2" containing five weeks of data looks perfectly fine.
--
-- THREE DECISIONS BAKED IN
--
-- 1. Intervals are half-open: [period_from, period_to). An event at 23:59:59 on
--    the last day belongs to the period; the first instant of the next period does
--    not. Inclusive-end arithmetic is where double-counted rows come from.
--
-- 2. Boundaries are computed in the FIRM'S timezone, not UTC. A month is a
--    calendar idea, and a monthly report run from Florida must not place an event
--    logged at 8pm on 31 July into August. This is the same class of error as
--    rendering a stored date in the browser's zone and showing the previous day,
--    which is a bug this codebase has already had once.
--
-- 3. The label is returned alongside the boundaries, so nothing has to describe
--    the period in prose separately from the dates it actually used.

create or replace function public.report_period(
  p_kind text,                                  -- month | quarter | year | trailing_12 | custom
  p_anchor date default current_date,           -- the day the period is derived from
  p_from date default null,                     -- custom only
  p_to date default null,                       -- custom only, exclusive
  p_tz text default 'UTC'
)
returns table (
  period_from timestamptz,
  period_to   timestamptz,           -- exclusive
  label       text,
  display_end date                   -- the last day INSIDE the period, for prose
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  d_from date;
  d_to   date;                        -- exclusive
begin
  if p_kind not in ('month','quarter','year','trailing_12','custom') then
    raise exception 'Unknown reporting period kind: %. Expected month, quarter, year, trailing_12 or custom.', p_kind;
  end if;

  if p_kind = 'custom' then
    if p_from is null or p_to is null then
      raise exception 'A custom period needs both a start and an end.';
    end if;
    if p_to <= p_from then
      raise exception 'A custom period must end after it starts (got % to %).', p_from, p_to;
    end if;
    -- Guard against a fat-fingered year producing a decade of "activity".
    if p_to - p_from > 1830 then
      raise exception 'A custom period longer than five years is almost certainly a mistake (got % days).', p_to - p_from;
    end if;
    d_from := p_from;
    d_to   := p_to;
  elsif p_kind = 'month' then
    d_from := date_trunc('month', p_anchor)::date;
    d_to   := (date_trunc('month', p_anchor) + interval '1 month')::date;
  elsif p_kind = 'quarter' then
    d_from := date_trunc('quarter', p_anchor)::date;
    d_to   := (date_trunc('quarter', p_anchor) + interval '3 months')::date;
  elsif p_kind = 'year' then
    d_from := date_trunc('year', p_anchor)::date;
    d_to   := (date_trunc('year', p_anchor) + interval '1 year')::date;
  else  -- trailing_12: the twelve months ending on the anchor, anchor included
    d_from := (p_anchor - interval '1 year' + interval '1 day')::date;
    d_to   := (p_anchor + interval '1 day')::date;
  end if;

  period_from  := (d_from::timestamp) at time zone p_tz;
  period_to    := (d_to::timestamp)   at time zone p_tz;
  display_end  := d_to - 1;

  label := case p_kind
    when 'month'   then to_char(d_from, 'FMMonth YYYY')
    when 'quarter' then 'Q' || to_char(d_from, 'Q YYYY')
    when 'year'    then 'Calendar year ' || to_char(d_from, 'YYYY')
    when 'trailing_12' then 'Twelve months to ' || to_char(display_end, 'FMDD FMMonth YYYY')
    else to_char(d_from, 'FMDD FMMonth YYYY') || ' to ' || to_char(display_end, 'FMDD FMMonth YYYY')
  end;

  return next;
end;
$$;

comment on function public.report_period(text, date, date, date, text) is
  'Resolves a reporting period to a half-open [from, to) range in the firm''s timezone, with the label that describes it. Every consumer of a report period must use this so the heading cannot disagree with the data underneath it.';
