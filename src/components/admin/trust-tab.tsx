"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CredibilityBadge } from "@/components/market/credibility-badge";
import { QUESTION_BY_SLUG, QUESTIONS } from "@/lib/data/questions";
import type { SimEngine, SimSnapshot } from "@/lib/sim/engine";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERITY_TONE: Record<string, string> = {
  נמוכה: "bg-muted text-muted-foreground",
  בינונית: "bg-live/15 text-live",
  גבוהה: "bg-down/15 text-down",
};

export function TrustTab({
  sim,
}: {
  sim: { snap: SimSnapshot; engine: SimEngine };
}) {
  const [deweighted, setDeweighted] = React.useState<Set<string>>(new Set());

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* anomaly feed */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-live" />
          <h2 className="text-sm font-bold">התראות חריגה</h2>
          <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-live">
            <span className="live-dot size-1.5 rounded-full bg-live" />
            זמן אמת
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {sim.snap.anomalies.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-border bg-background p-2.5"
            >
              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-bold",
                    SEVERITY_TONE[a.severity]
                  )}
                >
                  {a.severity}
                </span>
                <span className="text-muted-foreground">{a.scope}</span>
                <span className="ms-auto text-[10px] text-muted-foreground">
                  {formatTimeAgo(a.minutesAgo)}
                </span>
              </div>
              <p className="mt-1.5 text-xs font-medium leading-snug">{a.rule}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {QUESTION_BY_SLUG.get(a.questionSlug)?.short} · {a.action}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* suspicious users */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <UserX className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">משתמשים חשודים</h2>
          <span className="ms-auto text-[10px] text-muted-foreground">
            לעולם לא נמחקים בשקט — רק משוקללים
          </span>
        </div>
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">משתמש</TableHead>
              <TableHead className="text-start">משקל</TableHead>
              <TableHead className="text-start" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sim.snap.suspicious.slice(0, 6).map((u) => {
              const done = deweighted.has(u.id);
              return (
                <TableRow key={u.id} className="hover:bg-accent/40">
                  <TableCell>
                    <p className="num text-xs font-semibold">{u.handle}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {u.signal}
                    </p>
                  </TableCell>
                  <TableCell>
                    <bdi
                      className={cn(
                        "num text-xs font-bold",
                        (done ? 0 : u.weight) <= 0.2 ? "text-down" : "text-live"
                      )}
                    >
                      ×{(done ? 0 : u.weight).toFixed(1)}
                    </bdi>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={done}
                      className="h-7 text-[11px]"
                      onClick={() => {
                        setDeweighted((s) => new Set(s).add(u.id));
                        toast("המשקל אופס", {
                          description: `${u.handle} — הצבעות קיימות סומנו, נרשם ביומן`,
                        });
                      }}
                    >
                      {done ? "אופס" : "איפוס משקל"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      {/* credibility overrides */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">מדדי אמינות לפי שאלה</h2>
          <span className="ms-auto text-[10px] text-muted-foreground">
            דריסה ידנית מחייבת נימוק
          </span>
        </div>
        <ul className="flex flex-col">
          {QUESTIONS.map((q) => {
            const lq = sim.snap.live[q.slug];
            return (
              <li
                key={q.slug}
                className={cn(
                  "flex items-center gap-2 border-b border-border py-2.5 last:border-b-0",
                  lq.anomalyActive && "rounded-md bg-down/5 px-2"
                )}
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {q.short}
                </span>
                {lq.anomalyActive && (
                  <span className="rounded-full bg-down/15 px-2 py-0.5 text-[10px] font-bold text-down">
                    חריגה פעילה
                  </span>
                )}
                <CredibilityBadge level={lq.credibility} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
