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

const DOC_TYPE_OPTIONS = ["all", "Policy", "SOP", "Work Instruction", "Form", "Template"];
const STATUS_OPTIONS = ["all", "draft", "approved", "superseded", "archived"];

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
        err instanceof Error ? err.message : "Failed to load documents"
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
        err instanceof Error ? err.message : "Failed to create document"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Document Index</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Document title"
                />
              </div>
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <select
                  id="documentType"
                  name="documentType"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="Policy">Policy</option>
                  <option value="SOP">SOP</option>
                  <option value="Work Instruction">Work Instruction</option>
                  <option value="Form">Form</option>
                  <option value="Template">Template</option>
                </select>
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
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
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Type:</Label>
          <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controlled Documents</CardTitle>
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
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm">
                Documents will appear here once created.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Created At</TableHead>
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
