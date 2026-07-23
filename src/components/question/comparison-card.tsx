"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { mulberry32, hashSeed } from "@/lib/rng";
import type { Question } from "@/lib/types";
import { formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { id: "age-18-24", label: "גיל 18–24", belowK: false },
  { id: "age-25-44", label: "גיל 25–44", belowK: false },
  { id: "age-45-64", label: "גיל 45–64", belowK: false },
  { id: "age-65", label: "גיל 65+", belowK: true },
  { id: "lean-right", label: "ימין (מדווח)", belowK: false },
  { id: "lean-center", label: "מרכז (מדווח)", belowK: false },
  { id: "lean-left", label: "שמאל (מדווח)", belowK: false },
];

function Bar({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn(muted ? "text-muted-foreground" : "font-semibold")}>{label}</span>
        <bdi className="num font-semibold">{formatPct(value)}</bdi>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" dir="ltr">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            muted ? "bg-flat/60" : "bg-primary"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/** Total vs. one population segment — k≥50 anonymity floor demonstrated. */
export function ComparisonCard({ q, liveValue }: { q: Question; liveValue: number }) {
  const [seg, setSeg] = React.useState(SEGMENTS[0]);

  // deterministic per (question, segment) offset
  const segValue = React.useMemo(() => {
    const r = mulberry32(hashSeed(`seg:${q.slug}:${seg.id}`));
    const offset = (r() - 0.5) * 24;
    return Math.min(95, Math.max(5, liveValue + offset));
  }, [q.slug, seg.id, liveValue]);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-bold">השוואת חתכים</h3>
        <span className="ms-auto text-[10px] text-muted-foreground">חתך אחד מול כלל הציבור</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeg(s)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              seg.id === s.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Bar label="כלל הציבור" value={liveValue} muted />
        {seg.belowK ? (
          <div className="rounded-lg border border-dashed border-border p-3 text-center">
            <p className="text-xs font-semibold">אין מספיק נתונים</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              החתך הזה מתחת לסף האנונימיות (50 משיבים) — לא מציגים נתון כדי להגן על פרטיות המשיבים.
            </p>
          </div>
        ) : (
          <Bar label={seg.label} value={segValue} />
        )}
      </div>
    </section>
  );
}
