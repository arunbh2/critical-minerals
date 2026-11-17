// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The served origin and base path are set centrally here.
// CI passes the values GitHub Pages reports (actions/configure-pages),
// so the same build works for https://OWNER.github.io/REPO/ and,
// later, for https://criticalminerals.org/ at the domain root.
const site = process.env.SITE_URL || 'https://arunbh2.github.io';
const rawBase = process.env.BASE_PATH ?? '/critical-minerals';
const base = rawBase === '' || rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}/`;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // Inline CSS so the first render is not blocked by a stylesheet request.
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
