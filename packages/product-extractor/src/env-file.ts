import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function loadEnvFiles(
  cwd = process.cwd(),
  target: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  for (const fileName of [".env", ".env.local"]) {
    await loadEnvFile(resolve(cwd, fileName), target);
  }
}

async function loadEnvFile(
  path: string,
  target: NodeJS.ProcessEnv,
): Promise<void> {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed || target[parsed.key] !== undefined) {
      continue;
    }
    target[parsed.key] = parsed.value;
  }
}

function parseEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined;
  }

  const equalsIndex = trimmed.indexOf("=");
  if (equalsIndex <= 0) {
    return undefined;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  const rawValue = trimmed.slice(equalsIndex + 1).trim();
  if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    return undefined;
  }

  return {
    key,
    value: unquote(rawValue),
  };
}

function unquote(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
