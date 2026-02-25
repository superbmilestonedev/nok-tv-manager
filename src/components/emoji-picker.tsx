"use client";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {brand.emojiOptions.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            "w-9 h-9 flex items-center justify-center text-xl rounded-lg transition-all",
            value === emoji
              ? "bg-primary/20 ring-2 ring-primary scale-110"
              : "hover:bg-secondary"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
