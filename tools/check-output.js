#!/usr/bin/env node
// Validates the BUILT site (dist/), not the sources: private material and
// restricted references must not leak into HTML, search indexes, JSON exports,
// downloads or metadata; every internal link and asset must resolve under the
// configured base path.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';
import { gunzipSync } from 'node:zlib';

const dist = new URL('../dist/', import.meta.url).pathname;
const rawBase = process.env.BASE_PATH ?? '/critical-minerals';
const base = rawBase === '' || rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}/`;
const errors = [];
const err = (m) => errors.push(m);

if (!existsSync(dist)) { console.error('dist/ not found. Run the build first.'); process.exit(1); }

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(dist);

// 1. Files that must never be published.
const banned = [/(^|\/)CLAUDE(-LOGO)?\.md$/i, /(^|\/)\.env/, /(^|\/)private\//, /brief/i, /\.private\./, /verification-queue/i, /(?<!index|auth|terms-of-use)\.md$/];
for (const f of files) {
  const rel = relative(dist, f);
  for (const re of banned) if (re.test(rel)) err(`Forbidden file in artifact: ${rel}`);
}

// 2. Restricted strings in any text output, including decompressed search index fragments.
// Names of restricted institutions and people are private, so they are NOT written
// in this public file. They come from the RESTRICTED_TERMS secret in CI, or from the
// git-ignored file private/restricted-terms.txt locally (one phrase per line,
// case-insensitive, flexible spacing; or /regex/ for a case-sensitive pattern).
const termSource = process.env.RESTRICTED_TERMS
  ?? (existsSync(new URL('../private/restricted-terms.txt', import.meta.url))
    ? readFileSync(new URL('../private/restricted-terms.txt', import.meta.url), 'utf8') : '');
const terms = termSource.split(/\r?\n/).map((t) => t.trim()).filter((t) => t && !t.startsWith('#'));
// A line written as /pattern/ is a case-sensitive regular expression, e.g. /\bPA\b/
// for an abbreviation that must match only as a whole capitalised word.
const toRe = (t) => (/^\/.+\/$/.test(t) ? new RegExp(t.slice(1, -1)) : new RegExp(esc(t), 'i'));
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
let termsNote = `${terms.length} private restricted term(s) checked`;
if (!terms.length) {
  if (process.env.REQUIRE_RESTRICTED_TERMS === '1') err('No restricted terms supplied (set the RESTRICTED_TERMS secret).');
  termsNote = 'WARNING: no private restricted terms supplied; that part of the scan was skipped';
}
const restricted = [
  ...terms.map((t) => ({ re: toRe(t), why: 'restricted term (private list)' })),
  { re: /[a-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.[a-z]{2,}/i, why: 'personal email address', skip: /^pagefind\/pagefind-(component-)?ui\.js$/ },
  { re: /commissioning (brief|user)|leadership note|internal proposal/i, why: 'private commissioning material' },
  { re: /\b(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/, why: 'credential-like string' },
  // Test fixtures carry this marker; it must never reach public output.
  { re: /__TEST_FIXTURE__/, why: 'development fixture leaked into public output' },
];
const textExt = /\.(html|json|xml|txt|js|css|webmanifest|svg|md|csv)$|security\.txt$|api-catalog$/;
for (const f of files) {
  const rel = relative(dist, f);
  let text = null;
  if (textExt.test(f)) text = readFileSync(f, 'utf8');
  else if (/pagefind\/.*\.pf_(fragment|index|meta)$/.test(f) || /\.pf_/.test(f)) {
    try { text = gunzipSync(readFileSync(f)).toString('utf8'); } catch { text = readFileSync(f).toString('latin1'); }
  }
  if (text == null) continue;
  // Skip third-party bundled fonts/scripts only for the fixture check.
  for (const r of restricted) {
    if (r.skip && r.skip.test(rel)) continue;
    if (r.re.test(text)) err(`${rel}: ${r.why}${r.why.startsWith('restricted term') ? '' : ` (${r.re})`}`);
  }
}

// 3. Internal links and assets resolve under the base path.
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const attr = /\s(?:href|src|srcset|content)=["']([^"']+)["']/g;
const exists = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!clean.startsWith(base)) return false;
  const rel = clean.slice(base.length);
  const p = join(dist, rel);
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(join(p, 'index.html'));
};
let checked = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const pageUrl = base + relative(dist, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  for (const m of html.matchAll(attr)) {
    for (const raw of m[1].split(',').map((s) => s.trim().split(/\s+/)[0])) {
      if (!raw || /^(https?:|mailto:|tel:|data:|#|javascript:)/.test(raw)) continue;
      if (m[0].includes('content=') && !raw.startsWith('/')) continue; // meta content text
      if (raw.startsWith('?')) continue; // same-page filter links
      const resolved = raw.startsWith('/') ? raw : posix.join(dirname(pageUrl + 'x'), raw);
      checked++;
      if (raw.startsWith('/') && !raw.startsWith(base)) { err(`${relative(dist, f)}: link "${raw}" is missing the base path ${base}`); continue; }
      if (!exists(resolved)) err(`${relative(dist, f)}: broken internal link "${raw}"`);
    }
  }
}

// 4. Required artefacts.
for (const req of ['index.html', '404.html', 'sitemap.xml', '.well-known/security.txt', 'llms.txt', 'for-ai.json', 'pagefind/pagefind.js', 'brand/favicon.ico', 'brand/favicon.svg', 'brand/apple-touch-icon.png', 'site.webmanifest', 'data/finance.json']) {
  if (!existsSync(join(dist, req))) err(`Missing required output: ${req}`);
}
// 5. Exports are valid JSON and contain records.
for (const f of files.filter((f) => /\/data\/[^/]+\.json$/.test(f))) {
  try { const j = JSON.parse(readFileSync(f, 'utf8')); if (!Array.isArray(j.records)) err(`${relative(dist, f)}: no records array`); }
  catch (e) { err(`${relative(dist, f)}: invalid JSON`); }
}
// 6. Canonicals and sitemap use the served origin + base.
const site = (process.env.SITE_URL || 'https://arunbh2.github.io').replace(/\/$/, '');
const home = readFileSync(join(dist, 'index.html'), 'utf8');
const canon = /<link rel="canonical" href="([^"]+)"/.exec(home)?.[1];
if (canon !== `${site}${base}`) err(`Home canonical is ${canon}, expected ${site}${base}`);
const sm = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
if (!sm.includes(`<loc>${site}${base}countries/india/</loc>`)) err('Sitemap does not contain the India dossier at the served address');

if (errors.length) {
  console.error(`Build output check failed with ${errors.length} problem(s):\n- ${[...new Set(errors)].join('\n- ')}`);
  process.exit(1);
}
console.log(`Build output check passed: ${files.length} files scanned, ${checked} internal links and assets resolved under ${base}, no restricted or private material found (${termsNote}).`);
