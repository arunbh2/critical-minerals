import { getCollection, type CollectionEntry } from 'astro:content';
import vocab from '../data/vocab.json';
import { url } from './url';

export type EntityType =
  | 'learn' | 'minerals' | 'countries' | 'issues' | 'cases' | 'updates'
  | 'organisations' | 'finance' | 'policies'
  | 'programmes' | 'awards' | 'opportunities' | 'pathways';

export const TYPE_LABEL: Record<EntityType, string> = {
  learn: 'Explainer', minerals: 'Mineral', countries: 'Country', issues: 'Issue', cases: 'Case study',
  updates: 'Update', organisations: 'Organisation', finance: 'Finance record', policies: 'Policy record',
  programmes: 'Funding programme', awards: 'Award', opportunities: 'Opportunity', pathways: 'Career pathway',
};

const ROUTE: Record<EntityType, string> = {
  learn: 'learn', minerals: 'minerals', countries: 'countries', issues: 'issues', cases: 'practice',
  updates: 'updates', organisations: 'organisations', finance: 'finance', policies: 'policies',
  programmes: 'funding/programmes', awards: 'funding/awards', opportunities: 'opportunities', pathways: 'careers/pathways',
};

export function hrefFor(type: EntityType, id: string) {
  return url(`${ROUTE[type]}/${id}/`);
}

export function vocabLabel(kind: keyof typeof vocab, id: string) {
  return (vocab[kind] as { id: string; label: string }[]).find((v) => v.id === id)?.label ?? id;
}

const published = <T extends { data: { draft?: boolean } }>(e: T) => !e.data.draft;

export interface Node {
  type: EntityType;
  id: string;
  title: string;
  summary: string;
  href: string;
  countries: string[];
  minerals: string[];
  issues: string[];
}

let graphCache: Promise<Node[]> | undefined;

export function graph(): Promise<Node[]> {
  graphCache ??= (async () => {
    const nodes: Node[] = [];
    const mdTypes = ['learn', 'minerals', 'countries', 'issues', 'cases', 'updates'] as const;
    for (const t of mdTypes) {
      for (const e of (await getCollection(t)).filter(published)) {
        const d = e.data as CollectionEntry<'learn'>['data'];
        nodes.push({ type: t, id: e.id, title: d.title, summary: d.summary, href: hrefFor(t, e.id), countries: d.countries, minerals: d.minerals, issues: d.issues });
      }
    }
    for (const e of await getCollection('organisations')) {
      nodes.push({ type: 'organisations', id: e.id, title: e.data.name, summary: e.data.role, href: hrefFor('organisations', e.id), countries: e.data.countries, minerals: e.data.minerals, issues: e.data.issues });
    }
    for (const e of await getCollection('finance')) {
      nodes.push({ type: 'finance', id: e.id, title: e.data.title, summary: e.data.purpose, href: hrefFor('finance', e.id), countries: e.data.countries, minerals: e.data.minerals, issues: e.data.issues });
    }
    for (const e of await getCollection('policies')) {
      nodes.push({ type: 'policies', id: e.id, title: e.data.title, summary: e.data.summary, href: hrefFor('policies', e.id), countries: e.data.countries, minerals: e.data.minerals, issues: e.data.issues });
    }
    for (const t of ['programmes', 'opportunities'] as const) {
      for (const e of await getCollection(t)) nodes.push({ type: t, id: e.id, title: e.data.title, summary: e.data.summary, href: hrefFor(t, e.id), countries: e.data.countries, minerals: e.data.minerals, issues: e.data.issues });
    }
    for (const e of await getCollection('awards')) {
      nodes.push({ type: 'awards', id: e.id, title: e.data.title, summary: e.data.activity, href: hrefFor('awards', e.id), countries: e.data.countries, minerals: e.data.minerals, issues: e.data.issues });
    }
    return nodes;
  })();
  return graphCache;
}

/**
 * Related records in both directions: what this record points at, and what
 * points at it. Grouped by type for display.
 */
export async function relatedTo(type: EntityType, id: string, refs: { countries?: string[]; minerals?: string[]; issues?: string[] }) {
  const all = await graph();
  const field = type === 'countries' ? 'countries' : type === 'minerals' ? 'minerals' : type === 'issues' ? 'issues' : null;
  const out = new Map<string, Node>();
  for (const n of all) {
    if (n.type === type && n.id === id) continue;
    const pointsAtMe = field ? (n[field] as string[]).includes(id) : false;
    const iPointAt =
      (n.type === 'countries' && refs.countries?.includes(n.id)) ||
      (n.type === 'minerals' && refs.minerals?.includes(n.id)) ||
      (n.type === 'issues' && refs.issues?.includes(n.id));
    if (pointsAtMe || iPointAt) out.set(`${n.type}:${n.id}`, n);
  }
  const groups: Partial<Record<EntityType, Node[]>> = {};
  for (const n of out.values()) (groups[n.type] ??= []).push(n);
  for (const k of Object.keys(groups) as EntityType[]) groups[k]!.sort((a, b) => a.title.localeCompare(b.title));
  return groups;
}

export async function claimsById(ids: string[]) {
  const all = await getCollection('claims');
  return ids.map((id) => {
    const c = all.find((x) => x.id === id);
    if (!c) throw new Error(`Unknown claim "${id}"`);
    return c;
  });
}

export async function sourcesById(ids: string[]) {
  const all = await getCollection('sources');
  return ids.map((id) => {
    const s = all.find((x) => x.id === id);
    if (!s) throw new Error(`Unknown source "${id}"`);
    return s;
  });
}

export async function titleFor(type: EntityType, id: string) {
  return (await graph()).find((n) => n.type === type && n.id === id)?.title ?? id;
}
