# Editorial workflow

**Research → draft → source check → substantive review → publish → scheduled review → correction or archive.**

## 1. Research
Collect sources. Prefer primary sources for policy, deadlines, eligibility and finance. Uploaded or third-party documents are research inputs. They are not permission to republish.

## 2. Draft
Use a template from `docs/templates/`. Write for intelligent non-specialists and define terms where they first appear. Put interpretation in `meaning` and open questions in `unclear`, never mixed into factual claims.

## 3. Source check
Add each factual, quantitative or time-sensitive statement to `src/data/claims.json`:

```json
{ "id": "c-short-name", "text": "One verifiable statement.", "sources": ["source-id"], "verification": "corroborated", "asOf": "2025" }
```

- `primary-checked`: you read the primary document and it supports the claim.
- `corroborated`: independent reporting agrees, but the primary document has not been checked yet.
- If neither applies, **do not publish the claim**. Add it to the private verification queue, which is kept outside this repository.

Add new sources to `src/data/sources.json`. **Retrieval date is not publication date.**

## 4. Substantive review
A second reader checks fairness, attribution, the distinction between allegations, responses and findings, and that no personal or sensitive information appears.

## 5. Publish
Run `npm run validate && npm test && npm run build && npm run check:dist`, then open a pull request. CI repeats the checks and runs the browser journeys. Merging to `main` deploys.

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
- `open` requires an `applicationRoute` and `verification: primary-checked`. Validation enforces this.
- Deadlines are full ISO 8601 with a timezone offset.
- Amounts carry `stage` (pledged, committed, awarded, disbursed, target or unknown) and `basis`. Never add amounts together.
- Unknown values are `null`. Never guess.

## Automation
If automated ingestion is added later, it must propose changes into review. It must never publish allegations, eligibility rules, amounts or legal interpretation directly.
