/**
 * LINE OAuth Provider for NextAuth.js v5.
 *
 * LINE Login uses custom endpoints (not standard OAuth discovery):
 * - Authorization: https://access.line.me/oauth2/v2.1/authorize
 * - Token: https://api.line.me/oauth2/v2.1/token
 * - UserInfo: https://api.line.me/v2/profile
 *
 * Note: LINE Login email scope requires additional channel permission.
 * Callback URL must use HTTPS (provided by Nginx Proxy Manager).
 */

import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default function LineProvider<P extends LineProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "line",
    name: "LINE",
    type: "oauth",
    checks: ["state"],
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: {
        scope: "profile",
        response_type: "code",
      },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    userinfo: "https://api.line.me/v2/profile",
    profile(profile) {
      return {
        id: profile.userId,
        name: profile.displayName,
        image: profile.pictureUrl,
        email: `${profile.userId}@line.local`, // LINE doesn't provide email by default; placeholder for DB NOT NULL constraint
      };
    },
    style: {
      bg: "#00C300",
      text: "#fff",
    },
    options,
  };
}
