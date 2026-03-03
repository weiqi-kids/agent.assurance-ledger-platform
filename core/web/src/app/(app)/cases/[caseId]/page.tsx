"use client";

import React from "react";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { EventTimeline } from "@/components/cases/event-timeline";
import { HashChainIndicator } from "@/components/cases/hash-chain-indicator";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface CaseData {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EventRow {
  id: string;
  caseId: string;
  tenantId: string;
  eventType: string;
  timestamp: string;
  actor: string;
  eventHash: string;
  prevHash: string;
  eventSchemaVersion: string;
  payload: string;
}

interface VerificationResponse {
  chain: {
    valid: boolean;
    eventCount: number;
    error?: string;
    brokenAtIndex?: number;
  };
  consistency: {
    consistent: boolean;
    ledgerEventCount: number;
    dbEventCount: number;
    missingInDb: string[];
    extraInDb: string[];
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainStatus, setChainStatus] = useState<
    "valid" | "invalid" | "loading" | "idle"
  >("idle");
  const [chainEventCount, setChainEventCount] = useState<number | undefined>();
  const [chainError, setChainError] = useState<string | undefined>();

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        case: CaseData;
        events: EventRow[];
      };
      setCaseData(data.case);
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入案件失敗");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void fetchCase();
  }, [fetchCase]);

  async function handleVerifyChain() {
    setChainStatus("loading");
    setChainError(undefined);
    try {
      const res = await fetch(`/api/cases/${caseId}/verify`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as VerificationResponse;
      setChainStatus(data.chain.valid ? "valid" : "invalid");
      setChainEventCount(data.chain.eventCount);
      setChainError(data.chain.error);
    } catch (err) {
      setChainStatus("invalid");
      setChainError(
        err instanceof Error ? err.message : "驗證失敗"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">找不到案件</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            <p>{error ?? "無法載入案件資料。"}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void fetchCase()}
            >
              重試
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    draft: "border-blue-500/30 bg-blue-500/5",
    active: "border-green-500/30 bg-green-500/5",
    review: "border-yellow-500/30 bg-yellow-500/5",
    delivered: "border-primary/30 bg-primary/5",
    archived: "border-muted bg-muted/50",
  };

  const guidanceMap: Record<string, React.ReactNode> = {
    draft:
      "案件為草稿狀態。準備好後，將狀態改為進行中以開始審計。",
    active: (
      <>
        案件進行中。請執行抽樣、附加文件並記錄發現事項。{" "}
        <Link href="/audit" className="text-primary hover:underline">
          前往審計
        </Link>
        。
      </>
    ),
    review: "案件審閱中。等待核准或退回修改。",
    delivered:
      "案件已交付。完成後可進行封存。",
    archived: "案件已封存。所有記錄保持不可變。",
  };

  const currentStatusStyle =
    statusStyles[caseData.status] ?? "border-muted bg-muted/50";
  const guidanceText =
    guidanceMap[caseData.status] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{caseData.title}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {caseData.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HashChainIndicator
            status={chainStatus}
            eventCount={chainEventCount}
            error={chainError}
          />
          <Button
            variant="outline"
            onClick={() => void handleVerifyChain()}
            disabled={chainStatus === "loading"}
          >
            <ShieldCheck className="h-4 w-4" />
            驗證雜湊鏈
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="documents">文件</TabsTrigger>
          <TabsTrigger value="ledger">帳本</TabsTrigger>
          <TabsTrigger value="findings">發現事項</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>案件詳情</CardTitle>
            </CardHeader>
            <CardContent>
              {guidanceText && (
                <div
                  className={`mb-4 rounded-lg border p-3 text-sm ${currentStatusStyle}`}
                >
                  {guidanceText}
                </div>
              )}
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    狀態
                  </dt>
                  <dd className="mt-1">
                    <CaseStatusBadge status={caseData.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    租戶
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {caseData.tenantId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    建立者
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {caseData.createdBy}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    指派給
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {caseData.assignedTo ?? "未指派"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    建立時間
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(caseData.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    最後更新
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(caseData.updatedAt)}
                  </dd>
                </div>
                {caseData.description && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      說明
                    </dt>
                    <dd className="mt-1 text-sm">{caseData.description}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>文件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileText className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">尚無文件</p>
                <p className="text-sm">
                  附加至案件的文件將顯示於此。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>事件帳本</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTimeline events={events} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings">
          <Card>
            <CardHeader>
              <CardTitle>發現事項</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <AlertTriangle className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">尚無發現事項</p>
                <p className="text-sm">
                  <Link
                    href="/audit/findings"
                    className="text-primary hover:underline"
                  >
                    前往審計 → 發現事項
                  </Link>{" "}
                  記錄並關聯發現事項。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
