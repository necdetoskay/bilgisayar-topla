# Implementation Work Packages

Status: Planning spec
Related issues:

- https://github.com/necdetoskay/bilgisayar-topla/issues/1
- https://github.com/necdetoskay/bilgisayar-topla/issues/2
- https://github.com/necdetoskay/bilgisayar-topla/issues/5
- https://github.com/necdetoskay/bilgisayar-topla/issues/6

## Purpose

This document converts the product feature, public-procurement specification and later PC-builder design into implementation work packages.

Current priority is backend/test-first specification pipeline. UI is intentionally out of scope until the backend contracts and tests are reliable.

## Priority Direction

Build first:

`product-extractor/manual fixture -> ProductFeatureProfile -> specification engine -> compliance report`

Build later:

`requirement-first PC builder -> ProductFeatureProfile -> specification engine`

## Package Plan

### `packages/shared-contracts`

Responsible for:

- `ProductFeatureProfile` schema/types
- evidence/readiness types
- source/evidence references
- validation helpers
- fixture loading helpers

Hard gates:

- raw URL cannot be accepted by specification module
- raw selected product object cannot be accepted by specification module
- ProductFeatureProfile must preserve evidence references

### `packages/product-extractor`

Responsible for:

- reading product page fixture or URL input
- extracting visible product properties
- separating identity fields from technical feature fields
- quarantining brand/model/vendor/title fields
- producing `ProductFeatureProfile`

Hard gates:

- product page provenance must be recorded
- identity fields must not become clause-eligible features
- sparse/ambiguous pages return `needsMoreFeatures` or `reviewRequired`

### `packages/specification`

Responsible for:

- receiving validated `ProductFeatureProfile`
- interpreting feature meaning by product category
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
- AI output cannot self-approve final readiness

### `packages/ai-runtime`

Responsible for:

- capability-based AI invocation boundary
- model/provider abstraction
- structured output validation
- usage ledger hooks
- mock adapter for tests

Hard gates:

- feature code requests capability, not model name
- fallback cannot bypass hard gates
- invalid structured output is rejected

### `packages/reports`

Responsible for:

- run report schemas
- evidence/proof chain rendering
- Markdown output
- compliance report output
- specification cost summary
- future DOCX/PDF export boundary

### `packages/model-eval`

Responsible for:

- golden dataset case format
- candidate model evaluation report
- scoring dimensions
- cost/latency comparison
- qualification status proposal

Hard gates:

- model-generated answer alone is not ground truth
- hard-gate failure blocks qualification
- unqualified model is excluded from production routing

### Later: `packages/requirements`

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

### Later: `packages/build-planner`

Responsible for:

- converting derived hardware targets into part search constraints
- preserving target evidence references
- passing constraints to scraper/selector modules
- producing build target summary
- exporting PC build as `ProductFeatureProfile`

## Suggested Implementation Order

1. Define shared contracts: evidence, readiness and `ProductFeatureProfile`.
2. Add backend test harness and fixture conventions.
3. Add `packages/specification` contract and hard gates.
4. Add first product-neutral draft renderer from fixture `ProductFeatureProfile`.
5. Add compliance report JSON output.
6. Add `packages/product-extractor` fixture/URL-to-profile path.
7. Add product category profiles for printer and monitor.
8. Add AI capability routing boundary with mock adapter.
9. Add cost ledger and specification cost summary.
10. Add golden dataset evaluation harness.
11. Return to requirement-first PC builder and Incehesap integration.

## First Implementation Issues

Current issue split:

- #3 `Implement shared evidence and readiness schema`
- #5 `Implement specification package contract and hard gates`
- #6 `Implement product-extractor module for product page URL feature extraction`
- #7 `Implement AI capability routing boundary`
- #8 `Implement AI usage cost ledger and specification cost summary`
- #9 `Implement model alternative discovery and evaluation workflow`

Recommended next issue:

- `Implement backend fixture test harness for specification pipeline`

## Validation Gates

Each work package should pass:

- `pnpm typecheck`
- schema validation tests
- evidence lineage tests
- hard-gate tests
- fixture tests

For Playwright or live URL work, keep browser runs separate from deterministic unit tests.

## Global Standards Adoption

This project adopts these global standards by reference:

- `necdetoskay/engineering-standards/standards/architecture/INGESTION_PROVENANCE_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/AI_AUTHORING_GROUNDING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/AI_RUNTIME_ROUTING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/GOLDEN_DATASET_BASELINE_v1.md`
- `necdetoskay/engineering-standards/standards/testing/ULTEF_CORE_FRAMEWORK_v1.md`
- `necdetoskay/engineering-standards/standards/testing/ULTEF_TEST_PROFILE_GATE_MODEL_v1.md`

Project-specific profiles may extend these standards but must not weaken their hard gates.
