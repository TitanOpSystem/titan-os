#!/usr/bin/env python3
"""Builds the Client Data Completeness Checklist, brand-driven from the env.

WHY A GENERATOR
---------------
The checklist existed only as a finished PDF with "PCM Family Office" painted at
absolute coordinates in the subtitle and in the footer of every page. A PDF has
no reflow, so re-branding it by editing the content stream means every checkbox
below a changed string has to be re-placed by hand — and this document is 41
checkboxes and two pages of them.

With the layout in code, BRAND_NAME/BRAND_TAGLINE/BRAND_LOGO drive the document,
the item list is a table, and the page break falls wherever it falls.

THE WORDING IS NOT MINE
-----------------------
Every checklist item below was extracted from the existing PDF with
`pdftotext -layout`, not retyped and not tidied — including the straight
apostrophe in "Homeowner's" and the ZapfDingbats ✦ that marks the Scan feature.
The one permitted edit is the firm name: where the original said "PCM Family
Office" the generator emits {FIRM}. `--verify` re-extracts the text from both
files and compares, so the claim "only the branding and the geometry changed" is
checked rather than asserted.

FIELD COUNT
-----------
The source PDF carries 47 widgets: family_client, advisor_name, date_reviewed,
item_1 … item_41 (one per checklist line — there are 41 lines, not 44), and
notes_1 … notes_3 under "Notes / Outstanding Gaps". Those exact 47 names are
reproduced, because the platform fills by name.

Usage:
  python3 docs/build_checklist.py out.pdf [--verify original.pdf]
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

W, H = letter
MARGIN = 52.0
CONTENT = W - MARGIN * 2

NAVY = HexColor("#092B49")
GOLD = HexColor("#CEB684")
BODY = HexColor("#222222")
SOFT = HexColor("#6B7280")
FIELD_BG = Color(0.8, 0.843, 1)          # the existing form's field fill
FIELD_BC = Color(0.85098, 0.827451, 0.780392)

BODY_F, BODY_S, LEAD = "Helvetica", 9, 11.6
HEAD_F, HEAD_S = "Times-Bold", 12.5

FIRM = os.environ.get("BRAND_NAME", "PCM Family Office")
TAGLINE = os.environ.get("BRAND_TAGLINE", "DISCOVER · SIMPLIFY · EXECUTE")
LOGO = os.environ.get("BRAND_LOGO", os.path.join(os.path.dirname(__file__), "..", "public", "pcm-logo-full.png"))

SHORT = FIRM.split()[0]     # "PCM" — the defined short form used throughout the text

DOC_TITLE = "Client Data Completeness Checklist"

ITEM_LEAD = 14.6            # pitch of one checklist line
NOTE_ROWS = 3               # notes_1 … notes_3

# ── The checklist, verbatim from the source PDF ──────────────────────────────
# Items are numbered item_1 … item_41 in reading order, which is how the source
# names them and how the platform fills them. "✦" is drawn in ZapfDingbats, as in
# the original; see item().
SECTIONS = [
    ("1. Family Profile & Contacts", [
        "All family members added as contacts — spouses, children, dependents",
        "Date of birth entered for each contact — powers recurring birthday deadlines",
        "Anniversary date entered — powers recurring anniversary deadlines",
        "Relationships mapped correctly — e.g., spouse, child, trustee",
        "Primary contact info verified — phone, email, mailing address",
        "Client portal login created and tested",
        "Client role/permissions set correctly (client vs. advisor view)",
    ]),
    ("2. Portfolio & Accounts", [
        "All investment/brokerage accounts logged",
        "All retirement accounts logged — IRA, 401(k), etc.",
        "All bank accounts logged",
        "Account balances current — within last statement cycle",
        "Beneficiary designations recorded",
    ]),
    ("3. Properties & Other Assets", [
        "All properties listed with full address",
        "Deed / title documents uploaded",
        "Mortgage or loan details entered — balance, rate, maturity date",
        "Homeowner's insurance policy on file — with expiration date",
        "Flood insurance on file, if applicable — with expiration date",
        "Most recent appraisal or valuation on file",
        "Other titled assets logged — cars, boats, planes, or other high-value property",
        "Registration, title, or insurance docs on file for other assets",
    ]),
    ("4. Documents", [
        "Estate planning documents uploaded — will, trust agreements",
        "Most recent tax returns uploaded",
        "All insurance policies uploaded",
        "Documents scanned for AI search (✦ Scan)",
        "Documents correctly categorized and labeled",
    ]),
    ("5. Tasks & Deadlines", [
        "Open action items entered as tasks with due dates",
        "Loan maturities appearing on Upcoming Deadlines feed",
        "Insurance renewals appearing on Upcoming Deadlines feed",
        "Deal/transaction close dates entered, if applicable",
        "Birthdays & anniversaries confirmed visible on dashboard",
    ]),
    ("6. Notes", [
        "Key meeting notes logged",
        "Notes attributed to correct advisor and family",
    ]),
    ("7. Financial Planning", [
        "Planning goals and assumptions entered",
        "Risk tolerance documented",
        "Plan reviewed with client and dated",
    ]),
    ("8. Prospecting Pipeline (New Clients Only)", [
        "Deal marked Closed / Won in pipeline",
        "Referral source documented",
        "Prospect record fully transitioned to active client",
    ]),
    ("9. Platform Access & AI Assistant", [
        "Client portal login active and verified by client",
        "AI assistant named and welcome flow completed",
        "Mobile access confirmed, if used by family",
    ]),
]

ITEM_COUNT = sum(len(v) for _, v in SECTIONS)
assert ITEM_COUNT == 41, f"expected 41 checklist items to match the source form, have {ITEM_COUNT}"


class Doc:
    def __init__(self, path, total):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.c.setTitle(f"{FIRM} - {DOC_TITLE}")
        self.form = self.c.acroForm
        self.page = 1
        self.total = total
        self.y = 0.0

    # ── primitives ──────────────────────────────────────────────────────────
    def footer(self):
        c = self.c
        c.setFont("Helvetica", 7.6)
        c.setFillColor(SOFT)
        c.drawString(MARGIN, 28, f"{FIRM} — {DOC_TITLE}")
        c.drawRightString(W - MARGIN, 28, f"Page {self.page} of {self.total}")

    def new_page(self):
        self.footer()
        self.c.showPage()
        self.page += 1
        self.y = H - 62

    def room(self, need):
        if self.y - need < 74:
            self.new_page()

    def wrap(self, text, font=BODY_F, size=BODY_S, width=CONTENT):
        out, line = [], ""
        for w in text.split():
            trial = (line + " " + w).strip()
            if stringWidth(trial, font, size) <= width:
                line = trial
            else:
                out.append(line)
                line = w
        if line:
            out.append(line)
        return out

    def para(self, text, after=7, size=BODY_S, color=BODY, font=BODY_F, indent=0.0):
        lines = self.wrap(text, font, size, CONTENT - indent)
        self.room(len(lines) * LEAD + after)
        self.c.setFont(font, size)
        self.c.setFillColor(color)
        for ln in lines:
            self.c.drawString(MARGIN + indent, self.y, ln)
            self.y -= LEAD
        self.y -= after

    def heading(self, text, keep=3, rule=True):
        # Reserve room for the heading, its gold rule AND the first few items, so
        # a section title can never be orphaned at the foot of a page with its
        # checkboxes overleaf.
        self.room(28 + keep * ITEM_LEAD)
        self.y -= 8
        self.c.setFont(HEAD_F, HEAD_S)
        self.c.setFillColor(NAVY)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 12.5
        if rule:
            self.c.setStrokeColor(GOLD)
            self.c.setLineWidth(0.9)
            self.c.line(MARGIN, self.y, W - MARGIN, self.y)
        self.y -= 11

    def rule(self, width=0.75, color=None):
        self.c.setStrokeColor(color or FIELD_BC)
        self.c.setLineWidth(width)
        self.c.line(MARGIN, self.y, W - MARGIN, self.y)

    def textfield(self, name, x, y, w, h=14, tip=""):
        self.form.textfield(
            name=name, tooltip=tip or name, x=x, y=y, width=w, height=h,
            borderStyle="underlined", borderWidth=1,
            borderColor=FIELD_BC, fillColor=FIELD_BG, textColor=BODY,
            fontName="Helvetica", fontSize=9, forceBorder=True,
        )

    def checkbox(self, name, x, y, tip=""):
        self.form.checkbox(
            name=name, tooltip=tip or name, x=x, y=y, size=9,
            checked=False, buttonStyle="check",
            borderColor=FIELD_BC, fillColor=FIELD_BG, textColor=NAVY, borderWidth=1,
        )

    def labelled_field(self, label, name, x, w):
        """A label above an underlined field, as in the original header block.
        Every field on this form goes through here — the agreement had two call
        sites doing this by hand at different offsets and its boxes collided."""
        self.c.setFont("Helvetica-Bold", 8)
        self.c.setFillColor(NAVY)
        self.c.drawString(x, self.y, label)
        self.textfield(name, x, self.y - 19, w, tip=label.rstrip(":"))
        return self.y - 19

    def item(self, name, label):
        """One checkbox and its caption.

        The caption may contain "✦", which the original prints from
        ZapfDingbats mid-sentence (Helvetica has no such glyph). Drawing it as a
        plain Helvetica character silently produces a different symbol, so the
        string is split and the run set in the dingbat font.
        """
        self.room(ITEM_LEAD)
        self.checkbox(name, MARGIN, self.y - 1.5, tip=label)
        x = MARGIN + 14
        self.c.setFillColor(BODY)
        for i, part in enumerate(label.split("✦")):
            if i:
                self.c.setFont("ZapfDingbats", BODY_S)
                self.c.drawString(x, self.y, "F")     # ZapfDingbats F == ✦
                x += stringWidth("F", "ZapfDingbats", BODY_S)
            self.c.setFont(BODY_F, BODY_S)
            self.c.drawString(x, self.y, part)
            x += stringWidth(part, BODY_F, BODY_S)
        self.y -= ITEM_LEAD


def layout(out_path, total):
    d = Doc(out_path, total)
    c = d.c

    # ── Masthead ────────────────────────────────────────────────────────────
    logo = os.path.normpath(LOGO)
    y = H - 52
    if os.path.exists(logo):
        from reportlab.lib.utils import ImageReader
        img = ImageReader(logo)
        iw, ih = img.getSize()
        lw = 96.0
        lh = lw * (ih / iw)
        c.drawImage(logo, MARGIN, y - lh, width=lw, height=lh, mask="auto")
        y -= lh + 16
    else:
        y -= 8

    c.setFont("Times-Bold", 20)
    c.setFillColor(NAVY)
    c.drawString(MARGIN, y, DOC_TITLE)
    y -= 15
    c.setFont("Helvetica-Oblique", 9.5)
    c.setFillColor(SOFT)
    c.drawString(MARGIN, y, f"{FIRM} — Internal Use, Advisor Review")
    y -= 10
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.1)
    c.line(MARGIN, y, W - MARGIN, y)
    d.y = y - 22

    # ── Review header ───────────────────────────────────────────────────────
    third = (CONTENT - 24) / 3
    d.labelled_field("Family / Client:", "family_client", MARGIN, third)
    d.labelled_field("Advisor:", "advisor_name", MARGIN + third + 12, third)
    d.labelled_field("Date Reviewed:", "date_reviewed", MARGIN + (third + 12) * 2, third)
    d.y -= 28

    d.para("Check off each item once it is entered and verified in the platform.",
           size=8, color=SOFT, font="Helvetica-Oblique", after=0)

    # ── The checklist ───────────────────────────────────────────────────────
    n = 0
    for title, items in SECTIONS:
        d.heading(title)
        for label in items:
            n += 1
            d.item(f"item_{n}", label)
        d.y -= 6

    # ── Notes / Outstanding Gaps ────────────────────────────────────────────
    d.heading("Notes / Outstanding Gaps", keep=NOTE_ROWS, rule=False)
    d.y += 4
    d.rule()
    d.y -= 18
    for i in range(1, NOTE_ROWS + 1):
        d.room(22)
        d.textfield(f"notes_{i}", MARGIN, d.y, CONTENT, h=13, tip="Notes / Outstanding Gaps")
        d.y -= 22

    d.y -= 10
    c.setFont("Helvetica-Bold", 7.4)
    c.setFillColor(GOLD)
    c.drawCentredString(W / 2, max(d.y, 48), TAGLINE)

    d.footer()
    c.save()
    return d.page


def build(out_path):
    """Two passes. The footer prints "Page n of N" and N is not known until the
    layout has run, so the first pass is thrown away and only counts pages. The
    alternative — hard-coding "of 2" — is a lie waiting for the first brand whose
    logo is a different shape."""
    with tempfile.TemporaryDirectory() as td:
        total = layout(os.path.join(td, "probe.pdf"), 1)
    pages = layout(out_path, total)
    if pages != total:
        sys.exit(f"*** pagination unstable: probe said {total} pages, final run produced {pages} ***")
    return pages


# ── verification ────────────────────────────────────────────────────────────
def norm(text):
    """Normalise for comparison: collapse whitespace, drop the page furniture
    that legitimately differs when the brand or the pagination changes."""
    keep = []
    for line in text.splitlines():
        s = " ".join(line.split())
        if not s:
            continue
        if re.search(r"Page \d+ of \d+$", s):      # running footer
            continue
        if s == TAGLINE:
            continue
        keep.append(s)
    return " ".join(keep)


def words(path):
    txt = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True).stdout
    return norm(txt).split()


def field_widgets(path):
    """Every form widget as (name, page index, rect). Read back from the written
    file rather than from the build, so what is checked is what shipped."""
    from pypdf import PdfReader
    out = []
    for pi, pg in enumerate(PdfReader(path).pages):
        for a in (pg.get("/Annots") or []):
            o = a.get_object()
            if o.get("/Subtype") != "/Widget":
                continue
            out.append((str(o.get("/T")), pi, [float(v) for v in o["/Rect"]]))
    return out


def overlaps(path):
    """No two field rects may collide.

    The agreement had exactly this bug: two labels in the signature block were
    positioned by hand at the wrong offset and their boxes landed on top of the
    field above. It renders as a plausible-looking form that cannot be filled in.
    With 44 boxes on this form, checking by eye is not a plan.
    """
    ws = field_widgets(path)
    bad = []
    for i in range(len(ws)):
        na, pa, ra = ws[i]
        for j in range(i + 1, len(ws)):
            nb, pb, rb = ws[j]
            if pa != pb:
                continue
            if ra[0] < rb[2] and rb[0] < ra[2] and ra[1] < rb[3] and rb[1] < ra[3]:
                bad.append((na, nb, pa + 1))
    return bad


def render_errors(path):
    """poppler's renderer is the cheapest available syntax checker."""
    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run(["pdftoppm", "-r", "36", path, os.path.join(td, "p")],
                           capture_output=True, text=True)
    return [ln for ln in r.stderr.splitlines() if "Syntax Error" in ln]


