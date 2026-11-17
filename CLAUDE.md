# Critical Minerals

## Start here each session

Use these shared project instructions when working in this repository. Check the current branch and working tree before editing. Read the README for the established build, preview and validation commands. Follow the current task, and inspect the relevant content, configuration and deployment workflow before assuming how a feature works. Preserve other contributors' work.

Keep this file short and current. When an enduring decision changes hosting, public content, design or the editor workflow, update the relevant guidance in the same change. Record detailed setup steps in the README. Keep session logs and private commissioning material outside the public repository.

## Purpose and editorial decisions

Build a public-interest guide for people learning about critical minerals and for those making development and funding decisions. Begin with a global orientation and deeper coverage of India and Indonesia. Connect each value chain to the people who make decisions, receive benefits, bear risks and pay for implementation.

- Write from first principles. Explain technical terms in context. Distinguish documented facts, editorial interpretation and open questions.
- Trace consequential claims to dated sources. Describe what workers and communities report with attribution. Distinguish commitments, implementation and measured outcomes.
- For funding, distinguish strategy, programme, awarded money and verified open calls. Show eligibility, geography, instrument, deadline, source and last verification where applicable.
- Publish only approved material. Keep private affiliations, internal proposals, personal data, raw research and credentials outside tracked files, published assets, data exports and search indexes.

## Design and implementation

Use the approved masthead, compact logo, favicon and reverse assets. Follow the shared colour and typography tokens. Use red for editorial emphasis, Chicago blue for navigation and actions, warm paper for reading, and text labels for status. Design for keyboard access and 360px mobile layouts.

Keep each published record in one maintained source. Generate readable HTML, accessible tables, stable URLs and public JSON from that source. Use semantic headings and explicit source and review dates so people and agents can follow the evidence. Preserve the existing stack when it supports a static build. Astro with TypeScript is the default for a new repository.

## GitHub Pages

Build static HTML, CSS, JavaScript and public data. Generate the search index at build time. Run the worksheet and its exports in the browser.

Configure the active origin and base path centrally. A conventional project site uses https://OWNER.github.io/REPO/. An account site uses the domain root. Use https://criticalminerals.org/ as the root only when that custom domain is configured. Generate links to pages, logos, icons, downloads, JSON and search assets using the deployment base. Generate canonical and sitemap URLs for the actual served address.

Use GitHub Actions for deployment. Build and validate pull requests. On the deployment branch, publish only the validated static output through the Pages workflow. Use the actual default branch, lockfile and build output directory. Keep the repository-root CLAUDE.md alongside the source files and outside the published artifact.

## Before handing off

Run the repository's production build and relevant checks. Preview the production output under the intended base path. Open a nested country page directly, follow a link home, perform a search, check the favicon and export a worksheet. Check for missing assets and private material in the generated artifact. Report exactly what was tested and any remaining publishing or domain setup.

## Repository decisions (keep current)

- **This repository is public.** Never commit the commissioning brief, the verification queue, leadership notes or other private material. `private/` and `*.private.md` are git-ignored for local working files.
- **Stack:** Astro 7 + TypeScript, static output to `dist/`, Pagefind search, self-hosted Source Serif 4 and Source Sans 3. Node version in `.nvmrc`.
- **Origin and base path:** set only in `astro.config.mjs` from `SITE_URL` and `BASE_PATH` (default `https://arunbh2.github.io` + `/critical-minerals`). CI passes the values from `actions/configure-pages`. Build every internal URL with `url()` from `src/lib/url.ts`.
- **Deployment branch:** `main`. Workflow: `.github/workflows/deploy.yml`.
- **Content model:** Markdown in `src/content/*`, structured records in `src/data/*.json`, controlled vocabularies in `src/data/vocab.json`, schemas in `src/content.config.ts`. Claims live in `src/data/claims.json` and cite `src/data/sources.json`.
- **Evidence gate:** a claim reaches a page only when the Verify sources workflow finds every term it rests on in a cited source. Labels: `original-checked`, `secondary`, `not-verified` (never "failed"). Stage new claims in a new `research/YYYY-MM-N-label/claims.json`; never hand-edit `verification` in `src/data/claims.json`. Every number in a claim must be one of its terms. A finance record may be `open` only if `original-checked` with an application route.
- **Shared words:** anything said both on a page and in an AI file comes from `tools/site-text.js`. Counts come from `src/data/site/counts.json` (built by `tools/build-counts.js`), never typed.
- **AI access:** Markdown twins, llms.txt, llms-full.txt, for-ai, packs, OpenAPI, .well-known and discovery files are generated at build. The deploy uploads with `include-hidden-files: true`; keep it, or `/.well-known/` disappears. Content signals: search, ai-input and ai-train all yes.
- **Titles and descriptions:** every page needs a 2-4 word `shortTitle` (if its title is longer or shorter) and a summary that yields a 50-170 character description.
- **Voice:** no blame, ranking or hype; no individuals named; no em dashes or exclamation marks. `tools/check-voice.js` enforces it.
- **Privacy:** no third-party calls. Add any new one to /privacy/ in the same change.
- **Design tokens:** foundation hex values and semantic tokens in `src/styles/tokens.css`. Components use semantic tokens only. `tests/unit/contrast.test.mjs` checks every foreground/background pair in use.
- **Checks:** `npm run build` then `npm run check` (everything) or `npm run check:fast` (CI subset). The output scan reads private restricted terms from the `RESTRICTED_TERMS` secret (CI) or `private/restricted-terms.txt` (local, git-ignored); never write those terms in a tracked file.
- **Corrections route:** public GitHub issues (`src/site.config.ts`). Change it there if a dedicated channel is set up.
- **Editor attribution:** not yet confirmed; do not add a personal byline until it is.

## Plugins enabled for this repo

`.claude/settings.json` enables `document-skills` (Word, Excel, PowerPoint, PDF), `example-skills` (co-authoring, frontend design, web artifacts, webapp testing, skill creation), `claude-api`, `academy-guide` and `discernment-nudge` from the `anthropics/skills` marketplace.
