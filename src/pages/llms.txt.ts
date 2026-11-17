import type { APIRoute } from 'astro';
import { graph } from '../lib/content';
import { EXPORTS } from '../lib/exports';
import { absoluteUrl } from '../lib/url';
import { SITE } from '../site.config';

export const GET: APIRoute = async ({ site }) => {
  const nodes = await graph();
  const a = (p: string) => absoluteUrl(p, site);
  const lines = [
    `# ${SITE.name}`, '', `> ${SITE.description}`, '',
    `Coverage: ${SITE.coverage} Every page separates what is known (with dated sources), interpretation, and open questions. This index is supplementary; the HTML pages and JSON exports are authoritative.`, '',
    '## Key pages',
    `- [Start here](${a('start-here/')}): six-part learning journey`,
    `- [Methodology](${a('methodology/')})`, `- [Sources](${a('sources/')})`, `- [Open data](${a('data/')})`, '',
    '## Data',
    ...Object.entries(EXPORTS).map(([k, v]) => `- [${k}.json](${a(`data/${k}.json`)}): ${v}`), '',
    '## Records',
    ...nodes.map((n) => `- [${n.title}](${new URL(n.href, site).toString()}): ${n.summary.replace(/\s+/g, ' ')}`),
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
