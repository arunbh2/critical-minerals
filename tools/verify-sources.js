#!/usr/bin/env node
// Verify: fetch every staged source (HTML or PDF), extract its text, and record which
// staged terms were found, with a short excerpt around each. Needs open internet access,
// so it runs in the source-verification workflow. Opening a page is not evidence:
// only found terms count.
import { readJson, writeJson, batchName, normalise } from './research-lib.js';
import { fetchText, findTerm } from './fetch-lib.js';

const batch = batchName(process.argv[2]);
const { sources } = readJson(`data/inbox/${batch}/sources.json`);
const { rows } = readJson(`research/${batch}/stage.json`);
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
      const hit = findTerm(norm, t);
      if (hit) {
        found.push(t);
        excerpts.push({ source: s.id, claim: row.claim, term: t, matched: hit.matched, excerpt: norm.slice(Math.max(0, hit.at - 90), hit.at + hit.matched.length + 90).trim() });
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
