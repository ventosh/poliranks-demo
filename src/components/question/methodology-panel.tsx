"use client";

import { HelpCircle, Scale } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Question } from "@/lib/types";
import { formatInt } from "@/lib/format";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}

/** The trust differentiator: full methodology transparency per graph. */
export function MethodologyPanel({ q }: { q: Question }) {
  const m = q.methodology;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <HelpCircle className="size-3.5" />
          איך מחושב המדד?
        </button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-start">
            <Scale className="size-4 text-live" />
            איך מחושב המדד?
          </DialogTitle>
          <DialogDescription className="text-start">
            שקיפות מלאה — כל גרף מסביר את עצמו ואת מגבלותיו.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <Row label="סה״כ משיבים (N)" value={<bdi className="num">{formatInt(m.totalN)}</bdi>} />
          <Row label="מאומתי טלפון" value={<bdi className="num">{m.verifiedPct}%</bdi>} />
          <Row
            label="שקלול דמוגרפי"
            value={m.weighting ? "הופעל (מול בסיס הלמ״ס)" : "לא הופעל"}
          />
          <Row
            label="חריגות שזוהו"
            value={
              m.anomaliesDetected ? (
                <span className="text-down">כן — טופלו והופחת משקלן</span>
              ) : (
                <span className="text-up">לא</span>
              )
            }
          />
          <Row label="פיזור דמוגרפי" value={<span className="max-w-[220px] text-xs">{m.demographicNote}</span>} />
          <Row label="חתכים מוצגים" value="רק מעל סף אנונימיות של 50 משיבים" />
        </div>
        <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">מגבלות המדד</p>
          <ul className="flex list-disc flex-col gap-1 ps-4">
            {m.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
