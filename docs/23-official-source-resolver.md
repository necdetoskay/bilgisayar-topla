# Official Source Resolver v1

Status: initial implementation
Related epic: #1 — Requirement-first evidence-based PC build flow

## Purpose

The resolver turns a software candidate into a controlled official-source acquisition request. It is responsible for source identity and provenance, not for interpreting hardware requirements.

The evidence chain is:

`software candidate -> registry resolution -> official HTTPS fetch -> redirect host validation -> SHA-256 snapshot -> stored artifact -> OfficialSourceRecord -> requirement extraction`

Requirement extraction and hardware-target derivation happen only after a valid official snapshot exists.

## Registry Strategy

V1 uses a small explicit registry for sources that have been verified as official. A registry entry contains:

- stable `sourceId`
- software aliases
- exact version when the source is version-specific
- edition/product-family discriminator when needed
- vendor
- canonical official URL
- allow-listed official hosts
- source language
- matching scope

The registry is intentionally not an unrestricted search result cache. Live search may discover candidates later, but a discovered URL cannot become authoritative until the same host/source checks pass.

## Initial Sources

### AutoCAD 2022

Stable source id:

`autodesk-autocad-2022-system-requirements`

Vendor: Autodesk

Official host: `www.autodesk.com`

Resolution behavior:

- `AutoCAD + 2022` -> `resolved`
- `AutoCAD` without version -> `reviewRequired / OFFICIAL_SOURCE_VERSION_REQUIRED`

### Microsoft Office / Microsoft 365

Generic `Office` is not treated as one deterministic product requirement source.

Initial official candidate families:

- Microsoft 365 business / education / government
- Microsoft 365 home

Official host: `support.microsoft.com`

Resolution behavior:

- generic `Office` -> `reviewRequired / OFFICIAL_SOURCE_AMBIGUOUS`
- known Microsoft 365 edition -> deterministic candidate resolution

This prevents the system from silently selecting a home/business requirement page that may not match the user's actual product.

## Acquisition Hard Gates

A source snapshot is accepted only when:

1. registry URL uses HTTPS
2. requested host is explicitly allow-listed by the registry entry
3. HTTP response succeeds
4. final redirect URL still uses HTTPS
5. final redirect host is still allow-listed
6. response body is non-empty
7. SHA-256 is calculated over the acquired body

A redirect from an official source to an unrelated host fails closed.

## Snapshot Artifact

Each accepted acquisition produces metadata containing:

- `snapshotId`
- `sourceId`
- requested URL
- final URL
- checked timestamp
- SHA-256
- byte length
- content type
- HTTP status

Raw acquired body text is stored separately alongside metadata by `FileOfficialSourceSnapshotStore`.

Generated snapshot identity:

`<sourceId>-<first 16 chars of sha256>`

The full SHA-256 remains in metadata and `OfficialSourceRecord`.

## Transport Boundary

The resolver accepts an `OfficialSourceTransport` dependency.

Production default uses the Node/Web `fetch` implementation. Tests use deterministic fake transports, which means resolver behavior, redirect validation and snapshot persistence can be tested without paid AI/provider calls or external network access.

## Authority Boundary

The resolver establishes only:

- which official source is applicable
- what exact content snapshot was acquired
- provenance metadata

It does **not** decide:

- which source text becomes minimum/recommended hardware fields
- what hardware target should be selected
- whether a PC configuration is compatible

Those remain separate extraction, derivation and deterministic validation stages.

## Golden Case Behavior

For:

`AutoCAD 2022 ve Office icin 50.000 TL civarinda sadece kasa istiyorum.`

Expected v1 source resolution:

```text
AutoCAD 2022
  -> Autodesk exact source RESOLVED
  -> eligible for snapshot acquisition

Office
  -> Microsoft product/edition ambiguous
  -> REVIEW_REQUIRED
  -> no Office source fetch

Because requirement evidence is incomplete:
  -> hardwareTarget remains pending
  -> catalog remains pending
```

The golden fixture intentionally contains no invented CPU/RAM/GPU requirement numbers.

## Next Step

After source acquisition is stable, the next layer is **snapshot-backed requirement extraction**:

1. read immutable source snapshot
2. isolate relevant system-requirement section
3. extract structured minimum/recommended fields
4. preserve field-level snapshot/source references
5. schema validate
6. only then derive evidence-backed hardware targets

AI may assist extraction, but cannot promote unsupported fields to authoritative requirements.
