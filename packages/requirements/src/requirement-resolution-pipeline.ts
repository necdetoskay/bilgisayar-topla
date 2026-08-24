import type { OfficialSourceRecord, SoftwareRequirementProfile } from "./index.js";
import {
  resolveAndAcquireOfficialSource,
  type OfficialSourceSnapshotArtifact,
  type OfficialSourceSnapshotStore,
  type OfficialSourceTransport,
} from "./official-source-resolver.js";
import type { OfficialSourceQuery } from "./official-source-registry.js";
import {
  validateRequirementExtraction,
  type RequirementExtractionProposal,
} from "./requirement-extraction.js";

export type RequirementExtractionAdapter = (args: {
  query: OfficialSourceQuery;
  source: OfficialSourceRecord;
  snapshot: OfficialSourceSnapshotArtifact;
}) => Promise<RequirementExtractionProposal>;

export type RequirementResolutionItemStatus =
  | "ready"
  | "reviewRequired"
  | "failed";

export type RequirementResolutionItem = {
  query: OfficialSourceQuery;
  status: RequirementResolutionItemStatus;
  source?: OfficialSourceRecord;
  snapshot?: OfficialSourceSnapshotArtifact;
  profile?: SoftwareRequirementProfile;
  diagnostics: string[];
};

export type RequirementResolutionBundle = {
  checkedAt: string;
  items: RequirementResolutionItem[];
  sources: OfficialSourceRecord[];
  profiles: SoftwareRequirementProfile[];
  readiness: "ready" | "reviewRequired" | "failed";
};

export async function resolveSoftwareRequirements(args: {
  queries: OfficialSourceQuery[];
  checkedAt: string;
  extractor: RequirementExtractionAdapter;
  transport?: OfficialSourceTransport;
  store?: OfficialSourceSnapshotStore;
}): Promise<RequirementResolutionBundle> {
  const items: RequirementResolutionItem[] = [];

  for (const query of args.queries) {
    let acquired: Awaited<ReturnType<typeof resolveAndAcquireOfficialSource>>;
    try {
      acquired = await resolveAndAcquireOfficialSource({
        query,
        checkedAt: args.checkedAt,
        transport: args.transport,
        store: args.store,
      });
    } catch (error) {
      items.push({
        query: { ...query },
        status: "failed",
        diagnostics: [
          "OFFICIAL_SOURCE_ACQUISITION_FAILED",
          error instanceof Error ? error.message : String(error),
        ],
      });
      continue;
    }

    if (
      acquired.resolution.status !== "resolved" ||
      !acquired.sourceRecord ||
      !acquired.artifact
    ) {
      items.push({
        query: { ...query },
        status: "reviewRequired",
        diagnostics: [...acquired.resolution.diagnostics],
      });
      continue;
    }

    let proposal: RequirementExtractionProposal;
    try {
      proposal = await args.extractor({
        query,
        source: acquired.sourceRecord,
        snapshot: acquired.artifact,
      });
    } catch (error) {
      items.push({
        query: { ...query },
        status: "failed",
        source: acquired.sourceRecord,
        snapshot: acquired.artifact,
        diagnostics: [
          "REQUIREMENT_EXTRACTOR_FAILED",
          error instanceof Error ? error.message : String(error),
        ],
      });
      continue;
    }

    const validation = validateRequirementExtraction({
      source: acquired.sourceRecord,
      snapshot: acquired.artifact,
      proposal,
    });

    if (!validation.valid || !validation.profile) {
      items.push({
        query: { ...query },
        status: "reviewRequired",
        source: acquired.sourceRecord,
        snapshot: acquired.artifact,
        diagnostics: [
          "REQUIREMENT_EXTRACTION_VALIDATION_FAILED",
          ...validation.issues.map((issue) => issue.code),
        ],
      });
      continue;
    }

    items.push({
      query: { ...query },
      status: "ready",
      source: acquired.sourceRecord,
      snapshot: acquired.artifact,
      profile: validation.profile,
      diagnostics: [],
    });
  }

  const sources = items
    .filter((item): item is RequirementResolutionItem & { source: OfficialSourceRecord } =>
      Boolean(item.source),
    )
    .map((item) => item.source);
  const profiles = items
    .filter(
      (item): item is RequirementResolutionItem & {
        profile: SoftwareRequirementProfile;
      } => Boolean(item.profile),
    )
    .map((item) => item.profile);

  const readiness = items.some((item) => item.status === "failed")
    ? "failed"
    : items.some((item) => item.status === "reviewRequired")
      ? "reviewRequired"
      : "ready";

  return {
    checkedAt: args.checkedAt,
    items,
    sources,
    profiles,
    readiness,
  };
}
