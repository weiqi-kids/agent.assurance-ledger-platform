"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskTierBadge } from "@/components/governance/risk-tier-badge";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ControlDetail {
  id: string;
  controlId: string;
  domain: string;
  controlStatement: string;
  purpose: string;
  ownerRole: string;
  backupOwnerRole: string;
  frequency: string;
  systemComponents: string;
  evidenceTypes: string;
  evidencePathConvention: string;
  linkedRisks: string;
  riskTier: string;
  populationDefinition: string;
  sampleUnit: string;
  failureCriteria: string;
  lastReviewedAt: string | null;
  approvedBy: string | null;
}

function parseJsonArray(str: string): string[] {
  try {
    const parsed: unknown = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

export default function ControlDetailPage({
  params,
}: {
  params: Promise<{ controlId: string }>;
}) {
  const { controlId } = use(params);
  const [control, setControl] = useState<ControlDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/governance/controls/${controlId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Control not found");
        return res.json();
      })
      .then((data: { control: ControlDetail }) => {
        if (!cancelled) {
          setControl(data.control);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [controlId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !control) {
    return (
      <div className="space-y-4">
        <Link href="/governance/controls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回控制點
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error ?? "找不到控制點"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const systemComponents = parseJsonArray(control.systemComponents);
  const evidenceTypes = parseJsonArray(control.evidenceTypes);
  const linkedRisks = parseJsonArray(control.linkedRisks);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/governance/controls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回控制點
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{control.controlId}</h2>
          <Badge variant="outline">{control.domain}</Badge>
          <RiskTierBadge tier={control.riskTier} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
            <CardDescription>控制點識別與用途</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                控制點 ID
              </label>
              <p className="text-sm">{control.controlId}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                領域
              </label>
              <p className="text-sm">{control.domain}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                控制描述
              </label>
              <p className="text-sm">{control.controlStatement}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                用途
              </label>
              <p className="text-sm">{control.purpose}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Ownership */}
        <Card>
          <CardHeader>
            <CardTitle>權責</CardTitle>
            <CardDescription>
              此控制點的負責人與代理人
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                負責角色
              </label>
              <p className="text-sm">{control.ownerRole}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                代理角色
              </label>
              <p className="text-sm">{control.backupOwnerRole}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Testing */}
        <Card>
          <CardHeader>
            <CardTitle>測試</CardTitle>
            <CardDescription>
              頻率、母體及失敗標準
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                頻率
              </label>
              <p className="text-sm">{control.frequency}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                風險層級
              </label>
              <div className="mt-1">
                <RiskTierBadge tier={control.riskTier} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                母體定義
              </label>
              <p className="text-sm">{control.populationDefinition}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                樣本單位
              </label>
              <p className="text-sm">{control.sampleUnit}</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                失敗標準
              </label>
              <p className="text-sm">{control.failureCriteria}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Evidence */}
        <Card>
          <CardHeader>
            <CardTitle>證據</CardTitle>
            <CardDescription>
              證據類型、路徑及系統元件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                證據類型
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {evidenceTypes.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                證據路徑慣例
              </label>
              <p className="font-mono text-sm">
                {control.evidencePathConvention}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                系統元件
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {systemComponents.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Risks */}
        <Card>
          <CardHeader>
            <CardTitle>風險</CardTitle>
            <CardDescription>關聯風險與風險層級</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                關聯風險
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {linkedRisks.length > 0 ? (
                  linkedRisks.map((r) => (
                    <Badge key={r} variant="outline">
                      {r}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">無</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                風險層級
              </label>
              <div className="mt-1">
                <RiskTierBadge tier={control.riskTier} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Review */}
        <Card>
          <CardHeader>
            <CardTitle>審閱</CardTitle>
            <CardDescription>最近一次審閱與核准狀態</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                最後審閱時間
              </label>
              <p className="text-sm">
                {control.lastReviewedAt ?? "尚未審閱"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                核准人
              </label>
              <p className="text-sm">
                {control.approvedBy ?? "尚未核准"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
