#!/usr/bin/env node
// One command for every check. `--fast` runs the subset CI needs on every push
// (no browser); the full run adds the browser checks. Each check names the file and
// the fix when it fails. Build first: several checks read dist/.
import { spawnSync } from 'node:child_process';

const fast = process.argv.includes('--fast');
const steps = [
  ['Counts are current', 'node tools/build-counts.js --check'],
  ['Data, schema and references', 'node tools/check-data.js'],
  ['Claims: checked terms and page figures', 'node tools/check-claims.js'],
  ['Voice', 'node tools/check-voice.js'],
  ['Unit tests (status, worksheet, contrast)', 'node --test "tests/unit/*.test.mjs"'],
  ['Build output: links, assets, private material', 'node tools/check-output.js'],
  ['AI files, twins, endpoints, SEO', 'node tools/check-ai-files.js'],
  ['Structured data', 'node tools/check-structured-data.js'],
  ['Page weight', 'node tools/check-weight.js'],
  ...(fast ? [] : [
    ['Touch targets, reflow, reduced motion', 'node tools/check-ui.js'],
    ['Browser journeys and accessibility scan', 'node tests/e2e/journeys.mjs'],
  ]),
];
const failed = [];
for (const [name, cmd] of steps) {
  process.stdout.write(`\n▶ ${name}\n`);
  const r = spawnSync(cmd, { shell: true, stdio: 'inherit' });
  if (r.status !== 0) failed.push(name);
}
console.log(`\n${steps.length - failed.length}/${steps.length} checks passed${failed.length ? `. Failed: ${failed.join('; ')}` : '.'}`);
process.exit(failed.length ? 1 : 0);
