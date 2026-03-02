/**
 * CLI Script: Initialize Ledger Directory Structure
 *
 * Creates all required ledger directories and .gitkeep files.
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx core/scripts/init-ledger.ts
 * Run from: project root or any directory
 * Exit: 0 on success, 1 on failure
 */
import * as fs from "fs";
import * as path from "path";

const REQUIRED_DIRS = [
  "ledger/cases",
  "ledger/audit",
  "ledger/audit/sample-selection",
  "ledger/audit/evidence-packs",
  "ledger/audit/system-releases",
  "ledger/governance",
  "ledger/governance/controls",
  "ledger/governance/framework-mappings",
  "ledger/qms",
  "ledger/qms/documents",
  "ledger/qms/complaints",
  "artifacts",
];

function ensureDir(dirPath: string): boolean {
  if (fs.existsSync(dirPath)) {
    return false; // Already exists
  }
  fs.mkdirSync(dirPath, { recursive: true });
  return true; // Created
}

function ensureGitkeep(dirPath: string): void {
  const gitkeepPath = path.join(dirPath, ".gitkeep");
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, "", "utf-8");
  }
}

function main(): void {
  const projectRoot = path.resolve(__dirname, "..", "..");

  console.log("Ledger Directory Initialization");
  console.log(`Project root: ${projectRoot}`);
  console.log("---");

  let created = 0;
  let existing = 0;

  for (const relDir of REQUIRED_DIRS) {
    const fullPath = path.join(projectRoot, relDir);
    const isNew = ensureDir(fullPath);
    ensureGitkeep(fullPath);

    if (isNew) {
      console.log(`  CREATED: ${relDir}/`);
      created++;
    } else {
      console.log(`  EXISTS:  ${relDir}/`);
      existing++;
    }
  }

  console.log("");
  console.log("---");
  console.log(`Total directories: ${REQUIRED_DIRS.length}`);
  console.log(`Created: ${created}`);
  console.log(`Already existed: ${existing}`);
  console.log("");
  console.log("Ledger directory structure is ready.");

  process.exit(0);
}

main();
