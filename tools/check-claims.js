#!/usr/bin/env node
// Claims check: (1) every number or date in a claim's text is one of the terms its
// latest batch checked; (2) no page prose states a figure that only a held-back claim
// supports: every percentage, rupee or dollar figure in Markdown content must appear
// in a published claim used on that page.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalise, ROOT } from './research-lib.js';

const errors = [];
const claims = JSON.parse(readFileSync(join(ROOT, 'src/data/claims.json'), 'utf8'));
const published = claims.filter((c) => c.verification !== 'not-verified');
const termsFor = (c) => JSON.parse(readFileSync(join(ROOT, 'research', c.batch, 'claims.json'), 'utf8')).claims.find((x) => x.id === c.id)?.terms ?? [];
const numbers = (s) => [...normalise(s).matchAll(/(?<![a-z0-9])\d[\d.]*%?/g)].map((m) => m[0].replace(/\.$/, ''));

for (const c of published) {
  const covered = normalise(termsFor(c).join(' | '));
  for (const n of numbers(c.text)) {
    if (!new RegExp(`(?<![0-9])${n.replace(/[.%]/g, (x) => `\\${x}`)}(?![0-9])`).test(covered))
      errors.push(`src/data/claims.json: claim ${c.id} states "${n}", which its batch ${c.batch} did not check. Fix: add "${n}" to its terms in research/<batch>/claims.json and re-run verification, or remove it from the claim text.`);
  }
}

const figure = /(₹\s?[\d,.]+(?:\s?(?:lakh\s)?crore)?|US\$\s?[\d,.]+(?:\s?(?:billion|million))?|\$\s?[\d,.]+\s?(?:bn|billion|million|m)?|\d[\d,.]*\s?%)/gi;
for (const dir of ['learn', 'minerals', 'countries', 'issues', 'cases', 'updates']) {
  for (const f of readdirSync(join(ROOT, 'src/content', dir)).filter((x) => x.endsWith('.md'))) {
    const text = readFileSync(join(ROOT, 'src/content', dir, f), 'utf8');
    const ids = (/^claims:\s*\[([^\]]*)\]/m.exec(text)?.[1] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    const pageClaims = normalise(published.filter((c) => ids.includes(c.id)).map((c) => c.text).join(' '));
    const body = text.replace(/^claims:.*$/m, '');
    for (const m of body.matchAll(figure)) {
      const n = normalise(m[0]).replace(/\s/g, '');
      if (!pageClaims.replace(/\s/g, '').includes(n))
        errors.push(`src/content/${dir}/${f}: states "${m[0].trim()}" but no published claim on this page contains it. Fix: cite a published claim with this figure in "claims:", or remove the figure.`);
    }
  }
}
if (errors.length) { console.error(`Claims check failed (${errors.length}):\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Claims check passed: ${published.length} published claims fully covered by their checked terms; page figures all trace to published claims.`);
