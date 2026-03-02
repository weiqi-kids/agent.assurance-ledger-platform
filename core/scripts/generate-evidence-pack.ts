/**
 * CLI Script: Generate Evidence Pack
 *
 * Collects all files from ledger/ and artifacts/ for a given audit period,
 * generates a manifest with file hashes, and prepares a deterministic ZIP.
 *
 * Usage: npx tsx core/scripts/generate-evidence-pack.ts --period 2025-Q1 --signer user-id
 * Run from: core/web/ directory
 * Exit: 0 on success, 1 on failure
 */
import * as fs from "fs";
import * as path from "path";
import { computeFileHash, computeSHA256 } from "../lib/hash";

interface ManifestEntry {
  path: string;
  hash: string;
  size: number;
}

interface EvidencePackManifest {
  period: string;
  signer: string;
  generated_at: string;
  files: ManifestEntry[];
  pack_hash: string;
}

function parseArgs(
  args: string[]
): { period: string; signer: string } {
  let period = "";
  let signer = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--period" && i + 1 < args.length) {
      period = args[i + 1];
      i++;
    } else if (args[i] === "--signer" && i + 1 < args.length) {
      signer = args[i + 1];
      i++;
    }
  }

  if (!period) {
    console.error("ERROR: --period is required (e.g. --period 2025-Q1)");
    process.exit(1);
  }
  if (!signer) {
    console.error("ERROR: --signer is required (e.g. --signer user-id)");
    process.exit(1);
  }

  return { period, signer };
}

function collectFiles(dir: string, basePath: string): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  if (!fs.existsSync(dir)) {
    return entries;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.join(basePath, item.name);

    if (item.isDirectory()) {
      entries.push(...collectFiles(fullPath, relativePath));
    } else if (item.isFile() && !item.name.startsWith(".")) {
      const content = fs.readFileSync(fullPath);
      const hash = computeFileHash(content);
      entries.push({
        path: relativePath,
        hash,
        size: content.length,
      });
    }
  }

  return entries;
}

function main(): void {
  const { period, signer } = parseArgs(process.argv.slice(2));

  // Resolve project root
  const projectRoot = path.resolve(__dirname, "..", "..");
  const ledgerDir = path.join(projectRoot, "ledger");
  const artifactsDir = path.join(projectRoot, "artifacts");
  const outputDir = path.join(ledgerDir, "audit", "evidence-packs");

  console.log("Evidence Pack Generation");
  console.log(`Period: ${period}`);
  console.log(`Signer: ${signer}`);
  console.log("---");

  // Collect files from ledger/ and artifacts/
  const ledgerFiles = collectFiles(ledgerDir, "ledger");
  const artifactFiles = collectFiles(artifactsDir, "artifacts");

  // Merge and sort lexicographically for determinism
  const allFiles = [...ledgerFiles, ...artifactFiles].sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  console.log(`Collected ${allFiles.length} files`);
  console.log(`  Ledger: ${ledgerFiles.length}`);
  console.log(`  Artifacts: ${artifactFiles.length}`);

  // Generate manifest
  const manifestContent = allFiles
    .map((f) => `${f.hash}  ${f.path}`)
    .join("\n");
  const packHash = computeSHA256(manifestContent);

  const manifest: EvidencePackManifest = {
    period,
    signer,
    generated_at: new Date().toISOString(),
    files: allFiles,
    pack_hash: packHash,
  };

  // Write manifest
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const manifestPath = path.join(outputDir, `manifest-${period}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  console.log("");
  console.log("---");
  console.log(`Manifest written to: ${manifestPath}`);
  console.log(`Pack hash: ${packHash}`);
  console.log(`Total files: ${allFiles.length}`);
  console.log(`Total size: ${allFiles.reduce((acc, f) => acc + f.size, 0)} bytes`);
  console.log("");
  console.log(
    "NOTE: Deterministic ZIP generation requires the evidence-pack library."
  );
  console.log(
    "      This script generates the manifest. ZIP creation is handled by the audit module."
  );

  process.exit(0);
}

main();
