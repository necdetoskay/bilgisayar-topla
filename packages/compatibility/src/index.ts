import type { CatalogCategory } from "@bilgisayar-topla/catalog";
import type {
  ProductFeature,
  ProductFeatureProfile,
} from "@bilgisayar-topla/shared-contracts";

export const COMPATIBILITY_POLICY_VERSION = "1.0.0" as const;

export const REQUIRED_COMPONENT_CATEGORIES: readonly CatalogCategory[] = [
  "cpu",
  "motherboard",
  "memory",
  "gpu",
  "storage",
  "psu",
  "case",
] as const;

export type CompatibilityStatus = "PASS" | "FAIL" | "REVIEW_REQUIRED";

export type CompatibilityComponent = {
  catalogProductId: string;
  componentCategory: CatalogCategory;
  status: "ready" | "reviewRequired" | "blocked";
  profile: ProductFeatureProfile;
};

export type CompatibilityEvidenceRef = {
  catalogProductId: string;
  profileId: string;
  featureKey?: string;
  sourceRefIds: string[];
};

export type CompatibilityRuleId =
  | "component-completeness"
  | "component-profile-readiness"
  | "cpu-motherboard-socket"
  | "memory-motherboard-generation"
  | "motherboard-case-form-factor"
  | "gpu-case-clearance"
  | "storage-motherboard-interface"
  | "gpu-psu-capacity";

export type CompatibilityCheck = {
  ruleId: CompatibilityRuleId;
  status: CompatibilityStatus;
  code: string;
  message: string;
  evidenceRefs: CompatibilityEvidenceRef[];
};

export type CompatibilityResult = {
  policyVersion: typeof COMPATIBILITY_POLICY_VERSION;
  status: CompatibilityStatus;
  checks: CompatibilityCheck[];
  firstBlockingCheck?: CompatibilityCheck;
};

type StorageInterface = "NVME" | "M2_SATA" | "SATA";

export function evaluateCompatibility(
  components: CompatibilityComponent[],
): CompatibilityResult {
  const checks: CompatibilityCheck[] = [];

  const completeness = checkCompleteness(components);
  checks.push(completeness);
  if (completeness.status === "FAIL") return finalize(checks);

  const readiness = checkReadiness(components);
  checks.push(readiness);
  if (readiness.status !== "PASS") return finalize(checks);

  checks.push(checkSocket(components));
  checks.push(checkMemory(components));
  checks.push(checkFormFactor(components));
  checks.push(checkGpuClearance(components));
  checks.push(checkStorage(components));
  checks.push(checkPsu(components));

  return finalize(checks);
}

function checkCompleteness(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const missing = REQUIRED_COMPONENT_CATEGORIES.filter(
    (category) =>
      !components.some((item) => item.componentCategory === category),
  );

  if (missing.length > 0) {
    return makeCheck(
      "component-completeness",
      "FAIL",
      "REQUIRED_COMPONENT_MISSING",
      `Required component categories are missing: ${missing.join(", ")}`,
      [],
    );
  }

  const invalidCount = REQUIRED_COMPONENT_CATEGORIES.find(
    (category) =>
      components.filter((item) => item.componentCategory === category).length !== 1,
  );

  if (invalidCount) {
    return makeCheck(
      "component-completeness",
      "FAIL",
      "REQUIRED_COMPONENT_COUNT_INVALID",
      `Candidate must contain exactly one ${invalidCount} component.`,
      components
        .filter((item) => item.componentCategory === invalidCount)
        .map(componentRef),
    );
  }

  return makeCheck(
    "component-completeness",
    "PASS",
    "COMPONENT_SET_COMPLETE",
    "Candidate contains exactly one component from every required category.",
    components.map(componentRef),
  );
}

function checkReadiness(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const blocked = components.find((item) => item.status === "blocked");
  if (blocked) {
    return makeCheck(
      "component-profile-readiness",
      "FAIL",
      "COMPONENT_PROFILE_BLOCKED",
      `${blocked.componentCategory} product ${blocked.catalogProductId} is blocked.`,
      [componentRef(blocked)],
    );
  }

  const unresolved = components.find(
    (item) =>
      item.status !== "ready" ||
      item.profile.readiness !== "readyForSpecification" ||
      item.profile.features.length === 0,
  );

  if (unresolved) {
    return makeCheck(
      "component-profile-readiness",
      "REVIEW_REQUIRED",
      "COMPONENT_PROFILE_NOT_READY",
      `${unresolved.componentCategory} product ${unresolved.catalogProductId} is not compatibility-ready.`,
      [componentRef(unresolved)],
    );
  }

  return makeCheck(
    "component-profile-readiness",
    "PASS",
    "COMPONENT_PROFILES_READY",
    "All component profiles are ready for deterministic compatibility checks.",
    components.map(componentRef),
  );
}

