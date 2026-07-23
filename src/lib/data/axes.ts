import { hashSeed, mulberry32 } from "@/lib/rng";
import type { AxisId } from "@/lib/types";

/**
 * Ideological axes (PRD §2.4 — 6 of the 10).
 * Scale 0–100: 100 = pole A, 0 = pole B, 50 = center.
 * Everything here is a DYNAMIC ESTIMATE — never a fixed label.
 */
export interface AxisDef {
  id: AxisId;
  title: string;
  /** Pole at 100 */
  poleA: string;
  /** Pole at 0 */
  poleB: string;
  /** Public distribution (seeded): mean + spread (σ), in axis units */
  publicMean: number;
  publicSpread: number;
}

function seeded(id: string, lo: number, hi: number): number {
  const r = mulberry32(hashSeed(`axis:${id}`));
  return Math.round((lo + r() * (hi - lo)) * 10) / 10;
}

export const AXES: AxisDef[] = [
  {
    id: "dat-medina",
    title: "דת ומדינה",
    poleA: "הפרדת דת ומדינה",
    poleB: "שילוב דת ומדינה",
    publicMean: seeded("dat-medina", 52, 62),
    publicSpread: 16,
  },
  {
    id: "shuk-medina",
    title: "כלכלה",
    poleA: "שוק חופשי",
    poleB: "מעורבות מדינה",
    publicMean: seeded("shuk-medina", 42, 52),
    publicSpread: 14,
  },
  {
    id: "bitachon-hofesh",
    title: "ביטחון וחירויות",
    poleA: "ביטחון תחילה",
    poleB: "חירויות אזרחיות",
    publicMean: seeded("bitachon-hofesh", 50, 60),
    publicSpread: 15,
  },
  {
    id: "smol-yamin",
    title: "מיקום פוליטי",
    poleA: "ימין",
    poleB: "שמאל",
    publicMean: seeded("smol-yamin", 50, 58),
    publicSpread: 18,
  },
  {
    id: "prog-shamran",
    title: "ערכים",
    poleA: "שמרני",
    poleB: "פרוגרסיבי",
    publicMean: seeded("prog-shamran", 44, 54),
    publicSpread: 16,
  },
  {
    id: "merkaz-periferia",
    title: "מרכז ופריפריה",
    poleA: "מבט מהמרכז",
    poleB: "מבט מהפריפריה",
    publicMean: seeded("merkaz-periferia", 46, 54),
    publicSpread: 13,
  },
];

export const AXIS_BY_ID = new Map(AXES.map((a) => [a.id, a]));

/** Confidence label by number of contributing answered questions (dynamic, per PRD). */
export function confidenceLabel(n: number): {
  label: string;
  tone: "low" | "mid" | "high";
} {
  if (n >= 4) return { label: "ביטחון גבוה", tone: "high" };
  if (n >= 2) return { label: "ביטחון בינוני", tone: "mid" };
  return { label: "ביטחון נמוך", tone: "low" };
}
