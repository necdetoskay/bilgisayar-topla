import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { extractProductFeatureProfile } from "@bilgisayar-topla/product-extractor";
import { generateSpecificationDraft } from "@bilgisayar-topla/specification";
import { runSpecificationFixture } from "./index.js";

test("ULTEF: fixture pipeline writes draft and compliance report", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "spec-harness-"));
  const fixturePath = resolve("fixtures/printer-basic.json");

  const result = await runSpecificationFixture({
    fixturePath,
    outputRoot,
    runId: "test-run",
  });

  assert.equal(result.readiness, "draftReady");

  const draft = await readFile(result.draftPath, "utf8");
  const compliance = JSON.parse(
    await readFile(result.complianceReportPath, "utf8"),
  ) as { readiness: string; findings: unknown[] };

  assert.match(draft, /Teknik Sartname Taslagi/);
  assert.equal(compliance.readiness, "draftReady");
  assert.deepEqual(compliance.findings, []);
});

test("ULTEF: monitor fixture stays product-neutral", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "spec-harness-"));
  const fixturePath = resolve("fixtures/monitor-basic.json");

  const result = await runSpecificationFixture({
    fixturePath,
    outputRoot,
    runId: "monitor-run",
  });

  assert.equal(result.readiness, "draftReady");

  const draft = await readFile(result.draftPath, "utf8");
  const compliance = JSON.parse(
    await readFile(result.complianceReportPath, "utf8"),
  ) as { readiness: string; findings: unknown[] };

  assert.match(draft, /Ekran boyutu/);
  assert.doesNotMatch(draft, /Example Display/);
  assert.equal(compliance.readiness, "draftReady");
  assert.deepEqual(compliance.findings, []);
});

test("ULTEF: risky fixture creates blocked compliance report", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "spec-harness-"));
  const fixturePath = resolve("fixtures/desktop-ghz-risk.json");

  const result = await runSpecificationFixture({
    fixturePath,
    outputRoot,
    runId: "risk-run",
  });

  const compliance = JSON.parse(
    await readFile(result.complianceReportPath, "utf8"),
  ) as { readiness: string; findings: Array<{ code: string }> };

  assert.equal(result.readiness, "blocked");
  assert.equal(compliance.readiness, "blocked");
  assert.equal(
    compliance.findings.some(
      (finding) => finding.code === "clock_speed_clause_risk",
    ),
    true,
  );
});

test("ULTEF: AI extracted profile can feed specification generation", async () => {
  const extraction = await extractProductFeatureProfile({
    url: "https://example.test/products/printer-x123",
    html: "<html><body><h1>Example Brand X123 Printer</h1></body></html>",
    fetchedAt: "2026-08-13T00:00:00.000Z",
    aiExtractor: async () => ({
      productCategory: "printer",
      identity: {
        title: "Example Brand X123 Printer",
        brand: "Example Brand",
        model: "X123",
      },
      features: [
        {
          label: "Marka",
          value: "Example Brand",
        },
        {
          label: "Model",
          value: "X123",
        },
        {
          label: "Otomatik cift tarafli baski",
          value: true,
        },
      ],
    }),
  });

  const specification = generateSpecificationDraft(extraction.profile);

  assert.equal(extraction.validation.valid, true);
  assert.equal(specification.readiness, "draftReady");
  assert.ok(specification.draft);
  assert.match(specification.draft.markdown, /Otomatik cift tarafli baski/);
  assert.doesNotMatch(specification.draft.markdown, /Example Brand|X123/);
});
