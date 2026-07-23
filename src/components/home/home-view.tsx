"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flag,
  Flame,
  ListChecks,
  TrendingUp,
  Vote,
} from "lucide-react";
import { useSim } from "@/lib/sim/use-sim";
import { QUESTIONS, QUESTION_BY_SLUG } from "@/lib/data/questions";
import { LiveChart } from "@/components/market/live-chart";
import { NumberTicker } from "@/components/market/number-ticker";
import { DeltaBadge } from "@/components/market/delta-badge";
import { Sparkline } from "@/components/market/sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, formatPct, formatTimeAgo } from "@/lib/format";
import { getVotes, onUserState } from "@/lib/user-state";
import type { SimSnapshot } from "@/lib/sim/engine";
import { cn } from "@/lib/utils";

function useFlashClass(flashKey: number, dir: 1 | -1 | 0): string {
  const [cls, setCls] = React.useState("");
  const prev = React.useRef(flashKey);
  React.useEffect(() => {
    if (flashKey === prev.current) return;
    prev.current = flashKey;
    setCls(dir === -1 ? "flash-down" : "flash-up");
    const t = setTimeout(() => setCls(""), 850);
    return () => clearTimeout(t);
  }, [flashKey, dir]);
  return cls;
}

function CardTitle({
  icon: Icon,
  children,
  live,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <h2 className="text-sm font-bold">{children}</h2>
      {live && (
        <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-live">
          <span className="live-dot size-1.5 rounded-full bg-live" />
          חי
        </span>
      )}
    </div>
  );
}

function MoverRow({
  slug,
  rank,
  snap,
}: {
  slug: string;
  rank: number;
  snap: SimSnapshot;
}) {
  const q = QUESTION_BY_SLUG.get(slug)!;
  const lq = snap.live[slug];
  const flash = useFlashClass(lq.flashKey, lq.dir);
  return (
    <Link
      href={`/q/${slug}`}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60",
        flash
      )}
    >
      <span className="num w-4 text-center text-[11px] font-semibold text-muted-foreground">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{q.short}</p>
        <p className="text-[10px] text-muted-foreground">{q.topic}</p>
      </div>
      <Sparkline slug={slug} width={64} height={20} />
      <bdi className="num w-12 text-end text-[13px] font-semibold">
        {formatPct(lq.value)}
      </bdi>
      <DeltaBadge delta={lq.delta24h} className="w-14 justify-end" />
    </Link>
  );
}

