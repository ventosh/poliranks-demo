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

  for (let i = 0; i <= steps; i++) {
    const t = start + i * STEP_SEC;
    for (const e of events) {
      // Apply each event as a ramp over ~4 steps starting at its timestamp
      if (t >= e.time && t < e.time + 4 * STEP_SEC) {
        meanShift += e.impact / 4;
        v += e.impact / 4;
      }
    }
    const mean = baseline + meanShift;
    v = v + theta * (mean - v) + normal(rand) * q.sigma;
    v = clamp(v, 3, 97);
    points.push({ time: t, value: Math.round(v * 10) / 10 });
  }
  return points;
}
