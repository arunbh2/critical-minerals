#!/usr/bin/env node
// Page weight budget for 3G and low-end Android. Counts what a first visit downloads
// before interaction: the HTML, its scripts and stylesheets, preloaded fonts and images.
// Lazily loaded parts (the search index, italic font used only in quotations) are excluded.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'node-html-parser';

const BUDGET = { htmlGzipKB: 30, firstLoadKB: 400 };
const dist = new URL('../dist/', import.meta.url).pathname;
const home = parse(readFileSync(join(dist, 'index.html'), 'utf8')).querySelector('link[rel="canonical"]').getAttribute('href');
const base = new URL(home).pathname;
const size = (u) => { const p = join(dist, decodeURIComponent(u.replace(base, ''))); return existsSync(p) && statSync(p).isFile() ? statSync(p).size : 0; };
const gz = (p) => { const b = readFileSync(p); return /\.(svg|js|css|html|json)$/.test(p) ? gzipSync(b).length : b.length; };
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!['pagefind', '_astro'].includes(f)) walk(p); } else if (f.endsWith('.html')) pages.push(p); } })(dist);
const errors = [];
let heaviest = { kb: 0, rel: '' };
for (const file of pages) {
  const rel = relative(dist, file);
  const html = readFileSync(file, 'utf8');
  const doc = parse(html);
  const htmlGz = gzipSync(html).length / 1024;
  let total = htmlGz;
  const refs = new Set([
    ...doc.querySelectorAll('script[src]').map((s) => s.getAttribute('src')),
    ...doc.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]').map((l) => l.getAttribute('href')),
    ...doc.querySelectorAll('img[src]').filter((i) => i.getAttribute('loading') !== 'lazy').map((i) => i.getAttribute('src')),
  ].filter((u) => u && u.startsWith(base)));
  for (const u of refs) { const p = join(dist, decodeURIComponent(u.replace(base, ''))); if (existsSync(p)) total += gz(p) / 1024; }
  if (htmlGz > BUDGET.htmlGzipKB) errors.push(`${rel}: HTML is ${htmlGz.toFixed(1)} KB gzipped (budget ${BUDGET.htmlGzipKB} KB). Fix: shorten the page, paginate long lists or move inline CSS to a shared file.`);
  if (total > BUDGET.firstLoadKB) errors.push(`${rel}: first load is ${total.toFixed(0)} KB (budget ${BUDGET.firstLoadKB} KB). Fix: lazy-load heavy parts or drop a preloaded font.`);
  if (total > heaviest.kb) heaviest = { kb: total, rel };
}
if (errors.length) { console.error(`Page weight check failed (${errors.length}):\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Page weight check passed: ${pages.length} pages within budget (HTML ≤ ${BUDGET.htmlGzipKB} KB gzipped, first load ≤ ${BUDGET.firstLoadKB} KB). Heaviest: ${heaviest.rel} at ${heaviest.kb.toFixed(0)} KB.`);
