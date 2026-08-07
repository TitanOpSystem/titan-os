#!/usr/bin/env python3
"""TitanOS value one-pager for RIAs — benefits, no pricing.

WHAT THIS IS, AND WHAT IT IS NOT
--------------------------------
This is the sheet you leave with a principal after a first conversation. It argues why an RIA should
want this at all. It carries NO pricing, no tier table and no feature list — those live in
docs/build_sales_onepager.py, which is the commercial sheet and comes second in the sequence.

Two sheets rather than one because they answer different questions and get handed over at different
moments. A value sheet that mentions price stops being read as an argument and starts being read as a
quote.

BENEFITS, NOT CAPABILITIES
--------------------------
Every block below is written as something that happens to the FIRM — revenue, capacity, retention,
referrals — not as something the software has. "Vault with expiry tracking" is a capability;
"harder to leave than a performance number" is why a principal cares. Where a capability appears it
is there as evidence for the benefit, never as the point.

CLAIMS DISCIPLINE
-----------------
Nothing here asserts a market statistic. The obvious move on a sheet like this is to open with "72%
of UHNW net worth sits outside managed accounts", and the numbers available for that are all
second-hand — compiled by vendors quoting each other. This sheet goes to buyers who check. The only
figures on the page are the property-management benchmarks, which were sourced directly from
property-management industry pricing guides and are cited in docs/PRICING-per-family.md.

Usage:
  python3 docs/build_ria_value_onepager.py TitanOS_RIA_Value.pdf
"""

import argparse
import os

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

W, H = letter
MARGIN = 48.0
CONTENT = W - MARGIN * 2

BRAND = {
    "name": "TitanOS",
    "tagline": "PRIVATE WEALTH OPERATING SYSTEM",
    "contact": "hello@titanos.com",
    "site": "titanosdemo.vercel.app",
}

NAVY = "#092b49"
NAVY_MID = "#293d5c"
GOLD = "#ceb684"
CREAM = "#f9f7f3"
BORDER = "#d8cdb8"
BORDER_LIGHT = "#ede8de"
TEXT_SOFT = "#5a6e84"
TEXT_MUTE = "#8fa0b2"
WHITE = "#ffffff"

EYEBROW = "FOR REGISTERED INVESTMENT ADVISERS"

HEADLINE = "Most of your client's wealth is somewhere you can't see."

STANDFIRST = (
    "You advise brilliantly on the accounts you custody. The house, the rental, the operating "
    "company, the trust, the policy, the vendors, the renewals — that lives in a filing cabinet and "
    "in your client's memory. TitanOS puts it on your record, under your brand, and turns it into a "
    "service you can charge for."
)

# Six. Each one is a consequence for the firm, with the capability named only as evidence.
BENEFITS = [
    ("Advise on the whole balance sheet",
     "Properties with their lenders, taxes, insurers and vendors. Accounts with balance history. "
     "Entities, valuables, obligations. You stop advising on a slice of the client's wealth and "
     "start advising on the picture."),
    ("Revenue the market cannot compress",
     "A flat fee per household, unrelated to assets under management. It grows with the number of "
     "families you serve rather than with the index, and it does not reprice itself when the "
     "market falls twenty percent."),
    ("Turn your centres of influence into a channel",
     "The client's CPA and estate attorney get their own portal into the household you share. You "
     "become the hub of the professional network around that family instead of one spoke in it — "
     "which is the most natural referral mechanic there is."),
    ("More households per advisor",
     "The platform assembles the report, tracks the renewal, chases the vendor and runs the "
     "premium call. That administrative load is the reason an advisor carries eight genuinely "
     "complex families instead of twenty-five."),
    ("Harder to leave than a performance number",
     "When you hold the document vault, the renewal calendar and the vendor register, moving firms "
     "means rebuilding a household's operating life. Retention stops depending on what last "
     "quarter looked like."),
    ("Evidence of what you actually did",
     "Every household gets an activity report: what was handled, when, and by whom. It earns its "
     "keep in the annual review, in the fee conversation, and in front of an examiner."),
    ("A record that outlives the advisor",
     "When a household moves to another advisor inside your firm, or a generation takes over, "
     "nothing important is left living in one person's head. Continuity becomes a property of the "
     "firm rather than of whoever happened to hold the relationship."),
    ("Your brand throughout, not ours",
     "Your palette, logo, sending domain and client-facing reports, on your own database and your "
     "own deployment. Your clients never encounter the word TitanOS, on screen or in an email."),
]

