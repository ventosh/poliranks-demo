const nfPct = new Intl.NumberFormat("he-IL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const nfCompact = new Intl.NumberFormat("he-IL", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const nfInt = new Intl.NumberFormat("he-IL");

export function formatPct(v: number): string {
  return `${nfPct.format(v)}%`;
}

/** Signed delta, LTR-safe when wrapped in .num — e.g. "+2.4" */
export function formatSigned(v: number, digits = 1): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(digits)}`;
}

export function formatCompact(v: number): string {
  return nfCompact.format(v);
}

export function formatInt(v: number): string {
  return nfInt.format(v);
}

export function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${Math.round(minutes)} דק׳`;
  const h = Math.round(minutes / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.round(h / 24);
  return `לפני ${d} ימים`;
}

export function formatClock(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(unixSeconds: number): string {
  return `${formatDate(unixSeconds)} · ${formatClock(unixSeconds)}`;
}
