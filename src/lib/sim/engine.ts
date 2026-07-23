import { QUESTIONS } from "@/lib/data/questions";
import { EVENTS_BY_QUESTION } from "@/lib/data/events";
import { PROPOSALS, ANOMALY_FLAGS, SUSPICIOUS_USERS } from "@/lib/data/admin";
import { generateHistory } from "@/lib/data/history";
import { mulberry32, hashSeed, normal, clamp } from "@/lib/rng";
import type {
  AgentProposal,
  AnomalyFlag,
  CredibilityLevel,
  HistoryPoint,
  Question,
  QuestionEvent,
  SuspiciousUser,
} from "@/lib/types";

export interface LiveQuestion {
  slug: string;
  value: number;
  delta24h: number;
  /** direction of the last tick */
  dir: 1 | -1 | 0;
  /** bumps when a notable move happens (drives blotter flash) */
  flashKey: number;
  participants: number;
  credibility: CredibilityLevel;
  anomalyActive: boolean;
}

export interface StoryToast {
  id: number;
  title: string;
  body: string;
  tone: "live" | "up" | "down" | "ai";
}

export interface SimSnapshot {
  version: number;
  live: Record<string, LiveQuestion>;
  events: Record<string, QuestionEvent[]>;
  proposals: AgentProposal[];
  anomalies: AnomalyFlag[];
  suspicious: SuspiciousUser[];
  queueDepth: number;
  lastToast: StoryToast | null;
  beatIndex: number;
}

type TickListener = (slug: string, point: HistoryPoint) => void;
type EventListener = (slug: string, event: QuestionEvent) => void;

const TICK_MS = 2000;
const FLASH_THRESHOLD = 0.12;

interface PendingImpact {
  slug: string;
  perTick: number;
  remaining: number;
}

interface StoryBeat {
  run: (e: SimEngine) => StoryToast;
}

let toastId = 0;

export class SimEngine {
  readonly nowSecAtBoot: number;
  private histories = new Map<string, HistoryPoint[]>();
  private live = new Map<string, LiveQuestion>();
  private events = new Map<string, QuestionEvent[]>();
  private rands = new Map<string, () => number>();
  private pending: PendingImpact[] = [];
  private proposals: AgentProposal[];
  private anomalies: AnomalyFlag[];
  private suspicious: SuspiciousUser[];
  private tickListeners = new Set<TickListener>();
  private eventListeners = new Set<EventListener>();
  private subscribers = new Set<() => void>();
  private snapshot: SimSnapshot;
  private version = 0;
  private beatIndex = 0;
  private lastToast: StoryToast | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private simTime: number;

  constructor(seedTag = "demo") {
    this.nowSecAtBoot = Math.floor(Date.now() / 1000 / 60) * 60;
    this.simTime = this.nowSecAtBoot;
    this.proposals = PROPOSALS.map((p) => ({ ...p }));
    this.anomalies = ANOMALY_FLAGS.map((a) => ({ ...a }));
    this.suspicious = SUSPICIOUS_USERS.map((u) => ({ ...u }));

    for (const q of QUESTIONS) {
      const history = generateHistory(q, this.nowSecAtBoot);
      this.histories.set(q.slug, history);
      const last = history[history.length - 1];
      const dayAgo = this.valueAt(history, this.nowSecAtBoot - 24 * 3600);
      this.live.set(q.slug, {
        slug: q.slug,
        value: last.value,
        delta24h: Math.round((last.value - dayAgo) * 10) / 10,
        dir: 0,
        flashKey: 0,
        participants: q.participants,
        credibility: q.credibility,
        anomalyActive: q.slug === "mishpat",
      });
      this.events.set(
        q.slug,
        (EVENTS_BY_QUESTION.get(q.id) ?? []).map((e) => ({ ...e }))
      );
      this.rands.set(q.slug, mulberry32(hashSeed(`live:${seedTag}:${q.slug}`)));
    }
    this.snapshot = this.buildSnapshot();
  }

  /* ---------- lifecycle ---------- */

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /* ---------- reads ---------- */

  getHistory(slug: string): HistoryPoint[] {
    return this.histories.get(slug) ?? [];
  }

  getQuestion(slug: string): Question | undefined {
    return QUESTIONS.find((q) => q.slug === slug);
  }

  getSnapshot = (): SimSnapshot => this.snapshot;

  subscribe = (cb: () => void): (() => void) => {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  };

  onTick(cb: TickListener): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  onEvent(cb: EventListener): () => void {
    this.eventListeners.add(cb);
    return () => this.eventListeners.delete(cb);
  }

  /* ---------- actions ---------- */

