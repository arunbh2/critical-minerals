#!/usr/bin/env node
// Record passages: for every funding, careers and organisation record, fetch each cited
// source once and check that each recorded passage still appears in it. Writes
// data/inbox/records/passages-check.json with, per source: HTTP status, a hash of the
// extracted text (to detect source changes), and per passage: located or not.
//
// This is a technical check. It never changes a record's status, amount, eligibility or
// deadline. A source that cannot be read is reported as unavailable; it is never taken
// as evidence that an opportunity has closed. Needs open internet access (runs in the
// Verify sources workflow).
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, writeJson, normalise, exists, ROOT } from './research-lib.js';
import { fetchText } from './fetch-lib.js';

const FILES = ['organisations', 'programmes', 'awards', 'opportunities'];
const register = new Map(readJson('src/data/sources.json').map((s) => [s.id, s]));
const wanted = new Map(); // source -> [{ file, record, quote }]
for (const f of FILES) {
  for (const r of readJson(`src/data/${f}.json`)) {
    for (const p of r.passages ?? []) {
      if (!register.has(p.source)) { console.error(`src/data/${f}.json: ${r.id} cites unknown source "${p.source}". Fix: add it to src/data/sources.json.`); process.exit(1); }
      if (!wanted.has(p.source)) wanted.set(p.source, []);
      wanted.get(p.source).push({ file: f, record: r.id, quote: p.quote });
    }
  }
}
const prevPath = 'data/inbox/records/passages-check.json';
const prev = exists(prevPath) ? readJson(prevPath) : { sources: [] };
const prevHash = new Map(prev.sources.map((s) => [s.source, s.textHash]));
const offline = process.argv.includes('--offline');
const out = [];
for (const [sid, items] of wanted) {
  const s = register.get(sid);
  const r = offline ? { status: 0, text: '', error: 'offline' } : await fetchText(s.url);
  const norm = normalise(r.text);
  const readable = r.status === 200 && norm.length >= 200;
  const textHash = readable ? createHash('sha256').update(norm).digest('hex').slice(0, 16) : null;
  const before = prevHash.get(sid) ?? null;
  out.push({
    source: sid, url: s.url, status: r.status, error: r.error ?? null, textLength: norm.length, readable, textHash,
    changedSinceLastCheck: Boolean(readable && before && before !== textHash),
    passages: items.map((it) => ({ ...it, located: readable ? norm.includes(normalise(it.quote)) : null })),
  });
  console.log(`${String(r.status).padStart(3)} ${readable ? 'read' : 'UNAVAILABLE'}  ${sid}  ${items.filter((i) => readable && norm.includes(normalise(i.quote))).length}/${items.length} located`);
}
mkdirSync(join(ROOT, 'data/inbox/records'), { recursive: true });
writeJson(prevPath, { checkedAt: new Date().toISOString(), note: 'Technical check of recorded passages. Not an editorial review; never changes record status.', sources: out });
const missing = out.flatMap((s) => s.passages.filter((p) => p.located === false));
console.log(`Checked ${out.length} sources: ${out.filter((s) => s.readable).length} readable, ${missing.length} passage(s) not located, ${out.filter((s) => s.changedSinceLastCheck).length} source(s) changed.`);
