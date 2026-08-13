import test from "node:test";
import assert from "node:assert/strict";
import { generateSpecificationDraft } from "./index.js";
import { type ProductFeatureProfile } from "@bilgisayar-topla/shared-contracts";

function printerProfile(): ProductFeatureProfile {
  return {
    profileId: "profile-printer-001",
    schemaVersion: "1.0.0",
    productCategory: "printer",
    sourceMode: "manualEntry",
    createdAt: "2026-08-13T00:00:00.000Z",
    identity: {
      title: "Example Brand X123 Printer",
      brand: "Example Brand",
      model: "X123",
    },
    features: [
      {
        key: "printer.duplex",
        label: "Otomatik cift tarafli baski",
        value: true,
        group: "printing",
        requirementLevel: "required",
        sourceRefIds: ["manual-001"],
        lockInRisk: "none",
        clauseEligible: true,
      },
      {
        key: "identity.brand",
        label: "Marka",
        value: "Example Brand",
        group: "identity",
        requirementLevel: "informational",
        sourceRefIds: ["manual-001"],
        lockInRisk: "high",
        clauseEligible: false,
      },
    ],
    evidence: [
      {
        evidenceId: "manual-001",
        sourceType: "manualEntry",
        sourceLabel: "User supplied fixture",
        qualityState: "ready",
      },
    ],
    gaps: [],
    readiness: "readyForSpecification",
  };
}

test("ULTEF: valid profile produces draft specification", () => {
  const result = generateSpecificationDraft(printerProfile());

  assert.equal(result.readiness, "draftReady");
  assert.match(result.draft?.markdown ?? "", /Teknik Sartname Taslagi/);
  assert.equal(result.draft?.clauses.length, 1);
});

test("ULTEF: raw URL is rejected by specification module", () => {
  const result = generateSpecificationDraft("https://example.com/product/123");

  assert.equal(result.readiness, "blocked");
  assert.equal(
    result.complianceReport.validationIssues[0]?.code,
    "raw_input_not_allowed",
  );
});

test("ULTEF: identity brand/model fields are not rendered as clauses", () => {
  const result = generateSpecificationDraft(printerProfile());

  assert.equal(result.readiness, "draftReady");
  assert.doesNotMatch(result.draft?.markdown ?? "", /Example Brand|X123/);
});

test("ULTEF: forbidden brand terms in clause text are blocked", () => {
  const profile = printerProfile();
  profile.features[0] = {
    ...profile.features[0]!,
    label: "HP LaserJet uyumlu baski",
  };

  const result = generateSpecificationDraft(profile);

  assert.equal(result.readiness, "blocked");
  assert.equal(
    result.complianceReport.findings.some(
      (finding) => finding.code === "forbidden_brand_or_model_term",
    ),
    true,
  );
});

test("ULTEF: GHz based clause output is blocked", () => {
  const profile = printerProfile();
  profile.productCategory = "desktopComputer";
  profile.features[0] = {
    key: "cpu.clockSpeed",
    label: "Islemci temel hizi",
    value: 3.5,
    unit: "GHz",
    group: "processor",
    requirementLevel: "required",
    sourceRefIds: ["manual-001"],
    lockInRisk: "medium",
    clauseEligible: true,
  };

  const result = generateSpecificationDraft(profile);

  assert.equal(result.readiness, "blocked");
  assert.equal(
    result.complianceReport.findings.some(
      (finding) => finding.code === "clock_speed_clause_risk",
    ),
    true,
  );
});
