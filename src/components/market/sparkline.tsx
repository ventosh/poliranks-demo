"use client";

import * as React from "react";
import { getEngine } from "@/lib/sim/engine";
import { resampleHistory } from "@/lib/data/history";
import { cn } from "@/lib/utils";

/**
 * Tiny 24h sparkline (SVG, LTR island). Colored by net direction.
 */
export function Sparkline({
  slug,
  width = 80,
  height = 24,
  className,
}: {
  slug: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [path, setPath] = React.useState<{ d: string; up: boolean } | null>(
    null
  );

  React.useEffect(() => {
    const engine = getEngine();
    const build = () => {
      const h = engine.getHistory(slug);
      if (h.length < 2) return;
      const now = h[h.length - 1].time;
      const from = now - 24 * 3600;
      // uniform 30-min buckets so the x-axis shape is time-true
      const sample = resampleHistory(h, 1800, from, now);
      if (sample.length < 2) return;
      const vals = sample.map((p) => p.value);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const span = Math.max(max - min, 0.5);
      const d = sample
        .map((p, i) => {
          const x = (i / (sample.length - 1)) * width;
          const y = height - 2 - ((p.value - min) / span) * (height - 4);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join("");
      setPath({ d, up: vals[vals.length - 1] >= vals[0] });
    };
    build();
    let n = 0;
    return engine.onTick((s) => {
      if (s === slug && ++n % 5 === 0) build();
    });
  }, [slug, width, height]);

  if (!path) {
    return (
      <span
        className={cn("inline-block rounded bg-muted", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d={path.d}
        fill="none"
        stroke={path.up ? "var(--up)" : "var(--down)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
