export type OfficialSourceQuery = {
  software: string;
  version?: string;
  edition?: string;
};

export type OfficialSourceRegistryEntry = {
  sourceId: string;
  softwareKey: string;
  aliases: string[];
  version?: string;
  edition?: string;
  vendor: string;
  url: string;
  allowedHosts: string[];
  language: string;
  scope: "exactVersion" | "productFamily";
};

export const OFFICIAL_SOURCE_REGISTRY: readonly OfficialSourceRegistryEntry[] = [
  {
    sourceId: "autodesk-autocad-2022-system-requirements",
    softwareKey: "autocad",
    aliases: ["autocad", "autodesk autocad"],
    version: "2022",
    vendor: "Autodesk",
    url: "https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/System-requirements-for-AutoCAD-2022-including-Specialized-Toolsets.html",
    allowedHosts: ["www.autodesk.com", "autodesk.com"],
    language: "en",
    scope: "exactVersion",
  },
  {
    sourceId: "microsoft-365-business-education-government-system-requirements",
    softwareKey: "microsoft365",
    aliases: [
      "microsoft 365",
      "office",
      "microsoft office",
      "office 365",
      "microsoft 365 apps",
    ],
    edition: "businessEducationGovernment",
    vendor: "Microsoft",
    url: "https://support.microsoft.com/en-us/office/system-requirements/system-requirements-for-microsoft-365-for-business-education-and-government-use",
    allowedHosts: ["support.microsoft.com"],
    language: "en",
    scope: "productFamily",
  },
  {
    sourceId: "microsoft-365-home-system-requirements",
    softwareKey: "microsoft365",
    aliases: [
      "microsoft 365",
      "office",
      "microsoft office",
      "office 365",
      "microsoft 365 apps",
    ],
    edition: "home",
    vendor: "Microsoft",
    url: "https://support.microsoft.com/en-US/office/system-requirements/system-requirements-for-microsoft-365-for-home-use",
    allowedHosts: ["support.microsoft.com"],
    language: "en",
    scope: "productFamily",
  },
] as const;

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function editionMatches(
  queryEdition: string | undefined,
  entryEdition: string | undefined,
): boolean {
  if (!queryEdition) {
    return true;
  }
  if (!entryEdition) {
    return false;
  }
  return normalize(queryEdition) === normalize(entryEdition);
}

function productFamilyVersionMatches(
  query: OfficialSourceQuery,
  entry: OfficialSourceRegistryEntry,
): boolean {
  if (entry.scope !== "productFamily" || entry.version) {
    return false;
  }

  const normalizedSoftware = normalize(query.software);
  const normalizedVersion = normalize(query.version ?? "");

  return (
    entry.softwareKey === "microsoft365" &&
    (normalizedSoftware.includes("365") || normalizedVersion === "365")
  );
}

export function findOfficialSourceCandidates(
  query: OfficialSourceQuery,
): OfficialSourceRegistryEntry[] {
  const normalizedSoftware = normalize(query.software);
  if (!normalizedSoftware) {
    return [];
  }

  const matchingSoftware = OFFICIAL_SOURCE_REGISTRY.filter((entry) =>
    entry.aliases.some((alias) => normalize(alias) === normalizedSoftware),
  ).filter((entry) => editionMatches(query.edition, entry.edition));

  if (query.version) {
    const normalizedVersion = normalize(query.version);
    const exactVersionMatches = matchingSoftware.filter(
      (entry) => entry.version && normalize(entry.version) === normalizedVersion,
    );

    if (exactVersionMatches.length > 0) {
      return exactVersionMatches.map(cloneEntry);
    }

    return matchingSoftware
      .filter((entry) => productFamilyVersionMatches(query, entry))
      .map(cloneEntry);
  }

  return matchingSoftware.map(cloneEntry);
}

function cloneEntry(entry: OfficialSourceRegistryEntry): OfficialSourceRegistryEntry {
  return {
    ...entry,
    aliases: [...entry.aliases],
    allowedHosts: [...entry.allowedHosts],
  };
}
