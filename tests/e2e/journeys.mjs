// End-to-end journeys against the production build, served the way GitHub
// Pages serves a project site (under /REPO/). Run after `npm run build`.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { start } from './pages-server.mjs';

const PORT = Number(process.env.PORT ?? 4323);
process.env.PORT = String(PORT);
const BASE = (process.env.BASE_PATH ?? '/critical-minerals').replace(/\/$/, '') + '/';
const ORIGIN = process.env.E2E_ORIGIN ?? `http://127.0.0.1:${PORT}`;
const U = (p = '') => `${ORIGIN}${BASE}${p}`;

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); console.log(`PASS  ${name}`); }
  catch (e) { results.push(['FAIL', name, e.message]); console.log(`FAIL  ${name}\n      ${e.message.split('\n')[0]}`); }
}

const server = process.env.E2E_ORIGIN ? null : await start(PORT);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

await step('Nested country page opens directly under the repository path', async () => {
  const res = await page.goto(U('countries/indonesia/'));
  assert.equal(res.status(), 200);
  assert.equal(await page.locator('h1').innerText(), 'Indonesia');
  assert.ok(await page.locator('text=What we know').count());
});

await step('Nested page survives a refresh', async () => {
  const res = await page.reload();
  assert.equal(res.status(), 200);
  assert.equal(await page.locator('h1').innerText(), 'Indonesia');
});

await step('Logo renders and the favicon, touch icon and manifest load', async () => {
  const logo = page.locator('.site-logo');
  const ok = await logo.evaluate((img) => img.complete && img.naturalWidth > 0);
  assert.ok(ok, 'masthead logo did not load');
  assert.match(await logo.evaluate((img) => img.currentSrc), new RegExp(`${BASE}brand/logo-primary\\.svg$`));
  for (const sel of ['link[rel="icon"][type="image/svg+xml"]', 'link[rel="icon"][sizes]', 'link[rel="apple-touch-icon"]', 'link[rel="manifest"]']) {
    const href = await page.locator(sel).first().getAttribute('href');
    assert.ok(href.startsWith(BASE), `${sel} href ${href} lacks base path`);
    const r = await page.request.get(ORIGIN + href);
    assert.equal(r.status(), 200, `${href} returned ${r.status()}`);
  }
});

await step('Logo link returns home', async () => {
  await page.locator('.logo-link').click();
  await page.waitForLoadState();
  assert.equal(new URL(page.url()).pathname, BASE);
  assert.match(await page.locator('h1').innerText(), /Lasting benefits/);
});

await step('Search returns results whose links stay under the base path', async () => {
  await page.goto(U('search/?q=nickel'));
  await page.waitForSelector('#search-results li', { timeout: 10000 });
  const n = await page.locator('#search-results li').count();
  assert.ok(n > 0);
  const href = await page.locator('#search-results li a').first().getAttribute('href');
  assert.ok(href.startsWith(BASE), `result link ${href}`);
  await page.locator('#search-results li a').first().click();
  await page.waitForLoadState();
  assert.equal((await page.request.get(page.url())).status(), 200);
});

await step('Search handles no results with guidance', async () => {
  await page.goto(U('search/?q=zzqqxxnotaword'));
  await page.waitForFunction(() => /No results/.test(document.getElementById('search-status')?.textContent ?? ''));
  assert.ok(await page.locator('#all-pages').isVisible());
});

await step('Search type filter narrows results and lives in the URL', async () => {
  await page.goto(U('search/?q=india&type=Policy+record'));
  await page.waitForSelector('#search-results li');
  const kinds = await page.locator('#search-results li .kicker').allInnerTexts();
  assert.ok(kinds.length > 0 && kinds.every((k) => /policy record/i.test(k)), kinds.join(','));
});

await step('Finance filters reflect the URL, survive reload and back/forward', async () => {
  await page.goto(U('finance/?supports=governance'));
  const visible = () => page.locator('tbody tr:not([hidden])').count();
  const govCount = await visible();
  assert.ok(govCount > 0 && govCount < 5, `governance count ${govCount}`);
  assert.equal(await page.locator('#f-supports').inputValue(), 'governance');
  await page.reload();
  assert.equal(await visible(), govCount);
  await page.selectOption('#f-country', 'indonesia');
  assert.match(page.url(), /country=indonesia/);
  const both = await visible();
  assert.ok(both <= govCount);
  await page.goBack();
  assert.equal(await page.locator('#f-country').inputValue(), '');
  assert.equal(await visible(), govCount);
});

