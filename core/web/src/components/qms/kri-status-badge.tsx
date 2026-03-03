import { Badge } from "@/components/ui/badge";

interface KriStatusBadgeProps {
  current: number | null;
  threshold: number | null;
}

export function KriStatusBadge({ current, threshold }: KriStatusBadgeProps) {
  if (current === null || threshold === null) {
    return (
      <Badge variant="secondary">N/A</Badge>
    );
  }

  const breached = current >= threshold;

  return (
    <Badge variant={breached ? "destructive" : "secondary"}>
      {breached ? "超標" : "正常"}
    </Badge>
  );
}
