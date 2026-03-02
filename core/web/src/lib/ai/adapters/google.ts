/**
 * Google AI (Gemini) adapter.
 *
 * Uses the official @google/generative-ai SDK.
 * API key is read from process.env.GOOGLE_AI_API_KEY.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIAdapter, AIMessage, AIStreamChunk } from "../types";

export class GoogleAIAdapter implements AIAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly model: string;
  private genAI: GoogleGenerativeAI;

  constructor(providerId: string, providerName: string, model: string) {
    this.providerId = providerId;
    this.providerName = providerName;
    this.model = model;
    this.genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY ?? ""
    );
  }

  async send(messages: AIMessage[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    const { systemInstruction, history, lastUserMessage } =
      this.convertMessages(messages);

    const chat = model.startChat({
      systemInstruction: systemInstruction || undefined,
      history,
    });

    const result = await chat.sendMessage(lastUserMessage);
    return result.response.text();
  }

  async *streamMessage(messages: AIMessage[]): AsyncGenerator<AIStreamChunk> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    const { systemInstruction, history, lastUserMessage } =
      this.convertMessages(messages);

    const chat = model.startChat({
      systemInstruction: systemInstruction || undefined,
      history,
    });

    const result = await chat.sendMessageStream(lastUserMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { content: text, done: false };
      }
    }

    yield { content: "", done: true };
  }

  /**
   * Convert AIMessage[] to Gemini's chat format.
   * Gemini uses "user"/"model" roles and separates system instructions.
   */
  private convertMessages(messages: AIMessage[]): {
    systemInstruction: string;
    history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
    lastUserMessage: string;
  } {
    const systemMsgs = messages.filter((m) => m.role === "system");
    const conversationMsgs = messages.filter((m) => m.role !== "system");

    const systemInstruction = systemMsgs.map((m) => m.content).join("\n");

    // Ensure there is at least one user message
    if (
      conversationMsgs.length === 0 ||
      conversationMsgs[conversationMsgs.length - 1].role !== "user"
    ) {
      conversationMsgs.push({ role: "user", content: "Hello" });
    }

    const lastUserMessage =
      conversationMsgs[conversationMsgs.length - 1].content;

    const history = conversationMsgs.slice(0, -1).map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content }],
    }));

    return { systemInstruction, history, lastUserMessage };
  }
}
