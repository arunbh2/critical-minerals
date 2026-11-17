import type { APIRoute } from 'astro';
import { SITE, OWNERSHIP, STANDARDS, AGENT_DO, AGENT_AVOID, HOST_LIMITS, EVIDENCE_LABELS, CONTENT_SIGNALS, AI_USE, ASSISTANT_WARNING, citation } from '../../tools/site-text.js';
import counts from '../data/site/counts.json';
import { endpoints } from '../lib/ai';

export const GET: APIRoute = ({ site }) => {
  const e = endpoints(site);
  const body = {
    name: SITE.name,
    description: SITE.description,
    audience: SITE.audience,
    coverage: SITE.coverage,
    ownership: OWNERSHIP,
    counts,
    authentication: 'None. Everything is public and read-only.',
    contentSignals: CONTENT_SIGNALS,
    evidenceLabels: EVIDENCE_LABELS,
    standards: STANDARDS,
    howAiIsUsed: AI_USE,
    please: { do: AGENT_DO, avoid: AGENT_AVOID },
    hostLimits: HOST_LIMITS,
    assistantWarning: ASSISTANT_WARNING,
    howToCite: { pattern: citation({ title: '<page title>', url: '<page url>', reviewed: '<review date shown on the page>', accessed: '<date you accessed it>' }), page: e.cite },
    endpoints: e,
    markdownTwins: 'Every HTML page has a Markdown twin at <page url>index.md, linked from the page head with rel="alternate" type="text/markdown".',
    corrections: SITE.correctionsUrl,
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
