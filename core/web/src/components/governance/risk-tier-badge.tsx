import { Badge } from "@/components/ui/badge";

type RiskTier = "High" | "Medium" | "Low";

const variantMap: Record<RiskTier, "destructive" | "default" | "secondary"> = {
  High: "destructive",
  Medium: "default",
  Low: "secondary",
};

const labelMap: Record<RiskTier, string> = {
  High: "高",
  Medium: "中",
  Low: "低",
};

export function RiskTierBadge({ tier }: { tier: string }) {
  const variant = variantMap[tier as RiskTier] ?? "outline";
  const label = labelMap[tier as RiskTier] ?? tier;
  return <Badge variant={variant}>{label}</Badge>;
}
