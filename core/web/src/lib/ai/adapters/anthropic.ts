/**
 * Anthropic Claude adapter.
 *
 * Uses the official @anthropic-ai/sdk to communicate with Claude models.
 * API key is read from process.env.ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { AIAdapter, AIMessage, AIStreamChunk } from "../types";

export class AnthropicAdapter implements AIAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly model: string;
  private client: Anthropic;

  constructor(providerId: string, providerName: string, model: string) {
    this.providerId = providerId;
    this.providerName = providerName;
    this.model = model;
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  }

  async send(messages: AIMessage[]): Promise<string> {
    const { systemPrompt, userMessages } = this.splitMessages(messages);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: userMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textBlock = response.content.find((c) => c.type === "text");
    return textBlock ? textBlock.text : "";
  }

  async *streamMessage(messages: AIMessage[]): AsyncGenerator<AIStreamChunk> {
    const { systemPrompt, userMessages } = this.splitMessages(messages);

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: userMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { content: event.delta.text, done: false };
      }
    }

    yield { content: "", done: true };
  }

  /**
   * Anthropic API separates system prompts from the message array.
   */
  private splitMessages(messages: AIMessage[]): {
    systemPrompt: string;
    userMessages: AIMessage[];
  } {
    const systemMsgs = messages.filter((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    // Ensure conversation starts with a user message (Anthropic requirement)
    if (userMessages.length === 0 || userMessages[0].role !== "user") {
      userMessages.unshift({ role: "user", content: "Hello" });
    }

    return {
      systemPrompt: systemMsgs.map((m) => m.content).join("\n"),
      userMessages,
    };
  }
}
