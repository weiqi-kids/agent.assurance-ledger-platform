"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCheck, Plus, ShieldCheck } from "lucide-react";

interface PackRow {
  id: string;
  period: string;
  generatedAt: string;
  generatedBy: string;
  artifactCount: number;
  packHash: string;
  signedBy: string | null;
  approvalTimestamp: string | null;
  status: string;
}

export default function EvidencePacksPage() {
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);
  const [period, setPeriod] = useState("");

  const fetchPacks = useCallback(() => {
    setLoading(true);
    fetch("/api/audit/evidence-packs")
      .then((res) => res.json())
      .then((data: { packs: PackRow[] }) => {
        setPacks(data.packs ?? []);
        setLoading(false);
      })
      .catch(() => {
        setPacks([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  const handleCreate = useCallback(async () => {
    if (!period) return;
    setCreating(true);
    try {
      const res = await fetch("/api/audit/evidence-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setPeriod("");
        fetchPacks();
      }
    } finally {
      setCreating(false);
    }
  }, [period, fetchPacks]);

  const handleSign = useCallback(
    async (packId: string) => {
      setSigning(packId);
      try {
        const res = await fetch(`/api/audit/evidence-packs/${packId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sign" }),
        });
        if (res.ok) {
          fetchPacks();
        }
      } finally {
        setSigning(null);
      }
    },
    [fetchPacks]
  );

  function truncateHash(hash: string): string {
    if (hash.length <= 24) return hash;
    return hash.slice(0, 20) + "...";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evidence Packs</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              產生證據包
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Evidence Pack</DialogTitle>
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
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                <PackageCheck className="mr-1 h-4 w-4" />
                {creating ? "Generating..." : "Generate Pack"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Evidence Packs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Period</TableHead>
                <TableHead className="w-[80px]">Artifacts</TableHead>
                <TableHead className="w-[200px]">Pack Hash</TableHead>
                <TableHead className="w-[140px]">Generated At</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
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
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : packs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                      <PackageCheck className="mb-3 h-10 w-10" />
                      <p className="text-sm font-medium">尚無證據包</p>
                      <p className="mt-1 text-xs">完成審計後產生第一個證據包。</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
                        產生證據包
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                packs.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell className="font-medium">{pack.period}</TableCell>
                    <TableCell>{pack.artifactCount}</TableCell>
                    <TableCell className="font-mono text-xs" title={pack.packHash}>
                      {truncateHash(pack.packHash)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(pack.generatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {pack.status === "signed" ? (
                        <Badge variant="secondary">Signed</Badge>
                      ) : (
                        <Badge variant="outline">{pack.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {pack.status !== "signed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSign(pack.id)}
                          disabled={signing === pack.id}
                        >
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          {signing === pack.id ? "..." : "Sign"}
                        </Button>
                      )}
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
