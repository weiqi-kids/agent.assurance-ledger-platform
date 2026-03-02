/**
 * API Route: /api/settings/ai-providers
 *
 * GET  — List all AI providers
 * POST — Create a new AI provider
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { aiProviders } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { invalidateProviderCache } from "@/lib/ai/provider-registry";

const VALID_PROVIDER_TYPES = ["anthropic", "openai", "google"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const providers = await db.select().from(aiProviders);
    return Response.json({ providers });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      providerType?: string;
      model?: string;
      apiEndpoint?: string;
      enabled?: boolean;
    };

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return Response.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    if (
      !body.providerType ||
      !VALID_PROVIDER_TYPES.includes(body.providerType)
    ) {
      return Response.json(
        {
          error: `Provider type must be one of: ${VALID_PROVIDER_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!body.model || typeof body.model !== "string" || !body.model.trim()) {
      return Response.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(aiProviders).values({
      id,
      name: body.name.trim(),
      providerType: body.providerType,
      model: body.model.trim(),
      apiEndpoint: body.apiEndpoint?.trim() || null,
      enabled: body.enabled !== false ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });

    invalidateProviderCache();

    return Response.json(
      {
        provider: {
          id,
          name: body.name.trim(),
          providerType: body.providerType,
          model: body.model.trim(),
          apiEndpoint: body.apiEndpoint?.trim() || null,
          enabled: body.enabled !== false ? 1 : 0,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
