#!/usr/bin/env node
// Content health: a review queue for the editor. Lists what is overdue or due soon,
// opportunities that need re-checking or are near their deadline, recorded passages
// the automated check could not find again, sources that changed or could not be read,
// and claims held back. Prints Markdown (for a workflow summary or an issue).
// It changes nothing. Exit code 0 always; pass --strict to exit 1 when action is due.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { REVIEW_DAYS, NEAR_DEADLINE_DAYS } from './review-policy.js';
import { isPublishable, heldBackReason } from './evidence-gate.js';
import { effectiveStatus, latestInstant } from '../src/lib/opportunity.js';

const root = new URL('..', import.meta.url).pathname;
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const now = new Date(process.env.HEALTH_NOW ?? Date.now());
const today = now.toISOString().slice(0, 10);
const days = (d) => Math.floor((now - Date.parse(`${d}T00:00:00Z`)) / 86400000);
const until = (ms) => Math.ceil((ms - now) / 86400000);

const rows = { overdue: [], soon: [], opportunities: [], passages: [], sources: [], claims: [] };
const due = (where, reviewDue) => {
  if (!reviewDue) return;
  if (reviewDue <= today) rows.overdue.push(`${where}: review was due ${reviewDue}`);
  else if (days(reviewDue) > -14) rows.soon.push(`${where}: review due ${reviewDue}`);
};

for (const dir of ['learn', 'minerals', 'countries', 'issues', 'cases', 'updates', 'pathways']) {
  for (const f of readdirSync(join(root, 'src/content', dir)).filter((x) => x.endsWith('.md'))) {
    const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(root, 'src/content', dir, f), 'utf8'));
    const d = parse(m[1]);
    const rd = d.reviewDue instanceof Date ? d.reviewDue.toISOString().slice(0, 10) : d.reviewDue;
    due(`${dir}/${f.replace(/\.md$/, '')}`, rd);
  }
}
for (const [file, field] of [['organisations', 'reviewDue'], ['finance', 'reviewDue'], ['policies', 'reviewDue'], ['programmes', 'reviewDue'], ['awards', 'reviewDue'], ['opportunities', 'reviewDue']]) {
  for (const r of json(`src/data/${file}.json`)) due(`${file}/${r.id}`, r[field]);
}

for (const o of json('src/data/opportunities.json')) {
  const s = effectiveStatus(o, now);
  const end = latestInstant(o.deadline);
  const left = end ? until(end.ms) : null;
  if (s.stale) rows.opportunities.push(`opportunities/${o.id}: recorded as ${o.status}, last checked ${o.lastChecked} (${s.ageDays} days ago). Re-check the source; until then it does not count as verified.`);
  else if (!s.key.startsWith('closed') && ['open', 'rolling'].includes(o.status) && s.ageDays >= (left != null && left <= NEAR_DEADLINE_DAYS ? REVIEW_DAYS.opportunityNearDeadline : o.status === 'rolling' ? REVIEW_DAYS.opportunityRolling : REVIEW_DAYS.opportunityActive))
    rows.opportunities.push(`opportunities/${o.id}: due for its ${left != null && left <= NEAR_DEADLINE_DAYS ? 'near-deadline' : 'regular'} check (last checked ${o.lastChecked}).`);
  if (s.key === 'closed-deadline' && o.status !== 'closed') rows.opportunities.push(`opportunities/${o.id}: deadline has passed; pages already show it as closed. Update status to "closed" (or "awarded") when you next edit it.`);
  if (o.status === 'forecast' && s.key === 'forecast-window') rows.opportunities.push(`opportunities/${o.id}: the expected window has started. Check the source and set "open" only if it says applications are being accepted.`);
  if (left != null && left > 0 && left <= NEAR_DEADLINE_DAYS && ['open', 'rolling'].includes(o.status)) rows.opportunities.push(`opportunities/${o.id}: deadline in ${left} day(s).`);
}

const check = 'data/inbox/records/passages-check.json';
if (existsSync(join(root, check))) {
  const c = json(check);
  rows.sources.push(`Last automated passage check: ${c.checkedAt}.`);
  for (const s of c.sources) {
    if (!s.readable) rows.sources.push(`${s.source}: could not be read automatically (HTTP ${s.status}${s.error ? `, ${s.error}` : ''}). Not evidence of any change; read it by hand when due.`);
    if (s.changedSinceLastCheck) rows.sources.push(`${s.source}: page text changed since the previous check. Re-read the records that cite it: ${[...new Set(s.passages.map((p) => `${p.file}/${p.record}`))].join(', ')}.`);
    for (const p of s.passages.filter((x) => x.located === false)) rows.passages.push(`${p.file}/${p.record}: passage no longer found in ${s.source}: "${p.quote.slice(0, 90)}${p.quote.length > 90 ? '…' : ''}"`);
  }
} else rows.sources.push('No automated passage check has run yet (data/inbox/records/passages-check.json is missing).');

for (const c of json('src/data/claims.json')) if (!isPublishable(c)) rows.claims.push(`claims/${c.id}: held back. ${heldBackReason(c)}`);

const section = (t, list, empty) => [`## ${t} (${list.length})`, '', ...(list.length ? list.map((x) => `- ${x}`) : [`- ${empty}`]), ''];
const out = [
  `# Content health, ${today}`, '',
  'A review queue generated from the records. Automated checks are technical; they never change a record. Review dates change only when the editor reviews.', '',
  ...section('Opportunities needing attention', rows.opportunities, 'None.'),
  ...section('Recorded passages not found again', rows.passages, 'None.'),
  ...section('Sources', rows.sources, 'Nothing to report.'),
  ...section('Reviews overdue', rows.overdue, 'None.'),
  ...section('Reviews due in the next 14 days', rows.soon, 'None.'),
  ...section('Claims held back', rows.claims, 'None.'),
];
console.log(out.join('\n'));
const actionable = rows.opportunities.length + rows.passages.length + rows.overdue.length;
if (process.argv.includes('--strict') && actionable) process.exit(1);
