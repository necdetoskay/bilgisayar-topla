# Implementation Work Packages

Status: Planning spec
Related issues:

- https://github.com/necdetoskay/bilgisayar-topla/issues/1
- https://github.com/necdetoskay/bilgisayar-topla/issues/2

## Purpose

This document converts the requirement-first and public-procurement specification design into implementation work packages.

## Package Plan

### `packages/requirements`

Responsible for:

- parsing user need and software names
- resolving software versions
- official source registry
- source acquisition metadata
- requirement extraction schema
- evidence quality states
- derived hardware target profile

Initial fixture target:

- AutoCAD 2022
- Office/general office workload

Hard gates:

- no official source, no definitive requirement
- missing version creates clarification/review state
- AI output cannot promote itself to official requirement

### `packages/build-planner`

Responsible for:

- converting derived hardware targets into part search constraints
- preserving target evidence references
- passing constraints to scraper/selector modules
- producing build target summary

Hard gates:

- selected parts must satisfy target constraints or explain gaps
- every selected component must link to a target or user requirement
- budget conflicts must be explicit

### `packages/specification`

Responsible for:

- receiving completed build target
- generating product-neutral procurement clauses
- detecting brand/model/vendor leakage
- detecting clock-speed and overly narrow technical wording
- generating compliance report
- preserving legal and technical evidence references

Hard gates:

- brand/model leakage blocks draft readiness
- exact selected product values cannot become restrictive clauses
- unverifiable clauses require review
- missing procurement source evidence requires review

### `packages/reports`

Responsible for:

- run report schemas
- evidence/proof chain rendering
- Markdown output
- future DOCX/PDF export boundary

## Suggested Implementation Order

1. Define shared evidence and readiness types.
2. Add `packages/requirements` with fixture-based AutoCAD 2022 example.
3. Add official source registry and manual fixture source mode.
4. Add hardware target builder.
5. Connect target profile to existing scraper output contract.
6. Add `packages/specification` contract without full renderer.
7. Add brand/model/hard-gate tests.
8. Add first product-neutral draft renderer.
9. Add compliance report output.
10. Add issue-linked ULTEF qualification evidence.

## First Implementation Issues

Recommended issue split:

- `Implement shared evidence/readiness schema`
- `Implement requirements package with AutoCAD 2022 fixture`
- `Implement hardware target builder`
- `Implement specification package contract and hard gates`
- `Implement product-neutral draft specification renderer`
- `Add ULTEF tests for evidence and specification gates`

## Validation Gates

Each work package should pass:

- `pnpm typecheck`
- schema validation tests
- evidence lineage tests
- hard-gate tests
- fixture tests

For scraper-connected work, keep Playwright runs separate from deterministic unit tests.

## Global Standards Adoption

This project adopts these global standards by reference:

- `necdetoskay/engineering-standards/standards/architecture/INGESTION_PROVENANCE_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/AI_AUTHORING_GROUNDING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/testing/ULTEF_CORE_FRAMEWORK_v1.md`
- `necdetoskay/engineering-standards/standards/testing/ULTEF_TEST_PROFILE_GATE_MODEL_v1.md`

Project-specific profiles may extend these standards but must not weaken their hard gates.
