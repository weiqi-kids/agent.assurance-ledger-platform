import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Clock,
  type LucideIcon,
} from "lucide-react";

interface ActivityItem {
  eventType: string;
  caseTitle: string;
  actor: string;
  timestamp: string;
}

const eventIconMap: Record<string, LucideIcon> = {
  CASE_CREATED: Plus,
  CASE_UPDATED: Edit,
  CASE_STATUS_CHANGED: CheckCircle,
  CASE_DELETED: Trash2,
  FINDING_ADDED: AlertTriangle,
  EVIDENCE_UPLOADED: FileText,
};

const eventLabelMap: Record<string, string> = {
  CASE_CREATED: "案件建立",
  CASE_UPDATED: "案件更新",
  CASE_STATUS_CHANGED: "狀態變更",
  CASE_DELETED: "案件刪除",
  FINDING_ADDED: "新增發現",
  EVIDENCE_UPLOADED: "上傳證據",
};

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "剛剛";
    if (diffMins < 60) return `${diffMins} 分鐘前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小時前`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} 天前`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return timestamp;
  }
}

function truncateActor(actor: string, maxLen = 12): string {
  if (actor.length <= maxLen) return actor;
  return actor.slice(0, maxLen) + "...";
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Clock className="mb-2 h-8 w-8" />
        <p className="text-sm">無近期活動</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const Icon = eventIconMap[item.eventType] ?? FileText;
        const label = eventLabelMap[item.eventType] ?? item.eventType;

        return (
          <div key={index} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{label}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.caseTitle}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                {truncateActor(item.actor)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(item.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
