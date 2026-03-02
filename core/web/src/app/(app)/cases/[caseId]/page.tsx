"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { EventTimeline } from "@/components/cases/event-timeline";
import { HashChainIndicator } from "@/components/cases/hash-chain-indicator";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface CaseData {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EventRow {
  id: string;
  caseId: string;
  tenantId: string;
  eventType: string;
  timestamp: string;
  actor: string;
  eventHash: string;
  prevHash: string;
  eventSchemaVersion: string;
  payload: string;
}

interface VerificationResponse {
  chain: {
    valid: boolean;
    eventCount: number;
    error?: string;
    brokenAtIndex?: number;
  };
  consistency: {
    consistent: boolean;
    ledgerEventCount: number;
    dbEventCount: number;
    missingInDb: string[];
    extraInDb: string[];
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainStatus, setChainStatus] = useState<
    "valid" | "invalid" | "loading" | "idle"
  >("idle");
  const [chainEventCount, setChainEventCount] = useState<number | undefined>();
  const [chainError, setChainError] = useState<string | undefined>();

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        case: CaseData;
        events: EventRow[];
      };
      setCaseData(data.case);
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void fetchCase();
  }, [fetchCase]);

  async function handleVerifyChain() {
    setChainStatus("loading");
    setChainError(undefined);
    try {
      const res = await fetch(`/api/cases/${caseId}/verify`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as VerificationResponse;
      setChainStatus(data.chain.valid ? "valid" : "invalid");
      setChainEventCount(data.chain.eventCount);
      setChainError(data.chain.error);
    } catch (err) {
      setChainStatus("invalid");
      setChainError(
        err instanceof Error ? err.message : "Verification failed"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Case Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            <p>{error ?? "Case data could not be loaded."}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void fetchCase()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{caseData.title}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {caseData.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HashChainIndicator
            status={chainStatus}
            eventCount={chainEventCount}
            error={chainError}
          />
          <Button
            variant="outline"
            onClick={() => void handleVerifyChain()}
            disabled={chainStatus === "loading"}
          >
            <ShieldCheck className="h-4 w-4" />
            Verify Chain
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <CaseStatusBadge status={caseData.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Tenant
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {caseData.tenantId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created By
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {caseData.createdBy}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Assigned To
                  </dt>
                  <dd className="mt-1 font-mono text-sm">
                    {caseData.assignedTo ?? "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Created At
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(caseData.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatDate(caseData.updatedAt)}
                  </dd>
                </div>
                {caseData.description && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm">{caseData.description}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileText className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">No documents yet</p>
                <p className="text-sm">
                  Documents will appear here when attached to the case.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>Event Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTimeline events={events} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings">
          <Card>
            <CardHeader>
              <CardTitle>Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <AlertTriangle className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">No findings yet</p>
                <p className="text-sm">
                  Findings will appear here when linked to the case.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
