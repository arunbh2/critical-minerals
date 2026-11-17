#!/usr/bin/env node
// Checks every external URL in the source register and organisation records.
// Needs open internet access (runs in the Link check workflow).
import { readJson } from './research-lib.js';

const urls = new Map();
for (const s of readJson('src/data/sources.json')) urls.set(s.url, `src/data/sources.json (${s.id})`);
for (const o of readJson('src/data/organisations.json')) urls.set(o.url, `src/data/organisations.json (${o.id})`);
const UA = 'Mozilla/5.0 (compatible; CriticalMineralsLinkCheck/1.0)';
const bad = [];
for (const [url, where] of urls) {
  let status = 0;
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    status = r.status;
  } catch { status = 0; }
  const ok = status >= 200 && status < 400;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${status} ${url}`);
  if (!ok) bad.push(`${where}: ${url} answered ${status || 'no response'}. Fix: check the page by hand; update the URL or mark the source for review.`);
}
if (bad.length) { console.error(`\n${bad.length} link(s) need attention:\n- ${bad.join('\n- ')}`); process.exit(1); }
console.log(`All ${urls.size} external links answered.`);
