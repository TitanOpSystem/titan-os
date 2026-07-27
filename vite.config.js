import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// TitanOS is the product; every deployment (including PCM's own) is a white-label
// tenant that supplies its own branding via VITE_BRAND_* env vars.
//
// The <head> has to be branded at BUILD time, not run time: link-preview crawlers
// (iMessage, Slack, LinkedIn, WhatsApp) don't execute JavaScript, so they only
// ever see the static HTML. That's why these values can't come from the database
// the way the in-app branding does — a shared link previews as whatever the build
// baked in.
const TITANOS_DEFAULTS = {
  name: 'TitanOS',
  short: 'TitanOS',
  description: 'TitanOS — the private wealth operating system. White-label client portals, reporting, and AI concierge for advisory firms.',
  ogImage: '/titanos-og.png',
  primary: '#092b49',
  favicon: '/titanos-favicon.ico',
  favicon16: '/titanos-favicon-16x16.png',
  favicon32: '/titanos-favicon-32x32.png',
  appleIcon: '/titanos-apple-touch-icon.png',
  favicon192: '/titanos-favicon-192.png',
  favicon512: '/titanos-favicon-512.png',
}

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const pick = (key, fallback) => (env[key] && env[key].trim() ? env[key].trim() : fallback)

  const brand = {
    name: pick('VITE_BRAND_NAME', TITANOS_DEFAULTS.name),
    short: pick('VITE_BRAND_SHORT', TITANOS_DEFAULTS.short),
    description: pick('VITE_BRAND_DESCRIPTION', TITANOS_DEFAULTS.description),
    ogImage: pick('VITE_BRAND_OG_IMAGE', TITANOS_DEFAULTS.ogImage),
    primary: pick('VITE_BRAND_PRIMARY', TITANOS_DEFAULTS.primary),
    siteUrl: pick('VITE_BRAND_SITE_URL', ''),
    favicon: pick('VITE_BRAND_FAVICON', TITANOS_DEFAULTS.favicon),
    favicon16: pick('VITE_BRAND_FAVICON_16', TITANOS_DEFAULTS.favicon16),
    favicon32: pick('VITE_BRAND_FAVICON_32', TITANOS_DEFAULTS.favicon32),
    appleIcon: pick('VITE_BRAND_APPLE_ICON', TITANOS_DEFAULTS.appleIcon),
    favicon192: pick('VITE_BRAND_FAVICON_192', TITANOS_DEFAULTS.favicon192),
    favicon512: pick('VITE_BRAND_FAVICON_512', TITANOS_DEFAULTS.favicon512),
  }

  // Crawlers need an absolute og:image URL; a leading-slash path won't resolve
  // for them, so prefix it with the site URL when one is configured.
  const absoluteOg = /^https?:\/\//i.test(brand.ogImage)
    ? brand.ogImage
    : brand.siteUrl
      ? `${brand.siteUrl.replace(/\/$/, '')}${brand.ogImage}`
      : brand.ogImage

  return {
    plugins: [
      react(),
      {
        name: 'brand-html',
        // MUST run before Vite's own build-html pass. That pass calls decodeURI()
        // on every href/src it finds, so an unresolved token left inside an icon
        // href fails the whole build ("URI malformed"). Running 'pre' means the
        // attributes already hold real paths by the time Vite parses them.
        // Tokens also deliberately avoid % delimiters, which decodeURI would
        // read as percent-escapes.
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            const tokens = {
              __BRAND_NAME__: esc(brand.name),
              __BRAND_SHORT__: esc(brand.short),
              __BRAND_DESCRIPTION__: esc(brand.description),
              __BRAND_OG_IMAGE__: esc(absoluteOg),
              __BRAND_PRIMARY__: esc(brand.primary),
              __BRAND_FAVICON__: esc(brand.favicon),
              __BRAND_FAVICON_16__: esc(brand.favicon16),
              __BRAND_FAVICON_32__: esc(brand.favicon32),
              __BRAND_APPLE_ICON__: esc(brand.appleIcon),
              __BRAND_FAVICON_192__: esc(brand.favicon192),
              __BRAND_FAVICON_512__: esc(brand.favicon512),
            }
            const out = Object.entries(tokens).reduce(
              (acc, [token, value]) => acc.split(token).join(value),
              html,
            )
            // Fail loudly here rather than letting a typo'd token reach the
            // browser as literal text in a <title> or link preview.
            const missed = out.match(/__BRAND_[A-Z0-9_]*__/g)
            if (missed) throw new Error(`brand-html: unresolved tokens ${[...new Set(missed)].join(', ')}`)
            return out
          },
        },
      },
    ],
  }
})
