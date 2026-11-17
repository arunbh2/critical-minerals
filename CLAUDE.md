# critical-minerals

Working repository for critical-minerals research, analysis and proposal work.
The repo is new: it currently holds only this file, `README.md` and
`.claude/settings.json`. Update this file as real structure, data sources and
conventions appear, so it never describes things that are not there.

## Plugins enabled for this repo

`.claude/settings.json` registers the `anthropics/skills` marketplace and
enables five plugins. Reach for them like this:

| Plugin | Use it when |
|---|---|
| `document-skills` | The deliverable is a file: Word (`docx`), Excel (`xlsx`), PowerPoint (`pptx`) or PDF. Briefing notes, data tables, decks, reports. |
| `example-skills` | Supporting work: `doc-coauthoring` for proposals and specs, `theme-factory` and `brand-guidelines` for styling, `frontend-design` and `web-artifacts-builder` for dashboards and web pages, `webapp-testing` to check them, `skill-creator` to turn a repeated workflow into a skill. |
| `claude-api` | Code that calls the Claude API or Anthropic SDK (model IDs, tool use, caching, token limits). |
| `academy-guide` | Someone is learning how to use Claude and wants matching Claude Academy material. |
| `discernment-nudge` | Runs automatically after substantive advice or drafts, adding a few questions that help check facts and assumptions. |

## Working conventions

- **Facts first.** In research and analysis, label each claim as known
  (sourced), inferred, or uncertain. Cite the source for figures such as
  production, reserves, prices and trade flows, and give the date of the data.
- **No invented data.** If a number, source or project detail is not in the
  repo or a cited source, say so instead of filling the gap.
- **Relationships are data.** For stakeholder, funder and supply-chain work,
  record who the actors are, what each wants, who trusts whom, and where power
  and dependency sit. Treat that map as part of the analysis, not background.
- **Deliverables go in files.** Write finished documents, sheets and decks into
  the repo (suggested folders: `docs/`, `data/`, `analysis/`) and keep scratch
  work out of it.
- **Raw data stays raw.** Keep source data unmodified in `data/raw/`; put
  cleaned or derived versions elsewhere, with a note on how they were made.

## Git

- Develop on a feature branch and push there; do not push to `main` directly.
- Open a pull request only when asked.
