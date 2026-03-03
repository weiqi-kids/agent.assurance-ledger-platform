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
import { WorkflowSteps } from "@/components/workflow-steps";
import type { WorkflowStep } from "@/components/workflow-steps";

interface ControlRecord {
  controlId: string;
  domain: string;
  riskTier: string;
}

const DOMAIN_INFO: Record<string, { name: string; description: string }> = {
  AC: { name: "存取控制", description: "身分驗證、角色存取控制及存取審查" },
  CM: { name: "變更管理", description: "程式碼審查、CI/CD 及發布治理" },
  PI: { name: "處理完整性", description: "雜湊鏈、抽樣及證據完整性" },
  CF: { name: "組態管理", description: "環境、遷移及基礎設施組態" },
  IR: { name: "事件回應", description: "衝突處理、故障及客訴" },
  MN: { name: "監控", description: "驗證、KRI、覆核及次服務監督" },
};

const QUICK_LINKS = [
  {
    href: "/governance/controls",
    icon: Shield,
    title: "控制點",
    description: "檢視 6 大領域的全部 30 個控制點",
  },
  {
    href: "/governance/roles",
    icon: Users,
    title: "角色",
    description: "6 個角色及其權限矩陣",
  },
  {
    href: "/governance/raci",
    icon: Table2,
    title: "RACI 矩陣",
    description: "所有控制點的責任分工",
  },
  {
    href: "/governance/framework-mapping",
    icon: Network,
    title: "框架映射",
    description: "SOC1 / ISQM1 / ISO 9001 交叉對照",
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
  const totalControls = Object.values(controlsByDomain).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const workflowSteps: WorkflowStep[] = [
    {
      number: 1,
      title: "檢視控制點清單",
      description: "檢視 6 大領域的 30 個控制點",
      href: "/governance/controls",
      status: totalControls > 0 ? "done" : "current",
    },
    {
      number: 2,
      title: "框架映射",
      description: "SOC1 / ISQM1 / ISO 9001 交叉對照",
      href: "/governance/framework-mapping",
      status: "current",
    },
    {
      number: 3,
      title: "RACI 責任矩陣",
      description: "每個控制點的責任分工",
      href: "/governance/raci",
      status: "current",
    },
    {
      number: 4,
      title: "角色權限",
      description: "檢視角色存取權限矩陣",
      href: "/governance/roles",
      status: "current",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">治理</h1>
        <p className="mt-1 text-muted-foreground">
          管理所有審計領域的控制點、職責分工及框架合規狀況。
        </p>
      </div>

      {/* Workflow Steps */}
      <WorkflowSteps steps={workflowSteps} />

      {/* Domain Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">控制領域</h2>
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
                          ? "載入中..."
                          : `${domainControls.length} 個控制點`}
                      </span>
                    </div>
                    {!loading && domainControls.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {highCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {highCount} 高
                          </Badge>
                        )}
                        {mediumCount > 0 && (
                          <Badge variant="default" className="text-xs">
                            {mediumCount} 中
                          </Badge>
                        )}
                        {lowCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {lowCount} 低
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
        <h2 className="mb-4 text-lg font-semibold">快速連結</h2>
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
