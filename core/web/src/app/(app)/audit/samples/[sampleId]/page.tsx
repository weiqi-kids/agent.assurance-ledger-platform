"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

interface SampleDetail {
  id: string;
  period: string;
  controlId: string;
  seed: number;
  populationQuery: string;
  sampleSize: number;
  operator: string;
  programVersion: string;
  samplingEngineVersion: string;
  createdAt: string;
}

export default function SampleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sampleId = params.sampleId as string;

  const [sample, setSample] = useState<SampleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/audit/samples/${sampleId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: { sample: SampleDetail }) => {
        setSample(data.sample);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [sampleId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <p className="text-muted-foreground">Sample not found.</p>
      </div>
    );
  }

  // Build CSV metadata header for display
  const csvHeader = [
    `# seed: ${sample.seed}`,
    `# population_query: ${sample.populationQuery}`,
    `# sample_size: ${sample.sampleSize}`,
    `# sampled_at: ${sample.createdAt}`,
    `# operator: ${sample.operator}`,
    `# program_version: ${sample.programVersion}`,
    `# sampling_engine_version: ${sample.samplingEngineVersion}`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          Sample: {sample.period} / {sample.controlId}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sample Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Period</span>
              <span>{sample.period}</span>

              <span className="text-muted-foreground">Control ID</span>
              <span>{sample.controlId}</span>

              <span className="text-muted-foreground">Seed</span>
              <span className="font-mono">{sample.seed}</span>

              <span className="text-muted-foreground">Sample Size</span>
              <span>{sample.sampleSize}</span>

              <span className="text-muted-foreground">Operator</span>
              <span>{sample.operator}</span>

              <span className="text-muted-foreground">Program Version</span>
              <span className="font-mono text-xs">{sample.programVersion}</span>

              <span className="text-muted-foreground">Engine Version</span>
              <span>v{sample.samplingEngineVersion}</span>

              <span className="text-muted-foreground">Created At</span>
              <span>{new Date(sample.createdAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* CSV Header Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CSV Metadata Header</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">
              {csvHeader}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Population Query */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Population Query</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{sample.populationQuery}</p>
        </CardContent>
      </Card>
    </div>
  );
}
