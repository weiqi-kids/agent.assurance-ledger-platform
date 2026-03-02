/**
 * API Route: /api/settings/ai-providers/[providerId]/test
 *
 * POST — Test connectivity with the AI provider by sending a simple message.
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { aiProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic";
import { OpenAIAdapter } from "@/lib/ai/adapters/openai";
import { GoogleAIAdapter } from "@/lib/ai/adapters/google";

type RouteContext = { params: Promise<{ providerId: string }> };

export async function POST(
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

    const provider = rows[0];
    let adapter;

    switch (provider.providerType) {
      case "anthropic":
        adapter = new AnthropicAdapter(
          provider.id,
          provider.name,
          provider.model
        );
        break;
      case "openai":
        adapter = new OpenAIAdapter(
          provider.id,
          provider.name,
          provider.model
        );
        break;
      case "google":
        adapter = new GoogleAIAdapter(
          provider.id,
          provider.name,
          provider.model
        );
        break;
      default:
        return Response.json(
          { error: `Unsupported provider type: ${provider.providerType}` },
          { status: 400 }
        );
    }

    const startTime = Date.now();
    const response = await adapter.send([
      { role: "user", content: "Hello, respond with a single word: OK" },
    ]);
    const elapsed = Date.now() - startTime;

    return Response.json({
      success: true,
      response: response.substring(0, 200),
      latencyMs: elapsed,
      provider: {
        name: provider.name,
        type: provider.providerType,
        model: provider.model,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 502 }
      );
    }
    return authErrorResponse(error);
  }
}
