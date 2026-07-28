#!/usr/bin/env python3
"""Builds the onboarding checklist as a genuinely fillable PDF form.

Real AcroForm fields — checkboxes you click and text fields you type into, which
save with the file. Not lines to write on with a pen.

Content comes from sop-checklists.js via JSON, so this shares the single source of
truth with the three Word documents rather than being a fourth place the wording
can drift.
"""

import json, os, re, sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth

# One brand source, shared with the Word generators. Colours and the logo used to
# be restated here, which is how the wordmark ended up in Times-Bold flat navy
# while the platform used two-tone artwork.
HERE  = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "brand.json")) as _b:
    BRAND = json.load(_b)
_C    = BRAND["colors"]
LOGO  = os.path.abspath(os.path.join(HERE, os.environ.get("BRAND_LOGO", BRAND["logo"])))
if not os.path.exists(LOGO):
    sys.exit(f"brand logo not found at {LOGO}; refusing to fall back to typeset text")

NAVY  = HexColor("#" + _C["navy"])
GOLD = HexColor("#" + _C["gold"])
SOFT = HexColor("#" + _C["soft"])
BODY = HexColor("#" + _C["body"])
RED  = HexColor("#" + _C["red"])
LINE = HexColor("#" + _C["rule"])
FIELD = HexColor("#" + _C["field"])

W, H     = letter
M_L, M_R = 54, 54
M_T, M_B = 52, 54
CONTENT  = W - M_L - M_R

CHECKLIST_ID = sys.argv[1] if len(sys.argv) > 1 else "onboard-household"
OUT          = sys.argv[2] if len(sys.argv) > 2 else "TitanOS_Onboarding_Checklist_Fillable.pdf"

with open("checklists.json") as f:
    lists = json.load(f)
cl = next((l for l in lists if l["id"] == CHECKLIST_ID), None)
if cl is None:
    sys.exit(f"no checklist with id {CHECKLIST_ID}")

# Field names must be unique and stable: a duplicate name makes two checkboxes
# move together, which would silently corrupt a completed form.
def field_name(prefix, *parts):
    raw = "_".join(str(p) for p in parts)
    return prefix + "_" + re.sub(r"[^A-Za-z0-9]+", "_", raw).strip("_")[:48]

def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            if cur: lines.append(cur)
            cur = w_
    if cur: lines.append(cur)
    return lines

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle(f"TitanOS — {cl['title']}")
c.setAuthor("TitanOS")
c.setSubject("Internal operating checklist. Not for circulation.")

form = c.acroForm
state = {"y": 0, "page": 1, "boxes": 0, "fields": 0}

def footer():
    c.setStrokeColor(GOLD); c.setLineWidth(0.9)
    c.line(M_L, M_B - 12, W - M_R, M_B - 12)
    c.setFont("Helvetica", 7.6); c.setFillColor(SOFT)
    c.drawString(M_L, M_B - 24, "TitanOS  ·  Operating Checklist  ·  Internal — not for circulation")
    c.drawRightString(W - M_R, M_B - 24, f"Page {state['page']}")

def new_page():
    footer()
    c.showPage()
    state["page"] += 1
    state["y"] = H - M_T
    # Continuation marker, so a loose second sheet is identifiable.
    c.setFont("Helvetica-Bold", 8.5); c.setFillColor(SOFT)
    c.drawString(M_L, state["y"], f"{cl['title'].upper()}  ·  CONTINUED")
    state["y"] -= 20

def room(n):
    if state["y"] - n < M_B + 16:
        new_page()

# ── Masthead ────────────────────────────────────────────────────────────────
y = H - M_T
# Real artwork, scaled from its own pixel dimensions so it is never stretched.
_img = ImageReader(LOGO)
_px, _py = _img.getSize()
_lw = BRAND["logoWidthPtCompact"]
_lh = _lw * (_py / _px)
c.drawImage(LOGO, M_L, y - _lh + 9, width=_lw, height=_lh, mask="auto")
c.setFont("Helvetica-Bold", 6.4); c.setFillColor(GOLD)
c.drawString(M_L, y - _lh + 1, BRAND["tagline"].replace("", " ").strip())
c.setFont("Helvetica-Bold", 7.4); c.setFillColor(RED)
c.drawRightString(W - M_R, y + 2, "INTERNAL — NOT FOR CIRCULATION")
y -= _lh + 4
c.setStrokeColor(GOLD); c.setLineWidth(1.4)
c.line(M_L, y, W - M_R, y)
y -= 26