function checkSocket(components: CompatibilityComponent[]): CompatibilityCheck {
  const cpu = component(components, "cpu");
  const board = component(components, "motherboard");
  const cpuFeature = findFeature(cpu.profile, ["socket", "soket"]);
  const boardFeature = findFeature(board.profile, [
    "socket",
    "soket",
    "islemci soketi",
    "cpu socket",
  ]);
  const cpuSocket = cpuFeature ? parseSocket(featureText(cpuFeature)) : undefined;
  const boardSocket = boardFeature
    ? parseSocket(featureText(boardFeature))
    : undefined;
  const evidence = refs(cpu, cpuFeature, board, boardFeature);

  if (!cpuSocket || !boardSocket) {
    return review(
      "cpu-motherboard-socket",
      "CPU_MOTHERBOARD_SOCKET_EVIDENCE_MISSING",
      "CPU and motherboard socket evidence must both be present.",
      evidence,
    );
  }

  if (cpuSocket !== boardSocket) {
    return makeCheck(
      "cpu-motherboard-socket",
      "FAIL",
      "CPU_MOTHERBOARD_SOCKET_MISMATCH",
      `CPU socket ${cpuSocket} does not match motherboard socket ${boardSocket}.`,
      evidence,
    );
  }

  return makeCheck(
    "cpu-motherboard-socket",
    "PASS",
    "CPU_MOTHERBOARD_SOCKET_MATCH",
    `CPU and motherboard use ${cpuSocket}.`,
    evidence,
  );
}

function checkMemory(components: CompatibilityComponent[]): CompatibilityCheck {
  const memory = component(components, "memory");
  const board = component(components, "motherboard");
  const memoryFeature = findFeature(memory.profile, [
    "ddr",
    "memory type",
    "ram type",
    "bellek tipi",
    "bellek turu",
  ]);
  const boardFeature = findFeature(board.profile, [
    "ddr",
    "memory type",
    "ram type",
    "bellek tipi",
    "bellek turu",
    "supported memory",
  ]);
  const memoryGeneration = memoryFeature
    ? parseDdr(featureText(memoryFeature))
    : undefined;
  const boardGenerations = boardFeature
    ? parseAllDdr(featureText(boardFeature))
    : [];
  const evidence = refs(memory, memoryFeature, board, boardFeature);

  if (!memoryGeneration || boardGenerations.length === 0) {
    return review(
      "memory-motherboard-generation",
      "MEMORY_GENERATION_EVIDENCE_MISSING",
      "RAM generation and motherboard memory support must both be evidenced.",
      evidence,
    );
  }

  if (!boardGenerations.includes(memoryGeneration)) {
    return makeCheck(
      "memory-motherboard-generation",
      "FAIL",
      "MEMORY_MOTHERBOARD_GENERATION_MISMATCH",
      `Memory is ${memoryGeneration}; motherboard evidence supports ${boardGenerations.join(", ")}.`,
      evidence,
    );
  }

  return makeCheck(
    "memory-motherboard-generation",
    "PASS",
    "MEMORY_MOTHERBOARD_GENERATION_MATCH",
    `${memoryGeneration} memory is supported by the motherboard.`,
    evidence,
  );
}

