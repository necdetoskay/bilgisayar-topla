# Product Feature Profile Contract

Status: Canonical project contract
Related issues:

- https://github.com/necdetoskay/bilgisayar-topla/issues/2
- https://github.com/necdetoskay/bilgisayar-topla/issues/3
- https://github.com/necdetoskay/bilgisayar-topla/issues/5
- https://github.com/necdetoskay/bilgisayar-topla/issues/6

## Purpose

`ProductFeatureProfile` is the standard data structure between all product-analysis modules and the specification module.

Every upstream producer must output this structure before the specification module is called.

The specification module must only accept this structure or a validated compatible version of it.

## Architectural Rule

All paths converge here:

`PC Builder -> ProductFeatureProfile -> Specification Module`

`Product Extractor -> ProductFeatureProfile -> Specification Module`

`Manual Entry -> ProductFeatureProfile -> Specification Module`

`Future Product Planner -> ProductFeatureProfile -> Specification Module`

The specification module does not know how the profile was produced.

## Producers

### PC Builder

The PC builder collects software needs, official requirements, derived hardware targets and selected compatible parts. It then exports a normalized `ProductFeatureProfile` for the completed computer/system.

### Product Extractor

The product extractor reads a product page URL, extracts visible product properties and normalizes them into `ProductFeatureProfile`.

### Manual Entry

A user/operator may directly enter product properties into the same structure.

## Consumer

### Specification Module

The specification module consumes `ProductFeatureProfile` and creates:

- product-neutral technical specification draft
- compliance report
- evidence/proof chain report
- blocked/review-required clauses

It must not fetch URLs, select products or infer missing raw product properties by itself.

## Draft Type Shape

Initial TypeScript-oriented shape:

```ts
export type ProductFeatureProfile = {
  profileId: string;
  schemaVersion: '1.0.0';
  productCategory: ProductCategory;
  sourceMode: 'pcBuilder' | 'productExtractor' | 'manualEntry' | 'futurePlanner';
  createdAt: string;
  locale?: string;
  intendedUse?: IntendedUse;
  identity: ProductIdentity;
  features: ProductFeature[];
  evidence: EvidenceReference[];
  gaps: ProfileGap[];
  readiness: ProfileReadiness;
};
```

## Product Category

`productCategory` should be a stable category key, for example:

- `desktopComputer`
- `notebookComputer`
- `monitor`
- `printer`
- `scanner`
- `ups`
- `networkDevice`
- `other`

Product-category profiles define required feature groups, risky lock-in terms and clause generation policy.

## Identity Fields

Identity fields are preserved as evidence but must not be copied into final specification clauses when they create lock-in.

```ts
export type ProductIdentity = {
  title?: string;
  brand?: string;
  model?: string;
  manufacturer?: string;
  seller?: string;
  sourceUrl?: string;
};
```

Examples of identity fields:

- marketplace product title
- brand
- model
- seller
- exact selected product name

These fields are useful for traceability and audit. They are unsafe as procurement clause wording.

## Feature Fields

Features are normalized technical capabilities.

```ts
export type ProductFeature = {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  group?: string;
  requirementLevel?: 'required' | 'preferred' | 'informational';
  sourceRefIds: string[];
  lockInRisk?: 'none' | 'low' | 'medium' | 'high';
  clauseEligible: boolean;
};
```

Examples:

- `memory.capacity = 32 GB`
- `storage.capacity = 1 TB`
- `printer.duplex = true`
- `monitor.resolution = 1920x1080`
- `ups.runtimeTarget = 10 min`

## Evidence References

```ts
export type EvidenceReference = {
  evidenceId: string;
  sourceType: 'officialRequirement' | 'productPage' | 'pcBuilderOutput' | 'manualEntry' | 'legalSource' | 'standard';
  url?: string;
  checkedAt?: string;
  snapshotSha256?: string;
  sourceLabel?: string;
  fieldPath?: string;
  qualityState: 'ready' | 'warning' | 'reviewRequired' | 'rejected';
};
```

## Readiness

```ts
export type ProfileReadiness = 'readyForSpecification' | 'needsMoreFeatures' | 'reviewRequired' | 'blocked';
```

Rules:

- `readyForSpecification`: enough normalized, clause-eligible features exist.
- `needsMoreFeatures`: required product-category fields are missing.
- `reviewRequired`: evidence is ambiguous or risky.
- `blocked`: hard gate failure prevents specification generation.

## Clause Eligibility

A feature may be present but not eligible for clause generation.

Examples that should normally be `clauseEligible: false`:

- brand
- model
- seller
- product title
- exact product family name
- marketing slogan
- vendor-specific technology name

The specification module should only generate clauses from `clauseEligible` technical features and category policy.

## Hard Gates

- Specification module accepts only `ProductFeatureProfile` or validated compatible structure.
- Identity fields must be preserved but not used as final clause wording.
- Features must carry evidence references.
- Missing category-required features must produce `needsMoreFeatures` or `reviewRequired`.
- High lock-in risk features must be blocked or review-required.
- Product page extracted data must stay marked as product-page evidence.

## Minimal Tests

- PC builder output can be converted to `ProductFeatureProfile`.
- Product page extraction output can be converted to `ProductFeatureProfile`.
- Manual entry can be represented as `ProductFeatureProfile`.
- Specification module rejects raw URL input.
- Specification module rejects raw selected-product object input.
- Brand/model identity is preserved but excluded from clause generation.
- Clause-eligible features can generate product-neutral draft clauses.
