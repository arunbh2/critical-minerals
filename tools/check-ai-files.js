#!/usr/bin/env node
// AI files and SEO on the BUILT site: Markdown twins and their head links, every
// advertised endpoint exists, packs, security.txt expiry, titles (2-4 words + site name,
// unique), meta descriptions (50-170 characters), canonical, OG/Twitter image, lang,
// one h1, alt text, and the footer link for AI readers.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { parse } from 'node-html-parser';

const dist = new URL('../dist/', import.meta.url).pathname;
const errors = [];
const err = (m) => errors.push(m);
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!['pagefind', '_astro'].includes(f)) walk(p); } else if (f.endsWith('.html')) pages.push(p); } })(dist);

const home = parse(readFileSync(join(dist, 'index.html'), 'utf8')).querySelector('link[rel="canonical"]').getAttribute('href');
const base = new URL(home).pathname;
const toFile = (url) => {
  const u = new URL(url, home);
  if (u.origin !== new URL(home).origin || !u.pathname.startsWith(base)) return null;
  const rel = decodeURIComponent(u.pathname.slice(base.length));
  const p = join(dist, rel);
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return false;
};

const titles = new Map();
for (const file of pages) {
  const rel = relative(dist, file);
  const doc = parse(readFileSync(file, 'utf8'));
  const is404 = rel === '404.html';
  const title = doc.querySelector('title')?.text ?? '';
  const pre = title.split(' | Critical Minerals')[0];
  const words = pre.trim().split(/\s+/).length;
  if (!title.endsWith(' | Critical Minerals')) err(`${rel}: <title> "${title}" must end with " | Critical Minerals". Fix: pass shortTitle to the layout.`);
  if (words < 2 || words > 4) err(`${rel}: <title> has ${words} words before the site name ("${pre}"). Fix: give the record a 2-4 word shortTitle.`);
  if (titles.has(title)) err(`${rel}: <title> "${title}" duplicates ${titles.get(title)}. Fix: make shortTitle unique.`);
  titles.set(title, rel);
  const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const dl = parse(`<p>${desc}</p>`).text.length;
  if (dl < 50 || dl > 170) err(`${rel}: meta description is ${dl} characters. Fix: write a summary or description of 50-170 characters.`);
  if (!doc.querySelector('html')?.getAttribute('lang')) err(`${rel}: <html> has no lang. Fix: set lang in src/layouts/Base.astro.`);
  if (!doc.querySelector('link[rel="canonical"]')) err(`${rel}: no canonical link. Fix: use the Base layout.`);
  for (const sel of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[name="twitter:card"]', 'meta[name="twitter:image"]'])
    if (!doc.querySelector(sel)) err(`${rel}: missing ${sel}. Fix: use the Base layout.`);
  const h1 = doc.querySelectorAll('h1').length;
  if (h1 !== 1) err(`${rel}: has ${h1} h1 elements. Fix: one h1 per page.`);
  for (const img of doc.querySelectorAll('img')) if (img.getAttribute('alt') == null) err(`${rel}: image ${img.getAttribute('src')} has no alt attribute. Fix: add alt text, or alt="" if decorative.`);
  if (!doc.querySelector('.ai-strip a')) err(`${rel}: footer link "Not a human? Here's a page for you" is missing. Fix: use the SiteFooter component.`);
  if (!is404) {
    if (!doc.querySelector('link[rel="alternate"][type="text/markdown"][href="index.md"]')) err(`${rel}: head lacks <link rel="alternate" type="text/markdown" href="index.md">. Fix: use the Base layout (twin={true}).`);
    if (!existsSync(join(dirname(file), 'index.md'))) err(`${rel}: Markdown twin index.md is missing. Fix: run node tools/build-twins.js after astro build.`);
  }
}

// Every advertised endpoint must exist.
const listed = new Set();
const forAi = JSON.parse(readFileSync(join(dist, 'for-ai.json'), 'utf8'));
const collect = (v) => { if (typeof v === 'string' && /^https?:/.test(v)) listed.add(v.split('?')[0]); else if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === 'object') Object.values(v).forEach(collect); };
collect(forAi.endpoints);
const openapi = JSON.parse(readFileSync(join(dist, 'openapi.json'), 'utf8'));
for (const p of Object.keys(openapi.paths)) listed.add(openapi.servers[0].url + p);
const catalog = JSON.parse(readFileSync(join(dist, '.well-known/api-catalog'), 'utf8'));
collect(catalog);
collect(JSON.parse(readFileSync(join(dist, '.well-known/ard.json'), 'utf8')).resources);
for (const m of readFileSync(join(dist, 'llms.txt'), 'utf8').matchAll(/\]\((https?:[^)]+)\)/g)) listed.add(m[1]);
for (const p of JSON.parse(readFileSync(join(dist, 'sitemap.json'), 'utf8')).pages) { listed.add(p.url); listed.add(p.markdown); }
for (const u of listed) {
  const f = toFile(u);
  if (f === false) err(`Advertised endpoint does not exist in the build: ${u}. Fix: build it, or remove it from the file that lists it.`);
}

// Packs listed on /use-with-ai/ exist and carry the warning and starter questions.
for (const p of forAi.endpoints.packs) {
  const f = toFile(p.url);
  if (!f) continue;
  const t = readFileSync(f, 'utf8');
  if (!/WARNING: An AI assistant can be wrong/.test(t)) err(`${relative(dist, f)}: pack lacks the assistant warning. Fix: build packs from src/pages/packs/[topic].txt.ts.`);
  if (!/Starter questions:/.test(t)) err(`${relative(dist, f)}: pack lacks starter questions. Fix: add questions in tools/site-text.js PACKS.`);
}

// security.txt
const sec = readFileSync(join(dist, '.well-known/security.txt'), 'utf8');
const exp = /^Expires:\s*(\S+)/m.exec(sec)?.[1];
if (!/^Contact:/m.test(sec)) err('.well-known/security.txt has no Contact line. Fix: set securityContact in tools/site-text.js.');
if (!exp || (new Date(exp) - Date.now()) / 864e5 < 30) err(`.well-known/security.txt Expires (${exp}) is under 30 days away. Fix: rebuild (tools/build-well-known.js sets it 180 days ahead).`);
for (const f of ['robots.txt', 'llms.txt', 'llms-full.txt', 'for-ai.txt', 'agents.txt', 'auth.md', 'terms-of-use.md', 'sitemap.xml', 'feed.xml', 'changes.json', '.well-known/tdmrep.json'])
  if (!existsSync(join(dist, f))) err(`Missing ${f}. Fix: check its endpoint in src/pages or tools/build-well-known.js.`);
if (!/Content-Signal:/.test(readFileSync(join(dist, 'robots.txt'), 'utf8'))) err('robots.txt has no Content-Signal line. Fix: src/pages/robots.txt.ts.');
if (!/Sitemap:/.test(readFileSync(join(dist, 'robots.txt'), 'utf8'))) err('robots.txt does not name the sitemap. Fix: src/pages/robots.txt.ts.');

if (errors.length) { console.error(`AI files and SEO check failed (${errors.length}):\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`AI files and SEO check passed: ${pages.length} pages, ${listed.size} advertised URLs exist, security.txt expires ${exp.slice(0, 10)}.`);
