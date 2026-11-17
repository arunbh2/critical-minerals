#!/usr/bin/env node
// Gate: a claim passes only if every one of its terms was found in a fetched source.
//   original-checked: all terms found in original sources (official, intergovernmental, legal)
//   secondary:        all terms found, but only by also using secondary sources
//   not-verified:     at least one term not found anywhere (missing evidence, never "failed")
import { readJson, writeJson, batchName, ORIGINAL_TYPES, exists } from './research-lib.js';

const batch = batchName(process.argv[2]);
if (!exists(`data/inbox/${batch}/link-check.json`)) {
  console.error(`data/inbox/${batch}/link-check.json is missing. Fix: run the "Verify sources" workflow for batch ${batch}.`);
  process.exit(1);
}
const claims = readJson(`research/${batch}/claims.json`).claims;
const check = readJson(`data/inbox/${batch}/link-check.json`);
const register = new Map(readJson('src/data/sources.json').map((s) => [s.id, s]));

const out = claims.map((c) => {
  const found = new Map(); // term -> Set(source ids)
  for (const r of check.results) {
    for (const ch of r.checks.filter((x) => x.claim === c.id)) for (const t of ch.found) {
      if (!found.has(t)) found.set(t, new Set());
      found.get(t).add(r.source);
    }
  }
  const allFound = c.terms.every((t) => found.has(t));
  const originalOnly = c.terms.every((t) => [...(found.get(t) ?? [])].some((sid) => ORIGINAL_TYPES.has(register.get(sid)?.type)));
  const status = !allFound ? 'not-verified' : originalOnly ? 'original-checked' : 'secondary';
  return {
    claim: c.id,
    status,
    terms: c.terms.map((t) => ({ term: t, foundIn: [...(found.get(t) ?? [])] })),
    missing: c.terms.filter((t) => !found.has(t)),
  };
});
writeJson(`research/${batch}/gate.json`, { batch, gatedAt: new Date().toISOString(), checkedAt: check.checkedAt, results: out });
const tally = out.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
console.log(`Gate for ${batch}: ${JSON.stringify(tally)}`);
