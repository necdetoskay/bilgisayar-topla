# Snapshot-Backed Requirement Extraction Pipeline v1

Status: initial implementation
Related epic: #1 — Requirement-first evidence-based PC build flow

## Purpose

This layer converts an acquired official-source snapshot into a structured `SoftwareRequirementProfile` without allowing an AI/parser proposal to become authoritative by itself.

Canonical path:

`software query -> official source resolution -> acquired snapshot -> extraction proposal -> evidence validation -> SoftwareRequirementProfile`

## Authority Rule

An extraction proposal is only a proposal.

It can become a `ready` requirement profile only when all of these are true:

- source record is `official`
- source record points to the exact acquired snapshot SHA-256
- proposal source id matches the source record
- proposal snapshot SHA-256 matches the acquired artifact
- at least one requirement field is populated
- every populated field has raw `sourceText` evidence
- each `sourceText` evidence fragment is present in the acquired snapshot

If any condition fails, no ready requirement profile is emitted.

## Field Evidence

Supported v1 fields:

- CPU
- RAM
- GPU
- storage
- operating system
- display

Each populated field has a path such as:

- `minimum.ram`
- `recommended.ram`
- `minimum.gpu`
- `recommended.gpu`

and must be paired with a raw snapshot excerpt.

Example:

```json
{
  "field": "recommended.ram",
  "sourceText": "Basic: 8 GB Recommended: 16 GB"
}
```

A normalized value such as `16 GB` is not sufficient by itself.

## Snapshot Binding

Extraction proposals include the full snapshot SHA-256.

This prevents a proposal created from one source revision from being silently reused after the official page changes.

The intended lineage is:

`sourceId + snapshotSha256 + extractionRunId + field evidence -> requirement profile`

## Composed Resolution Pipeline

`resolveSoftwareRequirements(...)` composes the resolver and extraction validator.

For every software query it performs:

1. registry resolution
2. official source acquisition
3. snapshot hashing/storage
4. extraction adapter call
5. snapshot-grounded extraction validation
6. profile emission or explicit non-ready state

Item states:

- `ready`
- `reviewRequired`
- `failed`

Bundle readiness is deterministic:

- any failed item -> `failed`
- otherwise any review-required item -> `reviewRequired`
- otherwise -> `ready`

## Generic Office Safety Behavior

For the bootstrap request:

`AutoCAD 2022 ve Office icin 50.000 TL civarinda sadece kasa istiyorum.`

expected result is:

```text
AutoCAD 2022
  -> Autodesk source resolved
  -> snapshot acquired
  -> extraction eligible

Office
  -> multiple Microsoft product-family candidates
  -> REVIEW_REQUIRED
  -> no Office fetch
  -> no Office extraction

bundle = REVIEW_REQUIRED
catalog remains blocked
```

An explicit unsupported version such as `Office 2021` does not fall back to Microsoft 365 product-family sources. It stays `notFound/reviewRequired` until an exact official source is registered or resolved safely.

## Golden Expected Data

`packages/requirements/fixtures/autocad-2022-m365-business.expected.json` records expected extraction values verified from official Autodesk and Microsoft pages.

This file is **test oracle data only**.

It MUST NOT be imported by production runtime code as a requirement database.

Its purpose is to detect extraction regressions once real acquired snapshots are fed through the extractor.

Current Windows reference expectations include:

### AutoCAD 2022

- basic processor: 2.5–2.9 GHz
- recommended processor: 3+ GHz
- basic memory: 8 GB
- recommended memory: 16 GB
- basic GPU: 1 GB / 29 GB/s / DirectX 11
- recommended GPU: 4 GB / 106 GB/s / DirectX 12
- disk: 10 GB

### Microsoft 365 business / education / government

- processor: 1.6 GHz or faster, 2-core
- memory: 4 GB; 2 GB for 32-bit
- disk: 4 GB available
- display: 1280 x 768

Microsoft workload-specific recommendations such as video-call guidance are not promoted to universal Microsoft 365 recommended requirements.

## Model Boundary

A future LLM extractor can implement `RequirementExtractionAdapter`.

The model may:

- locate relevant requirement sections
- normalize prose/table values
- distinguish minimum/recommended wording
- return field-level evidence excerpts

The model cannot:

- change source trust state
- change source/snapshot identity
- bypass evidence validation
- invent evidence excerpts
- mark its own output authoritative

## Tests

Current tests cover:

- exact AutoCAD 2022 source resolution
- generic Office ambiguity
- explicit Office 2021 no-fallback behavior
- Microsoft 365 edition resolution
- snapshot hash/persistence
- redirect allow-list enforcement
- no fetch for unresolved source ambiguity
- valid snapshot-grounded extraction
- invented evidence rejection
- populated field without evidence rejection
- snapshot SHA rebinding rejection
- non-official source rejection
- composed AutoCAD + generic Office review-required bundle
- composed AutoCAD + explicit Microsoft 365 business ready bundle
- hallucinated extraction held for review

## Next Step

The next layer is the deterministic/evidence-linked **Hardware Target Builder**.

It will consume only ready `SoftwareRequirementProfile` records, combine workload policy with official requirement evidence, and produce targets whose reasoning is traceable back to requirement field paths.
