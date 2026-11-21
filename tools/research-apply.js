#!/usr/bin/env node
// Apply: copy gate results into src/data/claims.json (verification + checkedAt + evidence
// sources), so pages show the label the evidence earned. Not-verified claims stay in the
// register but never render on a page.
import { readJson, writeJson, batchName } from './research-lib.js';

const batch = batchName(process.argv[2]);
const gate = readJson(`research/${batch}/gate.json`);
const claims = readJson('src/data/claims.json');
const batchClaims = new Map(readJson(`research/${batch}/claims.json`).claims.map((c) => [c.id, c]));
const changes = [];
for (const g of gate.results) {
  const c = claims.find((x) => x.id === g.claim);
  if (!c) { console.error(`research/${batch}/gate.json names unknown claim ${g.claim}. Fix: add it to src/data/claims.json or remove it from the batch.`); process.exit(1); }
  const evidence = [...new Set(g.terms.flatMap((t) => t.foundIn))];
  const before = c.verification;
  c.verification = g.status;
  c.checkedAt = gate.checkedAt.slice(0, 10);
  c.batch = batch;
  c.evidenceSources = evidence;
  // Keep the register's wording identical to the wording that was checked.
  const staged = batchClaims.get(g.claim);
  if (staged?.text) c.text = staged.text;
  changes.push({ claim: c.id, from: before, to: g.status, evidenceSources: evidence });
}
writeJson('src/data/claims.json', claims);
writeJson(`research/${batch}/apply.json`, { batch, appliedAt: new Date().toISOString(), changes });
console.log(`Applied ${changes.length} gate results from ${batch}.`);
