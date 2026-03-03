"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DocTypeBadge } from "@/components/qms/doc-type-badge";
import { Plus, Loader2, FileText } from "lucide-react";

interface DocRow {
  id: string;
  documentId: string;
  title: string;
  documentType: string;
  version: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "Policy", label: "政策" },
  { value: "SOP", label: "標準作業程序" },
  { value: "Work Instruction", label: "工作指引" },
  { value: "Form", label: "表單" },
  { value: "Template", label: "範本" },
];
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "approved", label: "已核准" },
  { value: "superseded", label: "已取代" },
  { value: "archived", label: "已封存" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
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

export default function DocumentIndexPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (docTypeFilter !== "all") params.set("docType", docTypeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const qs = params.toString();
      const res = await fetch(`/api/qms/document-index${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { documents: DocRow[] };
      setDocs(data.documents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "載入文件失敗"
      );
    } finally {
      setLoading(false);
    }
  }, [docTypeFilter, statusFilter]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/qms/document-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          documentType: form.get("documentType"),
          version: form.get("version"),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setDialogOpen(false);
      void fetchDocs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "建立文件失敗"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文件索引</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              新增文件
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>新增文件</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">標題</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="文件標題"
                />
              </div>
              <div>
                <Label htmlFor="documentType">文件類型</Label>
                <select
                  id="documentType"
                  name="documentType"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="Policy">政策</option>
                  <option value="SOP">標準作業程序</option>
                  <option value="Work Instruction">工作指引</option>
                  <option value="Form">表單</option>
                  <option value="Template">範本</option>
                </select>
              </div>
              <div>
                <Label htmlFor="version">版本</Label>
                <Input
                  id="version"
                  name="version"
                  required
                  placeholder="1.0"
                  defaultValue="1.0"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  建立
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">類型：</Label>
          <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">狀態：</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>受控文件</CardTitle>
        </CardHeader>
        <CardContent>
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
                onClick={() => void fetchDocs()}
              >
                Retry
              </Button>
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">尚無文件</p>
              <p className="text-sm">
                建立文件後將顯示於此。
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
                新增文件
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件 ID</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>核准人</TableHead>
                  <TableHead>建立時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">
                      {d.documentId}
                    </TableCell>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>
                      <DocTypeBadge docType={d.documentType} />
                    </TableCell>
                    <TableCell>{d.version}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.status === "approved"
                            ? "default"
                            : d.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                        className="capitalize"
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{d.approvedBy ?? "-"}</TableCell>
                    <TableCell>{formatDate(d.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
