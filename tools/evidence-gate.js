// The evidence gate, shared by pages, AI files and checks. A reported fact is published
// only when (1) its locating terms were found in a cited source and (2) the located
// passage was read and judged to support the claim as worded. Automation does step 1;
// step 2 is a review, recorded in research/<batch>/review.json.
const PUBLISH = new Set(['supported', 'supported-with-qualification']);

/** Accepts a raw claim record or an Astro collection entry ({ data }). */
export function isPublishable(claim) {
  const c = claim?.data ?? claim;
  if (!c) return false;
  if (c.kind && c.kind !== 'reported-fact') return PUBLISH.has(c.review?.outcome ?? 'not-reviewed') || c.kind === 'hypothesis' || c.kind === 'interpretation';
  return c.verification !== 'not-verified' && PUBLISH.has(c.review?.outcome ?? 'not-reviewed');
}

export function heldBackReason(claim) {
  const c = claim?.data ?? claim;
  if (c.verification === 'not-verified') return 'Supporting passage not located in any cited source.';
  const o = c.review?.outcome ?? 'not-reviewed';
  if (o === 'not-reviewed') return 'Passage located but not yet reviewed against the claim.';
  if (o === 'partly-supported') return 'The located passage supports only part of the claim.';
  if (o === 'not-supported') return 'The located passage does not support the claim.';
  return '';
}
