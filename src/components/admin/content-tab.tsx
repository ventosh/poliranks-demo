"use client";

import { FileClock, FolderKanban } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CONTENT_ITEMS, DECISION_LOG, SOURCES } from "@/lib/data/admin";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  טיוטה: "bg-muted text-muted-foreground border-border",
  בבדיקה: "bg-live/15 text-live border-live/25",
  פורסם: "bg-up/15 text-up border-up/25",
  הוסר: "bg-down/15 text-down border-down/25",
};

const LEAN_TONE: Record<string, string> = {
  ימין: "text-down",
  מרכז: "text-muted-foreground",
  שמאל: "text-primary",
};

export function ContentTab() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* content lifecycle */}
      <section className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <FolderKanban className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">מחזור חיי תוכן</h2>
          <span className="ms-auto text-[10px] text-muted-foreground">
            טיוטה → בבדיקה → פורסם → הוסר
          </span>
        </div>
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">פריט</TableHead>
              <TableHead className="text-start">סוג</TableHead>
              <TableHead className="text-start">סטטוס</TableHead>
              <TableHead className="text-start">עודכן</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CONTENT_ITEMS.map((c) => (
              <TableRow key={c.id} className="hover:bg-accent/40">
                <TableCell className="max-w-[280px] truncate text-[13px] font-medium">
                  {c.title}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.kind}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                      STATUS_TONE[c.status]
                    )}
                  >
                    {c.status}
                  </span>
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {formatTimeAgo(c.updatedMinutesAgo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 border-t border-border pt-3">
          <h3 className="mb-2 text-xs font-bold text-muted-foreground">
            מקורות (עם תיוג נטייה — לבדיקת איזון)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px]"
              >
                {s.name}
                <span className={cn("font-semibold", LEAN_TONE[s.lean])}>
                  {s.lean}
                </span>
                <bdi className="num text-muted-foreground">{s.itemsToday}</bdi>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* decision log */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileClock className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">יומן החלטות</h2>
          <span className="ms-auto text-[10px] text-muted-foreground">
            append-only · ניתן לייצוא
          </span>
        </div>
        <ol className="relative flex flex-col gap-0 border-s border-border ps-4">
          {DECISION_LOG.map((d) => (
            <li key={d.id} className="relative pb-4 last:pb-0">
              <span className="absolute -start-[21px] top-1 size-2.5 rounded-full border-2 border-background bg-primary" />
              <p className="text-[13px] font-medium leading-snug">
                <span className="font-bold">{d.actor}</span> · {d.action}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{d.target}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {d.reason} · {formatTimeAgo(d.minutesAgo)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
