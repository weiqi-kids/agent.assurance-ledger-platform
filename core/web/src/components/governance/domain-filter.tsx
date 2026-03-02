"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOMAINS = [
  { value: "all", label: "All Domains" },
  { value: "AC", label: "AC - Access Control" },
  { value: "CM", label: "CM - Change Management" },
  { value: "PI", label: "PI - Processing Integrity" },
  { value: "CF", label: "CF - Configuration" },
  { value: "IR", label: "IR - Incident Response" },
  { value: "MN", label: "MN - Monitoring" },
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
