"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSearch, Plus } from "lucide-react";

interface SampleRow {
  id: string;
  period: string;
  controlId: string;
  seed: number;
  sampleSize: number;
  operator: string;
  samplingEngineVersion: string;
  createdAt: string;
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [period, setPeriod] = useState("");
  const [controlId, setControlId] = useState("");
  const [seed, setSeed] = useState("");
  const [populationInput, setPopulationInput] = useState("");

  const fetchSamples = useCallback(() => {
    setLoading(true);
    fetch("/api/audit/samples")
      .then((res) => res.json())
      .then((data: { samples: SampleRow[] }) => {
        setSamples(data.samples ?? []);
        setLoading(false);
      })
      .catch(() => {
        setSamples([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const handleCreate = useCallback(async () => {
    if (!period || !controlId || !populationInput) return;

    setCreating(true);
    try {
      const population = populationInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const body: Record<string, unknown> = {
        period,
        controlId,
        population,
      };
      if (seed) {
        body.seed = parseInt(seed, 10);
      }

      const res = await fetch("/api/audit/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        setPeriod("");
        setControlId("");
        setSeed("");
        setPopulationInput("");
        fetchSamples();
      }
    } finally {
      setCreating(false);
    }
  }, [period, controlId, seed, populationInput, fetchSamples]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">抽樣記錄</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              產生新樣本
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>產生新樣本</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period">期間（例：2026-Q1）</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-Q1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="controlId">控制點 ID</Label>
                <Input
                  id="controlId"
                  value={controlId}
                  onChange={(e) => setControlId(e.target.value)}
                  placeholder="AC-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">種子碼（選填，留空自動產生）</Label>
                <Input
                  id="seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="12345"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="population">母體（每行一筆）</Label>
                <textarea
                  id="population"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={populationInput}
                  onChange={(e) => setPopulationInput(e.target.value)}
                  placeholder={"ITEM-001\nITEM-002\nITEM-003\n..."}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "產生中..." : "產生樣本"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">所有抽樣記錄</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">期間</TableHead>
                <TableHead className="w-[100px]">控制點 ID</TableHead>
                <TableHead className="w-[80px]">種子碼</TableHead>
                <TableHead className="w-[100px]">樣本數</TableHead>
                <TableHead className="w-[120px]">引擎</TableHead>
                <TableHead className="w-[140px]">建立時間</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : samples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                      <FileSearch className="mb-3 h-10 w-10" />
                      <p className="text-sm font-medium">尚無抽樣記錄</p>
                      <p className="mt-1 text-xs">產生第一個樣本，開始測試控制點。</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
                        產生新樣本
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                samples.map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell>
                      <Link
                        href={`/audit/samples/${sample.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {sample.period}
                      </Link>
                    </TableCell>
                    <TableCell>{sample.controlId}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {sample.seed}
                    </TableCell>
                    <TableCell>{sample.sampleSize}</TableCell>
                    <TableCell className="text-sm">
                      v{sample.samplingEngineVersion}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(sample.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
