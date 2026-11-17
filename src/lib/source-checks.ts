// Latest automated fetch result per source, across research batches (newest batch wins).
const files = import.meta.glob('../../data/inbox/*/link-check.json', { eager: true, import: 'default' }) as Record<string, { batch: string; checkedAt: string; results: { source: string; status: number; textLength: number; checks: { found: string[] }[] }[] }>;
export type SourceCheck = { batch: string; checkedAt: string; status: number; read: boolean; termsFound: number };
const latest = new Map<string, SourceCheck>();
for (const key of Object.keys(files).sort()) {
  const f = files[key];
  for (const r of f.results) {
    latest.set(r.source, { batch: f.batch, checkedAt: f.checkedAt.slice(0, 10), status: r.status, read: r.status >= 200 && r.status < 300 && r.textLength > 200, termsFound: r.checks.reduce((n, c) => n + c.found.length, 0) });
  }
}
export const sourceCheck = (id: string) => latest.get(id);
