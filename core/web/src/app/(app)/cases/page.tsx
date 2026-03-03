"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { Briefcase, Plus, Loader2 } from "lucide-react";

interface CaseRow {
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

const STATUS_TABS = ["all", "draft", "active", "review", "delivered", "archived"];

const TAB_LABELS: Record<string, string> = {
  all: "全部",
  draft: "草稿",
  active: "進行中",
  review: "審閱",
  delivered: "已交付",
  archived: "已封存",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchCases = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = status !== "all" ? `?status=${status}` : "";
      const res = await fetch(`/api/cases${params}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { cases: CaseRow[] };
      setCases(data.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入案件失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCases(activeTab);
  }, [activeTab, fetchCases]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件</h1>
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="h-4 w-4" />
            建立案件
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>案件管理</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {TAB_LABELS[tab] ?? tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {STATUS_TABS.map((tab) => (
              <TabsContent key={tab} value={tab}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="py-8 text-center text-destructive">
                    <p>{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => void fetchCases(activeTab)}
                    >
                      重試
                    </Button>
                  </div>
                ) : cases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Briefcase className="mb-4 h-12 w-12" />
                    <p className="text-lg font-medium">尚無案件</p>
                    <p className="text-sm">
                      建立案件後將顯示於此。
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/cases/new">建立案件</Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>標題</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>建立者</TableHead>
                        <TableHead>建立時間</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Link
                              href={`/cases/${c.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {c.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <CaseStatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {c.createdBy}
                          </TableCell>
                          <TableCell>{formatDate(c.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
