# TitanOS brand assets

Drop-in folder for other projects. `TitanOS_Brand_Sheet.pdf` is the reference page;
the three PNGs beside it are the marks it describes.

## Regenerating the sheet

    python3 docs/build_brand_sheet.py docs/brand/TitanOS_Brand_Sheet.pdf --assets public

Every colour on the sheet is the value recorded on the TitanOS row of `brand_profiles`,
and the contrast ratios are computed at build time rather than typed in. If a colour
changes in the record, regenerate — do not edit the PDF, or the sheet will start
disagreeing with the running product, which is worse than having no sheet because
somebody will trust it.

## The one rule that keeps getting broken

The gold measures **1.97:1 on white**. That is not a stylistic preference — it is below
the 4.5:1 needed for body text and it disappears on a projector. It carries text only in
reverse, at 7.33:1 on navy. This has already been got wrong twice in this product: gold
body text in the pitch deck, and Accurate's #b6c1de at 1.6:1.

## White label

TitanOS is the platform. A licensed firm's clients see that firm's brand, never this one.
These assets are for the platform's own materials — the site, decks, contracts, and
anything addressed to a prospective firm.
