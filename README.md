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
| `npm run build` | Counts → Astro build → `.well-known/` → Markdown twins, `llms-full.txt` and sitemaps → Pagefind index |
| `npm run check` | **Every check**, including the browser ones (build first) |
| `npm run check:fast` | The subset CI runs on every push: counts, data, claims, voice, unit tests, build output, AI files, structured data, page weight |
| `npm run check:ui` | Touch targets ≥ 24px, reflow at 320px with 200% text, reduced motion |
| `npm run test:e2e` | Browser journeys and an axe accessibility scan, served the way GitHub Pages serves a project site |
| `npm run health` | The editor's review queue: opportunities to re-check, deadlines close at hand, passages not found again, sources changed or unreadable, reviews due, claims held back |
| `npm run check:passages` | Fetch each source cited by funding, careers and organisation records and find the recorded passages again (needs internet; behind a proxy, prefix `NODE_USE_ENV_PROXY=1`) |

Every check names the file and the fix when it fails. The first time, install a browser with `npx playwright install chromium`.

### Checks and what they enforce

| Check (`tools/`) | Enforces |
|---|---|
| `build-counts.js --check` | Headline counts are computed, never typed (`src/data/site/counts.json`) |
| `check-data.js` | Schemas, references, controlled vocabularies, finance rules; funding and careers relationships resolve; every passage cites a listed source; every opening and deadline date appears in a recorded passage; an open record needs an issuer or official passage and a stated deadline |
| `check-claims.js` | Every number in a published claim was a checked term; page figures trace to published claims |
| `check-voice.js` | No blame, ranking or hype words; no em dashes or exclamation marks; missing evidence is never "failed" |
| `check-output.js` | Built links and assets resolve under the base path; no private material or restricted terms |
| `check-ai-files.js` | Twins and their head links, every advertised endpoint exists, packs, `security.txt` expiry, titles (2-4 words), descriptions (50-170 characters), OG/Twitter, one h1, alt text, footer link for AI |
| `check-structured-data.js` | JSON-LD parses, required fields, breadcrumb markup matches the visible trail, headline matches the h1 |
| `check-weight.js` | HTML ≤ 30 KB gzipped and first load ≤ 400 KB per page |
| `check-ui.js` | WCAG 2.2 target size, reflow with 200% text, reduced motion |
| `tests/unit/contrast.test.mjs` | WCAG contrast for every colour pair in use |

## Evidence: how a claim is checked

Finding the right words in a source does not show that it supports a claim, so the pipeline separates **locating** a passage (automated) from **reviewing** it (reading the passage against the claim). The gate is `tools/evidence-gate.js`: a reported fact is published only when its passage was located **and** the review outcome is `supported` or `supported-with-qualification`.

1. **Stage**: write the claim precisely (scope, date, unit) with its sources and locating terms in `research/<batch>/claims.json`. Batch names are `YYYY-MM-N-label`, so alphabetical order is date order. Every number in a claim must be one of its terms.
2. **Locate**: the **Verify sources** workflow fetches each page or PDF and records found terms and short excerpts (`data/inbox/<batch>/`). Terms match as whole words; `a | b` accepts either spelling; a trailing `*` marks a prefix match. The result is stored in `verification`: `original-checked` (passage located in an official, intergovernmental, legal or issuing-organisation source), `secondary`, or `not-verified` (not located; never "failed").
3. **Review**: read each located passage against the claim and record the outcome in `research/<batch>/review.json` (`supported`, `supported-with-qualification`, `partly-supported`, `not-supported`, `not-reviewed`), with the passages read, any qualification, and who reviewed (`assisted` = AI-assisted, not yet checked by a named editor; `editor`). `tools/research-review.js` copies reviews into `src/data/claims.json`. A review applies only to the exact text it read: reword a claim and it falls back to `not-reviewed`. Where a passage supports only part of a claim, narrow the claim in a new batch and record why in `history`.
4. **Ledger**: `research/<batch>/ledger.md` lists passages located, not located, and how each was judged.

Each claim also has a `kind`: reported fact, our interpretation, or hypothesis to test. The workflow runs on any working branch when a batch, review or the record files change, commits results back to that branch, and runs monthly on `main` to report only. Never hand-edit `verification` or `review` in `src/data/claims.json`.

### Records: funding, careers and organisations

Records do not carry claims; they carry **passages**: short verbatim quotations (`passages: [{ source, quote }]`) behind every amount, date, eligibility rule and status. `tools/check-record-passages.js` fetches each cited source and finds the passages again, records a hash of the page text to detect changes, and reports sources that refuse automated requests. It never changes a record: an unreadable source is never taken as a sign that anything closed.

## Funding and careers

| Route | What it is |
|---|---|
| `/funding/` | Hub: funders, administrators, programmes, awards and opportunities kept apart |
| `/funding/funders/` | Organisations with a `funder` or `administrator` role (profiles live at `/organisations/<id>/`) |
| `/funding/programmes/`, `/funding/programmes/<id>/` | `src/data/programmes.json` |
| `/funding/awards/`, `/funding/awards/<id>/` | `src/data/awards.json`: funder, administrator, recipient, activity, period, native amount |
| `/funding/opportunities/`, `/careers/opportunities/`, `/opportunities/<id>/` | `src/data/opportunities.json`: one model for calls, tenders, consultancies and vacancies |
| `/careers/`, `/careers/pathways/<id>/`, `/careers/transition/`, `/careers/employers/`, `/careers/explorer/` | `src/content/pathways/*.md` (one per `roleFamilies` id) and organisation employer fields |
| `/finance/` | First-release finance records, kept at their addresses and linked from Funding |

Rules the code enforces:

