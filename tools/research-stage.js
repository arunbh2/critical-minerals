#!/usr/bin/env node
// Stage: expand research/<batch>/claims.json into one row per (claim, source) with
// the exact terms to look for, and list the sources to fetch in data/inbox/<batch>/.
import { readJson, writeJson, batchName } from './research-lib.js';

const batch = batchName(process.argv[2]);
const claims = readJson(`research/${batch}/claims.json`).claims;
const register = new Map(readJson('src/data/sources.json').map((s) => [s.id, s]));
const rows = [];
const needed = new Map();
for (const c of claims) {
  for (const sid of c.sources) {
    const s = register.get(sid);
    if (!s) { console.error(`research/${batch}/claims.json: claim ${c.id} names unknown source "${sid}". Fix: add it to src/data/sources.json.`); process.exit(1); }
    rows.push({ claim: c.id, source: sid, terms: c.terms });
    needed.set(sid, { id: sid, url: s.url, type: s.type, publisher: s.publisher, title: s.title });
  }
}
writeJson(`research/${batch}/stage.json`, { batch, staged: new Date().toISOString().slice(0, 10), rows });
writeJson(`data/inbox/${batch}/sources.json`, { batch, sources: [...needed.values()] });
console.log(`Staged ${rows.length} claim-source pairs across ${needed.size} sources for batch ${batch}.`);
