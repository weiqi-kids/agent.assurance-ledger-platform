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
  { key: "system-admin", label: "系統管理員" },
  { key: "tech-lead", label: "技術主管" },
  { key: "quality-manager", label: "品質經理" },
  { key: "engagement-partner", label: "業務合夥人" },
  { key: "auditor", label: "審計師" },
  { key: "viewer", label: "觀察者" },
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
          圖例：
        </span>
        <Badge variant="default">R = 負責</Badge>
        <Badge variant="destructive">A = 當責</Badge>
        <Badge variant="secondary">C = 諮詢</Badge>
        <Badge variant="outline">I = 知會</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-background w-[100px]">
                控制點 ID
              </TableHead>
              <TableHead className="w-[70px]">領域</TableHead>
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
                  無 RACI 資料。
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
