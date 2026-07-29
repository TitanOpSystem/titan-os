#!/usr/bin/env python3
"""Adds an `onboarding_fee` form field to the Client Services Agreement template.

WHY THIS IS A SCRIPT AND NOT A HAND EDIT
----------------------------------------
The agreement's fee sits inside prose — "Client agrees to pay PCM a fee of
$[monthly_fee] per month ($[annual_fee] annually) for the Services" — with no gap
to insert a third figure into. Reflowing a paragraph in a finished PDF is not
something to do by hand and get subtly wrong, so the new figure goes in the blank
lower third of page 1 as an explicitly labelled clause, and the placement is
computed from the existing text rather than eyeballed.

WHAT IT DOES NOT DO
-------------------
It does not decide the wording. The CLAUSE text below is a minimal, factual
draft; it is language in an agreement a client signs and should be replaced with
whatever the firm's counsel approves. Pass --clause to override it.

The new field clones monthly_fee's exact appearance — same /DA, same underline
border, same background — so it is visually indistinguishable from the fields
already on the form rather than looking bolted on.

Usage:
  python3 docs/add_onboarding_fee_field.py in.pdf out.pdf [--clause "..."]
"""

import sys
import argparse
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    DictionaryObject, NameObject, TextStringObject, NumberObject,
    ArrayObject, FloatObject, BooleanObject,
)
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from io import BytesIO

HEADING = "ONBOARDING FEE"
CLAUSE_1 = "One-time onboarding fee: $"
CLAUSE_2 = ("payable on execution of this Agreement. This charge is in addition to the recurring Fee "
            "stated in Section 2 and is not included in the annual amount shown there.")

