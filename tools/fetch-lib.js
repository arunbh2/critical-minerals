// Shared fetching and matching for the source checks (claims and records).
import { normalise } from './research-lib.js';

export const UA = 'Mozilla/5.0 (compatible; CriticalMineralsSourceCheck/1.0; public-interest fact check)';

export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ndash;|&mdash;/g, '-')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

export async function pdfToText(buf) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const c = await page.getTextContent();
    text += ' ' + c.items.map((it) => it.str).join(' ');
  }
  return text;
}

export async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf;q=0.9,*/*;q=0.8' } });
    const type = res.headers.get('content-type') ?? '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok) return { status: res.status, type, finalUrl: res.url, text: '' };
    const isPdf = type.includes('pdf') || buf.subarray(0, 5).toString() === '%PDF-';
    const text = isPdf ? await pdfToText(buf) : htmlToText(buf.toString('utf8'));
    return { status: res.status, type: isPdf ? 'application/pdf' : type, finalUrl: res.url, text };
  } catch (e) {
    return { status: 0, type: '', finalUrl: url, text: '', error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(timer); }
}

// Terms match as whole words, so "60" never matches inside "46300". "a | b" accepts
// either spelling; a trailing * marks a deliberate prefix match ("suspen*").
export function findTerm(text, term) {
  for (const alt of term.split('|').map((x) => x.trim()).filter(Boolean)) {
    const prefix = alt.endsWith('*');
    const nt = normalise(prefix ? alt.slice(0, -1) : alt);
    const esc = nt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![a-z0-9])${esc}${prefix ? '' : '(?![a-z0-9])'}`);
    const m = re.exec(text);
    if (m) return { at: m.index, matched: m[0] };
  }
  return null;
}

