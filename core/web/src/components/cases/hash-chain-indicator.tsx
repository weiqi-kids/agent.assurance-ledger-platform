"use client";

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface HashChainIndicatorProps {
  status: "valid" | "invalid" | "loading" | "idle";
  eventCount?: number;
  error?: string;
}

export function HashChainIndicator({
  status,
  eventCount,
  error,
}: HashChainIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>驗證鏈結中...</span>
      </div>
    );
  }

  if (status === "valid") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>
          鏈結有效
          {eventCount !== undefined && `（${eventCount} 事件已驗證）`}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="h-4 w-4" />
        <span>鏈結斷裂</span>
      </div>
      {error && (
        <p className="text-xs text-muted-foreground pl-6">{error}</p>
      )}
    </div>
  );
}
