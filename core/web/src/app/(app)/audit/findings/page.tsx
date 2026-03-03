"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { FindingStatusBadge } from "@/components/audit/finding-status-badge";
import { AlertTriangle, Plus } from "lucide-react";

interface FindingRow {
  findingId: string;
  controlId: string | null;
  severity: string;
  status: string;
  detectionMethod: string;
  description: string;
  createdAt: string;
}

export default function FindingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  // Create dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form fields
  const [formControlId, setFormControlId] = useState("");
  const [formSeverity, setFormSeverity] = useState("medium");
  const [formDetectionMethod, setFormDetectionMethod] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const severity = searchParams.get("severity") ?? "all";
  const status = searchParams.get("status") ?? "all";

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/audit/findings?${params.toString()}`);
    },
    [searchParams, router]
  );

  const fetchFindings = useCallback(() => {
    const fetchId = ++fetchIdRef.current;
    const params = new URLSearchParams();
    if (severity !== "all") params.set("severity", severity);
    if (status !== "all") params.set("status", status);

    fetch(`/api/audit/findings?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { findings: FindingRow[] }) => {
        if (fetchId === fetchIdRef.current) {
          setFindings(data.findings ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (fetchId === fetchIdRef.current) {
          setFindings([]);
          setLoading(false);
        }
      });
  }, [severity, status]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/audit/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId: formControlId || undefined,
          severity: formSeverity,
          detectionMethod: formDetectionMethod,
          description: formDescription,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setIsDialogOpen(false);
      setFormControlId("");
      setFormSeverity("medium");
      setFormDetectionMethod("");
      setFormDescription("");
      setLoading(true);
      fetchFindings();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "建立發現失敗"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">發現事項</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              新增發現
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>新增發現</DialogTitle>
              <DialogDescription>
                記錄一筆新的審計發現事項，系統將自動指派唯一發現 ID。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="controlId">控制點 ID（選填）</Label>
                <Input
                  id="controlId"
                  value={formControlId}
                  onChange={(e) => setFormControlId(e.target.value)}
                  placeholder="e.g. AC-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">嚴重程度</Label>
                <Select value={formSeverity} onValueChange={setFormSeverity}>
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="選擇嚴重程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="detectionMethod">偵測方式</Label>
                <Input
                  id="detectionMethod"
                  value={formDetectionMethod}
                  onChange={(e) => setFormDetectionMethod(e.target.value)}
                  placeholder="例：抽樣、查驗、訪談"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">說明</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="詳細描述發現事項…"
                  required
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "建立中…" : "建立發現事項"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={severity}
          onValueChange={(v) => updateFilters("severity", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有嚴重程度</SelectItem>
            <SelectItem value="Critical">嚴重</SelectItem>
            <SelectItem value="High">高</SelectItem>
            <SelectItem value="Medium">中</SelectItem>
            <SelectItem value="Low">低</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => updateFilters("status", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有狀態</SelectItem>
            <SelectItem value="open">開放</SelectItem>
            <SelectItem value="investigating">調查中</SelectItem>
            <SelectItem value="remediated">已補救</SelectItem>
            <SelectItem value="closed">已關閉</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {loading ? "載入中..." : `${findings.length} 筆發現`}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">發現 ID</TableHead>
              <TableHead className="w-[100px]">控制點 ID</TableHead>
              <TableHead className="w-[100px]">嚴重程度</TableHead>
              <TableHead className="w-[120px]">狀態</TableHead>
              <TableHead className="w-[140px]">偵測方式</TableHead>
              <TableHead className="w-[140px]">建立時間</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : findings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40">
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <AlertTriangle className="mb-3 h-10 w-10" />
                    <p className="text-sm font-medium">沒有符合篩選條件的發現事項</p>
                    <p className="mt-1 text-xs">
                      請調整上方篩選條件，或建立第一筆發現事項，開始追蹤審計結果。
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      新增發現
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              findings.map((finding) => (
                <TableRow key={finding.findingId}>
                  <TableCell>
                    <Link
                      href={`/audit/findings/${finding.findingId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {finding.findingId}
                    </Link>
                  </TableCell>
                  <TableCell>{finding.controlId ?? "-"}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={finding.severity} />
                  </TableCell>
                  <TableCell>
                    <FindingStatusBadge status={finding.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {finding.detectionMethod}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(finding.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
