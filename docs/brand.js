// Shared brand identity for the Word document generators.
//
// Loads brand.json, resolves the logo artwork relative to it, and hands back a
// ready-made docx ImageRun. Every generator uses this rather than typesetting the
// wordmark, which is how the documents drifted into three different fonts.
//
// Fails loudly if the artwork is missing. A document that silently falls back to
// text would look almost right, which is worse than not building.

const fs = require("fs");
const path = require("path");
const { Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } = require("docx");

const HERE = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "brand.json"), "utf8"));

// Environment overrides, so the same generator can produce a document under a
// licensed firm's identity without editing the file.
const env = (k, fallback) => process.env[k] || fallback;

const NAME    = env("BRAND_NAME", cfg.name);
const TAGLINE = env("BRAND_TAGLINE", cfg.tagline);
const LOGO    = path.resolve(HERE, env("BRAND_LOGO", cfg.logo));
const MARK    = path.resolve(HERE, env("BRAND_MARK", cfg.mark));

if (!fs.existsSync(LOGO)) {
  throw new Error(
    `Brand logo not found at ${LOGO}\n` +
    `Set BRAND_LOGO or fix "logo" in docs/brand.json. Refusing to fall back to ` +
    `typeset text, which would look almost right and be wrong.`);
}

const C = cfg.colors;

// The artwork's own aspect ratio decides the height. Hard-coding a height is how
// a logo ends up subtly stretched across a document set.
function logoDimensions(widthPt, file) {
  const buf = fs.readFileSync(file || LOGO);
  // PNG: width and height are big-endian 32-bit ints at offsets 16 and 20.
  if (buf.slice(1, 4).toString() !== "PNG") {
    throw new Error(`Brand logo must be a PNG: ${file || LOGO}`);
  }
  const px = buf.readUInt32BE(16);
  const py = buf.readUInt32BE(20);
  return { width: Math.round(widthPt), height: Math.round(widthPt * (py / px)), px, py };
}

// Masthead used on every cover: the artwork, then the tagline as text beneath it.
// The tagline is deliberately NOT baked into the artwork — it was once, and the
// result was two taglines on the page, one from the image and one from the layout.
function masthead({ compact = false, align = AlignmentType.CENTER } = {}) {
  const w = compact ? cfg.logoWidthPtCompact : cfg.logoWidthPt;
  const d = logoDimensions(w);
  return [
    new Paragraph({
      alignment: align,
      spacing: { after: 40 },
      children: [new ImageRun({
        data: fs.readFileSync(LOGO),
        transformation: { width: d.width, height: d.height },
        altText: { title: NAME, description: `${NAME} logo`, name: NAME },
      })],
    }),
    new Paragraph({
      alignment: align,
      spacing: { after: compact ? 60 : 90 },
      children: [new TextRun({
        text: TAGLINE.split("").join(" ").replace(/\s{3,}/g, "   "),
        size: 15, color: C.gold, font: "Calibri", bold: true,
      })],
    }),
  ];
}

module.exports = {
  NAME, TAGLINE, LOGO, MARK, colors: C, cfg,
  logoDimensions, masthead,
  logoBuffer: () => fs.readFileSync(LOGO),
};
