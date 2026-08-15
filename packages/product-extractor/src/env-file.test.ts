import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadEnvFiles } from "./env-file.js";

test("ULTEF: env file loader reads .env and .env.local without overriding existing env", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "product-env-"));
  const env: NodeJS.ProcessEnv = {
    OPENROUTER_API_KEY: "existing-key",
  };

  await writeFile(
    join(cwd, ".env"),
    [
      "OPENROUTER_API_KEY=env-file-key",
      "PRODUCT_EXTRACTOR_MODEL=deepseek/deepseek-v4-flash",
    ].join("\n"),
    "utf8",
  );
  await writeFile(
    join(cwd, ".env.local"),
    "PRODUCT_EXTRACTOR_INPUT_PRICE_PER_MILLION_USD=\"0.05\"\n",
    "utf8",
  );

  await loadEnvFiles(cwd, env);

  assert.equal(env.OPENROUTER_API_KEY, "existing-key");
  assert.equal(env.PRODUCT_EXTRACTOR_MODEL, "deepseek/deepseek-v4-flash");
  assert.equal(env.PRODUCT_EXTRACTOR_INPUT_PRICE_PER_MILLION_USD, "0.05");
});
