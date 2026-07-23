"use client";

import * as React from "react";
import { useBrand } from "@/components/providers";
import { cn } from "@/lib/utils";

/**
 * PoliRanks wordmark — one visual identity per brand.
 * Icon is inline SVG (currentColor = brand primary), text uses brand fonts.
 */
export function Wordmark({ className }: { className?: string }) {
  const { brand } = useBrand();

  const icon = (() => {
    switch (brand) {
      case "civic-blue":
        return (
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="none" aria-hidden>
            <path
              d="M12 2.5 20 6v6c0 5-3.4 8.3-8 9.5C7.4 20.3 4 17 4 12V6l8-3.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M7.5 13.5 10 11l2.5 2 4-4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "market-mint":
        return (
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M5.5 13.5h3l1.8-4.6 2.6 6.4 1.9-3.6h3.7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "editorial-contrast":
        return (
          <svg viewBox="0 0 24 24" className="size-6 text-primary" aria-hidden>
            <rect x="3" y="4" width="18" height="3.2" fill="currentColor" />
            <rect x="3" y="10" width="12.5" height="2.2" fill="currentColor" />
            <rect x="3" y="15" width="18" height="2.2" fill="currentColor" opacity="0.45" />
            <rect x="3" y="19" width="8" height="2.2" fill="currentColor" opacity="0.45" />
          </svg>
        );
      case "violet-pulse":
        return (
          <svg viewBox="0 0 24 24" className="size-6 text-primary" fill="none" aria-hidden>
            <path
              d="M2.5 12h4l2-6 3.5 12 2.5-9 1.8 3h5.2"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "terminal-amber":
      default:
        return (
          <svg viewBox="0 0 24 24" className="size-6 text-primary" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.16" />
            <path d="M12 7.2 16.5 15h-9L12 7.2Z" fill="currentColor" />
          </svg>
        );
    }
  })();

  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      {icon}
      <span
        className={cn(
          "text-lg leading-none tracking-tight",
          brand === "editorial-contrast"
            ? "font-heading font-black"
            : "font-semibold",
          brand === "market-mint" && "font-bold",
          brand === "terminal-amber" && "font-mono font-semibold tracking-tighter"
        )}
        dir="ltr"
      >
        Poli<span className="text-primary">Ranks</span>
      </span>
    </span>
  );
}
