"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  lastMessage?: {
    content: string;
    role: string;
  } | null;
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <Button variant="ghost" size="icon-xs" onClick={onCreate}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8" />
            <p className="text-xs">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent",
                  activeId === conv.id && "bg-accent"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {conv.title || "Untitled"}
                  </p>
                  {conv.lastMessage && (
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage.content.substring(0, 60)}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-0.5 hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
