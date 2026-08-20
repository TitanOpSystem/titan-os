#!/usr/bin/env python3
"""The TitanOS brand kit, in one place.

WHY THIS MODULE EXISTS
----------------------
Before it, every generator carried its own copy of the palette: build_brand_sheet.py,
build_sales_onepager.py and build_ria_value_onepager.py each had NAVY and GOLD written out
longhand. When the kit changed, that was three places to edit and three chances to miss one — and a
brand sheet whose hex values disagree with the sheets it governs is worse than no brand sheet,
because somebody will trust it. One import now, everywhere.

WHAT CHANGED IN THE AUGUST 2026 KIT
-----------------------------------
    navy      #092b49  ->  #0a2540
    gold      #ceb684  ->  #c9a961
    tagline   PRIVATE WEALTH OPERATING SYSTEM  ->  PRIVATE WEALTH ADMINISTRATION
    lockup    wordmark + tagline  ->  wordmark + gold rule + tagline
    new       Slate #3f5470 (tagline on light) and Mist #cbd5e1 (tagline on dark)

The tagline is not a cosmetic change. "Operating system" is a technology claim; "administration" is
a service claim, and it is the more honest of the two now that the pitch leads with a Titan Expert
joining the firm rather than with software.

THE GEORGIA PROBLEM, STATED PLAINLY
-----------------------------------
The kit specifies Georgia for the wordmark. Georgia ships with macOS and Windows but not with Linux,
and it is not one of the fourteen fonts a PDF reader is guaranteed to have. Anything rendered on a
server — these scripts, the edge functions that email client-facing PDFs — cannot use it.

So: the SVGs declare `Georgia, 'Times New Roman', serif`, which resolves to Georgia on any machine a
human is looking at. Server-rendered PDFs use Times-Bold, the kit's own second choice. They are not
identical — Georgia has a larger x-height and non-lining figures — but they are the same species,
and the alternative is a brand that cannot be applied to the documents clients actually receive.
Worth a deliberate decision rather than a silent substitution, which is why it is written down here.
"""

from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth

# ── Palette ───────────────────────────────────────────────────────────────────
NAVY = "#0a2540"
GOLD = "#c9a961"
SLATE = "#3f5470"          # tagline and supporting copy on light
MIST = "#cbd5e1"           # tagline on dark
WHITE = "#ffffff"

# Supporting neutrals. Not in the kit, derived from it, and named so it is obvious they are ours:
# the kit gives four colours and a document needs page fills, borders and muted captions too.
CREAM = "#f7f5f0"          # page / panel fill
BORDER = "#ddd8cc"         # dividers, panel outlines
BORDER_LIGHT = "#eeebe3"   # hairlines inside panels
TEXT_MUTE = "#8b9bad"      # captions and metadata only

BRAND = {
    "name": "TitanOS",
    "wordmark_dark": "TITAN",   # navy on light, white on dark
    "wordmark_accent": "OS",    # always gold
    "tagline": "PRIVATE WEALTH ADMINISTRATION",
    "contact": "hello@titanos.com",
    "site": "titanosdemo.vercel.app",
}

# ── Type ──────────────────────────────────────────────────────────────────────
# Ratios, not absolutes, taken from the kit's 700x220 viewBox so the lockup scales correctly at any
# width. Georgia in the SVG, Times-Bold in PDFs — see the note in the docstring.
LOCKUP = {
    "vb_w": 700.0, "vb_h": 220.0,
    "wordmark_size": 76.0, "wordmark_track": 6.0, "wordmark_baseline": 110.0,
    "rule_x0": 180.0, "rule_x1": 520.0, "rule_y": 145.0, "rule_w": 2.0,
    "tagline_size": 17.0, "tagline_track": 6.4, "tagline_baseline": 172.0,
    "ink_top": 52.0,   # top of the capitals, measured; the viewBox has padding above it
}
PDF_SERIF = "Times-Bold"
PDF_SANS = "Helvetica-Bold"


# ── Contrast, measured rather than asserted ───────────────────────────────────
def luminance(hex_colour):
    h = hex_colour.lstrip("#")
    ch = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    ch = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in ch]
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]


def contrast(a, b):
    """WCAG contrast ratio. Printed on the brand sheet so a reader can check the claim."""
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# The one rule in this kit that is easy to break and expensive to break: gold measures 2.25:1 on
# white. That is not a matter of taste, it is unreadable, and it has already been got wrong twice in
# this product — once with gold body text in a deck, once with a tenant's light blue.
GOLD_ON_WHITE = contrast(GOLD, WHITE)
assert GOLD_ON_WHITE < 3.0, "Gold now passes as text — the accent-only rule needs revisiting."


