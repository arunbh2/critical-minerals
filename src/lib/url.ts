// Every internal link, asset and data URL goes through here so the site works
// under a repository path (/critical-minerals/) and at a domain root.
const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export function url(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return `${BASE}${clean}`;
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  const rel = url(path);
  return site ? new URL(rel, site).toString() : rel;
}

export function isCurrent(pathname: string, href: string): boolean {
  const target = url(href);
  return pathname === target || pathname.startsWith(target);
}