function checkFormFactor(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const board = component(components, "motherboard");
  const caseItem = component(components, "case");
  const boardFeature = findFeature(board.profile, [
    "form factor",
    "formfactor",
    "anakart form",
    "boyut standardi",
  ]);
  const caseFeature = findFeature(caseItem.profile, [
    "motherboard support",
    "anakart destegi",
    "anakart uyumlulugu",
    "form factor",
    "formfactor",
  ]);
  const boardFactor = boardFeature
    ? parseFormFactors(featureText(boardFeature))[0]
    : undefined;
  const caseFactors = caseFeature
    ? parseFormFactors(featureText(caseFeature))
    : [];
  const evidence = refs(board, boardFeature, caseItem, caseFeature);

  if (!boardFactor || caseFactors.length === 0) {
    return review(
      "motherboard-case-form-factor",
      "MOTHERBOARD_CASE_FORM_FACTOR_EVIDENCE_MISSING",
      "Motherboard form factor and case support must both be evidenced.",
      evidence,
    );
  }

  if (!caseFactors.includes(boardFactor)) {
    return makeCheck(
      "motherboard-case-form-factor",
      "FAIL",
      "MOTHERBOARD_CASE_FORM_FACTOR_MISMATCH",
      `Case does not list motherboard form factor ${boardFactor} as supported.`,
      evidence,
    );
  }

  return makeCheck(
    "motherboard-case-form-factor",
    "PASS",
    "MOTHERBOARD_CASE_FORM_FACTOR_MATCH",
    `Case supports motherboard form factor ${boardFactor}.`,
    evidence,
  );
}

function checkGpuClearance(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const gpu = component(components, "gpu");
  const caseItem = component(components, "case");
  const gpuFeature = findFeature(gpu.profile, [
    "gpu length",
    "card length",
    "ekran karti uzunlugu",
    "uzunluk",
  ]);
  const caseFeature = findFeature(caseItem.profile, [
    "max gpu length",
    "maximum gpu length",
    "vga length",
    "ekran karti uzunlugu",
    "gpu clearance",
  ]);
  const gpuLength = gpuFeature ? parseLengthMm(gpuFeature) : undefined;
  const caseClearance = caseFeature
    ? parseLengthMm(caseFeature)
    : undefined;
  const evidence = refs(gpu, gpuFeature, caseItem, caseFeature);

  if (gpuLength === undefined || caseClearance === undefined) {
    return review(
      "gpu-case-clearance",
      "GPU_CASE_CLEARANCE_EVIDENCE_MISSING",
      "GPU length and case maximum GPU clearance must both be evidenced.",
      evidence,
    );
  }

  if (gpuLength > caseClearance) {
    return makeCheck(
      "gpu-case-clearance",
      "FAIL",
      "GPU_CASE_CLEARANCE_EXCEEDED",
      `GPU length ${gpuLength} mm exceeds case clearance ${caseClearance} mm.`,
      evidence,
    );
  }

  return makeCheck(
    "gpu-case-clearance",
    "PASS",
    "GPU_CASE_CLEARANCE_OK",
    `GPU length ${gpuLength} mm fits within ${caseClearance} mm clearance.`,
    evidence,
  );
}

function checkStorage(components: CompatibilityComponent[]): CompatibilityCheck {
  const storage = component(components, "storage");
  const board = component(components, "motherboard");
  const storageFeature = findFeature(storage.profile, [
    "interface",
    "arayuz",
    "baglanti",
    "nvme",
    "sata",
    "m.2",
    "m2",
  ]);
  const boardFeature = findFeature(board.profile, [
    "storage",
    "depolama",
    "m.2",
    "m2",
    "nvme",
    "sata",
    "interface",
    "arayuz",
  ]);
  const storageInterface = storageFeature
    ? parseStorageInterface(featureText(storageFeature))
    : undefined;
  const boardSupport = boardFeature
    ? parseStorageSupport(featureText(boardFeature))
    : new Set<StorageInterface>();
  const evidence = refs(storage, storageFeature, board, boardFeature);

  if (!storageInterface || boardSupport.size === 0) {
    return review(
      "storage-motherboard-interface",
      "STORAGE_INTERFACE_EVIDENCE_MISSING",
      "Storage interface and motherboard storage support must both be evidenced.",
      evidence,
    );
  }

  if (!boardSupport.has(storageInterface)) {
    return makeCheck(
      "storage-motherboard-interface",
      "FAIL",
      "STORAGE_MOTHERBOARD_INTERFACE_MISMATCH",
      `Storage interface ${storageInterface} is not supported by motherboard evidence (${[...boardSupport].join(", ")}).`,
      evidence,
    );
  }

  return makeCheck(
    "storage-motherboard-interface",
    "PASS",
    "STORAGE_MOTHERBOARD_INTERFACE_MATCH",
    `Storage interface ${storageInterface} is supported by the motherboard.`,
    evidence,
  );
}

