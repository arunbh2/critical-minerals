import { getCollection } from 'astro:content';
import { accessStatus, verificationStatus } from './status.js';
import { effectiveStatus } from './opportunity.js';
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
  claims: 'Claims with their label, where the supporting passage was located, and the review outcome',
  programmes: 'Funding programmes: funder, administrator, instrument, amounts in original currency, eligibility, access route and limits',
  awards: 'Disclosed awards: funder, administrator, recipient, activity, period and amount in original currency (never summed)',
  opportunities: 'Funding calls, tenders, consultancies and vacancies, with status as recorded, status as of build, deadline as stated and freshness',
} as const;
export type ExportName = keyof typeof EXPORTS;

const routed: Partial<Record<ExportName, EntityType>> = {
  learn: 'learn', minerals: 'minerals', countries: 'countries', issues: 'issues', cases: 'cases',
  updates: 'updates', organisations: 'organisations', finance: 'finance', policies: 'policies',
  programmes: 'programmes', awards: 'awards', opportunities: 'opportunities',
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
    if (name === 'opportunities') {
      const s = effectiveStatus(data, now);
      out.statusAsOfBuild = { key: s.key, label: s.label, verifiedOpen: s.verifiedOpen, stale: s.stale, builtAt: now.toISOString(), rule: 'Recompute from deadline and lastChecked: closed once the latest possible deadline instant has passed (date-only deadlines: end of that date in UTC-12); not verified if lastChecked is older than the freshness limit for its status (open 14 days, rolling 45 days).' };
    }
    if (name === 'awards') out.limitations = 'From the recipient\'s own disclosure. A precedent, not a call for applications. Amount in original currency and basis; do not sum across records.';
    if (name === 'finance') {
      out.accessStatusText = accessStatus(data, now).label;
      out.verificationStatusText = `${verificationStatus(data, now).label} (last checked ${data.lastVerified})`;
    }
    return out;
  });
}
