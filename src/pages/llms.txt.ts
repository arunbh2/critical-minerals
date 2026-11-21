import type { APIRoute } from 'astro';
import { graph } from '../lib/content';
import { endpoints } from '../lib/ai';
import { SITE, AGENT_DO, AGENT_AVOID, TASK_EXAMPLES } from '../../tools/site-text.js';
import counts from '../data/site/counts.json';

export const GET: APIRoute = async ({ site }) => {
  const e = endpoints(site);
  const nodes = await graph();
  const key = (t: string) => nodes.filter((n) => n.type === t).map((n) => `- [${n.title}](${new URL(n.href, site).toString()}): ${n.summary.replace(/\s+/g, ' ')}`);
  const lines = [
    `# ${SITE.name}`, '',
    `> ${SITE.description}`, '',
    `For: ${SITE.audience} Coverage: ${SITE.coverage} ${counts.claimsPublished} published reported facts, each with its supporting passage located and read, a review status and dated sources. Automated checks locate passages; they are not independent verification.`, '',
    '## Start here',
    `- [Information for AI systems](${e.forAiPage}) ([JSON](${e.forAiJson}), [text](${e.forAiTxt}))`,
    `- [Full text of the site](${e.llmsFull})`,
    `- [How to cite](${e.cite})`,
    `- [Use with AI and evidence packs](${e.useWithAi})`,
    `- [OpenAPI description of the data](${e.openapi})`, '',
    '## Rules for use',
    ...AGENT_DO.slice(0, 3).map((s) => `- Do: ${s}`),
    ...AGENT_AVOID.slice(0, 3).map((s) => `- Avoid: ${s}`),
    `- Every page has a Markdown twin at <page>/index.md.`, '',
    '## Learning journey', ...key('learn'), '',
    '## Countries', ...key('countries'), '',
    '## Minerals', ...key('minerals'), '',
    '## Issues', ...key('issues'), '',
    '## Funding',
    `- [Funding overview](${new URL('funding/', e.home).toString()}): funders, administrators, programmes, awards and opportunities kept apart.`,
    `- [Award ledger](${new URL('funding/awards/', e.home).toString()}): disclosed awards, funder to recipient, amounts in original currency.`,
    `- [Opportunities](${new URL('funding/opportunities/', e.home).toString()}): verified open calls separated from forecasts and closed precedents.`,
    ...key('programmes'), '',
    '## Careers',
    `- [Careers overview](${new URL('careers/', e.home).toString()})`,
    `- [Jobs, consultancies and tenders](${new URL('careers/opportunities/', e.home).toString()})`,
    ...key('pathways'), '',
    '## Task examples',
    ...TASK_EXAMPLES.map((t) => `- ${t.task}: ${t.how}`), '',
    '## Optional',
    ...key('cases'), ...key('policies'), ...key('finance'),
    `- [Organisations](${new URL('landscape/', e.home).toString()})`,
    `- [Sources](${new URL('sources/', e.home).toString()})`, '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
