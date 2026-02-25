"use client";

import { useRef, useState, useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PinInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: PinInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d*$/.test(char)) return;

      const newValue = value.split("");
      newValue[index] = char;
      const joined = newValue.join("").slice(0, length);
      onChange(joined);

      // Move to next input
      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newValue = value.split("");
        newValue[index - 1] = "";
        onChange(newValue.join(""));
      }
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [length, onChange]
  );

  return (
    <div className="flex gap-2 w-full" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex(-1)}
          className={cn(
            "flex-1 min-w-0 h-13 text-center text-xl font-semibold rounded-lg border-2 bg-card text-foreground transition-all duration-150",
            "focus:outline-none focus:ring-0",
            focusedIndex === i
              ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
              : "border-border hover:border-muted-foreground/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
