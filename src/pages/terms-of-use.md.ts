import type { APIRoute } from 'astro';
import { SITE, AGENT_DO, AGENT_AVOID, CONTENT_SIGNALS, ASSISTANT_WARNING } from '../../tools/site-text.js';
import { endpoints } from '../lib/ai';
export const GET: APIRoute = ({ site }) => {
  const e = endpoints(site);
  const md = [
    `# Terms of use`, '',
    `${SITE.name} is a free, public-interest guide. You may read, link, quote and reuse it under these terms.`, '',
    '## Reuse', '', SITE.licence, '',
    '## Automated access', '',
    `Search indexing, AI input and AI training are permitted (${Object.entries(CONTENT_SIGNALS).map(([k, v]) => `${k}=${v}`).join(', ')}). Please fetch politely and prefer the Markdown twins and data files.`, '',
    '## When you repeat our content', '', ...AGENT_DO.map((s) => `- ${s}`), '',
    '## Please avoid', '', ...AGENT_AVOID.map((s) => `- ${s}`), '',
    '## No warranty', '', `Content is provided as is, with dates and evidence labels. ${ASSISTANT_WARNING}`, '',
    `Corrections: ${SITE.correctionsUrl}. How to cite: ${e.cite}.`, '',
  ].join('\n');
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
