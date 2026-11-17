// Shared helpers for the source verification pipeline.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = new URL('..', import.meta.url).pathname;
export const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
export const writeJson = (p, v) => writeFileSync(join(ROOT, p), JSON.stringify(v, null, 2) + '\n');
export const exists = (p) => existsSync(join(ROOT, p));

/** Latest batch name (folders under research/ sort by date prefix), or the one given. */
export function batchName(arg) {
  if (arg) return arg;
  const dirs = readdirSync(join(ROOT, 'research'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  if (!dirs.length) throw new Error('No research batches found under research/.');
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
export const ORIGINAL_TYPES = new Set(['official', 'intergovernmental', 'legal']);
