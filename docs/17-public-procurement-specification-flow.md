# Public Procurement Specification Flow

Status: Project-specific design profile
Related issue: https://github.com/necdetoskay/bilgisayar-topla/issues/2

## Purpose

The specification module is a generic public-procurement technical specification engine.

It MUST NOT be tightly coupled to PC builds. A completed PC build is only one possible input. The same module should later support products such as printers, monitors, scanners, network devices, UPS units or other office/IT equipment.

The module may also accept a product page URL, extract the product's published properties, convert them into a product-neutral feature profile, and generate a procurement-safe draft specification.

The module generates a draft technical specification and compliance report. It does not create a final legally authoritative document. Final review and approval remain with the institution/idare.

## Input Modes

The module should support three input modes:

1. `productNeed`: the user describes what they want to buy.
2. `completedBuildTarget`: the PC builder or another upstream tool sends a completed target/product profile.
3. `productPageUrl`: the user provides a product page link from a marketplace or vendor site.

The output contract should stay the same: a product-neutral feature profile, draft specification, compliance report and evidence/proof chain.

## Canonical Product Specification Flow

The generic flow is:

1. User states the product they want to buy.
2. The system asks what the product will be used for.
3. The system extracts required product capabilities.
4. The system resolves official standards, legal/procurement rules and product-category references where applicable.
5. The system derives a product-neutral technical feature profile.
6. The system asks missing scope questions.
7. The system generates product-neutral technical specification clauses.
8. The system runs compliance checks.
9. The system outputs a draft specification, evidence report and review-required items.

## Product Page URL Flow

When the user provides a product page URL, the system should run this flow:

1. Fetch/open the product page.
2. Extract visible product title, category, feature table, description and technical properties.
3. Preserve source provenance: URL, checkedAt, page title, seller/site identity, extraction method and snapshot/checksum where feasible.
4. Classify the product category.
5. Normalize extracted properties into a `ProductFeatureProfile`.
6. Separate product identity fields from reusable technical capability fields.
7. Remove or quarantine brand/model/vendor identifiers.
8. Ask missing usage/scope questions if the page does not explain the procurement need.
9. Generate product-neutral clauses from the normalized capability profile.
10. Run compliance gates and output draft/report.

A product page is useful evidence for what a product can do, but it is not safe wording for a public procurement specification.

## Product Page Evidence Boundary

Marketplace and seller pages are treated as untrusted acquired source content.

The system MUST NOT blindly trust or copy product-page text into the specification. It must extract, normalize and validate.

The product page may provide:

- candidate product category
- feature values
- capability examples
- available standards/certifications shown on the page
- product feasibility evidence

The product page MUST NOT become:

- authoritative legal source
- final clause wording source
- justification for brand/model lock-in
- sole evidence for a restrictive technical criterion

If the requirement depends on official manufacturer data or public procurement rules, the system should seek official/manufacturer/legal sources or mark the clause `reviewRequired`.

## PC Build Integration Flow

The PC build application may route a completed build into the specification module:

1. User need is collected.
2. Official software requirements are resolved.
3. Hardware target profile is derived.
4. Incehesap-compatible PC build is assembled.
5. All selected/required properties are known.
6. The completed build target is handed to the generic specification module.
7. The specification module rewrites the build into procurement-safe technical language.
8. Compliance report flags risky clauses and missing evidence.

This is an integration scenario, not the only way to use the specification module.

## Standalone Product Examples

The specification module should later handle requests like:

- `Yazici icin teknik sartname hazirla.`
- `Muhasebe birimi icin monitor alimi sartnamesi lazim.`
- `Tarayici almak istiyorum, kamu alimi sartname taslagi cikar.`
- `Kesintilere karsi UPS alimi icin teknik sartname hazirla.`
- `Bu Hepsiburada urun linkinden teknik sartname taslagi cikar.`

For each product category, the module should first ask usage and scope questions, then derive neutral criteria.

## Boundary

The upstream module may know selected products, exact models and exact properties.

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
- exact CPU/GPU/model names or exact product identifiers
- trademarked feature names when generic wording is possible
- exact performance values copied from one selected product
- clock-speed-driven requirements such as `3.5 GHz`
- unnecessary socket/chipset/dimension constraints
- product-category overfitting that points to one vendor
- subjective words such as `fast`, `quality`, `strong`, `latest` without measurable criteria
- clauses that inspection/acceptance cannot verify
- clauses that conflict with procurement source rules

## Forbidden Direction

The generator MUST NOT produce clauses like:

- `Intel Core i5 processor`
- `AMD Ryzen 5 processor`
- `NVIDIA RTX graphics card`
- `3.5 GHz or higher processor`
- `HP LaserJet printer`
- `Epson EcoTank printer`
- `Dell monitor`
- `X brand or equivalent`
- `Y model or equivalent`

Even `or equivalent` is not a safe default when the clause first points to a brand/model.

## Preferred Direction

The generator SHOULD translate product need and selected/known capabilities into neutral criteria.

Examples:

- For PC: use workload-driven CPU/memory/storage/graphics criteria instead of component model.
- For printer: use print technology class only when needed, print volume, duplex need, network need, paper size and measurable speed/quality requirements only when justified.
- For monitor: use screen size range, resolution, panel/use-case needs, ergonomic requirements and port standards when operationally required.
- For scanner: use document size, feeder capacity, duplex scan need, resolution and daily volume where justified.
- For UPS: use supported load, runtime target, topology and protection requirements where justified.

## Product Category Profile

Each product category SHOULD have a profile defining:

- required discovery questions
- measurable feature vocabulary
- risky lock-in words
- acceptable standards/certifications
- inspection/acceptance checks
- evidence sources
- clause templates
- compliance tests

## Source Baseline

Initial legal/regulatory source registry:

- 4734 sayili Kamu Ihale Kanunu, especially technical specification principles
- Mal Alimi Ihaleleri Uygulama Yonetmeligi, especially technical specification article and catalog/sample rules
- Kamu Ihale Genel Tebligi, especially mal alimi technical specification preparation guidance
- KIK/EKAP official decisions and education materials where useful

All source use must preserve provenance: URL, checkedAt, snapshot/checksum where feasible, extracted rule reference and quality state.

## Output Artifacts

Each specification run SHOULD produce:

- product need summary
- product feature profile
- product page extraction report when URL input is used
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
- `needsClarification`: missing usage/scope input prevents safe draft
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
- standalone product request can create a feature profile without PC build input
- product category risky terms are detected
- product page URL extraction preserves source provenance
- product page identity fields are not copied into final clauses
