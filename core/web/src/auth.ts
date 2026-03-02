import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import LineProvider from "@/lib/auth/line-provider";
import type { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    role?: Role;
    tenantId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      tenantId?: string | null;
    };
  }
}

function createAuth() {
  return NextAuth({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: DrizzleAdapter(getDb() as any, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      LineProvider({
        clientId: process.env.LINE_CHANNEL_ID,
        clientSecret: process.env.LINE_CHANNEL_SECRET,
      }),
    ],
    session: {
      strategy: "database",
    },
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id;
          session.user.role = (user.role as Role) ?? "viewer";
          session.user.tenantId = user.tenantId ?? null;
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  });
}

type AuthInstance = ReturnType<typeof NextAuth>;

// Lazy-initialize NextAuth to avoid calling getDb() at module evaluation time.
// During `next build`, modules are evaluated but DATABASE_URL may not be set.
let _authInstance: AuthInstance | null = null;

function getInstance(): AuthInstance {
  if (!_authInstance) {
    _authInstance = createAuth();
  }
  return _authInstance;
}

// If the database is configured at load time, initialize eagerly for runtime perf.
if (isDatabaseConfigured()) {
  _authInstance = createAuth();
}

// Lazy handler wrappers that forward to the singleton.
export const handlers: AuthInstance["handlers"] = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GET: ((...args: any[]) => (getInstance().handlers.GET as any)(...args)) as AuthInstance["handlers"]["GET"],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  POST: ((...args: any[]) => (getInstance().handlers.POST as any)(...args)) as AuthInstance["handlers"]["POST"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: AuthInstance["auth"] = ((...args: any[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getInstance().auth as any)(...args)) as AuthInstance["auth"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: AuthInstance["signIn"] = ((...args: any[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getInstance().signIn as any)(...args)) as AuthInstance["signIn"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: AuthInstance["signOut"] = ((...args: any[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getInstance().signOut as any)(...args)) as AuthInstance["signOut"];
