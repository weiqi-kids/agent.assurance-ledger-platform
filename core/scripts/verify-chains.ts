/**
 * CLI Script: Verify Hash Chains
 *
 * Scans ledger/cases/ for all tenant/case directories and verifies
 * hash chain integrity for each events.jsonl file.
 *
 * Usage: npx tsx core/scripts/verify-chains.ts
 * Run from: core/web/ directory (for DB access) or project root
 * Exit: 0 if all chains valid, 1 if any failures
 */
import * as fs from "fs";
import * as path from "path";
import { verifyHashChain, GENESIS_HASH } from "../lib/hash";

interface ChainResult {
  tenantId: string;
  caseId: string;
  eventCount: number;
  valid: boolean;
  error?: string;
}

function readEventsFromFile(
  filePath: string
): Array<Record<string, unknown>> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8").trimEnd();
  if (!content) {
    return [];
  }

  return content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function scanCases(ledgerCasesDir: string): Array<{ tenantId: string; caseId: string }> {
  const results: Array<{ tenantId: string; caseId: string }> = [];

  if (!fs.existsSync(ledgerCasesDir)) {
    return results;
  }

  const tenantDirs = fs
    .readdirSync(ledgerCasesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."));

  for (const tenantDir of tenantDirs) {
    const tenantPath = path.join(ledgerCasesDir, tenantDir.name);
    const caseDirs = fs
      .readdirSync(tenantPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."));

    for (const caseDir of caseDirs) {
      results.push({
        tenantId: tenantDir.name,
        caseId: caseDir.name,
      });
    }
  }

  return results;
}

function verifyCase(
  ledgerCasesDir: string,
  tenantId: string,
  caseId: string
): ChainResult {
  const eventsPath = path.join(
    ledgerCasesDir,
    tenantId,
    caseId,
    "events.jsonl"
  );
  const events = readEventsFromFile(eventsPath);

  if (events.length === 0) {
    return { tenantId, caseId, eventCount: 0, valid: true };
  }

  // Check genesis
  const firstEvent = events[0];
  if (firstEvent.prev_hash !== GENESIS_HASH) {
    return {
      tenantId,
      caseId,
      eventCount: events.length,
      valid: false,
      error: `First event does not start from GENESIS_HASH. Got "${firstEvent.prev_hash}"`,
    };
  }

  const result = verifyHashChain(events);

  if (result.valid) {
    return { tenantId, caseId, eventCount: events.length, valid: true };
  }

  return {
    tenantId,
    caseId,
    eventCount: events.length,
    valid: false,
    error: result.error,
  };
}

function main(): void {
  // Resolve project root (script is at core/scripts/)
  const projectRoot = path.resolve(__dirname, "..", "..");
  const ledgerCasesDir = path.join(projectRoot, "ledger", "cases");

  console.log("Hash Chain Verification");
  console.log(`Scanning: ${ledgerCasesDir}`);
  console.log("---");

  const cases = scanCases(ledgerCasesDir);

  if (cases.length === 0) {
    console.log("No cases found in ledger. Nothing to verify.");
    process.exit(0);
  }

  console.log(`Found ${cases.length} case(s) to verify`);
  console.log("");

  const results: ChainResult[] = [];
  let failures = 0;

  for (const { tenantId, caseId } of cases) {
    const result = verifyCase(ledgerCasesDir, tenantId, caseId);
    results.push(result);

    if (result.valid) {
      console.log(
        `  OK: ${tenantId}/${caseId} (${result.eventCount} events)`
      );
    } else {
      failures++;
      console.error(
        `  FAIL: ${tenantId}/${caseId} (${result.eventCount} events)`
      );
      console.error(`        ${result.error}`);
    }
  }

  console.log("");
  console.log("---");
  console.log(`Total cases: ${results.length}`);
  console.log(`Verified OK: ${results.length - failures}`);
  console.log(`Failures: ${failures}`);

  if (failures > 0) {
    process.exit(1);
  }

  console.log("\nAll hash chains verified successfully.");
  process.exit(0);
}

main();
