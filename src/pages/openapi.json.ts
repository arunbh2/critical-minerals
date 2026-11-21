import type { APIRoute } from 'astro';
import { EXPORTS } from '../lib/exports';
import { CSV_EXPORTS } from '../lib/ai';
import { PACKS, SITE, TASK_EXAMPLES } from '../../tools/site-text.js';
import { absoluteUrl } from '../lib/url';

// Every path listed here must exist in the build; tools/check-ai-files.js fails otherwise.
export const GET: APIRoute = ({ site }) => {
  const server = absoluteUrl('', site).replace(/\/$/, '');
  const get = (summary: string, type: string, schemaRef?: string) => ({
    get: {
      summary,
      responses: { '200': { description: 'OK', content: { [type]: schemaRef ? { schema: { $ref: schemaRef } } : {} } } },
    },
  });
  const paths: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(EXPORTS)) {
    paths[`/data/${k}.json`] = get(`${v} (JSON). Records follow /data/schema/${k}.schema.json.`, 'application/json', '#/components/schemas/Export');
    paths[`/data/schema/${k}.schema.json`] = get(`JSON Schema for ${k} records`, 'application/schema+json');
  }
  for (const k of CSV_EXPORTS) paths[`/data/${k}.csv`] = get(`${EXPORTS[k]} (CSV; arrays joined with "; ")`, 'text/csv');
  for (const p of PACKS) paths[`/packs/${p.id}.txt`] = get(`Evidence pack: ${p.title}`, 'text/plain');
  Object.assign(paths, {
    '/for-ai.json': get('What the site offers, endpoints, citation and usage guidance', 'application/json'),
    '/for-ai.txt': get('The same guidance as plain text', 'text/plain'),
    '/llms.txt': get('Short index for language models', 'text/plain'),
    '/llms-full.txt': get('Full text of every indexable page', 'text/plain'),
    '/sitemap.json': get('Every page with its Markdown twin and last-modified date', 'application/json'),
    '/changes.json': get('Dated change log', 'application/json'),
    '/feed.xml': get('Atom feed of changes', 'application/atom+xml'),
  });
  const doc = {
    openapi: '3.1.0',
    info: {
      title: `${SITE.name} open data`,
      version: '1.1.0',
      description: `${SITE.description} These are static data resources, not an interactive server API: read-only files, no authentication, no query parameters, no rate limits. Unknown values are null; "Not stated" and "Not disclosed" mean the source does not say. Amounts carry their basis and native currency and must not be summed. Version 1.1.0 (November 2026) adds programmes, awards, opportunities and pathways, and narrows the meaning of claims.verification to "where the supporting passage was located"; use claims.review.outcome to decide what is supported.`,
      'x-task-examples': TASK_EXAMPLES,
    },
    servers: [{ url: server }],
    paths,
    components: {
      schemas: {
        Export: {
          type: 'object',
          required: ['collection', 'count', 'records'],
          properties: { collection: { type: 'string' }, description: { type: 'string' }, generated: { type: 'string', format: 'date-time' }, schema: { type: 'string' }, count: { type: 'integer' }, records: { type: 'array', items: { type: 'object' } } },
        },
      },
    },
  };
  return new Response(JSON.stringify(doc, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
