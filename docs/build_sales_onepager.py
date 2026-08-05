#!/usr/bin/env python3
"""TitanOS sales one-pager — the two service tiers and the firm engagement fee.

WHAT THIS IS FOR
----------------
A single sheet handed to an advisory firm evaluating TitanOS: what a household gets on each tier,
what each costs per household per month, and what it costs the firm to come onto the platform.
Audience is the FIRM, not the family — the per-household pricing here is what the firm pays.

IT MUST BE ONE PAGE
-------------------
The name says one pager, so overflow is a defect, not a formatting preference. build() asserts the
page count at the end and raises rather than quietly shipping a two-page "one pager". Every block
also reserves its own height before drawing its heading — the orphaned-heading bug has now appeared
four times in this codebase and the rule is that a heading and its first content are indivisible.

FIGURES COME FROM THE PRICE LIST BELOW, DELIBERATELY, NOT FROM pricing_model.py
------------------------------------------------------------------------------
docs/pricing_model.py holds the market ANALYSIS and recommends different numbers ($750 / $2,500).
The numbers on this sheet are the ones the firm decided to sell at, which is a commercial call and
not the model's to make. They are kept here in one place so the sheet cannot drift from itself; if
the price changes, change it here and regenerate.

WINANSI ONLY
------------
The standard PDF fonts throw on any character outside WinAnsi. A tick (U+2713) is outside it and
would fail at draw time; the bullet (U+2022) and the multiplication sign (U+00D7) are inside it, so
inclusions read as bullets and exclusions as crosses.

Usage:
  python3 docs/build_sales_onepager.py TitanOS_Sales_OnePager.pdf
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

# ── The brand, as recorded on the TitanOS brand_profiles row ──────────────────
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

# ── The offer ─────────────────────────────────────────────────────────────────
# Tier names match the platform exactly. A prospect sold "Premier" logs in and sees "Premier" on
# the family record and on their own banner; a sheet that said "Premium" would not.
TIERS = [
    {
        "name": "Core",
        "lead": "Financial advisor led",
        "monthly": 1000,
        "onboarding": 1000,
        "summary": "The full record, run by the advisor who already owns the relationship.",
        "includes": [
            "Advisor is the lead on the household",
            "Client and Partner portal access",
            "Properties, portfolio and balance history",
            "Cash flow and projections",
            "Vault: documents, folders, expiry tracking",
            "Valuables, tasks, notes and deals",
            "AI assistant over the household's own record",
        ],
        "excludes": [
            "Scheduled prompts",
            "Workflows and obligations",
            "Property management service",
            "Bill pay service",
        ],
        "accent": False,
    },
    {
        "name": "Premier",
        "lead": "Titan Expert led",
        "monthly": 2000,
        "onboarding": 2000,
        "summary": "Everything in Core, with a named Titan Expert running it and the full platform "
                   "switched on.",
        "includes": [
            "Everything in Core",
            "Named Titan Expert leads the household",
            "Scheduled prompts and concierge research",
            "Workflows and obligations, run end to end",
            "Property management oversight",
            "Bill pay with a per-period payment register",
            "Client activity reporting",
        ],
        "excludes": [],
        "accent": True,
    },
]

FIRM = {
    "fee": 50000,
    "label": "One-time firm onboarding",
    "items": [
        ("Dedicated server space", "Your own database and deployment. No shared tenancy, no "
                                  "commingled client data."),
        ("Quarterly training", "Live sessions for advisors and staff, every quarter, for as long "
                              "as you are on the platform."),
        ("Full white-label", "Your name, your palette, your logo and your templates throughout — "
                             "including client-facing email and PDFs."),
    ],
}

money = lambda n: f"${n:,}"


class Sheet:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.y = H - MARGIN
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

    def centred(self, s, cx, y, font="Helvetica", size=9, colour=NAVY):
        self.text(s, cx - stringWidth(str(s), font, size) / 2, y, font, size, colour)

    def para(self, s, x, y, width, font="Helvetica", size=8.4, lead=11, colour=TEXT_SOFT):
        """Returns the y after drawing, so a caller can stack blocks without guessing heights."""
        for line in self.wrap(s, font, size, width):
            self.text(line, x, y, font=font, size=size, colour=colour)
            y -= lead
        return y


def masthead(s):
    c = s.c
    c.setFillColor(HexColor(NAVY))
    c.rect(0, H - 108, W, 108, stroke=0, fill=1)

    logo = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brand",
                        "titanos-logo-knockout.png")
    drew = False
    if os.path.exists(logo):
        try:
            img = ImageReader(logo)
            iw, ih = img.getSize()
            h = 36.0
            c.drawImage(img, MARGIN, H - 74, width=iw * (h / ih), height=h, mask="auto")
            drew = True
        except Exception:
            drew = False
    # The wordmark in type is the fallback, so the sheet is never unbranded.
    if not drew:
        c.setFont("Times-Bold", 26)
        c.setFillColor(HexColor(WHITE))
        c.drawString(MARGIN, H - 70, BRAND["name"])

    s.text(BRAND["tagline"], MARGIN, H - 90, size=7.6, colour=GOLD)
    right = f'{BRAND["site"]}   ·   {BRAND["contact"]}'
    s.text(right, W - MARGIN - stringWidth(right, "Helvetica", 7.6), H - 90,
           size=7.6, colour="#8fa8bf")


def tier_card(s, t, x, y, w, h):
    """One tier. Height is passed in and fixed, so both cards align and neither can overflow."""
    c = s.c
    c.setFillColor(HexColor(CREAM if t["accent"] else WHITE))
    c.setStrokeColor(HexColor(GOLD if t["accent"] else BORDER))
    c.setLineWidth(1 if not t["accent"] else 1.2)
    c.rect(x, y - h, w, h, stroke=1, fill=1)
    # Top rule: gold on the fuller tier, navy on the entry tier. It carries the hierarchy without
    # a "recommended" badge, which reads as a sales device rather than a fact.
    c.setFillColor(HexColor(GOLD if t["accent"] else NAVY_MID))
    c.rect(x, y - 3, w, 3, stroke=0, fill=1)

    pad = 14
    ix = x + pad
    iw = w - pad * 2
    cy = y - 22

    s.text(t["name"].upper(), ix, cy, font="Helvetica-Bold", size=13, colour=NAVY)
    cy -= 13
    s.text(t["lead"], ix, cy, font="Helvetica-Bold", size=8, colour=GOLD if t["accent"] else TEXT_SOFT)
    cy -= 16

    # Price. Kept as one line so the eye reads it as a single figure.
    s.text(money(t["monthly"]), ix, cy - 6, font="Times-Bold", size=26, colour=NAVY)
    px = ix + stringWidth(money(t["monthly"]), "Times-Bold", 26) + 6
    s.text("/ month", px, cy + 3, size=8.4, colour=TEXT_SOFT)
    s.text("per household", px, cy - 6, size=8.4, colour=TEXT_SOFT)
    cy -= 22

    s.text(f'+ {money(t["onboarding"])} one-time onboarding, per household',
           ix, cy, size=8.2, colour=NAVY_MID)
    cy -= 14

    c.setStrokeColor(HexColor(BORDER_LIGHT))
    c.setLineWidth(0.8)
    c.line(ix, cy, ix + iw, cy)
    cy -= 13

    cy = s.para(t["summary"], ix, cy, iw, size=9, lead=12, colour=TEXT_SOFT) - 6

    s.text("INCLUDED", ix, cy, font="Helvetica-Bold", size=7.2, colour=NAVY_MID)
    cy -= 12
    for item in t["includes"]:
        # Bullet and cross are both inside WinAnsi. A tick is not, and would throw at draw time.
        s.text("•", ix, cy, size=9.2, colour=GOLD)
        lines = s.wrap(item, "Helvetica", 9, iw - 12)
        for i, line in enumerate(lines):
            s.text(line, ix + 12, cy, size=9, colour=NAVY if i == 0 else TEXT_SOFT)
            cy -= 11.6
        cy -= 2.4

    if t["excludes"]:
        cy -= 4
        s.text("NOT INCLUDED", ix, cy, font="Helvetica-Bold", size=7.2, colour=NAVY_MID)
        cy -= 12
        for item in t["excludes"]:
            s.text("×", ix + 1, cy, size=9.2, colour=TEXT_MUTE)
            s.text(item, ix + 12, cy, size=9, colour=TEXT_MUTE)
            cy -= 12.6
    return cy


def build(path):
    s = Sheet(path)
    c = s.c

    masthead(s)

    # ── Headline ─────────────────────────────────────────────────────────────
    y = H - 132
    s.text("Two ways to put a household on the platform", MARGIN, y,
           font="Times-Bold", size=17, colour=NAVY)
    y -= 15
    y = s.para(
        "One codebase, one price per household, no basis points. The fee does not move when the "
        "portfolio does. Both tiers include the client and partner portals and the whole record; "
        "what separates them is who runs the household and how much of the platform is switched on.",
        MARGIN, y, CONTENT, size=8.8, lead=11.4)
    y -= 12

    # ── The two tiers ────────────────────────────────────────────────────────
    gap = 18
    card_w = (CONTENT - gap) / 2
    card_h = 314
    # tier_card returns where its content actually ended. Checked rather than eyeballed, because a
    # card that is a few points too short clips its last bullet and a reader has no way to tell that
    # is what happened — they just read a shorter feature list than the one being sold.
    ends = [tier_card(s, TIERS[0], MARGIN, y, card_w, card_h),
            tier_card(s, TIERS[1], MARGIN + card_w + gap, y, card_w, card_h)]
    floor = y - card_h
    for t, end in zip(TIERS, ends):
        if end < floor + 4:
            raise SystemExit(f'{t["name"]} card overflows: content ends at {end:.0f}, '
                             f'card floor is {floor:.0f}. Raise card_h.')
    y -= card_h + 18

    # ── Why the Core limits hold ─────────────────────────────────────────────
    # This band exists because it is the question a firm's operations lead actually asks: what stops
    # a Core household quietly acquiring a Premier feature and a billing dispute with it. The answer
    # is a real one — database triggers, not interface state — so it is worth the space.
    band_h = 58
    c.setFillColor(HexColor(CREAM))
    c.setStrokeColor(HexColor(BORDER_LIGHT))
    c.setLineWidth(0.8)
    c.rect(MARGIN, y - band_h, CONTENT, band_h, stroke=1, fill=1)
    c.setFillColor(HexColor(GOLD))
    c.rect(MARGIN, y - band_h, 3, band_h, stroke=0, fill=1)

    by = y - 18
    s.text("TIER LIMITS ARE ENFORCED, NOT JUST HIDDEN", MARGIN + 16, by,
           font="Helvetica-Bold", size=7.6, colour=NAVY)
    s.para("A Core household cannot have a workflow, an obligation or a bill-pay instruction "
           "written against it by anyone, through any route — the database refuses the write, not "
           "just the screen. And a household cannot be moved down a tier while that work is still "
           "open, so nothing is ever left on file that no one is watching.",
           MARGIN + 16, by - 13, CONTENT - 32, size=8.2, lead=10.6, colour=TEXT_SOFT)
    y -= band_h + 16

    # ── Firm engagement ──────────────────────────────────────────────────────
    strip_h = 82
    c.setFillColor(HexColor(NAVY))
    c.rect(MARGIN, y - strip_h, CONTENT, strip_h, stroke=0, fill=1)
    c.setFillColor(HexColor(GOLD))
    c.rect(MARGIN, y - 3, CONTENT, 3, stroke=0, fill=1)

    fy = y - 22
    s.text(FIRM["label"].upper(), MARGIN + 16, fy, font="Helvetica-Bold", size=7.6, colour=GOLD)
    s.text(money(FIRM["fee"]), MARGIN + 16, fy - 28, font="Times-Bold", size=26, colour=WHITE)
    s.text("charged once, per firm", MARGIN + 16, fy - 42, size=7.8, colour="#8fa8bf")

    col_x = MARGIN + 150
    col_w = (CONTENT - 166) / 3 - 12
    for i, (label, blurb) in enumerate(FIRM["items"]):
        x = col_x + i * (col_w + 18)
        s.text(label, x, fy, font="Helvetica-Bold", size=8.6, colour=WHITE)
        yy = fy - 12
        for line in s.wrap(blurb, "Helvetica", 7.9, col_w):
            s.text(line, x, yy, size=7.9, colour="#a9bccf")
            yy -= 10
    y -= strip_h + 16

    # ── Closing note ─────────────────────────────────────────────────────────
    # Deliberately NOT a restatement of the enforcement band above it. The first draft closed by
    # repeating "nothing is left recorded that no one is watching" almost word for word, two inches
    # below where it had already been said. A sheet that says the same thing twice reads as though
    # there was nothing else to say.
    s.text("Moving between tiers", MARGIN, y, font="Helvetica-Bold", size=8.6, colour=NAVY)
    y = s.para(
        "A household can move up to Premier at any time, effective immediately and pro-rated to the "
        "month, with no second onboarding fee. Pricing is per household and never varies with the "
        "size of the portfolio.",
        MARGIN, y - 12, CONTENT, size=8.5, lead=11.2, colour=TEXT_SOFT)

    # ── Footer ───────────────────────────────────────────────────────────────
    c.setStrokeColor(HexColor(BORDER))
    c.setLineWidth(0.6)
    c.line(MARGIN, MARGIN - 8, W - MARGIN, MARGIN - 8)
    s.text("Pricing current as at August 2026. Figures exclude applicable taxes.",
           MARGIN, MARGIN - 20, size=7, colour=TEXT_MUTE)
    rt = f'{BRAND["name"]}  ·  {BRAND["contact"]}'
    s.text(rt, W - MARGIN - stringWidth(rt, "Helvetica", 7), MARGIN - 20, size=7, colour=TEXT_MUTE)

    c.showPage()
    c.save()

    # A "one pager" that runs to two pages is a defect. Fail loudly rather than ship it.
    if s.pages != 1:
        raise SystemExit(f"Refusing to write a {s.pages}-page one-pager. Tighten the content.")
    # The lowest thing drawn must clear the footer rule, or content is sitting on top of it.
    if y < MARGIN + 6:
        raise SystemExit(f"Content overruns the footer (bottom at y={y:.0f}, floor {MARGIN + 6}).")
    return y


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out", nargs="?", default="TitanOS_Sales_OnePager.pdf")
    a = ap.parse_args()
    bottom = build(a.out)
    print(f"wrote {a.out} — single page, content bottom at y={bottom:.0f}")
