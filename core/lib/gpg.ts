/**
 * GPG signature verification utilities.
 *
 * Provides functions for verifying GPG signatures on git commits
 * and retrieving signed tag information.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { execSync } from "child_process";

export interface GpgVerificationResult {
  verified: boolean;
  signer?: string;
  error?: string;
}

/**
 * Verify the GPG signature of a git commit.
 *
 * Git signature status codes:
 * - G: Good signature
 * - U: Good signature with unknown validity
 * - B: Bad signature
 * - E: Cannot check (missing key)
 * - N: No signature
 * - X: Good signature, expired
 * - Y: Good signature, expired key
 * - R: Good signature, revoked key
 *
 * We accept G (good) and U (unknown trust but valid) as "verified".
 */
export function verifyGpgSignature(
  commitSha: string
): GpgVerificationResult {
  try {
    const result = execSync(
      `git log --format="%G? %GS" -1 ${commitSha}`,
      { encoding: "utf-8" }
    ).trim();
    const [status, ...signerParts] = result.split(" ");
    const signer = signerParts.join(" ");
    return {
      verified: status === "G" || status === "U",
      signer: signer || undefined,
    };
  } catch (err) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get the latest signed git tag matching `v*` pattern.
 * Returns null if no matching tag is found.
 */
export function getLatestSignedTag(): string | null {
  try {
    return execSync("git describe --tags --abbrev=0 --match='v*'", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}
