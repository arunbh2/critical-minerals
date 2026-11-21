// Shared builders for AI-facing files, so endpoints list the same URLs.
import { absoluteUrl } from './url';
import { EXPORTS } from './exports';
import { PACKS } from '../../tools/site-text.js';

export function endpoints(site: URL | undefined) {
  const a = (p: string) => absoluteUrl(p, site);
  return {
    home: a(''),
    forAiPage: a('for-ai/'),
    forAiJson: a('for-ai.json'),
    forAiTxt: a('for-ai.txt'),
    llms: a('llms.txt'),
    llmsFull: a('llms-full.txt'),
    useWithAi: a('use-with-ai/'),
    cite: a('cite/'),
    corrections: a('corrections/'),
    changeLog: a('growing/'),
    changes: a('changes.json'),
    feed: a('feed.xml'),
    sitemap: a('sitemap.xml'),
    sitemapJson: a('sitemap.json'),
    openapi: a('openapi.json'),
    apiCatalog: a('.well-known/api-catalog'),
    search: a('search/?q='),
    data: Object.keys(EXPORTS).map((k) => ({ name: k, json: a(`data/${k}.json`), csv: CSV_EXPORTS.includes(k as any) ? a(`data/${k}.csv`) : null, schema: a(`data/schema/${k}.schema.json`) })),
    packs: PACKS.map((p) => ({ id: p.id, title: p.title, url: a(`packs/${p.id}.txt`) })),
    terms: a('terms-of-use.md'),
    auth: a('auth.md'),
    agents: a('agents.txt'),
  };
}

/** Flat datasets also published as CSV. */
export const CSV_EXPORTS = ['finance', 'policies', 'organisations', 'sources', 'claims', 'programmes', 'awards', 'opportunities'] as const;
