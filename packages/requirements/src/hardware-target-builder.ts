import type {
  HardwareTarget,
  OfficialSourceRecord,
  SoftwareRequirementProfile,
} from "./index.js";

export type HardwareTargetPolicy = "recommendedAggregateV1";

export type HardwareTargetBuildIssue = {
  code: string;
  component?: "cpu" | "memory" | "gpu" | "storage";
  requirementId?: string;
  field?: string;
  message: string;
};

export type HardwareTargetBuildResult = {
  policy: HardwareTargetPolicy;
  targets: HardwareTarget[];
  issues: HardwareTargetBuildIssue[];
  readiness: "ready" | "reviewRequired" | "blocked";
};

type NumericEvidence = {
  value: number;
  sourceId: string;
  requirementId: string;
  field: string;
};

type CpuConstraint = {
  clockGhz?: NumericEvidence;
  cores?: NumericEvidence;
};

type GpuConstraint = {
  vramGb?: NumericEvidence;
  directX?: NumericEvidence;
};

export function buildHardwareTargets(args: {
  sources: OfficialSourceRecord[];
  profiles: SoftwareRequirementProfile[];
  policy?: HardwareTargetPolicy;
}): HardwareTargetBuildResult {
  const policy = args.policy ?? "recommendedAggregateV1";
  const issues: HardwareTargetBuildIssue[] = [];
  const officialSourceIds = new Set(
    args.sources
      .filter((source) => source.trustState === "official")
      .map((source) => source.sourceId),
  );

  if (args.profiles.length === 0) {
    return {
      policy,
      targets: [],
      issues: [
        {
          code: "NO_READY_REQUIREMENT_PROFILES",
          message: "at least one ready software requirement profile is required",
        },
      ],
      readiness: "reviewRequired",
    };
  }

  const eligibleProfiles: SoftwareRequirementProfile[] = [];
  for (const profile of args.profiles) {
    if (profile.qualityState !== "ready") {
      issues.push({
        code: "REQUIREMENT_PROFILE_NOT_READY",
        requirementId: profile.requirementId,
        message: `${profile.requirementId} is not ready for target derivation`,
      });
      continue;
    }
    if (!officialSourceIds.has(profile.sourceId)) {
      issues.push({
        code: "REQUIREMENT_PROFILE_SOURCE_NOT_OFFICIAL",
        requirementId: profile.requirementId,
        message: `${profile.requirementId} is not backed by an official source record`,
      });
      continue;
    }
    eligibleProfiles.push(profile);
  }

  if (eligibleProfiles.length !== args.profiles.length) {
    return { policy, targets: [], issues, readiness: "blocked" };
  }

  const cpuConstraints: CpuConstraint[] = [];
  const memoryCandidates: NumericEvidence[] = [];
  const gpuConstraints: GpuConstraint[] = [];
  const storageCandidates: NumericEvidence[] = [];

  for (const profile of eligibleProfiles) {
    const cpuField = preferredField(profile, "cpu");
    if (cpuField) {
      const clock = parseClockGhz(cpuField.value);
      const cores = parseCoreCount(cpuField.value);
      const cpuConstraint: CpuConstraint = {};
      if (clock !== undefined) {
        cpuConstraint.clockGhz = evidence(clock, profile, cpuField.path);
      }
      if (cores !== undefined) {
        cpuConstraint.cores = evidence(cores, profile, cpuField.path);
      }
      if (clock === undefined && cores === undefined) {
        issues.push({
          code: "CPU_REQUIREMENT_UNPARSEABLE",
          component: "cpu",
          requirementId: profile.requirementId,
          field: cpuField.path,
          message: `could not normalize CPU requirement: ${cpuField.value}`,
        });
      } else {
        cpuConstraints.push(cpuConstraint);
      }
    }

    const ramField = preferredField(profile, "ram");
    if (ramField) {
      const ramGb = parseCapacityGb(ramField.value);
      if (ramGb === undefined) {
        issues.push({
          code: "MEMORY_REQUIREMENT_UNPARSEABLE",
          component: "memory",
          requirementId: profile.requirementId,
          field: ramField.path,
          message: `could not normalize memory requirement: ${ramField.value}`,
        });
      } else {
        memoryCandidates.push(evidence(ramGb, profile, ramField.path));
      }
    }

    const gpuField = preferredField(profile, "gpu");
    if (gpuField) {
      const vramGb = parseGpuVramGb(gpuField.value);
      const directX = parseDirectXVersion(gpuField.value);
      const gpuConstraint: GpuConstraint = {};
      if (vramGb !== undefined) {
        gpuConstraint.vramGb = evidence(vramGb, profile, gpuField.path);
      }
      if (directX !== undefined) {
        gpuConstraint.directX = evidence(directX, profile, gpuField.path);
      }
      if (vramGb === undefined && directX === undefined) {
        issues.push({
          code: "GPU_REQUIREMENT_UNPARSEABLE",
          component: "gpu",
          requirementId: profile.requirementId,
          field: gpuField.path,
          message: `could not normalize GPU requirement: ${gpuField.value}`,
        });
      } else {
        gpuConstraints.push(gpuConstraint);
      }
    }

    const storageField = preferredField(profile, "storage");
    if (storageField) {
      const storageGb = parseCapacityGb(storageField.value);
      if (storageGb === undefined) {
        issues.push({
          code: "STORAGE_REQUIREMENT_UNPARSEABLE",
          component: "storage",
          requirementId: profile.requirementId,
          field: storageField.path,
          message: `could not normalize storage requirement: ${storageField.value}`,
        });
      } else {
        storageCandidates.push(evidence(storageGb, profile, storageField.path));
      }
    }
  }

  const targets: HardwareTarget[] = [];

  const strongestClock = maxEvidence(
    cpuConstraints.flatMap((constraint) =>
      constraint.clockGhz ? [constraint.clockGhz] : [],
    ),
  );
  const strongestCores = maxEvidence(
    cpuConstraints.flatMap((constraint) =>
      constraint.cores ? [constraint.cores] : [],
    ),
  );
  if (strongestClock || strongestCores) {
    const parts: string[] = [];
    if (strongestClock) parts.push(`${formatNumber(strongestClock.value)}+ GHz`);
    if (strongestCores) parts.push(`at least ${formatNumber(strongestCores.value)} cores`);
    targets.push({
      targetId: "hardware-target-cpu",
      component: "cpu",
      target: parts.join(", "),
      reason:
        "Strongest normalized official CPU requirement across selected workloads; no extra performance headroom applied.",
      policy,
      evidence: uniqueEvidenceRefs([strongestClock, strongestCores]),
      state: "ready",
    });
  }

  const strongestMemory = maxEvidence(memoryCandidates);
  if (strongestMemory) {
    targets.push({
      targetId: "hardware-target-memory",
      component: "memory",
      target: `${formatNumber(strongestMemory.value)} GB RAM or more`,
      reason:
        "Highest official recommended memory requirement across selected workloads, falling back to minimum when no recommended field exists.",
      policy,
      evidence: uniqueEvidenceRefs([strongestMemory]),
      state: "ready",
    });
  }

  const strongestVram = maxEvidence(
    gpuConstraints.flatMap((constraint) =>
      constraint.vramGb ? [constraint.vramGb] : [],
    ),
  );
  const strongestDirectX = maxEvidence(
    gpuConstraints.flatMap((constraint) =>
      constraint.directX ? [constraint.directX] : [],
    ),
  );
  if (strongestVram || strongestDirectX) {
    const parts: string[] = [];
    if (strongestVram) parts.push(`${formatNumber(strongestVram.value)} GB VRAM or more`);
    if (strongestDirectX) parts.push(`DirectX ${formatNumber(strongestDirectX.value)} compliant`);
    targets.push({
      targetId: "hardware-target-gpu",
      component: "gpu",
      target: parts.join(", "),
      reason:
        "Strongest normalized official GPU requirement across selected workloads; product performance ranking is a later selection concern.",
      policy,
      evidence: uniqueEvidenceRefs([strongestVram, strongestDirectX]),
      state: "ready",
    });
  }

  if (storageCandidates.length > 0) {
    const totalStorageGb = storageCandidates.reduce(
      (sum, candidate) => sum + candidate.value,
      0,
    );
    targets.push({
      targetId: "hardware-target-storage-app-space",
      component: "storage",
      target: `${formatNumber(totalStorageGb)} GB application space minimum`,
      reason:
        "Sum of official application installation-space requirements. OS, user-data and free-space headroom are intentionally not added by this baseline policy.",
      policy,
      evidence: uniqueEvidenceRefs(storageCandidates),
      state: "ready",
    });
  }

  return {
    policy,
    targets,
    issues,
    readiness: issues.length > 0 ? "reviewRequired" : "ready",
  };
}

