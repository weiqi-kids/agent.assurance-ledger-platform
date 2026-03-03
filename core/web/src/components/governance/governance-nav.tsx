"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/governance", label: "總覽", exact: true },
  { href: "/governance/controls", label: "控制點", exact: false },
  { href: "/governance/roles", label: "角色", exact: false },
  { href: "/governance/raci", label: "RACI", exact: false },
  {
    href: "/governance/framework-mapping",
    label: "框架映射",
    exact: false,
  },
];

export function GovernanceNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-lg bg-muted p-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
