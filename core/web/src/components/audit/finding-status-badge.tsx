import { Badge } from "@/components/ui/badge";

type FindingStatus = "open" | "investigating" | "remediated" | "closed";

const variantMap: Record<
  FindingStatus,
  "destructive" | "default" | "secondary" | "outline"
> = {
  open: "destructive",
  investigating: "default",
  remediated: "secondary",
  closed: "outline",
};

export function FindingStatusBadge({ status }: { status: string }) {
  const variant = variantMap[status as FindingStatus] ?? "outline";
  return <Badge variant={variant}>{status}</Badge>;
}
