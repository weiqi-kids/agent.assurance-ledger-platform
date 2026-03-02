import {
  LayoutDashboard,
  Briefcase,
  Shield,
  ClipboardCheck,
  MessageSquare,
  Settings,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: string;
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cases",
    href: "/cases",
    icon: Briefcase,
    requiredPermission: "cases:read",
  },
  {
    title: "Governance",
    href: "/governance",
    icon: Shield,
    requiredPermission: "governance:read",
  },
  {
    title: "Audit",
    href: "/audit",
    icon: ClipboardCheck,
    requiredPermission: "audit:read",
  },
  {
    title: "QMS",
    href: "/qms",
    icon: ScrollText,
    requiredPermission: "governance:read",
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare,
    requiredPermission: "chat:use",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    requiredPermission: "settings:read",
  },
];
