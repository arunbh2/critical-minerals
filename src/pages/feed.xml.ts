import type { APIRoute } from 'astro';
import { CHANGES } from '../lib/changelog';
import { SITE } from '../../tools/site-text.js';
import { absoluteUrl } from '../lib/url';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = ({ site }) => {
  const self = absoluteUrl('feed.xml', site);
  const home = absoluteUrl('', site);
  const updated = `${CHANGES[0]?.date ?? SITE.corpusReviewed}T00:00:00Z`;
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(SITE.name)}: changes</title>
  <subtitle>${esc(SITE.descriptor)}</subtitle>
  <id>${self}</id>
  <link rel="self" href="${self}"/>
  <link rel="alternate" href="${absoluteUrl('growing/', site)}"/>
  <updated>${updated}</updated>
  <author><name>${esc(SITE.name)}</name><uri>${home}</uri></author>
${CHANGES.map((c) => `  <entry>
    <title>${esc(c.title)}</title>
    <id>${absoluteUrl(`growing/#${c.id}`, site)}</id>
    <link href="${absoluteUrl(`growing/#${c.id}`, site)}"/>
    <updated>${c.date}T00:00:00Z</updated>
    <summary>${esc(c.summary)}</summary>
  </entry>`).join('\n')}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
