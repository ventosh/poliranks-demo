"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Lock } from "lucide-react";
import { AXES, confidenceLabel } from "@/lib/data/axes";
import { QUESTIONS } from "@/lib/data/questions";
import { clamp } from "@/lib/rng";
import type { VoteRecord } from "@/lib/user-state";
import { cn } from "@/lib/utils";

/** Direction of a vote in axis space: +1 pushes toward pole A. */
function voteDirection(q: (typeof QUESTIONS)[number], v: VoteRecord): number {
  if (q.type === "stance") {
    return v.choice === "support" ? 1 : v.choice === "oppose" ? -1 : 0;
  }
  const n = parseInt(v.choice, 10);
  return Number.isNaN(n) ? 0 : (n - 3) / 2;
}

export interface AxisEstimate {
  score: number; // 0..100, 100 = pole A
  answered: number;
}

/** Weighted position per axis from the user's answered questions. */
export function computeAxisEstimates(
  votes: Record<string, VoteRecord>
): Map<string, AxisEstimate> {
  const acc = new Map<string, { num: number; den: number; n: number }>();
  for (const q of QUESTIONS) {
    if (!q.axes) continue;
    const v = votes[q.slug];
    if (!v) continue;
    const dir = voteDirection(q, v);
    for (const c of q.axes) {
      const a = acc.get(c.axis) ?? { num: 0, den: 0, n: 0 };
      a.num += dir * c.weight;
      a.den += Math.abs(c.weight);
      a.n += 1;
      acc.set(c.axis, a);
    }
  }
  const out = new Map<string, AxisEstimate>();
  for (const [axis, a] of acc) {
    if (a.den === 0) continue;
    // Shrink toward center for small samples — the estimate extremizes only
    // as more contributing answers accumulate (PRD: confidence grows with data)
    const shrink = a.n / (a.n + 2);
    out.set(axis, {
      score: clamp(50 + (a.num / a.den) * 45 * shrink, 5, 95),
      answered: a.n,
    });
  }
  return out;
}

function AxisRow({
  title,
  poleA,
  poleB,
  publicMean,
  publicSpread,
  estimate,
}: {
  title: string;
  poleA: string;
  poleB: string;
  publicMean: number;
  publicSpread: number;
  estimate: AxisEstimate | undefined;
}) {
  const locked = !estimate;
  const conf = estimate ? confidenceLabel(estimate.answered) : null;
  const bandStart = clamp(publicMean - publicSpread, 2, 98);
  const bandEnd = clamp(publicMean + publicSpread, 2, 98);

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs font-bold">{title}</span>
        {conf && (
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[9px] font-bold",
              conf.tone === "high" && "bg-up/15 text-up",
              conf.tone === "mid" && "bg-live/15 text-live",
              conf.tone === "low" && "bg-muted text-muted-foreground"
            )}
          >
            {conf.label}
          </span>
        )}
        {estimate && (
          <span className="ms-auto text-[10px] text-muted-foreground">
            מבוסס על <bdi className="num">{estimate.answered}</bdi> תשובות
          </span>
        )}
      </div>

      <div className="relative" dir="ltr">
        {/* user arrow */}
        {estimate && (
          <span
            className="absolute -top-2 z-10 -translate-x-1/2 text-[11px] leading-none text-foreground transition-all duration-700"
            style={{ left: `${estimate.score}%` }}
            aria-label="המיקום שלך"
          >
            ▼
          </span>
        )}
        <div
          className={cn(
            "relative mt-2 h-3 overflow-hidden rounded-full",
            locked && "opacity-40"
          )}
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--muted-foreground) 25%, transparent), color-mix(in srgb, var(--primary) 45%, transparent))",
          }}
        >
          {/* public density band */}
          <div
            className="absolute inset-y-0 bg-foreground/12"
            style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
          />
          {/* public median */}
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/50"
            style={{ left: `${publicMean}%` }}
            aria-label="חציון הציבור"
          />
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{poleB}</span>
        {locked ? (
          <span className="inline-flex items-center gap-1 font-medium">
            <Lock className="size-3" />
            ענה על שאלות בנושא כדי לחשוף
          </span>
        ) : (
          <span>▮ טווח הציבור · | חציון</span>
        )}
        <span>{poleA}</span>
      </div>
    </div>
  );
}

export function IdeologyAxes({
  votes,
}: {
  votes: Record<string, VoteRecord>;
}) {
  const estimates = computeAxisEstimates(votes);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Compass className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-bold">המפה האידיאולוגית שלך</h2>
        <span className="rounded-full bg-ai/15 px-2 py-0.5 text-[10px] font-bold text-ai">
          הערכה דינמית
        </span>
        <span className="ms-auto text-[10px] text-muted-foreground">
          פרטי לחלוטין · לעולם לא תווית קבועה
        </span>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
        ▼ = המיקום המשוער שלך, הנגזר מהתשובות שענית. ההערכה מתעדכנת ומתחדדת עם כל
        תשובה —{" "}
        <Link href="/feed" className="font-semibold text-primary hover:underline">
          ענה על שאלות עומק בפיד
        </Link>
        .
      </p>
      <div className="flex flex-col divide-y divide-border">
        {AXES.map((a) => (
          <AxisRow
            key={a.id}
            title={a.title}
            poleA={a.poleA}
            poleB={a.poleB}
            publicMean={a.publicMean}
            publicSpread={a.publicSpread}
            estimate={estimates.get(a.id)}
          />
        ))}
      </div>
    </section>
  );
}
