import { getCollection } from 'astro:content';
import { effectiveStatus } from './opportunity.js';
import vocab from '../data/vocab.json';

export async function fundingData() {
  const [orgs, programmes, awards, opportunities, finance] = await Promise.all([
    getCollection('organisations'), getCollection('programmes'), getCollection('awards'), getCollection('opportunities'), getCollection('finance'),
  ]);
  const org = new Map(orgs.map((o) => [o.id, o]));
  // Display names for running text: the full name unless it is long, then a common
  // short form. shortTitle exists for page titles and is not always a natural name.
  const SHORT: Record<string, string> = { unido: 'UNIDO', fcdo: 'UK FCDO', desnz: 'UK DESNZ', 'nl-mfa': 'Netherlands Ministry of Foreign Affairs', rvo: 'RVO', norad: 'Norad', 'world-bank': 'World Bank', eiti: 'EITI' };
  const name = (id: string | null | undefined) => { if (!id) return ''; const o = org.get(id); if (!o) return id; return SHORT[id] ?? (o.data.name.length <= 42 ? o.data.name : o.data.shortTitle ?? o.data.name); };
  const fullName = (id: string | null | undefined) => (id ? org.get(id)?.data.name ?? id : '');
  return { orgs, org, programmes, awards, opportunities, finance, name, fullName };
}

export type Audience = 'funding' | 'careers';
export function audienceOf(type: string): Audience {
  return ((vocab.opportunityTypes as { id: string; audience: Audience }[]).find((t) => t.id === type)?.audience) ?? 'careers';
}

/** Group opportunities for honest display: verified open first, then forecast, then the rest. */
export function groupOpportunities<T extends { data: any }>(ops: T[], now = new Date()) {
  const withStatus = ops.map((o) => ({ o, s: effectiveStatus(o.data, now) }));
  return {
    open: withStatus.filter((x) => x.s.verifiedOpen),
    needsCheck: withStatus.filter((x) => !x.s.verifiedOpen && (x.s.key === 'open' || x.s.key === 'rolling' || x.s.key === 'forecast-window')),
    upcoming: withStatus.filter((x) => x.s.key === 'forecast' || x.s.key === 'announced'),
    closed: withStatus.filter((x) => ['closed', 'closed-deadline', 'cancelled', 'awarded', 'paused', 'unknown'].includes(x.s.key)),
  };
}
