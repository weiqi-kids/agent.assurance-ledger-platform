/**
 * AI @mention routing.
 *
 * Parses @mentions from user messages and routes to the appropriate
 * AI provider(s). Supports @all-ai for fan-out to all enabled providers,
 * and @provider-name for routing to a specific provider.
 */
import type { AIAdapter } from "./types";

export interface RouteTarget {
  providerId: string;
  adapter: AIAdapter;
}

export interface ParseResult {
  /** The message text with @mentions stripped */
  cleanText: string;
  /** List of raw @mention strings found */
  mentions: string[];
  /** Whether @all-ai was mentioned */
  isAllAi: boolean;
}

/**
 * Extract @mentions from message text.
 *
 * - @all-ai  -> fan-out to all enabled providers
 * - @name    -> route to provider whose name matches (case-insensitive)
 * - No @     -> no AI routing (just save the message)
 */
export function parseMessage(text: string): ParseResult {
  const mentionPattern = /@([\w-]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  const isAllAi = mentions.some((m) => m.toLowerCase() === "all-ai");

  // Strip @mentions from text for the actual message sent to AI
  const cleanText = text.replace(/@[\w-]+/g, "").trim();

  return { cleanText, mentions, isAllAi };
}

/**
 * Given parsed mentions and the full set of enabled providers,
 * return which adapters to send the message to.
 */
export function routeMessage(
  parseResult: ParseResult,
  providers: Map<string, AIAdapter>
): RouteTarget[] {
  if (parseResult.mentions.length === 0) {
    return [];
  }

  if (parseResult.isAllAi) {
    return Array.from(providers.entries()).map(([providerId, adapter]) => ({
      providerId,
      adapter,
    }));
  }

  const targets: RouteTarget[] = [];
  for (const mention of parseResult.mentions) {
    for (const [providerId, adapter] of providers.entries()) {
      if (adapter.providerName.toLowerCase() === mention.toLowerCase()) {
        targets.push({ providerId, adapter });
      }
    }
  }

  return targets;
}
