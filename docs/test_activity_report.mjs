// Tests for the client activity report renderer.
//
// This document goes to a client and may end up supporting a fee conversation, so
// the things asserted here are the things that would be embarrassing to get wrong
// in front of one: a heading that disagrees with its own dates, an unmeasurable
// figure printed as zero, a name that crashes the renderer, a period kind accepted
// when the boundaries don't match it.
//
// Run:  node docs/test_activity_report.mjs
// Optionally writes a PDF for eyeballing:  node docs/test_activity_report.mjs out.pdf

import { readFileSync, writeFileSync } from "node:fs";
import { buildActivityReportPdf, periodLabel, winAnsi, fig } from "../src/activityReport.js";

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? " — " + detail : ""}`); }
};
const throws = async (name, fn, match) => {
  try { await fn(); fail++; console.log(`  FAIL ${name} — expected a throw, got none`); }
  catch (e) {
    if (match && !String(e.message).includes(match)) {
      fail++; console.log(`  FAIL ${name} — message lacked "${match}": ${e.message}`);
    } else { pass++; console.log(`  ok   ${name}`); }
  }
};

const payload = JSON.parse(readFileSync(new URL("./samples/activity-report-payload.json", import.meta.url)));
const BRAND = {
  brandName: "Accurate Advisory Group", tagline: "Guidance for a lifetime",
  primaryHex: "#253978", accentHex: "#b6c1de", logoUrl: null,
};

console.log("\nperiodLabel — derived, and validating the shape it was given");
ok("trailing_12", periodLabel("trailing_12", "2025-07-01", "2026-07-01") === "Twelve months to 30 June 2026");
ok("whole month", periodLabel("month", "2025-09-01", "2025-10-01") === "September 2025");
ok("month across a year boundary", periodLabel("month", "2025-12-01", "2026-01-01") === "December 2025");
ok("quarter", periodLabel("quarter", "2026-04-01", "2026-07-01") === "Q2 2026");
ok("year", periodLabel("year", "2025-01-01", "2026-01-01") === "Calendar year 2025");
ok("custom", periodLabel("custom", "2025-03-05", "2025-06-11") === "5 March 2025 to 10 June 2025");
// The whole reason the label is derived rather than passed in.
await throws("a 'month' that is not a whole month is refused",
  () => periodLabel("month", "2025-09-03", "2025-10-03"), "not a whole calendar month");
await throws("a 'quarter' not starting a quarter is refused",
  () => periodLabel("quarter", "2026-02-01", "2026-05-01"), "does not start a calendar quarter");
await throws("a 'year' not starting a year is refused",
  () => periodLabel("year", "2025-02-01", "2026-02-01"), "does not start a calendar year");
await throws("an inverted range is refused",
  () => periodLabel("custom", "2026-01-01", "2025-01-01"), "must end after it starts");
await throws("a zero-length range is refused",
  () => periodLabel("custom", "2026-01-01", "2026-01-01"), "must end after it starts");
await throws("an unknown kind is refused rather than guessed",
  () => periodLabel("fortnight", "2026-01-01", "2026-02-01"), "Unknown period kind");

console.log("\nfig — null is never zero");
ok("null prints as an em dash", fig(null) === "—");
ok("undefined prints as an em dash", fig(undefined) === "—");
ok("a real zero still prints as zero", fig(0) === "0");
ok("a count prints as itself", fig(5) === "5");

console.log("\nwinAnsi — arbitrary client data cannot crash the renderer");
ok("smart quotes become straight", winAnsi("‘a’ “b”") === "'a' \"b\"");
ok("an em dash survives", winAnsi("a — b") === "a — b");
ok("a middot survives", winAnsi("a · b") === "a · b");
ok("a non-breaking space becomes a space", winAnsi("a b") === "a b");
ok("a zero-width space is dropped", winAnsi("a​b") === "ab");
ok("an emoji degrades rather than throwing", winAnsi("Smith \u{1F600}") === "Smith ?");
ok("Cyrillic degrades rather than throwing", winAnsi("Дмитрий") === "???????");
ok("accented Latin-1 is preserved", winAnsi("Müller Öberg Ávila") === "Müller Öberg Ávila");
ok("null becomes empty", winAnsi(null) === "");

console.log("\nbuildActivityReportPdf — the whole document");
const bytes = await buildActivityReportPdf({ payload, ...BRAND });
ok("returns PDF bytes", bytes instanceof Uint8Array && bytes.length > 3000, `len=${bytes?.length}`);
ok("starts with the PDF magic number", new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-");

// The heading and the data must agree, and a caller cannot make them disagree.
await throws("refuses to render when the DB label contradicts the dates", () =>
  buildActivityReportPdf({
    ...BRAND,
    payload: { ...payload, period: { ...payload.period, label_from_db: "Q2 2026" } },
  }), "described two different ways");

// A household with nothing recorded must still produce a valid, honest document
// rather than an exception or a page of zeroes presented as achievement.
const empty = {
  meta: { household: "Nothing Recorded Yet" },
  period: { kind: "quarter", from: "2026-01-01", to: "2026-04-01", tz: "UTC", label_from_db: "Q1 2026" },
  summary: {
    obligations_closed: 0, exposures_raised: 0, exposures_closed: 0, exposures_open: 0,
    approvals: 0, automated_steps: null, statements: 0,
  },
  obligations: [], exposures: [], provenance: [], in_flight: [],
  data_gaps: ["1 completed step carries no completion date and cannot be attributed to a reporting period, so it is not included in the figures above."],
};
const emptyBytes = await buildActivityReportPdf({ payload: empty, ...BRAND });
ok("an empty household still renders", emptyBytes.length > 2000, `len=${emptyBytes.length}`);

// Long, hostile content: does the table wrap and paginate rather than overflow?
const long = JSON.parse(JSON.stringify(payload));
long.obligations[0].steps = Array.from({ length: 40 }, (_, i) => ({
  title: `Step ${i + 1} with a deliberately long title that has to wrap across more than one line`,
  due: "1 Sep", done: "1 Sep", evidenced: i % 3 === 0,
  note: "A long record note, also designed to wrap, so the row height is driven by the tallest cell rather than the first column. " + "Padding. ".repeat(6),
}));
long.obligations[0].step_count = 40;
const longBytes = await buildActivityReportPdf({ payload: long, ...BRAND });
ok("40 wrapping rows paginate instead of overflowing", longBytes.length > bytes.length,
  `long=${longBytes.length} base=${bytes.length}`);

// Two obligations must both be labelled, or the reader cannot tell which steps
// belong to which cycle.
const two = JSON.parse(JSON.stringify(payload));
two.obligations.push(JSON.parse(JSON.stringify(payload.obligations[0])));
two.obligations[1].cycle = "2025 Capital call — Meridian Growth III";
two.summary.obligations_closed = 2;
ok("two obligations render", (await buildActivityReportPdf({ payload: two, ...BRAND })).length > 3000);

const out = process.argv[2];
if (out) { writeFileSync(out, bytes); console.log(`\nwrote ${out}`); }
if (process.argv[3]) { writeFileSync(process.argv[3], longBytes); console.log(`wrote ${process.argv[3]}`); }

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
