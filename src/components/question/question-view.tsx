"use client";

import * as React from "react";
import { Flag, CalendarDays, Activity } from "lucide-react";
import type { Question } from "@/lib/types";
import { useSim } from "@/lib/sim/use-sim";
import { LiveChart, type ScrubPoint } from "@/components/market/live-chart";
import { NumberTicker } from "@/components/market/number-ticker";
import { DeltaBadge } from "@/components/market/delta-badge";
import { CredibilityBadge } from "@/components/market/credibility-badge";
import { MethodologyPanel } from "@/components/question/methodology-panel";
import { VoteWidget } from "@/components/question/vote-widget";
import { AiSummary } from "@/components/question/ai-summary";
import { ComparisonCard } from "@/components/question/comparison-card";
import { ArticlesList } from "@/components/question/articles-list";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, formatDateTime, formatPct } from "@/lib/format";

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-9 w-full max-w-xl" />
      <div className="flex gap-6">
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-24" />
        <Skeleton className="h-14 w-24" />
      </div>
      <Skeleton className="h-[380px] w-full" />
    </div>
  );
}

export function QuestionView({ q }: { q: Question }) {
  const sim = useSim();
  const [scrub, setScrub] = React.useState<ScrubPoint | null>(null);

  if (!sim) return <HeaderSkeleton />;

  const live = sim.snap.live[q.slug];
  const events = sim.snap.events[q.slug] ?? [];
  const shown = scrub ? scrub.value : live.value;

  return (
    <div className="flex flex-col gap-6">
      {/* breadcrumbs / meta strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{q.topic}</span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3" />
          נפתחה {new Date(q.openedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long" })}
        </span>
        <span className="inline-flex items-center gap-1">
          <Activity className="size-3" />
          תנודתיות {q.volatilityLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <Flag className="size-3 text-live" />
          <bdi className="num">{events.length}</bdi> אירועים מסומנים
        </span>
      </div>

      <h1 className="text-2xl font-bold leading-tight font-heading md:text-3xl">
        {q.title}
      </h1>

      {/* hero stats — Robinhood hierarchy */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-muted-foreground">
            {scrub ? (
              <bdi className="num">{formatDateTime(scrub.time)}</bdi>
            ) : (
              `${q.metricLabel} עכשיו`
            )}
          </span>
          <span className="text-5xl font-semibold leading-none md:text-6xl">
            <NumberTicker value={shown.toFixed(1)} suffix="%" flash={!scrub} />
          </span>
        </div>
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[11px] font-semibold text-muted-foreground">24 שעות</span>
          <DeltaBadge delta={live.delta24h} size="md" />
        </div>
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[11px] font-semibold text-muted-foreground">משתתפים</span>
          <span className="num text-sm font-semibold">
            {formatCompact(live.participants)}
          </span>
        </div>
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[11px] font-semibold text-muted-foreground">אמינות המדד</span>
          <CredibilityBadge level={live.credibility} />
        </div>
        <div className="ms-auto pb-1">
          <MethodologyPanel q={q} />
        </div>
      </div>

      {q.type === "stance" && (
        <div className="-mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>
            מתנגדים: <bdi className="num font-semibold text-foreground">{formatPct(q.splitOppose)}</bdi>
          </span>
          <span>
            מתלבטים: <bdi className="num font-semibold text-foreground">{formatPct(q.splitUnsure)}</bdi>
          </span>
          <span className="text-[10px]">(פילוג עדכני להצבעה האחרונה)</span>
        </div>
      )}

      <LiveChart slug={q.slug} onScrub={setScrub} height={380} />

      {/* below the chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-1">
          <VoteWidget q={q} live={live} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <AiSummary q={q} />
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonCard q={q} liveValue={live.value} />
            <ArticlesList q={q} />
          </div>
        </div>
      </div>
    </div>
  );
}
