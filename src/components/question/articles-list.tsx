import { Newspaper, ExternalLink } from "lucide-react";
import type { Question } from "@/lib/types";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const LEAN_TONE: Record<string, string> = {
  ימין: "bg-down/10 text-down border-down/25",
  מרכז: "bg-muted text-muted-foreground border-border",
  שמאל: "bg-primary/10 text-primary border-primary/25",
};

export function ArticlesList({ q }: { q: Question }) {
  const outlets = new Set(q.articles.map((a) => a.outlet)).size;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Newspaper className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-bold">כתבות קשורות</h3>
        <span className="ms-auto text-[10px] text-muted-foreground">
          {outlets} כלי תקשורת · בדיקת איזון מקורות ✓
        </span>
      </div>
      <ul className="flex flex-col">
        {q.articles.map((a, i) => (
          <li
            key={a.id}
            className="group flex cursor-pointer items-start gap-3 border-b border-border py-2.5 transition-colors last:border-b-0 last:pb-0 first:pt-0 hover:bg-accent/40"
          >
            <span className="num mt-0.5 text-[10px] text-ai">[{i + 1}]</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-snug group-hover:underline">
                {a.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{a.outlet}</span>
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-px text-[9px] font-semibold",
                    LEAN_TONE[a.lean]
                  )}
                >
                  {a.lean}
                </span>
                <span>{formatTimeAgo(a.minutesAgo)}</span>
              </div>
            </div>
            <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </li>
        ))}
      </ul>
    </section>
  );
}
