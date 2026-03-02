"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Table2, Network } from "lucide-react";

interface ControlRecord {
  controlId: string;
  domain: string;
  riskTier: string;
}

const DOMAIN_INFO: Record<string, { name: string; description: string }> = {
  AC: { name: "Access Control", description: "Authentication, RBAC, and access reviews" },
  CM: { name: "Change Management", description: "Code review, CI/CD, and release governance" },
  PI: { name: "Processing Integrity", description: "Hash chains, sampling, and evidence integrity" },
  CF: { name: "Configuration", description: "Environment, migrations, and infrastructure config" },
  IR: { name: "Incident Response", description: "Conflict handling, failures, and complaints" },
  MN: { name: "Monitoring", description: "Verification, KRI, reviews, and subservice oversight" },
};

const QUICK_LINKS = [
  {
    href: "/governance/controls",
    icon: Shield,
    title: "Controls",
    description: "View all 30 controls across 6 domains",
  },
  {
    href: "/governance/roles",
    icon: Users,
    title: "Roles",
    description: "6 roles with permission matrices",
  },
  {
    href: "/governance/raci",
    icon: Table2,
    title: "RACI Matrix",
    description: "Responsibility assignments for all controls",
  },
  {
    href: "/governance/framework-mapping",
    icon: Network,
    title: "Framework Mapping",
    description: "SOC1 / ISQM1 / ISO 9001 cross-reference",
  },
];

export default function GovernancePage() {
  const [controlsByDomain, setControlsByDomain] = useState<
    Record<string, ControlRecord[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/governance/controls")
      .then((res) => res.json())
      .then((data: { controls: ControlRecord[] }) => {
        const grouped: Record<string, ControlRecord[]> = {};
        for (const c of data.controls) {
          if (!grouped[c.domain]) grouped[c.domain] = [];
          grouped[c.domain].push(c);
        }
        setControlsByDomain(grouped);
      })
      .catch(() => {
        // Fallback: show static domain info
      })
      .finally(() => setLoading(false));
  }, []);

  const domains = Object.keys(DOMAIN_INFO);

  return (
    <div className="space-y-8">
      {/* Domain Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Control Domains</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((code) => {
            const info = DOMAIN_INFO[code];
            const domainControls = controlsByDomain[code] ?? [];
            const highCount = domainControls.filter(
              (c) => c.riskTier === "High"
            ).length;
            const mediumCount = domainControls.filter(
              (c) => c.riskTier === "Medium"
            ).length;
            const lowCount = domainControls.filter(
              (c) => c.riskTier === "Low"
            ).length;

            return (
              <Link
                key={code}
                href={`/governance/controls?domain=${code}`}
              >
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{info.name}</CardTitle>
                      <Badge variant="secondary">{code}</Badge>
                    </div>
                    <CardDescription>{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {loading
                          ? "Loading..."
                          : `${domainControls.length} controls`}
                      </span>
                    </div>
                    {!loading && domainControls.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {highCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {highCount} High
                          </Badge>
                        )}
                        {mediumCount > 0 && (
                          <Badge variant="default" className="text-xs">
                            {mediumCount} Medium
                          </Badge>
                        )}
                        {lowCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {lowCount} Low
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <link.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{link.title}</CardTitle>
                  </div>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
