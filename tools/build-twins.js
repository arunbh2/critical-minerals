#!/usr/bin/env node
// Post-build: for every built page, write a Markdown twin (index.md) beside it from the
// page's own <main> content, then assemble /llms-full.txt from the twins and write
// /sitemap.xml and /sitemap.json from the pages' canonical URLs and review dates.
// Runs after `astro build`, before Pagefind. Re-run it after anything rebuilds dist/.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';
import { SITE, OWNERSHIP, STANDARDS, AGENT_DO, AGENT_AVOID, HOST_LIMITS } from './site-text.js';

const dist = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== 'pagefind' && f !== '_astro') walk(p); }
    else if (f === 'index.html') pages.push(p);
  }
})(dist);

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '_' });
td.remove(['script', 'style', 'noscript', 'form', 'button', 'select', 'input', 'textarea']);
td.addRule('time', { filter: 'time', replacement: (c) => c });

const records = [];
for (const file of pages) {
  const doc = parse(readFileSync(file, 'utf8'));
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  const title = doc.querySelector('h1')?.text.trim() ?? doc.querySelector('title')?.text ?? '';
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  let modified = '';
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.text);
      for (const o of Array.isArray(j) ? j : [j]) if (o.dateModified) modified = o.dateModified;
    } catch {}
  }
  const main = doc.querySelector('main');
  if (!main) continue;
  main.querySelectorAll('script, [data-js-only], .no-print, .lc-tabs').forEach((n) => n.remove());
  // Links: make them absolute so the twin works anywhere it is read.
  main.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (h && !/^(https?:|mailto:|#)/.test(h)) a.setAttribute('href', new URL(h, canonical).toString());
  });
  const body = td.turndown(main.innerHTML).replace(/\n{3,}/g, '\n\n').trim();
  const header = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `url: ${canonical}`,
    `description: ${JSON.stringify(description)}`,
    ...(modified ? [`reviewed: ${modified}`] : []),
    `site: ${SITE.name}`,
    'note: Markdown twin generated from the HTML page at the url above. The HTML page is authoritative.',
    '---',
    '',
  ].join('\n');
  writeFileSync(join(file, '..', 'index.md'), header + body + '\n');
  records.push({ path: relative(dist, file), canonical, title, description, modified, noindex: robots.includes('noindex'), body });
}

// Order for llms-full and the sitemap: home first, then by path.
records.sort((a, b) => (a.path === 'index.html' ? -1 : b.path === 'index.html' ? 1 : a.path.localeCompare(b.path)));
const indexable = records.filter((r) => !r.noindex);

const home = indexable.find((r) => r.path === 'index.html')?.canonical ?? '';
const full = [
  `# ${SITE.name}: full text`,
  '',
  `> ${SITE.description}`,
  '',
  `Coverage: ${SITE.coverage}`,
  `Audience: ${SITE.audience}`,
  `Ownership: ${OWNERSHIP}`,
  '',
  '## Editorial standards',
  ...STANDARDS.map((s) => `- ${s}`),
  '',
  '## Please do',
  ...AGENT_DO.map((s) => `- ${s}`),
  '',
  '## Please avoid',
  ...AGENT_AVOID.map((s) => `- ${s}`),
  '',
  '## What this host can do',
  ...HOST_LIMITS.map((s) => `- ${s}`),
  '',
  `This file contains every indexable page (${indexable.length}) as Markdown. Each page also has its own twin at <page>/index.md. Source: ${home}`,
  '',
  ...indexable.flatMap((r) => ['', '='.repeat(72), `URL: ${r.canonical}`, ...(r.modified ? [`Reviewed: ${r.modified}`] : []), '='.repeat(72), '', r.body]),
].join('\n');
writeFileSync(join(dist, 'llms-full.txt'), full + '\n');

const lastmod = (r) => r.modified || SITE.corpusReviewed;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((r) => `  <url><loc>${esc(r.canonical)}</loc><lastmod>${lastmod(r)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(dist, 'sitemap.json'), JSON.stringify({
  site: SITE.name, generated: new Date().toISOString(), count: indexable.length,
  pages: indexable.map((r) => ({ url: r.canonical, markdown: r.canonical + 'index.md', title: r.title, description: r.description, lastmod: lastmod(r) })),
}, null, 2) + '\n');
console.log(`Wrote ${records.length} Markdown twins, llms-full.txt (${indexable.length} pages), sitemap.xml and sitemap.json.`);
