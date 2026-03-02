import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const variantMap: Record<string, BadgeVariant> = {
  open: "destructive",
  investigating: "default",
  resolved: "secondary",
  closed: "outline",
};

export function ComplaintStatusBadge({ status }: { status: string }) {
  const variant = variantMap[status] ?? "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}
