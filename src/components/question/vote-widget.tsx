"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import type { LiveQuestion } from "@/lib/sim/engine";
import type { Question } from "@/lib/types";
import {
  answerFollowUp,
  castVote,
  getVote,
  type VoteRecord,
} from "@/lib/user-state";
import { formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

const STANCE_OPTIONS = [
  { id: "support", label: "תומך", tone: "up" as const },
  { id: "oppose", label: "מתנגד", tone: "down" as const },
  { id: "unsure", label: "לא בטוח", tone: "flat" as const },
];

function YouVsPublic({ q, live, vote }: { q: Question; live: LiveQuestion; vote: VoteRecord }) {
  const support = live.value;
  const isImportance = q.type === "importance";
  const youLabel =
    STANCE_OPTIONS.find((o) => o.id === vote.choice)?.label ??
    (q.type === "scale" || isImportance ? `דירגת ${vote.choice}/5` : vote.choice);
  const withMajority =
    (vote.choice === "support" && support >= 50) ||
    (vote.choice === "oppose" && support < 50);

  return (
    <div className="rounded-lg border border-border bg-accent/40 p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold">אתה מול הציבור</span>
        {!isImportance && q.type === "stance" && (
          <span className="text-muted-foreground">
            {withMajority ? "אתה עם הרוב" : "אתה במיעוט — בינתיים"}
          </span>
        )}
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted" dir="ltr">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-up/70 transition-all duration-700"
          style={{ width: `${support}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground transition-all duration-700"
          style={{ left: `calc(${support}% - 1px)` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {q.metricLabel}: <bdi className="num font-semibold text-foreground">{formatPct(support)}</bdi>
        </span>
        <span>
          העמדה שלך: <span className="font-semibold text-foreground">{youLabel}</span>
        </span>
      </div>
    </div>
  );
}

export function VoteWidget({
  q,
  live,
  className,
}: {
  q: Question;
  live: LiveQuestion;
  className?: string;
}) {
  const [vote, setVote] = React.useState<VoteRecord | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setVote(getVote(q.slug) ?? null);
    setMounted(true);
  }, [q.slug]);

  const doVote = (choice: string) => {
    const rec = castVote(q.slug, choice);
    setVote({ ...rec });
    toast("ההצבעה נקלטה", {
      description: "+10 נקודות אזרחיות · הגרף יתעדכן בצבירה הבאה",
      icon: <Sparkles className="size-4" />,
    });
  };

  const isScale = q.type === "scale" || q.type === "importance";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">מה העמדה שלך?</h3>
        {vote && (
          <span className="inline-flex items-center gap-1 text-[11px] text-up">
            <Check className="size-3.5" />
            הצבעת — ניתן לשנות
          </span>
        )}
      </div>

      {!isScale ? (
        <div className="grid grid-cols-3 gap-2">
          {STANCE_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => doVote(o.id)}
              disabled={!mounted}
              className={cn(
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-semibold transition-all",
                vote?.choice === o.id
                  ? o.tone === "up"
                    ? "border-up bg-up/15 text-up"
                    : o.tone === "down"
                      ? "border-down bg-down/15 text-down"
                      : "border-border bg-muted text-foreground"
                  : "border-border bg-card hover:border-foreground/30"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-5 gap-1.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => doVote(String(n))}
                disabled={!mounted}
                className={cn(
                  "num min-h-[44px] rounded-lg border text-sm font-semibold transition-all",
                  vote?.choice === String(n)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card hover:border-foreground/30"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {q.type === "importance" ? "לא חשוב בכלל" : "כלל לא"}
            </span>
            <span>{q.type === "importance" ? "חשוב מאוד" : "במידה רבה"}</span>
          </div>
        </div>
      )}

      {vote && (
        <>
          <YouVsPublic q={q} live={live} vote={vote} />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              שאלות המשך (רשות · ‎+5 נק׳)
            </span>
            {q.followUps.map((fu) => (
              <div key={fu.id} className="rounded-lg border border-border p-2.5">
                <p className="mb-1.5 text-xs font-medium">{fu.question}</p>
                <div className="flex flex-wrap gap-1.5">
                  {fu.options.map((op) => (
                    <button
                      key={op}
                      onClick={() => {
                        answerFollowUp(q.slug, fu.id, op);
                        setVote((v) =>
                          v ? { ...v, followUps: { ...v.followUps, [fu.id]: op } } : v
                        );
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        vote.followUps[fu.id] === op
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
