"use client";

import * as React from "react";
import Link from "next/link";
import { useSim } from "@/lib/sim/use-sim";
import { QUESTIONS } from "@/lib/data/questions";
import { formatPct, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

function TickerEntry({
  slug,
  short,
  value,
  delta,
}: {
  slug: string;
  short: string;
  value: number;
  delta: number;
}) {
  const dir = delta > 0.049 ? 1 : delta < -0.049 ? -1 : 0;
  return (
    <Link
      href={`/q/${slug}`}
      className="group flex shrink-0 items-center gap-2 px-4 py-1.5"
      dir="rtl"
    >
      <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {short}
      </span>
      <bdi className="num text-xs font-semibold">{formatPct(value)}</bdi>
      <span
        className={cn(
          "num inline-flex items-center gap-0.5 text-[11px] font-semibold",
          dir === 1 && "text-up",
          dir === -1 && "text-down",
          dir === 0 && "text-flat"
        )}
      >
        <span className="text-[9px]">{dir === 1 ? "▲" : dir === -1 ? "▼" : "—"}</span>
        <bdi className="num">{formatSigned(delta)}%</bdi>
      </span>
      <span className="mx-1 h-3 w-px bg-border" />
    </Link>
  );
}

/** Financial-news ticker tape. LTR island; items internally RTL. */
export function Ticker() {
  const sim = useSim();

  if (!sim) {
    return (
      <div className="h-9 w-full animate-pulse border-t border-border bg-card/50" />
    );
  }

  const items = QUESTIONS.map((q) => ({
    slug: q.slug,
    short: q.short,
    value: sim.snap.live[q.slug].value,
    delta: sim.snap.live[q.slug].delta24h,
  }));

  return (
    <div
      className="marquee-paused relative w-full overflow-hidden border-t border-border bg-card/50"
      dir="ltr"
      style={{ "--marquee-duration": "45s" } as React.CSSProperties}
    >
      <div className="marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {items.map((it) => (
              <TickerEntry key={`${copy}-${it.slug}`} {...it} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
