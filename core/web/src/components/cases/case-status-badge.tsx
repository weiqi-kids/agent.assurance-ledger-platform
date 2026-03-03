"use client";

import { Badge } from "@/components/ui/badge";
import type { CaseStatus } from "@/lib/ledger/types";

const STATUS_CONFIG: Record<
  CaseStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    className?: string;
  }
> = {
  draft: {
    label: "草稿",
    variant: "secondary",
  },
  active: {
    label: "進行中",
    variant: "default",
  },
  review: {
    label: "審閱",
    variant: "outline",
  },
  delivered: {
    label: "已交付",
    variant: "default",
    className: "bg-green-600 text-white hover:bg-green-700",
  },
  archived: {
    label: "已封存",
    variant: "secondary",
    className: "opacity-60",
  },
};

interface CaseStatusBadgeProps {
  status: string;
}

export function CaseStatusBadge({ status }: CaseStatusBadgeProps) {
  const config = STATUS_CONFIG[status as CaseStatus] ?? {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
