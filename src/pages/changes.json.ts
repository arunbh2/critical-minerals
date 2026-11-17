import type { APIRoute } from 'astro';
import { CHANGES } from '../lib/changelog';
import { absoluteUrl } from '../lib/url';
export const GET: APIRoute = ({ site }) => new Response(JSON.stringify({
  description: 'Dated log of substantive changes to Critical Minerals. Also at growing/ and feed.xml.',
  changes: CHANGES.map((c) => ({ ...c, urls: c.paths.map((p) => absoluteUrl(p, site)) })),
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
