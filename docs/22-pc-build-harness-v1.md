# PC Build Harness v1

Status: initial implementation
Related epic: #1 — Requirement-first evidence-based PC build flow

## Purpose

The first application milestone is computer assembly, not specification generation.

The harness coordinates the requirement-first PC build flow while keeping LLM reasoning bounded by deterministic validation and evidence requirements. It is intentionally small: capabilities, tools and context are provisioned by task instead of giving every task the full agent surface.

## Architecture Decision

Adopt the reusable Radar patterns without taking a runtime dependency on DeepSeek Harness or another preview harness framework.

Patterns adopted for v1:

- task-aware harness provisioning
- harness/runtime separation
- bounded agent authority
- layered semantic/browser action surface
- evidence-backed harness refinement
- lightweight trajectory-level failure attribution
- bounded model-visible context

Deferred:

- multi-agent swarm orchestration
- autonomous harness self-modification
- long-term agent memory
- speculative/idle-time reasoning
- specification generation in the active PC-build path

## Core Rule

AI can interpret intent, normalize evidence, explain trade-offs and help with ambiguous technical text.

AI does not have final authority over deterministic constraints such as:

- CPU / motherboard socket compatibility
- RAM generation and motherboard support
- PSU capacity policy
- GPU / case clearance
- required component completeness
- price arithmetic and budget limits
- final verification readiness

The intended authority chain is:

`agent proposal -> schema/evidence validation -> deterministic domain checks -> verified result`

## Task-Aware Provisioning

### productExtraction

Minimum surface:

- browser read
- Playwright
- product extractor
- light model tier
- product-specific context only

It must not receive compatibility or build-optimizer capabilities by default.

### requirementResolution

Minimum surface:

- official source resolver
- requirement evidence
- hardware target derivation
- medium model tier when interpretation is needed

### pcBuild

Surface:

- requirement evidence
- hardware target
- catalog read
- product extraction
- candidate generation
- compatibility
- scoring
- verification
- explanation

The harness can escalate capability after an explicit insufficiency/failure signal, but capability escalation must not silently expand authority.

## PC Build Run Contract v1

Schema version: `1.0.0`

Canonical stages:

1. `intent`
2. `requirementEvidence`
3. `hardwareTarget`
4. `catalog`
5. `productExtraction`
6. `candidateGeneration`
7. `compatibility`
8. `scoring`
9. `verification`
10. `explanation`

Every run preserves:

- request and budget scope
- task provision used
- stage status
- evidence references
- output artifact references
- diagnostics
- AI provider/model/token/cost/latency records
- selected build references
- first failure attribution

A run cannot be `completed` unless every canonical stage passed, at least one build is selected, and every selected build is verified.

## Failure Attribution

The initial implementation records the earliest blocking stage and a stable failure code.

Example:

```text
intent               PASS
requirementEvidence  PASS
hardwareTarget       PASS
catalog              PASS
productExtraction    PASS
candidateGeneration  PASS
compatibility        FAIL
  GPU_CASE_CLEARANCE_MISSING
```

Later versions can add transition/event trajectories without changing the v1 run identity.

## First Vertical Acceptance Scenario

Input:

> AutoCAD 2022 ve Office icin 50.000 TL civarinda sadece kasa istiyorum.

Expected path:

1. Parse user intent and scope.
2. Resolve AutoCAD 2022 and Office requirement candidates.
3. Retrieve official requirement evidence or return `reviewRequired`.
4. Derive an evidence-linked hardware target.
5. Read available Incehesap catalog/configurator products.
6. Normalize candidates through `ProductFeatureProfile`.
7. Generate candidate builds.
8. Eliminate incompatible builds deterministically.
9. Score remaining builds against target and budget.
10. Verify the selected build independently from the explanation step.
11. Produce explanation plus run trace and AI cost/latency ledger.

## Initial Acceptance Gates

- task provisioning does not expose unrelated capabilities
- a new PC-build run contains the canonical stage order
- invalid/non-positive budget is rejected
- a run with pending/failed/review-required stages cannot claim completion
- a completed run must contain a verified build
- failed runs retain first failure attribution
- model/provider identity remains outside feature-domain hard-coding

## Next Implementation Slice

After the harness skeleton is green:

1. add explicit stage transition helpers and immutable run events
2. add `packages/requirements` contracts for software requirements and hardware targets
3. wire existing product extractor usage/cost ledger into harness `aiUsage`
4. add deterministic compatibility package contracts
5. create the AutoCAD 2022 + Office golden fixture and execute the first vertical dry run

Specification generation remains outside this slice.
