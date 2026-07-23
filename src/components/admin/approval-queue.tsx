"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Bot,
  Check,
  ExternalLink,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SimEngine, SimSnapshot } from "@/lib/sim/engine";
import type { AgentProposal } from "@/lib/types";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<AgentProposal["kind"], string> = {
  event: "אירוע מועמד",
  question: "טיוטת שאלה",
  summary: "רענון תקציר",
  "event-pin": "סימון על גרף",
  expiry: "תפוגת אירוע",
};

const PRIORITY_TONE: Record<number, string> = {
  1: "bg-down/15 text-down border-down/25",
  2: "bg-live/15 text-live border-live/25",
  3: "bg-muted text-muted-foreground border-border",
};

const REASON_CODES = [
  { code: "L-02", label: "ניסוח מוביל / מוטה" },
  { code: "R-01", label: "רלוונטיות נמוכה" },
  { code: "S-03", label: "מקור חלש / חד-צדדי" },
  { code: "D-04", label: "כפילות" },
];

function ProposalRow({
  p,
  onResolve,
}: {
  p: AgentProposal;
  onResolve: (id: string, r: "approved" | "edited" | "rejected") => void;
}) {
  const [rejectOpen, setRejectOpen] = React.useState(false);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="mb-2 rounded-xl border border-border bg-card p-3.5 border-s-2 border-s-ai">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-ai/15 px-2 py-0.5 font-bold text-ai">
            <Bot className="size-3" />
            {p.agent}
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground">
            {KIND_LABEL[p.kind]}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-bold",
              PRIORITY_TONE[p.priority]
            )}
          >
            עדיפות {p.priority}
          </span>
          <span className="ms-auto text-muted-foreground">
            {formatTimeAgo(p.minutesAgo)}
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold leading-snug">{p.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {p.payload}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>
            ביטחון: <bdi className="num font-semibold text-foreground">{Math.round(p.confidence * 100)}%</bdi>
          </span>
          <span>
            מודל: <bdi className="num">{p.model}</bdi> · {p.provider}
          </span>
          <span>
            עלות: <bdi className="num">${p.costUsd.toFixed(4)}</bdi>
          </span>
          {p.questionSlug && (
            <Link
              href={`/q/${p.questionSlug}`}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              לשאלה המקושרת
              <ExternalLink className="size-3" />
            </Link>
          )}
          <div className="ms-auto flex gap-1.5">
            <Button
              size="sm"
              className="h-8 gap-1 bg-up font-bold text-[#04231a] hover:bg-up/90"
              onClick={() => onResolve(p.id, "approved")}
            >
              <Check className="size-3.5" />
              אישור
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => onResolve(p.id, "edited")}
            >
              <Pencil className="size-3.5" />
              עריכה ואישור
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-down/30 text-down hover:bg-down/10"
              onClick={() => setRejectOpen(true)}
            >
              <X className="size-3.5" />
              דחייה
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-start text-base">
              דחיית הצעה — קוד סיבה (חובה)
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            הסיבה נשמרת ביומן ומוזרקת חזרה ללמידת הסוכן (few-shot).
          </p>
          <div className="flex flex-col gap-1.5">
            {REASON_CODES.map((r) => (
              <button
                key={r.code}
                onClick={() => {
                  setRejectOpen(false);
                  onResolve(p.id, "rejected");
                  toast("ההצעה נדחתה", {
                    description: `קוד ${r.code} · ${r.label} — נוסף למאגר הלמידה של הסוכן`,
                  });
                }}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-start text-sm transition-colors hover:border-down/40 hover:bg-down/5"
              >
                <span className="num rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                  {r.code}
                </span>
                {r.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.li>
  );
}

export function ApprovalQueue({
  sim,
}: {
  sim: { snap: SimSnapshot; engine: SimEngine };
}) {
  const pending = sim.snap.proposals
    .filter((p) => p.status === "pending")
    .sort((a, b) => a.priority - b.priority || a.minutesAgo - b.minutesAgo);

  const resolve = (id: string, r: "approved" | "edited" | "rejected") => {
    const t = sim.engine.resolveProposal(id, r);
    if (t) {
      toast(t.title, {
        description: t.body,
        icon: <Sparkles className="size-4" />,
        duration: 6000,
      });
    } else if (r !== "rejected") {
      toast(r === "approved" ? "אושר ופורסם" : "נערך ואושר", {
        description: "נרשם ביומן ההחלטות · ההחלטה מזינה את לולאת הלמידה",
      });
    }
  };

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <Check className="size-8 text-up" />
        <p className="text-sm font-semibold">התור ריק — כל ההצעות טופלו</p>
        <p className="text-xs text-muted-foreground">
          הסוכנים ימשיכו להזרים הצעות עם כל מחזור סריקה
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {pending.map((p) => (
          <ProposalRow key={p.id} p={p} onResolve={resolve} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
