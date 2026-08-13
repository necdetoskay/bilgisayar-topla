import {
  type ProductFeature,
  type ProductFeatureProfile,
  type ValidationIssue,
  validateProductFeatureProfile,
} from "@bilgisayar-topla/shared-contracts";

export type SpecificationReadiness = "draftReady" | "reviewRequired" | "blocked";

export type DraftClause = {
  clauseId: string;
  featureKey: string;
  text: string;
  sourceRefIds: string[];
};

export type ComplianceFinding = {
  code: string;
  severity: "warning" | "blocked";
  message: string;
  clauseId?: string;
  featureKey?: string;
};

export type ComplianceReport = {
  readiness: SpecificationReadiness;
  findings: ComplianceFinding[];
  validationIssues: ValidationIssue[];
};

export type SpecificationDraft = {
  markdown: string;
  clauses: DraftClause[];
};

export type SpecificationResult = {
  readiness: SpecificationReadiness;
  draft?: SpecificationDraft;
  complianceReport: ComplianceReport;
};

const forbiddenTerms = [
  "intel",
  "amd",
  "nvidia",
  "rtx",
  "ryzen",
  "core i3",
  "core i5",
  "core i7",
  "core i9",
  "laserjet",
  "ecotank",
  "dell",
  "hp ",
  "epson",
];

export function generateSpecificationDraft(
  input: unknown,
): SpecificationResult {
  const validation = validateProductFeatureProfile(input);

  if (!validation.valid) {
    return {
      readiness: "blocked",
      complianceReport: {
        readiness: "blocked",
        findings: [
          {
            code: "invalid_product_feature_profile",
            severity: "blocked",
            message: "Specification generation requires a valid ProductFeatureProfile.",
          },
        ],
        validationIssues: validation.issues,
      },
    };
  }

  const profile = input as ProductFeatureProfile;
  const clauses = profile.features
    .filter((feature) => feature.clauseEligible)
    .map((feature, index) => featureToClause(feature, index + 1));

  const findings = clauses.flatMap((clause) => scanClause(clause));
  if (clauses.length === 0) {
    findings.push({
      code: "no_clause_eligible_features",
      severity: "blocked",
      message: "No clause-eligible product features were provided.",
    });
  }

  const readiness = findings.some((finding) => finding.severity === "blocked")
    ? "blocked"
    : findings.length > 0
      ? "reviewRequired"
      : "draftReady";

  return {
    readiness,
    draft: {
      markdown: renderMarkdown(profile, clauses),
      clauses,
    },
    complianceReport: {
      readiness,
      findings,
      validationIssues: validation.issues,
    },
  };
}

function featureToClause(feature: ProductFeature, index: number): DraftClause {
  const unit = feature.unit ? ` ${feature.unit}` : "";
  const value = `${feature.value}${unit}`;

  return {
    clauseId: `clause-${String(index).padStart(3, "0")}`,
    featureKey: feature.key,
    text: `${feature.label}: en az ${value} olacak sekilde saglanmalidir.`,
    sourceRefIds: feature.sourceRefIds,
  };
}

function renderMarkdown(
  profile: ProductFeatureProfile,
  clauses: DraftClause[],
): string {
  const lines = [
    "# Teknik Sartname Taslagi",
    "",
    `Urun kategorisi: ${profile.productCategory}`,
    "",
    "## Teknik Kriterler",
    "",
  ];

  for (const clause of clauses) {
    lines.push(`- ${clause.text}`);
  }

  lines.push("");
  lines.push("## Not");
  lines.push("");
  lines.push(
    "Bu belge taslaktir. Nihai kontrol ve onay kurum/idare tarafindan yapilmalidir.",
  );

  return lines.join("\n");
}

function scanClause(clause: DraftClause): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];
  const normalized = clause.text.toLocaleLowerCase("tr-TR");

  for (const term of forbiddenTerms) {
    if (normalized.includes(term)) {
      findings.push({
        code: "forbidden_brand_or_model_term",
        severity: "blocked",
        message: `Clause contains forbidden or risky product-locking term: ${term.trim()}.`,
        clauseId: clause.clauseId,
        featureKey: clause.featureKey,
      });
    }
  }

  if (/\b\d+([.,]\d+)?\s*ghz\b/i.test(clause.text)) {
    findings.push({
      code: "clock_speed_clause_risk",
      severity: "blocked",
      message: "Clock-speed based requirements are blocked for procurement clause output.",
      clauseId: clause.clauseId,
      featureKey: clause.featureKey,
    });
  }

  return findings;
}