def tracked_width(text, font, size, track):
    """Advance width including letter-spacing.

    reportlab applies char space after EVERY glyph including the last, but the visible ink stops
    before that final gap. Centring on the full advance therefore pushes the lockup measurably
    right, which on a centred wordmark is the one place it shows. Hence (len - 1).
    """
    return stringWidth(text, font, size) + track * max(0, len(text) - 1)


def draw_lockup(c, cx, top, width, reversed_=False):
    """Draw the full lockup — wordmark, gold rule, tagline — centred on cx, hanging from `top`.

    Returns the y of the lowest ink, so a caller can stack the next block without guessing.
    `reversed_` switches to the dark-background version: white wordmark, Mist tagline.
    """
    L = LOCKUP
    s = width / L["vb_w"]
    dark_text = WHITE if reversed_ else NAVY
    tag_text = MIST if reversed_ else SLATE

    # ── Wordmark: TITAN in navy/white, OS in gold, drawn as one tracked run ──
    size = L["wordmark_size"] * s
    track = L["wordmark_track"] * s
    a, b = BRAND["wordmark_dark"], BRAND["wordmark_accent"]
    w_a = tracked_width(a, PDF_SERIF, size, track)
    w_b = tracked_width(b, PDF_SERIF, size, track)
    # The gap between the two runs is one tracking unit, same as between letters inside them.
    total = w_a + track + w_b
    x = cx - total / 2
    y = top - L["wordmark_baseline"] * s

    # Letter-spacing lives on a TEXT OBJECT, not on the canvas: reportlab's Canvas has no
    # setCharSpace (only a private _charSpace), so c.setCharSpace(...) raises AttributeError.
    #
    # AND IT MUST BE RESET TO ZERO BEFORE THE OBJECT CLOSES. setCharSpace emits a PDF `Tc` operator,
    # and Tc is part of the document's TEXT STATE — it is not scoped to the text object that set it.
    # Leaving it at 6 tracked out every subsequent string on the page: body copy in both one-pagers
    # came out letter-spaced and overflowing its columns, because widths had been measured without
    # the spacing and drawn with it. An earlier comment here confidently claimed the text object
    # scoped the tracking. It does not.
    t = c.beginText(x, y)
    t.setFont(PDF_SERIF, size)
    t.setCharSpace(track)
    t.setFillColor(HexColor(dark_text))
    t.textOut(a)
    t.setFillColor(HexColor(GOLD))
    t.textOut(b)
    t.setCharSpace(0)
    c.drawText(t)

    # ── Gold rule ───────────────────────────────────────────────────────────
    ry = top - L["rule_y"] * s
    c.setStrokeColor(HexColor(GOLD))
    c.setLineWidth(max(0.6, L["rule_w"] * s))
    c.line(cx - (L["vb_w"] / 2 - L["rule_x0"]) * s, ry,
           cx + (L["rule_x1"] - L["vb_w"] / 2) * s, ry)

    # ── Tagline ─────────────────────────────────────────────────────────────
    tsize = L["tagline_size"] * s
    ttrack = L["tagline_track"] * s
    tag = BRAND["tagline"]
    tw = tracked_width(tag, PDF_SANS, tsize, ttrack)
    ty = top - L["tagline_baseline"] * s
    t2 = c.beginText(cx - tw / 2, ty)
    t2.setFont(PDF_SANS, tsize)
    t2.setCharSpace(ttrack)
    t2.setFillColor(HexColor(tag_text))
    t2.textOut(tag)
    t2.setCharSpace(0)   # same reason as above — Tc persists across the whole page
    c.drawText(t2)

    return ty


def lockup_height(width):
    """Ink height of the lockup at a given width — capital tops down to the tagline baseline."""
    s = width / LOCKUP["vb_w"]
    return (LOCKUP["tagline_baseline"] - LOCKUP["ink_top"]) * s


if __name__ == "__main__":
    print(f'{BRAND["name"]} — {BRAND["tagline"]}\n')
    print("Contrast, measured:")
    for name, hexv in [("Navy", NAVY), ("Gold", GOLD), ("Slate", SLATE), ("Mist", MIST)]:
        on_w = contrast(hexv, WHITE)
        on_n = contrast(hexv, NAVY)
        note = "accent only" if on_w < 3 and on_n < 3 else ""
        print(f"  {name:<6} {hexv}   on white {on_w:5.2f}:1   on navy {on_n:5.2f}:1   {note}")
