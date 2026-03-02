import { Badge } from "@/components/ui/badge";

type SampleStatus = "pending" | "in_progress" | "completed";

const variantMap: Record<
  SampleStatus,
  "default" | "secondary" | "outline"
> = {
  pending: "default",
  in_progress: "secondary",
  completed: "outline",
};

export function SampleStatusBadge({ status }: { status: string }) {
  const variant = variantMap[status as SampleStatus] ?? "outline";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
