"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, MessageSquareWarning, Loader2 } from "lucide-react";
import { WorkflowSteps } from "@/components/workflow-steps";
import type { WorkflowStep } from "@/components/workflow-steps";

interface CountSummary {
  risks: number;
  documents: number;
  complaints: number;
}

export default function QmsPage() {
  const [counts, setCounts] = useState<CountSummary>({
    risks: 0,
    documents: 0,
    complaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [risksRes, docsRes, complaintsRes] = await Promise.allSettled([
          fetch("/api/qms/risk-register"),
          fetch("/api/qms/document-index"),
          fetch("/api/qms/complaints"),
        ]);

        const newCounts: CountSummary = { risks: 0, documents: 0, complaints: 0 };

        if (risksRes.status === "fulfilled" && risksRes.value.ok) {
          const data = (await risksRes.value.json()) as {
            risks: unknown[];
          };
          newCounts.risks = data.risks.length;
        }
        if (docsRes.status === "fulfilled" && docsRes.value.ok) {
          const data = (await docsRes.value.json()) as {
            documents: unknown[];
          };
          newCounts.documents = data.documents.length;
        }
        if (complaintsRes.status === "fulfilled" && complaintsRes.value.ok) {
          const data = (await complaintsRes.value.json()) as {
            complaints: unknown[];
          };
          newCounts.complaints = data.complaints.length;
        }

        setCounts(newCounts);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">品質管理系統</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">品質管理系統</h1>
      <p className="text-muted-foreground">
        依 ISQM1 / ISO 9001 要求，管理風險登記簿、文件管控及客訴處理。
      </p>

      {/* Workflow Steps */}
      {(() => {
        const qmsSteps: WorkflowStep[] = [
          {
            number: 1,
            title: "風險登記簿",
            description: "識別與評估營運風險",
            href: "/qms/risk-register",
            status: counts.risks > 0 ? "done" : "current",
          },
          {
            number: 2,
            title: "文件索引",
            description: "管理政策、標準作業程序及工作指引",
            href: "/qms/document-index",
            status:
              counts.documents > 0
                ? "done"
                : counts.risks > 0
                  ? "current"
                  : "pending",
          },
          {
            number: 3,
            title: "客訴管理",
            description: "追蹤與處理客戶申訴",
            href: "/qms/complaints",
            status: counts.complaints > 0 ? "done" : "pending",
          },
        ];
        return <WorkflowSteps steps={qmsSteps} />;
      })()}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/qms/risk-register">
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                風險登記簿
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.risks}</div>
              <CardDescription>
                已識別風險及 KRI 監控
              </CardDescription>
              <Badge variant="outline" className="mt-2">
                查看全部
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/qms/document-index">
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                文件索引
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.documents}</div>
              <CardDescription>
                政策、標準作業程序及受控文件
              </CardDescription>
              <Badge variant="outline" className="mt-2">
                查看全部
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/qms/complaints">
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                客訴管理
              </CardTitle>
              <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.complaints}</div>
              <CardDescription>
                客戶申訴及 GitHub Issue 追蹤
              </CardDescription>
              <Badge variant="outline" className="mt-2">
                查看全部
              </Badge>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
