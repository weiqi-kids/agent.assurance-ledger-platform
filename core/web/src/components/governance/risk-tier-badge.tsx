import { Badge } from "@/components/ui/badge";

type RiskTier = "High" | "Medium" | "Low";

const variantMap: Record<RiskTier, "destructive" | "default" | "secondary"> = {
  High: "destructive",
  Medium: "default",
  Low: "secondary",
};

export function RiskTierBadge({ tier }: { tier: string }) {
  const variant = variantMap[tier as RiskTier] ?? "outline";
  return <Badge variant={variant}>{tier}</Badge>;
}