- **Amounts** keep native currency, scale and basis (`award`, `envelope`, `per-award-range`, `ceiling-per-recipient`, ...). They are formatted as `US$3 million` and never summed or converted. A recipient's own conversion goes in `amount.reported`.
- **Deadlines** store only what the source states: `{ date, time, utcOffset, stated }`. A date-only deadline expires at the end of that date in UTC-12, so it never closes early for anyone.
- **Status** (`announced`, `forecast`, `open`, `rolling`, `paused`, `closed`, `cancelled`, `awarded`, `unknown`) is what the source said at `lastChecked`. Pages recompute it in the reader's browser (`src/lib/opportunity.js`): a passed deadline shows as closed and hides the apply link; a record not re-checked within 14 days (45 for rolling) stops counting as verified open. A future deadline alone never makes a forecast open.
- **JobPosting** structured data is emitted only for a currently active, individual `employment` record with a stated publication date, deadline and location.
- **Interpretation** on organisation and programme records (`whyItMatters`) must sit beside `notEstablished`.

## Maintenance

Review cadence is configurable in `tools/review-policy.js`: opportunities weekly (every few days near a deadline), rolling calls monthly, programmes and funders quarterly, explainers and pathways every six months. The **Content health** workflow (`.github/workflows/content-health.yml`) runs weekly: it re-locates recorded passages, builds the review queue (`npm run health`), and opens or updates one `content-health` issue when there is something to do. It never edits records or publishes anything. A build date is not a review date: only the editor changes `reviewed`, `lastChecked` and `reviewDue`.

## AI and agent access

| File | Purpose |
|---|---|
| `/for-ai/`, `/for-ai.json`, `/for-ai.txt`, `/agents.txt` | What the site offers, endpoints, how to cite, do and please-avoid lines restated from the editorial standards |
| `/llms.txt`, `/llms-full.txt` | Short index; every indexable page as text |
| `<page>/index.md` | Markdown twin of every page, linked from its head |
| `/use-with-ai/`, `/packs/*.txt` | Evidence packs per topic, with starter questions and a warning that assistants can be wrong |
| `/openapi.json`, `/.well-known/api-catalog` | Description of every static data file (JSON, CSV, schemas), with task examples. Static resources, not a server API. The build fails if a listed endpoint is missing. Version 1.1.0 narrowed `claims.verification` to "where the passage was located"; use `claims.review.outcome` |
| `/robots.txt` | Names the sitemap; `Content-Signal: search=yes, ai-input=yes, ai-train=yes` |
| `/sitemap.xml`, `/sitemap.json`, `/feed.xml`, `/changes.json` | Discovery and the dated change log (`src/data/changelog.json`) |
| `/.well-known/security.txt`, `tdmrep.json`, `ard.json` | Security contact (expiry kept fresh by the monthly rebuild), no TDM reservation, resource inventory |
| `/auth.md`, `/terms-of-use.md` | No authentication; terms of use |

The words shared by pages and AI files live in one module, `tools/site-text.js`. GitHub Pages cannot set headers or negotiate `Accept: text/markdown`, and the site says so. On a project site, crawlers read `robots.txt` and `/.well-known/` only at the domain root, so those files take full effect once `criticalminerals.org` serves the site at the root.

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
- **On push to `main`, and monthly:** the same checks, then a build for the served address, the fast checks again, an artifact upload (with `include-hidden-files: true`, so `/.well-known/` is published) and a deploy through the `github-pages` environment. Only the deploy job has `pages: write` and `id-token: write`. `_config.yml` covers the case where the site is ever published by Jekyll from a branch.

### One-time GitHub settings

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → New repository secret:** name it `RESTRICTED_TERMS` and paste the private list of phrases that must never appear on the public site, one per line (case-insensitive; write a line as `/pattern/` for a case-sensitive regular expression, such as a whole-word abbreviation). The deploy job refuses to publish without it. Locally, the same list goes in `private/restricted-terms.txt`, which git ignores.
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
- Organisations, finance, policies, programmes, awards, opportunities, sources and claims are JSON in `src/data/`; career pathways are Markdown in `src/content/pathways/`.
- Every factual claim goes in `src/data/claims.json` with its sources, and pages reference claims by ID. Funding and careers records carry their own source passages instead.
- Example records of each new type, with the add-record steps, are in [`docs/templates/funding-careers.md`](docs/templates/funding-careers.md). They are documentation only and never reach production exports.
- Run `npm run validate` before committing. It fails on broken references.

## Project structure

```text
src/pages/        routes, data endpoints (JSON, CSV, schemas) and AI files
src/layouts/      page templates (head: SEO, canonical, OG/Twitter, JSON-LD, Markdown twin link)
src/components/   presentation components
src/content/      Markdown records
src/data/         JSON records, vocabularies, sources, claims, change log, site/counts.json
src/lib/          URL, status, worksheet, content, export and AI helpers
src/styles/       design tokens and global styles
public/brand/     logo kit and icons
tools/            build-*.js (counts, twins, .well-known), *-text.js (shared words),
                  research-*.js, verify-sources.js and evidence-gate.js (claims),
                  check-record-passages.js (record passages), content-health.js and
                  review-policy.js (review queue), check-*.js and check-all.js
research/<batch>/ claims, stage, gate, apply, notes and ledger for each research batch
data/inbox/<batch>/ sources to fetch, link check results and excerpts
data/inbox/records/ latest automated check of record passages
tests/            unit tests, fixtures and browser journeys
docs/             architecture, editorial workflow, templates, screenshots
```

The spec's `/data` and `/tools` map here as follows: page data lives in `src/data` and `src/content` (Astro's content layer validates it); builders and checks live in `tools/`; the research trail lives in `research/` and `data/inbox/`. The built site is published from CI as an artifact rather than committed, so generated HTML can never drift from its source.

See [`docs/architecture.md`](docs/architecture.md) for design decisions.