await step('Empty filter result explains itself and offers a reset', async () => {
  await page.goto(U('finance/?state=open'));
  assert.equal(await page.locator('tbody tr:not([hidden])').count(), 0);
  const empty = page.locator('[data-filter-empty]');
  assert.ok(await empty.isVisible());
  assert.match(await empty.innerText(), /Record state: Open opportunity/);
  await empty.locator('[data-filter-reset]').click();
  assert.equal(await page.locator('tbody tr:not([hidden])').count(), 5);
  assert.equal(new URL(page.url()).search, '');
});

await step('No finance record is presented as an open opportunity', async () => {
  await page.goto(U('finance/'));
  const labels = await page.locator('[data-access-status]').allInnerTexts();
  assert.ok(labels.every((l) => !/^Open/.test(l)), labels.join(' | '));
});

await step('Worksheet: keyboard-only journey, inline error, export Markdown and JSON', async () => {
  await page.goto(U('tools/community-benefit/'));
  await page.locator('#ws-place').focus();
  await page.keyboard.type('Example district');
  // Continue without the required activity: a written error beside the field.
  await page.locator('fieldset[data-step="place"] [data-continue]').focus();
  await page.keyboard.press('Enter');
  const err = page.locator('#err-activity');
  assert.ok(await err.isVisible(), 'error not shown');
  assert.match(await err.innerText(), /activity/i);
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'ws-activity');
  await page.keyboard.type('Proposed processing plant');
  await page.keyboard.press('Tab'); // to affected groups
  await page.keyboard.type('Fishing households; contract workers');
  await page.locator('fieldset[data-step="place"] [data-continue]').focus();
  await page.keyboard.press('Enter');
  for (const id of ['participation', 'livelihoods', 'workers', 'environment', 'accountability', 'questions']) {
    const fs = page.locator(`fieldset[data-step="${id}"]`);
    await fs.waitFor({ state: 'visible' });
    if (id === 'participation') { await page.locator('#ws-participation_documented').focus(); await page.keyboard.type('Public hearing minutes (March).'); }
    await fs.locator('[data-continue]').focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('#ws-summary').waitFor({ state: 'visible' });
  assert.match(await page.locator('#ws-summary').innerText(), /User-entered material/);
  const [md] = await Promise.all([page.waitForEvent('download'), page.locator('#dl-md').click()]);
  assert.match(md.suggestedFilename(), /^community-benefit-example-district-\d{4}-\d{2}-\d{2}\.md$/);
  const mdText = await readFile(await md.path(), 'utf8');
  assert.match(mdText, /Public hearing minutes/);
  assert.match(mdText, /entered by the user/);
  const [js] = await Promise.all([page.waitForEvent('download'), page.locator('#dl-json').click()]);
  const json = JSON.parse(await readFile(await js.path(), 'utf8'));
  assert.equal(json.score, null);
  assert.equal(json.place, 'Example district');
});

await step('Worksheet drafts are opt-in and deletable', async () => {
  await page.goto(U('tools/community-benefit/'));
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  assert.ok(!(await page.locator('#delete-draft').isVisible()), 'delete button visible with no draft');
  await page.fill('#ws-place', 'Draft place');
  assert.equal(await page.evaluate(() => localStorage.getItem('cm-community-benefit-draft-v1')), null, 'saved without consent');
  await page.check('#save-draft');
  await page.fill('#ws-place', 'Draft place 2');
  assert.match(await page.evaluate(() => localStorage.getItem('cm-community-benefit-draft-v1')), /Draft place 2/);
  await page.reload();
  assert.equal(await page.inputValue('#ws-place'), 'Draft place 2');
  await page.click('#delete-draft');
  assert.equal(await page.evaluate(() => localStorage.getItem('cm-community-benefit-draft-v1')), null);
});

await step('Unknown path returns the 404 page', async () => {
  const r = await page.goto(U('no-such-page/'));
  assert.equal(r.status(), 404);
  assert.match(await page.locator('h1').innerText(), /not found/i);
});

