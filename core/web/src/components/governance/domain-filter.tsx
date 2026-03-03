"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOMAINS = [
  { value: "all", label: "所有領域" },
  { value: "AC", label: "AC - 存取控制" },
  { value: "CM", label: "CM - 變更管理" },
  { value: "PI", label: "PI - 處理完整性" },
  { value: "CF", label: "CF - 組態管理" },
  { value: "IR", label: "IR - 事件回應" },
  { value: "MN", label: "MN - 監控" },
];

export function DomainFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by domain" />
      </SelectTrigger>
      <SelectContent>
        {DOMAINS.map((d) => (
          <SelectItem key={d.value} value={d.value}>
            {d.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