# Concrete inventory, so a reader who wants to know what the thing actually holds gets an answer
# without the page turning into a feature list. Sits as one quiet line, not as a column of bullets.
ON_THE_RECORD = (
    "Properties and their lenders, taxes, insurers and vendors  ·  Accounts and balance history  ·  "
    "Cash flow and projections  ·  A document vault that tracks expiry  ·  Valuables  ·  Entities  "
    "·  Obligations and renewals  ·  Tasks and notes  ·  Client portal  ·  Partner portal  ·  An "
    "assistant that answers only from this household's own record"
)

# The concrete hook. These are the only numbers on the page and they are the client's costs, not
# ours — sourced from property-management industry pricing guides, cited in PRICING-per-family.md.
HOOK_TITLE = "Where the conversation usually starts"
HOOK = (
    "Ask a client with a rental what they pay their property manager. The standard is 8–12% of "
    "gross rent, and 15–20% once tenant placement and maintenance mark-ups are counted. On "
    "$300,000 of rent that is $30,000 to $60,000 a year — to someone who does not report to them, "
    "does not talk to you, and is not looking at the rest of their balance sheet."
)

CLOSE = (
    "See it on a real household, with real documents, in twenty minutes."
)


class Sheet:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.pages = 1

    def wrap(self, text, font, size, width):
        words = str(text).split()
        if not words:
            return [""]
        lines, cur = [], words[0]
        for w in words[1:]:
            if stringWidth(cur + " " + w, font, size) <= width:
                cur += " " + w
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        return lines

    def text(self, s, x, y, font="Helvetica", size=9, colour=NAVY):
        self.c.setFont(font, size)
        self.c.setFillColor(HexColor(colour))
        self.c.drawString(x, y, str(s))

    def para(self, s, x, y, width, font="Helvetica", size=9, lead=11.8, colour=TEXT_SOFT):
        for line in self.wrap(s, font, size, width):
            self.text(line, x, y, font=font, size=size, colour=colour)
            y -= lead
        return y


def masthead(s):
    c = s.c
    c.setFillColor(HexColor(NAVY))
    c.rect(0, H - 104, W, 104, stroke=0, fill=1)

    logo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand",
                        "titanos-logo-knockout.png")
    drew = False
    if os.path.exists(logo):
        try:
            img = ImageReader(logo)
            iw, ih = img.getSize()
            h = 34.0
            c.drawImage(img, MARGIN, H - 70, width=iw * (h / ih), height=h, mask="auto")
            drew = True
        except Exception:
            drew = False
    if not drew:
        c.setFont("Times-Bold", 25)
        c.setFillColor(HexColor(WHITE))
        c.drawString(MARGIN, H - 66, BRAND["name"])

    s.text(BRAND["tagline"], MARGIN, H - 86, size=7.6, colour=GOLD)
    right = f'{BRAND["site"]}   ·   {BRAND["contact"]}'
    s.text(right, W - MARGIN - stringWidth(right, "Helvetica", 7.6), H - 86,
           size=7.6, colour="#8fa8bf")


