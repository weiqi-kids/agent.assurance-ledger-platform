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
import { Plus } from "lucide-react";

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
        <h1 className="text-2xl font-bold">Sampling Sessions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Generate New Sample
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate New Sample</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period">Period (e.g. 2026-Q1)</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-Q1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="controlId">Control ID</Label>
                <Input
                  id="controlId"
                  value={controlId}
                  onChange={(e) => setControlId(e.target.value)}
                  placeholder="AC-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed">Seed (optional, auto-generated if empty)</Label>
                <Input
                  id="seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="12345"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="population">Population (one item per line)</Label>
                <textarea
                  id="population"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={populationInput}
                  onChange={(e) => setPopulationInput(e.target.value)}
                  placeholder={"ITEM-001\nITEM-002\nITEM-003\n..."}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Generating..." : "Generate Sample"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Sampling Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Period</TableHead>
                <TableHead className="w-[100px]">Control ID</TableHead>
                <TableHead className="w-[80px]">Seed</TableHead>
                <TableHead className="w-[100px]">Sample Size</TableHead>
                <TableHead className="w-[120px]">Engine</TableHead>
                <TableHead className="w-[140px]">Created At</TableHead>
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
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No sampling sessions yet.
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
