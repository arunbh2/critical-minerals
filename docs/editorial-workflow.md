# Editorial workflow

**Research → draft → source check → substantive review → publish → scheduled review → correction or archive.**

## 1. Research
Collect sources. Prefer primary sources for policy, deadlines, eligibility and finance. Uploaded or third-party documents are research inputs. They are not permission to republish.

## 2. Draft
Use a template from `docs/templates/`. Write for intelligent non-specialists and define terms where they first appear. Put interpretation in `meaning` and open questions in `unclear`, never mixed into factual claims.

## 3. Source check (automated)
Stage each claim with the exact terms it rests on in a new batch folder, `research/YYYY-MM-N-label/claims.json`:

```json
{ "id": "c-short-name", "text": "One verifiable statement.", "sources": ["source-id"], "terms": ["86%", "refining", "2024"] }
```

- Every number or date in the text must be one of the terms (`tools/check-claims.js`).
- `a | b` accepts either spelling; `prefix*` matches a word start.
- Add the claim to `src/data/claims.json` with `"verification": "not-verified"`, and new sources to `src/data/sources.json`.
- Push to a working branch. The Verify sources workflow fetches the sources, gates the claims, applies labels and writes `ledger.md`, then commits the results to your branch.
- Read the ledger and the excerpts. If a term matched something unrelated, tighten the term in a new batch.

**Retrieval date is not publication date.** Missing evidence is "not verified", never "failed".

## 4. Substantive review
A second reader checks fairness, attribution, the distinction between allegations, responses and findings, and that no personal or sensitive information appears.

## 5. Publish
Run `npm run build && npm run check`, then open a pull request. CI repeats the checks and runs the browser journeys. Merging to `main` deploys.

## 6. Scheduled review
Each record has `reviewed` and `reviewDue`. Recommended intervals:

| Content | Interval |
|---|---|
| Open opportunities | Weekly |
| Active programmes, fast-moving policy | Monthly |
| Countries, organisations, minerals | Quarterly |
| Explainers | At least annually |

Pages past `reviewDue` show "Review overdue", and finance records show "Verification due". Nothing runs these reviews automatically: an editor must. Update `reviewed`, or `lastVerified` for finance, **only** when you actually re-check the sources, not when you edit wording.

## 7. Correction or archive
Corrections arrive as public GitHub issues. Fix, reset the review date, and record significant corrections on the Corrections page. Closed funding opportunities stay discoverable. Their status changes automatically when the deadline passes.

## Finance records: rules
- `recordState`: strategy, precedent, programme, open or award.
- `open` requires an `applicationRoute` and `verification: original-checked`. Validation enforces this.
- Deadlines are full ISO 8601 with a timezone offset.
- Amounts carry `stage` (pledged, committed, awarded, disbursed, target or unknown) and `basis`. Never add amounts together.
- Unknown values are `null`. Never guess.

## Automation
If automated ingestion is added later, it must propose changes into review. It must never publish allegations, eligibility rules, amounts or legal interpretation directly.

## Claims: locate, then review

1. Stage the claim with its sources and locating terms in a new `research/YYYY-MM-N-label/claims.json`.
2. Push. The Verify sources workflow locates passages and commits the excerpts.
3. Read each excerpt against the claim. Record the outcome, passages, any qualification and the reviewer in `research/<batch>/review.json`. If the passage supports only part of the claim, narrow the claim in a new batch and explain in `history`.
4. Rewording a claim resets its review. Pages say whether a review was AI-assisted or done by a named editor; no claim is marked editor-reviewed until a named editor has checked it.

## Funding and careers records

Follow [`templates/funding-careers.md`](templates/funding-careers.md). Read the issuer's own page, copy short passages for every amount, date, eligibility rule and status, write unknowns as unknown, and set `lastChecked` to the day you read it. The weekly content-health issue lists what to re-check. When a call or job closes, set its status to `closed` and keep it as a precedent.

