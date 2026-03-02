"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Bot, Users } from "lucide-react";

export interface MentionOption {
  id: string;
  name: string;
  providerType?: string;
  isAllAi?: boolean;
}

interface MentionAutocompleteProps {
  options: MentionOption[];
  isOpen: boolean;
  filter: string;
  onSelect: (option: MentionOption) => void;
  position?: { top: number; left: number };
  selectedIndex: number;
}

export function MentionAutocomplete({
  options,
  isOpen,
  filter,
  onSelect,
  position,
  selectedIndex,
}: MentionAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute z-50 w-64 rounded-md border bg-popover p-1 shadow-md"
      style={position ? { bottom: position.top, left: position.left } : {}}
    >
      {filtered.map((option, index) => (
        <button
          key={option.id}
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
            "hover:bg-accent hover:text-accent-foreground",
            index === selectedIndex && "bg-accent text-accent-foreground"
          )}
          onClick={() => onSelect(option)}
          onMouseDown={(e) => e.preventDefault()}
        >
          {option.isAllAi ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex-1 text-left">@{option.name}</span>
          {option.providerType && (
            <span className="text-xs text-muted-foreground capitalize">
              {option.providerType}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
