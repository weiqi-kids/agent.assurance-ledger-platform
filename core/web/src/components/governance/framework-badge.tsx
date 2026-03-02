import { Badge } from "@/components/ui/badge";

type Framework = "SOC1" | "ISQM1" | "ISO9001";

const variantMap: Record<Framework, "default" | "secondary" | "outline"> = {
  SOC1: "default",
  ISQM1: "secondary",
  ISO9001: "outline",
};

export function FrameworkBadge({ framework }: { framework: string }) {
  const variant = variantMap[framework as Framework] ?? "outline";
  return <Badge variant={variant}>{framework}</Badge>;
}
