"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { FindingStatusBadge } from "@/components/audit/finding-status-badge";
import { ArrowLeft, Save } from "lucide-react";

interface FindingDetail {
  id: string;
  findingId: string;
  controlId: string | null;
  caseId: string | null;
  severity: string;
  status: string;
  description: string;
  detectionMethod: string;
  controlEffectivenessImpact: string;
  auditorNotified: number;
  managementResponseText: string | null;
  githubIssueNumber: number | null;
  createdAt: string;
  resolvedAt: string | null;
}

export default function FindingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const findingId = params.findingId as string;

  const [finding, setFinding] = useState<FindingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    fetch(`/api/audit/findings/${findingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: { finding: FindingDetail }) => {
        setFinding(data.finding);
        setStatus(data.finding.status);
        setResponseText(data.finding.managementResponseText ?? "");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [findingId]);

  const handleSave = useCallback(async () => {
    if (!finding) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/audit/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          managementResponseText: responseText || null,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { finding: FindingDetail };
        setFinding(data.finding);
      }
    } finally {
      setSaving(false);
    }
  }, [finding, findingId, status, responseText]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Button>
        <p className="text-muted-foreground">找不到發現事項。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">{finding.findingId}</h1>
        <SeverityBadge severity={finding.severity} />
        <FindingStatusBadge status={finding.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Finding Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">發現詳情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">控制點 ID</span>
              <span>{finding.controlId ?? "-"}</span>

              <span className="text-muted-foreground">案件 ID</span>
              <span>{finding.caseId ?? "-"}</span>

              <span className="text-muted-foreground">嚴重程度</span>
              <span>{finding.severity}</span>

              <span className="text-muted-foreground">偵測方式</span>
              <span>{finding.detectionMethod}</span>

              <span className="text-muted-foreground">影響</span>
              <span>{finding.controlEffectivenessImpact}</span>

              <span className="text-muted-foreground">已通知審計師</span>
              <span>{finding.auditorNotified ? "是" : "否"}</span>

              <span className="text-muted-foreground">建立時間</span>
              <span>{new Date(finding.createdAt).toLocaleString()}</span>

              <span className="text-muted-foreground">解決時間</span>
              <span>
                {finding.resolvedAt
                  ? new Date(finding.resolvedAt).toLocaleString()
                  : "-"}
              </span>

              {finding.githubIssueNumber && (
                <>
                  <span className="text-muted-foreground">GitHub Issue</span>
                  <span>#{finding.githubIssueNumber}</span>
                </>
              )}
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">說明</p>
              <p className="mt-1 text-sm">{finding.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Update Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">更新</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">開放</SelectItem>
                  <SelectItem value="investigating">調查中</SelectItem>
                  <SelectItem value="remediated">已補救</SelectItem>
                  <SelectItem value="closed">已關閉</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseText">管理層回應 / 補救說明</Label>
              <Textarea
                id="responseText"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="輸入補救計畫或管理層回應..."
                rows={6}
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "儲存中..." : "儲存變更"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
