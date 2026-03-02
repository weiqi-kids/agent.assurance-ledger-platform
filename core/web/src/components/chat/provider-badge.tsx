"use client";

import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  openai: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  google: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

interface ProviderBadgeProps {
  providerName: string;
  providerType?: string;
  model?: string;
  className?: string;
}

export function ProviderBadge({
  providerName,
  providerType,
  model,
  className,
}: ProviderBadgeProps) {
  const colorClass = providerType
    ? PROVIDER_COLORS[providerType] ?? ""
    : "";

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${className ?? ""} gap-1 border-transparent`}
    >
      <Bot className="h-3 w-3" />
      <span>{providerName}</span>
      {model && (
        <span className="text-[10px] opacity-70">({model})</span>
      )}
    </Badge>
  );
}
