// Shared SEO helpers. The check in tools/check-ai-files.js enforces the same rules.
export const DESC_MIN = 50;
export const DESC_MAX = 170;

/** A meta description of 50-170 characters cut at a sentence, else a word, boundary. */
export function metaDescription(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= DESC_MAX) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > DESC_MAX) break;
    out = (out + s).trim() + ' ';
  }
  out = out.trim();
  if (out.length >= DESC_MIN) return out;
  const cut = t.slice(0, DESC_MAX - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}

/** Title words before the site name: must be 2-4 words. */
export const titleWordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
