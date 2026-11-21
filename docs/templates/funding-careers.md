# Adding funding and careers records

These examples are documentation only. They are not in `src/data/` and never reach the site, its exports or its search index. Copy the shape, never the values.

## Workflow (one editor)

1. **Read the issuing organisation's own page** (or an official page about it). Do not import from aggregators.
2. **Decide what it is**: funder or administrator (an organisation), programme, award, opportunity, or a policy announcement (none of these: it goes in `policies.json`). A recipient that funds others is still a recipient in that award.
3. **Screen for relevance**: `direct` only if the source names minerals, mining, a mineral sector or the extractive sector as a purpose; otherwise `adjacent` with the reason in the record, or leave it out. Note what you excluded in `src/data/screening.json` when you screen a listing page.
4. **Copy short verbatim passages** for every amount, date, eligibility rule and status into `passages`. Keep each under 400 characters. Do not copy whole calls or job descriptions.
5. **Write unknowns as unknown**: `null`, or "Not stated" / "Not disclosed" where a sentence is needed. Never infer a salary, sponsorship, remote access, timezone or deadline.
6. **Add the source** to `src/data/sources.json` (`type: issuer` for an organisation's own page).
7. **Run** `npm run validate` and `npm run check:passages` (needs internet), then `npm run build && npm run check:fast`.
8. **Push**. The Verify sources workflow re-locates passages on the branch. Record the change in `src/data/changelog.json` if it is material.

Set `lastChecked` to the day you read the source, and `reviewDue` by the cadence in `tools/review-policy.js`. Never change either just because a build or link check ran.

## Example programme (`src/data/programmes.json`)

```json
{
  "id": "example-fund",
  "title": "Example Fund for Responsible Minerals",
  "shortTitle": "Example Fund",
  "published": "2026-12-01",
  "summary": "One or two sentences on what it finances and for whom.",
  "funders": ["example-ministry"],
  "administrators": ["example-agency"],
  "instruments": ["grant"],
  "relevance": "direct",
  "lifecycle": ["exploration-extraction"],
  "themes": ["governance"],
  "geography": "As the source states it",
  "countries": [], "minerals": [], "issues": ["accountability-remedy"],
  "objectives": "Paraphrase of the stated objectives.",
  "mineralScope": "What the source says about minerals, in its own terms.",
  "envelope": { "value": 50000000, "currency": "USD", "basis": "envelope" },
  "perAward": { "min": 100000, "max": 500000, "currency": "USD", "basis": "per-award-range" },
  "period": "As stated, or null",
  "applicants": "Who can apply, or null",
  "exclusions": "Stated exclusions, or null",
  "accessRoute": "How applications are made, or why there is none",
  "programmeStatus": "active",
  "whyItMatters": "Labelled interpretation for development organisations.",
  "notEstablished": "What the evidence does not show. Required beside whyItMatters.",
  "sources": ["example-source"],
  "passages": [{ "source": "example-source", "quote": "Short verbatim passage." }],
  "lastChecked": "2026-12-01",
  "reviewDue": "2027-03-01"
}
```

## Example award (`src/data/awards.json`)

```json
{
  "id": "example-award",
  "title": "Example Foundation grant to Example Organisation",
  "shortTitle": "Example award, 2026",
  "published": "2026-12-01",
  "funder": "example-foundation",
  "administrator": null,
  "recipient": "example-organisation",
  "programme": null,
  "instrument": "grant",
  "period": { "start": "2026-01", "end": "2027-12" },
  "amount": { "value": 250000, "currency": "EUR", "basis": "award", "reported": [] },
  "activity": "Stated purpose, faithfully paraphrased.",
  "geography": "As stated",
  "relevance": "direct",
  "intendedOutcomes": "As stated, or 'Not stated beyond the title.'",
  "resultsEvidence": null,
  "sources": ["example-source"],
  "passages": [{ "source": "example-source", "quote": "€250,000" }],
  "lastChecked": "2026-12-01",
  "reviewDue": "2027-06-01"
}
```

`resultsEvidence: null` displays as "None located"; the absence of an evaluation is not evidence of failure.

## Example opportunity (`src/data/opportunities.json`)

Exact deadline (the source states a time and a zone):

```json
"deadline": { "date": "2027-03-31", "time": "17:00", "utcOffset": "+01:00", "stated": "31 March 2027 at 17:00 BST" }
```

Date only (no time stated): leave `time` and `utcOffset` null. The record then expires at the end of that date in UTC-12.

```json
"deadline": { "date": "2027-03-31", "time": null, "utcOffset": null, "stated": "by 31 March 2027" }
```

A minimal individual consultancy:

```json
{
  "id": "example-consultancy-2027",
  "title": "Official title from the source",
  "shortTitle": "Example consultancy",
  "summary": "One faithful sentence. Do not copy the terms of reference.",
  "type": "individual-consultancy",
  "organisation": "example-organisation",
  "programme": null, "administrator": null, "instrument": "contract",
  "relevance": "direct",
  "status": "open",
  "statusBasis": "What the source says, e.g. listed under current opportunities.",
  "eligibleApplicants": "As stated",
  "applicantLocation": "Not stated",
  "beneficiaryGeography": "As stated",
  "exclusions": null, "funding": null,
  "fee": null,
  "partnership": null, "coFinancing": null,
  "opens": null,
  "deadline": { "date": "2027-03-31", "time": null, "utcOffset": null, "stated": "by 31 March 2027" },
  "published": null,
  "applicationSteps": null, "documents": null,
  "questions": ["Anything the source leaves unclear."],
  "roleFamilies": ["research-data"],
  "seniority": null, "location": null, "remote": null, "duration": null, "workAuthorisation": null,
  "countries": [], "minerals": [], "issues": [],
  "sources": ["example-source"],
  "passages": [{ "source": "example-source", "quote": "by 31 March 2027" }],
  "lastChecked": "2026-12-01",
  "reviewDue": "2026-12-08"
}
```

`fee: null` displays as "Not disclosed". An `open` record needs a stated deadline (use `rolling` if none) and a passage from the issuer or an official source. The opening and deadline dates must appear in a recorded passage. When a job closes, set `status` to `closed` and keep the record as a precedent; JobPosting markup disappears on the next build.

## Organisation roles (`src/data/organisations.json`)

Add only the fields you can source: `roles` (`funder`, `administrator`, `recipient`, `procurer`, `employer`), `headquarters`, `mineralRelevance`, `fundsWhere`, `instruments`, `accessRoute` (null = none found), `restrictions`, `whyItMatters` with `notEstablished`, `careersUrl`, `procurementUrl`, `functions` (role-family ids), `employerNote`, `passages`. Set `url` to null if the official website is not verified.

## Career pathway (`src/content/pathways/<role-family-id>.md`)

The filename must be one of the `roleFamilies` ids in `src/data/vocab.json`. See an existing pathway for every field. Illustrative titles are examples, not vacancies; put a `regulated` warning wherever professional credentials are legally required.
