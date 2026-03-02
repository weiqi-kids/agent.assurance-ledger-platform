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
    label: "Draft",
    variant: "secondary",
  },
  active: {
    label: "Active",
    variant: "default",
  },
  review: {
    label: "Review",
    variant: "outline",
  },
  delivered: {
    label: "Delivered",
    variant: "default",
    className: "bg-green-600 text-white hover:bg-green-700",
  },
  archived: {
    label: "Archived",
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
