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
import { FrameworkBadge } from "@/components/governance/framework-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface FrameworkMapping {
  controlId: string;
  domain: string;
  soc1Objective: string;
  isqm1Paragraph: string;
  iso9001Clause: string;
  explanation: string;
}

export default function FrameworkMappingPage() {
  const [mappings, setMappings] = useState<FrameworkMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/governance/framework-mapping")
      .then((res) => res.json())
      .then((data: { mappings: FrameworkMapping[] }) => {
        setMappings(data.mappings);
      })
      .catch(() => {
        setMappings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Frameworks:</span>
        <FrameworkBadge framework="SOC1" />
        <FrameworkBadge framework="ISQM1" />
        <FrameworkBadge framework="ISO9001" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Control ID</TableHead>
              <TableHead className="w-[70px]">Domain</TableHead>
              <TableHead>SOC1 Objective</TableHead>
              <TableHead>ISQM1 Paragraph</TableHead>
              <TableHead>ISO 9001 Clause</TableHead>
              <TableHead className="w-[60px]">Detail</TableHead>
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
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No framework mapping data available.
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.controlId}>
                  <TableCell className="font-medium">
                    {mapping.controlId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{mapping.domain}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {mapping.soc1Objective}
                  </TableCell>
                  <TableCell className="text-sm">
                    {mapping.isqm1Paragraph}
                  </TableCell>
                  <TableCell className="text-sm">
                    {mapping.iso9001Clause}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {mapping.controlId} Framework Mapping
                          </DialogTitle>
                          <DialogDescription>
                            Cross-framework mapping explanation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <FrameworkBadge framework="SOC1" />
                            <span className="text-sm">
                              {mapping.soc1Objective}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <FrameworkBadge framework="ISQM1" />
                            <span className="text-sm">
                              {mapping.isqm1Paragraph}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <FrameworkBadge framework="ISO9001" />
                            <span className="text-sm">
                              {mapping.iso9001Clause}
                            </span>
                          </div>
                          <div>
                            <label className="text-xs font-medium uppercase text-muted-foreground">
                              Explanation
                            </label>
                            <p className="mt-1 text-sm">
                              {mapping.explanation}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
