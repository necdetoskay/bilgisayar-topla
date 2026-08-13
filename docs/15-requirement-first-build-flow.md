# Requirement-First Build Flow

Status: Project-specific design profile
Related issue: https://github.com/necdetoskay/bilgisayar-topla/issues/1

## Purpose

The application MUST start from the user's real workload, not from a product list.

The first question is not "Which CPU do you want?" or "What is your budget?". The first question is:

`Bu bilgisayari ne icin kullanacaksiniz?`

The system then extracts software, version, workload level and missing purchasing context before selecting parts.

## Canonical Flow

1. Collect user need and free-text workload.
2. Extract software names, versions and usage context.
3. Resolve official software requirement sources.
4. Extract minimum and recommended requirements.
5. Build a hardware target profile from official requirements.
6. Ask completeness questions.
7. Select compatible parts from Incehesap.
8. Produce evidence-backed recommendations.
9. If requested, hand the completed build target to the public procurement specification module.

## User Input Examples

- `AutoCAD 2022 kullanacagim, Office programlari olacak.`
- `Muhasebe, web, e-posta ve hafif grafik isleri icin kullanilacak.`
- `Cocuklar icin egitim ve basit oyun bilgisayari lazim.`

## Requirement Resolution

The system MUST identify:

- software name
- software version when present
- vendor
- workload type
- expected performance level
- source evidence status

If version is missing, the system SHOULD ask a clarifying question or use a review-required state before final recommendation.

## Completeness Questionnaire

The system SHOULD complete the purchasing scope before part selection:

- budget
- budget includes case only or full set
- monitor required
- keyboard required
- mouse required
- headset/speaker required
- Wi-Fi/Bluetooth required
- operating system/license required
- special size/noise preference
- warranty/service expectation

CPU cooler handling SHOULD be derived from selected CPU/build target when possible. The user should not be forced to know whether a CPU has a stock cooler.

## Output

The requirement-first flow MUST produce a `BuildIntent` or equivalent object containing:

- user need summary
- software requirements
- evidence references
- derived hardware targets
- completeness answers
- unresolved gaps
- readiness state

## Readiness States

Suggested readiness states:

- `readyForBuild`: enough evidence and scope exist to select parts
- `needsClarification`: missing user input blocks a safe build
- `reviewRequired`: official evidence or interpretation is missing/ambiguous
- `blocked`: a hard rule failed

## Hard Gates

- No definitive hardware target without official requirement evidence when software requirements are the basis.
- Minimum requirements are only lower bounds.
- Recommended requirements should drive the normal build target when budget allows.
- AI output cannot self-promote a requirement or recommendation to authoritative status.
