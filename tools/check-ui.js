#!/usr/bin/env node
// Browser checks on the built site (WCAG 2.2 AA):
// - Target size (2.5.8): interactive controls are at least 24x24 CSS px. Links inside
//   running text are exempt, as WCAG allows.
// - Reflow (1.4.10) with resized text (1.4.4): at 320px wide and 200% text, no page
//   scrolls sideways (data tables may scroll inside their own container).
// - Reduced motion: with prefers-reduced-motion, no element keeps a transition or animation.
import { chromium } from 'playwright';
import { start } from '../tests/e2e/pages-server.mjs';

const PORT = Number(process.env.PORT ?? 4340);
const BASE = (process.env.BASE_PATH ?? '/critical-minerals').replace(/\/$/, '') + '/';
const PAGES = ['', 'start-here/', 'learn/the-lifecycle/', 'countries/india/', 'minerals/nickel/', 'issues/decent-work-safety/', 'finance/', 'policies/', 'landscape/', 'practice/india-district-mineral-foundations/', 'tools/community-benefit/', 'search/', 'sources/', 'for-ai/', 'use-with-ai/', 'cite/', 'growing/', 'about/', 'funding/', 'funding/funders/', 'funding/programmes/', 'funding/programmes/fair-focus-on-trade/', 'funding/awards/', 'funding/awards/fcdo-nrgi-emerge/', 'funding/opportunities/', 'opportunities/eiti-kazakhstan-independent-administrator-2026/', 'organisations/rvo/', 'careers/', 'careers/pathways/', 'careers/pathways/finance-partnerships/', 'careers/transition/', 'careers/employers/', 'careers/opportunities/', 'careers/explorer/', 'evidence/', 'methodology/'];
const server = await start(PORT);
const browser = await chromium.launch();
const errors = [];

const targetCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const mobileCtx = await browser.newContext({ viewport: { width: 360, height: 780 } });
for (const [label, ctx] of [['1280px', targetCtx], ['360px', mobileCtx]]) {
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(`http://127.0.0.1:${PORT}${BASE}${p}`);
    const small = await page.evaluate(() => {
      const inText = (el) => !!el.closest('p, li p, dd, td, .claim-list li, .prose li, .page-prose li, blockquote, figcaption, .meta, .standfirst');
      const out = [];
      for (const el of document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="tab"]')) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
        if (el.matches('a') && inText(el)) continue;
        if (el.matches('.skip-link') && r.top < 0) continue;
        if (r.width < 24 || r.height < 24) out.push(`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} "${(el.textContent || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return out;
    });
    for (const s of small) errors.push(`${p || 'home'} at ${label}: target ${s} is under 24x24 px. Fix: give it min-height/min-width 24px (or more padding).`);
  }
  await page.close();
}

// Reflow at 320px with 200% text.
const reflow = await browser.newContext({ viewport: { width: 320, height: 640 } });
const rp = await reflow.newPage();
for (const p of PAGES) {
  await rp.goto(`http://127.0.0.1:${PORT}${BASE}${p}`);
  await rp.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const sw = await rp.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 320) {
    const culprit = await rp.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 322 && !e.closest('.table-wrap')).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`).join(', '));
    errors.push(`${p || 'home'}: scrolls sideways at 320px with 200% text (width ${sw}px; widest: ${culprit}). Fix: allow wrapping (overflow-wrap:anywhere, flex-wrap, min-width:0).`);
  }
}

// Reduced motion.
const rm = await browser.newContext({ reducedMotion: 'reduce' });
const mp = await rm.newPage();
await mp.goto(`http://127.0.0.1:${PORT}${BASE}`);
const moving = await mp.evaluate(() => [...document.querySelectorAll('a, .btn, body *')].filter((e) => { const c = getComputedStyle(e); return parseFloat(c.transitionDuration) > 0.01 || (c.animationName !== 'none' && parseFloat(c.animationDuration) > 0.01); }).length);
if (moving) errors.push(`home: ${moving} element(s) still animate with prefers-reduced-motion: reduce. Fix: the reduced-motion rule in src/styles/global.css.`);

await browser.close();
server.close();
if (errors.length) { console.error(`UI check failed (${errors.length}):\n- ${[...new Set(errors)].join('\n- ')}`); process.exit(1); }
console.log(`UI check passed: ${PAGES.length} pages; targets ≥ 24px at 1280px and 360px; reflow at 320px with 200% text; reduced motion respected.`);
