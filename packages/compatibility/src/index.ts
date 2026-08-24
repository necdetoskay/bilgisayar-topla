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

export type CompatibilityCheck = {
  ruleId:
    | "component-completeness"
    | "component-profile-readiness"
    | "cpu-motherboard-socket"
    | "memory-motherboard-generation"
    | "motherboard-case-form-factor"
    | "gpu-case-clearance"
    | "storage-motherboard-interface"
    | "gpu-psu-capacity";
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

export function evaluateCompatibility(
  components: CompatibilityComponent[],
): CompatibilityResult {
  const checks: CompatibilityCheck[] = [];

  const completeness = checkComponentCompleteness(components);
  checks.push(completeness);
  if (completeness.status === "FAIL") {
    return finalize(checks);
  }

  const readiness = checkProfileReadiness(components);
  checks.push(readiness);
  if (readiness.status !== "PASS") {
    return finalize(checks);
  }

  checks.push(checkCpuMotherboardSocket(components));
  checks.push(checkMemoryGeneration(components));
  checks.push(checkMotherboardCaseFormFactor(components));
  checks.push(checkGpuCaseClearance(components));
  checks.push(checkStorageInterface(components));
  checks.push(checkGpuPsuCapacity(components));

  return finalize(checks);
}

function checkComponentCompleteness(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const missing = REQUIRED_COMPONENT_CATEGORIES.filter(
    (category) => !components.some((component) => component.componentCategory === category),
  );
  if (missing.length > 0) {
    return {
      ruleId: "component-completeness",
      status: "FAIL",
      code: "REQUIRED_COMPONENT_MISSING",
      message: `Required component categories are missing: ${missing.join(", ")}`,
      evidenceRefs: [],
    };
  }

  const duplicate = REQUIRED_COMPONENT_CATEGORIES.find(
    (category) =>
      components.filter((component) => component.componentCategory === category).length !== 1,
  );
  if (duplicate) {
    return {
      ruleId: "component-completeness",
      status: "FAIL",
      code: "REQUIRED_COMPONENT_COUNT_INVALID",
      message: `Candidate must contain exactly one ${duplicate} component.`,
      evidenceRefs: components
        .filter((component) => component.componentCategory === duplicate)
        .map(componentRef),
    };
  }

  return {
    ruleId: "component-completeness",
    status: "PASS",
    code: "COMPONENT_SET_COMPLETE",
    message: "Candidate contains exactly one component from every required category.",
    evidenceRefs: components.map(componentRef),
  };
}

function checkProfileReadiness(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const blocked = components.find((component) => component.status === "blocked");
  if (blocked) {
    return {
      ruleId: "component-profile-readiness",
      status: "FAIL",
      code: "COMPONENT_PROFILE_BLOCKED",
      message: `${blocked.componentCategory} product ${blocked.catalogProductId} is blocked and cannot participate in a candidate build.`,
      evidenceRefs: [componentRef(blocked)],
    };
  }

  const unresolved = components.find(
    (component) =>
      component.status !== "ready" ||
      component.profile.readiness === "reviewRequired" ||
      component.profile.readiness === "blocked" ||
      component.profile.features.length === 0,
  );
  if (unresolved) {
    return {
      ruleId: "component-profile-readiness",
      status: "REVIEW_REQUIRED",
      code: "COMPONENT_PROFILE_NOT_READY",
      message: `${unresolved.componentCategory} product ${unresolved.catalogProductId} does not have a compatibility-ready technical profile.`,
      evidenceRefs: [componentRef(unresolved)],
    };
  }

  return {
    ruleId: "component-profile-readiness",
    status: "PASS",
    code: "COMPONENT_PROFILES_READY",
    message: "All component profiles are ready for deterministic compatibility checks.",
    evidenceRefs: components.map(componentRef),
  };
}

function checkCpuMotherboardSocket(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const cpu = requiredComponent(components, "cpu");
  const motherboard = requiredComponent(components, "motherboard");
  const cpuFeature = findFeature(cpu.profile, ["socket", "soket"]);
  const boardFeature = findFeature(motherboard.profile, [
    "socket",
    "soket",
    "islemci soketi",
    "cpu socket",
  ]);
  const cpuSocket = cpuFeature ? parseSocket(featureText(cpuFeature)) : undefined;
  const boardSocket = boardFeature ? parseSocket(featureText(boardFeature)) : undefined;

  if (!cpuSocket || !boardSocket) {
    return reviewMissing(
      "cpu-motherboard-socket",
      "CPU_MOTHERBOARD_SOCKET_EVIDENCE_MISSING",
      "CPU and motherboard socket evidence must both be present before compatibility can be accepted.",
      refs(cpu, cpuFeature, motherboard, boardFeature),
    );
  }

  if (cpuSocket !== boardSocket) {
    return {
      ruleId: "cpu-motherboard-socket",
      status: "FAIL",
      code: "CPU_MOTHERBOARD_SOCKET_MISMATCH",
      message: `CPU socket ${cpuSocket} does not match motherboard socket ${boardSocket}.`,
      evidenceRefs: refs(cpu, cpuFeature, motherboard, boardFeature),
    };
  }

  return pass(
    "cpu-motherboard-socket",
    "CPU_MOTHERBOARD_SOCKET_MATCH",
    `CPU and motherboard use ${cpuSocket}.`,
    refs(cpu, cpuFeature, motherboard, boardFeature),
  );
}

function checkMemoryGeneration(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const memory = requiredComponent(components, "memory");
  const motherboard = requiredComponent(components, "motherboard");
  const memoryFeature = findFeature(memory.profile, [
    "ddr",
    "memory type",
    "ram type",
    "bellek tipi",
    "bellek turu",
  ]);
  const boardFeature = findFeature(motherboard.profile, [
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

  if (!memoryGeneration || boardGenerations.length === 0) {
    return reviewMissing(
      "memory-motherboard-generation",
      "MEMORY_GENERATION_EVIDENCE_MISSING",
      "RAM generation and motherboard memory-generation support must both be evidenced.",
      refs(memory, memoryFeature, motherboard, boardFeature),
    );
  }

  if (!boardGenerations.includes(memoryGeneration)) {
    return {
      ruleId: "memory-motherboard-generation",
      status: "FAIL",
      code: "MEMORY_MOTHERBOARD_GENERATION_MISMATCH",
      message: `Memory is ${memoryGeneration}, while motherboard evidence supports ${boardGenerations.join(", ")}.`,
      evidenceRefs: refs(memory, memoryFeature, motherboard, boardFeature),
    };
  }

  return pass(
    "memory-motherboard-generation",
    "MEMORY_MOTHERBOARD_GENERATION_MATCH",
    `Memory generation ${memoryGeneration} is supported by the motherboard.`,
    refs(memory, memoryFeature, motherboard, boardFeature),
  );
}

function checkMotherboardCaseFormFactor(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const motherboard = requiredComponent(components, "motherboard");
  const caseComponent = requiredComponent(components, "case");
  const boardFeature = findFeature(motherboard.profile, [
    "form factor",
    "formfactor",
    "anakart form",
    "boyut standardi",
  ]);
  const caseFeature = findFeature(caseComponent.profile, [
    "motherboard support",
    "anakart destegi",
    "anakart uyumlulugu",
    "form factor",
    "formfactor",
  ]);
  const boardFactor = boardFeature
    ? parseFormFactors(featureText(boardFeature))[0]
    : undefined;
  const supportedFactors = caseFeature
    ? parseFormFactors(featureText(caseFeature))
    : [];

  if (!boardFactor || supportedFactors.length === 0) {
    return reviewMissing(
      "motherboard-case-form-factor",
      "MOTHERBOARD_CASE_FORM_FACTOR_EVIDENCE_MISSING",
      "Motherboard form factor and case motherboard support must both be evidenced.",
      refs(motherboard, boardFeature, caseComponent, caseFeature),
    );
  }

  if (!supportedFactors.includes(boardFactor)) {
    return {
      ruleId: "motherboard-case-form-factor",
      status: "FAIL",
      code: "MOTHERBOARD_CASE_FORM_FACTOR_MISMATCH",
      message: `Motherboard form factor ${boardFactor} is not listed as supported by the case.`,
      evidenceRefs: refs(motherboard, boardFeature, caseComponent, caseFeature),
    };
  }

  return pass(
    "motherboard-case-form-factor",
    "MOTHERBOARD_CASE_FORM_FACTOR_MATCH",
    `Case supports motherboard form factor ${boardFactor}.`,
    refs(motherboard, boardFeature, caseComponent, caseFeature),
  );
}

function checkGpuCaseClearance(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const gpu = requiredComponent(components, "gpu");
  const caseComponent = requiredComponent(components, "case");
  const gpuFeature = findFeature(gpu.profile, [
    "gpu length",
    "card length",
    "ekran karti uzunlugu",
    "uzunluk",
  ]);
  const caseFeature = findFeature(caseComponent.profile, [
    "max gpu length",
    "maximum gpu length",
    "vga length",
    "ekran karti uzunlugu",
    "gpu clearance",
  ]);
  const gpuLength = gpuFeature ? parseLengthMm(gpuFeature) : undefined;
  const maxGpuLength = caseFeature ? parseLengthMm(caseFeature) : undefined;

  if (gpuLength === undefined || maxGpuLength === undefined) {
    return reviewMissing(
      "gpu-case-clearance",
      "GPU_CASE_CLEARANCE_EVIDENCE_MISSING",
      "GPU length and case maximum GPU clearance must both be evidenced.",
      refs(gpu, gpuFeature, caseComponent, caseFeature),
    );
  }

  if (gpuLength > maxGpuLength) {
    return {
      ruleId: "gpu-case-clearance",
      status: "FAIL",
      code: "GPU_CASE_CLEARANCE_EXCEEDED",
      message: `GPU length ${gpuLength} mm exceeds case clearance ${maxGpuLength} mm.`,
      evidenceRefs: refs(gpu, gpuFeature, caseComponent, caseFeature),
    };
  }

  return pass(
    "gpu-case-clearance",
    "GPU_CASE_CLEARANCE_OK",
    `GPU length ${gpuLength} mm fits within ${maxGpuLength} mm case clearance.`,
    refs(gpu, gpuFeature, caseComponent, caseFeature),
  );
}

function checkStorageInterface(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const storage = requiredComponent(components, "storage");
  const motherboard = requiredComponent(components, "motherboard");
  const storageFeature = findFeature(storage.profile, [
    "interface",
    "arayuz",
    "baglanti",
    "nvme",
    "sata",
    "m.2",
    "m2",
  ]);
  const boardFeature = findFeature(motherboard.profile, [
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
    : new Set<string>();

  if (!storageInterface || boardSupport.size === 0) {
    return reviewMissing(
      "storage-motherboard-interface",
      "STORAGE_INTERFACE_EVIDENCE_MISSING",
      "Storage interface and motherboard storage-interface support must both be evidenced.",
      refs(storage, storageFeature, motherboard, boardFeature),
    );
  }

  if (!storageInterfaceSupported(storageInterface, boardSupport)) {
    return {
      ruleId: "storage-motherboard-interface",
      status: "FAIL",
      code: "STORAGE_MOTHERBOARD_INTERFACE_MISMATCH",
      message: `Storage interface ${storageInterface} is not supported by motherboard evidence (${[...boardSupport].join(", ")}).`,
      evidenceRefs: refs(storage, storageFeature, motherboard, boardFeature),
    };
  }

  return pass(
    "storage-motherboard-interface",
    "STORAGE_MOTHERBOARD_INTERFACE_MATCH",
    `Storage interface ${storageInterface} is supported by the motherboard.`,
    refs(storage, storageFeature, motherboard, boardFeature),
  );
}

function checkGpuPsuCapacity(
  components: CompatibilityComponent[],
): CompatibilityCheck {
  const gpu = requiredComponent(components, "gpu");
  const psu = requiredComponent(components, "psu");
  const gpuRequirement = findFeature(gpu.profile, [
    "recommended psu",
    "recommended power supply",
    "onerilen psu",
    "onerilen guc kaynagi",
    "power supply recommendation",
  ]);
  const psuCapacity = findFeature(psu.profile, [
    "watt",
    "power",
    "guc",
    "capacity",
    "toplam guc",
  ]);
  const requiredWatts = gpuRequirement ? parseWatts(gpuRequirement) : undefined;
  const availableWatts = psuCapacity ? parseWatts(psuCapacity) : undefined;

  if (requiredWatts === undefined || availableWatts === undefined) {
    return reviewMissing(
      "gpu-psu-capacity",
      "GPU_PSU_CAPACITY_EVIDENCE_MISSING",
      "GPU recommended PSU capacity and PSU rated wattage must both be evidenced in V1.",
      refs(gpu, gpuRequirement, psu, psuCapacity),
    );
  }

  if (availableWatts < requiredWatts) {
    return {
      ruleId: "gpu-psu-capacity",
      status: "FAIL",
      code: "PSU_CAPACITY_BELOW_GPU_RECOMMENDATION",
      message: `PSU is ${availableWatts} W, below the GPU recommendation of ${requiredWatts} W.`,
      evidenceRefs: refs(gpu, gpuRequirement, psu, psuCapacity),
    };
  }

  return pass(
    "gpu-psu-capacity",
    "PSU_CAPACITY_MEETS_GPU_RECOMMENDATION",
    `PSU ${availableWatts} W meets the GPU recommendation of ${requiredWatts} W.`,
    refs(gpu, gpuRequirement, psu, psuCapacity),
  );
}

function requiredComponent(
  components: CompatibilityComponent[],
  category: CatalogCategory,
): CompatibilityComponent {
  const component = components.find(
    (candidate) => candidate.componentCategory === category,
  );
  if (!component) {
    throw new Error(`compatibility invariant failed: missing ${category}`);
  }
  return component;
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
  const normalized = normalize(text).replace(/\s+/g, "");
  const match = normalized.match(/(?:^|[^a-z0-9])(am4|am5|tr4|strx4|lga\d{3,4})(?:$|[^a-z0-9])/i);
  return match?.[1]?.toUpperCase();
}

function parseDdr(text: string): string | undefined {
  return parseAllDdr(text)[0];
}

function parseAllDdr(text: string): string[] {
  const matches = normalize(text).match(/ddr\s*[345]/gi) ?? [];
  return [...new Set(matches.map((match) => match.replace(/\s+/g, "").toUpperCase()))];
}

function parseFormFactors(text: string): string[] {
  const normalized = normalize(text);
  const factors: string[] = [];
  if (/(micro\s*-?\s*atx|m\s*-?\s*atx|matx)/i.test(normalized)) {
    factors.push("MICRO_ATX");
  }
  if (/(mini\s*-?\s*itx)/i.test(normalized)) {
    factors.push("MINI_ITX");
  }
  const withoutSpecific = normalized
    .replace(/micro\s*-?\s*atx|m\s*-?\s*atx|matx/gi, " ")
    .replace(/mini\s*-?\s*itx/gi, " ");
  if (/(^|[^a-z])atx([^a-z]|$)/i.test(withoutSpecific)) {
    factors.push("ATX");
  }
  if (/(^|[^a-z])eatx([^a-z]|$)|extended\s+atx/i.test(normalized)) {
    factors.push("EATX");
  }
  return [...new Set(factors)];
}

function parseLengthMm(feature: ProductFeature): number | undefined {
  if (typeof feature.value === "number") {
    const unit = normalize(feature.unit ?? "mm");
    if (unit === "mm") return feature.value;
    if (unit === "cm") return feature.value * 10;
  }

  const text = normalize(featureText(feature));
  const mm = text.match(/(\d+(?:[.,]\d+)?)\s*mm/i);
  if (mm?.[1]) return Number(mm[1].replace(",", "."));
  const cm = text.match(/(\d+(?:[.,]\d+)?)\s*cm/i);
  if (cm?.[1]) return Number(cm[1].replace(",", ".")) * 10;
  return undefined;
}

function parseStorageInterface(text: string): "NVME" | "M2_SATA" | "SATA" | undefined {
  const normalized = normalize(text);
  if (/nvme|m\.?2.*pcie|pcie.*m\.?2/i.test(normalized)) return "NVME";
  if (/m\.?2.*sata|sata.*m\.?2/i.test(normalized)) return "M2_SATA";
  if (/sata/i.test(normalized)) return "SATA";
  return undefined;
}

function parseStorageSupport(text: string): Set<string> {
  const normalized = normalize(text);
  const support = new Set<string>();
  if (/nvme|m\.?2.*pcie|pcie.*m\.?2/i.test(normalized)) support.add("NVME");
  if (/m\.?2.*sata|sata.*m\.?2/i.test(normalized)) support.add("M2_SATA");
  if (/sata/i.test(normalized)) support.add("SATA");
  if (/m\.?2/i.test(normalized)) support.add("M2_SLOT");
  return support;
}

function storageInterfaceSupported(
  storageInterface: "NVME" | "M2_SATA" | "SATA",
  boardSupport: Set<string>,
): boolean {
  if (boardSupport.has(storageInterface)) return true;
  if (storageInterface === "NVME" && boardSupport.has("M2_SLOT")) {
    return false;
  }
  return false;
}

function parseWatts(feature: ProductFeature): number | undefined {
  if (typeof feature.value === "number" && normalize(feature.unit ?? "") === "w") {
    return feature.value;
  }
  const match = normalize(featureText(feature)).match(/(\d+(?:[.,]\d+)?)\s*w(?:att)?\b/i);
  return match?.[1] ? Number(match[1].replace(",", ".")) : undefined;
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
  component: CompatibilityComponent,
  feature: ProductFeature | undefined,
): CompatibilityEvidenceRef {
  return {
    catalogProductId: component.catalogProductId,
    profileId: component.profile.profileId,
    featureKey: feature?.key,
    sourceRefIds: [...(feature?.sourceRefIds ?? [])],
  };
}

function componentRef(
  component: CompatibilityComponent,
): CompatibilityEvidenceRef {
  return {
    catalogProductId: component.catalogProductId,
    profileId: component.profile.profileId,
    sourceRefIds: component.profile.evidence.map((evidence) => evidence.evidenceId),
  };
}

function pass(
  ruleId: CompatibilityCheck["ruleId"],
  code: string,
  message: string,
  evidenceRefs: CompatibilityEvidenceRef[],
): CompatibilityCheck {
  return { ruleId, status: "PASS", code, message, evidenceRefs };
}

function reviewMissing(
  ruleId: CompatibilityCheck["ruleId"],
  code: string,
  message: string,
  evidenceRefs: CompatibilityEvidenceRef[],
): CompatibilityCheck {
  return { ruleId, status: "REVIEW_REQUIRED", code, message, evidenceRefs };
}

function finalize(checks: CompatibilityCheck[]): CompatibilityResult {
  const firstBlockingCheck = checks.find((check) => check.status !== "PASS");
  const status: CompatibilityStatus = checks.some((check) => check.status === "FAIL")
    ? "FAIL"
    : checks.some((check) => check.status === "REVIEW_REQUIRED")
      ? "REVIEW_REQUIRED"
      : "PASS";
  return {
    policyVersion: COMPATIBILITY_POLICY_VERSION,
    status,
    checks,
    firstBlockingCheck,
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