  /** Editor approves/rejects a proposal in the admin queue. */
  resolveProposal(
    id: string,
    resolution: "approved" | "edited" | "rejected"
  ): StoryToast | null {
    const p = this.proposals.find((x) => x.id === id);
    if (!p || p.status !== "pending") return null;
    p.status = resolution;
    let toast: StoryToast | null = null;
    if (resolution !== "rejected" && p.kind === "event-pin" && p.questionSlug) {
      const ev = this.injectEvent(p.questionSlug, {
        title: p.title.replace("הצעת סימון: ", ""),
        source: "אושר על ידי עורך",
        impact: 0,
        summary: p.payload,
        deltaNote: "סומן לאחר אישור עריכתי — הקשר זמני בלבד",
      });
      toast = {
        id: ++toastId,
        title: "האירוע פורסם לגרף הציבורי",
        body: `"${ev.title}" מופיע כעת בעמוד השאלה — תוך שניות מהאישור.`,
        tone: "live",
      };
    }
    this.publish(toast);
    return toast;
  }

  /** Presenter hotkey: advance the scripted story. */
  advanceStory(): StoryToast {
    const beats = STORY_BEATS;
    const beat = beats[Math.min(this.beatIndex, beats.length - 1)];
    const toast = beat.run(this);
    if (this.beatIndex < beats.length - 1) this.beatIndex += 1;
    this.publish(toast);
    return toast;
  }

  /* ---------- internals (used by beats) ---------- */

  injectEvent(
    slug: string,
    partial: Omit<QuestionEvent, "id" | "questionId" | "hoursAgo">
  ): QuestionEvent {
    const q = this.getQuestion(slug)!;
    const ev: QuestionEvent = {
      id: `live-${slug}-${Date.now()}`,
      questionId: q.id,
      hoursAgo: 0,
      ...partial,
    };
    // Anchor to current sim time via hoursAgo=0; consumers use nowSecAtBoot
    this.events.get(slug)!.unshift(ev);
    for (const cb of this.eventListeners) cb(slug, ev);
    return ev;
  }

  rampImpact(slug: string, totalPts: number, ticks = 8) {
    this.pending.push({ slug, perTick: totalPts / ticks, remaining: ticks });
  }

  setCredibility(slug: string, level: CredibilityLevel, anomaly: boolean) {
    const lq = this.live.get(slug)!;
    lq.credibility = level;
    lq.anomalyActive = anomaly;
  }

  addAnomaly(flag: Omit<AnomalyFlag, "id">) {
    this.anomalies.unshift({ id: `an-live-${Date.now()}`, ...flag });
  }

  addSuspicious(users: Omit<SuspiciousUser, "id">[]) {
    users.forEach((u, i) =>
      this.suspicious.unshift({ id: `u-live-${Date.now()}-${i}`, ...u })
    );
  }

  bumpParticipants(slug: string, count: number) {
    this.live.get(slug)!.participants += count;
  }

  get currentSimTime(): number {
    return this.simTime;
  }

  /* ---------- tick ---------- */

  private valueAt(history: HistoryPoint[], time: number): number {
    let best = history[0]?.value ?? 50;
    for (const p of history) {
      if (p.time <= time) best = p.value;
      else break;
    }
    return best;
  }

  private tick() {
    this.simTime = Math.floor(Date.now() / 1000);
    for (const q of QUESTIONS) {
      const lq = this.live.get(q.slug)!;
      const rand = this.rands.get(q.slug)!;
      const history = this.histories.get(q.slug)!;
      const theta = 0.03;
      let v = lq.value;
      v = v + theta * (q.base - v) + normal(rand) * q.sigma * 0.3;

      // scripted impact ramps
      for (const imp of this.pending) {
        if (imp.slug === q.slug && imp.remaining > 0) {
          v += imp.perTick;
          imp.remaining -= 1;
        }
      }
      v = clamp(v, 3, 97);
      v = Math.round(v * 10) / 10;

      const moved = v - lq.value;
      lq.dir = moved > 0.001 ? 1 : moved < -0.001 ? -1 : 0;
      if (Math.abs(moved) >= FLASH_THRESHOLD) lq.flashKey += 1;
      lq.value = v;
      const dayAgo = this.valueAt(history, this.simTime - 24 * 3600);
      lq.delta24h = Math.round((v - dayAgo) * 10) / 10;
      if (rand() < 0.4) lq.participants += Math.floor(rand() * 3) + 1;

      const point: HistoryPoint = { time: this.simTime, value: v };
      history.push(point);
      for (const cb of this.tickListeners) cb(q.slug, point);
    }
    this.pending = this.pending.filter((p) => p.remaining > 0);
    this.publish(this.lastToast);
  }

  private buildSnapshot(): SimSnapshot {
    this.version += 1;
    return {
      version: this.version,
      live: Object.fromEntries(
        [...this.live.entries()].map(([k, v]) => [k, { ...v }])
      ),
      events: Object.fromEntries(
        [...this.events.entries()].map(([k, v]) => [k, [...v]])
      ),
      proposals: [...this.proposals],
      anomalies: [...this.anomalies],
      suspicious: [...this.suspicious],
      queueDepth: this.proposals.filter((p) => p.status === "pending").length,
      lastToast: this.lastToast,
      beatIndex: this.beatIndex,
    };
  }

