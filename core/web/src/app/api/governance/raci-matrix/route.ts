import { requirePermission, authErrorResponse } from "@/lib/auth/guard";

type RaciValue = "R" | "A" | "C" | "I" | "-";

interface RaciEntry {
  controlId: string;
  domain: string;
  roles: {
    "system-admin": RaciValue;
    "tech-lead": RaciValue;
    "quality-manager": RaciValue;
    "engagement-partner": RaciValue;
    auditor: RaciValue;
    viewer: RaciValue;
  };
}

// Domain-level RACI defaults
const DOMAIN_RACI: Record<string, RaciEntry["roles"]> = {
  AC: {
    "system-admin": "R",
    "tech-lead": "A",
    "quality-manager": "C",
    "engagement-partner": "I",
    auditor: "I",
    viewer: "-",
  },
  CM: {
    "system-admin": "C",
    "tech-lead": "R",
    "quality-manager": "A",
    "engagement-partner": "I",
    auditor: "I",
    viewer: "-",
  },
  PI: {
    "system-admin": "C",
    "tech-lead": "R",
    "quality-manager": "A",
    "engagement-partner": "I",
    auditor: "C",
    viewer: "-",
  },
  CF: {
    "system-admin": "R",
    "tech-lead": "A",
    "quality-manager": "C",
    "engagement-partner": "I",
    auditor: "I",
    viewer: "-",
  },
  IR: {
    "system-admin": "A",
    "tech-lead": "R",
    "quality-manager": "C",
    "engagement-partner": "I",
    auditor: "I",
    viewer: "-",
  },
  MN: {
    "system-admin": "C",
    "tech-lead": "C",
    "quality-manager": "R",
    "engagement-partner": "A",
    auditor: "C",
    viewer: "-",
  },
};

const CONTROL_IDS: { controlId: string; domain: string }[] = [
  { controlId: "AC-001", domain: "AC" },
  { controlId: "AC-002", domain: "AC" },
  { controlId: "AC-003", domain: "AC" },
  { controlId: "AC-004", domain: "AC" },
  { controlId: "AC-005", domain: "AC" },
  { controlId: "CM-001", domain: "CM" },
  { controlId: "CM-002", domain: "CM" },
  { controlId: "CM-003", domain: "CM" },
  { controlId: "CM-004", domain: "CM" },
  { controlId: "CM-005", domain: "CM" },
  { controlId: "PI-001", domain: "PI" },
  { controlId: "PI-002", domain: "PI" },
  { controlId: "PI-003", domain: "PI" },
  { controlId: "PI-004", domain: "PI" },
  { controlId: "PI-005", domain: "PI" },
  { controlId: "CF-001", domain: "CF" },
  { controlId: "CF-002", domain: "CF" },
  { controlId: "CF-003", domain: "CF" },
  { controlId: "CF-004", domain: "CF" },
  { controlId: "CF-005", domain: "CF" },
  { controlId: "IR-001", domain: "IR" },
  { controlId: "IR-002", domain: "IR" },
  { controlId: "IR-003", domain: "IR" },
  { controlId: "IR-004", domain: "IR" },
  { controlId: "IR-005", domain: "IR" },
  { controlId: "MN-001", domain: "MN" },
  { controlId: "MN-002", domain: "MN" },
  { controlId: "MN-003", domain: "MN" },
  { controlId: "MN-004", domain: "MN" },
  { controlId: "MN-005", domain: "MN" },
];

const RACI_MATRIX: RaciEntry[] = CONTROL_IDS.map(({ controlId, domain }) => ({
  controlId,
  domain,
  roles: DOMAIN_RACI[domain],
}));

export async function GET() {
  try {
    await requirePermission("governance:read");
  } catch (error) {
    return authErrorResponse(error);
  }

  return Response.json({ matrix: RACI_MATRIX });
}
