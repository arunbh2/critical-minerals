// Pure status logic shared by the build, the browser and unit tests.
// Access state (what the money is) and verification state (how fresh our check
// is) are always computed and displayed independently.

/** @param {string|null|undefined} iso */
const toTime = (iso) => (iso ? new Date(iso).getTime() : NaN);

/**
 * @param {{recordState: string, closes?: string|null, opens?: string|null}} r
 * @param {Date} now
 * @returns {{key: string, label: string, tone: 'open'|'review'|'neutral'|'closed'}}
 */
export function accessStatus(r, now = new Date()) {
  const t = now.getTime();
  if (r.recordState === 'open') {
    if (r.opens && toTime(r.opens) > t) return { key: 'upcoming', label: 'Announced, not yet open', tone: 'neutral' };
    if (r.closes && toTime(r.closes) <= t) return { key: 'closed', label: 'Closed: deadline passed', tone: 'closed' };
    if (!r.closes) return { key: 'open-undated', label: 'Open: no deadline stated', tone: 'review' };
    return { key: 'open', label: 'Open', tone: 'open' };
  }
  const labels = {
    strategy: 'Strategy or stated interest: not an open call',
    precedent: 'Historical funding precedent',
    programme: 'Defined programme: not an open call',
    award: 'Award or deployment',
  };
  return { key: r.recordState, label: labels[r.recordState] ?? r.recordState, tone: 'neutral' };
}

/**
 * Review dates never auto-close a record; they flag it for re-verification.
 * @param {{lastVerified?: string, reviewed?: string, reviewDue: string}} r
 * @param {Date} now
 */
export function verificationStatus(r, now = new Date()) {
  const checked = r.lastVerified ?? r.reviewed;
  if (toTime(r.reviewDue) <= now.getTime()) {
    return { key: 'due', label: 'Verification due', checked, tone: 'review' };
  }
  return { key: 'current', label: 'Checked', checked, tone: 'neutral' };
}

/** @param {string} iso */
export function formatDate(iso) {
  if (!iso) return 'Not stated';
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(iso);
  if (!m) return iso;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month = months[Number(m[2]) - 1];
  return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`;
}

/** Deadline with its own timezone offset preserved in the text. */
export function formatDeadline(iso) {
  if (!iso) return 'Not stated';
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(Z|[+-]\d{2}:\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${formatDate(m[1])}, ${m[2]} (UTC${m[3] === 'Z' ? '' : m[3]})`;
}

/** Words per minute for reading-time labels, computed from actual text. */
export function readingMinutes(text) {
  const words = (text || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