  private publish(toast: StoryToast | null) {
    this.lastToast = toast;
    this.snapshot = this.buildSnapshot();
    for (const cb of this.subscribers) cb();
  }
}

/* ---------- scripted story beats (presenter hotkey ".") ---------- */

const STORY_BEATS: StoryBeat[] = [
  {
    run: (e) => {
      e.injectEvent("giyus", {
        title: "מבזק: שר בכיר שוקל להסיר תמיכה מחוק הגיוס",
        source: "המהדורה",
        impact: -4.2,
        summary:
          "גורם בכיר בקואליציה מסר כי השר בוחן מחדש את תמיכתו בנוסח הנוכחי.",
        deltaNote: "לאחר הדיווח נרשמה ירידה מהירה בתמיכה — קשר זמני בלבד",
      });
      e.rampImpact("giyus", -4.2, 10);
      e.bumpParticipants("giyus", 180);
      return {
        id: Date.now(),
        title: "מבזק חדשות נחת על הגרף",
        body: "חוק הגיוס: הציבור מגיב בזמן אמת — צפו בירידה נבנית על הגרף.",
        tone: "down",
      };
    },
  },
  {
    run: (e) => {
      e.injectEvent("giyus", {
        title: "הבהרת לשכת השר: התמיכה בעינה",
        source: "קול הבוקר",
        impact: 2.1,
        summary: "הלשכה מסרה כי הדיווח 'אינו משקף את עמדת השר'.",
        deltaNote: "לאחר ההבהרה נרשם תיקון חלקי כלפי מעלה",
      });
      e.rampImpact("giyus", 2.1, 8);
      return {
        id: Date.now(),
        title: "הבהרה רשמית — הגרף מתקן",
        body: "תיקון חלקי בתמיכה בעקבות ההבהרה. סמן אירוע שני נוסף לציר הזמן.",
        tone: "up",
      };
    },
  },
  {
    run: (e) => {
      e.setCredibility("mishpat", 2, true);
      e.bumpParticipants("mishpat", 900);
      e.rampImpact("mishpat", 3.5, 6);
      e.addAnomaly({
        scope: "הצבעה",
        rule: "velocity: 400 הצבעות/דק׳ · 92% חשבונות בני יומם",
        severity: "גבוהה",
        action: "הפחתת משקל אוטומטית · התראה לעורך",
        questionSlug: "mishpat",
        minutesAgo: 0,
      });
      e.addSuspicious([
        { handle: "user_51204", signal: "גל מתואם · חשבון חדש", votes: 61, ageDays: 0, weight: 0.1 },
        { handle: "user_51205", signal: "גל מתואם · חשבון חדש", votes: 58, ageDays: 0, weight: 0.1 },
        { handle: "user_51219", signal: "גל מתואם · דפוס זהה", votes: 44, ageDays: 1, weight: 0.15 },
      ]);
      return {
        id: Date.now(),
        title: "ניסיון הצפת הצבעות זוהה",
        body: "מערכת האמון סימנה גל חריג בשאלת מערכת המשפט — מדד האמינות הורד והמשקל הופחת.",
        tone: "down",
      };
    },
  },
  {
    run: (e) => {
      e.setCredibility("mishpat", 4, false);
      e.rampImpact("mishpat", -3.2, 6);
      e.injectEvent("mishpat", {
        title: "התפרצות הצבעות טופלה — המשקל הופחת",
        source: "PoliRanks",
        impact: 0,
        summary:
          "ההצבעות החשודות קיבלו משקל אפסי; המדד חזר לשקף הצבעות מאומתות בלבד.",
        deltaNote: "שקיפות מלאה: האירוע תועד ביומן ההחלטות",
      });
      return {
        id: Date.now(),
        title: "המדד התאושש — שקיפות מלאה",
        body: "ההצפה נוטרלה, מדד האמינות שוקם, והאירוע סומן על הגרף לעין כול.",
        tone: "live",
      };
    },
  },
  {
    run: (e) => {
      e.injectEvent("aklim", {
        title: "דיון חירום ממשלתי על רשת החשמל",
        source: "כלכלה היום",
        impact: 1.9,
        summary: "בעקבות העומסים החריגים זומן דיון חירום על יעדי האנרגיה.",
        deltaNote: "לאחר הדיווח נרשמה עלייה במדד החשיבות",
      });
      e.rampImpact("aklim", 1.9, 8);
      return {
        id: Date.now(),
        title: "אירוע נוסף — סביבה ואקלים",
        body: "מדד החשיבות מגיב לדיון החירום. כל סמן נוסף מחזק את סיפור המוצר.",
        tone: "up",
      };
    },
  },
];

/* ---------- singleton ---------- */

let engineInstance: SimEngine | null = null;

export function getEngine(): SimEngine {
  if (!engineInstance) {
    let tag = "demo";
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("scenario");
      if (p) tag = p;
    }
    engineInstance = new SimEngine(tag);
    if (typeof window !== "undefined") engineInstance.start();
  }
  return engineInstance;
}
