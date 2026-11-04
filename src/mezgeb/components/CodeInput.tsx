"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** called once all six digits are present */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
};

/** Six boxes for an authenticator code: auto-advance, backspace back, paste anywhere. */
export function CodeInput({ value, onChange, onComplete, disabled, autoFocus, label = "Six-digit code" }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[Math.min(value.length, 5)]?.focus();
    // focus only on mount / when re-enabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled]);

  function setFrom(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = (value.slice(0, index) + digits).slice(0, 6);
    onChange(next);
    refs.current[Math.min(next.length, 5)]?.focus();
    if (next.length === 6) onComplete?.(next);
  }

  return (
    <div role="group" aria-label={label} className="mz-code">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? 6 : 1}
          disabled={disabled}
          className={value[i] ? "is-filled" : undefined}
          value={value[i] ?? ""}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const v = e.currentTarget.value;
            if (v === "") {
              onChange(value.slice(0, i));
              return;
            }
            // the box's text is selected on focus, so typing replaces it;
            // several digits (autofill into the first box) spread forward
            setFrom(i, v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              e.preventDefault();
              onChange(value.slice(0, i - 1));
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft" && i > 0) {
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < 5) {
              refs.current[i + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            setFrom(0, e.clipboardData.getData("text"));
          }}
        />
      ))}
    </div>
  );
}
