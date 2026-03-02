/**
 * AI Provider Registry.
 *
 * Loads enabled providers from the database and instantiates the correct
 * adapter for each one. Uses a cached singleton pattern with manual
 * invalidation when provider configuration changes.
 */
import { getDb } from "@/lib/db";
import { aiProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AnthropicAdapter } from "./adapters/anthropic";
import { OpenAIAdapter } from "./adapters/openai";
import { GoogleAIAdapter } from "./adapters/google";
import type { AIAdapter, AIProviderConfig } from "./types";

let cachedProviders: Map<string, AIAdapter> | null = null;

function createAdapter(config: AIProviderConfig): AIAdapter {
  switch (config.providerType) {
    case "anthropic":
      return new AnthropicAdapter(config.id, config.name, config.modelId);
    case "openai":
      return new OpenAIAdapter(config.id, config.name, config.modelId);
    case "google":
      return new GoogleAIAdapter(config.id, config.name, config.modelId);
    default:
      throw new Error(`Unsupported provider type: ${config.providerType}`);
  }
}

/**
 * Load all enabled providers from the database and instantiate adapters.
 */
export async function getEnabledProviders(): Promise<Map<string, AIAdapter>> {
  if (cachedProviders) return cachedProviders;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getDb() as any;
  const rows = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.enabled, 1));

  const map = new Map<string, AIAdapter>();
  for (const row of rows) {
    const config: AIProviderConfig = {
      id: row.id,
      name: row.name,
      providerType: row.providerType,
      modelId: row.model,
      isEnabled: true,
    };
    map.set(config.id, createAdapter(config));
  }

  cachedProviders = map;
  return map;
}

/**
 * Get a single provider adapter by ID.
 */
export async function getProvider(id: string): Promise<AIAdapter | undefined> {
  const providers = await getEnabledProviders();
  return providers.get(id);
}

/**
 * Invalidate the cached providers. Call after any provider config change.
 */
export function invalidateProviderCache(): void {
  cachedProviders = null;
}