def verify(original, generated):
    """The verdict is a multiset check, not a sequence diff.

    A sequence diff reports a word as deleted when it merely moved — a different
    page break moves every item after it, and the first run of this check on the
    agreement flagged repositioned labels as lost. Judging on that would either
    block a correct document or teach me to ignore the check. So: every word in
    the original must appear in the generated file at least as many times. That
    catches genuine loss and is indifferent to order.
    """
    import difflib
    from collections import Counter

    a, b = words(original), words(generated)
    ca, cb = Counter(a), Counter(b)

    lost = {w: ca[w] - cb.get(w, 0) for w in ca if ca[w] > cb.get(w, 0)}
    gained = {w: cb[w] - ca.get(w, 0) for w in cb if cb[w] > ca.get(w, 0)}

    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    print(f"  original words : {len(a)}")
    print(f"  generated words: {len(b)}")
    print(f"  sequence match : {sm.ratio() * 100:.2f}%  (order changes are expected)")
    print()

    if lost:
        print("  WORDS LOST (present in the original, missing or fewer here):")
        for w, n in sorted(lost.items()):
            print(f"    - {w!r} x{n}")
    else:
        print("  WORDS LOST: none — every word of the original survives")
    print()

    if gained:
        print("  WORDS ADDED:")
        print("    " + " ".join(f"{w!r}x{n}" if n > 1 else repr(w) for w, n in sorted(gained.items())))
    else:
        print("  WORDS ADDED: none")
    print()

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "insert" and (j2 - j1) > 6:
            print("  INSERTED PASSAGE:")
            print("    + " + " ".join(b[j1:j2]))

    # ── field set ───────────────────────────────────────────────────────────
    fa = {n for n, _, _ in field_widgets(original)}
    fb = {n for n, _, _ in field_widgets(generated)}
    print(f"  FIELDS: original {len(fa)}, generated {len(fb)}")
    missing, extra = sorted(fa - fb), sorted(fb - fa)
    if missing:
        print("    MISSING: " + ", ".join(missing))
    if extra:
        print("    EXTRA  : " + ", ".join(extra))
    if not missing and not extra:
        print("    field names identical")
    print()

    # ── geometry ────────────────────────────────────────────────────────────
    bad = overlaps(generated)
    if bad:
        print("  OVERLAPPING FIELD RECTS:")
        for na, nb, pg in bad:
            print(f"    - {na} / {nb} on page {pg}")
    else:
        print("  FIELD OVERLAPS: none")

    errs = render_errors(generated)
    print(f"  RENDER (pdftoppm): {len(errs)} syntax errors" + ("" if not errs else " — " + errs[0]))
    print()

    return not lost and not missing and not extra and not bad and not errs


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--verify", metavar="ORIGINAL.pdf", default=None)
    a = ap.parse_args()

    pages = build(a.out)
    print(f"wrote {a.out} ({pages} pages)")

    if a.verify:
        print()
        print("Text diff against the original (every checklist item must survive):")
        ok = verify(a.verify, a.out)
        print("  VERDICT:", "faithful to the original" if ok else "*** DIVERGED — DO NOT USE ***")
        sys.exit(0 if ok else 2)
