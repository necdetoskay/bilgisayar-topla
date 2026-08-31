import type {
  OfficialSourceRecord,
  RequirementFields,
  SoftwareRequirementProfile,
} from "./index.js";
import type { OfficialSourceSnapshotArtifact } from "./official-source-resolver.js";

export type RequirementFieldKey =
  | "cpu"
  | "ram"
  | "gpu"
  | "storage"
  | "os"
  | "display";

export type RequirementFieldPath =
  | `minimum.${RequirementFieldKey}`
  | `recommended.${RequirementFieldKey}`;

export type RequirementFieldEvidence = {
  field: RequirementFieldPath;
  sourceText: string;
};

export type RequirementExtractionProposal = {
  requirementId: string;
  extractionRunId: string;
  software: string;
  version?: string;
  sourceId: string;
  snapshotSha256: string;
  minimum: RequirementFields;
  recommended: RequirementFields;
  fieldEvidence: RequirementFieldEvidence[];
};

export type RequirementExtractionIssue = {
  code: string;
  path: string;
  message: string;
};

export type RequirementExtractionResult = {
  valid: boolean;
  issues: RequirementExtractionIssue[];
  profile?: SoftwareRequirementProfile;
};

const FIELD_KEYS: readonly RequirementFieldKey[] = [
  "cpu",
  "ram",
  "gpu",
  "storage",
  "os",
  "display",
] as const;

export function validateRequirementExtraction(args: {
  source: OfficialSourceRecord;
  snapshot: OfficialSourceSnapshotArtifact;
  proposal: RequirementExtractionProposal;
}): RequirementExtractionResult {
  const issues: RequirementExtractionIssue[] = [];
  const { source, snapshot, proposal } = args;

  if (source.trustState !== "official") {
    issues.push({
      code: "EXTRACTION_SOURCE_NOT_OFFICIAL",
      path: "$.source.trustState",
      message: "requirement extraction can only become ready from an official source",
    });
  }

  if (source.sourceId !== snapshot.metadata.sourceId) {
    issues.push({
      code: "SOURCE_SNAPSHOT_ID_MISMATCH",
      path: "$.snapshot.metadata.sourceId",
      message: "snapshot sourceId must match the source record",
    });
  }

  if (!source.snapshotSha256 || source.snapshotSha256 !== snapshot.metadata.sha256) {
    issues.push({
      code: "SOURCE_SNAPSHOT_HASH_MISMATCH",
      path: "$.source.snapshotSha256",
      message: "source record must reference the exact snapshot hash",
    });
  }

  if (proposal.sourceId !== source.sourceId) {
    issues.push({
      code: "PROPOSAL_SOURCE_ID_MISMATCH",
      path: "$.proposal.sourceId",
      message: "extraction proposal sourceId must match the official source record",
    });
  }

  if (proposal.snapshotSha256 !== snapshot.metadata.sha256) {
    issues.push({
      code: "PROPOSAL_SNAPSHOT_HASH_MISMATCH",
      path: "$.proposal.snapshotSha256",
      message: "extraction proposal must be bound to the exact acquired snapshot",
    });
  }

  if (proposal.requirementId.trim().length === 0) {
    issues.push({
      code: "MISSING_REQUIREMENT_ID",
      path: "$.proposal.requirementId",
      message: "requirementId is required",
    });
  }

  if (proposal.extractionRunId.trim().length === 0) {
    issues.push({
      code: "MISSING_EXTRACTION_RUN_ID",
      path: "$.proposal.extractionRunId",
      message: "extractionRunId is required",
    });
  }

  if (proposal.software.trim().length === 0) {
    issues.push({
      code: "MISSING_SOFTWARE_NAME",
      path: "$.proposal.software",
      message: "software is required",
    });
  }

  const populatedFields = collectPopulatedFieldPaths(proposal);
  if (populatedFields.length === 0) {
    issues.push({
      code: "EMPTY_REQUIREMENT_EXTRACTION",
      path: "$.proposal",
      message: "at least one minimum or recommended requirement field is required",
    });
  }

  const evidenceByField = new Map<RequirementFieldPath, RequirementFieldEvidence[]>();
  for (const [index, evidence] of proposal.fieldEvidence.entries()) {
    if (evidence.sourceText.trim().length === 0) {
      issues.push({
        code: "EMPTY_FIELD_EVIDENCE",
        path: `$.proposal.fieldEvidence[${index}].sourceText`,
        message: "field evidence sourceText must not be empty",
      });
      continue;
    }

    const normalizedBody = normalizeEvidenceText(snapshot.bodyText);
    const normalizedEvidence = normalizeEvidenceText(evidence.sourceText);
    if (!normalizedBody.includes(normalizedEvidence)) {
      issues.push({
        code: "FIELD_EVIDENCE_NOT_IN_SNAPSHOT",
        path: `$.proposal.fieldEvidence[${index}].sourceText`,
        message: `${evidence.field} evidence was not found in the acquired snapshot`,
      });
    }

    const existing = evidenceByField.get(evidence.field) ?? [];
    existing.push(evidence);
    evidenceByField.set(evidence.field, existing);
  }

  for (const field of populatedFields) {
    if (!evidenceByField.has(field)) {
      issues.push({
        code: "REQUIREMENT_FIELD_WITHOUT_EVIDENCE",
        path: `$.proposal.${field}`,
        message: `${field} must have sourceText evidence from the acquired snapshot`,
      });
    }
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    issues: [],
    profile: {
      requirementId: proposal.requirementId,
      software: proposal.software,
      version: proposal.version,
      sourceId: proposal.sourceId,
      extractionRunId: proposal.extractionRunId,
      minimum: cloneRequirementFields(proposal.minimum),
      recommended: cloneRequirementFields(proposal.recommended),
      qualityState: "ready",
    },
  };
}

function collectPopulatedFieldPaths(
  proposal: RequirementExtractionProposal,
): RequirementFieldPath[] {
  const populated: RequirementFieldPath[] = [];
  for (const key of FIELD_KEYS) {
    if (isPopulatedValue(proposal.minimum[key])) {
      populated.push(`minimum.${key}`);
    }
    if (isPopulatedValue(proposal.recommended[key])) {
      populated.push(`recommended.${key}`);
    }
  }
  return populated;
}

function isPopulatedValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEvidenceText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function cloneRequirementFields(fields: RequirementFields): RequirementFields {
  return {
    ...fields,
    other: fields.other ? { ...fields.other } : undefined,
  };
}
