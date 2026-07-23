"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function DigitColumn({ digit }: { digit: string }) {
  const idx = DIGITS.indexOf(digit);
  if (idx === -1) {
    return <span className="inline-block">{digit}</span>;
  }
  return (
    <span
      className="relative inline-block overflow-hidden align-bottom"
      style={{ height: "1em", width: "0.62em" }}
      aria-hidden
    >
      <span
        className="absolute left-0 top-0 flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${idx}em)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} style={{ height: "1em", lineHeight: "1em" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Robinhood-style odometer: digits roll vertically, value flashes
 * green/red on change and decays back to the base color.
 */
export function NumberTicker({
  value,
  suffix = "",
  className,
  flash = true,
}: {
  value: string;
  suffix?: string;
  className?: string;
  flash?: boolean;
}) {
  const prev = React.useRef(value);
  const [tone, setTone] = React.useState<"up" | "down" | null>(null);

  React.useEffect(() => {
    if (!flash || prev.current === value) return;
    const a = parseFloat(prev.current.replace(/[^\d.-]/g, ""));
    const b = parseFloat(value.replace(/[^\d.-]/g, ""));
    prev.current = value;
    if (Number.isNaN(a) || Number.isNaN(b) || a === b) return;
    setTone(b > a ? "up" : "down");
    const t = setTimeout(() => setTone(null), 1200);
    return () => clearTimeout(t);
  }, [value, flash]);

  return (
    <span
      className={cn(
        "num inline-flex items-baseline transition-colors duration-700",
        tone === "up" && "text-up duration-100",
        tone === "down" && "text-down duration-100",
        className
      )}
      aria-label={`${value}${suffix}`}
    >
      {value.split("").map((ch, i) => (
        <DigitColumn key={`${i}`} digit={ch} />
      ))}
      {suffix && <span className="ms-0.5">{suffix}</span>}
    </span>
  );
}
