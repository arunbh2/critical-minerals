// WCAG contrast for the actual foreground/background token pairs used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const tok = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (v) => (v.startsWith('#') ? v : tok[v]);

const TEXT = 4.5, LARGE = 3, UI = 3;
const pairs = [
  // [foreground, background, minimum, use]
  ['london-10', 'losangeles-95', TEXT, 'body text on warm paper'],
  ['london-5', 'losangeles-95', TEXT, 'headlines on warm paper'],
  ['london-35', 'losangeles-95', TEXT, 'metadata on warm paper'],
  ['london-35', 'paris-95', TEXT, 'hints on cool canvas'],
  ['london-35', 'london-100', TEXT, 'metadata on white tables'],
  ['chicago-30', 'losangeles-95', TEXT, 'links on warm paper'],
  ['chicago-30', 'paris-95', TEXT, 'links on cool canvas'],
  ['chicago-30', 'london-100', TEXT, 'links in white tables'],
  ['london-100', 'chicago-30', TEXT, 'primary button text'],
  ['london-100', 'chicago-20', TEXT, 'navigation and footer text'],
  ['losangeles-90', 'chicago-20', TEXT, 'footer notes'],
  ['chicago-20', 'london-100', TEXT, 'inverse button text'],
  ['london-5', 'hongkong-90', TEXT, 'Open status label'],
  ['london-5', 'newyork-90', TEXT, 'Verification due label'],
  ['london-10', 'london-95', TEXT, 'neutral status label'],
  ['tokyo-45', 'losangeles-95', TEXT, 'error text on warm paper'],
  ['tokyo-45', 'paris-95', TEXT, 'error text on worksheet'],
  ['london-35', 'london-95', TEXT, 'disabled button text'],
  ['chicago-30', 'chicago-95', TEXT, 'secondary button hover'],
  ['london-20', 'newyork-90', TEXT, 'unresolved-question panel text'],
  // Non-text: control boundaries, focus indicators, signature marks
  ['chicago-45', 'losangeles-95', UI, 'focus ring on warm paper'],
  ['chicago-45', 'paris-95', UI, 'focus ring on cool canvas'],
  ['chicago-45', 'london-100', UI, 'focus ring on white'],
  ['london-100', 'chicago-20', UI, 'focus ring on navy'],
  ['london-35', 'london-100', UI, 'input borders on white'],
  ['tokyo-45', 'london-100', UI, 'error border'],
  ['#0E6E59', 'hongkong-90', UI, 'Open status boundary'],
  ['#8A6A00', 'newyork-90', UI, 'Review status boundary'],
  ['red-base', 'losangeles-95', UI, 'red editorial rule'],
  ['red-60', 'chicago-20', UI, 'current-nav marker on navy'],
  ['chicago-30', 'losangeles-95', UI, 'secondary button border'],
];

for (const [fg, bg, min, use] of pairs) {
  test(`${use}: ${fg} on ${bg} ≥ ${min}:1`, () => {
    const r = ratio(hex(fg), hex(bg));
    assert.ok(r >= min, `${use} is ${r.toFixed(2)}:1`);
  });
}
