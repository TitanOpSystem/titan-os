#!/usr/bin/env python3
"""Builds the Automatic Payment (ACH) Authorization, brand-driven from the env.

WHY A GENERATOR
---------------
The form existed only as a finished PDF whose content stream hard-codes
"PCM Family Office" at absolute coordinates. Selling the platform white-label
means another firm's name has to appear in the same document, and a PDF has no
reflow: swapping a 17-character firm name for a 24-character one shifts every
line that follows it, so the only honest way to re-brand is to re-lay-out.

With the layout in code, BRAND_NAME/BRAND_TAGLINE/BRAND_LOGO drive the whole
document and the wrapping re-computes itself.

THE WORDING IS NOT MINE
-----------------------
Every sentence of the authorization language below was extracted from the
existing PDF with `pdftotext -layout`, not retyped and not improved. The one
permitted edit is the firm name: where the original said "PCM Family Office" the
generator emits {FIRM}, and where it said the defined short form "PCM" it emits
{SHORT}. `--verify` re-extracts the text from both files and compares, so the
claim "only the branding and the geometry changed" is checked rather than
asserted.

$5,000.00 appears twice in the original — once in the prose ("currently
$5,000.00 per month") and once as the pre-filled value of the monthly_fee field.
Both are reproduced. Dropping the field default would be a silent content change.

Form field names are unchanged, so the platform needs no edit.

Usage:
  python3 docs/build_ach.py out.pdf [--verify original.pdf]
"""

import argparse
import os
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

DOC_TITLE = "Automatic Payment (ACH) Authorization"

# The monthly_fee field ships pre-filled in the original. Kept verbatim.
MONTHLY_FEE_DEFAULT = "$5,000.00"

PAGES = 1                   # this form is one page; build() asserts it stayed one


class Doc:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.c.setTitle(f"{FIRM} - {DOC_TITLE}")
        self.form = self.c.acroForm
        self.page = 1
        self.y = 0.0

    # ── primitives ──────────────────────────────────────────────────────────
    def footer(self):
        """This form carries no running header/footer — the only page furniture
        is the centred gold tagline the original prints at the foot."""
        c = self.c
        c.setFont("Helvetica-Bold", 7.4)
        c.setFillColor(GOLD)
        c.drawCentredString(W / 2, 24, TAGLINE)

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

    def heading(self, text, keep=3):
        # Reserve room for the heading AND the first few lines of whatever
        # follows, so a section title can never be orphaned at the foot of a page
        # with its fields overleaf.
        self.room(23 + keep * LEAD)
        self.y -= 8
        self.c.setFont(HEAD_F, HEAD_S)
        self.c.setFillColor(NAVY)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 15

    def rule(self, width=0.75, color=None):
        self.c.setStrokeColor(color or FIELD_BC)
        self.c.setLineWidth(width)
        self.c.line(MARGIN, self.y, W - MARGIN, self.y)

    def textfield(self, name, x, y, w, h=14, tip="", value=""):
        self.form.textfield(
            name=name, tooltip=tip or name, value=value, x=x, y=y, width=w, height=h,
            borderStyle="underlined", borderWidth=1,
            borderColor=FIELD_BC, fillColor=FIELD_BG, textColor=BODY,
            fontName="Helvetica", fontSize=9, forceBorder=True,
        )

    def checkbox(self, name, x, y, tip=""):
        self.form.checkbox(
            name=name, tooltip=tip or name, x=x, y=y, size=10,
            checked=False, buttonStyle="check",
            borderColor=FIELD_BC, fillColor=FIELD_BG, textColor=NAVY, borderWidth=1,
        )

    def labelled_field(self, label, name, x, w, value=""):
        """A label above an underlined field, as in the original's field blocks.

        Every field on this form goes through here. The agreement had two call
        sites doing the same job by hand at different offsets, which is how two
        of its boxes ended up overlapping; one helper means one geometry.
        """
        self.c.setFont("Helvetica-Bold", 8)
        self.c.setFillColor(NAVY)
        self.c.drawString(x, self.y, label)
        self.textfield(name, x, self.y - 19, w, tip=label.rstrip(":"), value=value)
        return self.y - 19


