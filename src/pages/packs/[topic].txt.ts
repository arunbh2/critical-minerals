import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { PACKS, SITE, ASSISTANT_WARNING, EVIDENCE_LABELS } from '../../../tools/site-text.js';
import { graph } from '../../lib/content';
import { publishedClaims } from '../../lib/published';
import vocab from '../../data/vocab.json';

export const getStaticPaths: GetStaticPaths = () => PACKS.map((p) => ({ params: { topic: p.id } }));

export const GET: APIRoute = async ({ params, site }) => {
  const pack = PACKS.find((p) => p.id === params.topic)!;
  const nodes = await graph();
  const claims = await publishedClaims();
  const sources = new Map((await getCollection('sources')).map((s) => [s.id, s.data]));
  const md = new Map<string, any>();
  for (const t of ['learn', 'minerals', 'countries', 'issues', 'cases', 'updates'] as const) for (const e of await getCollection(t)) md.set(`${t}:${e.id}`, e.data);
  const picked = nodes.filter((n) => {
    const f = pack.filter as { countries?: string[]; types?: string[] };
    if (f.types) return f.types.includes(n.type);
    if (f.countries) return f.countries.some((c) => n.countries.includes(c) || (n.type === 'countries' && n.id === c));
    return false;
  });
  const kindLabel = (v: string) => EVIDENCE_LABELS.find((l) => l.id === v)?.label ?? v;
  const locLabel = (v: string) => vocab.verification.find((l) => l.id === v)?.label ?? v;
  const outLabel = (v: string) => vocab.reviewOutcomes.find((l) => l.id === v)?.label ?? v;
  const out: string[] = [
    `${SITE.name} evidence pack: ${pack.title}`,
    `Generated from the published site. Source: ${new URL('use-with-ai/', new URL(import.meta.env.BASE_URL, site)).toString()}`,
    '',
    `WARNING: ${ASSISTANT_WARNING}`,
    'Only reported facts whose supporting passage was located and then read against the claim are included. Each carries its label, how its passage was located, its review outcome and any qualification, and dated sources. Reviews so far were done with AI assistance and have not yet been checked by a named editor.',
    '',
    'Starter questions:',
    ...pack.questions.map((q, i) => `${i + 1}. ${q}`),
    '',
  ];
  for (const n of picked) {
    const d = md.get(`${n.type}:${n.id}`) ?? {};
    out.push('-'.repeat(60), n.title, new URL(n.href, site).toString(), '', n.summary);
    const cs = claims.filter((c) => (d.claims ?? []).includes(c.id));
    if (cs.length) {
      out.push('', 'What we know:');
      for (const c of cs) out.push(`- ${c.data.text} [${kindLabel(c.data.kind)}; ${locLabel(c.data.verification)}; ${outLabel(c.data.review.outcome)}${c.data.review.qualification ? ` (${c.data.review.qualification})` : ''}; as of ${c.data.asOf}; sources: ${c.data.sources.map((s) => `${sources.get(s)?.publisher}, ${sources.get(s)?.url}`).join(' | ')}]`);
    }
    if (d.meaning?.length) out.push('', 'What this may mean (interpretation):', ...d.meaning.map((m: string) => `- ${m}`));
    if (d.unclear?.length) out.push('', 'What remains unclear:', ...d.unclear.map((m: string) => `- ${m}`));
    if (d.reviewed) out.push('', `Reviewed: ${d.reviewed}`);
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
