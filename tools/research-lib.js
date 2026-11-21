// Shared helpers for the source verification pipeline.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const ROOT = new URL('..', import.meta.url).pathname;
export const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
export const writeJson = (p, v) => { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), JSON.stringify(v, null, 2) + '\n'); };
export const exists = (p) => existsSync(join(ROOT, p));

/** Batch folders sort alphabetically in the order they were created. */
export const BATCH_NAME = /^\d{4}-\d{2}-\d+-[a-z0-9-]+$/;

/** Latest batch name (folders under research/ sort by date prefix), or the one given. */
export function batchName(arg) {
  if (arg) return arg;
  const dirs = readdirSync(join(ROOT, 'research'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  if (!dirs.length) throw new Error('No research batches found under research/.');
  const bad = dirs.filter((d) => !BATCH_NAME.test(d));
  if (bad.length) throw new Error(`research/${bad[0]}: batch names must be YYYY-MM-N-label (N = sequence) so that alphabetical order is date order. Fix: rename the folder and data/inbox/<batch>.`);
  return dirs.at(-1);
}

/**
 * Normalise text and terms identically: lower case, compatibility forms, one kind of
 * space and dash, no thousands separators, no space before % (so "50 %" matches "50%").
 */
export function normalise(s) {
  return String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[  -​ ]/g, ' ')
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/(\d),(?=\d{2,3}\b)/g, '$1')
    .replace(/\s+%/g, '%')
    .replace(/\s+/g, ' ');
}

/** Original sources are the issuing body's own record; the rest are secondary. */
export const ORIGINAL_TYPES = new Set(['official', 'intergovernmental', 'legal', 'issuer']);
