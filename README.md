# Critical Minerals

*People, value and a fair transition.*

A public-interest guide to critical minerals. It connects mineral development with workers, communities, policy, finance and environmental outcomes. The guide is a static Astro site published to GitHub Pages.

- Project-site address: <https://arunbh2.github.io/critical-minerals/>
- Intended custom domain: `criticalminerals.org`. It is not connected yet; see [Custom domain](#custom-domain).

## Requirements

- Node.js 22 (see `.nvmrc`) and npm.
- No accounts, databases, API keys or secrets.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install exact dependencies from `package-lock.json` |
| `npm run dev` | Local development server at `http://localhost:4321/critical-minerals/` |
| `npm run validate` | Content integrity: schemas, cross-references, duplicate IDs, vocabularies, finance rules |
| `npm test` | Unit tests: status and expiry logic, worksheet export, colour contrast |
| `npm run build` | Production build to `dist/` plus the Pagefind search index |
| `npm run check:dist` | Scans the **built** site: internal links and assets under the base path, canonical URLs and sitemap, and no private material or restricted references |
| `npm run test:e2e` | Browser journeys against `dist/`, served the way GitHub Pages serves a project site, plus an axe accessibility scan |
| `npm run ci` | `validate` + `test` + `build` + `check:dist` |

Run `npm run build` before `npm run test:e2e`. The first time, install a browser with `npx playwright install chromium`.

### Base path and origin

Both are set only in `astro.config.mjs`, from environment variables:

```bash
# Default: project site
SITE_URL=https://arunbh2.github.io BASE_PATH=/critical-minerals npm run build
# Custom domain at the root (only after the domain is configured)
SITE_URL=https://criticalminerals.org BASE_PATH=/ npm run build
```

In CI the deploy build reads both values from `actions/configure-pages`, so it follows whatever Pages is serving.

## Deployment

- **Workflow:** `.github/workflows/deploy.yml`
- **Deployment branch:** `main`
- **On pull requests:** validate, unit tests, production build, build-output scan and browser journeys. Nothing is deployed.
- **On push to `main`:** the same checks, then a build for the served address, an output check, an artifact upload and a deploy through the `github-pages` environment. Only the deploy job has `pages: write` and `id-token: write`.

### One-time GitHub settings

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → New repository secret:** name it `RESTRICTED_TERMS` and paste the private list of phrases that must never appear on the public site, one per line. The deploy job refuses to publish without it. Locally, the same list goes in `private/restricted-terms.txt`, which git ignores.
3. **Settings → Environments → github-pages:** keep the deployment branch rule limited to `main`. This is the default.
4. Merge to `main`, or run the workflow manually from the **Actions** tab. The deploy job prints the live URL.

## Custom domain

Do this only after the site works at the project address.

1. **Verify the domain for the account:** Profile → Settings → Pages → *Add a verified domain* → `criticalminerals.org`. Add the TXT record GitHub shows (`_github-pages-challenge-<owner>.criticalminerals.org`) at your DNS provider, then click Verify.
2. **Set DNS at the registrar:**
   - Apex `criticalminerals.org`: four `A` records, `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Optionally add `AAAA` records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and `2606:50c0:8003::153`.
   - `www`: a `CNAME` to `arunbh2.github.io`.
   - Remove any conflicting `A`, `AAAA`, `ALIAS` or `CNAME` records, and any wildcard records.
3. **Repository Settings → Pages → Custom domain:** enter `criticalminerals.org` and save. With Actions publishing, no `CNAME` file is needed in the repository.
4. When the DNS check passes, tick **Enforce HTTPS**. Certificate provisioning can take up to an hour or more.
5. Re-run the workflow. `configure-pages` will report origin `https://criticalminerals.org` and an empty base path, so canonical URLs, the sitemap and all asset links move to the root automatically.
6. Check `https://criticalminerals.org/countries/india/` directly, then a search, the favicon and a worksheet download.

References: [Astro: deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) · [GitHub: managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## Editing content

See [`docs/editorial-workflow.md`](docs/editorial-workflow.md) and the templates in [`docs/templates/`](docs/templates/). In short:

- Explainers, minerals, countries, issues, cases and updates are Markdown files in `src/content/<type>/`. The filename is the URL slug.
- Organisations, finance, policies, sources and claims are JSON in `src/data/`.
- Every factual claim goes in `src/data/claims.json` with its sources, and pages reference claims by ID.
- Run `npm run validate` before committing. It fails on broken references.

## Project structure

```text
src/pages/        routes (including JSON data endpoints under data/)
src/layouts/      page templates
src/components/   presentation components
src/content/      Markdown records
src/data/         JSON records, vocabularies, sources and claims
src/lib/          URL, status, worksheet, content and export utilities
src/styles/       design tokens and global styles
public/brand/     logo kit and icons
scripts/          validation and build-output checks
tests/            unit tests, fixtures and browser journeys
docs/             architecture, editorial workflow, templates, screenshots
```

See [`docs/architecture.md`](docs/architecture.md) for design decisions.
