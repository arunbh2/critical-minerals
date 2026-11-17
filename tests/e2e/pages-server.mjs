// A static server that mimics GitHub Pages for a project site: files are served
// only under the repository path, directories resolve to index.html, a missing
// trailing slash redirects, and unknown paths return dist/404.html with status 404.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = new URL('../../dist/', import.meta.url).pathname;
const base = (process.env.BASE_PATH ?? '/critical-minerals').replace(/\/$/, '') + '/';
const port = Number(process.env.PORT ?? 4322);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };

async function file(p) { try { const s = await stat(p); return s.isFile() ? p : null; } catch { return null; } }

export function start(listenPort = port) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const send404 = async () => { res.writeHead(404, { 'Content-Type': types['.html'] }); res.end(await readFile(join(dist, '404.html'))); };
    if (!path.startsWith(base)) return send404();
    const rel = normalize(path.slice(base.length)).replace(/^(\.\.[/\\])+/, '');
    const target = join(dist, rel);
    let hit = await file(target);
    if (!hit && !path.endsWith('/') && (await file(join(target, 'index.html')))) {
      res.writeHead(301, { Location: path + '/' }); return res.end();
    }
    hit ??= await file(join(target, 'index.html'));
    if (!hit) return send404();
    const type = types[extname(hit)] ?? 'application/octet-stream';
    let body = await readFile(hit);
    const headers = { 'Content-Type': type };
    // GitHub Pages compresses text responses; mirror that for realistic measurements.
    if (/text|javascript|json|svg|xml|manifest/.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
      body = gzipSync(body); headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(200, headers);
    res.end(body);
  });
  return new Promise((resolve) => server.listen(listenPort, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().then(() => console.log(`Serving dist at http://127.0.0.1:${port}${base}`));
}
