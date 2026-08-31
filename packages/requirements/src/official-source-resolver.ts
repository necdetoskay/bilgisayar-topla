import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { OfficialSourceRecord } from "./index.js";
import {
  findOfficialSourceCandidates,
  type OfficialSourceQuery,
  type OfficialSourceRegistryEntry,
} from "./official-source-registry.js";

export type OfficialSourceResolutionStatus =
  | "resolved"
  | "reviewRequired"
  | "notFound";

export type OfficialSourceResolution = {
  status: OfficialSourceResolutionStatus;
  query: OfficialSourceQuery;
  candidates: OfficialSourceRegistryEntry[];
  selected?: OfficialSourceRegistryEntry;
  diagnostics: string[];
};

export type OfficialSourceFetchResponse = {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType?: string;
  bodyText: string;
};

export type OfficialSourceTransport = (
  url: string,
) => Promise<OfficialSourceFetchResponse>;

export type OfficialSourceSnapshot = {
  snapshotId: string;
  sourceId: string;
  requestedUrl: string;
  finalUrl: string;
  checkedAt: string;
  sha256: string;
  byteLength: number;
  contentType?: string;
  httpStatus: number;
};

export type OfficialSourceSnapshotArtifact = {
  metadata: OfficialSourceSnapshot;
  bodyText: string;
};

export interface OfficialSourceSnapshotStore {
  save(artifact: OfficialSourceSnapshotArtifact): Promise<void>;
  load(snapshotId: string): Promise<OfficialSourceSnapshotArtifact | undefined>;
}

export class FileOfficialSourceSnapshotStore
  implements OfficialSourceSnapshotStore
{
  constructor(private readonly rootDir: string) {}

  async save(artifact: OfficialSourceSnapshotArtifact): Promise<void> {
    assertSafeSnapshotId(artifact.metadata.snapshotId);
    const directory = join(this.rootDir, artifact.metadata.snapshotId);
    await mkdir(directory, { recursive: true });
    await Promise.all([
      writeFile(
        join(directory, "metadata.json"),
        `${JSON.stringify(artifact.metadata, null, 2)}\n`,
        "utf8",
      ),
      writeFile(join(directory, "content.txt"), artifact.bodyText, "utf8"),
    ]);
  }

  async load(
    snapshotId: string,
  ): Promise<OfficialSourceSnapshotArtifact | undefined> {
    assertSafeSnapshotId(snapshotId);
    const directory = join(this.rootDir, snapshotId);
    try {
      const [metadataText, bodyText] = await Promise.all([
        readFile(join(directory, "metadata.json"), "utf8"),
        readFile(join(directory, "content.txt"), "utf8"),
      ]);
      return {
        metadata: JSON.parse(metadataText) as OfficialSourceSnapshot,
        bodyText,
      };
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }
}

export function resolveOfficialSource(
  query: OfficialSourceQuery,
): OfficialSourceResolution {
  const candidates = findOfficialSourceCandidates(query);

  if (candidates.length === 0) {
    return {
      status: "notFound",
      query: { ...query },
      candidates: [],
      diagnostics: ["OFFICIAL_SOURCE_NOT_FOUND"],
    };
  }

  if (!query.version && candidates.some((candidate) => candidate.version)) {
    return {
      status: "reviewRequired",
      query: { ...query },
      candidates,
      diagnostics: ["OFFICIAL_SOURCE_VERSION_REQUIRED"],
    };
  }

  if (candidates.length > 1) {
    return {
      status: "reviewRequired",
      query: { ...query },
      candidates,
      diagnostics: ["OFFICIAL_SOURCE_AMBIGUOUS"],
    };
  }

  const selected = candidates[0];
  if (!selected) {
    throw new Error("resolver invariant failed: candidate disappeared");
  }

  return {
    status: "resolved",
    query: { ...query },
    candidates,
    selected,
    diagnostics: [],
  };
}

export async function defaultOfficialSourceTransport(
  url: string,
): Promise<OfficialSourceFetchResponse> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "bilgisayar-topla-official-source-resolver/0.1",
      accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type") ?? undefined,
    bodyText: await response.text(),
  };
}

export async function acquireOfficialSourceSnapshot(args: {
  source: OfficialSourceRegistryEntry;
  checkedAt: string;
  transport?: OfficialSourceTransport;
  store?: OfficialSourceSnapshotStore;
}): Promise<{
  sourceRecord: OfficialSourceRecord;
  artifact: OfficialSourceSnapshotArtifact;
}> {
  assertAllowedOfficialUrl(args.source.url, args.source.allowedHosts);
  const transport = args.transport ?? defaultOfficialSourceTransport;
  const response = await transport(args.source.url);

  if (!response.ok) {
    throw new Error(
      `official source fetch failed with HTTP ${response.status} for ${args.source.sourceId}`,
    );
  }

  assertAllowedOfficialUrl(response.finalUrl, args.source.allowedHosts);

  if (response.bodyText.trim().length === 0) {
    throw new Error(`official source body is empty for ${args.source.sourceId}`);
  }

  const sha256 = createHash("sha256")
    .update(response.bodyText, "utf8")
    .digest("hex");
  const snapshotId = `${args.source.sourceId}-${sha256.slice(0, 16)}`;
  const artifact: OfficialSourceSnapshotArtifact = {
    metadata: {
      snapshotId,
      sourceId: args.source.sourceId,
      requestedUrl: args.source.url,
      finalUrl: response.finalUrl,
      checkedAt: args.checkedAt,
      sha256,
      byteLength: Buffer.byteLength(response.bodyText, "utf8"),
      contentType: response.contentType,
      httpStatus: response.status,
    },
    bodyText: response.bodyText,
  };

  if (args.store) {
    await args.store.save(artifact);
  }

  return {
    sourceRecord: {
      sourceId: args.source.sourceId,
      vendor: args.source.vendor,
      url: response.finalUrl,
      checkedAt: args.checkedAt,
      snapshotSha256: sha256,
      language: args.source.language,
      trustState: "official",
    },
    artifact,
  };
}

export async function resolveAndAcquireOfficialSource(args: {
  query: OfficialSourceQuery;
  checkedAt: string;
  transport?: OfficialSourceTransport;
  store?: OfficialSourceSnapshotStore;
}): Promise<{
  resolution: OfficialSourceResolution;
  sourceRecord?: OfficialSourceRecord;
  artifact?: OfficialSourceSnapshotArtifact;
}> {
  const resolution = resolveOfficialSource(args.query);
  if (resolution.status !== "resolved" || !resolution.selected) {
    return { resolution };
  }

  const acquired = await acquireOfficialSourceSnapshot({
    source: resolution.selected,
    checkedAt: args.checkedAt,
    transport: args.transport,
    store: args.store,
  });

  return {
    resolution,
    ...acquired,
  };
}

function assertAllowedOfficialUrl(urlText: string, allowedHosts: string[]): void {
  const url = new URL(urlText);
  if (url.protocol !== "https:") {
    throw new Error(`official source must use https: ${urlText}`);
  }
  if (!allowedHosts.includes(url.hostname)) {
    throw new Error(
      `official source host ${url.hostname} is not allow-listed for this source`,
    );
  }
}

function assertSafeSnapshotId(snapshotId: string): void {
  if (!/^[a-zA-Z0-9._-]+$/.test(snapshotId)) {
    throw new Error(`unsafe snapshotId: ${snapshotId}`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
