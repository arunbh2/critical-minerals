#!/usr/bin/env node
// Review: copy recorded passage reviews (research/<batch>/review.json) into
// src/data/claims.json. Finding terms only locates a passage; this step records whether
// the passage supports the claim as worded. A review applies only to the exact text it
// read: if the claim's text has changed since, the claim falls back to "not-reviewed".
// Batches without a review.json are skipped.
import { readJson, writeJson, batchName, exists } from './research-lib.js';
import vocab from '../src/data/vocab.json' with { type: 'json' };

const batch = batchName(process.argv[2]);
if (!exists(`research/${batch}/review.json`)) { console.log(`No review.json in ${batch}; nothing to apply.`); process.exit(0); }
const file = readJson(`research/${batch}/review.json`);
const claims = readJson('src/data/claims.json');
const outcomes = new Set(vocab.reviewOutcomes.map((o) => o.id));
const kinds = new Set(vocab.claimKinds.map((k) => k.id));
let applied = 0, stale = 0;
for (const r of file.reviews) {
  const c = claims.find((x) => x.id === r.claim);
  if (!c) { console.error(`research/${batch}/review.json names unknown claim ${r.claim}. Fix: add it to src/data/claims.json or remove the review.`); process.exit(1); }
  if (!outcomes.has(r.outcome)) { console.error(`research/${batch}/review.json: claim ${r.claim} has unknown outcome "${r.outcome}". Use one of: ${[...outcomes].join(', ')}.`); process.exit(1); }
  if (!kinds.has(r.kind)) { console.error(`research/${batch}/review.json: claim ${r.claim} has unknown kind "${r.kind}".`); process.exit(1); }
  const textMatches = r.text === c.text;
  if (!textMatches) stale++;
  c.kind = r.kind;
  c.review = {
    outcome: textMatches ? r.outcome : 'not-reviewed',
    reviewer: textMatches ? r.reviewer : null,
    reviewedAt: textMatches ? r.reviewedAt : null,
    batch,
    qualification: textMatches ? r.qualification : 'The claim was reworded after its last review, so it must be reviewed again before it can be published.',
    history: r.history ?? null,
    passages: textMatches ? r.passages : [],
  };
  applied++;
}
writeJson('src/data/claims.json', claims);
console.log(`Applied ${applied} reviews from ${batch}${stale ? `; ${stale} claim(s) changed since review and need reviewing again` : ''}.`);
