#!/usr/bin/env node
// Content integrity: duplicate IDs, broken cross-references, controlled
// vocabularies, review dates and claim/source traceability. Runs before build
// in CI and fails on any problem.
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'yaml';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const errors = [];
const err = (m) => errors.push(m);

const vocab = json('src/data/vocab.json');
const vset = (k) => new Set(vocab[k].map((v) => v.id));

function loadMd(dir) {
  return readdirSync(join(root, dir)).filter((f) => f.endsWith('.md')).map((f) => {
    const text = read(join(dir, f));
    const m = /^---\n([\s\S]*?)\n---/.exec(text);
    if (!m) { err(`${dir}/${f}: missing frontmatter`); return { id: basename(f, '.md'), data: {} }; }
    return { id: basename(f, '.md'), data: parse(m[1]), body: text.slice(m[0].length) };
  });
}
function loadJson(p) {
  const arr = json(p);
  const seen = new Set();
  for (const r of arr) {
    if (!r.id) err(`${p}: record without id`);
    if (seen.has(r.id)) err(`${p}: duplicate id "${r.id}"`);
    seen.add(r.id);
  }
  return arr.map((r) => ({ id: r.id, data: r }));
}

const md = Object.fromEntries(['learn', 'minerals', 'countries', 'issues', 'cases', 'updates'].map((c) => [c, loadMd(`src/content/${c}`)]));
const js = {
  organisations: loadJson('src/data/organisations.json'),
  finance: loadJson('src/data/finance.json'),
  policies: loadJson('src/data/policies.json'),
  sources: loadJson('src/data/sources.json'),
  claims: loadJson('src/data/claims.json'),
};

const ids = (c) => new Set((md[c] ?? js[c]).map((e) => e.id));
const known = {
  countries: ids('countries'), minerals: ids('minerals'), issues: ids('issues'),
  sources: ids('sources'), claims: ids('claims'),
};

// Duplicate IDs across all routed records sharing a URL namespace are impossible
// by construction (one folder per route), but check slugs are URL-safe.
for (const [c, list] of Object.entries({ ...md, ...js })) {
  for (const e of list) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id)) err(`${c}/${e.id}: id must be lowercase-hyphenated`);
}

const checkRefs = (where, d) => {
  for (const f of ['countries', 'minerals', 'issues', 'sources', 'claims']) {
    for (const ref of d[f] ?? []) if (!known[f].has(ref)) err(`${where}: unknown ${f} reference "${ref}"`);
  }
  for (const l of d.lifecycle ?? []) if (!vset('lifecycle').has(l)) err(`${where}: unknown lifecycle stage "${l}"`);
};

const today = new Date().toISOString().slice(0, 10);
for (const [c, list] of Object.entries(md)) {
  for (const e of list) {
    const where = `${c}/${e.id}`;
    checkRefs(where, e.data);
    for (const k of ['title', 'summary', 'published', 'reviewed', 'reviewDue']) if (e.data[k] == null) err(`${where}: missing ${k}`);
    const toStr = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
    if (e.data.reviewed && e.data.reviewDue && toStr(e.data.reviewDue) <= toStr(e.data.reviewed)) err(`${where}: reviewDue must be after reviewed`);
    if (e.data.reviewed && toStr(e.data.reviewed) > today) err(`${where}: reviewed date is in the future`);
  }
}
for (const [c, list] of Object.entries(js)) {
  if (c === 'sources' || c === 'claims') continue;
  for (const e of list) checkRefs(`${c}/${e.id}`, e.data);
}
for (const p of js.policies) if (!known.sources.has(p.data.primaryDocument)) err(`policies/${p.id}: unknown primaryDocument "${p.data.primaryDocument}"`);
for (const c of js.claims) {
  if (!c.data.sources?.length) err(`claims/${c.id}: claim has no sources`);
  for (const s of c.data.sources ?? []) if (!known.sources.has(s)) err(`claims/${c.id}: unknown source "${s}"`);
  if (!vset('verification').has(c.data.verification)) err(`claims/${c.id}: unknown verification level`);
}

// Finance: an "open" record must have a verified application route; amounts
// carry stage and basis; nothing pretends to be open without evidence.
for (const f of js.finance) {
  const d = f.data;
  if (!vset('recordStates').has(d.recordState)) err(`finance/${f.id}: unknown recordState`);
  for (const i of d.instruments) if (!vset('instruments').has(i)) err(`finance/${f.id}: unknown instrument "${i}"`);
  for (const s of d.supports) if (!vset('financeSupports').has(s)) err(`finance/${f.id}: unknown supports "${s}"`);
  if (d.recordState === 'open' && (!d.applicationRoute || d.verification !== 'original-checked'))
    err(`finance/${f.id}: open records need an application route checked against the primary source`);
  if (d.amount?.value != null && (!d.amount.currency || d.amount.stage === 'unknown'))
    err(`finance/${f.id}: a stated amount needs a currency and stage`);
}

// Every claim used somewhere; every source used somewhere (orphans are a smell).
const usedClaims = new Set(Object.values(md).flat().flatMap((e) => e.data.claims ?? []));
for (const c of js.claims) if (!usedClaims.has(c.id)) err(`claims/${c.id}: not used on any page`);
const usedSources = new Set([
  ...Object.values(md).flat().flatMap((e) => e.data.sources ?? []),
  ...js.claims.flatMap((c) => c.data.sources),
  ...[...js.organisations, ...js.finance, ...js.policies].flatMap((e) => [...(e.data.sources ?? []), e.data.primaryDocument].filter(Boolean)),
]);
for (const s of js.sources) if (!usedSources.has(s.id)) err(`sources/${s.id}: not cited anywhere`);

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
const n = Object.values(md).reduce((a, l) => a + l.length, 0) + Object.values(js).reduce((a, l) => a + l.length, 0);
console.log(`Content validation passed: ${n} records, all references resolve.`);
