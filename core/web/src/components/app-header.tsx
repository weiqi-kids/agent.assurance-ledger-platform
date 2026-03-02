"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { navItems } from "@/lib/nav-config";

export function AppHeader() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const currentNav = navItems.find((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">ALP</BreadcrumbLink>
          </BreadcrumbItem>
          {currentNav && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {segments.length <= 1 ? (
                  <BreadcrumbPage>{currentNav.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={currentNav.href}>
                    {currentNav.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}
          {segments.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">
                  {segments[segments.length - 1]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
