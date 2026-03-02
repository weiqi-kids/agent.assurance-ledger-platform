/**
 * API Route: /api/settings/ai-providers/[providerId]
 *
 * GET    — Get a single AI provider
 * PATCH  — Update an AI provider
 * DELETE — Delete an AI provider
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { aiProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidateProviderCache } from "@/lib/ai/provider-registry";

const VALID_PROVIDER_TYPES = ["anthropic", "openai", "google"];

type RouteContext = { params: Promise<{ providerId: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { providerId } = await context.params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const rows = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    if (rows.length === 0) {
      return Response.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return Response.json({ provider: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { providerId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      providerType?: string;
      model?: string;
      apiEndpoint?: string | null;
      enabled?: boolean;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    // Check exists
    const existing = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    if (existing.length === 0) {
      return Response.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Validate providerType if provided
    if (body.providerType && !VALID_PROVIDER_TYPES.includes(body.providerType)) {
      return Response.json(
        {
          error: `Provider type must be one of: ${VALID_PROVIDER_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.providerType !== undefined)
      updateData.providerType = body.providerType;
    if (body.model !== undefined) updateData.model = body.model.trim();
    if (body.apiEndpoint !== undefined)
      updateData.apiEndpoint = body.apiEndpoint?.trim() || null;
    if (body.enabled !== undefined) updateData.enabled = body.enabled ? 1 : 0;

    await db
      .update(aiProviders)
      .set(updateData)
      .where(eq(aiProviders.id, providerId));

    invalidateProviderCache();

    // Fetch the updated record
    const updated = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    return Response.json({ provider: updated[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { providerId } = await context.params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const existing = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    if (existing.length === 0) {
      return Response.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    await db.delete(aiProviders).where(eq(aiProviders.id, providerId));

    invalidateProviderCache();

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
