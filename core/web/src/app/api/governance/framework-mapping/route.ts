import { requirePermission, authErrorResponse } from "@/lib/auth/guard";

interface FrameworkMapping {
  controlId: string;
  domain: string;
  soc1Objective: string;
  isqm1Paragraph: string;
  iso9001Clause: string;
  explanation: string;
}

const DOMAIN_FRAMEWORK: Record<
  string,
  {
    soc1Objective: string;
    isqm1Paragraph: string;
    iso9001Clause: string;
  }
> = {
  AC: {
    soc1Objective: "OBJ-AC (Logical Access)",
    isqm1Paragraph: "RES (Resources)",
    iso9001Clause: "7.1",
  },
  CM: {
    soc1Objective: "OBJ-CM (Change Management)",
    isqm1Paragraph: "INFO (Information)",
    iso9001Clause: "8.1",
  },
  PI: {
    soc1Objective: "OBJ-PI (Processing Integrity)",
    isqm1Paragraph: "RISK (Risk Assessment)",
    iso9001Clause: "8.5",
  },
  CF: {
    soc1Objective: "OBJ-BR (Backup & Recovery)",
    isqm1Paragraph: "RES (Resources)",
    iso9001Clause: "7.1",
  },
  IR: {
    soc1Objective: "OBJ-MN (Monitoring)",
    isqm1Paragraph: "MON (Monitoring)",
    iso9001Clause: "10.2",
  },
  MN: {
    soc1Objective: "OBJ-MN (Monitoring)",
    isqm1Paragraph: "MON (Monitoring)",
    iso9001Clause: "9.1",
  },
};

const CONTROL_EXPLANATIONS: Record<string, string> = {
  "AC-001":
    "OAuth-based authentication maps to logical access objectives under SOC1, resource management under ISQM1, and infrastructure support under ISO 9001.",
  "AC-002":
    "Role-based access control directly supports logical access controls for SOC1, resource allocation under ISQM1, and organizational support under ISO 9001.",
  "AC-003":
    "Approval restrictions ensure segregation of duties for SOC1 logical access, proper resource governance under ISQM1, and controlled operations under ISO 9001.",
  "AC-004":
    "Evidence signing restrictions support SOC1 logical access integrity, ISQM1 resource controls, and ISO 9001 infrastructure requirements.",
  "AC-005":
    "Periodic access reviews validate ongoing logical access compliance for SOC1, resource adequacy for ISQM1, and support infrastructure for ISO 9001.",
  "CM-001":
    "PR review requirements map to SOC1 change management objectives, ISQM1 information system controls, and ISO 9001 operational planning.",
  "CM-002":
    "GPG-signed commits ensure code provenance for SOC1 change management, information integrity under ISQM1, and controlled operations under ISO 9001.",
  "CM-003":
    "Schema change governance aligns with SOC1 change management, ISQM1 information system requirements, and ISO 9001 operational planning controls.",
  "CM-004":
    "CI pipeline validation supports SOC1 change management objectives, ISQM1 information quality, and ISO 9001 operational planning and control.",
  "CM-005":
    "Signed release tags provide SOC1 change provenance, ISQM1 information traceability, and ISO 9001 operational control evidence.",
  "PI-001":
    "Hash-chained ledger events ensure SOC1 processing integrity, ISQM1 risk mitigation through tamper-evidence, and ISO 9001 production traceability.",
  "PI-002":
    "Single-writer mutex prevents SOC1 processing integrity failures, mitigates ISQM1 concurrent access risks, and ensures ISO 9001 production control.",
  "PI-003":
    "Deterministic sampling supports SOC1 processing integrity validation, ISQM1 risk assessment reproducibility, and ISO 9001 measurement traceability.",
  "PI-004":
    "Deterministic evidence packs ensure SOC1 output integrity, ISQM1 risk assessment reliability, and ISO 9001 production and service provision control.",
  "PI-005":
    "RFC 8785 canonicalization ensures SOC1 consistent processing, ISQM1 risk assessment data integrity, and ISO 9001 production control standardization.",
  "CF-001":
    "Environment variable management supports SOC1 backup and recovery preparedness, ISQM1 resource documentation, and ISO 9001 infrastructure support.",
  "CF-002":
    "Version-controlled migrations ensure SOC1 recovery capability, ISQM1 resource traceability, and ISO 9001 infrastructure change control.",
  "CF-003":
    "PM2 config version control supports SOC1 recovery reproducibility, ISQM1 resource documentation, and ISO 9001 infrastructure management.",
  "CF-004":
    "Auto-renewed SSL certificates ensure SOC1 system availability, ISQM1 resource continuity, and ISO 9001 infrastructure reliability.",
  "CF-005":
    "Lockfile validation ensures SOC1 build reproducibility, ISQM1 resource integrity, and ISO 9001 infrastructure supply chain control.",
  "IR-001":
    "Automated conflict incident creation supports SOC1 monitoring objectives, ISQM1 monitoring requirements, and ISO 9001 nonconformity management.",
  "IR-002":
    "Projection failure tracking supports SOC1 monitoring objectives, ISQM1 monitoring and remediation, and ISO 9001 nonconformity and corrective action.",
  "IR-003":
    "24-hour P1 reporting aligns with SOC1 monitoring timeliness, ISQM1 monitoring responsiveness, and ISO 9001 nonconformity management requirements.",
  "IR-004":
    "Post-mortem findings tracking supports SOC1 monitoring improvement, ISQM1 monitoring effectiveness, and ISO 9001 corrective action processes.",
  "IR-005":
    "Complaint management supports SOC1 monitoring scope, ISQM1 monitoring of client feedback, and ISO 9001 nonconformity tracking and resolution.",
  "MN-001":
    "Daily hash verification supports SOC1 continuous monitoring, ISQM1 monitoring of system integrity, and ISO 9001 performance monitoring.",
  "MN-002":
    "KRI threshold monitoring supports SOC1 monitoring objectives, ISQM1 proactive monitoring, and ISO 9001 performance analysis and evaluation.",
  "MN-003":
    "Quarterly management review supports SOC1 monitoring oversight, ISQM1 monitoring governance, and ISO 9001 management review requirements.",
  "MN-004":
    "Document index governance supports SOC1 monitoring of documentation, ISQM1 information monitoring, and ISO 9001 performance measurement of document control.",
  "MN-005":
    "Subservice review supports SOC1 complementary subservice organization monitoring, ISQM1 monitoring of service providers, and ISO 9001 external provider evaluation.",
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

const FRAMEWORK_MAPPINGS: FrameworkMapping[] = CONTROL_IDS.map(
  ({ controlId, domain }) => ({
    controlId,
    domain,
    ...DOMAIN_FRAMEWORK[domain],
    explanation: CONTROL_EXPLANATIONS[controlId],
  })
);

export async function GET() {
  try {
    await requirePermission("governance:read");
  } catch (error) {
    return authErrorResponse(error);
  }

  return Response.json({ mappings: FRAMEWORK_MAPPINGS });
}