NAVY = Color(0.035, 0.169, 0.286)      # 092B49
BODY = Color(0.118, 0.161, 0.231)
FIELD_W, FIELD_H = 90, 14


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--clause", default=None,
                    help="Replace the trailing clause sentence with the firm's own wording.")
    a = ap.parse_args()

    clause_tail = a.clause if a.clause is not None else CLAUSE_2

    reader = PdfReader(a.src)
    page = reader.pages[0]
    pw = float(page.mediabox.width)
    ph = float(page.mediabox.height)

    # ── Find the existing fee field, to copy its look and its left margin ──────
    template = None
    for ref in (page.get("/Annots") or []):
        o = ref.get_object()
        if str(o.get("/T")) == "monthly_fee":
            template = o
            break
    if template is None:
        sys.exit("monthly_fee not found — is this the Client Services Agreement?")
    if any(str(r.get_object().get("/T")) == "onboarding_fee" for r in (page.get("/Annots") or [])):
        sys.exit("onboarding_fee already present; nothing to do.")

    # ── Find the bottom of the existing text, so nothing is overlaid ──────────
    # Measured from the content rather than assumed: the clause is placed below
    # the last line on the page, and the script refuses if there isn't room.
    # The usable space is the largest GAP between lines, not the area below the
    # lowest line — the lowest line is the footer, and measuring from it put the
    # clause off the bottom of the page. The guard below caught that, which is why
    # it exists.
    import pdfplumber
    with pdfplumber.open(a.src) as pdf:
        words = pdf.pages[0].extract_words()

    tops = sorted({round(float(w["top"]), 1) for w in words})
    bottoms = {t: max(float(w["bottom"]) for w in words if round(float(w["top"]), 1) == t) for t in tops}

    best = None                                   # (gap_size, body_ends_at, next_line_top)
    for t, nxt in zip(tops, tops[1:]):
        gap = nxt - bottoms[t]
        if best is None or gap > best[0]:
            best = (gap, bottoms[t], nxt)
    gap_size, body_ends_top, next_top = best

    # Convert to PDF coordinates (origin bottom-left).
    band_top_y = ph - body_ends_top          # just under the last body line
    band_bottom_y = ph - next_top            # just above the following line (the footer)

    left = 60.0                              # matches annual_fee's left margin
    needed = 62
    if gap_size < needed + 24:
        sys.exit(f"Largest clear band on page 1 is {gap_size:.0f}pt; need about {needed + 24}pt. "
                 f"Refusing to overlay existing text.")

    top_y = band_top_y - 26                  # breathe below the paragraph above
    if top_y - needed < band_bottom_y + 12:
        sys.exit(f"Clause would come within 12pt of the footer. Refusing.")

    # ── Draw the clause ───────────────────────────────────────────────────────
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(pw, ph))

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(left, top_y, HEADING)

    y = top_y - 19
    c.setFillColor(BODY)
    c.setFont("Helvetica", 9)
    c.drawString(left, y, CLAUSE_1)
    lead_w = c.stringWidth(CLAUSE_1, "Helvetica", 9)

    # The comma and the rest of the sentence resume after the field.
    after_x = left + lead_w + FIELD_W + 3
    c.drawString(after_x, y, ",")

    # Wrap the tail beneath.
    max_w = pw - left - 60
    words_out, line, lines = clause_tail.split(), "", []
    for w in words_out:
        trial = (line + " " + w).strip()
        if c.stringWidth(trial, "Helvetica", 9) <= max_w:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    ty = y - 13
    for ln in lines:
        c.drawString(left, ty, ln)
        ty -= 11

    c.save()
    buf.seek(0)

    overlay = PdfReader(buf).pages[0]

    # ── Add the field, cloned from monthly_fee ────────────────────────────────
    rect_y = y - 3
    field = DictionaryObject()
    field.update({
        NameObject("/Type"): NameObject("/Annot"),
        NameObject("/Subtype"): NameObject("/Widget"),
        NameObject("/FT"): NameObject("/Tx"),
        NameObject("/T"): TextStringObject("onboarding_fee"),
        NameObject("/TU"): TextStringObject("One-time onboarding fee"),
        NameObject("/V"): TextStringObject(""),
        NameObject("/DV"): TextStringObject(""),
        NameObject("/Ff"): NumberObject(0),
        NameObject("/F"): NumberObject(4),
        NameObject("/DA"): TextStringObject(str(template.get("/DA"))),
        NameObject("/Rect"): ArrayObject([
            FloatObject(left + lead_w), FloatObject(rect_y),
            FloatObject(left + lead_w + FIELD_W), FloatObject(rect_y + FIELD_H),
        ]),
    })
    for key in ("/BS", "/MK", "/Q"):
        if key in template:
            field[NameObject(key)] = template.raw_get(key)

    # Build the writer FIRST, then merge onto ITS page. Merging onto the reader's
    # page and cloning afterwards lost the overlay's font resources — the merged
    # content stream referenced F1-0/F2-0 which resolved to nothing, and the whole
    # page failed to render with "Unknown font tag". The writer has to own the
    # merged resources.
    writer = PdfWriter(clone_from=reader)
    wpage = writer.pages[0]
    wpage.merge_page(overlay)

    ref = writer._add_object(field)
    field[NameObject("/P")] = wpage.indirect_reference
    if "/Annots" in wpage:
        wpage["/Annots"].append(ref)
    else:
        wpage[NameObject("/Annots")] = ArrayObject([ref])

    acro = writer._root_object["/AcroForm"]
    acro["/Fields"].append(ref)
    # Deliberately NOT setting /NeedAppearances. Doing so made viewers regenerate
    # every field's appearance, including the six service checkboxes, whose glyphs
    # need ZapfDingbats — and this form's /DR declares only /Helv. The result was
    # six "Unknown font tag 'ZaDb'" errors on a page that had rendered cleanly
    # before. The platform calls pdf-lib's updateFieldAppearances() when it fills
    # the form, so appearance streams are built there and the flag buys nothing.

    with open(a.out, "wb") as fh:
        writer.write(fh)

    print(f"wrote {a.out}")
    print(f"  clause placed at y={top_y:.0f} inside a {gap_size:.0f}pt clear band (y {band_bottom_y:.0f}..{band_top_y:.0f})")
    print(f"  field rect x={left + lead_w:.0f}..{left + lead_w + FIELD_W:.0f} y={rect_y:.0f}..{rect_y + FIELD_H:.0f}")
    print(f"  cloned appearance from monthly_fee: {template.get('/DA')}")


if __name__ == "__main__":
    main()
