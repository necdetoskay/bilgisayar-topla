import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  FileOfficialSourceSnapshotStore,
  acquireOfficialSourceSnapshot,
  resolveAndAcquireOfficialSource,
  resolveOfficialSource,
  type OfficialSourceTransport,
} from "./official-source-resolver.js";

test("AutoCAD 2022 resolves to the exact Autodesk official source", () => {
  const resolution = resolveOfficialSource({
    software: "AutoCAD",
    version: "2022",
  });

  assert.equal(resolution.status, "resolved");
  assert.equal(
    resolution.selected?.sourceId,
    "autodesk-autocad-2022-system-requirements",
  );
  assert.equal(resolution.selected?.vendor, "Autodesk");
  assert.equal(
    new URL(resolution.selected?.url ?? "https://invalid.local").hostname,
    "www.autodesk.com",
  );
});

test("AutoCAD without a version stays reviewRequired", () => {
  const resolution = resolveOfficialSource({ software: "AutoCAD" });

  assert.equal(resolution.status, "reviewRequired");
  assert.deepEqual(resolution.diagnostics, ["OFFICIAL_SOURCE_VERSION_REQUIRED"]);
});

test("generic Office stays reviewRequired because Microsoft 365 edition is ambiguous", () => {
  const resolution = resolveOfficialSource({ software: "Office" });

  assert.equal(resolution.status, "reviewRequired");
  assert.deepEqual(resolution.diagnostics, ["OFFICIAL_SOURCE_AMBIGUOUS"]);
  assert.equal(resolution.candidates.length, 2);
  assert.equal(
    resolution.candidates.every(
      (candidate) => new URL(candidate.url).hostname === "support.microsoft.com",
    ),
    true,
  );
});

test("explicit Office 2021 does not fall back to Microsoft 365 product-family sources", () => {
  const resolution = resolveOfficialSource({
    software: "Office",
    version: "2021",
  });

  assert.equal(resolution.status, "notFound");
  assert.deepEqual(resolution.diagnostics, ["OFFICIAL_SOURCE_NOT_FOUND"]);
  assert.deepEqual(resolution.candidates, []);
});

test("known Microsoft 365 business edition resolves deterministically", () => {
  const resolution = resolveOfficialSource({
    software: "Microsoft 365",
    edition: "businessEducationGovernment",
  });

  assert.equal(resolution.status, "resolved");
  assert.equal(
    resolution.selected?.sourceId,
    "microsoft-365-business-education-government-system-requirements",
  );
});

test("snapshot acquisition preserves hash, source record and file artifact", async () => {
  const resolution = resolveOfficialSource({
    software: "AutoCAD",
    version: "2022",
  });
  assert.equal(resolution.status, "resolved");
  assert.ok(resolution.selected);

  const root = await mkdtemp(join(tmpdir(), "pc-build-source-snapshots-"));
  try {
    const store = new FileOfficialSourceSnapshotStore(root);
    const transport: OfficialSourceTransport = async (url) => ({
      ok: true,
      status: 200,
      finalUrl: url,
      contentType: "text/html; charset=utf-8",
      bodyText: "<html><body>fixture official AutoCAD requirements</body></html>",
    });

    const acquired = await acquireOfficialSourceSnapshot({
      source: resolution.selected,
      checkedAt: "2026-08-24T18:30:00.000Z",
      transport,
      store,
    });

    assert.equal(acquired.sourceRecord.trustState, "official");
    assert.equal(
      acquired.sourceRecord.snapshotSha256,
      acquired.artifact.metadata.sha256,
    );
    assert.equal(acquired.artifact.metadata.httpStatus, 200);
    assert.equal(acquired.artifact.metadata.byteLength > 0, true);

    const stored = await store.load(acquired.artifact.metadata.snapshotId);
    assert.deepEqual(stored, acquired.artifact);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("redirect to a non-official host fails closed", async () => {
  const resolution = resolveOfficialSource({
    software: "AutoCAD",
    version: "2022",
  });
  assert.ok(resolution.selected);

  const transport: OfficialSourceTransport = async () => ({
    ok: true,
    status: 200,
    finalUrl: "https://evil.example/requirements",
    contentType: "text/html",
    bodyText: "untrusted content",
  });

  await assert.rejects(
    () =>
      acquireOfficialSourceSnapshot({
        source: resolution.selected!,
        checkedAt: "2026-08-24T18:30:00.000Z",
        transport,
      }),
    /is not allow-listed/,
  );
});

test("resolveAndAcquire does not fetch when Office is still ambiguous", async () => {
  let transportCalls = 0;
  const transport: OfficialSourceTransport = async (url) => {
    transportCalls += 1;
    return {
      ok: true,
      status: 200,
      finalUrl: url,
      bodyText: "should not be called",
    };
  };

  const result = await resolveAndAcquireOfficialSource({
    query: { software: "Office" },
    checkedAt: "2026-08-24T18:30:00.000Z",
    transport,
  });

  assert.equal(result.resolution.status, "reviewRequired");
  assert.equal(transportCalls, 0);
  assert.equal(result.sourceRecord, undefined);
  assert.equal(result.artifact, undefined);
});
