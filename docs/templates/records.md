# JSON record templates

Copy into the matching file in `src/data/`. Unknown values are `null`.

## Finance (`finance.json`)
```json
{
  "id": "provider-programme",
  "title": "", "provider": "", "programme": "", "purpose": "",
  "supports": ["governance"],
  "instruments": ["grant"],
  "recordState": "programme",
  "geography": "", "countries": [], "minerals": [], "issues": [],
  "eligibleEntities": null, "partnershipConditions": null, "coFinancing": null,
  "amount": { "value": null, "currency": null, "basis": "unknown", "stage": "unknown", "note": "" },
  "applicationRoute": null,
  "opens": null, "closes": null,
  "sources": ["source-id"],
  "lastVerified": "2026-01-01", "verification": "corroborated",
  "uncertainties": "",
  "reviewDue": "2026-02-01"
}
```

## Policy (`policies.json`)
```json
{
  "id": "jurisdiction-short-name",
  "title": "", "jurisdiction": "", "issuingBody": "",
  "state": "adopted",
  "dates": { "adopted": "2026-01-01" },
  "primaryDocument": "source-id",
  "affectedActors": [], "mechanism": "", "funding": null,
  "summary": "", "implications": "",
  "countries": [], "minerals": [], "issues": [],
  "sources": ["source-id"], "verification": "corroborated",
  "reviewed": "2026-01-01", "reviewDue": "2026-02-01"
}
```

## Organisation (`organisations.json`)
```json
{
  "id": "short-name", "name": "", "type": "civil-society",
  "role": "", "geography": "", "initiative": "", "deliveryModel": "",
  "evidenceNote": "Role summarised from the organisation's public mandate. Implementation and evaluated results are not assessed in this profile.",
  "url": "https://", "countries": [], "minerals": [], "issues": [], "sources": [],
  "reviewed": "2026-01-01", "reviewDue": "2026-04-01"
}
```

## Source (`sources.json`)
```json
{ "id": "publisher-short-title-year", "title": "", "publisher": "", "url": "https://", "type": "official",
  "published": "2026-01", "retrieved": "2026-01-01", "locator": "Section 3", "reuse": "Link and short attributed quotation only." }
```
