"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import {
  MentionAutocomplete,
  type MentionOption,
} from "./mention-autocomplete";

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  providers: MentionOption[];
}

export function ChatInput({ onSend, isLoading, providers }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build the full list of mention options
  const mentionOptions: MentionOption[] = [
    { id: "all-ai", name: "all-ai", isAllAi: true },
    ...providers,
  ];

  const filteredOptions = mentionOptions.filter((opt) =>
    opt.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    setShowMentions(false);
  }, [value, isLoading, onSend]);

  const insertMention = useCallback(
    (option: MentionOption) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBefore = value.substring(0, cursorPos);
      const textAfter = value.substring(cursorPos);

      // Find the @ that triggered the autocomplete
      const atIndex = textBefore.lastIndexOf("@");
      if (atIndex === -1) return;

      const newValue =
        textBefore.substring(0, atIndex) + `@${option.name} ` + textAfter;
      setValue(newValue);
      setShowMentions(false);
      setMentionFilter("");
      setSelectedIndex(0);

      // Focus and set cursor after the inserted mention
      setTimeout(() => {
        if (textarea) {
          const newCursorPos = atIndex + option.name.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      const cursorPos = e.target.selectionStart;
      const textBefore = newValue.substring(0, cursorPos);

      // Check if we are typing after an @
      const atMatch = textBefore.match(/@([\w-]*)$/);
      if (atMatch) {
        setShowMentions(true);
        setMentionFilter(atMatch[1]);
        setSelectedIndex(0);
      } else {
        setShowMentions(false);
        setMentionFilter("");
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showMentions && filteredOptions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filteredOptions[selectedIndex]);
          return;
        }
        if (e.key === "Escape") {
          setShowMentions(false);
          return;
        }
      }

      // Submit on Enter (without Shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [
      showMentions,
      filteredOptions,
      selectedIndex,
      insertMention,
      handleSubmit,
    ]
  );

  // Auto-resize the textarea - reset on empty
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="relative border-t bg-background p-4">
      {/* Mention autocomplete popup */}
      <MentionAutocomplete
        options={mentionOptions}
        isOpen={showMentions}
        filter={mentionFilter}
        onSelect={insertMention}
        position={{ top: 8, left: 0 }}
        selectedIndex={selectedIndex}
      />

      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use @ to mention an AI provider"
          className="min-h-[40px] max-h-[200px] resize-none"
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
