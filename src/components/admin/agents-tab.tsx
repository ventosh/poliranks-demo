"use client";

import * as React from "react";
import { toast } from "sonner";
import { Bot, CircleDollarSign, Timer } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AGENT_OPS } from "@/lib/data/admin";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIER_TONE: Record<string, string> = {
  fast: "bg-muted text-muted-foreground",
  balanced: "bg-primary/15 text-primary",
  frontier: "bg-ai/15 text-ai",
};

export function AgentsTab() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(
    Object.fromEntries(AGENT_OPS.map((a) => [a.agent, a.enabled]))
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        ניתוב לפי דרגות יכולת (fast / balanced / frontier) · ספק־עצמאי — החלפת מודל
        היא שינוי קונפיגורציה שמחייב מעבר eval ירוק
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {AGENT_OPS.map((a) => {
          const on = enabled[a.agent];
          return (
            <div
              key={a.agent}
              className={cn(
                "rounded-xl border border-border bg-card p-4 transition-opacity",
                !on && "opacity-55"
              )}
            >
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-ai" />
                <h3 className="text-sm font-bold">{a.agent}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    TIER_TONE[a.tier]
                  )}
                >
                  {a.tier}
                </span>
                <Switch
                  dir="ltr"
                  checked={on}
                  onCheckedChange={(v) => {
                    setEnabled((s) => ({ ...s, [a.agent]: v }));
                    toast(v ? "הסוכן הופעל" : "מתג חירום — הסוכן הושהה", {
                      description: `${a.agent} · נרשם ביומן ההחלטות`,
                    });
                  }}
                  className="ms-auto"
                  aria-label={`מתג ${a.agent}`}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Timer className="size-3" />
                  ריצה אחרונה
                </span>
                <span className="text-end font-medium">
                  {formatTimeAgo(a.lastRunMinutesAgo)}
                </span>
                <span className="text-muted-foreground">ריצות היום</span>
                <bdi className="num text-end font-medium">{a.runsToday}</bdi>
                <span className="text-muted-foreground">שגיאות</span>
                <bdi
                  className={cn(
                    "num text-end font-medium",
                    a.errorRatePct > 2 ? "text-down" : "text-up"
                  )}
                >
                  {a.errorRatePct}%
                </bdi>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CircleDollarSign className="size-3" />
                  עלות היום
                </span>
                <bdi className="num text-end font-medium">
                  ${a.costTodayUsd.toFixed(2)}
                </bdi>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>שיעור אישור (מלולאת הלמידה)</span>
                  <bdi className="num font-semibold text-foreground">
                    {a.approvalRatePct}%
                  </bdi>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" dir="ltr">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      a.approvalRatePct >= 85 ? "bg-up" : "bg-live"
                    )}
                    style={{ width: `${a.approvalRatePct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
