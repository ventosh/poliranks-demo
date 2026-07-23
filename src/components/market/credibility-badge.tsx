import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { CredibilityLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVELS: Record<
  CredibilityLevel,
  { label: string; tone: "up" | "muted" | "warn" | "down" }
> = {
  5: { label: "אמינות גבוהה", tone: "up" },
  4: { label: "אמינות בינונית", tone: "muted" },
  3: { label: "אמינות נמוכה", tone: "warn" },
  2: { label: "חשד לפעילות חריגה", tone: "down" },
  1: { label: "דורש עוד נתונים", tone: "muted" },
};

export function CredibilityBadge({
  level,
  className,
  showLabel = true,
}: {
  level: CredibilityLevel;
  className?: string;
  showLabel?: boolean;
}) {
  const def = LEVELS[level];
  const Icon =
    def.tone === "down"
      ? ShieldAlert
      : def.tone === "muted" && level === 1
        ? ShieldQuestion
        : ShieldCheck;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        def.tone === "up" && "border-up/30 bg-up/10 text-up",
        def.tone === "muted" && "border-border bg-muted text-muted-foreground",
        def.tone === "warn" && "border-live/30 bg-live/10 text-live",
        def.tone === "down" && "border-down/30 bg-down/10 text-down",
        className
      )}
    >
      <Icon className="size-3.5" />
      {showLabel && def.label}
    </span>
  );
}
