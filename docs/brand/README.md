# TitanOS brand assets

Everything here is generated. `docs/brand_kit.py` holds the palette, the tagline and the lockup
geometry, and is the single source; the generators read from it. **Regenerate, do not hand-edit.**

```bash
python3 docs/build_logo_assets.py      # the marks
python3 docs/build_brand_sheet.py      # TitanOS_Brand_Sheet.pdf
python3 docs/build_ria_value_onepager.py   # TitanOS_RIA_Value.pdf
python3 docs/build_sales_onepager.py       # TitanOS_Sales_OnePager.pdf
```

## The kit — August 2026

| | Hex | Use | On white |
|---|---|---|---|
| Navy | `#0a2540` | Headings, body text, filled panels | 15.54:1 |
| Gold | `#c9a961` | **Accent only.** Rules, the `OS`, top borders | **2.25:1** |
| Slate | `#3f5470` | Tagline on light, supporting copy | 7.74:1 |
| Mist | `#cbd5e1` | Tagline on dark **only** | 1.48:1 |

Gold measures **2.25:1 on white**. That is unreadable and it is the single most likely way to misuse
this palette — it has already been got wrong twice in this product. Gold is for rules, the `OS` in
the wordmark and top borders. Never body text. On the brand navy it measures 6.90:1 and is fine.

Tagline: **PRIVATE WEALTH ADMINISTRATION**, always in capitals, never re-punctuated.

## Files

| File | What it is |
|---|---|
| `TitanOS_Logo_Primary.svg` / `.png` | Navy + gold on transparent. Light backgrounds. **The SVG is the master.** |
| `TitanOS_Logo_Reversed.svg` / `.png` | White + gold on transparent. The brand navy or darker only. |
| `TitanOS_Mark.png` | Standalone mark. **Derived, not in the kit** — see below. |
| `titanos-logo-full.png` | Legacy name for the primary lockup. `App.jsx` and `brand_profiles.logo_url` use this path. |
| `titanos-logo-knockout.png` | Legacy name for the reversed lockup. |
| `titanos-mark.png` | Legacy name for the derived mark. |

The legacy filenames are regenerated from the current kit, not left behind. `src/App.jsx` falls back
to `/titanos-logo-full.png` and `/titanos-mark.png`, and those files are copied into `public/`, so
the deployed app and the `logo_url` on the brand record both serve the new marks after a deploy.

## Two things the kit does not settle

**Georgia.** The kit specifies Georgia for the wordmark. Georgia ships with macOS and Windows but
not with Linux, and it is not one of the fourteen fonts a PDF reader is guaranteed to have — so
nothing rendered server-side can use it, including the edge functions that email client-facing PDFs.
The SVGs declare `Georgia, 'Times New Roman', serif` and render in Georgia wherever a human is
looking. Server-rendered PDFs, and the PNGs generated here on Linux, come out in Times-Bold — the
kit's own second choice. Georgia and Times are not identical: Georgia has a larger x-height and
non-lining figures. **If the PNGs must match the SVGs exactly, regenerate them on a Mac.** The
alternative worth considering is picking a serif that is available everywhere.

**There is no standalone mark in the kit.** It delivers two lockups and nothing for a favicon, an
avatar or a collapsed sidebar, all of which the product needs. `TitanOS_Mark.png` keeps the previous
mark's structure — rounded navy square, gold `T`, small `OS` — in the new colours. It is derived,
it is labelled as derived on the brand sheet, and it should not be cited as spec.

## Where the brand actually comes from at runtime

The app reads `brand_profiles` on every load, so the palette and tagline above are also stored on the
`TitanOS (default)` row and were updated to this kit. Changing that row re-skins the app with no
redeploy. Note the demo project currently has **Instrumental Wealth** as the active brand — the
TitanOS row is configured but not live.
