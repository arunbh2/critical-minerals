import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessStatus, verificationStatus, formatDeadline, readingMinutes } from '../../src/lib/status.js';

const { records } = JSON.parse(readFileSync(new URL('../fixtures/finance-fixtures.json', import.meta.url)));
const byId = Object.fromEntries(records.map((r) => [r.id, r]));
const now = new Date('2026-11-17T12:00:00Z');

test('open record before its deadline is shown as open', () => {
  assert.equal(accessStatus(byId['fixture-open'], now).key, 'open');
});

test('elapsed deadline removes open presentation automatically', () => {
  const s = accessStatus(byId['fixture-expired'], now);
  assert.equal(s.key, 'closed');
  assert.match(s.label, /Closed/);
});

test('deadline comparison respects the timezone offset', () => {
  const r = { recordState: 'open', closes: '2026-11-17T17:00:00+05:30' }; // 11:30 UTC
  assert.equal(accessStatus(r, new Date('2026-11-17T11:00:00Z')).key, 'open');
  assert.equal(accessStatus(r, new Date('2026-11-17T12:00:00Z')).key, 'closed');
});

test('undated open record is never auto-closed; it is flagged for review', () => {
  const s = accessStatus(byId['fixture-undated'], new Date('2030-01-01'));
  assert.equal(s.key, 'open-undated');
  assert.equal(s.tone, 'review');
});

test('not-yet-open record is not presented as open', () => {
  assert.equal(accessStatus(byId['fixture-upcoming'], now).key, 'upcoming');
});

test('a programme is never presented as an open call, whatever its dates', () => {
  const s = accessStatus(byId['fixture-programme'], now);
  assert.equal(s.key, 'programme');
  assert.match(s.label, /not an open call/);
});

test('access and verification status are independent', () => {
  // Open (access) and verification due (verification) at the same time.
  const r = byId['fixture-open'];
  assert.equal(accessStatus(r, now).key, 'open');
  assert.equal(verificationStatus(r, now).key, 'due');
  assert.equal(verificationStatus(r, now).checked, '2026-11-10');
});

test('passing a review date flags re-verification but does not change access state', () => {
  const r = byId['fixture-undated'];
  assert.equal(verificationStatus(r, now).key, 'due');
  assert.equal(accessStatus(r, now).key, 'open-undated');
});

test('deadline text keeps its timezone', () => {
  assert.equal(formatDeadline('2026-12-31T23:59:00+07:00'), '31 December 2026, 23:59 (UTC+07:00)');
  assert.equal(formatDeadline(null), 'Not stated');
});

test('reading time reflects actual length', () => {
  assert.equal(readingMinutes('word '.repeat(230)), 1);
  assert.equal(readingMinutes('word '.repeat(1150)), 5);
});
