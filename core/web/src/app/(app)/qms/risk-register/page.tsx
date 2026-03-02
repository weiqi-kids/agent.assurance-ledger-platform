"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { KriStatusBadge } from "@/components/qms/kri-status-badge";
import { Plus, Loader2, AlertTriangle } from "lucide-react";

interface RiskRow {
  id: string;
  riskId: string;
  description: string;
  linkedControls: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigationStrategy: string;
  residualRiskJustification: string;
  reviewCycle: string;
  kriThreshold: number | null;
  kriLastValue: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ["all", "active", "mitigated", "accepted", "closed"];
const DOMAIN_OPTIONS = ["all", "AC", "CM", "PI", "CF", "IR", "MN"];

function getControlDomain(linkedControls: string): string {
  try {
    const linked = JSON.parse(linkedControls) as string[];
    if (linked.length > 0) {
      const match = linked[0].match(/^([A-Z]{2})-/);
      if (match) return match[1];
    }
  } catch {
    // ignore
  }
  return "N/A";
}

function truncateText(text: string, maxLen = 40): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

export default function RiskRegisterPage() {
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Detail dialog
  const [detailRisk, setDetailRisk] = useState<RiskRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (domainFilter !== "all") params.set("domain", domainFilter);
      const qs = params.toString();
      const res = await fetch(`/api/qms/risk-register${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { risks: RiskRow[] };
      setRisks(data.risks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load risks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, domainFilter]);

  useEffect(() => {
    void fetchRisks();
  }, [fetchRisks]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/qms/risk-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.get("description"),
          linkedControls: form.get("linkedControls")
            ? (form.get("linkedControls") as string).split(",").map((s) => s.trim())
            : [],
          likelihood: Number(form.get("likelihood")),
          impact: Number(form.get("impact")),
          mitigationStrategy: form.get("mitigationStrategy"),
          residualRiskJustification: form.get("residualRiskJustification") || "",
          reviewCycle: form.get("reviewCycle") || "Quarterly",
          kriThreshold: form.get("kriThreshold")
            ? Number(form.get("kriThreshold"))
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setDialogOpen(false);
      void fetchRisks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create risk");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Risk Register</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Risk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Risk Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Describe the risk..."
                />
              </div>
              <div>
                <Label htmlFor="linkedControls">
                  Linked Controls (comma-separated)
                </Label>
                <Input
                  id="linkedControls"
                  name="linkedControls"
                  placeholder="AC-001, AC-002"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="likelihood">Likelihood (1-5)</Label>
                  <Input
                    id="likelihood"
                    name="likelihood"
                    type="number"
                    min={1}
                    max={5}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="impact">Impact (1-5)</Label>
                  <Input
                    id="impact"
                    name="impact"
                    type="number"
                    min={1}
                    max={5}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mitigationStrategy">Mitigation Strategy</Label>
                <Textarea
                  id="mitigationStrategy"
                  name="mitigationStrategy"
                  required
                  placeholder="Describe mitigation..."
                />
              </div>
              <div>
                <Label htmlFor="residualRiskJustification">
                  Residual Risk Justification
                </Label>
                <Textarea
                  id="residualRiskJustification"
                  name="residualRiskJustification"
                  placeholder="Justification for residual risk..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewCycle">Review Cycle</Label>
                  <Input
                    id="reviewCycle"
                    name="reviewCycle"
                    defaultValue="Quarterly"
                  />
                </div>
                <div>
                  <Label htmlFor="kriThreshold">KRI Threshold</Label>
                  <Input
                    id="kriThreshold"
                    name="kriThreshold"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.0"
                  />
                </div>
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
        <div className="flex items-center gap-2">
          <Label className="text-sm">Domain:</Label>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAIN_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Register Entries</CardTitle>
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
                onClick={() => void fetchRisks()}
              >
                Retry
              </Button>
            </div>
          ) : risks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <AlertTriangle className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No risks found</p>
              <p className="text-sm">
                Risk entries will appear here once created.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk ID</TableHead>
                  <TableHead>Control</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>L</TableHead>
                  <TableHead>I</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>KRI</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setDetailRisk(r);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs">
                      {r.riskId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {getControlDomain(r.linkedControls)}
                    </TableCell>
                    <TableCell>{truncateText(r.description)}</TableCell>
                    <TableCell>{r.likelihood}</TableCell>
                    <TableCell>{r.impact}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.riskScore >= 15
                            ? "destructive"
                            : r.riskScore >= 8
                              ? "default"
                              : "secondary"
                        }
                      >
                        {r.riskScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <KriStatusBadge
                        current={r.kriLastValue}
                        threshold={r.kriThreshold}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Risk Detail: {detailRisk?.riskId}</DialogTitle>
          </DialogHeader>
          {detailRisk && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Description:</span>{" "}
                {detailRisk.description}
              </div>
              <div>
                <span className="font-medium">Linked Controls:</span>{" "}
                {detailRisk.linkedControls}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="font-medium">Likelihood:</span>{" "}
                  {detailRisk.likelihood}
                </div>
                <div>
                  <span className="font-medium">Impact:</span>{" "}
                  {detailRisk.impact}
                </div>
                <div>
                  <span className="font-medium">Risk Score:</span>{" "}
                  {detailRisk.riskScore}
                </div>
              </div>
              <div>
                <span className="font-medium">Mitigation:</span>{" "}
                {detailRisk.mitigationStrategy}
              </div>
              <div>
                <span className="font-medium">Residual Justification:</span>{" "}
                {detailRisk.residualRiskJustification}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">KRI Threshold:</span>{" "}
                  {detailRisk.kriThreshold ?? "N/A"}
                </div>
                <div>
                  <span className="font-medium">KRI Current:</span>{" "}
                  {detailRisk.kriLastValue ?? "N/A"}
                </div>
              </div>
              <div>
                <span className="font-medium">Review Cycle:</span>{" "}
                {detailRisk.reviewCycle}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                <Badge variant="outline" className="capitalize">
                  {detailRisk.status}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
