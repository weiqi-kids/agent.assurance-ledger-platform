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
import { DomainFilter } from "@/components/governance/domain-filter";
import { RiskTierBadge } from "@/components/governance/risk-tier-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ControlRecord {
  controlId: string;
  domain: string;
  controlStatement: string;
  riskTier: string;
  frequency: string;
  ownerRole: string;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

export default function ControlsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [controls, setControls] = useState<ControlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const domain = searchParams.get("domain") ?? "all";
  const riskTier = searchParams.get("riskTier") ?? "all";

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/governance/controls?${params.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    const fetchId = ++fetchIdRef.current;
    const params = new URLSearchParams();
    if (domain !== "all") params.set("domain", domain);
    if (riskTier !== "all") params.set("riskTier", riskTier);

    fetch(`/api/governance/controls?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { controls: ControlRecord[] }) => {
        if (fetchId === fetchIdRef.current) {
          setControls(data.controls);
          setLoading(false);
        }
      })
      .catch(() => {
        if (fetchId === fetchIdRef.current) {
          setControls([]);
          setLoading(false);
        }
      });
  }, [domain, riskTier]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DomainFilter
          value={domain}
          onChange={(v) => updateFilters("domain", v)}
        />
        <Select
          value={riskTier}
          onValueChange={(v) => updateFilters("riskTier", v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Risk Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Tiers</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${controls.length} controls`}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Control ID</TableHead>
              <TableHead className="w-[80px]">Domain</TableHead>
              <TableHead>Statement</TableHead>
              <TableHead className="w-[100px]">Risk Tier</TableHead>
              <TableHead className="w-[110px]">Frequency</TableHead>
              <TableHead className="w-[140px]">Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : controls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No controls found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              controls.map((control) => (
                <TableRow key={control.controlId}>
                  <TableCell>
                    <Link
                      href={`/governance/controls/${control.controlId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {control.controlId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{control.domain}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[400px]">
                    <span title={control.controlStatement}>
                      {truncate(control.controlStatement, 80)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RiskTierBadge tier={control.riskTier} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {control.frequency}
                  </TableCell>
                  <TableCell className="text-sm">
                    {control.ownerRole}
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
