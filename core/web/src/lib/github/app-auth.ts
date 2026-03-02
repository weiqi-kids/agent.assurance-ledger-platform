/**
 * GitHub App authentication.
 *
 * Uses GitHub App private key to generate JWTs, then exchanges
 * for installation access tokens. This provides auditable, scoped access
 * unlike Personal Access Tokens (PATs).
 */
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

function getAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error(
      "Missing GitHub App configuration. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_INSTALLATION_ID."
    );
  }

  return {
    appId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    installationId: Number(installationId),
  };
}

let _octokit: Octokit | null = null;

/**
 * Get an authenticated Octokit instance using the GitHub App installation token.
 * The token is automatically refreshed by @octokit/auth-app when expired.
 */
export function getOctokit(): Octokit {
  if (_octokit) return _octokit;

  const config = getAppConfig();

  _octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.appId,
      privateKey: config.privateKey,
      installationId: config.installationId,
    },
  });

  return _octokit;
}

/**
 * Get the repository owner and name from env.
 */
export function getRepoInfo(): { owner: string; repo: string } {
  const fullName = process.env.GITHUB_REPOSITORY ?? "";
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error(
      'GITHUB_REPOSITORY must be set in format "owner/repo".'
    );
  }
  return { owner, repo };
}
