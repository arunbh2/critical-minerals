# Architecture

## Principles

- **Static first.** Every page is pre-rendered HTML that works without JavaScript. Search, filters, the lifecycle tabs and the worksheet are small client scripts that enhance pages that already work.
- **One source of truth per record.** Pages, related links, JSON exports, search metadata, `llms.txt` and the sitemap are all generated from `src/content` and `src/data`.
- **Typed relationships, no graph database.** Records reference each other by ID (`countries`, `minerals`, `issues`, `sources`, `claims`). `src/lib/content.ts` resolves them in both directions for the "Connected records" panel.
- **Evidence is structural.** Claims are separate records with sources, an as-of date and a verification level. Pages render them as "What we know". Interpretation (`meaning`) and open questions (`unclear`) are separate fields, so the three are always visibly distinct.

## Key modules

| Module | Role |
|---|---|
| `src/content.config.ts` | Zod schemas for every collection. Controlled vocabularies come from `src/data/vocab.json`. Exported schemas also generate the public JSON Schemas. |
| `src/lib/url.ts` | The only way to build internal URLs, so the base path is applied everywhere. |
| `src/lib/status.js` | Pure finance status logic. Access state and verification state are computed independently. An elapsed deadline shows as closed; an undated record is never auto-closed. Used at build time, in the browser (`src/scripts/filters.ts` recomputes on load) and in unit tests. |
| `src/lib/worksheet.js` | Worksheet definition and Markdown/JSON export. It has no score field, by design. |
| `src/scripts/filters.ts` | URL-synced filters with history support, reset and an empty state. |
| `src/pages/data/*` | JSON exports of approved public fields, and JSON Schemas. |

## Evidence gate

Claims live in `src/data/claims.json`. Two separate things are recorded on each: where the automated pipeline located a supporting passage (`verification`, from `tools/research-*.js` and `tools/verify-sources.js`, which run in GitHub Actions because they need open internet access), and whether that passage, once read, supports the claim as worded (`review`, from `research/<batch>/review.json` via `tools/research-review.js`). Lexical matching cannot establish support: a source can contain every term while contradicting the claim. `tools/evidence-gate.js` is the single gate used by pages, packs, AI files, counts and checks; `tools/check-claims.js` stops page prose from restating a figure that only a held-back claim supports.

## Funding and careers

Funders, administrators, recipients and employers are organisations with **roles**, not separate databases: one organisation can fund in one transaction and receive in another. Programmes, awards and opportunities are separate collections (`src/data/*.json`) that reference organisations by id, and `tools/check-data.js` fails on any broken link. Instead of claims, these records carry short **passages** behind every amount, date, eligibility rule and status; `tools/check-record-passages.js` re-locates them and detects source changes without ever changing a record.

Time-dependent logic is pure and shared (`src/lib/opportunity.js`): build, browser and unit tests use the same code. Deadlines keep only the precision the source gives; the latest possible instant decides expiry, so a date-only deadline never closes early. Freshness is separate from status: an open record not re-checked within its limit stops counting as verified. The static build carries an as-of status; the browser recomputes on load, so a passed deadline never shows as open between builds.

Career pathways are Markdown (`src/content/pathways/`), one per role-family id, labelled as interpretation. The skills explorer is a static page with transparent rules (pathway lists of experience and interest ids); state lives in the query string and nothing is stored.

## Maintenance

`tools/content-health.js` turns records into a review queue (cadence in `tools/review-policy.js`). The weekly Content health workflow runs it and opens or updates a single issue. Nothing automated edits records, changes a status or publishes.

## AI and agent layer

Astro endpoints in `src/pages/` build the AI files from `tools/site-text.js` and the same collections as the pages. Two post-build steps finish the job: `tools/build-well-known.js` writes `/.well-known/` for the served address, and `tools/build-twins.js` writes a Markdown twin beside every page (from its `<main>`), then `llms-full.txt`, `sitemap.xml` and `sitemap.json`. Re-run both after anything rebuilds `dist/`. Speculation rules prefetch (never prerender) same-site pages on press.

## Search

Pagefind indexes `dist/` after the Astro build. Only `<main data-pagefind-body>` is indexed. A `type` filter comes from a meta tag on each page. Result URLs get the deployment base through `pagefind.options({ baseUrl })`.

## Privacy and leak prevention

- The repository is public. Private material is never committed (`.gitignore` covers `private/` and `*.private.md`).
- `scripts/check-dist.mjs` scans the built output, including decompressed search index fragments. It fails on restricted institutional references, unapproved personal names, personal email addresses, credential-like strings, test-fixture markers and forbidden files such as `CLAUDE.md` or Markdown sources.
- There is no tracking. Fonts are self-hosted. The worksheet stores data only after explicit opt-in, in `localStorage`, with a delete control.

## Accessibility and performance

- Semantic headings, landmarks, labelled form controls, visible focus, ARIA tabs with arrow-key support, and status text that does not rely on colour.
- An axe scan (WCAG 2.1 A/AA) runs in the browser journeys at 1280px and 360px.
- CSS is inlined, and the two core font files are preloaded. Mobile Lighthouse runs on the production build (served with gzip, as Pages does) scored 97–99 Performance and 100 Accessibility, Best Practices and SEO on six representative pages, measured 17 November 2026.

## Future options, not built

These should follow demonstrated demand: an editorial CMS (for example a Git-based CMS writing to the same files), source-grounded "Ask the evidence" answers limited to the approved corpus with citation and abstention, read-only agent interfaces, local-language content and more countries.
