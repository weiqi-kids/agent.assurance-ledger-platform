import { cn } from "@/lib/utils";

interface DomainHealth {
  domain: string;
  domainName: string;
  controlCount: number;
  noFindings: number;
  mediumFindings: number;
  highCriticalFindings: number;
}

const domainNameMap: Record<string, string> = {
  AC: "存取控制",
  CM: "變更管理",
  PI: "處理完整性",
  CF: "客戶檔案",
  IR: "事件回應",
  MN: "監控",
};

function getHealthColor(item: DomainHealth): string {
  if (item.highCriticalFindings > 0) return "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800";
  if (item.mediumFindings > 0) return "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800";
  return "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800";
}

function getHealthLabel(item: DomainHealth): string {
  if (item.highCriticalFindings > 0) return "嚴重/高風險問題";
  if (item.mediumFindings > 0) return "中度風險問題";
  return "健康";
}

function getHealthTextColor(item: DomainHealth): string {
  if (item.highCriticalFindings > 0) return "text-red-700 dark:text-red-400";
  if (item.mediumFindings > 0) return "text-yellow-700 dark:text-yellow-400";
  return "text-green-700 dark:text-green-400";
}

export function ControlHeatmap({ data }: { data: DomainHealth[] }) {
  const domains = ["AC", "CM", "PI", "CF", "IR", "MN"];
  const domainData = domains.map((d) => {
    const found = data.find((item) => item.domain === d);
    return (
      found ?? {
        domain: d,
        domainName: domainNameMap[d] ?? d,
        controlCount: 0,
        noFindings: 0,
        mediumFindings: 0,
        highCriticalFindings: 0,
      }
    );
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {domainData.map((item) => (
        <div
          key={item.domain}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            getHealthColor(item)
          )}
        >
          <div className="text-sm font-bold">{item.domain}</div>
          <div className="text-xs text-muted-foreground">
            {item.domainName}
          </div>
          <div className="mt-2 text-lg font-semibold">
            {item.controlCount}
          </div>
          <div className="text-xs text-muted-foreground">個控制點</div>
          <div
            className={cn("mt-1 text-xs font-medium", getHealthTextColor(item))}
          >
            {getHealthLabel(item)}
          </div>
        </div>
      ))}
    </div>
  );
}
