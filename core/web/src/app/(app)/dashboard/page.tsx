"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { KriChart } from "@/components/dashboard/kri-chart";
import { ControlHeatmap } from "@/components/dashboard/control-heatmap";

interface DashboardStats {
  cases: {
    total: number;
    byStatus: Record<string, number>;
  };
  findings: {
    totalOpen: number;
    bySeverity: Record<string, number>;
  };
  controls: {
    total: number;
    passRate: number;
    withOpenFindings: number;
  };
  evidencePacks: {
    total: number;
    latest: {
      period: string;
      status: string;
      generatedAt: string;
      signed: boolean;
    } | null;
  };
}

interface KriDataPoint {
  domain: string;
  threshold: number;
  current: number;
}

interface ActivityItem {
  eventType: string;
  caseTitle: string;
  actor: string;
  timestamp: string;
}

interface DomainHealth {
  domain: string;
  domainName: string;
  controlCount: number;
  noFindings: number;
  mediumFindings: number;
  highCriticalFindings: number;
}

const severityColorMap: Record<string, string> = {
  Material: "bg-red-500",
  Significant: "bg-orange-500",
  critical: "bg-red-500",
  high: "bg-orange-500",
  "Control Deficiency": "bg-yellow-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

function SeverityDots({ bySeverity }: { bySeverity: Record<string, number> }) {
  const entries = Object.entries(bySeverity);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {entries.map(([severity, count]) => (
        <Badge key={severity} variant="outline" className="text-xs gap-1">
          <span
            className={`inline-block h-2 w-2 rounded-full ${severityColorMap[severity] ?? "bg-gray-400"}`}
          />
          {count} {severity}
        </Badge>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kriData, setKriData] = useState<KriDataPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [heatmap, setHeatmap] = useState<DomainHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, kriRes, actRes, heatRes] = await Promise.allSettled([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/kri"),
          fetch("/api/dashboard/activity"),
          fetch("/api/dashboard/heatmap"),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const data = (await statsRes.value.json()) as DashboardStats;
          setStats(data);
        }
        if (kriRes.status === "fulfilled" && kriRes.value.ok) {
          const data = (await kriRes.value.json()) as { kri: KriDataPoint[] };
          setKriData(data.kri);
        }
        if (actRes.status === "fulfilled" && actRes.value.ok) {
          const data = (await actRes.value.json()) as {
            activity: ActivityItem[];
          };
          setActivity(data.activity);
        }
        if (heatRes.status === "fulfilled" && heatRes.value.ok) {
          const data = (await heatRes.value.json()) as {
            heatmap: DomainHealth[];
          };
          setHeatmap(data.heatmap);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cases"
          value={stats?.cases.total ?? 0}
          icon={Briefcase}
          description={
            stats?.cases.byStatus.active
              ? `${stats.cases.byStatus.active} active`
              : "No active cases"
          }
        >
          {stats && Object.keys(stats.cases.byStatus).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(stats.cases.byStatus).map(([status, cnt]) => (
                <Badge
                  key={status}
                  variant={status === "active" ? "default" : "secondary"}
                  className="text-xs capitalize"
                >
                  {cnt} {status}
                </Badge>
              ))}
            </div>
          )}
        </StatCard>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.findings.totalOpen ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.findings.totalOpen === 0
                ? "All clear"
                : "Requires attention"}
            </p>
            {stats && (
              <SeverityDots bySeverity={stats.findings.bySeverity} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Control Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.controls.passRate ?? 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.controls.total ?? 0} controls total
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${stats?.controls.passRate ?? 100}%` }}
              />
            </div>
            {stats && stats.controls.withOpenFindings > 0 && (
              <p className="mt-1 text-xs text-destructive">
                {stats.controls.withOpenFindings} with open findings
              </p>
            )}
          </CardContent>
        </Card>

        <StatCard
          title="Evidence Packs"
          value={stats?.evidencePacks.total ?? 0}
          icon={ClipboardCheck}
          description={
            stats?.evidencePacks.latest
              ? `Latest: ${stats.evidencePacks.latest.period}`
              : "No packs generated"
          }
        >
          {stats?.evidencePacks.latest && (
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge
                variant={
                  stats.evidencePacks.latest.signed ? "default" : "secondary"
                }
                className="text-xs"
              >
                {stats.evidencePacks.latest.signed ? "Signed" : "Unsigned"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatDate(stats.evidencePacks.latest.generatedAt)}
              </Badge>
            </div>
          )}
        </StatCard>
      </div>

      {/* Next Steps */}
      {stats && stats.cases.total === 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">開始使用</p>
              <p className="text-sm text-muted-foreground">
                建立第一個案件，開始審計流程。
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/cases/new">建立案件</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {stats && stats.cases.total > 0 && stats.findings.totalOpen === 0 && stats.evidencePacks.total === 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">記錄審計發現</p>
              <p className="text-sm text-muted-foreground">
                記錄測試中發現的偏差與控制缺失。
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/audit/findings">Go to Findings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {stats && stats.cases.total > 0 && stats.findings.totalOpen > 0 && stats.evidencePacks.total === 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">產生證據包</p>
              <p className="text-sm text-muted-foreground">
                為審計期間建立確定性證據封存，完成審計週期。
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/audit/evidence-packs">Go to Evidence Packs</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Control Status Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Control Status by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <ControlHeatmap data={heatmap} />
        </CardContent>
      </Card>

      {/* KRI Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Key Risk Indicators (KRI) by Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <KriChart data={kriData} />
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed items={activity.slice(0, 10)} />
        </CardContent>
      </Card>
    </div>
  );
}
