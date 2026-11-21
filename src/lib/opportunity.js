// Pure logic for opportunities and money, shared by the build, the browser and unit tests.
// Application status (what the source says) and review freshness (how recently we
// checked) are computed and shown separately. Nothing here infers a deadline, a time or
// a timezone that the source did not state.

const DAY = 86400000;

/** Days after the last check when a record stops counting as verified, by status. */
export const FRESHNESS_DAYS = { open: 14, rolling: 45, forecast: 14, announced: 30 };

/**
 * The latest instant at which a stated deadline could still be in force.
 * - Exact (date, time, offset): that instant.
 * - Time without timezone: that clock time in the last timezone on Earth (UTC-12).
 * - Date only: the end of that date in UTC-12, so a date-only deadline never expires
 *   early for any reader.
 * @param {{date: string, time: string|null, utcOffset: string|null}|null|undefined} m
 */
export function latestInstant(m) {
  if (!m) return null;
  if (m.time && m.utcOffset) return { ms: Date.parse(`${m.date}T${m.time}:00${m.utcOffset}`), precision: 'exact' };
  if (m.time) return { ms: Date.parse(`${m.date}T${m.time}:00-12:00`), precision: 'time-no-zone' };
  return { ms: Date.parse(`${m.date}T23:59:59-12:00`), precision: 'date-only' };
}

/** The earliest instant at which a stated opening could have happened (UTC+14). */
export function earliestInstant(m) {
  if (!m) return null;
  if (m.time && m.utcOffset) return Date.parse(`${m.date}T${m.time}:00${m.utcOffset}`);
  if (m.time) return Date.parse(`${m.date}T${m.time}:00+14:00`);
  return Date.parse(`${m.date}T00:00:00+14:00`);
}

const LABEL = {
  announced: 'Announced: no application route yet',
  forecast: 'Forecast: not open yet',
  'forecast-window': 'Expected window has started: check the source',
  open: 'Open',
  rolling: 'Rolling: accepted until the source says otherwise',
  paused: 'Paused: no reopening date',
  closed: 'Closed',
  'closed-deadline': 'Closed: deadline passed',
  cancelled: 'Cancelled',
  awarded: 'Awarded',
  unknown: 'Status unknown',
};

/**
 * @param {{status: string, deadline?: any, opens?: any, lastChecked: string}} op
 * @param {Date} now
 */
export function effectiveStatus(op, now = new Date()) {
  const t = now.getTime();
  const live = ['open', 'rolling', 'forecast', 'announced'].includes(op.status);
  const end = latestInstant(op.deadline);
  let key = op.status;
  if (live && end && t > end.ms) key = 'closed-deadline';
  else if (op.status === 'forecast' && op.opens && t >= earliestInstant(op.opens)) key = 'forecast-window';
  const limit = FRESHNESS_DAYS[op.status];
  const ageDays = Math.floor((t - Date.parse(`${op.lastChecked}T00:00:00Z`)) / DAY);
  const stale = limit != null && ageDays > limit && !key.startsWith('closed');
  const tone = key === 'open' || key === 'rolling' ? (stale ? 'review' : 'open') : key.startsWith('closed') || key === 'cancelled' ? 'closed' : key === 'forecast-window' || key === 'unknown' ? 'review' : 'neutral';
  return {
    key,
    label: LABEL[key] ?? key,
    tone,
    stale,
    ageDays,
    /** Counts as a verified open opportunity: open or rolling, deadline not passed, recently checked. */
    verifiedOpen: (key === 'open' || key === 'rolling') && !stale,
    /** Show an apply link only while the record could still be live. */
    canApply: (key === 'open' || key === 'rolling') && !stale,
    staleNote: stale ? `Not re-checked for ${ageDays} days; treat as unverified until we check again.` : '',
  };
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtDate = (d) => { const [y, m, dd] = d.split('-'); return `${Number(dd)} ${MONTHS[Number(m) - 1]} ${y}`; };

/** A stated moment, never adding precision the source did not give. */
export function formatMoment(m) {
  if (!m) return 'Not stated';
  if (m.time && m.utcOffset) return `${fmtDate(m.date)}, ${m.time} (UTC${m.utcOffset})`;
  if (m.time) return `${fmtDate(m.date)}, ${m.time} (timezone not stated)`;
  return `${fmtDate(m.date)} (closing time not stated)`;
}

const SYMBOL = { USD: 'US$', GBP: '£', EUR: '€', INR: '₹', CAD: 'C$', AUD: 'A$' };
const scaled = (v) => {
  if (v >= 1e9 && v % 1e8 === 0) return { n: v / 1e9, unit: ' billion' };
  if (v >= 1e6 && v % 1e5 === 0) return { n: v / 1e6, unit: ' million' };
  return { n: v, unit: '' };
};
const num = (n) => n.toLocaleString('en-GB', { maximumFractionDigits: 1 });

/**
 * "US$3 million", "£3,258,348", "€10–22 million". Native currency only: no conversion.
 * @param {{value?: number|null, min?: number, max?: number, currency: string, display?: string}|null|undefined} a
 */
export function formatMoney(a) {
  if (!a) return 'Not disclosed';
  if (a.display) return a.display;
  const sym = SYMBOL[a.currency];
  const pre = sym ?? '';
  const post = sym ? '' : ` ${a.currency}`;
  const one = (v) => { const s = scaled(v); return `${pre}${num(s.n)}${s.unit}${post}`; };
  if (a.value != null) return one(a.value);
  if (a.min != null && a.max != null) {
    const lo = scaled(a.min), hi = scaled(a.max);
    if (lo.unit === hi.unit) return `${pre}${num(lo.n)}–${num(hi.n)}${hi.unit}${post}`;
    return `${one(a.min)} to ${one(a.max)}`;
  }
  if (a.max != null) return `Up to ${one(a.max)}`;
  return 'Not disclosed';
}

/** "September 2024 to September 2026". */
export function formatPeriod(p) {
  if (!p) return 'Not stated';
  const f = (ym) => { const [y, m] = ym.split('-'); return `${MONTHS[Number(m) - 1]} ${y}`; };
  return p.end ? `${f(p.start)} to ${f(p.end)}` : `From ${f(p.start)}`;
}
