import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveStatus, latestInstant, formatMoney, formatMoment, formatPeriod } from '../../src/lib/opportunity.js';

const op = (o) => ({ status: 'open', lastChecked: '2026-11-21', deadline: null, opens: null, ...o });

test('exact deadline closes at the stated instant', () => {
  const o = op({ deadline: { date: '2026-06-18', time: '15:00', utcOffset: '+01:00', stated: '' } });
  assert.equal(effectiveStatus(o, new Date('2026-06-18T13:59:00Z')).key, 'open');
  assert.equal(effectiveStatus(o, new Date('2026-06-18T14:01:00Z')).key, 'closed-deadline');
});

test('date-only deadline stays open until the date has ended everywhere', () => {
  const o = op({ lastChecked: '2026-12-30', deadline: { date: '2026-12-31', time: null, utcOffset: null, stated: '' } });
  assert.equal(effectiveStatus(o, new Date('2027-01-01T11:00:00Z')).key, 'open');
  assert.equal(effectiveStatus(o, new Date('2027-01-01T12:00:00Z')).key, 'closed-deadline');
  assert.equal(latestInstant(o.deadline).precision, 'date-only');
});

test('a future deadline alone does not make a forecast open', () => {
  const o = op({ status: 'forecast', opens: { date: '2026-12-07', time: '09:00', utcOffset: '+02:00', stated: '' }, deadline: { date: '2027-02-15', time: '17:00', utcOffset: '+02:00', stated: '' } });
  assert.equal(effectiveStatus(o, new Date('2026-11-25T00:00:00Z')).key, 'forecast');
  const w = effectiveStatus(o, new Date('2026-12-08T00:00:00Z'));
  assert.equal(w.key, 'forecast-window');
  assert.equal(w.verifiedOpen, false);
});

test('stale open records are not verified open and lose the apply link', () => {
  const s = effectiveStatus(op({ lastChecked: '2026-10-01' }), new Date('2026-11-21T00:00:00Z'));
  assert.equal(s.key, 'open');
  assert.equal(s.stale, true);
  assert.equal(s.verifiedOpen, false);
  assert.equal(s.canApply, false);
});

test('closed, paused and source-unavailable records never become open', () => {
  for (const status of ['closed', 'paused', 'unknown', 'cancelled', 'awarded']) {
    assert.equal(effectiveStatus(op({ status }), new Date('2026-11-21')).verifiedOpen, false);
  }
});

test('money keeps native currency and readable scale', () => {
  assert.equal(formatMoney({ value: 3000000, currency: 'USD' }), 'US$3 million');
  assert.equal(formatMoney({ value: 3258348, currency: 'GBP' }), '£3,258,348');
  assert.equal(formatMoney({ min: 10000000, max: 22000000, currency: 'EUR' }), '€10–22 million');
  assert.equal(formatMoney({ value: 31500000, currency: 'NOK' }), '31.5 million NOK');
  assert.equal(formatMoney({ value: 15000000000, currency: 'INR', display: '₹1,500 crore' }), '₹1,500 crore');
  assert.equal(formatMoney(null), 'Not disclosed');
});

test('moments never gain precision', () => {
  assert.equal(formatMoment({ date: '2026-12-31', time: null, utcOffset: null }), '31 December 2026 (closing time not stated)');
  assert.equal(formatMoment({ date: '2026-06-18', time: '15:00', utcOffset: '+01:00' }), '18 June 2026, 15:00 (UTC+01:00)');
  assert.equal(formatPeriod({ start: '2024-09', end: '2026-09' }), 'September 2024 to September 2026');
});
