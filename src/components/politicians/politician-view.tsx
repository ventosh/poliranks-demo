"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Gavel,
  Megaphone,
  Scale,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { useSim } from "@/lib/sim/use-sim";
import { POLITICIANS } from "@/lib/data/politicians";
import type { Politician, PoliticianStatement } from "@/lib/types";
import { LiveChart, type ScrubPoint } from "@/components/market/live-chart";
import { NumberTicker } from "@/components/market/number-ticker";
import { DeltaBadge } from "@/components/market/delta-badge";
import { CredibilityBadge } from "@/components/market/credibility-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clamp } from "@/lib/rng";
import { formatCompact, formatDateTime, formatPct, formatSigned, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<PoliticianStatement["kind"], React.ElementType> = {
  הצבעה: Vote,
  הצהרה: Megaphone,
  החלטה: Gavel,
};

function TrustBar({ label, value, extra }: { label: string; value: number; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium">{label}</span>
        <span className="flex items-center gap-2">
          {extra}
          <bdi className="num font-semibold">{formatPct(value)}</bdi>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" dir="ltr">
        <div
          className="h-full rounded-full bg-primary/80 transition-all duration-700"
          style={{ width: `${clamp(value, 2, 98)}%` }}
        />
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

export function PoliticianView({ p }: { p: Politician }) {
  const sim = useSim();
  const [scrub, setScrub] = React.useState<ScrubPoint | null>(null);
  const others = POLITICIANS.filter((x) => x.slug !== p.slug);
  const [compareSlug, setCompareSlug] = React.useState(others[0]?.slug);

  if (!sim) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full max-w-xl" />
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  const live = sim.snap.live[p.slug];
  const shown = scrub ? scrub.value : live.value;
  const compare = POLITICIANS.find((x) => x.slug === compareSlug);
  const compareLive = compare ? sim.snap.live[compare.slug] : null;

  const strengthening = [...p.demoTrust].sort((a, b) => b.delta7d - a.delta7d);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/politicians"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="size-3.5" />
        לכל הנבחרים
      </Link>

      {/* hero */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
          {initials(p.name)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight font-heading">{p.name}</h1>
          <p className="text-sm text-muted-foreground">
            {p.role} · מפלגת {p.party}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.topics.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
              {t}
            </span>
          ))}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            דמות להדגמה
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-muted-foreground">
            {scrub ? (
              <bdi className="num">{formatDateTime(scrub.time)}</bdi>
            ) : (
              "מדד אמון עכשיו"
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
          <span className="text-[11px] font-semibold text-muted-foreground">מדרגים</span>
          <span className="text-sm font-semibold">
            <bdi className="num">{formatCompact(live.participants)}</bdi>
          </span>
        </div>
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[11px] font-semibold text-muted-foreground">אמינות המדד</span>
          <CredibilityBadge level={live.credibility} />
        </div>
        <span className="ms-auto pb-1 text-[10px] text-muted-foreground">
          תנודתיות {p.volatilityLabel} · אותה מתודולוגיה כמו שאלות
        </span>
      </div>

      <LiveChart slug={p.slug} onScrub={setScrub} height={340} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* trust by topic + demographics */}
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Scale className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-bold">אמון לפי נושא</h2>
            </div>
            <div className="flex flex-col gap-3">
              {Object.entries(p.topicTrust).map(([t, off]) => (
                <TrustBar key={t} label={t} value={p.base + off} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-bold">אמון לפי קבוצה</h2>
              <span className="ms-auto text-[9px] text-muted-foreground">
                מוצג רק מעל סף 50 מדרגים
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {p.demoTrust.map((d) => (
                <TrustBar
                  key={d.group}
                  label={d.group}
                  value={p.base + d.offset}
                  extra={<DeltaBadge delta={d.delta7d} suffix="" />}
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Δ = שינוי 7 ימים · קבוצות מתחת לסף האנונימיות אינן מוצגות
            </p>
          </section>
        </div>

        {/* activity + statements */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* AI activity — violet = AI content */}
          <section className="rounded-xl border border-ai/25 bg-card p-4 border-s-2 border-s-ai">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-ai/15 px-2 py-0.5 text-[11px] font-bold text-ai">
                <Sparkles className="size-3" />
                AI
              </span>
              <h2 className="text-sm font-bold">תקציר פעילות</h2>
              <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <BadgeCheck className="size-3.5 text-ai" />
                אושר על ידי עורך · עודכן {formatTimeAgo(p.aiActivity.updatedMinutesAgo)}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed">{p.aiActivity.summary}</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 ps-4 text-xs text-muted-foreground">
              {p.aiActivity.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </section>

          {/* statements / votes / decisions feed */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">הצבעות · הצהרות · החלטות</h2>
            <ul className="flex flex-col">
              {p.statements.map((s) => {
                const Icon = KIND_ICON[s.kind];
                return (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug">{s.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-1.5 py-px font-semibold">
                          {s.kind}
                        </span>
                        {formatTimeAgo(s.hoursAgo * 60)}
                        {typeof s.reaction === "number" && (
                          <span
                            className={cn(
                              "font-semibold",
                              s.reaction > 0 ? "text-up" : "text-down"
                            )}
                          >
                            לאחר מכן נרשם שינוי של{" "}
                            <bdi className="num">{formatSigned(s.reaction)}</bdi> נק׳
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* comparison */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold">השוואת נבחרים</h2>
              <div className="ms-auto w-44">
                <Select dir="rtl" value={compareSlug} onValueChange={setCompareSlug}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {others.map((o) => (
                      <SelectItem key={o.slug} value={o.slug}>
                        {o.name} · {o.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {compare && compareLive && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { pol: p, lv: live },
                    { pol: compare, lv: compareLive },
                  ].map(({ pol, lv }) => (
                    <div key={pol.slug} className="rounded-lg border border-border p-3">
                      <p className="truncate text-xs font-bold">{pol.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{pol.role}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <bdi className="num text-xl font-semibold">{formatPct(lv.value)}</bdi>
                        <DeltaBadge delta={lv.delta24h} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  {Object.keys(p.topicTrust).map((t) => (
                    <div key={t} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{t}</span>
                        <span className="flex gap-3">
                          <bdi className="num text-foreground">
                            {formatPct(p.base + p.topicTrust[t])}
                          </bdi>
                          <bdi className="num">
                            {formatPct(compare.base + (compare.topicTrust[t] ?? 0))}
                          </bdi>
                        </span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-muted" dir="ltr">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary/85"
                          style={{ width: `${clamp(p.base + p.topicTrust[t], 2, 98)}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-1 rounded bg-foreground/60"
                          style={{
                            left: `${clamp(compare.base + (compare.topicTrust[t] ?? 0), 2, 98)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground">
                    פס מלא = {p.name} · סמן כהה = {compare.name}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* strengthening/weakening groups */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-bold">קבוצות מתחזקות ונחלשות</h2>
            <div className="flex flex-wrap gap-1.5">
              {strengthening.map((d) => (
                <span
                  key={d.group}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    d.delta7d > 0.05
                      ? "border-up/25 bg-up/10"
                      : d.delta7d < -0.05
                        ? "border-down/25 bg-down/10"
                        : "border-border bg-muted"
                  )}
                >
                  {d.group}
                  <DeltaBadge delta={d.delta7d} suffix="" />
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
