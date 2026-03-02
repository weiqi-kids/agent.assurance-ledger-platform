/**
 * OpenAI adapter.
 *
 * Uses the official openai SDK to communicate with GPT models.
 * API key is read from process.env.OPENAI_API_KEY.
 */
import OpenAI from "openai";
import type { AIAdapter, AIMessage, AIStreamChunk } from "../types";

export class OpenAIAdapter implements AIAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly model: string;
  private client: OpenAI;

  constructor(providerId: string, providerName: string, model: string) {
    this.providerId = providerId;
    this.providerName = providerName;
    this.model = model;
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "",
    });
  }

  async send(messages: AIMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return response.choices[0]?.message?.content ?? "";
  }

  async *streamMessage(messages: AIMessage[]): AsyncGenerator<AIStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { content: delta, done: false };
      }
    }

    yield { content: "", done: true };
  }
}