await step('Print uses the monochrome logo', async () => {
  await page.goto(U('countries/india/'));
  await page.emulateMedia({ media: 'print' });
  await page.waitForFunction(() => /logo-mono/.test(document.querySelector('.site-logo').currentSrc));
  await page.emulateMedia({ media: 'screen' });
});

await step('Open data exports and schema load under the base path', async () => {
  for (const p of ['data/finance.json', 'data/schema/finance.schema.json', 'sitemap.xml', 'for-ai.json', '.well-known/security.txt', 'countries/india/index.md', 'packs/india.txt', 'llms.txt', 'site.webmanifest']) {
    const r = await page.request.get(U(p));
    assert.equal(r.status(), 200, p);
  }
  const fin = await (await page.request.get(U('data/finance.json'))).json();
  assert.ok(fin.records.every((r) => r.accessStatusText && r.verificationStatusText));
});

// Mobile, 360px
const mob = await browser.newContext({ viewport: { width: 360, height: 780 } });
const mp = await mob.newPage();
await step('360px: compact logo, menu opens and Escape returns focus', async () => {
  await mp.goto(U('countries/india/'));
  assert.match(await mp.locator('.site-logo').evaluate((i) => i.currentSrc), /compact-primary\.svg$/);
  assert.ok(!(await mp.locator('#site-nav').isVisible()));
  await mp.locator('.nav-toggle').click();
  assert.ok(await mp.locator('#site-nav').isVisible());
  await mp.keyboard.press('Escape');
  assert.ok(!(await mp.locator('#site-nav').isVisible()));
  assert.equal(await mp.evaluate(() => document.activeElement?.className), 'nav-toggle');
  const sw = await mp.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(sw <= 360, `horizontal scroll ${sw}`);
});
await step('360px: no horizontal scroll on home, finance, worksheet, article', async () => {
  for (const p of ['', 'finance/', 'tools/community-benefit/', 'learn/the-lifecycle/', 'sources/', 'policies/']) {
    await mp.goto(U(p));
    const sw = await mp.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(sw <= 360, `${p || 'home'} scrollWidth ${sw}`);
  }
});

// No JavaScript: content and sources remain available.
const nojs = await browser.newContext({ javaScriptEnabled: false });
const np = await nojs.newPage();
await step('Without JavaScript: dossier, sources, records and navigation remain available', async () => {
  await np.goto(U('countries/indonesia/'));
  assert.ok(await np.locator('#sources-h').isVisible());
  assert.ok(await np.locator('.site-nav').isVisible());
  await np.goto(U('finance/'));
  assert.equal(await np.locator('tbody tr').count(), 5);
  assert.ok(await np.locator('[data-filter-nojs]').isVisible());
  await np.goto(U('tools/community-benefit/'));
  assert.ok(await np.locator('#ws-place').isVisible());
  assert.ok(await np.locator('fieldset[data-step="questions"]').isVisible(), 'all sections visible without JS');
  await np.goto(U(''));
  assert.ok(await np.locator('.lc-panel').nth(4).isVisible(), 'lifecycle text equivalent visible');
});

const axeSource = await readFile(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
for (const [label, ctxp, w] of [['desktop', page, 1280], ['360px', mp, 360]]) {
  await step(`Accessibility scan (axe, WCAG 2.1 AA) at ${label}: home, article, dossier, tracker, worksheet, search`, async () => {
    const problems = [];
    for (const p of ['', 'learn/what-makes-a-mineral-critical/', 'countries/india/', 'finance/', 'tools/community-benefit/', 'search/', 'policies/', 'landscape/']) {
      await ctxp.goto(U(p));
      await ctxp.addScriptTag({ content: axeSource });
      const res = await ctxp.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes[0]?.target?.join(' ') })));
      for (const v of res) problems.push(`${p || 'home'}: ${v.id} (${v.impact}, ${v.n}) ${v.t}`);
    }
    assert.ok(problems.length === 0, problems.join('\n      '));
  });
}

await step('No JavaScript errors during the journeys', async () => {
  assert.deepEqual(consoleErrors.filter((e) => !/404/.test(e)), []);
});

await browser.close();
server?.close();
const failed = results.filter((r) => r[0] === 'FAIL');
console.log(`\n${results.length - failed.length}/${results.length} journeys passed.`);
process.exit(failed.length ? 1 : 0);
