/**
 * Core AI adapter interfaces for multi-provider support.
 *
 * Each provider (Anthropic, OpenAI, Google) implements AIAdapter.
 * The system routes messages via @mentions to one or more providers.
 */

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AIAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly model: string;
  send(messages: AIMessage[]): Promise<string>;
  streamMessage(messages: AIMessage[]): AsyncGenerator<AIStreamChunk>;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  providerType: string;
  modelId: string;
  isEnabled: boolean;
}
