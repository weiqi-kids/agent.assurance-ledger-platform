import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const variantMap: Record<string, BadgeVariant> = {
  Policy: "default",
  SOP: "secondary",
  "Work Instruction": "outline",
  Form: "secondary",
  Template: "outline",
};

export function DocTypeBadge({ docType }: { docType: string }) {
  const variant = variantMap[docType] ?? "outline";
  return <Badge variant={variant}>{docType}</Badge>;
}
