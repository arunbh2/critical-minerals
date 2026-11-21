#!/usr/bin/env node
// Ledger: which passages this batch located, which it could not, how the located
// passages were judged on review (research/<batch>/review.json), and editorial notes.
// Locating terms is an aid to finding evidence; only the review decides publication.
import { readJson, batchName, exists, ROOT } from './research-lib.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const batch = batchName(process.argv[2]);
const gate = readJson(`research/${batch}/gate.json`);
const check = readJson(`data/inbox/${batch}/link-check.json`);
const claims = new Map(readJson(`research/${batch}/claims.json`).claims.map((c) => [c.id, c]));
const notes = exists(`research/${batch}/notes.json`) ? readJson(`research/${batch}/notes.json`) : { heldBack: [] };
const vocab = readJson('src/data/vocab.json');
const label = Object.fromEntries(vocab.verification.map((v) => [v.id, v.label]));
const outcomeLabel = Object.fromEntries(vocab.reviewOutcomes.map((v) => [v.id, v.label]));
const L = [`# Research ledger: ${batch}`, '', `Sources fetched: ${check.checkedAt}. Gate run: ${gate.gatedAt}.`, ''];
const used = gate.results.filter((r) => r.status !== 'not-verified');
const held = gate.results.filter((r) => r.status === 'not-verified');
L.push(`## Passage located (${used.length})`, '');
for (const r of used) L.push(`- **${r.claim}** (${label[r.status]}): ${claims.get(r.claim).text}`, `  - Evidence: ${r.terms.map((t) => `"${t.term}" in ${t.foundIn.join(', ')}`).join('; ')}`);
L.push('', `## Passage not located (${held.length})`, '');
for (const r of held) L.push(`- **${r.claim}**: terms not found: ${r.missing.map((m) => `"${m}"`).join(', ')}.`, `  - Why: the fetched sources did not contain every locating term. Missing evidence is not a finding that the claim is false. Not published.`);
if (exists(`research/${batch}/review.json`)) {
  const rv = readJson(`research/${batch}/review.json`);
  L.push('', `## Passage review (${rv.reviews.length})`, '', rv.method, '');
  for (const r of rv.reviews) L.push(`- **${r.claim}**: ${outcomeLabel[r.outcome] ?? r.outcome}${r.qualification ? `. ${r.qualification}` : '.'}${r.history ? ` ${r.history}` : ''}`);
}
L.push('', '## Sources that could not be read', '');
const unread = check.results.filter((r) => r.status !== 200 || r.textLength < 200);
if (!unread.length) L.push('- None.');
for (const r of unread) L.push(`- ${r.source}: HTTP ${r.status}${r.error ? ` (${r.error})` : ''}, ${r.textLength} characters extracted. ${r.url}`);
if (notes.heldBack?.length) { L.push('', '## Editorial holds', ''); for (const n of notes.heldBack) L.push(`- ${n}`); }
writeFileSync(join(ROOT, `research/${batch}/ledger.md`), L.join('\n') + '\n');
console.log(`Wrote research/${batch}/ledger.md: ${used.length} used, ${held.length} held back.`);
