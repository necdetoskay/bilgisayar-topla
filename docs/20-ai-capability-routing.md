# AI Capability Routing Profile

Status: Project-specific design profile
Related issues:

- https://github.com/necdetoskay/bilgisayar-topla/issues/1
- https://github.com/necdetoskay/bilgisayar-topla/issues/2
- https://github.com/necdetoskay/bilgisayar-topla/issues/5
- https://github.com/necdetoskay/bilgisayar-topla/issues/6

Global standard reference:

- `necdetoskay/engineering-standards/standards/ai/AI_RUNTIME_ROUTING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/AI_AUTHORING_GROUNDING_STANDARD_v1.md`

## Purpose

The project should not depend on a single AI model.

Different tasks need different capability, cost, latency and quality levels. Feature code must request a capability, not a concrete model name.

## Core Rule

Domain modules call an AI runtime boundary like:

`runAiCapability(capability, input, policy)`

They MUST NOT directly call a provider SDK or hard-code one model in feature logic.

## Capability Classes

### `lightExtraction`

Used for low-risk extraction and classification tasks.

Examples:

- product category guess
- simple feature label normalization
- software name/version parsing
- language detection
- duplicate feature cleanup

Expected model tier: small/cheap/fast.

Hard gates:

- output must be structured and schema-validated
- uncertainty must be expressible
- no authoritative recommendation output

### `technicalInterpretation`

Used for understanding what a feature means in its product category.

Examples:

- interpreting CPU, memory, storage, printer, monitor, network or UPS properties
- deciding whether a feature is clause-eligible
- mapping raw feature text to technical vocabulary
- detecting missing category-specific features

Expected model tier: medium or strong depending on risk.

Hard gates:

- must preserve input feature references
- must not promote brand/model fields into clause-eligible fields
- must return review-required for ambiguous interpretation

### `specClauseDrafting`

Used for converting normalized features into procurement-safe draft clauses.

Examples:

- writing product-neutral technical specification clauses
- choosing correct technical wording by category
- converting capability into measurable clause language

Expected model tier: strong.

Hard gates:

- no final clause without compliance gate
- no brand/model/vendor leakage
- no unsupported legal claim
- structured clause output must validate

### `legalProcurementResearch`

Used when a clause or rule needs current public procurement/legal source grounding.

Examples:

- checking KIK/mevzuat guidance
- resolving official source references
- identifying whether a wording pattern is risky

Expected model tier: strong plus web/retrieval capability.

Hard gates:

- cite/source evidence must be preserved
- missing official source returns review-required
- AI legal interpretation is not final legal approval

### `complianceReviewAssist`

Used to review draft clauses before deterministic gates and human review.

Examples:

- flag vague wording
- flag unverifiable criteria
- flag product lock-in risk
- suggest safer neutral wording

Expected model tier: medium/strong.

Hard gates:

- AI review cannot self-approve final readiness
- deterministic gates remain authoritative for blocked terms

## Suggested Pipeline

`ProductFeatureProfile`

-> `lightExtraction` if normalization is incomplete

-> `technicalInterpretation`

-> `legalProcurementResearch` when legal/source grounding is needed

-> `specClauseDrafting`

-> deterministic compliance gates

-> `complianceReviewAssist`

-> readiness state

## Routing Policy

Routing should apply constraints in this order:

1. capability compatibility
2. privacy/data policy
3. structured-output support
4. required quality tier
5. qualification/evaluation status
6. availability
7. cost/latency optimization
8. fallback order

Cost can optimize only after hard gates pass.

## Traceability

Every governed AI execution should record:

- capability name
- prompt version
- schema version
- model/provider/deployment identity
- input snapshot/reference
- output artifact id
- latency
- usage/cost when available
- routing decision
- readiness outcome

## Model Strategy

Initial project policy:

- simple extraction and classification can use cheaper models
- technical interpretation can use medium/strong models based on category risk
- clause drafting should use a strong model
- legal/procurement research should use a strong model with source-grounding capability
- final readiness must be decided by schema validation, evidence checks, deterministic hard gates and required review policy

## Tests

Minimum tests:

- feature code requests capability, not model name
- unsupported capability fails closed
- structured output validation failure blocks domain use
- cheap model output cannot bypass compliance gates
- fallback cannot bypass privacy/safety/source hard gates
- AI-generated clause cannot self-approve final specification
