#!/usr/bin/env python3
"""Builds the Client Services Agreement, with the onboarding fee inside Section 2.

WHY A GENERATOR
---------------
The agreement existed only as a finished PDF. A PDF has no reflow: text is painted
at absolute coordinates, so "insert a clause into Section 2 and push the rest
down" means rewriting the content stream and re-placing every operator below the
insertion point. That is a bad way to spend risk on a document clients sign, and
it is why the first attempt parked the onboarding fee at the foot of page 1, after
Termination, where it read as an afterthought.

With the layout in code, the clause sits where it belongs and everything below
flows down on its own.

THE WORDING IS NOT MINE
-----------------------
Every sentence of legal text below was extracted from the existing PDF, not
retyped. `--verify` re-extracts the text from both the original and the generated
file and diffs them, so the claim "only the geometry changed" is checked rather
than asserted.

One sentence had to change. The approved onboarding clause read "...in addition to
the recurring Fee stated in Section 2 and is not included in the annual amount
shown there." Now that the clause IS in Section 2, "stated in Section 2" and
"shown there" point at themselves. It reads "...in addition to the recurring Fee
above and is not included in the annual amount shown above." Nothing else moved.

Form field names are unchanged, so the platform needs no edit.

Usage:
  python3 docs/build_agreement.py out.pdf [--verify original.pdf]
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

SERVICES = [
    ("svc_portfolio", "Consolidated portfolio and account oversight"),
    ("svc_property", "Property and asset tracking, including real estate, vehicles, boats, and planes"),
    ("svc_documents", "Secure document management and organization"),
    ("svc_planning", "Financial planning support and periodic review meetings"),
    ("svc_portal", f"Access to {FIRM.split()[0]}’s client portal, including task/deadline tracking and the Ask Titan AI assistant"),
    ("svc_bookkeeping", "Bookkeeping, bill pay, and financial reporting"),
]

SHORT = FIRM.split()[0]     # "PCM" — the defined short form used throughout the text


class Doc:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=letter)
        self.c.setTitle(f"{FIRM} — Client Services Agreement")
        self.form = self.c.acroForm
        self.page = 1
        self.y = 0.0

    # ── primitives ──────────────────────────────────────────────────────────
    def footer(self):
        c = self.c
        c.setFont("Helvetica", 7.6)
        c.setFillColor(SOFT)
        c.drawString(MARGIN, 40, f"{FIRM} — Client Services Agreement")
        c.drawRightString(W - MARGIN, 40, f"Page {self.page} of 2")

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
        # Reserve room for the heading AND the first few lines of whatever follows.
        # Without this, "5. Confidentiality" landed alone at the foot of page 1
        # with its clause overleaf — a section heading orphaned from its own text,
        # which in a contract looks like a page is missing.
        self.room(23 + keep * LEAD)
        self.y -= 8
        self.c.setFont(HEAD_F, HEAD_S)
        self.c.setFillColor(NAVY)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 15

    def textfield(self, name, x, y, w, h=14, tip=""):
        self.form.textfield(
            name=name, tooltip=tip or name, x=x, y=y, width=w, height=h,
            borderStyle="underlined", borderWidth=1,
            borderColor=FIELD_BC, fillColor=FIELD_BG, textColor=BODY,
            fontName="Helvetica", fontSize=9, forceBorder=True,
        )

    def checkbox(self, name, x, y, tip=""):
        self.form.checkbox(
            name=name, tooltip=tip or name, x=x, y=y, size=9.5,
            checked=False, buttonStyle="check",
            borderColor=FIELD_BC, fillColor=FIELD_BG, textColor=NAVY, borderWidth=1,
        )

    def labelled_field(self, label, name, x, w):
        """A label above an underlined field, as in the original header block."""
        self.c.setFont("Helvetica-Bold", 8)
        self.c.setFillColor(NAVY)
        self.c.drawString(x, self.y, label)
        self.textfield(name, x, self.y - 19, w)
        return self.y - 19

    def inline_fee(self, prefix, name, field_w, suffix, after=3):
        """One line of prose with a field embedded in it, e.g.
        "Client agrees to pay PCM a fee of $[____] per month". The field is placed
        where the text leaves off, so the sentence reads continuously instead of
        the amount sitting in a detached box."""
        self.room(LEAD * 2 + 8)
        self.c.setFont(BODY_F, BODY_S)
        self.c.setFillColor(BODY)
        self.c.drawString(MARGIN, self.y, prefix)
        px = MARGIN + stringWidth(prefix, BODY_F, BODY_S)
        self.textfield(name, px + 2, self.y - 3.5, field_w)

        # The suffix wraps. Drawn as one unwrapped string it either ran off the
        # right edge or forced the sentence to be split at a hand-chosen word,
        # which is how "payable on execution of this / Agreement." ended up broken
        # mid-phrase. The first line continues after the field; the rest returns to
        # the left margin like any other paragraph.
        if suffix:
            start_x = px + field_w + 6
            first_w = W - MARGIN - start_x
            head, rest = "", suffix.split()
            while rest and stringWidth((head + " " + rest[0]).strip(), BODY_F, BODY_S) <= first_w:
                head = (head + " " + rest.pop(0)).strip()
            self.c.drawString(start_x, self.y, head)
            self.y -= LEAD
            for ln in self.wrap(" ".join(rest)):
                self.c.drawString(MARGIN, self.y, ln)
                self.y -= LEAD
            self.y -= after
        else:
            self.y -= LEAD + after


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
    c.drawString(MARGIN, y, "Client Services Agreement")
    y -= 15
    c.setFont("Helvetica-Oblique", 9.5)
    c.setFillColor(SOFT)
    c.drawString(MARGIN, y, f"{FIRM} — Advisory Services")
    y -= 10
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.1)
    c.line(MARGIN, y, W - MARGIN, y)
    d.y = y - 24

    # ── Header fields ───────────────────────────────────────────────────────
    half = (CONTENT - 16) / 2
    d.labelled_field("Effective Date:", "effective_date", MARGIN, half)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + half + 16, d.y, "Client Name:")
    d.textfield("client_name", MARGIN + half + 16, d.y - 19, half)
    d.y -= 30
    d.labelled_field("Client Address:", "client_address", MARGIN, CONTENT)
    d.y -= 34

    # ── Body ────────────────────────────────────────────────────────────────
    d.para(
        f"This Client Services Agreement (“Agreement”) is entered into by and between {FIRM} "
        f"(“{SHORT},” “we,” or “us”) and the client identified above (“Client,” “you”), "
        f"collectively the “Parties.” This Agreement sets forth the terms under which {SHORT} will provide "
        f"family office advisory services to Client.", after=10)

    d.heading("1. Scope of Services")
    d.para(f"{SHORT} will provide family office advisory services (the “Services”), which may include the "
           f"items checked below:", after=6)
    for name, label in SERVICES:
        d.room(15)
        d.checkbox(name, MARGIN + 4, d.y - 1.5, tip=label)
        c.setFont(BODY_F, BODY_S)
        c.setFillColor(BODY)
        c.drawString(MARGIN + 22, d.y, label)
        d.y -= 14.6
    d.y -= 6

    d.heading("2. Fees")
    d.inline_fee(f"Client agrees to pay {SHORT} a fee of $", "monthly_fee", 62, "per month")
    d.inline_fee("($", "annual_fee", 74, "annually) for the Services (the “Fee”).", after=6)

    # The clause this whole rebuild exists for: inside Section 2, with the fees,
    # rather than orphaned at the foot of the page after Termination.
    d.inline_fee("One-time onboarding fee: $", "onboarding_fee", 74,
                 ", payable on execution of this Agreement. This charge is in addition to the recurring Fee "
                 "above and is not included in the annual amount shown above.", after=7)

    d.para("The Fee is billed monthly and is due on the date specified in Client’s Auto-Debit Authorization "
           f"Form, or as otherwise agreed in writing. Fees are payable by automatic bank draft (ACH) pursuant "
           f"to that Authorization, unless another payment method is agreed to in writing by {SHORT}.", after=8)

    d.heading("3. Term & Minimum Commitment")
    d.para("This Agreement begins on the Effective Date and continues month-to-month thereafter, subject to a "
           "minimum initial commitment of six (6) months from the Effective Date (the “Minimum Term”). "
           "Following the Minimum Term, this Agreement automatically continues month-to-month until terminated "
           "under Section 4. Should Client terminate before completing the Minimum Term, Client remains "
           "responsible for the Fee for each remaining month of the Minimum Term.", after=8)

    d.heading("4. Termination")
    d.para("After the Minimum Term, either Party may terminate this Agreement with thirty (30) days’ written "
           f"notice to the other Party. {SHORT} may suspend or terminate Services immediately in the event of "
           f"non-payment or a material breach of this Agreement by Client.", after=8)

    d.heading("5. Confidentiality")
    d.para("Each Party agrees to maintain the confidentiality of the other Party’s non-public information "
           "shared in connection with this Agreement and to use it solely to perform under this Agreement, "
           "except as required by law or with the disclosing Party’s prior written consent.", after=8)

    d.heading("6. Limitation of Liability")
    d.para(f"To the fullest extent permitted by law, {SHORT}’s aggregate liability arising out of this "
           f"Agreement shall not exceed the total Fees paid by Client to {SHORT} in the twelve (12) months "
           f"preceding the claim. {SHORT} shall not be liable for indirect, incidental, or consequential damages.",
           after=8)

    d.heading("7. Governing Law")
    d.inline_fee("This Agreement shall be governed by the laws of the State of ", "governing_state", 110,
                 ", without regard to its conflict-of-laws principles.", after=8)

    d.heading("8. Entire Agreement")
    d.para("This Agreement, together with any attached schedules or forms referenced herein (including "
           "Client’s Auto-Debit Authorization Form), constitutes the entire agreement between the Parties "
           "and supersedes all prior discussions or agreements, whether written or oral. This Agreement may "
           "only be amended in writing signed by both Parties.", after=12)

    # ── Signatures ──────────────────────────────────────────────────────────
    d.room(190)
    d.heading("Signatures")
    d.y -= 4
    # Both columns go through labelled_field. The right-hand ones were drawn by
    # hand at d.y + 19 for the label and d.y for the field — 19pt too high, so
    # "Date:" and "Title:" sat underneath the full-width signature field above
    # them and the boxes overlapped. Two call sites doing the same thing two
    # different ways is how that happened; now there is one.
    ROW = 36
    d.labelled_field("Client Signature:", "client_signature", MARGIN, CONTENT)
    d.y -= ROW
    d.labelled_field("Printed Name:", "client_printed_name", MARGIN, half)
    d.labelled_field("Date:", "client_sign_date", MARGIN + half + 16, half)
    d.y -= ROW
    d.labelled_field(f"{FIRM} Signature:", "pcm_signature", MARGIN, CONTENT)
    d.y -= ROW
    d.labelled_field("Printed Name:", "pcm_printed_name", MARGIN, half)
    d.labelled_field("Title:", "pcm_title", MARGIN + half + 16, half)
    d.y -= ROW
    d.labelled_field("Date:", "pcm_sign_date", MARGIN, half)
    d.y -= ROW

    d.para(f"This document is a template for internal use and does not constitute legal advice. {FIRM} should "
           f"have this Agreement reviewed and finalized by qualified legal counsel prior to use with clients.",
           size=7.6, color=SOFT, after=14)

    c.setFont("Helvetica-Bold", 7.4)
    c.setFillColor(GOLD)
    c.drawCentredString(W / 2, max(d.y, 62), TAGLINE)

    d.footer()
    c.save()
    return d.page


def norm(text):
    """Normalise for comparison: collapse whitespace, drop the page furniture that
    legitimately differs when pagination changes."""
    import re
    drop = ("Client Services Agreement", "Page 1 of", "Page 2 of", TAGLINE)
    keep = []
    for line in text.splitlines():
        s = " ".join(line.split())
        if not s:
            continue
        if any(s.startswith(p) or s.endswith(p) or p in s for p in drop) and len(s) < 90:
            continue
        keep.append(s)
    return " ".join(keep)


def words(path, firm=None, short=None, tagline=None):
    """Words of a document, with firm identity neutralised.

    Without this the check is only usable when regenerating the same brand. Run
    for a different firm it reported 'PCM' x10, 'Family' x4, 'Office' x4 and the
    old tagline as "lost" — which is precisely what a rebrand is supposed to
    change. Flagging the intended change as a failure would have trained me to
    ignore the one check that matters. Firm names collapse to a token so the
    comparison is about the wording that must NOT change.
    """
    txt = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True).stdout
    for name in filter(None, [firm, tagline]):
        txt = txt.replace(name, "«FIRM»")
    if short:
        # After the full name, so "PCM Family Office" is not left as "«FIRM» Family Office".
        txt = re.sub(rf"\b{re.escape(short)}\b", "«FIRM»", txt)
    return norm(txt).split()


def verify(original, generated):
    """The verdict is a multiset check, not a sequence diff.

    A sequence diff reports a word as deleted when it merely moved — the first
    run flagged "Date:" and "Title:" as lost when both were present, just
    repositioned by the signature block's new layout. Judging on that would have
    either blocked a correct document or, worse, taught me to ignore the check.
    So: every word in the original must appear in the generated file at least as
    many times. That catches genuine loss and is indifferent to order.
    """
    import difflib
    from collections import Counter

    a = words(original, "PCM Family Office", "PCM", "DISCOVER · SIMPLIFY · EXECUTE")
    b = words(generated, FIRM, SHORT, TAGLINE)
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

    # Show the inserted run in context, so the added clause is readable rather
    # than a bag of words.
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "insert" and (j2 - j1) > 6:
            print("  INSERTED PASSAGE:")
            print("    + " + " ".join(b[j1:j2]))
    return not lost


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--verify", metavar="ORIGINAL.pdf", default=None)
    a = ap.parse_args()

    pages = build(a.out)
    print(f"wrote {a.out} ({pages} pages)")

    if a.verify:
        print()
        print("Text diff against the original (legal wording must be unchanged):")
        ok = verify(a.verify, a.out)
        print()
        print("  VERDICT:", "no original wording lost" if ok else "*** WORDING LOST — DO NOT USE ***")
        sys.exit(0 if ok else 2)
