#!/usr/bin/env python3
"""Replaces the firm logo inside an existing PDF, leaving everything else alone.

WHEN THIS IS THE RIGHT TOOL — AND WHEN IT IS NOT
------------------------------------------------
Only for documents that carry a firm's logo and NO firm name in their text. The
Personal Financial Statement (436 form fields) and the Lifestyle Expense
Worksheet (167) are large blank worksheets; regenerating them from scratch is not
worth the risk, and both contain zero occurrences of the firm's name, so swapping
the logo genuinely rebrands them.

It is the WRONG tool for the Client Services Agreement, the ACH authorisation, the
data checklist or the wire instructions. Those name the firm in their wording, so
a logo swap would produce a document wearing one firm's mark and another firm's
name — worse than leaving the tile disabled. Those have generators instead.

The script refuses if it finds the outgoing firm's name in the text, which is what
stops it being pointed at the wrong document by mistake.

HOW THE SWAP WORKS
------------------
The logo is a JPEG XObject. Its stream is replaced with a new JPEG of identical
pixel dimensions, so every placement, scale and position in the content stream
stays valid and nothing needs to move. The incoming logo is letterboxed onto a
canvas of the original's exact size rather than stretched to fit — a squashed
wordmark is the most obvious possible sign of an automated rebrand.

Usage:
  python3 docs/rebrand_pdf.py in.pdf out.pdf --logo new.png \\
      [--forbid "PCM"] [--accent "#1E3A5F"]
"""

import argparse
import io
import sys
import subprocess

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject, NumberObject
from PIL import Image


def page_text(path):
    return subprocess.run(["pdftotext", path, "-"], capture_output=True, text=True).stdout


def find_images(reader):
    """Every JPEG XObject on every page, with its dimensions."""
    found = []
    for pno, page in enumerate(reader.pages):
        xo = (page.get("/Resources") or {}).get("/XObject") or {}
        for key in xo:
            obj = xo[key].get_object()
            if obj.get("/Subtype") == "/Image":
                found.append((pno, str(key), int(obj["/Width"]), int(obj["/Height"]), obj))
    return found


def letterbox(logo_path, w, h, bg=(255, 255, 255)):
    """The new logo, centred on a canvas of exactly (w, h), aspect preserved.

    JPEG has no alpha channel, so a transparent PNG is composited onto a solid
    background first. Left as-is, transparency renders black and the logo appears
    on a dark slab.
    """
    src = Image.open(logo_path).convert("RGBA")
    canvas = Image.new("RGB", (w, h), bg)
    scale = min(w / src.width, h / src.height)
    nw, nh = max(1, int(src.width * scale)), max(1, int(src.height * scale))
    resized = src.resize((nw, nh), Image.LANCZOS)
    flat = Image.new("RGB", (nw, nh), bg)
    flat.paste(resized, (0, 0), resized)
    canvas.paste(flat, ((w - nw) // 2, (h - nh) // 2))
    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=95, subsampling=0)
    return buf.getvalue()


def solid(w, h, hex_colour):
    s = hex_colour.lstrip("#")
    rgb = tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
    buf = io.BytesIO()
    Image.new("RGB", (w, h), rgb).save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--logo", required=True, help="Full wordmark, for landscape logo boxes.")
    ap.add_argument("--mark", default=None, help="Bare emblem, for portrait/square boxes. Falls back to --logo.")
    ap.add_argument("--forbid", default=None,
                    help="Refuse if this appears in the PDF text (e.g. the outgoing firm's name).")
    ap.add_argument("--accent", default=None,
                    help="Recolour any wide solid banner to this hex colour.")
    ap.add_argument("--min-logo-px", type=int, default=8000,
                    help="Ignore images smaller than this in area; they are rules and icons, not logos.")
    a = ap.parse_args()

    # ── Refuse the documents this tool must not be used on ────────────────────
    if a.forbid:
        text = page_text(a.src)
        hits = text.count(a.forbid)
        if hits:
            sys.exit(
                f"REFUSING: {a.forbid!r} appears {hits} time(s) in this document's text.\n"
                f"Swapping the logo would leave {a.forbid}'s name on a document wearing another firm's mark.\n"
                f"This document needs a generator, not a logo swap.")

    reader = PdfReader(a.src)
    images = find_images(reader)
    if not images:
        sys.exit("No images found — nothing to rebrand.")

    # The logo is the largest image that is not a wide thin banner. Banners are
    # decorative rules; identifying them by aspect ratio rather than by index
    # means this does not depend on the order objects happen to appear in.
    def is_banner(w, h):
        return w / max(h, 1) > 6.0

    candidates = [(p, k, w, h, o) for (p, k, w, h, o) in images
                  if w * h >= a.min_logo_px and not is_banner(w, h)]
    if not candidates:
        sys.exit(f"No logo-shaped image found (largest was "
                 f"{max((w*h for _,_,w,h,_ in images))}px). Nothing replaced.")

    writer = PdfWriter(clone_from=reader)
    swapped, recoloured = [], []

    for pno, page in enumerate(writer.pages):
        xo = (page.get("/Resources") or {}).get("/XObject") or {}
        for key in list(xo.keys()):
            obj = xo[key].get_object()
            if obj.get("/Subtype") != "/Image":
                continue
            w, h = int(obj["/Width"]), int(obj["/Height"])

            if any(k == str(key) and p == pno for p, k, _, _, _ in candidates):
                # Two different assets appear in these documents: the full
                # wordmark on the cover, and the bare emblem on later pages. The
                # PFS carries a 501x207 wordmark on page 1 and a 409x501 portrait
                # emblem on pages 2-3. Letterboxing the wide wordmark into that
                # portrait box left it floating and half-size, so the source is
                # chosen by the shape of the box it has to fill.
                src = a.logo if (w / max(h, 1)) >= 1.6 else (a.mark or a.logo)
                data = letterbox(src, w, h)
                obj._data = data
                obj[NameObject("/Filter")] = NameObject("/DCTDecode")
                obj[NameObject("/ColorSpace")] = NameObject("/DeviceRGB")
                obj[NameObject("/BitsPerComponent")] = NumberObject(8)
                if "/SMask" in obj:
                    del obj["/SMask"]          # the old mask describes the old artwork
                if "/DecodeParms" in obj:
                    del obj["/DecodeParms"]
                swapped.append(f"p{pno}{key} {w}x{h}")

            elif a.accent and is_banner(w, h) and w * h >= 2000:
                obj._data = solid(w, h, a.accent)
                obj[NameObject("/Filter")] = NameObject("/DCTDecode")
                obj[NameObject("/ColorSpace")] = NameObject("/DeviceRGB")
                obj[NameObject("/BitsPerComponent")] = NumberObject(8)
                recoloured.append(f"p{pno}{key} {w}x{h}")

    with open(a.out, "wb") as fh:
        writer.write(fh)

    before = len(reader.get_fields() or {})
    after = len(PdfReader(a.out).get_fields() or {})

    print(f"wrote {a.out}")
    print(f"  logo replaced   : {', '.join(swapped) or 'none'}")
    print(f"  banner recoloured: {', '.join(recoloured) or 'none'}")
    print(f"  form fields     : {before} before, {after} after "
          f"{'(unchanged)' if before == after else '*** CHANGED ***'}")
    if before != after:
        sys.exit("Field count changed — refusing to call this a success.")


if __name__ == "__main__":
    main()
