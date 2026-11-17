import { getCollection } from 'astro:content';
import { accessStatus, verificationStatus } from './status.js';
import { hrefFor, type EntityType } from './content';
import { absoluteUrl } from './url';

export const EXPORTS = {
  learn: 'First-principles explainers (metadata; full text on each page)',
  minerals: 'Mineral and material-group profiles (metadata)',
  countries: 'Country dossiers (metadata)',
  issues: 'Issue explainers, including the responsibility breakdown',
  cases: 'Case studies with intervention, mechanism, evidence and limits',
  updates: 'Selected dated developments',
  organisations: 'Organisation profiles (stated mandates, not assessments)',
  finance: 'Finance records with record state, instrument, amount stage and verification',
  policies: 'Policy records with legal state, dates and mechanism',
  sources: 'Source register',
  claims: 'Claims with their sources and verification level',
} as const;
export type ExportName = keyof typeof EXPORTS;

const routed: Partial<Record<ExportName, EntityType>> = {
  learn: 'learn', minerals: 'minerals', countries: 'countries', issues: 'issues', cases: 'cases',
  updates: 'updates', organisations: 'organisations', finance: 'finance', policies: 'policies',
};

/** Only approved public fields: frontmatter/data plus canonical URL. Never bodies of private files. */
export async function exportRecords(name: ExportName, site: URL | undefined) {
  const entries = (await getCollection(name as any)).filter((e: any) => !e.data.draft);
  const now = new Date();
  return entries.map((e: any) => {
    const { draft, ...data } = e.data;
    const out: Record<string, unknown> = { id: e.id, ...data };
    const t = routed[name];
    if (t) out.url = absoluteUrl(hrefFor(t, e.id).replace(import.meta.env.BASE_URL, ''), site);
    if (name === 'finance') {
      out.accessStatusText = accessStatus(data, now).label;
      out.verificationStatusText = `${verificationStatus(data, now).label} (last checked ${data.lastVerified})`;
    }
    return out;
  });
}
