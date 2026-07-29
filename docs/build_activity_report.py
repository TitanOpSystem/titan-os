#!/usr/bin/env python3
"""Client activity report — what was done for a household over a period.

WHAT THIS IS FOR
----------------
A document a household reads and, if it lands, stops asking what the fee is for.
That makes it a claim about work performed, so it is built to only ever assert
what there is a record of.

STRUCTURE, AND WHY IN THIS ORDER
--------------------------------
1. Obligations discharged — the strongest material, because it has sequence and
   dates. "Notices issued 26 September, window closed 27 October, trustee
   authorised 3 November" is diligence a client's attorney recognises on sight.
2. Exposures raised and closed — the section that justifies a fee. Risk avoided,
   not work completed.
3. Numbers behind the reporting — provenance. Every balance with its as-of date
   and the statement it came from.
4. Still in flight — open items, stated plainly. A report showing only wins reads
   as marketing; showing what is open is what makes the rest believable.

The obvious version of this document is a count sheet — "142 documents filed, 38
tasks completed" — which reads as busywork and invites "I am paying you to upload
files?". Counts appear here only as supporting detail under a claim.

HONESTY RULES, ENFORCED IN CODE
-------------------------------
- Steps that produced a document or a sent message are described as done. Steps
  merely ticked are counted separately and labelled "recorded complete".
- Human approvals are counted apart from automated steps. "Your adviser approved
  four items" is both stronger and truer than a blended total.
- The scope note is not optional and cannot be switched off. A client must not
  mistake this for a complete account of the relationship — phone calls, meetings
  and anything done outside the platform are not in here.

BRANDING
--------
Colours, name, tagline and logo come from the tenant's brand. A light accent is
never used for text: Accurate's #b6c1de measures about 1.6:1 on white and would be
unreadable on a projector — the same trap the pitch deck's gold fell into. The
accent fills rules and panels; text uses the primary or a derived dark tone.

Usage:
  python3 docs/build_activity_report.py out.pdf --data payload.json
"""

import argparse
import json
import os
from datetime import date, datetime, timedelta

from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

W, H = letter
MARGIN = 54.0
CONTENT = W - MARGIN * 2

BODY_F, BODY_S, LEAD = "Helvetica", 9.2, 12.0
HEAD_F = "Times-Bold"


def mix(hex_colour, other, t):
    """Blend two hex colours. Used to derive a readable tone from a light accent
    rather than refusing to use the brand's second colour at all."""
    a = hex_colour.lstrip("#")
    b = other.lstrip("#")
    ch = lambda s, i: int(s[i:i + 2], 16)
    return HexColor("#%02x%02x%02x" % tuple(
        round(ch(a, i) * (1 - t) + ch(b, i) * t) for i in (0, 2, 4)))


def period_label(kind, d_from, d_to):
    """The heading, computed from the boundaries the data was actually gathered on.

    Mirrors report_period() in SQL. The label is DERIVED rather than passed in:
    a caller that supplies both a range and a description can make them disagree,
    and nothing on the page would reveal it. Monthly / quarterly / annual / custom
    all resolve here, and an unrecognised kind is an error rather than a guess.

    d_to is exclusive, matching the SQL. display_end is the last day inside.
    """
    f = date.fromisoformat(d_from)
    t = date.fromisoformat(d_to)
    if t <= f:
        raise ValueError(f"Reporting period must end after it starts (got {d_from} to {d_to}).")
    end = t - timedelta(days=1)
    months = ["January","February","March","April","May","June",
              "July","August","September","October","November","December"]
    long = lambda d: f"{d.day} {months[d.month - 1]} {d.year}"

    if kind == "month":
        if not (f.day == 1 and t.day == 1 and (t.month - f.month) % 12 == 1):
            raise ValueError(f"'month' period is not a whole calendar month: {d_from} to {d_to}.")
        return f"{months[f.month - 1]} {f.year}"
    if kind == "quarter":
        if not (f.day == 1 and f.month in (1, 4, 7, 10)):
            raise ValueError(f"'quarter' period does not start a calendar quarter: {d_from}.")
        return f"Q{(f.month - 1) // 3 + 1} {f.year}"
    if kind == "year":
        if not (f.month == 1 and f.day == 1):
            raise ValueError(f"'year' period does not start a calendar year: {d_from}.")
        return f"Calendar year {f.year}"
    if kind == "trailing_12":
        return f"Twelve months to {long(end)}"
    if kind == "custom":
        return f"{long(f)} to {long(end)}"
    raise ValueError(f"Unknown period kind {kind!r}. Expected month, quarter, year, trailing_12 or custom.")


