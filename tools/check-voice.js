#!/usr/bin/env node
// Voice: humble and diplomatic. No blame, no ranking of places or organisations,
// no hype, and missing evidence is never called "failed". Banned punctuation: em
// dashes and exclamation marks in prose. Scans content, data and shared text.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = [];
const walk = (d, re) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, re) : re.test(f) && files.push(p); } };
walk(join(root, 'src/content'), /\.md$/);
walk(join(root, 'src/pages'), /\.(astro|ts)$/);
walk(join(root, 'src/components'), /\.astro$/);
for (const f of ['organisations', 'finance', 'policies', 'claims', 'changelog', 'programmes', 'awards', 'opportunities']) files.push(join(root, `src/data/${f}.json`));
files.push(join(root, 'tools/site-text.js'), join(root, 'src/lib/worksheet.js'));

const rules = [
  { re: /—/, why: 'em dash', fix: 'use a comma, colon, full stop or parentheses' },
  { re: /[A-Za-z][!](?=[\s"')]|$)/, why: 'exclamation mark', fix: 'use a full stop' },
  { re: /\b(world-class|cutting-edge|game[- ]?changer|revolutionary|unprecedented|shocking|scandal(ous)?|disgrace(ful)?|best-in-class|laggards?|league table|top-ranked|ranked (first|last|top|bottom)|worst)\b/i, why: 'hype, ranking or blame word', fix: 'describe the evidence plainly, without ranking or blame' },
  { re: /\bblam(e|ed|es|ing)\b/i, why: 'blame', fix: 'describe what happened and who is responsible for what, without blame' },
  { re: /\b(failed (verification|the check)|verification failed|claim failed|check failed)\b/i, why: 'missing evidence called "failed"', fix: 'say "not verified"' },
];
const errors = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|import |<style|@media)/.test(line)) return;
    if (/check-voice:\s*allow/.test(line)) return;
    for (const r of rules) if (r.re.test(line)) errors.push(`${relative(root, f)}:${i + 1}: ${r.why} ("${line.trim().slice(0, 80)}"). Fix: ${r.fix}.`);
  });
}
if (errors.length) { console.error(`Voice check failed (${errors.length}):\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Voice check passed: ${files.length} files.`);
