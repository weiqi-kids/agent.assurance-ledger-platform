"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import type { MentionOption } from "@/components/chat/mention-autocomplete";
import { MessageSquare, Loader2 } from "lucide-react";

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  aiProviderId: string | null;
  createdAt: string;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
    role: string;
  } | null;
}

interface ProviderInfo {
  id: string;
  name: string;
  providerType: string;
  model: string;
  enabled: number;
}

interface StreamingMessage {
  providerId: string;
  providerName: string;
  model: string;
  content: string;
  messageId: string;
  done: boolean;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingConvs, setIsFetchingConvs] = useState(true);
  const [streamingMessages, setStreamingMessages] = useState<
    Map<string, StreamingMessage>
  >(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const providerMapRef = useRef<Map<string, ProviderInfo>>(new Map());

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessages]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {
      // Silently fail
    } finally {
      setIsFetchingConvs(false);
    }
  }, []);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/ai-providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
        const map = new Map<string, ProviderInfo>();
        for (const p of data.providers) {
          map.set(p.id, p);
        }
        providerMapRef.current = map;
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(
        `/api/chat/conversations/${convId}/messages?limit=100`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchProviders();
  }, [fetchConversations, fetchProviders]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      setStreamingMessages(new Map());
    } else {
      setMessages([]);
    }
  }, [activeConvId, fetchMessages]);

  // Create new conversation
  const handleCreate = async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConvId(data.conversation.id);
      }
    } catch {
      // Silently fail
    }
  };

  // Delete conversation
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConvId === id) {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch {
      // Silently fail
    }
  };

  // Send message with streaming
  const handleSend = async (content: string) => {
    if (!activeConvId) {
      // Create a conversation first
      try {
        const res = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: content.substring(0, 50),
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConvId(data.conversation.id);

        // Wait for state to update, then send
        setTimeout(() => sendToConversation(data.conversation.id, content), 50);
      } catch {
        return;
      }
      return;
    }

    await sendToConversation(activeConvId, content);
  };

  const sendToConversation = async (convId: string, content: string) => {
    setIsLoading(true);
    setStreamingMessages(new Map());

    try {
      const res = await fetch(
        `/api/chat/conversations/${convId}/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!res.ok || !res.body) {
        // Fallback to non-streaming
        const fallbackRes = await fetch(
          `/api/chat/conversations/${convId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setMessages((prev) => [...prev, ...data.messages]);
        }
        setIsLoading(false);
        fetchConversations();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "user_message" && event.userMessage) {
              setMessages((prev) => [...prev, event.userMessage]);
            } else if (event.type === "provider_start") {
              setStreamingMessages((prev) => {
                const next = new Map(prev);
                next.set(event.messageId, {
                  providerId: event.providerId,
                  providerName: event.providerName,
                  model: event.model,
                  content: "",
                  messageId: event.messageId,
                  done: false,
                });
                return next;
              });
            } else if (event.providerId && event.messageId) {
              if (event.done) {
                // Move from streaming to messages
                setStreamingMessages((prev) => {
                  const next = new Map(prev);
                  const existing = next.get(event.messageId);
                  if (existing) {
                    const finalContent = event.error
                      ? event.content
                      : existing.content;
                    setMessages((prevMsgs) => [
                      ...prevMsgs,
                      {
                        id: event.messageId,
                        conversationId: convId,
                        role: "assistant",
                        content: finalContent,
                        aiProviderId: event.providerId,
                        createdAt: new Date().toISOString(),
                      },
                    ]);
                    next.delete(event.messageId);
                  }
                  return next;
                });
              } else {
                setStreamingMessages((prev) => {
                  const next = new Map(prev);
                  const existing = next.get(event.messageId);
                  if (existing) {
                    next.set(event.messageId, {
                      ...existing,
                      content: existing.content + event.content,
                    });
                  }
                  return next;
                });
              }
            } else if (event.type === "stream_end") {
              // All done
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
      setStreamingMessages(new Map());
      fetchConversations();
    }
  };

  // Build mention options from enabled providers
  const mentionOptions: MentionOption[] = providers
    .filter((p) => p.enabled === 1)
    .map((p) => ({
      id: p.id,
      name: p.name,
      providerType: p.providerType,
    }));

  // Helper to get provider info for a message
  const getProviderInfo = (msg: Message) => {
    if (!msg.aiProviderId) return {};
    const provider = providerMapRef.current.get(msg.aiProviderId);
    return provider
      ? {
          providerName: provider.name,
          providerType: provider.providerType,
          model: provider.model,
        }
      : { providerName: "AI" };
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-4 md:-m-6">
      {/* Sidebar */}
      <div className="hidden w-[280px] shrink-0 md:block">
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={setActiveConvId}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {activeConvId ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                {conversations.find((c) => c.id === activeConvId)?.title ||
                  "對話"}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    createdAt={msg.createdAt}
                    {...getProviderInfo(msg)}
                  />
                ))}

                {/* Streaming messages */}
                {Array.from(streamingMessages.values()).map((sm) => (
                  <MessageBubble
                    key={sm.messageId}
                    role="assistant"
                    content={sm.content}
                    providerName={sm.providerName}
                    model={sm.model}
                    isStreaming={!sm.done}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              providers={mentionOptions}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            {isFetchingConvs ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <MessageSquare className="h-12 w-12" />
                <div className="text-center">
                  <p className="text-lg font-medium">
                    選擇或建立對話
                  </p>
                  <p className="mt-1 text-sm">
                    使用 @供應商名稱 或 @all-ai 提及 AI 供應商
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  新增對話
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