class Report:
    def __init__(self, path, brand, meta):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.brand = brand
        self.meta = meta
        self.PRIMARY = HexColor(brand["primary"])
        self.ACCENT = HexColor(brand["accent"])
        # A label tone dark enough to read on white, derived from the accent so it
        # still belongs to the brand.
        self.LABEL = mix(brand["accent"], "#111111", 0.55)
        self.BODY = HexColor("#23272E")
        self.SOFT = HexColor("#6A7280")
        self.PANEL = mix(brand["accent"], "#ffffff", 0.72)
        self.c.setTitle(f"{brand['name']} — Client Activity Report")
        self.page = 1
        self.y = 0.0

    # ── primitives ──────────────────────────────────────────────────────────
    def footer(self):
        c = self.c
        c.setStrokeColor(self.ACCENT)
        c.setLineWidth(0.9)
        c.line(MARGIN, 52, W - MARGIN, 52)
        c.setFont("Helvetica", 7.4)
        c.setFillColor(self.SOFT)
        c.drawString(MARGIN, 40, f"{self.brand['name']} — Client Activity Report — {self.meta['household']}")
        c.drawRightString(W - MARGIN, 40, f"Page {self.page}")

    def new_page(self):
        self.footer()
        self.c.showPage()
        self.page += 1
        self.y = H - 64

    def room(self, need):
        if self.y - need < 76:
            self.new_page()

    def wrap(self, text, font=BODY_F, size=BODY_S, width=CONTENT):
        out, line = [], ""
        for w in str(text).split():
            trial = (line + " " + w).strip()
            if stringWidth(trial, font, size) <= width:
                line = trial
            else:
                out.append(line)
                line = w
        if line:
            out.append(line)
        return out

    def para(self, text, after=8, size=BODY_S, colour=None, font=BODY_F, indent=0.0, italic=False):
        f = "Helvetica-Oblique" if italic else font
        lines = self.wrap(text, f, size, CONTENT - indent)
        self.room(len(lines) * LEAD + after)
        self.c.setFont(f, size)
        self.c.setFillColor(colour or self.BODY)
        for ln in lines:
            self.c.drawString(MARGIN + indent, self.y, ln)
            self.y -= LEAD
        self.y -= after

    def section(self, number, title, claim, needs=0):
        """A numbered section led by its claim, not by a count.

        `needs` is the height of whatever follows. Without it the heading and its
        claim landed at the foot of a page with the table overleaf — a section
        introducing content that is not there. The agreement generator had the
        identical bug; these two do not share layout code, so it had to be fixed
        twice. Worth extracting if a third generator appears.
        """
        self.room(74 + needs)
        self.y -= 6
        self.c.setFont("Helvetica-Bold", 8)
        self.c.setFillColor(self.LABEL)
        self.c.drawString(MARGIN, self.y, f"{number}")
        self.c.setFont(HEAD_F, 15)
        self.c.setFillColor(self.PRIMARY)
        self.c.drawString(MARGIN + 20, self.y - 1, title)
        self.y -= 16
        self.c.setStrokeColor(self.ACCENT)
        self.c.setLineWidth(1.6)
        self.c.line(MARGIN, self.y, W - MARGIN, self.y)
        self.y -= 16
        if claim:
            self.para(claim, size=11, colour=self.PRIMARY, after=10)

    def stat_band(self, items):
        """Big figures, evenly spaced. The only place counts lead.

        A value of None means the platform could not measure it, and it prints as
        an em dash rather than as a number. client_activity_payload() deliberately
        returns null instead of 0 when the underlying rows cannot be placed in the
        reporting period, and coercing that to "0" here would undo the whole point:
        on a client-facing document, 0 reads as "this did not happen" rather than
        "we cannot evidence this". Nothing in this method may fall back to zero.
        """
        self.room(62)
        gap = 12
        w = (CONTENT - gap * (len(items) - 1)) / len(items)
        for i, (value, label) in enumerate(items):
            x = MARGIN + i * (w + gap)
            self.c.setFillColor(self.PANEL)
            self.c.rect(x, self.y - 46, w, 46, stroke=0, fill=1)
            self.c.setFont(HEAD_F, 21)
            self.c.setFillColor(self.PRIMARY)
            self.c.drawString(x + 11, self.y - 24, "—" if value is None else str(value))
            self.c.setFont("Helvetica", 7.4)
            self.c.setFillColor(self.LABEL)
            for j, ln in enumerate(self.wrap(label, "Helvetica", 7.4, w - 22)[:2]):
                self.c.drawString(x + 11, self.y - 35 - j * 8.4, ln)
        self.y -= 62

    @staticmethod
    def table_height(rows):
        return 30 + len(rows) * 16

    def table(self, cols, rows, widths):
        self.room(30 + len(rows) * 15)
        c = self.c
        c.setFillColor(self.PRIMARY)
        c.rect(MARGIN, self.y - 15, CONTENT, 15, stroke=0, fill=1)
        c.setFont("Helvetica-Bold", 7.6)
        c.setFillColor(HexColor("#FFFFFF"))
        x = MARGIN
        for head, wd in zip(cols, widths):
            c.drawString(x + 6, self.y - 10.5, head.upper())
            x += wd
        self.y -= 15
        for n, row in enumerate(rows):
            tall = max(len(self.wrap(str(cell), BODY_F, 8.4, wd - 12)) for cell, wd in zip(row, widths))
            hgt = tall * 10.6 + 6
            if self.y - hgt < 76:
                self.new_page()
            if n % 2 == 0:
                c.setFillColor(mix(self.brand["accent"], "#ffffff", 0.88))
                c.rect(MARGIN, self.y - hgt, CONTENT, hgt, stroke=0, fill=1)
            x = MARGIN
            for cell, wd in zip(row, widths):
                c.setFont(BODY_F, 8.4)
                c.setFillColor(self.BODY)
                for j, ln in enumerate(self.wrap(str(cell), BODY_F, 8.4, wd - 12)):
                    c.drawString(x + 6, self.y - 11 - j * 10.6, ln)
                x += wd
            self.y -= hgt
        self.y -= 12


