# Public Procurement Specification Flow

Status: Project-specific design profile
Related issue: https://github.com/necdetoskay/bilgisayar-topla/issues/2

## Purpose

After the PC build target is completed, the user may route the build into a public procurement technical specification module.

The module generates a draft technical specification and compliance report. It does not create a final legally authoritative document. Final review and approval remain with the institution/idare.

## Placement In Application Flow

The specification module runs after build completion:

1. User need is collected.
2. Official software requirements are resolved.
3. Hardware target profile is derived.
4. Incehesap-compatible PC build is assembled.
5. All selected/required properties are known.
6. Build target is handed to the specification module.
7. Specification module rewrites the build into procurement-safe technical language.
8. Compliance report flags risky clauses and missing evidence.

## Boundary

The build module may know selected products, exact models and exact properties.

The specification module MUST NOT copy selected products into the final clause wording when this creates brand/model/vendor lock-in.

Selected products are evidence that the target is realistic. They are not wording templates for the procurement specification.

## Procurement Language Principle

The generated specification must be:

- product-neutral
- measurable
- need-based
- clear and unambiguous
- reviewable during inspection/acceptance
- backed by evidence
- aligned with public procurement wording rules

## Hard Gates

The generator MUST block or flag:

- brand names
- model names
- vendor names
- product family names when they create lock-in
- exact CPU/GPU model names
- trademarked feature names when generic wording is possible
- exact performance values copied from one selected product
- clock-speed-driven requirements such as `3.5 GHz`
- unnecessary socket/chipset/dimension constraints
- subjective words such as `fast`, `quality`, `strong`, `latest` without measurable criteria
- clauses that inspection/acceptance cannot verify
- clauses that conflict with procurement source rules

## Forbidden Direction

The generator MUST NOT produce clauses like:

- `Intel Core i5 processor`
- `AMD Ryzen 5 processor`
- `NVIDIA RTX graphics card`
- `3.5 GHz or higher processor`
- `X brand or equivalent`
- `Y model or equivalent`

Even `or equivalent` is not a safe default when the clause first points to a brand/model.

## Preferred Direction

The generator SHOULD translate selected build capability into neutral criteria.

Examples:

- Use workload-driven CPU class and measurable acceptance criteria instead of CPU model.
- Use memory capacity/type requirement only when needed and inspectable.
- Use storage capacity, interface class and endurance/warranty only when justified.
- Use monitor size/resolution/panel/port needs only when operationally required.
- Use generic standards instead of vendor feature names.

## Source Baseline

Initial legal/regulatory source registry:

- 4734 sayili Kamu Ihale Kanunu, especially technical specification principles
- Mal Alimi Ihaleleri Uygulama Yonetmeligi, especially technical specification article and catalog/sample rules
- Kamu Ihale Genel Tebligi, especially mal alimi technical specification preparation guidance
- KIK/EKAP official decisions and education materials where useful

All source use must preserve provenance: URL, checkedAt, snapshot/checksum where feasible, extracted rule reference and quality state.

## Output Artifacts

Each specification run SHOULD produce:

- draft specification Markdown
- compliance report JSON
- evidence/proof chain JSON
- blocked clauses list
- review-required clauses list
- source registry snapshot
- readiness state

## Readiness States

Suggested states:

- `draftReady`: draft exists and no hard gate failed
- `reviewRequired`: draft exists but legal/policy/human review is needed
- `blocked`: hard gate failure prevents draft readiness

## Tests

Minimum tests:

- brand/model leakage is blocked
- clock-speed leakage is blocked
- selected product properties are not copied into restrictive clauses
- vague/unverifiable wording is flagged
- legal source lineage survives draft generation
- AI output cannot self-approve final specification
