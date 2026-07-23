"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Infinity as InfinityIcon,
  PartyPopper,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { useSim } from "@/lib/sim/use-sim";
import { QUESTIONS } from "@/lib/data/questions";
import { TopicsNav, type TopicFilter } from "@/components/layout/topics-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { castVote, getVotes } from "@/lib/user-state";
import { formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

const STANCE_OPTIONS = [
  { id: "support", label: "תומך", tone: "up" as const },
  { id: "oppose", label: "מתנגד", tone: "down" as const },
  { id: "unsure", label: "לא בטוח", tone: "flat" as const },
];

/** Answer result flashed briefly before auto-advancing. */
interface FlashResult {
  choice: string;
  publicValue: number;
  withMajority: boolean | null;
}

export function FeedView() {
  const sim = useSim();
  const [topic, setTopic] = React.useState<TopicFilter>("הכל");
  const [order, setOrder] = React.useState<string[] | null>(null);
  const [cursor, setCursor] = React.useState(0);
  const [sessionCount, setSessionCount] = React.useState(0);
  const [result, setResult] = React.useState<FlashResult | null>(null);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the play order once per mount/topic: unanswered first (batteries first).
  React.useEffect(() => {
    const votes = getVotes();
    const pool =
      topic === "הכל" ? QUESTIONS : QUESTIONS.filter((q) => q.topic === topic);
    const rank = (q: Question) =>
      (votes[q.slug] ? 2 : 0) + (q.battery ? 0 : 1);
    setOrder(
      [...pool].sort((a, b) => rank(a) - rank(b)).map((q) => q.slug)
    );
    setCursor(0);
    setResult(null);
  }, [topic]);

  React.useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  if (!sim || !order) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Skeleton className="mb-4 h-10 w-56" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const done = cursor >= order.length;
  const q = done
    ? null
    : QUESTIONS.find((x) => x.slug === order[cursor])!;
  const live = q ? sim.snap.live[q.slug] : null;

  const advance = () => {
    setResult(null);
    setCursor((c) => c + 1);
  };

  const answer = (choice: string) => {
    if (!q || !live || result) return;
    castVote(q.slug, choice);
    const withMajority =
      q.type === "stance"
        ? (choice === "support" && live.value >= 50) ||
          (choice === "oppose" && live.value < 50)
        : null;
    setResult({ choice, publicValue: live.value, withMajority });
    setSessionCount((n) => n + 1);
    toast("‎+10 נקודות אזרחיות", {
      description: "התשובה נספרת בצבירה הבאה של המדד",
      icon: <Sparkles className="size-4" />,
      duration: 1800,
    });
    advanceTimer.current = setTimeout(advance, 1100);
  };

  const isScale = q ? q.type !== "stance" : false;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4">
      <div className="flex items-center gap-2">
        <InfinityIcon className="size-5 text-primary" />
        <h1 className="text-xl font-bold font-heading">השאלות האין-סופיות</h1>
        <span className="ms-auto rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
          <bdi className="num">{sessionCount}</bdi> ענית · ‎
          <bdi className="num">+{sessionCount * 10}</bdi> נק׳
        </span>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        שאלה אחת בכל פעם — ענה, ראה איפה אתה מול הציבור, והמשך. כל תשובה מחדדת
        את הדשבורד האידיאולוגי שלך.
      </p>

      <TopicsNav selected={topic} onSelect={setTopic} />

      {/* progress */}
      <div className="flex gap-1" dir="ltr">
        {order.map((slug, i) => (
          <div
            key={slug}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < cursor ? "bg-primary" : i === cursor ? "bg-primary/40" : "bg-muted"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-up/30 bg-card p-10 text-center"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-up/15">
              <PartyPopper className="size-8 text-up" />
            </span>
            <div>
              <h2 className="text-lg font-bold">ענית על הכל — כל הכבוד!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ענית על <bdi className="num font-semibold">{sessionCount}</bdi> שאלות
                בסבב הזה. הדשבורד האידיאולוגי שלך התעדכן.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                לדשבורד שלי
              </Link>
              <button
                onClick={() => {
                  setCursor(0);
                  setSessionCount(0);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                סבב נוסף (עדכון תשובות)
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={q!.slug}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                {q!.topic}
              </span>
              {q!.battery && (
                <span className="rounded-full bg-ai/15 px-2 py-0.5 font-bold text-ai">
                  שאלת עומק
                </span>
              )}
              <Link
                href={`/q/${q!.slug}`}
                className="ms-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                לעמוד המלא
                <ArrowLeft className="size-3" />
              </Link>
            </div>

            <h2 className="min-h-[64px] text-xl font-bold leading-snug md:text-2xl">
              {q!.title}
            </h2>

            {!isScale ? (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {STANCE_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => answer(o.id)}
                    className={cn(
                      "min-h-[52px] rounded-xl border text-sm font-bold transition-all",
                      result?.choice === o.id
                        ? o.tone === "up"
                          ? "border-up bg-up/15 text-up"
                          : o.tone === "down"
                            ? "border-down bg-down/15 text-down"
                            : "border-border bg-muted"
                        : "border-border bg-background hover:border-foreground/30"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-1.5">
                <div className="grid grid-cols-5 gap-1.5" dir="ltr">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => answer(String(n))}
                      className={cn(
                        "num min-h-[52px] rounded-xl border text-sm font-bold transition-all",
                        result?.choice === String(n)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background hover:border-foreground/30"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>כלל לא</span>
                  <span>במידה רבה</span>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={advance}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <SkipForward className="size-3.5" />
                דלג
              </button>
              <span className="text-[10px] text-muted-foreground">
                שאלה <bdi className="num">{cursor + 1}</bdi> מתוך{" "}
                <bdi className="num">{order.length}</bdi>
              </span>
            </div>

            {/* result flash overlay */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/92 backdrop-blur-sm"
                >
                  <Check className="size-7 text-up" />
                  <p className="text-sm font-bold">
                    הציבור: <bdi className="num">{formatPct(result.publicValue)}</bdi>{" "}
                    {q!.metricLabel}
                  </p>
                  {result.withMajority !== null && (
                    <p
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        result.withMajority
                          ? "bg-up/15 text-up"
                          : "bg-down/15 text-down"
                      )}
                    >
                      {result.withMajority ? "אתה עם הרוב" : "אתה במיעוט — בינתיים"}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
