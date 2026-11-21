import { getCollection } from 'astro:content';
import { effectiveStatus } from './opportunity.js';
import vocab from '../data/vocab.json';

export async function fundingData() {
  const [orgs, programmes, awards, opportunities, finance] = await Promise.all([
    getCollection('organisations'), getCollection('programmes'), getCollection('awards'), getCollection('opportunities'), getCollection('finance'),
  ]);
  const org = new Map(orgs.map((o) => [o.id, o]));
  const name = (id: string | null | undefined) => (id ? org.get(id)?.data.shortTitle ?? org.get(id)?.data.name ?? id : '');
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
