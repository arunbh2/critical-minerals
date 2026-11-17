import type { APIRoute } from 'astro';
import { SITE } from '../../tools/site-text.js';
import { endpoints } from '../lib/ai';
export const GET: APIRoute = ({ site }) => {
  const e = endpoints(site);
  const md = `# Authentication\n\nNo authentication is needed. ${SITE.name} is a static, public, read-only website.\n\n- There are no accounts, API keys, tokens or rate-limited endpoints.\n- Every page, Markdown twin and data file can be fetched with a plain HTTP GET.\n- There is nothing to write to: the site accepts no submissions.\n\nStart with ${e.forAiPage} or ${e.openapi}.\n`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
