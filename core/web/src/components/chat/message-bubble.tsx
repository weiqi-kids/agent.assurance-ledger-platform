"use client";

import { cn } from "@/lib/utils";
import { ProviderBadge } from "./provider-badge";
import { User } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  providerName?: string;
  providerType?: string;
  model?: string;
  createdAt?: string;
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  providerName,
  providerType,
  model,
  createdAt,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Provider badge for AI messages */}
        {!isUser && providerName && (
          <ProviderBadge
            providerName={providerName}
            providerType={providerType}
            model={model}
          />
        )}

        {/* User badge */}
        {isUser && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>You</span>
          </div>
        )}

        {/* Message content */}
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {content}
          {isStreaming && (
            <span className="ml-1 inline-block animate-pulse">|</span>
          )}
        </div>

        {/* Timestamp */}
        {createdAt && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(createdAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
