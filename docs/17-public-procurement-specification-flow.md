# Public Procurement Specification Flow

Status: Project-specific design profile
Related issue: https://github.com/necdetoskay/bilgisayar-topla/issues/2

## Purpose

The specification module is a generic public-procurement technical specification engine.

It MUST NOT be tightly coupled to PC builds, product page scraping, marketplace links or any specific upstream data source.

The specification module's only responsibility is:

`ProductFeatureProfile -> product-neutral technical specification draft -> compliance report`

The module generates a draft technical specification and compliance report. It does not create a final legally authoritative document. Final review and approval remain with the institution/idare.

## Architectural Boundary

The specification module MUST receive ready, normalized product/device features.

It MUST NOT:

- open product links
- scrape marketplace pages
- extract raw product properties from HTML
- run PC build selection
- decide which product to buy
- treat a selected product page as final wording source

Those jobs belong to upstream producer modules.

## Upstream Producers

The specification module may receive `ProductFeatureProfile` from different producers:

1. `pc-builder`: builds a complete PC target and sends normalized hardware features.
2. `product-extractor`: reads a product page URL and extracts/normalizes visible product properties.
3. `manual-entry`: user or operator enters product/device properties directly.
4. Future domain modules: printer planner, monitor planner, UPS planner, network device planner.

All producers must output the same kind of normalized feature profile before calling the specification module.

## Canonical Specification Flow

The specification module flow is:

1. Receive `ProductFeatureProfile`.
2. Validate feature completeness and evidence references.
3. Load product category profile.
4. Generate product-neutral technical specification clauses.
5. Run brand/model/vendor/lock-in gates.
6. Run measurability and inspection/acceptance checks.
7. Run public procurement wording compliance checks.
8. Output draft specification, compliance report and review-required items.

## Product Page URL Flow Belongs Outside

When the user provides a marketplace/vendor product page URL, the system should route it to a separate extractor module:

`Product Page URL -> product-extractor -> ProductFeatureProfile -> specification module`

The extractor module is responsible for:

- fetching/opening the page
- extracting visible product title/category/specification rows/description
- preserving source provenance
- separating identity fields from reusable technical capability fields
- normalizing features into `ProductFeatureProfile`
- quarantining brand/model/vendor identifiers

The specification module only sees the normalized profile and evidence references.

## PC Build Integration Flow

The PC build application may route a completed build into the specification module:

`PC Build Target -> normalized ProductFeatureProfile -> specification module`

The PC build module may know selected products, exact models and exact properties. The specification module MUST NOT copy selected products into final clause wording when this creates brand/model/vendor lock-in.

This is an integration scenario, not the only way to use the specification module.

## Standalone Product Examples

The full application may later handle requests like:

- `Yazici icin teknik sartname hazirla.`
- `Muhasebe birimi icin monitor alimi sartnamesi lazim.`
- `Tarayici almak istiyorum, kamu alimi sartname taslagi cikar.`
- `Kesintilere karsi UPS alimi icin teknik sartname hazirla.`
- `Bu Hepsiburada urun linkinden teknik sartname taslagi cikar.`

In each case, an upstream producer must first create `ProductFeatureProfile`. Then the specification module generates the draft.

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

The generator SHOULD translate product need and known capabilities into neutral criteria.

Examples:

- For PC: use workload-driven CPU/memory/storage/graphics criteria instead of component model.
- For printer: use print technology class only when needed, print volume, duplex need, network need, paper size and measurable speed/quality requirements only when justified.
- For monitor: use screen size range, resolution, panel/use-case needs, ergonomic requirements and port standards when operationally required.
- For scanner: use document size, feeder capacity, duplex scan need, resolution and daily volume where justified.
- For UPS: use supported load, runtime target, topology and protection requirements where justified.

## Product Category Profile

Each product category SHOULD have a profile defining:

- required feature fields
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

- product feature profile input reference
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
- `needsMoreFeatures`: feature profile is incomplete
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
- specification module can run from a fixture `ProductFeatureProfile` without PC build or URL access
- product category risky terms are detected