function ActiveRow({
  slug,
  maxN,
  snap,
}: {
  slug: string;
  maxN: number;
  snap: SimSnapshot;
}) {
  const q = QUESTION_BY_SLUG.get(slug)!;
  const lq = snap.live[slug];
  return (
    <Link
      href={`/q/${slug}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{q.short}</p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" dir="ltr">
          <div
            className="h-full rounded-full bg-primary/70 transition-all duration-700"
            style={{ width: `${(lq.participants / maxN) * 100}%` }}
          />
        </div>
      </div>
      <span className="num text-xs font-semibold text-muted-foreground">
        {formatCompact(lq.participants)}
      </span>
    </Link>
  );
}

export function HomeView() {
  const sim = useSim();
  const [votedSlugs, setVotedSlugs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const load = () => setVotedSlugs(new Set(Object.keys(getVotes())));
    load();
    return onUserState(load);
  }, []);

  if (!sim) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[420px] lg:col-span-2" />
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const snap = sim.snap;
  const lead = QUESTION_BY_SLUG.get("giyus")!;
  const leadLive = snap.live[lead.slug];

  const movers = [...QUESTIONS].sort(
    (a, b) =>
      Math.abs(snap.live[b.slug].delta24h) - Math.abs(snap.live[a.slug].delta24h)
  );
  const active = [...QUESTIONS].sort(
    (a, b) => snap.live[b.slug].participants - snap.live[a.slug].participants
  );
  const maxN = snap.live[active[0].slug].participants;

  const allEvents = Object.entries(snap.events)
    .flatMap(([slug, evs]) =>
      evs.map((e) => ({
        ...e,
        slug,
        t: e.timeSec ?? sim.engine.nowSecAtBoot - e.hoursAgo * 3600,
      }))
    )
    .sort((a, b) => b.t - a.t)
    .slice(0, 6);

  const waiting = QUESTIONS.filter((q) => !votedSlugs.has(q.slug)).slice(0, 4);
  const missionsDone = Math.min(votedSlugs.size, 3);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">PoliRanks — מה זז במדינה עכשיו</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* lead question — the chart is the headline */}
        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Flame className="size-3.5 text-live" />
            השאלה החמה עכשיו
            <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-live">
              <span className="live-dot size-1.5 rounded-full bg-live" />
              חי
            </span>
          </div>
          <Link href={`/q/${lead.slug}`} className="group flex flex-col gap-1">
            <h2 className="text-lg font-bold leading-snug group-hover:underline md:text-xl">
              {lead.title}
            </h2>
            <div className="flex items-end gap-4">
              <span className="text-4xl font-semibold leading-none">
                <NumberTicker value={leadLive.value.toFixed(1)} suffix="%" />
              </span>
              <DeltaBadge delta={leadLive.delta24h} size="md" className="pb-1" />
              <span className="pb-1 text-xs text-muted-foreground">
                <bdi className="num">{formatCompact(leadLive.participants)}</bdi>{" "}
                משתתפים
              </span>
              <span className="ms-auto hidden items-center gap-1 pb-1 text-xs font-semibold text-primary sm:inline-flex">
                לעמוד השאלה
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </div>
          </Link>
          <div className="mt-2">
            <LiveChart slug={lead.slug} height={252} />
          </div>
        </section>

        {/* biggest movers */}
        <section className="rounded-xl border border-border bg-card p-4">
          <CardTitle icon={TrendingUp} live>
            המזנקים של 24 השעות
          </CardTitle>
          <div className="flex flex-col">
            {movers.map((q, i) => (
              <MoverRow key={q.slug} slug={q.slug} rank={i + 1} snap={snap} />
            ))}
          </div>
        </section>

        {/* recent events */}
        <section className="rounded-xl border border-border bg-card p-4">
          <CardTitle icon={Flag}>אירועים שהזיזו מדדים</CardTitle>
          <ul className="flex flex-col gap-1">
            {allEvents.map((e) => {
              const q = QUESTIONS.find((x) => x.id === e.questionId);
              const minutesAgo = (Date.now() / 1000 - e.t) / 60;
              return (
                <li key={e.id}>
                  <Link
                    href={`/q/${e.slug}`}
                    className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
                  >
                    <span className="mt-1 block size-2 shrink-0 rotate-45 bg-live" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium leading-snug group-hover:underline">
                        {e.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-1.5 py-px">
                          {q?.short}
                        </span>
                        {formatTimeAgo(minutesAgo)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* most active */}
        <section className="rounded-xl border border-border bg-card p-4">
          <CardTitle icon={Vote} live>
            הכי פעילות עכשיו
          </CardTitle>
          <div className="flex flex-col gap-1">
            {active.slice(0, 6).map((q) => (
              <ActiveRow key={q.slug} slug={q.slug} maxN={maxN} snap={snap} />
            ))}
          </div>
        </section>

        {/* waiting for you + missions */}
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <CardTitle icon={ListChecks}>מחכות לתשובה שלך</CardTitle>
            {waiting.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                ענית על כל השאלות הפתוחות — כל הכבוד!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {waiting.map((q) => (
                  <Link
                    key={q.slug}
                    href={`/q/${q.slug}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-[13px] font-medium transition-colors hover:border-primary/50 hover:bg-accent/60"
                  >
                    <span className="truncate">{q.short}</span>
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      הצבע ‎+10
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-live/25 bg-live/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">משימה יומית</h2>
              <bdi className="num text-xs font-semibold text-live">
                {missionsDone}/3
              </bdi>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              ענה על 3 שאלות חמות וקבל 30 נקודות בונוס
            </p>
            <div className="flex gap-1.5" dir="ltr">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    i < missionsDone ? "bg-live" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
