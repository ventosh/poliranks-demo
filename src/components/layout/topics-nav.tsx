"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { TOPICS } from "@/lib/data/questions";
import { cn } from "@/lib/utils";

export type TopicFilter = "הכל" | (typeof TOPICS)[number];

/** Polymarket-style horizontal topic chips. */
export function TopicsNav({
  selected,
  onSelect,
  className,
}: {
  selected: TopicFilter;
  onSelect: (t: TopicFilter) => void;
  className?: string;
}) {
  const chips: TopicFilter[] = ["הכל", ...TOPICS];
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      role="tablist"
      aria-label="נושאים"
    >
      {chips.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={selected === t}
          onClick={() => onSelect(t)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors min-h-[34px]",
            selected === t
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
        >
          {t}
        </button>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <Link
        href="/politicians"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-live/30 bg-live/10 px-3.5 py-1.5 text-xs font-semibold text-live transition-colors hover:bg-live/20 min-h-[34px]"
      >
        <Users className="size-3.5" />
        פוליטיקאים
      </Link>
    </div>
  );
}
