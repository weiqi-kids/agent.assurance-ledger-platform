"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/governance", label: "Overview", exact: true },
  { href: "/governance/controls", label: "Controls", exact: false },
  { href: "/governance/roles", label: "Roles", exact: false },
  { href: "/governance/raci", label: "RACI", exact: false },
  {
    href: "/governance/framework-mapping",
    label: "Framework Mapping",
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