def build(out_path):
    d = Doc(out_path)
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
    c.drawString(MARGIN, y, f"{FIRM} — Recurring Advisory Fee")
    y -= 10
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.1)
    c.line(MARGIN, y, W - MARGIN, y)
    d.y = y - 22

    half = (CONTENT - 16) / 2
    RIGHT = MARGIN + half + 16
    ROW = 30

    # ── Authorization recital ───────────────────────────────────────────────
    d.para(
        f"I/We authorize {FIRM} (“{SHORT}”) to initiate recurring monthly debit entries to the bank "
        f"account indicated below for the monthly advisory fee set forth in my/our Client Services "
        f"Agreement, currently {MONTHLY_FEE_DEFAULT} per month. This authorization remains in effect until "
        f"{SHORT} receives written notice of cancellation, at least ten (10) business days before the next "
        f"scheduled debit, or until termination of the underlying Client Services Agreement.", after=6)

    # ── Client Information ──────────────────────────────────────────────────
    d.heading("Client Information")
    d.labelled_field("Client / Family Name:", "client_name", MARGIN, CONTENT)
    d.y -= ROW
    d.labelled_field("Account Holder Name:", "account_holder_name", MARGIN, CONTENT)
    d.y -= ROW
    d.labelled_field("Billing Address:", "billing_address", MARGIN, CONTENT)
    d.y -= ROW
    d.labelled_field("Phone:", "phone", MARGIN, half)
    d.labelled_field("Email:", "email", RIGHT, half)
    d.y -= ROW

    # ── Bank Account Information ────────────────────────────────────────────
    d.heading("Bank Account Information")
    d.labelled_field("Bank Name:", "bank_name", MARGIN, CONTENT)
    d.y -= ROW
    d.labelled_field("Routing Number:", "routing_number", MARGIN, half)
    d.labelled_field("Account Number:", "account_number", RIGHT, half)
    d.y -= ROW

    # Account type. The two boxes sit on one line with their captions to the
    # right, as in the original.
    d.room(20)
    d.checkbox("acct_checking", MARGIN, d.y - 2, tip="Checking")
    d.checkbox("acct_savings", MARGIN + 110, d.y - 2, tip="Savings")
    c.setFont(BODY_F, BODY_S)
    c.setFillColor(BODY)
    c.drawString(MARGIN + 15, d.y, "Checking")
    c.drawString(MARGIN + 125, d.y, "Savings")
    d.y -= 20

    d.para("Please attach a voided check or bank letter confirming the account information above.",
           size=8, color=SOFT, font="Helvetica-Oblique", after=2)

    # ── Billing Details ─────────────────────────────────────────────────────
    d.heading("Billing Details")
    d.labelled_field("Monthly Fee Amount:", "monthly_fee", MARGIN, half, value=MONTHLY_FEE_DEFAULT)
    d.labelled_field("Billing Date (day of month):", "billing_date", RIGHT, half)
    d.y -= ROW

    # ── Authorization ───────────────────────────────────────────────────────
    d.heading("Authorization", keep=5)
    d.para(
        f"By signing below, I/we certify that I/we am/are an authorized signer on the account listed above "
        f"and authorize {FIRM} to debit this account on a recurring monthly basis for the advisory fee "
        f"described in my/our Client Services Agreement. I/we understand this authorization may be revoked "
        f"at any time by written notice to {SHORT} as described above, and that I/we remain responsible for "
        f"any fees owed under the Client Services Agreement regardless of the payment method on file.",
        after=6)

    d.labelled_field("Client Signature:", "client_signature", MARGIN, half)
    d.labelled_field("Date:", "sign_date", RIGHT, half)
    d.y -= ROW
    d.labelled_field("Printed Name:", "printed_name", MARGIN, half)
    d.y -= ROW

    # ── Counsel note ────────────────────────────────────────────────────────
    d.y -= 6
    d.rule()
    d.y -= 14
    d.para(f"This form should be reviewed by {FIRM}’s bank/payment processor and legal counsel to confirm "
           f"it meets applicable NACHA/ACH authorization requirements prior to use.",
           size=7.6, color=SOFT, font="Helvetica-Oblique", after=0)

    d.footer()
    c.save()

    if d.page != PAGES:
        # Fail loudly: the footer and the page furniture assume a single page.
        sys.exit(f"*** ACH authorization ran to {d.page} pages, expected {PAGES} — layout must be tightened ***")
    return d.page


# ── verification ────────────────────────────────────────────────────────────
def norm(text):
    """Normalise for comparison: collapse whitespace, drop the page furniture
    that legitimately differs when the brand or the pagination changes."""
    drop = (TAGLINE,)
    keep = []
    for line in text.splitlines():
        s = " ".join(line.split())
        if not s:
            continue
        if any(s == p or s.endswith(p) for p in drop):
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
    A generated document should not be able to do that quietly.
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

    A sequence diff reports a word as deleted when it merely moved — reflowing a
    paragraph moves nearly every word on the page, and the first run of this
    check on the agreement flagged repositioned labels as lost. Judging on that
    would either block a correct document or teach me to ignore the check. So:
    every word in the original must appear in the generated file at least as many
    times. That catches genuine loss and is indifferent to order.
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
        print("Text diff against the original (authorization wording must be unchanged):")
        ok = verify(a.verify, a.out)
        print("  VERDICT:", "faithful to the original" if ok else "*** DIVERGED — DO NOT USE ***")
        sys.exit(0 if ok else 2)