function preferredField(
  profile: SoftwareRequirementProfile,
  key: "cpu" | "ram" | "gpu" | "storage",
): { path: string; value: string } | undefined {
  const recommended = profile.recommended[key];
  if (typeof recommended === "string" && recommended.trim().length > 0) {
    return { path: `recommended.${key}`, value: recommended };
  }
  const minimum = profile.minimum[key];
  if (typeof minimum === "string" && minimum.trim().length > 0) {
    return { path: `minimum.${key}`, value: minimum };
  }
  return undefined;
}

function evidence(
  value: number,
  profile: SoftwareRequirementProfile,
  field: string,
): NumericEvidence {
  return {
    value,
    sourceId: profile.sourceId,
    requirementId: profile.requirementId,
    field,
  };
}

function parseClockGhz(value: string): number | undefined {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*(?:\+\s*)?ghz/i);
  if (!match?.[1]) return undefined;
  return Number(match[1].replace(",", "."));
}

function parseCoreCount(value: string): number | undefined {
  const match = value.match(/(\d+)\s*[- ]?core/i);
  if (!match?.[1]) return undefined;
  return Number(match[1]);
}

function parseCapacityGb(value: string): number | undefined {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*gb\b/i);
  if (!match?.[1]) return undefined;
  return Number(match[1].replace(",", "."));
}

function parseGpuVramGb(value: string): number | undefined {
  return parseCapacityGb(value);
}

function parseDirectXVersion(value: string): number | undefined {
  const match = value.match(/directx\s*(\d+(?:[.,]\d+)?)/i);
  if (!match?.[1]) return undefined;
  return Number(match[1].replace(",", "."));
}

function maxEvidence(values: NumericEvidence[]): NumericEvidence | undefined {
  return values.reduce<NumericEvidence | undefined>((current, candidate) => {
    if (!current || candidate.value > current.value) return candidate;
    return current;
  }, undefined);
}

function uniqueEvidenceRefs(
  values: Array<NumericEvidence | undefined>,
): HardwareTarget["evidence"] {
  const refs = values
    .filter((value): value is NumericEvidence => Boolean(value))
    .map((value) => ({
      sourceId: value.sourceId,
      requirementId: value.requirementId,
      field: value.field,
    }));
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.sourceId}|${ref.requirementId}|${ref.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}
