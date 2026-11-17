#!/usr/bin/env node
// Ledger: what this batch used, what it held back, and why. Generated from the gate,
// plus any editorial notes in research/<batch>/notes.json.
import { readJson, batchName, exists, ROOT } from './research-lib.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const batch = batchName(process.argv[2]);
const gate = readJson(`research/${batch}/gate.json`);
const check = readJson(`data/inbox/${batch}/link-check.json`);
const claims = new Map(readJson(`research/${batch}/claims.json`).claims.map((c) => [c.id, c]));
const notes = exists(`research/${batch}/notes.json`) ? readJson(`research/${batch}/notes.json`) : { heldBack: [] };
const label = { 'original-checked': 'Checked against an original', secondary: 'Reported by secondary sources', 'not-verified': 'Not verified' };
const L = [`# Research ledger: ${batch}`, '', `Sources fetched: ${check.checkedAt}. Gate run: ${gate.gatedAt}.`, ''];
const used = gate.results.filter((r) => r.status !== 'not-verified');
const held = gate.results.filter((r) => r.status === 'not-verified');
L.push(`## Used (${used.length})`, '');
for (const r of used) L.push(`- **${r.claim}** (${label[r.status]}): ${claims.get(r.claim).text}`, `  - Evidence: ${r.terms.map((t) => `"${t.term}" in ${t.foundIn.join(', ')}`).join('; ')}`);
L.push('', `## Held back from pages (${held.length})`, '');
for (const r of held) L.push(`- **${r.claim}** (not verified): terms not found: ${r.missing.map((m) => `"${m}"`).join(', ')}.`, `  - Why: the fetched sources did not contain every term this claim rests on. Missing evidence is not a finding that the claim is false.`);
L.push('', '## Sources that could not be read', '');
const unread = check.results.filter((r) => r.status !== 200 || r.textLength < 200);
if (!unread.length) L.push('- None.');
for (const r of unread) L.push(`- ${r.source}: HTTP ${r.status}${r.error ? ` (${r.error})` : ''}, ${r.textLength} characters extracted. ${r.url}`);
if (notes.heldBack?.length) { L.push('', '## Editorial holds', ''); for (const n of notes.heldBack) L.push(`- ${n}`); }
writeFileSync(join(ROOT, `research/${batch}/ledger.md`), L.join('\n') + '\n');
console.log(`Wrote research/${batch}/ledger.md: ${used.length} used, ${held.length} held back.`);
