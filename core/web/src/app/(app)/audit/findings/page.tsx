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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/audit/severity-badge";
import { FindingStatusBadge } from "@/components/audit/finding-status-badge";

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

  useEffect(() => {
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Findings</h1>

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={severity}
          onValueChange={(v) => updateFilters("severity", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="remediated">Remediated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${findings.length} findings`}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Finding ID</TableHead>
              <TableHead className="w-[100px]">Control ID</TableHead>
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[140px]">Detection Method</TableHead>
              <TableHead className="w-[140px]">Created At</TableHead>
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
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No findings match the selected filters.
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
