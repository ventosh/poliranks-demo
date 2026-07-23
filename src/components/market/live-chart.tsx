"use client";

import * as React from "react";
import {
  createChart,
  AreaSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { getEngine } from "@/lib/sim/engine";
import { resampleHistory, valueAt } from "@/lib/data/history";
import type { HistoryPoint, QuestionEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import {
  readChartTokens,
  observeThemeChange,
  withAlpha,
  type ChartTokens,
} from "@/components/market/tokens";
import { cn } from "@/lib/utils";

export type ChartRange = "1h" | "24h" | "7d" | "30d" | "all";

const RANGES: { id: ChartRange; label: string }[] = [
  { id: "1h", label: "שעה" },
  { id: "24h", label: "24 ש׳" },
  { id: "7d", label: "7 י׳" },
  { id: "30d", label: "30 י׳" },
  { id: "all", label: "הכל" },
];

const RANGE_SEC: Record<Exclude<ChartRange, "all">, number> = {
  "1h": 3600,
  "24h": 24 * 3600,
  "7d": 7 * 24 * 3600,
  "30d": 30 * 24 * 3600,
};

/** Uniform bucket size per range — required for correct x-axis spacing. */
const RANGE_STEP: Record<ChartRange, number> = {
  "1h": 30,
  "24h": 5 * 60,
  "7d": 30 * 60,
  "30d": 2 * 3600,
  all: 2 * 3600,
};

interface PinPos {
  event: QuestionEvent;
  x: number;
  y: number;
}

export interface ScrubPoint {
  time: number;
  value: number;
}

export function LiveChart({
  slug,
  height = 380,
  className,
  onScrub,
  building = false,
}: {
  slug: string;
  height?: number;
  className?: string;
  onScrub?: (p: ScrubPoint | null) => void;
  building?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
  const dirRef = React.useRef<1 | -1>(1);
  const onScrubRef = React.useRef(onScrub);
  onScrubRef.current = onScrub;

  const [range, setRange] = React.useState<ChartRange>("24h");
  const [pins, setPins] = React.useState<PinPos[]>([]);
  const [activePin, setActivePin] = React.useState<string | null>(null);
  const [liveDot, setLiveDot] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const rangeRef = React.useRef(range);
  rangeRef.current = range;

  const eventTime = React.useCallback(
    (e: QuestionEvent, bootSec: number): number =>
      e.timeSec ?? bootSec - e.hoursAgo * 3600,
    []
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const engine = getEngine();
    const history = engine.getHistory(slug);
    if (history.length === 0) return;

    let tokens = readChartTokens();
    const live = engine.getSnapshot().live[slug];
    dirRef.current = (live?.delta24h ?? 0) >= 0 ? 1 : -1;

    const dirColor = (t: ChartTokens) =>
      dirRef.current === 1 ? t.up : t.down;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: tokens.text,
        fontFamily: tokens.mono,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: tokens.grid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.18, bottom: 0.18 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { style: 3, color: tokens.text, labelBackgroundColor: tokens.card },
        horzLine: { style: 3, color: tokens.text, labelBackgroundColor: tokens.card },
      },
      localization: {
        locale: "he-IL",
        priceFormatter: (v: number) => `${v.toFixed(1)}%`,
      },
    });
    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: dirColor(tokens),
      topColor: withAlpha(dirColor(tokens), 0.22),
      bottomColor: withAlpha(dirColor(tokens), 0),
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });
    seriesRef.current = series;
    const stepRef = { current: RANGE_STEP[rangeRef.current] };

    const loadData = (r: ChartRange) => {
      const h = engine.getHistory(slug);
      const last = h[h.length - 1]?.time ?? Math.floor(Date.now() / 1000);
      const step = RANGE_STEP[r];
      stepRef.current = step;
      // Data window: enough back-history for panning without huge point counts
      const from =
        r === "1h" ? last - 24 * 3600 : r === "24h" ? last - 7 * 24 * 3600 : h[0].time;
      const data = resampleHistory(h, step, Math.max(from, h[0].time), last);
      series.setData(
        data.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
      );
    };

    const histValueAt = (t: number): number => valueAt(engine.getHistory(slug), t);

    let raf = 0;
    const reposition = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const snap = engine.getSnapshot();
        const events = snap.events[slug] ?? [];
        const ts = chart.timeScale();
        const next: PinPos[] = [];
        for (const e of events) {
          const t = eventTime(e, engine.nowSecAtBoot);
          // snap to the active bucket grid — off-grid times yield null coords
          const tSnap = Math.floor(t / stepRef.current) * stepRef.current;
          const x = ts.timeToCoordinate(tSnap as UTCTimestamp);
          if (x === null) continue;
          const y = series.priceToCoordinate(histValueAt(t));
          if (y === null) continue;
          next.push({ event: e, x, y });
        }
        setPins(next);

        const h = engine.getHistory(slug);
        const last = h[h.length - 1];
        if (last) {
          const bucket =
            Math.floor(last.time / stepRef.current) * stepRef.current;
          const lx = ts.timeToCoordinate(bucket as UTCTimestamp);
          const ly = series.priceToCoordinate(last.value);
          setLiveDot(lx !== null && ly !== null ? { x: lx, y: ly } : null);
        }
      });
    };

    const applyRange = (r: ChartRange) => {
      loadData(r);
      const h = engine.getHistory(slug);
      const last = h[h.length - 1]?.time ?? Math.floor(Date.now() / 1000);
      if (r === "all") {
        chart.timeScale().fitContent();
      } else {
        chart.timeScale().setVisibleRange({
          from: (last - RANGE_SEC[r]) as UTCTimestamp,
          to: (last + RANGE_STEP[r] * 4) as UTCTimestamp,
        });
      }
      reposition();
    };
    applyRange(rangeRef.current);

    const unsubTick = engine.onTick((s, point: HistoryPoint) => {
      if (s !== slug) return;
      // Update the CURRENT bucket (live-candle semantics) — appends a new
      // bucket only when the wall clock crosses a bucket boundary.
      const bucket = (Math.floor(point.time / stepRef.current) *
        stepRef.current) as UTCTimestamp;
      series.update({ time: bucket, value: point.value });
      const d = engine.getSnapshot().live[slug]?.delta24h ?? 0;
      const newDir: 1 | -1 = d >= 0 ? 1 : -1;
      if (newDir !== dirRef.current) {
        dirRef.current = newDir;
        const t = readChartTokens();
        series.applyOptions({
          lineColor: dirColor(t),
          topColor: withAlpha(dirColor(t), 0.22),
          bottomColor: withAlpha(dirColor(t), 0),
        });
      }
      reposition();
    });

    const unsubEvent = engine.onEvent((s) => {
      if (s === slug) reposition();
    });

    const onCrosshair = (param: {
      time?: unknown;
      seriesData: Map<unknown, unknown>;
    }) => {
      const data = param.seriesData.get(series) as
        | { time: number; value: number }
        | undefined;
      if (param.time && data) {
        onScrubRef.current?.({ time: data.time, value: data.value });
      } else {
        onScrubRef.current?.(null);
      }
    };
    chart.subscribeCrosshairMove(onCrosshair);
    chart.timeScale().subscribeVisibleTimeRangeChange(reposition);

    const unobserveTheme = observeThemeChange(() => {
      tokens = readChartTokens();
      chart.applyOptions({
        layout: {
          background: { color: "transparent" },
          textColor: tokens.text,
          fontFamily: tokens.mono,
        },
        grid: { horzLines: { color: tokens.grid } },
        crosshair: {
          vertLine: { color: tokens.text, labelBackgroundColor: tokens.card },
          horzLine: { color: tokens.text, labelBackgroundColor: tokens.card },
        },
      });
      series.applyOptions({
        lineColor: dirColor(tokens),
        topColor: withAlpha(dirColor(tokens), 0.22),
        bottomColor: withAlpha(dirColor(tokens), 0),
      });
      reposition();
    });

    // expose applyRange for the pills via a custom property
    (container as HTMLDivElement & { __applyRange?: (r: ChartRange) => void }).__applyRange = applyRange;

    return () => {
      cancelAnimationFrame(raf);
      unsubTick();
      unsubEvent();
      unobserveTheme();
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [slug, eventTime]);

  const changeRange = (r: ChartRange) => {
    setRange(r);
    const container = containerRef.current as
      | (HTMLDivElement & { __applyRange?: (r: ChartRange) => void })
      | null;
    container?.__applyRange?.(r);
  };

  const active = activePin
    ? pins.find((p) => p.event.id === activePin) ?? null
    : null;
  const engineBoot =
    typeof window !== "undefined" ? getEngine().nowSecAtBoot : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="live-dot inline-block size-1.5 rounded-full bg-live" />
          מתעדכן בזמן אמת
        </div>
        <div
          className="inline-flex items-center rounded-lg border border-border bg-card p-0.5"
          role="tablist"
          aria-label="טווח זמן"
        >
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range === r.id}
              onClick={() => changeRange(r.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors min-h-[30px]",
                range === r.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="chart-island relative w-full overflow-hidden rounded-lg"
        style={{ height }}
        dir="ltr"
        onMouseLeave={() => setActivePin(null)}
      >
        <div ref={containerRef} className="absolute inset-0" />

        {/* live dot */}
        {liveDot && (
          <span
            className="pointer-events-none absolute z-10"
            style={{ left: liveDot.x - 4, top: liveDot.y - 4 }}
          >
            <span className="live-dot block size-2 rounded-full bg-live shadow-[0_0_8px_2px_color-mix(in_srgb,var(--live)_45%,transparent)]" />
          </span>
        )}

        {/* event pins */}
        {pins.map((p) => (
          <button
            key={p.event.id}
            aria-label={`אירוע: ${p.event.title}`}
            className={cn(
              "absolute z-20 -translate-x-1/2 transition-transform hover:scale-125 focus-visible:scale-125 outline-none",
              activePin === p.event.id && "scale-125"
            )}
            style={{ left: p.x, top: Math.max(6, p.y - 22) }}
            onMouseEnter={() => setActivePin(p.event.id)}
            onFocus={() => setActivePin(p.event.id)}
            onClick={() => setActivePin(p.event.id)}
          >
            <span className="block size-3 rotate-45 border border-live bg-live/80 shadow-[0_0_6px_1px_color-mix(in_srgb,var(--live)_40%,transparent)]" />
            <span className="absolute left-1/2 top-3 h-4 w-px -translate-x-1/2 bg-live/50" />
          </button>
        ))}

        {/* event popover */}
        {active && (
          <div
            dir="rtl"
            className="absolute z-30 w-72 max-w-[85%] rounded-lg border border-border bg-popover/90 p-3 text-popover-foreground shadow-xl backdrop-blur-md"
            style={{
              left: Math.min(
                Math.max(active.x - 144, 8),
                (containerRef.current?.clientWidth ?? 320) - 296
              ),
              top: Math.max(8, Math.min(active.y + 8, height - 150)),
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="size-2 rotate-45 bg-live" />
              <span className="text-[11px] font-semibold text-live">אירוע</span>
              <span className="num ms-auto text-[10px] text-muted-foreground">
                {formatDateTime(eventTime(active.event, engineBoot))}
              </span>
            </div>
            <p className="text-sm font-semibold leading-snug">
              {active.event.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {active.event.summary}
            </p>
            <p className="mt-2 rounded-md bg-accent/60 px-2 py-1.5 text-[11px] leading-relaxed">
              {active.event.deltaNote}
            </p>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              מקור: {active.event.source}
            </p>
          </div>
        )}

        {/* building state */}
        {building && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-1 bg-background/70 backdrop-blur-sm" dir="rtl">
            <span className="text-sm font-semibold">מדד בהקמה</span>
            <span className="text-xs text-muted-foreground">
              נדרשות לפחות 50 הצבעות להצגת גרף אמין
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
