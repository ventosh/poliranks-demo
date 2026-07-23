"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Users } from "lucide-react";
import { useSim } from "@/lib/sim/use-sim";
import { POLITICIANS } from "@/lib/data/politicians";
import { Sparkline } from "@/components/market/sparkline";
import { DeltaBadge } from "@/components/market/delta-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export function PoliticiansView() {
  const sim = useSim();

  if (!sim) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const ranked = [...POLITICIANS].sort(
    (a, b) => sim.snap.live[b.slug].value - sim.snap.live[a.slug].value
  );
  const byDelta = [...POLITICIANS].sort(
    (a, b) => sim.snap.live[b.slug].delta24h - sim.snap.live[a.slug].delta24h
  );
  const rising = byDelta.filter((p) => sim.snap.live[p.slug].delta24h > 0.05);
  const falling = [...byDelta]
    .reverse()
    .filter((p) => sim.snap.live[p.slug].delta24h < -0.05);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Users className="size-5 text-primary" />
        <h1 className="text-2xl font-bold font-heading">מדד האמון בנבחרים</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          דמויות להדגמה
        </span>
        <span className="ms-auto text-xs text-muted-foreground">
          אותו מנוע מדדים · אותם כללי אמינות
        </span>
      </div>

      {/* rising / falling strips */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-up">
            <TrendingUp className="size-3.5" />
            מתחזקים היום
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rising.length === 0 && (
              <span className="text-[11px] text-muted-foreground">אין שינויים בולטים</span>
            )}
            {rising.map((p) => (
              <Link
                key={p.slug}
                href={`/p/${p.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-up/25 bg-up/10 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-up/20"
              >
                {p.name}
                <DeltaBadge delta={sim.snap.live[p.slug].delta24h} />
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-down">
            <TrendingDown className="size-3.5" />
            נחלשים היום
          </div>
          <div className="flex flex-wrap gap-1.5">
            {falling.length === 0 && (
              <span className="text-[11px] text-muted-foreground">אין שינויים בולטים</span>
            )}
            {falling.map((p) => (
              <Link
                key={p.slug}
                href={`/p/${p.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-down/25 bg-down/10 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-down/20"
              >
                {p.name}
                <DeltaBadge delta={sim.snap.live[p.slug].delta24h} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ranked table */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-bold">דירוג אמון · 24 שעות</h2>
        <div className="flex flex-col">
          {ranked.map((p, i) => {
            const lq = sim.snap.live[p.slug];
            return (
              <Link
                key={p.slug}
                href={`/p/${p.slug}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60"
              >
                <span className="num w-4 text-center text-[11px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    "bg-primary/15 text-primary"
                  )}
                >
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{p.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {p.role} · {p.party}
                  </p>
                </div>
                <span className="hidden text-[10px] text-muted-foreground sm:block">
                  <bdi className="num">{formatCompact(lq.participants)}</bdi> מדרגים
                </span>
                <Sparkline slug={p.slug} width={64} height={20} />
                <bdi className="num w-12 text-end text-[13px] font-semibold">
                  {formatPct(lq.value)}
                </bdi>
                <DeltaBadge delta={lq.delta24h} className="w-14 justify-end" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
