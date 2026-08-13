# Model Evaluation and Cost Ledger Profile

Status: Project-specific design profile
Related issue: to be created

Global standard references:

- `necdetoskay/engineering-standards/standards/ai/AI_RUNTIME_ROUTING_STANDARD_v1.md`
- `necdetoskay/engineering-standards/standards/ai/AI_AUTHORING_GROUNDING_STANDARD_v1.md`

## Purpose

The project should continuously understand which AI models are used, how much they cost, and whether newer/cheaper qualified alternatives can perform the same capability.

This profile adds two responsibilities:

1. Model evaluation and alternative discovery.
2. Per-run/per-specification token and cost accounting.

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
- Specification generation must record cost summary.

## Tests

Minimum tests:

- ledger entry is produced for every mocked AI call
- specification cost summary aggregates by capability and model
- unsupported pricing metadata produces controlled warning/block state
- candidate model cannot become production-qualified without evaluation status
- fallback cost is recorded separately
- cheaper model output cannot bypass compliance gates
