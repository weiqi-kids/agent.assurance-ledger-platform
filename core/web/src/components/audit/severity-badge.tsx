import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FindingSeverity = "Critical" | "High" | "Medium" | "Low";

const severityStyles: Record<FindingSeverity, string> = {
  Critical: "bg-red-600 text-white hover:bg-red-600/90",
  High: "bg-orange-500 text-white hover:bg-orange-500/90",
  Medium: "bg-yellow-500 text-white hover:bg-yellow-500/90",
  Low: "bg-blue-500 text-white hover:bg-blue-500/90",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const style = severityStyles[severity as FindingSeverity];
  if (!style) {
    return <Badge variant="outline">{severity}</Badge>;
  }
  return (
    <Badge className={cn("border-transparent", style)}>{severity}</Badge>
  );
}
