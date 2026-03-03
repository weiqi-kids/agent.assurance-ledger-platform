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
    title: "儀表板",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "案件",
    href: "/cases",
    icon: Briefcase,
    requiredPermission: "cases:read",
  },
  {
    title: "治理",
    href: "/governance",
    icon: Shield,
    requiredPermission: "governance:read",
  },
  {
    title: "審計",
    href: "/audit",
    icon: ClipboardCheck,
    requiredPermission: "audit:read",
  },
  {
    title: "品質管理",
    href: "/qms",
    icon: ScrollText,
    requiredPermission: "governance:read",
  },
  {
    title: "對話",
    href: "/chat",
    icon: MessageSquare,
    requiredPermission: "chat:use",
  },
  {
    title: "設定",
    href: "/settings",
    icon: Settings,
    requiredPermission: "settings:read",
  },
];
