import assert from "node:assert/strict";
import test from "node:test";

import type { OfficialSourceTransport } from "./official-source-resolver.js";
import {
  resolveSoftwareRequirements,
  type RequirementExtractionAdapter,
} from "./requirement-resolution-pipeline.js";

const checkedAt = "2026-08-24T19:15:00.000Z";

const transport: OfficialSourceTransport = async (url) => {
  if (url.includes("autodesk.com")) {
    return {
      ok: true,
      status: 200,
      finalUrl: url,
      contentType: "text/html",
      bodyText:
        "Processor Basic: 2.5–2.9 GHz processor Recommended: 3+ GHz processor Memory Basic: 8 GB Recommended: 16 GB Disk Space 10.0 GB",
    };
  }

  return {
    ok: true,
    status: 200,
    finalUrl: url,
    contentType: "text/html",
    bodyText:
      "Computer and processor 1.6 GHz or faster, 2-core Memory 4 GB RAM; 2 GB RAM (32-bit) Hard disk 4 GB of available disk space",
  };
};

const extractor: RequirementExtractionAdapter = async ({
  query,
  source,
  snapshot,
}) => {
  if (query.software.toLowerCase().includes("autocad")) {
    return {
      requirementId: "req-autocad-2022",
      extractionRunId: "extract-autocad-2022",
      software: "AutoCAD",
      version: "2022",
      sourceId: source.sourceId,
      snapshotSha256: snapshot.metadata.sha256,
      minimum: {
        cpu: "2.5–2.9 GHz processor",
        ram: "8 GB",
        storage: "10.0 GB",
      },
      recommended: {
        cpu: "3+ GHz processor",
        ram: "16 GB",
      },
      fieldEvidence: [
        {
          field: "minimum.cpu",
          sourceText:
            "Basic: 2.5–2.9 GHz processor Recommended: 3+ GHz processor",
        },
        {
          field: "recommended.cpu",
          sourceText:
            "Basic: 2.5–2.9 GHz processor Recommended: 3+ GHz processor",
        },
        {
          field: "minimum.ram",
          sourceText: "Basic: 8 GB Recommended: 16 GB",
        },
        {
          field: "recommended.ram",
          sourceText: "Basic: 8 GB Recommended: 16 GB",
        },
        { field: "minimum.storage", sourceText: "10.0 GB" },
      ],
    };
  }

  return {
    requirementId: "req-m365-business",
    extractionRunId: "extract-m365-business",
    software: "Microsoft 365",
    sourceId: source.sourceId,
    snapshotSha256: snapshot.metadata.sha256,
    minimum: {
      cpu: "1.6 GHz or faster, 2-core",
      ram: "4 GB RAM; 2 GB RAM (32-bit)",
      storage: "4 GB of available disk space",
    },
    recommended: {},
    fieldEvidence: [
      {
        field: "minimum.cpu",
        sourceText: "1.6 GHz or faster, 2-core",
      },
      {
        field: "minimum.ram",
        sourceText: "4 GB RAM; 2 GB RAM (32-bit)",
      },
      {
        field: "minimum.storage",
        sourceText: "4 GB of available disk space",
      },
    ],
  };
};

test("AutoCAD resolves while generic Office remains reviewRequired without fetching ambiguous Office", async () => {
  let fetchCount = 0;
  let extractorCount = 0;
  const countedTransport: OfficialSourceTransport = async (url) => {
    fetchCount += 1;
    return transport(url);
  };
  const countedExtractor: RequirementExtractionAdapter = async (args) => {
    extractorCount += 1;
    return extractor(args);
  };

  const bundle = await resolveSoftwareRequirements({
    checkedAt,
    transport: countedTransport,
    extractor: countedExtractor,
    queries: [
      { software: "AutoCAD", version: "2022" },
      { software: "Office" },
    ],
  });

  assert.equal(bundle.readiness, "reviewRequired");
  assert.equal(bundle.items[0]?.status, "ready");
  assert.equal(bundle.items[1]?.status, "reviewRequired");
  assert.deepEqual(bundle.items[1]?.diagnostics, ["OFFICIAL_SOURCE_AMBIGUOUS"]);
  assert.equal(bundle.profiles.length, 1);
  assert.equal(bundle.sources.length, 1);
  assert.equal(fetchCount, 1);
  assert.equal(extractorCount, 1);
});

test("AutoCAD plus explicit Microsoft 365 business produces a ready requirement bundle", async () => {
  const bundle = await resolveSoftwareRequirements({
    checkedAt,
    transport,
    extractor,
    queries: [
      { software: "AutoCAD", version: "2022" },
      {
        software: "Microsoft 365",
        edition: "businessEducationGovernment",
      },
    ],
  });

  assert.equal(bundle.readiness, "ready");
  assert.equal(bundle.items.every((item) => item.status === "ready"), true);
  assert.equal(bundle.sources.length, 2);
  assert.equal(bundle.profiles.length, 2);
  assert.equal(bundle.profiles[0]?.recommended.ram, "16 GB");
  assert.equal(bundle.profiles[1]?.minimum.ram, "4 GB RAM; 2 GB RAM (32-bit)");
});

test("extractor output with evidence absent from snapshot is held for review", async () => {
  const hallucinatingExtractor: RequirementExtractionAdapter = async (args) => {
    const proposal = await extractor(args);
    return {
      ...proposal,
      minimum: { ...proposal.minimum, ram: "64 GB" },
      fieldEvidence: proposal.fieldEvidence.map((evidence) =>
        evidence.field === "minimum.ram"
          ? { ...evidence, sourceText: "64 GB RAM required" }
          : evidence,
      ),
    };
  };

  const bundle = await resolveSoftwareRequirements({
    checkedAt,
    transport,
    extractor: hallucinatingExtractor,
    queries: [{ software: "AutoCAD", version: "2022" }],
  });

  assert.equal(bundle.readiness, "reviewRequired");
  assert.equal(bundle.items[0]?.status, "reviewRequired");
  assert.equal(
    bundle.items[0]?.diagnostics.includes("FIELD_EVIDENCE_NOT_IN_SNAPSHOT"),
    true,
  );
  assert.equal(bundle.profiles.length, 0);
});
