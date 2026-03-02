/**
 * API Route: /api/settings/github-status
 *
 * GET — Check GitHub App connection status
 * Returns: { connected: boolean, repository?: string, error?: string }
 */
import { requireAuth, authErrorResponse } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/roles";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!hasPermission(session.user.role, "settings:read")) {
      return Response.json(
        { error: "Forbidden: missing permission settings:read" },
        { status: 403 }
      );
    }
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    // Check if GitHub App env vars are configured
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_INSTALLATION_ID;
    const repository = process.env.GITHUB_REPOSITORY;

    if (!appId || !privateKey || !installationId) {
      return Response.json({
        connected: false,
        error:
          "GitHub App not configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_INSTALLATION_ID.",
      });
    }

    // Try to import and initialize Octokit to verify the connection
    const { getOctokit, getRepoInfo } = await import(
      "@/lib/github/app-auth"
    );

    const octokit = getOctokit();
    const repoInfo = getRepoInfo();

    // Make a simple API call to verify the connection
    await octokit.rest.repos.get({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    });

    return Response.json({
      connected: true,
      repository: repository || `${repoInfo.owner}/${repoInfo.repo}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({
      connected: false,
      error: message,
    });
  }
}