function checkPsu(components: CompatibilityComponent[]): CompatibilityCheck {
  const gpu = component(components, "gpu");
  const psu = component(components, "psu");
  const gpuFeature = findFeature(gpu.profile, [
    "recommended psu",
    "recommended power supply",
    "onerilen psu",
    "onerilen guc kaynagi",
    "power supply recommendation",
  ]);
  const psuFeature = findFeature(psu.profile, [
    "watt",
    "power",
    "guc",
    "capacity",
    "toplam guc",
  ]);
  const requiredWatts = gpuFeature ? parseWatts(gpuFeature) : undefined;
  const psuWatts = psuFeature ? parseWatts(psuFeature) : undefined;
  const evidence = refs(gpu, gpuFeature, psu, psuFeature);

  if (requiredWatts === undefined || psuWatts === undefined) {
    return review(
      "gpu-psu-capacity",
      "GPU_PSU_CAPACITY_EVIDENCE_MISSING",
      "GPU recommended PSU capacity and PSU rated wattage must both be evidenced in V1.",
      evidence,
    );
  }

  if (psuWatts < requiredWatts) {
    return makeCheck(
      "gpu-psu-capacity",
      "FAIL",
      "PSU_CAPACITY_BELOW_GPU_RECOMMENDATION",
      `PSU is ${psuWatts} W, below GPU recommendation ${requiredWatts} W.`,
      evidence,
    );
  }

  return makeCheck(
    "gpu-psu-capacity",
    "PASS",
    "PSU_CAPACITY_MEETS_GPU_RECOMMENDATION",
    `PSU ${psuWatts} W meets GPU recommendation ${requiredWatts} W.`,
    evidence,
  );
}

function component(
  components: CompatibilityComponent[],
  category: CatalogCategory,
): CompatibilityComponent {
  const found = components.find((item) => item.componentCategory === category);
  if (!found) {
    throw new Error(`compatibility invariant failed: missing ${category}`);
  }
  return found;
}

function findFeature(
  profile: ProductFeatureProfile,
  aliases: string[],
): ProductFeature | undefined {
  const normalizedAliases = aliases.map(normalize);
  return profile.features.find((feature) => {
    const haystack = normalize(`${feature.key} ${feature.label}`);
    return normalizedAliases.some((alias) => haystack.includes(alias));
  });
}

function featureText(feature: ProductFeature): string {
  return [feature.label, String(feature.value), feature.unit]
    .filter(Boolean)
    .join(" ");
}

function parseSocket(text: string): string | undefined {
  const match = normalize(text).match(
    /(?:am4|am5|tr4|strx4|lga\s*\d{3,4})/i,
  )?.[0];
  return match?.replace(/\s+/g, "").toUpperCase();
}

function parseDdr(text: string): string | undefined {
  return parseAllDdr(text)[0];
}

function parseAllDdr(text: string): string[] {
  const matches = normalize(text).match(/ddr\s*[345]/gi) ?? [];
  return [
    ...new Set(
      matches.map((item) => item.replace(/\s+/g, "").toUpperCase()),
    ),
  ];
}

function parseFormFactors(text: string): string[] {
  const normalized = normalize(text);
  const result: string[] = [];

  if (/(micro\s*-?\s*atx|m\s*-?\s*atx|matx)/i.test(normalized)) {
    result.push("MICRO_ATX");
  }
  if (/mini\s*-?\s*itx/i.test(normalized)) result.push("MINI_ITX");
  if (/(^|[^a-z])eatx([^a-z]|$)|extended\s+atx/i.test(normalized)) {
    result.push("EATX");
  }

  const stripped = normalized
    .replace(/micro\s*-?\s*atx|m\s*-?\s*atx|matx/gi, " ")
    .replace(/mini\s*-?\s*itx/gi, " ")
    .replace(/eatx|extended\s+atx/gi, " ");

  if (/(^|[^a-z])atx([^a-z]|$)/i.test(stripped)) result.push("ATX");
  return [...new Set(result)];
}

