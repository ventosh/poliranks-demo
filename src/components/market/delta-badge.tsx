import { formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * ▲/▼ + signed delta. Always arrow + sign + color (never color alone),
 * numerals isolated LTR via .num.
 */
export function DeltaBadge({
  delta,
  suffix = "%",
  className,
  size = "sm",
}: {
  delta: number;
  suffix?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const dir = delta > 0.049 ? 1 : delta < -0.049 ? -1 : 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold",
        dir === 1 && "text-up",
        dir === -1 && "text-down",
        dir === 0 && "text-flat",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
    >
      <span aria-hidden className="text-[0.8em] leading-none">
        {dir === 1 ? "▲" : dir === -1 ? "▼" : "—"}
      </span>
      <bdi className="num">
        {formatSigned(delta)}
        {suffix}
      </bdi>
    </span>
  );
}
