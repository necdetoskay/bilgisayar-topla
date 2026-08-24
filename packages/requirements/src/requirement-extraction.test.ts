import assert from "node:assert/strict";
import test from "node:test";

import type { OfficialSourceRecord } from "./index.js";
import {
  validateRequirementExtraction,
  type RequirementExtractionProposal,
} from "./requirement-extraction.js";
import type { OfficialSourceSnapshotArtifact } from "./official-source-resolver.js";

const snapshot: OfficialSourceSnapshotArtifact = {
  metadata: {
    snapshotId: "autodesk-autocad-2022-fixture",
    sourceId: "autodesk-autocad-2022-system-requirements",
    requestedUrl: "https://www.autodesk.com/fixture",
    finalUrl: "https://www.autodesk.com/fixture",
    checkedAt: "2026-08-24T19:00:00.000Z",
    sha256: "fixture-sha-256",
    byteLength: 512,
    contentType: "text/html",
    httpStatus: 200,
  },
  bodyText: `
    <table>
      <tr><td>Processor</td><td>Basic: 2.5–2.9 GHz processor Recommended: 3+ GHz processor</td></tr>
      <tr><td>Memory</td><td>Basic: 8 GB Recommended: 16 GB</td></tr>
      <tr><td>Display Card</td><td>Basic: 1 GB GPU with 29 GB/s Bandwidth and DirectX 11 compliant Recommended: 4 GB GPU with 106 GB/s Bandwidth and DirectX 12 compliant</td></tr>
      <tr><td>Disk Space</td><td>10.0 GB</td></tr>
    </table>
  `,
};

const source: OfficialSourceRecord = {
  sourceId: snapshot.metadata.sourceId,
  vendor: "Autodesk",
  url: snapshot.metadata.finalUrl,
  checkedAt: snapshot.metadata.checkedAt,
  snapshotSha256: snapshot.metadata.sha256,
  language: "en",
  trustState: "official",
};

function validProposal(): RequirementExtractionProposal {
  return {
    requirementId: "req-autocad-2022",
    extractionRunId: "extract-autocad-2022-001",
    software: "AutoCAD",
    version: "2022",
    sourceId: source.sourceId,
    snapshotSha256: snapshot.metadata.sha256,
    minimum: {
      cpu: "2.5–2.9 GHz processor",
      ram: "8 GB",
      gpu: "1 GB GPU, 29 GB/s bandwidth, DirectX 11 compliant",
      storage: "10.0 GB",
    },
    recommended: {
      cpu: "3+ GHz processor",
      ram: "16 GB",
      gpu: "4 GB GPU, 106 GB/s bandwidth, DirectX 12 compliant",
    },
    fieldEvidence: [
      {
        field: "minimum.cpu",
        sourceText: "Basic: 2.5–2.9 GHz processor Recommended: 3+ GHz processor",
      },
      {
        field: "recommended.cpu",
        sourceText: "Basic: 2.5–2.9 GHz processor Recommended: 3+ GHz processor",
      },
      {
        field: "minimum.ram",
        sourceText: "Basic: 8 GB Recommended: 16 GB",
      },
      {
        field: "recommended.ram",
        sourceText: "Basic: 8 GB Recommended: 16 GB",
      },
      {
        field: "minimum.gpu",
        sourceText: "Basic: 1 GB GPU with 29 GB/s Bandwidth and DirectX 11 compliant Recommended: 4 GB GPU with 106 GB/s Bandwidth and DirectX 12 compliant",
      },
      {
        field: "recommended.gpu",
        sourceText: "Basic: 1 GB GPU with 29 GB/s Bandwidth and DirectX 11 compliant Recommended: 4 GB GPU with 106 GB/s Bandwidth and DirectX 12 compliant",
      },
      {
        field: "minimum.storage",
        sourceText: "10.0 GB",
      },
    ],
  };
}

test("snapshot-grounded AutoCAD proposal becomes a ready requirement profile", () => {
  const result = validateRequirementExtraction({
    source,
    snapshot,
    proposal: validProposal(),
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.profile?.qualityState, "ready");
  assert.equal(result.profile?.recommended.ram, "16 GB");
  assert.equal(result.profile?.sourceId, source.sourceId);
});

test("invented field evidence is rejected even when the normalized value looks plausible", () => {
  const proposal = validProposal();
  proposal.fieldEvidence = proposal.fieldEvidence.map((evidence) =>
    evidence.field === "recommended.ram"
      ? { ...evidence, sourceText: "Recommended: 64 GB" }
      : evidence,
  );

  const result = validateRequirementExtraction({ source, snapshot, proposal });

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "FIELD_EVIDENCE_NOT_IN_SNAPSHOT"),
    true,
  );
  assert.equal(result.profile, undefined);
});

test("a populated requirement field without raw snapshot evidence is rejected", () => {
  const proposal = validProposal();
  proposal.fieldEvidence = proposal.fieldEvidence.filter(
    (evidence) => evidence.field !== "recommended.gpu",
  );

  const result = validateRequirementExtraction({ source, snapshot, proposal });

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some(
      (issue) => issue.code === "REQUIREMENT_FIELD_WITHOUT_EVIDENCE",
    ),
    true,
  );
});

test("proposal cannot be rebound to another snapshot hash", () => {
  const proposal = validProposal();
  proposal.snapshotSha256 = "different-snapshot";

  const result = validateRequirementExtraction({ source, snapshot, proposal });

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some(
      (issue) => issue.code === "PROPOSAL_SNAPSHOT_HASH_MISMATCH",
    ),
    true,
  );
});

test("non-official source cannot produce ready authoritative requirements", () => {
  const result = validateRequirementExtraction({
    source: { ...source, trustState: "trusted" },
    snapshot,
    proposal: validProposal(),
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "EXTRACTION_SOURCE_NOT_OFFICIAL"),
    true,
  );
});
