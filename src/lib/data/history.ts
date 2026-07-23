import { mulberry32, hashSeed, normal, clamp } from "@/lib/rng";
import { EVENTS_BY_QUESTION } from "@/lib/data/events";
import type { HistoryPoint, Question } from "@/lib/types";

export const STEP_SEC = 15 * 60; // 15-minute buckets
export const DAYS = 30;

/**
 * Deterministic 30-day history: mean-reverting walk (Ornstein-Uhlenbeck-ish)
 * + smoothed step impacts at event timestamps.
 * Anchored to `nowSec` so the newest point is "now".
 */
export function generateHistory(q: Question, nowSec: number): HistoryPoint[] {
  const rand = mulberry32(hashSeed(`history:${q.slug}`));
  const steps = (DAYS * 24 * 3600) / STEP_SEC;
  const start = nowSec - steps * STEP_SEC;
  const theta = 0.02; // mean reversion strength
  const events = (EVENTS_BY_QUESTION.get(q.id) ?? []).map((e) => ({
    time: nowSec - e.hoursAgo * 3600,
    impact: e.impact,
  }));

  const points: HistoryPoint[] = [];
  // Start offset from base so the series has somewhere to drift from
  let v = q.base + normal(rand) * q.sigma * 6;
  // Sum of event impacts shifts the effective mean after each event
  let meanShift = 0;
  // Pre-compute total future impact so the series ends near base + all impacts
  const baseline = q.base - events.reduce((s, e) => s + e.impact, 0) * 0.5;

  const FINE_SEC = 30; // 30-second buckets for the last 4 hours
  const fineStart = nowSec - 4 * 3600;

  const applyEvents = (t: number, stepSec: number) => {
    for (const e of events) {
      if (t >= e.time && t < e.time + 4 * STEP_SEC) {
        const frac = stepSec / STEP_SEC / 4;
        meanShift += e.impact * frac;
        v += e.impact * frac;
      }
    }
  };

  const push = (t: number, stepSec: number) => {
    applyEvents(t, stepSec);
    const mean = baseline + meanShift;
    // scale noise & reversion with sqrt(dt) so resolutions stitch smoothly
    const scale = Math.sqrt(stepSec / STEP_SEC);
    v = v + theta * scale * (mean - v) + normal(rand) * q.sigma * scale;
    v = clamp(v, 3, 97);
    points.push({ time: t, value: Math.round(v * 10) / 10 });
  };

  for (let i = 0; i <= steps; i++) {
    const t = start + i * STEP_SEC;
    if (t >= fineStart) break;
    push(t, STEP_SEC);
  }
  for (let t = fineStart; t <= nowSec; t += FINE_SEC) {
    push(t, FINE_SEC);
  }
  return points;
}

/** Last-known value at time t (binary search). */
export function valueAt(history: HistoryPoint[], t: number): number {
  let lo = 0,
    hi = history.length - 1,
    best = history[0]?.value ?? 50;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (history[mid].time <= t) {
      best = history[mid].value;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return best;
}

/**
 * Resample onto a UNIFORM bucket grid — lightweight-charts spaces points by
 * index, so mixed resolutions distort the x-axis unless the grid is uniform.
 * Mirrors production `metric_snapshots` bucket semantics.
 */
export function resampleHistory(
  history: HistoryPoint[],
  stepSec: number,
  fromSec: number,
  toSec: number
): HistoryPoint[] {
  if (history.length === 0) return [];
  const first = history[0].time;
  const start = Math.max(Math.ceil(fromSec / stepSec) * stepSec, Math.ceil(first / stepSec) * stepSec);
  const out: HistoryPoint[] = [];
  for (let t = start; t <= toSec; t += stepSec) {
    out.push({ time: t, value: valueAt(history, t) });
  }
  return out;
}
