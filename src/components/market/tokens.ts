"use client";

/** Reads the current brand/theme chart colors from CSS variables. */
export interface ChartTokens {
  up: string;
  down: string;
  live: string;
  grid: string;
  text: string;
  border: string;
  card: string;
  mono: string;
}

export function readChartTokens(): ChartTokens {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    up: get("--up", "#2ee6a8"),
    down: get("--down", "#ff5c7a"),
    live: get("--live", "#f5a623"),
    grid: get("--chart-grid", "#1c2432"),
    text: get("--muted-foreground", "#8b96a8"),
    border: get("--border", "#232c3b"),
    card: get("--card", "#111722"),
    mono: get("--brand-mono", "monospace"),
  };
}

/** Re-run `cb` whenever the theme class or brand attribute changes on <html>. */
export function observeThemeChange(cb: () => void): () => void {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-brand"],
  });
  return () => observer.disconnect();
}

/** Hex → rgba with alpha */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
