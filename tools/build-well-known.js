#!/usr/bin/env node
// Post-build: write /.well-known/ files for the served address (read from the built
// home page's canonical URL, so project-path and custom-domain builds both work).
// security.txt Expires is set 180 days ahead at build time; the monthly scheduled
// deploy keeps it fresh, and tools/check-ai-files.js fails if it is under 30 days.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SITE, CONTENT_SIGNALS } from './site-text.js';

const dist = new URL('../dist/', import.meta.url).pathname;
const home = /<link rel="canonical" href="([^"]+)"/.exec(readFileSync(join(dist, 'index.html'), 'utf8'))?.[1];
if (!home) { console.error('dist/index.html has no canonical link. Fix: run `astro build` first.'); process.exit(1); }
const u = (p) => new URL(p, home).toString();
const basePath = new URL(home).pathname; // "/critical-minerals/" or "/"
const dir = join(dist, '.well-known');
mkdirSync(dir, { recursive: true });

const expires = new Date(Date.now() + 180 * 864e5).toISOString().replace(/\.\d{3}Z$/, 'Z');
writeFileSync(join(dir, 'security.txt'), [
  `Contact: ${SITE.securityContact}`,
  `Expires: ${expires}`,
  'Preferred-Languages: en',
  `Canonical: ${u('.well-known/security.txt')}`,
  `Policy: ${u('for-ai/')}`,
  '# Static public site: no accounts, forms that send data, or server code. Report issues privately through the Contact link.',
  '',
].join('\n'));

// TDMRep: 0 = no text-and-data-mining reservation (matches Content-Signal ai-train=yes).
writeFileSync(join(dir, 'tdmrep.json'), JSON.stringify([
  { location: `${basePath}*`, 'tdm-reservation': CONTENT_SIGNALS['ai-train'] === 'yes' ? 0 : 1 },
], null, 2) + '\n');

// RFC 9727 API catalogue as a linkset.
writeFileSync(join(dir, 'api-catalog'), JSON.stringify({
  linkset: [{
    anchor: u('.well-known/api-catalog'),
    item: [{ href: u('openapi.json'), type: 'application/json' }],
    'service-desc': [{ href: u('openapi.json'), type: 'application/vnd.oai.openapi+json' }],
    'service-doc': [{ href: u('for-ai/'), type: 'text/html' }, { href: u('data/'), type: 'text/html' }],
  }],
}, null, 2) + '\n');

// Agent resource description: a plain inventory of what agents can read here.
writeFileSync(join(dir, 'ard.json'), JSON.stringify({
  name: SITE.name,
  description: SITE.description,
  url: home,
  authentication: 'none',
  access: 'read-only static files',
  contentSignals: CONTENT_SIGNALS,
  resources: [
    { name: 'Guidance for AI systems', url: u('for-ai.json'), type: 'application/json' },
    { name: 'Guidance for AI systems (text)', url: u('for-ai.txt'), type: 'text/plain' },
    { name: 'Index', url: u('llms.txt'), type: 'text/plain' },
    { name: 'Full text', url: u('llms-full.txt'), type: 'text/plain' },
    { name: 'OpenAPI description', url: u('openapi.json'), type: 'application/json' },
    { name: 'Sitemap', url: u('sitemap.json'), type: 'application/json' },
    { name: 'Change log', url: u('changes.json'), type: 'application/json' },
  ],
  markdownTwins: `${home}<path>/index.md`,
  notes: 'This file describes resources only. It grants no permissions beyond the site terms and asks no agent to act against its user or its own guidelines.',
}, null, 2) + '\n');
console.log(`Wrote .well-known/ (security.txt expires ${expires.slice(0, 10)}, tdmrep.json, api-catalog, ard.json) for ${home}`);
