"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { FindingStatusBadge } from "@/components/audit/finding-status-badge";
import {
  ClipboardCheck,
  FileSearch,
  PackageCheck,
  Plus,
  ArrowRight,
} from "lucide-react";

interface FindingRow {
  findingId: string;
  controlId: string | null;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
}

interface SampleRow {
  id: string;
}

interface PackRow {
  id: string;
  status: string;
}

export default function AuditPage() {
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/audit/findings").then((r) => r.json()),
      fetch("/api/audit/samples").then((r) => r.json()),
      fetch("/api/audit/evidence-packs").then((r) => r.json()),
    ])
      .then(([findingsData, samplesData, packsData]) => {
        setFindings(
          (findingsData as { findings: FindingRow[] }).findings ?? []
        );
        setSamples(
          (samplesData as { samples: SampleRow[] }).samples ?? []
        );
        setPacks(
          (packsData as { packs: PackRow[] }).packs ?? []
        );
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const openFindings = findings.filter(
    (f) => f.status === "open" || f.status === "investigating"
  );
  const signedPacks = packs.filter((p) => p.status === "signed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/audit/samples">
              <Plus className="mr-1 h-4 w-4" />
              New Sample
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/audit/evidence-packs">
              <PackageCheck className="mr-1 h-4 w-4" />
              Evidence Packs
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Findings</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                openFindings.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">open findings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sampling</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                samples.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">sampling sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Evidence Packs</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                `${signedPacks.length}/${packs.length}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">signed / total</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Findings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Findings</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/audit/findings">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Finding ID</TableHead>
                <TableHead className="w-[100px]">Control</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
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
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : findings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No findings recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                findings.slice(0, 5).map((finding) => (
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
                    <TableCell className="max-w-[300px] truncate">
                      {finding.description}
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
