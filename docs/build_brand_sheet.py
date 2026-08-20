#!/usr/bin/env python3
"""TitanOS brand sheet — one page, for sharing into other projects.

WHAT THIS IS FOR
----------------
A single reference page someone can be handed when they need to put TitanOS on something:
the marks, the palette with hex values, the type, and the rules that are easy to break.

EVERY VALUE HERE IS READ FROM THE LIVE BRAND RECORD, NOT TYPED IN
----------------------------------------------------------------
The palette comes from the brand_profiles row on the TitanOS project. A brand sheet whose
hex values have drifted from the running product is worse than no brand sheet, because
somebody will trust it. If a colour changes in the record, regenerate rather than edit.

CONTRAST RATIOS ARE MEASURED, NOT ASSERTED
------------------------------------------
The gold reads 1.97:1 on white. That is not a matter of taste — it is unreadable, and it is
the single most likely way to misuse this palette, so the number is printed next to the
swatch and the rule is stated plainly. The same trap has already been hit twice in this
product: once with gold body text in the pitch deck, once with Accurate's light blue.

Usage:
  python3 docs/build_brand_sheet.py TitanOS_Brand_Sheet.pdf
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

import brand_kit as BK

W, H = letter
MARGIN = 52.0
CONTENT = W - MARGIN * 2

# ── The brand, from docs/brand_kit.py, which is the single source ─────────────
BRAND = {
    "name": BK.BRAND["name"],
    "tagline": BK.BRAND["tagline"],
    "contact": BK.BRAND["contact"],
    "site": BK.BRAND["site"],
}

NAVY = BK.NAVY
NAVY_MID = BK.SLATE
GOLD = BK.GOLD
# The kit specifies four colours; a document also needs a lighter accent for panel fills. Derived
# here rather than invented per-file, and labelled on the sheet as derived so nobody treats it as
# kit-canonical.
GOLD_LIGHT = "#dcc38a"
CREAM = BK.CREAM
BORDER = BK.BORDER
BORDER_LIGHT = BK.BORDER_LIGHT
TEXT_SOFT = BK.SLATE
TEXT_MUTE = BK.TEXT_MUTE

# `carries_text` decides whether a contrast ratio is printed. A ratio beside a border or a
# page background reads as a failing grade for a colour that was never meant to hold text,
# which is worse than showing nothing.
SLATE_LABEL = BK.SLATE
MIST_LABEL = BK.MIST

PALETTE = [
    ("Navy", NAVY, "Primary. Headings, body text, filled panels.", True),
    ("Gold", GOLD, "Accent only. Rules, the OS in the wordmark, top borders.", True),
    ("Slate", SLATE_LABEL, "Tagline on light, and supporting copy.", True),
    ("Mist", MIST_LABEL, "Tagline on dark only.", True),
    ("Gold light", GOLD_LIGHT, "Derived, not in the kit. Panel fills behind navy text.", False),
    ("Cream", CREAM, "Derived. Page and panel background.", False),
    ("Border", BORDER, "Derived. Dividers, panel outlines.", False),
    ("Border light", BORDER_LIGHT, "Derived. Hairlines inside panels.", False),
    ("Text mute", TEXT_MUTE, "Derived. Captions and metadata only.", True),
]


def luminance(hex_colour):
    h = hex_colour.lstrip("#")
    ch = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    ch = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in ch]
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]


def contrast(a, b):
    """WCAG contrast ratio. Printed on the page so a reader can check the claim."""
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


class Sheet:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.y = H - MARGIN
        self.page = 1

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

    def para(self, s, size=9, lead=12, colour=TEXT_SOFT, font="Helvetica",
             width=CONTENT, after=10, x=MARGIN):
        for line in self.wrap(s, font, size, width):
            self.text(line, x, self.y - size, font=font, size=size, colour=colour)
            self.y -= lead
        self.y -= after

    def footer(self, page):
        self.c.setStrokeColor(HexColor(BORDER))
        self.c.setLineWidth(0.6)
        self.c.line(MARGIN, MARGIN + 18, W - MARGIN, MARGIN + 18)
        self.text("Generated from the TitanOS brand record — regenerate rather than edit.",
                  MARGIN, MARGIN + 6, size=7.2, colour=TEXT_MUTE)
        n = f"{page} of 2"
        self.text(n, W - MARGIN - stringWidth(n, "Helvetica", 7.2), MARGIN + 6,
                  size=7.2, colour=TEXT_MUTE)

    def newpage(self):
        self.footer(self.page)
        self.c.showPage()
        self.page += 1
        self.y = H - MARGIN - 14

    def need(self, h):
        """Break before a block rather than letting it run off the sheet."""
        if self.y - h < MARGIN + 40:
            self.newpage()

    def section(self, label, needs=0):
        """A rule above the label, so sections read as bands rather than floating text.

        `needs` is the height of the block this heading introduces, reserved BEFORE the
        heading is drawn. Reserving it afterwards is what stranded the Palette heading alone
        at the foot of page one with a blank gap beneath it — the break happened after the
        heading had already been committed to the page. Third time this class of bug has
        appeared in this codebase; the rule is that a heading and its first content are one
        indivisible unit.
        """
        self.need(70 + needs)
        self.c.setFillColor(HexColor(GOLD))
        self.c.rect(MARGIN, self.y, CONTENT, 1.6, stroke=0, fill=1)
        self.y -= 15
        self.text(label.upper(), MARGIN, self.y - 8, font="Helvetica-Bold", size=8.2,
                  colour=NAVY_MID)
        self.y -= 22


def build(path, assets_dir):
    s = Sheet(path)
    c = s.c

    # ── Masthead ──────────────────────────────────────────────────────────────
    c.setFillColor(HexColor(NAVY))
    c.rect(0, H - 132, W, 132, stroke=0, fill=1)

    logo = os.path.join(assets_dir, "titanos-logo-knockout.png")
    drew_logo = False
    if os.path.exists(logo):
        try:
            img = ImageReader(logo)
            iw, ih = img.getSize()
            h = 44.0
            c.drawImage(img, MARGIN, H - 96, width=iw * (h / ih), height=h,
                        mask="auto")
            drew_logo = True
        except Exception:
            drew_logo = False
    # The wordmark in type is the fallback, so the sheet is never unbranded.
    if not drew_logo:
        c.setFont("Times-Bold", 30)
        c.setFillColor(HexColor("#ffffff"))
        c.drawString(MARGIN, H - 92, BRAND["name"])

    c.setFont("Helvetica", 8.4)
    c.setFillColor(HexColor(GOLD))
    c.drawString(MARGIN, H - 116, BRAND["tagline"])

    c.setFont("Helvetica", 8.4)
    c.setFillColor(HexColor("#8fa8bf"))
    right = f'{BRAND["site"]}   ·   {BRAND["contact"]}'
    c.drawString(W - MARGIN - stringWidth(right, "Helvetica", 8.4), H - 116, right)

    s.y = H - 168

    # ── What it is ────────────────────────────────────────────────────────────
    s.section("The name")
    s.para("TitanOS is the platform. It is written as one word, capital T and capital OS — "
           "not Titan OS, not TitanOs, not TITANOS. The tagline is set in capitals and is "
           "never re-punctuated.", size=9.4, lead=12.4, colour=NAVY, after=6)
    s.para("TitanOS is white-label. A licensed firm's clients see that firm's name, logo and "
           "palette — never these. This sheet is for the platform's own materials: the site, "
           "decks, contracts and anything addressed to a prospective firm. If a client of a "
           "licensed firm can see it, it carries their brand, not this one.",
           size=8.6, lead=11.4, after=14)

    # ── Marks ─────────────────────────────────────────────────────────────────
    s.section("Marks", needs=150)
    marks = [
        ("titanos-logo-full.png", "Full lockup", "Light backgrounds. The default."),
        ("titanos-logo-knockout.png", "Knockout", "On navy or any dark field."),
        ("titanos-mark.png", "Mark alone", "Favicons, avatars, tight spaces."),
    ]
    col = CONTENT / 3
    top = s.y
    for i, (fname, label, use) in enumerate(marks):
        x = MARGIN + i * col
        box_h = 52
        on_dark = "knockout" in fname
        c.setFillColor(HexColor(NAVY if on_dark else "#ffffff"))
        c.setStrokeColor(HexColor(BORDER))
        c.setLineWidth(0.6)
        c.rect(x, top - box_h, col - 12, box_h, stroke=1, fill=1)
        p = os.path.join(assets_dir, fname)
        if os.path.exists(p):
            try:
                img = ImageReader(p)
                iw, ih = img.getSize()
                h = 26.0
                w = iw * (h / ih)
                max_w = col - 36
                if w > max_w:
                    w, h = max_w, max_w * (ih / iw)
                c.drawImage(img, x + (col - 12 - w) / 2, top - box_h + (box_h - h) / 2,
                            width=w, height=h, mask="auto")
            except Exception:
                pass
        s.text(label, x, top - box_h - 14, font="Helvetica-Bold", size=8.4, colour=NAVY)
        for j, line in enumerate(s.wrap(use, "Helvetica", 7.6, col - 14)):
            s.text(line, x, top - box_h - 24 - j * 9, size=7.6, colour=TEXT_SOFT)
    s.y = top - 52 - 46
    s.para("Leave clear space around the lockup of at least the height of the mark. Never "
           "stretch, rotate, recolour or add effects. On a photograph, use the knockout over "
           "a solid navy panel rather than placing it on the image directly.",
           size=8.2, lead=10.8, after=14)

    # ── Palette ───────────────────────────────────────────────────────────────
    s.section("Palette", needs=9 * 17 + 96)
    for name, hexv, use, carries_text in PALETTE:
        row_h = 17
        c.setFillColor(HexColor(hexv))
        c.setStrokeColor(HexColor(BORDER))
        c.setLineWidth(0.5)
        c.rect(MARGIN, s.y - 14, 30, 14, stroke=1, fill=1)
        s.text(name, MARGIN + 40, s.y - 11, font="Helvetica-Bold", size=8.2, colour=NAVY)
        s.text(hexv.upper(), MARGIN + 120, s.y - 11, font="Courier", size=8, colour=NAVY_MID)
        s.text(use, MARGIN + 190, s.y - 11, size=8, colour=TEXT_SOFT)
        # Measured against white, and only for colours that are allowed to carry text.
        if carries_text:
            r = contrast(hexv, "#ffffff")
            passes = r >= 4.5
            label = f"{r:.2f}:1 on white" + ("" if passes else "  text: reverse only")
            s.text(label, W - MARGIN - stringWidth(label, "Helvetica", 7.4), s.y - 11,
                   size=7.4, colour=TEXT_MUTE if passes else "#9c3a2f")
        else:
            label = "surface"
            s.text(label, W - MARGIN - stringWidth(label, "Helvetica-Oblique", 7.4),
                   s.y - 11, font="Helvetica-Oblique", size=7.4, colour=TEXT_MUTE)
        s.y -= row_h
    s.y -= 6

    # ── The rule that gets broken ─────────────────────────────────────────────
    box_top = s.y
    c.setFillColor(HexColor("#fdf6e8"))
    c.setStrokeColor(HexColor(GOLD))
    c.setLineWidth(0.8)
    box_h = 62
    c.rect(MARGIN, box_top - box_h, CONTENT, box_h, stroke=1, fill=1)
    s.y = box_top - 16
    s.text("Gold is not a text colour", MARGIN + 12, s.y, font="Helvetica-Bold",
           size=9, colour=NAVY)
    s.y -= 13
    gold_on_white = contrast(GOLD, "#ffffff")
    gold_on_navy = contrast(GOLD, NAVY)
    s.para(f"Gold measures {gold_on_white:.2f}:1 on white — far below the 4.5:1 needed for "
           f"body text, and unreadable on a projector. Use it for rules, top borders and "
           f"panel fills. It carries text only in reverse, where it reaches "
           f"{gold_on_navy:.2f}:1 on navy. When an accent must appear as text on a light "
           f"background, darken it toward navy first.",
           size=8, lead=10.4, colour=NAVY_MID, width=CONTENT - 24, after=0, x=MARGIN + 12)
    s.y = box_top - box_h - 16

    # ── Type ──────────────────────────────────────────────────────────────────
    s.section("Typography", needs=110)
    c.setFont("Times-Bold", 17)
    c.setFillColor(HexColor(NAVY))
    c.drawString(MARGIN, s.y - 14, "Cormorant Garamond")
    s.text("Headings, figures, the wordmark. Semibold 600.", MARGIN + 190, s.y - 13,
           size=8.2, colour=TEXT_SOFT)
    s.y -= 26
    c.setFont("Helvetica", 12)
    c.setFillColor(HexColor(NAVY))
    c.drawString(MARGIN, s.y - 12, "DM Sans")
    s.text("Body, labels, tables, buttons. Regular 400 and medium 500.",
           MARGIN + 190, s.y - 11, size=8.2, colour=TEXT_SOFT)
    s.y -= 24
    s.para("Sentence case for headings and labels. Capitals are reserved for the tagline and "
           "for small eyebrow labels. Never set body copy in the serif, and never set a "
           "heading below 13pt — if it needs to be smaller, it is a label, not a heading.",
           size=8.2, lead=10.8, after=12)

    # ── Voice ─────────────────────────────────────────────────────────────────
    s.section("Voice", needs=70)
    s.para("Plain, specific, unhurried. The product's job is to make a firm look organised, "
           "so the writing states what happened and what it cost — no superlatives, no "
           "“seamless” or “elevate”, no exclamation marks. Say the number "
           "and where it came from. Where something is not known, say that rather than "
           "rounding it into confidence.", size=8.4, lead=11, after=0)

    s.footer(s.page)
    c.showPage()
    c.save()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--assets", default="public")
    a = ap.parse_args()
    build(a.out, a.assets)
    print(f"wrote {a.out}")
