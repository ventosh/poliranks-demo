"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Flame, History, Scale, Vote } from "lucide-react";
import { useSim } from "@/lib/sim/use-sim";
import { QUESTION_BY_SLUG } from "@/lib/data/questions";
import {
  currentTier,
  getPoints,
  getVotes,
  onUserState,
  TIERS,
  type VoteRecord,
} from "@/lib/user-state";
import { Skeleton } from "@/components/ui/skeleton";
import { IdeologyAxes } from "@/components/dashboard/ideology-axes";
import { NumberTicker } from "@/components/market/number-ticker";
import { formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const STANCE_LABEL: Record<string, string> = {
  support: "תומך",
  oppose: "מתנגד",
  unsure: "לא בטוח",
};

function agreesWithMajority(choice: string, support: number): boolean | null {
  if (choice === "support") return support >= 50;
  if (choice === "oppose") return support < 50;
  return null;
}

export function DashboardView() {
  const sim = useSim();
  const [votes, setVotes] = React.useState<Record<string, VoteRecord>>({});
  const [points, setPoints] = React.useState(0);

  React.useEffect(() => {
    const load = () => {
      setVotes(getVotes());
      setPoints(getPoints());
    };
    load();
    return onUserState(load);
  }, []);

  if (!sim) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const entries = Object.entries(votes).filter(([slug]) =>
    QUESTION_BY_SLUG.has(slug)
  );
  const tier = currentTier(points);
  const nextTier = TIERS.find((t) => t.min > points);
  const agreements = entries
    .map(([slug, v]) => agreesWithMajority(v.choice, sim.snap.live[slug].value))
    .filter((x): x is boolean => x !== null);
  const withMajority = agreements.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold font-heading">הדשבורד שלי</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          איפה אתה עומד מול הציבור — פרטי לחלוטין, לעולם לא מוצג לאחרים
        </p>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Award className="size-3.5" />
            נקודות אזרחיות
          </div>
          <p className="mt-1 text-3xl font-semibold">
            <NumberTicker value={String(points)} flash={false} />
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            דרגה: <span className="font-semibold text-live">{tier.name}</span>
            {nextTier && (
              <>
                {" · "}
                <bdi className="num">{nextTier.min - points}</bdi> נק׳ לדרגה הבאה
              </>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Vote className="size-3.5" />
            שאלות שנענו
          </div>
          <p className="num mt-1 text-3xl font-semibold">{entries.length}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">מתוך 8 פעילות</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Scale className="size-3.5" />
            הסכמה עם הרוב
          </div>
          <p className="num mt-1 text-3xl font-semibold">
            {agreements.length > 0 ? `${withMajority}/${agreements.length}` : "—"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {agreements.length > 0
              ? withMajority >= agreements.length / 2
                ? "אתה בדרך כלל עם הזרם"
                : "אתה הולך נגד הזרם"
              : "ענה על שאלות עמדה כדי לגלות"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Flame className="size-3.5 text-live" />
            רצף יומי
          </div>
          <p className="num mt-1 text-3xl font-semibold">1</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            חזור מחר לשמור על הרצף
          </p>
        </div>
      </div>

      {/* ideological map (PRD §2.4 — dynamic estimate, never a fixed label) */}
      <IdeologyAxes votes={votes} />

      {/* you vs public per question */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">אתה מול הציבור</h2>
        </div>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              עדיין לא ענית על שאלות. ההצבעה הראשונה שלך מחכה.
            </p>
            <Link
              href="/"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              לשאלות החמות
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {entries.map(([slug, v]) => {
              const q = QUESTION_BY_SLUG.get(slug)!;
              const lq = sim.snap.live[slug];
              const agree = agreesWithMajority(v.choice, lq.value);
              return (
                <Link
                  key={slug}
                  href={`/q/${slug}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60 sm:grid-cols-[1.2fr_2fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{q.short}</p>
                    <p className="text-[10px] text-muted-foreground">
                      העמדה שלך:{" "}
                      <span className="font-semibold text-foreground">
                        {STANCE_LABEL[v.choice] ?? `${v.choice}/5`}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1" dir="ltr">
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 bg-up/60"
                        style={{ width: `${lq.value}%` }}
                      />
                      <div
                        className="absolute inset-y-0 w-0.5 bg-foreground"
                        style={{ left: `calc(${lq.value}% - 1px)` }}
                      />
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <bdi className="num text-xs font-semibold">
                      {formatPct(lq.value)}
                    </bdi>
                    {agree !== null && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          agree ? "bg-up/15 text-up" : "bg-down/15 text-down"
                        )}
                      >
                        {agree ? "עם הרוב" : "במיעוט"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* answer history */}
      {entries.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold">היסטוריית תשובות</h2>
            <span className="ms-auto text-[10px] text-muted-foreground">
              שינויי עמדה נשמרים — ההיסטוריה לא נמחקת
            </span>
          </div>
          <ul className="flex flex-col">
            {entries
              .sort(([, a], [, b]) => b.at - a.at)
              .map(([slug, v]) => {
                const q = QUESTION_BY_SLUG.get(slug)!;
                return (
                  <li
                    key={slug}
                    className="flex items-center justify-between border-b border-border py-2 text-[13px] last:border-b-0"
                  >
                    <span className="truncate">{q.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(v.at).toLocaleString("he-IL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}
