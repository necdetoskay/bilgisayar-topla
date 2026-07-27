# Selection Chain Probe

This document defines the next Sprint 1 proof point after the first page probe.

## Goal

The scraper must prove that the Incehesap builder behaves like a dependent selection chain:

1. Open the builder page.
2. Detect CPU candidates.
3. Click the first selectable CPU candidate.
4. Detect whether motherboard options become available.
5. Read a total price if the page exposes one.
6. Write a screenshot and `report.json`.

This is not the final recommendation engine. It is a controlled technical probe that validates the site flow.

## Expected Report Fields

`report.json` should contain:

| Field | Meaning |
|---|---|
| `cpuOptions` | CPU candidates found before selection. |
| `selectedBy` | Selector candidate used to click the CPU option. |
| `motherboardDetected` | Whether a motherboard block was found after CPU selection. |
| `motherboardOptions` | Motherboard candidates found after CPU selection. |
| `totalPriceText` | Total price text if detected. |
| `totalPriceValue` | Parsed numeric total price if detected. |
| `diagnostics` | Recoverable or blocking scraper issues. |

## Success Criteria

The probe is considered successful when:

- `cpuOptions.length > 0`
- `selectedBy` is not empty
- `motherboardDetected` is `true`
- `motherboardOptions.length > 0`
- `probe-result.png` is written
- `report.json` is written

`totalPriceText` is useful but not mandatory for this step. Some pages may expose total price only after more components are selected.

## Failure Interpretation

| Failure | Likely Meaning |
|---|---|
| `CPU_BLOCK_NOT_FOUND` | The page structure or loading behavior changed, or current selectors are too weak. |
| `CPU_SELECT_BUTTON_NOT_FOUND` | Product cards were found, but click target detection failed. |
| `MOTHERBOARD_NOT_DETECTED_AFTER_CPU` | CPU click did not trigger the expected next category, or motherboard selectors need improvement. |
| Missing total price | Acceptable for now unless the UI visibly shows a total price in the screenshot. |

## Next Step

After this probe works on a real machine, Sprint 1 can continue with:

- choosing CPU by a simple strategy instead of always first option
- extracting motherboard options more accurately
- storing raw category snapshots for selector repair
- adding a repeatable smoke test command
