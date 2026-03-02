"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface KriDataPoint {
  domain: string;
  threshold: number;
  current: number;
}

export function KriChart({ data }: { data: KriDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No KRI data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="domain"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Legend />
        <Bar dataKey="threshold" name="Threshold" fill="hsl(var(--muted-foreground))" opacity={0.4} />
        <Bar dataKey="current" name="Current">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.current >= entry.threshold
                  ? "hsl(0 84% 60%)"
                  : "hsl(142 76% 36%)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
