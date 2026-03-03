"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">錯誤</h1>
      <p className="text-muted-foreground">
        {error.message || "發生錯誤"}
      </p>
      <Button onClick={reset}>重試</Button>
    </div>
  );
}
