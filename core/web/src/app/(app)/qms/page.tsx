"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, MessageSquareWarning, Loader2 } from "lucide-react";

interface CountSummary {
  risks: number;
  documents: number;
  complaints: number;
}

export default function QmsPage() {
  const [counts, setCounts] = useState<CountSummary>({
    risks: 0,
    documents: 0,
    complaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [risksRes, docsRes, complaintsRes] = await Promise.allSettled([
          fetch("/api/qms/risk-register"),
          fetch("/api/qms/document-index"),
          fetch("/api/qms/complaints"),
        ]);

        const newCounts: CountSummary = { risks: 0, documents: 0, complaints: 0 };

        if (risksRes.status === "fulfilled" && risksRes.value.ok) {
          const data = (await risksRes.value.json()) as {
            risks: unknown[];
          };
          newCounts.risks = data.risks.length;
        }
        if (docsRes.status === "fulfilled" && docsRes.value.ok) {
          const data = (await docsRes.value.json()) as {
            documents: unknown[];
          };
          newCounts.documents = data.documents.length;
        }
        if (complaintsRes.status === "fulfilled" && complaintsRes.value.ok) {
          const data = (await complaintsRes.value.json()) as {
            complaints: unknown[];
          };
          newCounts.complaints = data.complaints.length;
        }

        setCounts(newCounts);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quality Management System</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quality Management System</h1>
      <p className="text-muted-foreground">
        Manage risk registers, document control, and client complaints under
        ISQM1 / ISO 9001 requirements.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/qms/risk-register">
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Risk Register
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.risks}</div>
              <CardDescription>
                Identified risks with KRI monitoring
              </CardDescription>
              <Badge variant="outline" className="mt-2">
                View All
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/qms/document-index">
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Document Index
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.documents}</div>
              <CardDescription>
                Policies, SOPs, and controlled documents
              </CardDescription>
              <Badge variant="outline" className="mt-2">
                View All
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/qms/complaints">
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Complaints
              </CardTitle>
              <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.complaints}</div>
              <CardDescription>
                Client complaints with GitHub Issue tracking
              </CardDescription>
              <Badge variant="outline" className="mt-2">
                View All
              </Badge>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
