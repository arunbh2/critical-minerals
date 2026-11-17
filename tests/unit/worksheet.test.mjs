import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, ALL_FIELDS, validateStep, toMarkdown, toJSON, fileSlug, isEmpty } from '../../src/lib/worksheet.js';

const sample = { place: 'Example district', activity: 'Proposed processing plant', participation_documented: 'Public hearing held (minutes, March).', workers_missing: 'No data on contractor injuries.' };

test('seven sections covering the brief', () => {
  assert.equal(STEPS.length, 7);
  const ids = new Set(ALL_FIELDS.map((f) => f.id));
  assert.equal(ids.size, ALL_FIELDS.length, 'field ids are unique');
});

test('place and activity are required; everything else optional', () => {
  assert.deepEqual(validateStep('place', {}).map((e) => e.id), ['place', 'activity']);
  assert.deepEqual(validateStep('place', sample), []);
  assert.deepEqual(validateStep('workers', {}), []);
});

test('markdown export labels user-entered material and gives no score', () => {
  const md = toMarkdown(sample, { generated: '2026-11-17T00:00:00Z' });
  assert.match(md, /^# Community-benefit assessment: Example district/);
  assert.match(md, /entered by the user/);
  assert.match(md, /no score/i);
  assert.match(md, /\(user-entered\)/);
  assert.match(md, /Public hearing held/);
  assert.doesNotMatch(md, /\bscore:\s*\d/i);
});

test('json export separates documented, assumed and missing, with null score', () => {
  const j = toJSON(sample, { generated: '2026-11-17T00:00:00Z' });
  assert.equal(j.score, null);
  assert.equal(j.userEntered, true);
  const part = j.sections.find((s) => s.id === 'participation');
  assert.deepEqual(part.answers.map((a) => a.kind), ['documented', 'assumed', 'missing']);
  assert.equal(part.answers[0].value, 'Public hearing held (minutes, March).');
  assert.equal(part.answers[1].value, null);
});

test('empty state and file naming', () => {
  assert.equal(isEmpty({}), true);
  assert.equal(isEmpty(sample), false);
  assert.equal(fileSlug(sample, new Date('2026-11-17T00:00:00Z')), 'community-benefit-example-district-2026-11-17');
  assert.equal(fileSlug({}, new Date('2026-11-17T00:00:00Z')), 'community-benefit-assessment-2026-11-17');
});
