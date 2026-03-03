"use client";

import { Badge } from "@/components/ui/badge";

interface LedgerEventRow {
  id: string;
  eventType: string;
  timestamp: string;
  actor: string;
  eventHash: string;
  prevHash: string;
  payload: string;
}

interface EventTimelineProps {
  events: LedgerEventRow[];
}

/** Map event types to friendly labels */
const EVENT_TYPE_LABELS: Record<string, string> = {
  CASE_CREATED: "案件建立",
  STATUS_CHANGED: "狀態變更",
  NOTE_ADDED: "新增筆記",
  DOCUMENT_ATTACHED: "附加文件",
  DOCUMENT_REMOVED: "移除文件",
  ASSIGNMENT_CHANGED: "指派變更",
  FINDING_LINKED: "關聯發現",
  FINDING_UNLINKED: "取消關聯發現",
  REVIEW_REQUESTED: "要求審閱",
  REVIEW_COMPLETED: "審閱完成",
  CASE_DELIVERED: "案件交付",
  CASE_ARCHIVED: "案件封存",
};

/** Truncate a hash for display */
function truncateHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 15)}...${hash.slice(-6)}`;
}

/** Format a timestamp for display */
function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

/** Try to extract a summary from the event payload */
function getPayloadSummary(eventType: string, payloadStr: string): string | null {
  try {
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;
    switch (eventType) {
      case "STATUS_CHANGED":
        return `${String(payload.old_status ?? "?")} -> ${String(payload.new_status ?? "?")}`;
      case "NOTE_ADDED":
        return payload.note ? String(payload.note).slice(0, 100) : null;
      case "CASE_CREATED":
        return payload.title ? String(payload.title) : null;
      case "ASSIGNMENT_CHANGED":
        return `指派給：${String(payload.assigned_to ?? "unassigned")}`;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>尚無帳本事件。</p>
      </div>
    );
  }

  // Show events in chronological order (oldest first)
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {sorted.map((event) => {
        const label = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;
        const summary = getPayloadSummary(event.eventType, event.payload);

        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {/* Dot */}
            <div className="relative z-10 mt-1.5 h-[10px] w-[10px] flex-none rounded-full border-2 border-green-500 bg-background" />

            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                操作者：<span className="font-mono text-xs">{event.actor}</span>
              </div>

              {summary && (
                <div className="text-sm">{summary}</div>
              )}

              <div className="text-xs text-muted-foreground font-mono">
                雜湊：{truncateHash(event.eventHash)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
