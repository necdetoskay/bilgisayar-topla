# Independent Verification and Proof Chain v1

Status: active implementation under Epic #13 / WP5 #18

## Purpose

A ranked candidate is not a verified build. The V1 verifier treats scoring output as an untrusted proposal and independently re-establishes the proof chain before a build can be accepted.

## Authority boundary

```text
candidate ranking
    -> untrusted selection proposal
    -> independent verification
        -> catalog lineage
        -> product-page evidence lineage
        -> official requirement lineage
        -> compatibility recomputation
        -> budget recomputation
        -> HardwareTarget recomputation
    -> verified build
```

No LLM/provider output can override the verification result.

## Selection identity

New selections preserve both:

- `catalogProductIds`
- `productProfileIds`

Legacy selections that do not preserve catalog product IDs cannot be independently rebound to the source catalog and therefore return `REVIEW_REQUIRED`.

## Product proof chain

For every selected part the verifier requires:

```text
BuildSelection.catalogProductId
  -> CatalogSnapshot product
  -> category / availability / price / currency
  -> exact product page URL
  -> ProductFeatureProfile
  -> matching ready productPage evidence
  -> product-page snapshot SHA-256
```

Contradictory identity/price/category lineage fails verification. Missing page/snapshot provenance requires review rather than being guessed.

## Requirement proof chain

Every HardwareTarget evidence reference is rebound to:

```text
HardwareTarget.evidence
  -> SoftwareRequirementProfile requirementId + field
  -> OfficialSourceRecord sourceId
  -> trustState=official
  -> official source URL
  -> official snapshot SHA-256
  -> populated minimum/recommended field
```

Unknown refs, non-official sources, wrong source/requirement relationships, or nonexistent field paths fail verification.

## Independent recomputation

The selected seven products are re-submitted as a one-candidate deterministic set. This intentionally re-runs rather than trusts the previous ranking result:

1. required component completeness
2. component evidence readiness
3. compatibility rules
4. exact catalog price arithmetic
5. hard budget gate
6. HardwareTarget fit
7. stable candidate identity

The previously computed `score` is informational and is not an acceptance condition.

Application installation-space values remain evidence, not SSD purchase-capacity requirements.

## Multi-candidate verification

Scoring may select up to three candidates. Verification handles them independently:

- at least one PASS -> keep only independently verified builds and open explanation
- no PASS + at least one REVIEW_REQUIRED -> stop at verification review
- all FAIL -> fail at verification and preserve first failure

This prevents a weaker alternate candidate from invalidating a stronger candidate that independently passes, while ensuring no unverified alternate survives into the final selected set.

## Proof-chain report

The harness emits a versioned report containing:

- request
- canonical stage records
- stage evidence/output refs and diagnostics
- independently verified selected builds
- catalog/product-page lineage
- HardwareTarget/official-requirement lineage
- recomputed compatibility and target checks
- AI usage events
- aggregate input/output/reasoning tokens
- aggregate estimated cost
- aggregate latency
- first-failure attribution

The report is intended to answer: what was selected, why it was selected, which evidence supported it, what deterministic gates accepted it, where AI was used, and how much that AI use cost.

## Validation policy

Fixture/contract tests do not require paid provider calls. Full workspace test/typecheck execution remains a separate acceptance gate, followed by the final live Incehesap behavioral acceptance in #19.
