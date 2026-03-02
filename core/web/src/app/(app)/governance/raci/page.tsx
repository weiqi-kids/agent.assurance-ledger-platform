"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type RaciValue = "R" | "A" | "C" | "I" | "-";

interface RaciEntry {
  controlId: string;
  domain: string;
  roles: Record<string, RaciValue>;
}

const ROLE_COLUMNS = [
  { key: "system-admin", label: "System Admin" },
  { key: "tech-lead", label: "Tech Lead" },
  { key: "quality-manager", label: "Quality Mgr" },
  { key: "engagement-partner", label: "Eng. Partner" },
  { key: "auditor", label: "Auditor" },
  { key: "viewer", label: "Viewer" },
];

const RACI_STYLES: Record<
  RaciValue,
  { variant: "default" | "destructive" | "secondary" | "outline"; label: string }
> = {
  R: { variant: "default", label: "R" },
  A: { variant: "destructive", label: "A" },
  C: { variant: "secondary", label: "C" },
  I: { variant: "outline", label: "I" },
  "-": { variant: "outline", label: "-" },
};

export default function RaciPage() {
  const [matrix, setMatrix] = useState<RaciEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/governance/raci-matrix")
      .then((res) => res.json())
      .then((data: { matrix: RaciEntry[] }) => {
        setMatrix(data.matrix);
      })
      .catch(() => {
        setMatrix([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Legend:
        </span>
        <Badge variant="default">R = Responsible</Badge>
        <Badge variant="destructive">A = Accountable</Badge>
        <Badge variant="secondary">C = Consulted</Badge>
        <Badge variant="outline">I = Informed</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background w-[100px]">
                Control ID
              </TableHead>
              <TableHead className="w-[70px]">Domain</TableHead>
              {ROLE_COLUMNS.map((col) => (
                <TableHead key={col.key} className="text-center w-[110px]">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  {ROLE_COLUMNS.map((col) => (
                    <TableCell key={col.key} className="text-center">
                      <Skeleton className="mx-auto h-5 w-8" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : matrix.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2 + ROLE_COLUMNS.length}
                  className="text-center text-muted-foreground"
                >
                  No RACI data available.
                </TableCell>
              </TableRow>
            ) : (
              matrix.map((entry) => (
                <TableRow key={entry.controlId}>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium">
                    {entry.controlId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.domain}</Badge>
                  </TableCell>
                  {ROLE_COLUMNS.map((col) => {
                    const value = entry.roles[col.key] ?? "-";
                    const style = RACI_STYLES[value];
                    return (
                      <TableCell key={col.key} className="text-center">
                        {value === "-" ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Badge variant={style.variant} className="text-xs">
                            {style.label}
                          </Badge>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
