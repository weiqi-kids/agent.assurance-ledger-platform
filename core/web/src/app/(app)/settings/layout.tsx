"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bot, Cog, Settings, Users } from "lucide-react";

const settingsNav = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Users",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "System",
    href: "/settings/system",
    icon: Cog,
  },
  {
    title: "AI Providers",
    href: "/settings/ai-providers",
    icon: Bot,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system configuration, AI providers, and integrations.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b">
        {settingsNav.map((item) => {
          const isActive =
            item.href === "/settings"
              ? pathname === "/settings"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
