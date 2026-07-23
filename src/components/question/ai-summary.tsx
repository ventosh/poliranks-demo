import { Sparkles, BadgeCheck } from "lucide-react";
import type { Question } from "@/lib/types";
import { formatTimeAgo } from "@/lib/format";

function SourceRef({ n }: { n: number }) {
  return (
    <sup className="ms-0.5 select-none text-[9px] font-semibold text-ai">
      [{n}]
    </sup>
  );
}

/** AI-generated summary — visually quarantined with the AI accent (violet). */
export function AiSummary({ q }: { q: Question }) {
  const s = q.aiSummary;
  return (
    <section className="rounded-xl border border-ai/25 bg-card p-4 border-s-2 border-s-ai">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-ai/15 px-2 py-0.5 text-[11px] font-bold text-ai">
          <Sparkles className="size-3" />
          AI
        </span>
        <h3 className="text-sm font-bold">תקציר הנושא</h3>
        <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <BadgeCheck className="size-3.5 text-ai" />
          נכתב על ידי AI · אושר על ידי עורך · עודכן {formatTimeAgo(s.updatedMinutesAgo)}
        </span>
      </div>

      <dl className="flex flex-col gap-2.5 text-[13px] leading-relaxed">
        <div>
          <dt className="mb-0.5 text-[11px] font-semibold text-muted-foreground">מה הנושא</dt>
          <dd>
            {s.what}
            <SourceRef n={1} />
          </dd>
        </div>
        <div>
          <dt className="mb-0.5 text-[11px] font-semibold text-muted-foreground">מה קרה לאחרונה</dt>
          <dd>
            {s.latest}
            <SourceRef n={1} />
            <SourceRef n={2} />
          </dd>
        </div>
        <div>
          <dt className="mb-0.5 text-[11px] font-semibold text-muted-foreground">שחקנים מרכזיים</dt>
          <dd className="flex flex-wrap gap-1.5">
            {s.players.map((p) => (
              <span key={p} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                {p}
              </span>
            ))}
          </dd>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg bg-up/8 p-2.5" style={{ backgroundColor: "color-mix(in srgb, var(--up) 8%, transparent)" }}>
            <dt className="mb-1 text-[11px] font-semibold text-up">טיעונים בעד</dt>
            <dd>
              <ul className="flex list-disc flex-col gap-1 ps-4 text-xs">
                {s.pro.map((x, i) => (
                  <li key={i}>
                    {x}
                    <SourceRef n={2} />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "color-mix(in srgb, var(--down) 8%, transparent)" }}>
            <dt className="mb-1 text-[11px] font-semibold text-down">טיעונים נגד</dt>
            <dd>
              <ul className="flex list-disc flex-col gap-1 ps-4 text-xs">
                {s.con.map((x, i) => (
                  <li key={i}>
                    {x}
                    <SourceRef n={3} />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-accent/40 p-2.5">
          <dt className="mb-0.5 text-[11px] font-semibold text-muted-foreground">מה הזיז את המדד</dt>
          <dd className="text-xs">
            {s.moved}
            <SourceRef n={1} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
