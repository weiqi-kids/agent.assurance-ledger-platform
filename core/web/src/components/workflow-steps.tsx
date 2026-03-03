"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  href: string;
  status: "done" | "current" | "pending";
}

export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => (
        <Link
          key={step.number}
          href={step.href}
          className={`group flex items-start gap-3 rounded-lg border p-4 transition-colors ${
            step.status === "current"
              ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
              : step.status === "done"
                ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                : "border-muted hover:bg-accent/50"
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              step.status === "done"
                ? "bg-green-500 text-white"
                : step.status === "current"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step.status === "done" ? (
              <Check className="h-4 w-4" />
            ) : (
              step.number
            )}
          </div>
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${
                step.status === "pending" ? "text-muted-foreground" : ""
              }`}
            >
              {step.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
