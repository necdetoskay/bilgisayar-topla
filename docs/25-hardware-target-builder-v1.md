# Evidence-Linked Hardware Target Builder v1

Status: initial implementation
Related epic: #1 — Requirement-first evidence-based PC build flow

## Purpose

The Hardware Target Builder converts ready official software requirement profiles into deterministic component constraints that the catalog/build-selection stages can consume.

It is deliberately a **baseline** policy. It does not yet add subjective performance headroom such as choosing 32 GB instead of an official 16 GB recommendation.

## Authority Boundary

Inputs must be:

- `SoftwareRequirementProfile.qualityState = ready`
- backed by an `OfficialSourceRecord` whose trust state is `official`

If any profile is not ready or is not backed by an official source, target derivation blocks.

Unparseable official requirement text produces `reviewRequired`; the builder does not guess a numeric value.

## Policy

Current policy id:

`recommendedAggregateV1`

Rules:

1. for each software/component, use `recommended.<field>` when present
2. otherwise fall back to `minimum.<field>`
3. aggregate CPU clock by strongest value
4. aggregate CPU core count by strongest value
5. aggregate RAM by strongest capacity
6. aggregate GPU VRAM by strongest capacity
7. aggregate DirectX requirement by strongest version
8. aggregate application installation storage by sum
9. preserve sourceId + requirementId + field path for every selected constraint
10. do not add workload/headroom values in this policy

## AutoCAD 2022 + Microsoft 365 Business Baseline

Using the current golden requirement profiles, the deterministic baseline is:

```text
CPU      >= 3 GHz and >= 2 cores
Memory   >= 16 GB RAM
GPU      >= 4 GB VRAM and DirectX 12 compliant
Storage  >= 14 GB application installation space
```

The evidence chain is mixed correctly where needed:

- 3+ GHz comes from AutoCAD `recommended.cpu`
- 2 cores comes from Microsoft 365 `minimum.cpu`
- 16 GB comes from AutoCAD `recommended.ram`
- 4 GB VRAM / DirectX 12 comes from AutoCAD `recommended.gpu`
- storage sums AutoCAD 10 GB + Microsoft 365 4 GB

## Important Storage Distinction

`14 GB application space minimum` is **not** a recommendation to buy a 14 GB disk.

It represents only the summed official application installation requirements.

A later system-storage policy must separately account for:

- operating system
- updates
- page/swap space
- user data
- project files
- free-space safety margin
- available commercial SSD capacities

Only that later policy may turn application-space evidence into a practical target such as 512 GB or 1 TB.

## CPU/GPU Distinction

The baseline captures what official requirement pages explicitly state. It does not assume that clock frequency or VRAM alone represents real-world component performance.

Product selection will require a separate normalized capability/performance layer, for example:

- CPU generation/architecture and benchmark tier
- core/thread suitability
- GPU model performance tier
- workstation/API capability where required

Those product-ranking capabilities must remain separate from the official requirement evidence itself.

## Harness Gate

When:

- official sources are ready
- extracted requirements are ready
- hardware targets are ready
- budget/scope are complete

`BuildIntent.readiness` becomes `readyForBuild`.

The harness then marks:

```text
intent               PASS
requirementEvidence  PASS
hardwareTarget       PASS
catalog              PENDING  <- next executable stage
```

This is the first point where catalog/configurator access is allowed.

Generic `Office` still does not reach this state because the Microsoft product/edition source remains ambiguous.

## Tests

Current target-builder tests cover:

- AutoCAD + Microsoft 365 deterministic aggregate
- recommended-over-minimum preference
- mixed evidence lineage for CPU clock/core constraints
- summed storage evidence
- non-official source blocking
- non-ready requirement blocking
- unparseable requirement review state
- empty profile set review state
- harness integration where ready targets open the catalog stage

## Next Step

The next slice is **Catalog Normalization + Incehesap Configurator Integration**:

1. inspect current scraper output contract
2. define catalog product identity/price/availability contract
3. map scraper/configurator products into that contract
4. preserve source snapshot/probe identity
5. feed products into `ProductFeatureProfile`
6. begin deterministic compatibility filtering