def build(out, payload):
    brand, meta = payload["brand"], payload["meta"]

    per = payload["period"]
    meta["period"] = period_label(per["kind"], per["from"], per["to"])
    # The scope note must name the same boundaries the heading does.
    f = date.fromisoformat(per["from"])
    e = date.fromisoformat(per["to"]) - timedelta(days=1)
    months = ["January","February","March","April","May","June",
              "July","August","September","October","November","December"]
    span = f"{f.day} {months[f.month-1]} {f.year} and {e.day} {months[e.month-1]} {e.year}"
    meta["scope_note"] = meta["scope_note_template"].replace("{span}", span)
    r = Report(out, brand, meta)
    c = r.c

    # ── Masthead ────────────────────────────────────────────────────────────
    y = H - 54
    logo = brand.get("logo")
    if logo and os.path.exists(logo):
        from reportlab.lib.utils import ImageReader
        iw, ih = ImageReader(logo).getSize()
        lw = 104.0
        lh = lw * (ih / iw)
        c.drawImage(logo, MARGIN, y - lh, width=lw, height=lh, mask="auto")
        y -= lh + 18
    c.setFont(HEAD_F, 22)
    c.setFillColor(r.PRIMARY)
    c.drawString(MARGIN, y, "Client Activity Report")
    y -= 16
    c.setFont("Helvetica", 10.5)
    c.setFillColor(r.SOFT)
    c.drawString(MARGIN, y, f"{meta['household']}   ·   {meta['period']}")
    y -= 12
    c.setStrokeColor(r.ACCENT)
    c.setLineWidth(2)
    c.line(MARGIN, y, W - MARGIN, y)
    r.y = y - 26

    r.para(meta["opening"], size=10.4, after=14)

    s = payload["summary"]
    r.stat_band([
        (s["obligations_closed"], "obligations discharged"),
        (s["exposures_raised"], "exposures raised"),
        (s["exposures_closed"], "exposures closed"),
        (s["approvals"], "items approved by your adviser"),
        (s["statements"], "statements read and reconciled"),
    ])

    # ── 1. Obligations discharged ───────────────────────────────────────────
    o = payload["obligation"]
    r.section("01", "Obligations discharged", o["claim"], needs=Report.table_height(o["steps"][:4]))
    r.table(
        ["Step", "Due", "Completed", "Record"],
        [[st["title"], st["due"], st["done"], st["note"]] for st in o["steps"]],
        [188, 58, 66, CONTENT - 312],
    )
    r.para(o["footnote"], size=8.4, colour=r.SOFT, italic=True, after=14)

    # ── 2. Exposures ────────────────────────────────────────────────────────
    e = payload["exposures"]
    r.section("02", "Exposures raised, and what happened to them", e["claim"], needs=Report.table_height(e["items"][:3]))
    r.table(
        ["Raised", "What was noticed", "Noticed by", "Outcome"],
        [[x["raised"], x["title"], x["source"], x["outcome"]] for x in e["items"]],
        [52, 214, 66, CONTENT - 332],
    )

    # ── 3. Provenance ───────────────────────────────────────────────────────
    p = payload["provenance"]
    r.section("03", "The numbers behind your reporting", p["claim"], needs=Report.table_height(p["accounts"]))
    r.table(
        ["Account", "Quarters on file", "Most recent", "Balance", "Source"],
        [[a["institution"], a["quarters"], a["latest_as_of"], a["balance"], a["source"]] for a in p["accounts"]],
        [144, 96, 76, 84, CONTENT - 400],
    )

    # ── 4. In flight ────────────────────────────────────────────────────────
    fl = payload["in_flight"]
    r.section("04", "Still in flight", fl["claim"], needs=len(fl["items"]) * 14 + 90)
    for item in fl["items"]:
        r.para(f"•  {item}", size=9.2, after=4, indent=4)
    r.y -= 10

    # ── Scope note — deliberately not optional ──────────────────────────────
    r.room(86)
    c.setFillColor(r.PANEL)
    c.rect(MARGIN, r.y - 68, CONTENT, 68, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 7.4)
    c.setFillColor(r.LABEL)
    c.drawString(MARGIN + 12, r.y - 16, "WHAT THIS REPORT COVERS")
    c.setFont("Helvetica", 8.2)
    c.setFillColor(r.BODY)
    for i, ln in enumerate(r.wrap(meta["scope_note"], "Helvetica", 8.2, CONTENT - 24)):
        c.drawString(MARGIN + 12, r.y - 29 - i * 10.4, ln)
    r.y -= 80

    r.footer()
    c.save()
    return r.page


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--data", required=True, help="JSON payload; the edge function will emit this shape.")
    a = ap.parse_args()
    with open(a.data) as fh:
        payload = json.load(fh)
    pages = build(a.out, payload)
    print(f"wrote {a.out} ({pages} pages)")
    print(f"  brand: {payload['brand']['name']}  primary {payload['brand']['primary']}  accent {payload['brand']['accent']}")