function parseLengthMm(feature: ProductFeature): number | undefined {
  if (typeof feature.value === "number") {
    const unit = normalize(feature.unit ?? "mm");
    if (unit === "mm") return feature.value;
    if (unit === "cm") return feature.value * 10;
  }

  const text = normalize(featureText(feature));
  const mm = text.match(/(\d+(?:[.,]\d+)?)\s*mm/i)?.[1];
  if (mm) return Number(mm.replace(",", "."));
  const cm = text.match(/(\d+(?:[.,]\d+)?)\s*cm/i)?.[1];
  return cm ? Number(cm.replace(",", ".")) * 10 : undefined;
}

function parseStorageInterface(text: string): StorageInterface | undefined {
  const normalized = normalize(text);
  if (/nvme|m\.?\s*2[^,;]{0,20}pcie|pcie[^,;]{0,20}m\.?\s*2/i.test(normalized)) {
    return "NVME";
  }
  if (/m\.?\s*2[^,;]{0,20}sata|sata[^,;]{0,20}m\.?\s*2/i.test(normalized)) {
    return "M2_SATA";
  }
  if (/(^|[^a-z])sata([^a-z]|$)/i.test(normalized)) return "SATA";
  return undefined;
}

function parseStorageSupport(text: string): Set<StorageInterface> {
  const normalized = normalize(text);
  const result = new Set<StorageInterface>();

  if (/nvme|m\.?\s*2[^,;]{0,20}pcie|pcie[^,;]{0,20}m\.?\s*2/i.test(normalized)) {
    result.add("NVME");
  }

  const m2SataPattern = /m\.?\s*2[^,;]{0,20}sata|sata[^,;]{0,20}m\.?\s*2/gi;
  if (m2SataPattern.test(normalized)) result.add("M2_SATA");

  const withoutM2Sata = normalized.replace(m2SataPattern, " ");
  if (/(^|[^a-z])(?:\d+\s*x\s*)?sata([^a-z]|$)/i.test(withoutM2Sata)) {
    result.add("SATA");
  }

  return result;
}

function parseWatts(feature: ProductFeature): number | undefined {
  if (
    typeof feature.value === "number" &&
    /^w(?:att)?$/i.test(normalize(feature.unit ?? ""))
  ) {
    return feature.value;
  }

  const raw = normalize(featureText(feature));
  const value = raw.match(/(\d+(?:[.,]\d+)?)\s*w(?:att)?(?:\s|$)/i)?.[1];
  return value ? Number(value.replace(",", ".")) : undefined;
}

function refs(
  first: CompatibilityComponent,
  firstFeature: ProductFeature | undefined,
  second: CompatibilityComponent,
  secondFeature: ProductFeature | undefined,
): CompatibilityEvidenceRef[] {
  return [
    featureRef(first, firstFeature),
    featureRef(second, secondFeature),
  ];
}

function featureRef(
  item: CompatibilityComponent,
  feature: ProductFeature | undefined,
): CompatibilityEvidenceRef {
  return {
    catalogProductId: item.catalogProductId,
    profileId: item.profile.profileId,
    featureKey: feature?.key,
    sourceRefIds: [...(feature?.sourceRefIds ?? [])],
  };
}

function componentRef(
  item: CompatibilityComponent,
): CompatibilityEvidenceRef {
  return {
    catalogProductId: item.catalogProductId,
    profileId: item.profile.profileId,
    sourceRefIds: item.profile.evidence.map((evidence) => evidence.evidenceId),
  };
}

function review(
  ruleId: CompatibilityRuleId,
  code: string,
  message: string,
  evidenceRefs: CompatibilityEvidenceRef[],
): CompatibilityCheck {
  return makeCheck(ruleId, "REVIEW_REQUIRED", code, message, evidenceRefs);
}

function makeCheck(
  ruleId: CompatibilityRuleId,
  status: CompatibilityStatus,
  code: string,
  message: string,
  evidenceRefs: CompatibilityEvidenceRef[],
): CompatibilityCheck {
  return { ruleId, status, code, message, evidenceRefs };
}

function finalize(checks: CompatibilityCheck[]): CompatibilityResult {
  const status: CompatibilityStatus = checks.some((item) => item.status === "FAIL")
    ? "FAIL"
    : checks.some((item) => item.status === "REVIEW_REQUIRED")
      ? "REVIEW_REQUIRED"
      : "PASS";

  return {
    policyVersion: COMPATIBILITY_POLICY_VERSION,
    status,
    checks,
    firstBlockingCheck: checks.find((item) => item.status !== "PASS"),
  };
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}