c.setFont("Times-Bold", 17); c.setFillColor(NAVY)
c.drawString(M_L, y, cl["title"])
y -= 15
c.setFont("Helvetica-Oblique", 8.8); c.setFillColor(SOFT)
for line in wrap(cl["when"], "Helvetica-Oblique", 8.8, CONTENT):
    c.drawString(M_L, y, line); y -= 11
y -= 8

# ── Header fields ───────────────────────────────────────────────────────────
def text_field(label, name, x, w, y, h=15):
    c.setFont("Helvetica-Bold", 6.4); c.setFillColor(SOFT)
    c.drawString(x, y + h + 3, label.upper())
    form.textfield(name=name, tooltip=label, x=x, y=y, width=w, height=h,
                   borderColor=FIELD, fillColor=HexColor("#FBFCFD"),
                   textColor=BODY, borderWidth=0.7, forceBorder=True,
                   fontName="Helvetica", fontSize=9.5)
    state["fields"] += 1

gap = 10
col = (CONTENT - gap * 3) / 4
for i, (label, nm) in enumerate([("Household", "household"), ("Titan Expert", "expert"),
                                 ("Completed by", "completed_by"), ("Date", "date")]):
    text_field(label, field_name("hdr", nm), M_L + i * (col + gap), col, y - 15)
y -= 40
# Hand the running position to the flow logic. Without this the first room()
# check measures against zero and forces an immediate, empty page break.
state["y"] = y

# ── Items ───────────────────────────────────────────────────────────────────
BOX, TXT_X, TXT_SIZE, LEAD = 10.5, 26, 9.2, 11.4
for gi, (heading, items) in enumerate(cl["groups"]):
    room(40)
    y = state["y"]
    c.setFont("Helvetica-Bold", 7.6); c.setFillColor(NAVY)
    c.drawString(M_L, y, heading.upper())
    y -= 4
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.line(M_L, y, W - M_R, y)
    y -= 14
    state["y"] = y

    for ii, item in enumerate(items):
        lines = wrap(item, "Helvetica", TXT_SIZE, CONTENT - TXT_X - 4)
        need = max(len(lines) * LEAD, BOX) + 6
        if state["y"] - need < M_B + 16:
            new_page()
            c.setFont("Helvetica-Bold", 7.6); c.setFillColor(NAVY)
            c.drawString(M_L, state["y"], heading.upper() + "  (cont.)")
            state["y"] -= 16
        y = state["y"]
        form.checkbox(name=field_name("chk", gi, ii),
                      tooltip=item[:120],
                      x=M_L, y=y - BOX + 1.5, size=BOX,
                      checked=False, buttonStyle="check",
                      borderColor=NAVY, fillColor=HexColor("#FFFFFF"),
                      textColor=NAVY, borderWidth=0.8)
        state["boxes"] += 1
        c.setFont("Helvetica", TXT_SIZE); c.setFillColor(BODY)
        for li, line in enumerate(lines):
            c.drawString(M_L + TXT_X, y - 8 - li * LEAD, line)
        state["y"] = y - need

# ── Notes and sign-off ──────────────────────────────────────────────────────
room(96)
y = state["y"] - 6
c.setFont("Helvetica-Bold", 7.6); c.setFillColor(NAVY)
c.drawString(M_L, y, "NOTES, EXCEPTIONS AND ANYTHING DELIBERATELY LEFT UNDONE")
y -= 4
c.setStrokeColor(LINE); c.setLineWidth(0.6)
c.line(M_L, y, W - M_R, y)
y -= 58
form.textfield(name=field_name("notes"), tooltip="Notes and exceptions",
               x=M_L, y=y, width=CONTENT, height=54,
               borderColor=FIELD, fillColor=HexColor("#FBFCFD"),
               textColor=BODY, borderWidth=0.7, forceBorder=True,
               fontName="Helvetica", fontSize=9, fieldFlags="multiline")
state["fields"] += 1
y -= 30

c.setFont("Helvetica-Oblique", 7.6); c.setFillColor(SOFT)
c.drawString(M_L, y + 12,
             "An item left unticked is a decision, not an oversight. Record why here.")
half = (CONTENT - 14) / 2
text_field("Reviewed by", field_name("hdr", "reviewed_by"), M_L, half, y - 15)
text_field("Review date", field_name("hdr", "review_date"), M_L + half + 14, half, y - 15)

footer()
c.save()

total_items = sum(len(items) for _, items in cl["groups"])
print(f"wrote {OUT}")
print(f"  {state['page']} page(s), {state['boxes']} checkboxes, {state['fields']} text fields")
if state["boxes"] != total_items:
    sys.exit(f"MISMATCH: {total_items} items in the model but {state['boxes']} checkboxes drawn")
print(f"  checkbox count matches the {total_items} items in the model")
