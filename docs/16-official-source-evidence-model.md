# Official Source Evidence Model

Status: Project-specific design profile
Related issue: https://github.com/necdetoskay/bilgisayar-topla/issues/1

## Purpose

Every substantive hardware target and recommendation must be traceable to official or explicitly trusted evidence.

This document adapts the global standards from `necdetoskay/engineering-standards`:

- `standards/architecture/INGESTION_PROVENANCE_STANDARD_v1.md`
- `standards/ai/AI_AUTHORING_GROUNDING_STANDARD_v1.md`
- candidate issue: `Official-source evidence chain for requirement-based recommendations`

## Evidence Chain

The application SHOULD preserve this chain:

`Official Source -> Acquired Snapshot -> Extraction Run -> Extracted Requirement -> Derived Hardware Target -> Product Selection -> Recommendation Explanation`

Derived chunks, summaries or AI outputs MUST NOT become the source of truth when original evidence exists.

## Source Record

A source record SHOULD contain:

```json
{
  "sourceId": "autodesk-autocad-2022-system-requirements",
  "type": "official",
  "vendor": "Autodesk",
  "url": "https://example.com/official-source",
  "checkedAt": "2026-08-13T00:00:00Z",
  "snapshotSha256": "optional",
  "language": "tr|en|unknown",
  "trustState": "official|trusted|manualReviewRequired"
}
```

## Extracted Requirement Record

An extracted requirement SHOULD contain:

```json
{
  "software": "AutoCAD",
  "version": "2022",
  "sourceId": "autodesk-autocad-2022-system-requirements",
  "extractionRunId": "run-id",
  "minimum": {
    "cpu": "source text or normalized value",
    "ram": "source text or normalized value",
    "gpu": "source text or normalized value",
    "storage": "source text or normalized value"
  },
  "recommended": {
    "cpu": "source text or normalized value",
    "ram": "source text or normalized value",
    "gpu": "source text or normalized value",
    "storage": "source text or normalized value"
  },
  "qualityState": "ready|warning|reviewRequired|rejected"
}
```

## Derived Hardware Target

A derived target SHOULD include:

- component class
- target value or range
- derivation reason
- source requirement references
- policy used
- readiness state

Example:

```json
{
  "component": "memory",
  "target": "32 GB RAM",
  "reason": "Recommended software requirement plus multitasking buffer.",
  "evidence": [
    {
      "sourceId": "autodesk-autocad-2022-system-requirements",
      "field": "recommended.ram"
    }
  ],
  "policy": "recommendedPlusWorkloadBuffer",
  "state": "ready"
}
```

## Recommendation Evidence

A final recommendation MUST distinguish:

- official requirement evidence
- derived hardware target
- selected product evidence
- explanation text
- assumptions and gaps

The explanation may be written in natural language, but it must link back to machine-resolvable evidence.

## Missing Evidence Policy

If official evidence cannot be found or extracted safely, the system MUST NOT fabricate final requirements.

Allowed outcomes:

- ask the user for a source
- continue with generic category guidance marked as non-authoritative
- return `reviewRequired`
- block final build recommendation

## Tests

Minimum tests:

- missing official source blocks definitive recommendation
- unsupported claim is rejected
- source lineage survives extraction and derivation
- AI output cannot self-promote
- regenerated extraction preserves previous lineage
- selected part explanation cites both target and product evidence
