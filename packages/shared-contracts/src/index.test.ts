import test from "node:test";
import assert from "node:assert/strict";
import {
  type ProductFeatureProfile,
  validateProductFeatureProfile,
} from "./index.js";

function validProfile(): ProductFeatureProfile {
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
        label: "Automatic duplex printing",
        value: true,
        group: "printing",
        requirementLevel: "required",
        sourceRefIds: ["manual-001"],
        lockInRisk: "none",
        clauseEligible: true,
      },
      {
        key: "identity.brand",
        label: "Brand",
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

test("ULTEF: valid ProductFeatureProfile passes validation", () => {
  const result = validateProductFeatureProfile(validProfile());

  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("ULTEF: raw URL input is rejected at the contract boundary", () => {
  const result = validateProductFeatureProfile("https://example.com/product/123");

  assert.equal(result.valid, false);
  assert.equal(result.issues[0]?.code, "raw_input_not_allowed");
});

test("ULTEF: features must reference known evidence", () => {
  const profile = validProfile();
  profile.features[0] = {
    ...profile.features[0]!,
    sourceRefIds: ["missing-evidence"],
  };

  const result = validateProductFeatureProfile(profile);

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "unknown_feature_evidence"),
    true,
  );
});

test("ULTEF: high lock-in features cannot be clause eligible", () => {
  const profile = validProfile();
  profile.features[1] = {
    ...profile.features[1]!,
    clauseEligible: true,
  };

  const result = validateProductFeatureProfile(profile);

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "high_lock_in_clause_feature"),
    true,
  );
});

test("ULTEF: raw selected-product-like object is rejected", () => {
  const result = validateProductFeatureProfile({
    title: "Example Brand X123 Printer",
    price: 1000,
    specs: { duplex: true },
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "unsupported_schema_version"),
    true,
  );
});
