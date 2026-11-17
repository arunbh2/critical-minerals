#!/usr/bin/env node
// Structured data: every JSON-LD block parses; each type has its required fields;
// breadcrumb markup matches the visible breadcrumb trail; the homepage carries
// WebSite and Organization.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const dist = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!['pagefind', '_astro'].includes(f)) walk(p); } else if (f.endsWith('.html')) pages.push(p); } })(dist);
const required = {
  WebSite: ['name', 'url'], Organization: ['name', 'url'], Article: ['headline', 'datePublished', 'dateModified'],
  Report: ['headline', 'datePublished', 'dateModified'], BreadcrumbList: ['itemListElement'], Dataset: ['name', 'description', 'distribution'],
};
const errors = [];
let blocks = 0;
for (const file of pages) {
  const rel = relative(dist, file);
  const doc = parse(readFileSync(file, 'utf8'));
  const types = [];
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    blocks++;
    let j;
    try { j = JSON.parse(s.text); } catch (e) { errors.push(`${rel}: JSON-LD does not parse (${e.message}). Fix: build it with JSON.stringify.`); continue; }
    for (const o of Array.isArray(j) ? j : [j]) {
      if (o['@context'] !== 'https://schema.org') errors.push(`${rel}: JSON-LD @context must be https://schema.org.`);
      types.push(o['@type']);
      for (const k of required[o['@type']] ?? []) if (o[k] == null || o[k] === '') errors.push(`${rel}: ${o['@type']} lacks "${k}". Fix: supply it from the record.`);
      if (o['@type'] === 'BreadcrumbList') {
        const visible = doc.querySelectorAll('.breadcrumbs li').map((li) => li.text.trim());
        const marked = o.itemListElement.map((i) => i.name);
        if (visible.join('|') !== marked.join('|')) errors.push(`${rel}: breadcrumb markup (${marked.join(' > ')}) differs from the visible trail (${visible.join(' > ')}). Fix: both come from the Breadcrumbs component.`);
        o.itemListElement.forEach((it, i) => { if (it.position !== i + 1 || !/^https?:/.test(it.item)) errors.push(`${rel}: breadcrumb item ${i + 1} needs position ${i + 1} and an absolute URL.`); });
      }
      if (o['@type'] === 'Article' || o['@type'] === 'Report') {
        const h1 = doc.querySelector('h1')?.text.trim();
        if (o.headline !== h1) errors.push(`${rel}: ${o['@type']} headline "${o.headline}" does not match the visible h1 "${h1}". Never mark up content that is not visible.`);
      }
    }
  }
  if (rel === 'index.html' && !(types.includes('WebSite') && types.includes('Organization'))) errors.push('index.html: homepage needs WebSite and Organization JSON-LD. Fix: src/pages/index.astro.');
}
if (errors.length) { console.error(`Structured data check failed (${errors.length}):\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Structured data check passed: ${blocks} JSON-LD blocks on ${pages.length} pages.`);
