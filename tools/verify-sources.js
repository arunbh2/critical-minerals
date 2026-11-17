#!/usr/bin/env node
// Verify: fetch every staged source (HTML or PDF), extract its text, and record which
// staged terms were found, with a short excerpt around each. Needs open internet access,
// so it runs in the source-verification workflow. Opening a page is not evidence:
// only found terms count.
import { readJson, writeJson, batchName, normalise } from './research-lib.js';

const batch = batchName(process.argv[2]);
const { sources } = readJson(`data/inbox/${batch}/sources.json`);
const { rows } = readJson(`research/${batch}/stage.json`);
const UA = 'Mozilla/5.0 (compatible; CriticalMineralsSourceCheck/1.0; public-interest fact check)';

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ndash;|&mdash;/g, '-')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

async function pdfToText(buf) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const c = await page.getTextContent();
    text += ' ' + c.items.map((it) => it.str).join(' ');
  }
  return text;
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf;q=0.9,*/*;q=0.8' } });
    const type = res.headers.get('content-type') ?? '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok) return { status: res.status, type, finalUrl: res.url, text: '' };
    const isPdf = type.includes('pdf') || buf.subarray(0, 5).toString() === '%PDF-';
    const text = isPdf ? await pdfToText(buf) : htmlToText(buf.toString('utf8'));
    return { status: res.status, type: isPdf ? 'application/pdf' : type, finalUrl: res.url, text };
  } catch (e) {
    return { status: 0, type: '', finalUrl: url, text: '', error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(timer); }
}

const results = [];
const excerpts = [];
for (const s of sources) {
  const r = await fetchText(s.url);
  const norm = normalise(r.text);
  const termsFor = rows.filter((x) => x.source === s.id);
  const checks = termsFor.map((row) => {
    const found = [];
    const missing = [];
    for (const t of row.terms) {
      const nt = normalise(t);
      const at = norm.indexOf(nt);
      if (at >= 0) {
        found.push(t);
        excerpts.push({ source: s.id, claim: row.claim, term: t, excerpt: norm.slice(Math.max(0, at - 90), at + nt.length + 90).trim() });
      } else missing.push(t);
    }
    return { claim: row.claim, found, missing };
  });
  results.push({ source: s.id, url: s.url, finalUrl: r.finalUrl, status: r.status, contentType: r.type, textLength: norm.length, error: r.error ?? null, checks });
  console.log(`${String(r.status).padStart(3)} ${norm.length.toString().padStart(7)} chars  ${s.id}${r.error ? `  (${r.error})` : ''}`);
}
const checkedAt = new Date().toISOString();
writeJson(`data/inbox/${batch}/link-check.json`, { batch, checkedAt, results });
writeJson(`data/inbox/${batch}/excerpts.json`, { batch, checkedAt, note: 'Short excerpts (about 180 characters) around each found term, kept as evidence. Not for republication.', excerpts });
console.log(`Checked ${results.length} sources.`);
