import type { APIRoute } from 'astro';
import { CONTENT_SIGNALS } from '../../tools/site-text.js';
import { absoluteUrl } from '../lib/url';
// Note: on a project site (/REPO/), crawlers only read robots.txt at the domain root.
// This file becomes authoritative once the custom domain serves the site at the root.
export const GET: APIRoute = ({ site }) => new Response([
  'User-agent: *',
  `Content-Signal: ${Object.entries(CONTENT_SIGNALS).map(([k, v]) => `${k}=${v}`).join(', ')}`,
  'Allow: /',
  '',
  `Sitemap: ${absoluteUrl('sitemap.xml', site)}`,
  '',
].join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
