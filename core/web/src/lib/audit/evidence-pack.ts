/**
 * Evidence Pack Generator.
 *
 * Generates deterministic ZIP archives for audit evidence:
 * - Files sorted lexicographically by path
 * - Fixed compression (deflate level 6)
 * - No OS-specific metadata or timestamps (epoch: 1980-01-01)
 * - Manifest.json generated first, then included in ZIP
 * - pack_hash = SHA256(zip_bytes) computed after ZIP creation
 */

import archiver from "archiver";
import { computeSHA256, computeFileHash } from "../../../../lib/hash";

// Fixed epoch date for deterministic ZIP output.
// ZIP format minimum date is 1980-01-01T00:00:00.
const EPOCH_DATE = new Date(1980, 0, 1, 0, 0, 0);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvidenceFile {
  /** Relative path within the evidence pack (e.g. "artifacts/AC-001/evidence.pdf") */
  path: string;
  /** File content as Buffer */
  content: Buffer;
}

export interface ManifestEntry {
  path: string;
  hash: string;
  size: number;
}

export interface PackManifest {
  version: string;
  period: string;
  generatedAt: string;
  generatedBy: string;
  artifactCount: number;
  entries: ManifestEntry[];
}

export interface SigningInfo {
  signerIdentity: string;
  signedAt: string;
}

export interface EvidencePackResult {
  zipBuffer: Buffer;
  packHash: string;
  manifest: PackManifest;
  artifactCount: number;
}

// ---------------------------------------------------------------------------
// Manifest generation
// ---------------------------------------------------------------------------

/**
 * Generate the manifest for a set of evidence files.
 * Entries are sorted lexicographically by path.
 */
export function generateManifest(
  files: EvidenceFile[],
  metadata: {
    period: string;
    generatedAt: string;
    generatedBy: string;
  }
): PackManifest {
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  const entries: ManifestEntry[] = sortedFiles.map((file) => ({
    path: file.path,
    hash: computeFileHash(file.content),
    size: file.content.length,
  }));

  return {
    version: "1.0.0",
    period: metadata.period,
    generatedAt: metadata.generatedAt,
    generatedBy: metadata.generatedBy,
    artifactCount: sortedFiles.length,
    entries,
  };
}

// ---------------------------------------------------------------------------
// ZIP generation
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic evidence pack ZIP.
 *
 * 1. Sort files lexicographically by path
 * 2. Generate manifest.json
 * 3. Create ZIP with fixed compression and epoch dates
 * 4. Compute pack_hash = SHA256(zip_bytes)
 */
export async function generateEvidencePack(params: {
  files: EvidenceFile[];
  period: string;
  generatedAt: string;
  generatedBy: string;
}): Promise<EvidencePackResult> {
  const { files, period, generatedAt, generatedBy } = params;

  // Sort files lexicographically
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  // Generate manifest
  const manifest = generateManifest(files, {
    period,
    generatedAt,
    generatedBy,
  });

  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestBuffer = Buffer.from(manifestJson, "utf-8");

  // Create deterministic ZIP
  const zipBuffer = await createDeterministicZip(sortedFiles, manifestBuffer);

  // Compute pack hash
  const packHash = computeSHA256(zipBuffer);

  return {
    zipBuffer,
    packHash,
    manifest,
    artifactCount: sortedFiles.length,
  };
}

/**
 * Create a deterministic ZIP buffer from sorted files + manifest.
 */
async function createDeterministicZip(
  sortedFiles: EvidenceFile[],
  manifestBuffer: Buffer
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 6 },
      forceLocalTime: true,
    });

    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on("error", (err: Error) => {
      reject(err);
    });

    // Add manifest.json first
    archive.append(manifestBuffer, {
      name: "manifest.json",
      date: EPOCH_DATE,
    });

    // Add all files in lexicographic order
    for (const file of sortedFiles) {
      archive.append(file.content, {
        name: file.path,
        date: EPOCH_DATE,
      });
    }

    archive.finalize();
  });
}