def build(path):
    s = Sheet(path)
    c = s.c
    masthead(s)

    y = H - 126
    s.text(EYEBROW, MARGIN, y, font="Helvetica-Bold", size=7.6, colour=GOLD)
    y -= 22

    for line in s.wrap(HEADLINE, "Times-Bold", 21, CONTENT):
        s.text(line, MARGIN, y, font="Times-Bold", size=21, colour=NAVY)
        y -= 25
    y -= 3
    y = s.para(STANDFIRST, MARGIN, y, CONTENT, size=10, lead=13.2, colour=NAVY_MID)
    y -= 14

    c.setFillColor(HexColor(GOLD))
    c.rect(MARGIN, y, CONTENT, 1.6, stroke=0, fill=1)
    y -= 22

    # ── Six benefits, two columns ────────────────────────────────────────────
    # Rows are measured, not assumed: each row starts below the deeper of its two cells, so a
    # wording change cannot silently overlap the next row.
    gap = 26
    col_w = (CONTENT - gap) / 2
    for i in range(0, len(BENEFITS), 2):
        row = BENEFITS[i:i + 2]
        bottoms = []
        for j, (title, body) in enumerate(row):
            x = MARGIN + j * (col_w + gap)
            s.text(title, x, y, font="Helvetica-Bold", size=10, colour=NAVY)
            bottoms.append(s.para(body, x, y - 14, col_w, size=8.7, lead=11.2))
        y = min(bottoms) - 12

    y -= 4

    # ── What sits on the record ──────────────────────────────────────────────
    c.setStrokeColor(HexColor(BORDER_LIGHT))
    c.setLineWidth(0.8)
    c.line(MARGIN, y, W - MARGIN, y)
    y -= 15
    s.text("ON ONE RECORD", MARGIN, y, font="Helvetica-Bold", size=7.4, colour=GOLD)
    y = s.para(ON_THE_RECORD, MARGIN + 92, y, CONTENT - 92, size=8.4, lead=11, colour=TEXT_SOFT)
    y -= 12

    # ── The hook ─────────────────────────────────────────────────────────────
    hook_lines = s.wrap(HOOK, "Helvetica", 9, CONTENT - 34)
    hook_h = 22 + len(hook_lines) * 11.8 + 12
    c.setFillColor(HexColor(CREAM))
    c.setStrokeColor(HexColor(BORDER_LIGHT))
    c.setLineWidth(0.8)
    c.rect(MARGIN, y - hook_h, CONTENT, hook_h, stroke=1, fill=1)
    c.setFillColor(HexColor(GOLD))
    c.rect(MARGIN, y - hook_h, 3, hook_h, stroke=0, fill=1)

    hy = y - 17
    s.text(HOOK_TITLE.upper(), MARGIN + 17, hy, font="Helvetica-Bold", size=7.6, colour=NAVY)
    s.para(HOOK, MARGIN + 17, hy - 14, CONTENT - 34, size=9, lead=11.8, colour=NAVY_MID)
    y -= hook_h + 20

    # ── Close ────────────────────────────────────────────────────────────────
    s.text(CLOSE, MARGIN, y, font="Times-Bold", size=12.5, colour=NAVY)
    y -= 15
    s.text(f'{BRAND["site"]}   ·   {BRAND["contact"]}', MARGIN, y, size=9, colour=GOLD)
    y -= 12

    # ── Footer ───────────────────────────────────────────────────────────────
    c.setStrokeColor(HexColor(BORDER))
    c.setLineWidth(0.6)
    c.line(MARGIN, MARGIN - 8, W - MARGIN, MARGIN - 8)
    s.text("Property management fee ranges are industry benchmarks, not a TitanOS quote.",
           MARGIN, MARGIN - 20, size=7, colour=TEXT_MUTE)
    rt = BRAND["name"]
    s.text(rt, W - MARGIN - stringWidth(rt, "Helvetica", 7), MARGIN - 20, size=7, colour=TEXT_MUTE)

    c.showPage()
    c.save()

    if s.pages != 1:
        raise SystemExit(f"Refusing to write a {s.pages}-page one-pager. Tighten the content.")
    if y < MARGIN + 6:
        raise SystemExit(f"Content overruns the footer (bottom at y={y:.0f}, floor {MARGIN + 6}).")
    return y


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out", nargs="?", default="TitanOS_RIA_Value.pdf")
    a = ap.parse_args()
    print(f"wrote {a.out} — single page, content bottom at y={build(a.out):.0f}")
