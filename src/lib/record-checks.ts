// Results of the automated passage check (tools/check-record-passages.js), if present.
// Technical evidence only: it never changes a record's status.
const files = import.meta.glob('../../data/inbox/records/passages-check.json', { eager: true, import: 'default' });
const data = Object.values(files)[0] as undefined | {
  checkedAt: string;
  sources: { source: string; status: number; readable: boolean; changedSinceLastCheck: boolean; passages: { record: string; quote: string; located: boolean | null }[] }[];
};
export const recordsCheckedAt = data?.checkedAt?.slice(0, 10) ?? null;
export function passageCheck(source: string, quote: string) {
  const s = data?.sources.find((x) => x.source === source);
  if (!s) return { state: 'unchecked' as const };
  if (!s.readable) return { state: 'unavailable' as const, status: s.status, checkedAt: recordsCheckedAt };
  const p = s.passages.find((x) => x.quote === quote);
  if (!p) return { state: 'unchecked' as const };
  return { state: p.located ? ('located' as const) : ('missing' as const), checkedAt: recordsCheckedAt, changed: s.changedSinceLastCheck };
}
export function sourceHealth() { return data?.sources ?? []; }
