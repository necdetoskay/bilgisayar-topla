# Model Evaluation and Cost Ledger Profile

Status: Project-specific design profile
Related issue: to be created

Global standard references:

- `necdetoskay/engineering-standards/standards/ai/AI_RUNTIME_ROUTING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/AI_AUTHORING_GROUNDING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/GOLDEN_DATASET_BASELINE_v1.md`

## Purpose

The project should continuously understand which AI models are used, how much they cost, and whether newer/cheaper qualified alternatives can perform the same capability.

This profile adds three responsibilities:

1. Model evaluation and alternative discovery.
2. Per-run/per-specification token and cost accounting.
3. Golden dataset based model quality measurement.

## Core Principle

AI model choice is not permanent.

The system should periodically evaluate new or alternative models for each capability, but production routing must still respect qualification, evidence, privacy, structured-output and compliance hard gates.

Cost optimization must never override correctness or safety gates.

## Capability-Level Alternatives

Alternatives should be evaluated by capability, not globally.

Examples:

- `lightExtraction`: cheaper/smaller models may be enough.
- `technicalInterpretation`: medium models may be tested against strong-model baselines.
- `specClauseDrafting`: strong models likely required, but alternatives can be benchmarked.
- `legalProcurementResearch`: requires source-grounding quality, not just cheap generation.
- `complianceReviewAssist`: can compare medium vs strong models.

## Evaluation Model

A candidate model can be considered only if it has:

- provider/model identity
- capability compatibility
- structured-output support when needed
- pricing metadata
- privacy/data policy compatibility
- qualification status
- benchmark/evaluation result
- fallback eligibility

## Golden Dataset Evaluation

The project should maintain a project-specific golden dataset for model comparison.

A golden case should contain:

- stable case id
- dataset version
- capability under test
- product category
- input `ProductFeatureProfile` or extractor fixture
- expected structured output when deterministic
- approved reference output or rubric when natural language varies
- forbidden output expectations
- evidence references
- compliance gate expectations
- language
- difficulty tags
- reviewer/approval metadata

Example case classes:

- normal product profiles
- edge cases
- ambiguous products
- sparse product data
- brand/model leakage traps
- clock-speed leakage traps
- network device throughput wording cases
- printer/monitor/scanner/UPS category cases
- public procurement wording risk cases
- regression cases from real failures

## Candidate vs Reference Comparison

New model candidates should be tested against the golden dataset.

Suggested comparison flow:

1. Run candidate model on the same input fixtures.
2. Validate structured output schema.
3. Run deterministic compliance gates.
4. Compare candidate output to approved reference output/rubric.
5. Optionally use a stronger baseline/judge model for qualitative review.
6. Record score, cost, latency and failure reasons.
7. Decide candidate status: `candidate`, `qualified`, `rejected`, `deprecated`.

The reference output should come from deterministic/domain truth, approved canonical material, or human-reviewed expected output. A model-generated output alone is not ground truth.

## Scoring Dimensions

Capability-specific scoring should include:

- schema validity
- task correctness
- technical terminology correctness
- evidence preservation
- product-neutral wording
- brand/model/vendor leakage avoidance
- measurable clause quality
- legal/procurement risk detection
- correct abstention/reviewRequired behavior
- Turkish language quality
- latency
- estimated/actual cost

Hard-gate failures cannot be averaged away by a high language-quality score.

## Scheduled Alternative Discovery

The system may periodically search for new model candidates and pricing changes.

Suggested cadence:

- weekly for pricing/availability metadata
- monthly for new candidate model evaluation
- ad hoc when a provider releases a relevant model

Discovery can collect candidates, but it must not automatically promote a model to production routing.

Promotion requires evaluation evidence and an explicit routing registry update.

## Baseline Completion Model

For some tasks, a cheaper candidate model can be evaluated by comparing its output against a stronger baseline/completion model.

Example:

1. Candidate model drafts technical interpretation.
2. Strong baseline model or deterministic evaluator reviews output.
3. Deterministic gates validate schema, evidence references and forbidden terms.
4. Candidate receives score per capability.

The stronger model is an evaluator/reference, not a final bypass around compliance gates.

## Cost Ledger

Every AI execution should record usage and estimated/actual cost.

At minimum:

```ts
export type AiUsageLedgerEntry = {
  ledgerEntryId: string;
  runId: string;
  specificationId?: string;
  capability: string;
  promptVersion: string;
  schemaVersion: string;
  provider: string;
  model: string;
  deployment?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  currency: string;
  estimatedCost: number;
  actualCost?: number;
  pricingVersion?: string;
  startedAt: string;
  completedAt?: string;
  outcome: 'success' | 'validationFailed' | 'reviewRequired' | 'blocked' | 'providerFailed';
};
```

## Specification-Level Cost Summary

Each generated specification should include a cost summary:

```ts
export type SpecificationCostSummary = {
  specificationId: string;
  runId: string;
  currency: string;
  totalEstimatedCost: number;
  totalActualCost?: number;
  byCapability: Array<{
    capability: string;
    calls: number;
    totalTokens?: number;
    estimatedCost: number;
  }>;
  byModel: Array<{
    provider: string;
    model: string;
    calls: number;
    totalTokens?: number;
    estimatedCost: number;
  }>;
};
```

## Evaluation Report

A model evaluation report should show:

- dataset version
- capability
- candidate provider/model
- reference/baseline provider/model when used
- prompt version
- schema version
- case count
- pass/fail by hard gate
- aggregate score
- cost per case
- latency per case
- failure examples
- qualification decision

## Reports

The final run report should show:

- models used
- capabilities invoked
- token counts
- estimated cost
- actual cost when available
- pricing version
- validation/compliance outcome
- whether any fallback was used

## Hard Gates

- No unqualified model in production routing.
- Missing pricing metadata must produce a warning or blocked state depending on policy.
- Cost optimization cannot bypass evidence, privacy, source or compliance gates.
- Candidate discovery cannot auto-promote models.
- Evaluation output must be traceable to dataset, prompt version, schema version and evaluator.
- Golden dataset cases must be versioned.
- Model-generated answer alone is not ground truth.
- Specification generation must record cost summary.

## Tests

Minimum tests:

- ledger entry is produced for every mocked AI call
- specification cost summary aggregates by capability and model
- unsupported pricing metadata produces controlled warning/block state
- candidate model cannot become production-qualified without evaluation status
- fallback cost is recorded separately
- cheaper model output cannot bypass compliance gates
- golden dataset case can compare candidate output with expected output/rubric
- hard-gate failure blocks qualification even if aggregate score is high
