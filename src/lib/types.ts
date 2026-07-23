export type QuestionType = "stance" | "scale" | "importance";

export type CredibilityLevel = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  slug: string;
  /** Short ticker name, e.g. "חוק הגיוס" */
  short: string;
  /** Full question title */
  title: string;
  type: QuestionType;
  topic: string;
  openedAt: string; // ISO date
  /** Base level (%) the series mean-reverts to */
  base: number;
  /** Random-walk volatility (σ per step, in percentage points) */
  sigma: number;
  volatilityLabel: "נמוכה" | "בינונית" | "גבוהה";
  credibility: CredibilityLevel;
  participants: number;
  /** Current split — support/oppose/unsure sum to 100 (stance) */
  splitOppose: number;
  splitUnsure: number;
  /** Labels for the primary metric per question type */
  metricLabel: string;
  aiSummary: AiSummary;
  followUps: FollowUp[];
  articles: Article[];
  /** Methodology panel figures */
  methodology: Methodology;
}

export interface AiSummary {
  what: string;
  latest: string;
  players: string[];
  pro: string[];
  con: string[];
  moved: string;
  updatedMinutesAgo: number;
}

export interface FollowUp {
  id: string;
  question: string;
  options: string[];
}

export interface Article {
  id: string;
  title: string;
  outlet: string;
  lean: "ימין" | "מרכז" | "שמאל";
  minutesAgo: number;
}

export interface Methodology {
  totalN: number;
  verifiedPct: number;
  weighting: boolean;
  anomaliesDetected: boolean;
  demographicNote: string;
  limitations: string[];
}

export interface QuestionEvent {
  id: string;
  questionId: string;
  title: string;
  source: string;
  /** Hours before "now" the event occurred */
  hoursAgo: number;
  /** Absolute unix seconds — set for events injected live during the demo */
  timeSec?: number;
  /** Step impact in percentage points (negative = drop) */
  impact: number;
  /** Cautious temporal-association note (never causation) */
  deltaNote: string;
  summary: string;
}

export interface HistoryPoint {
  /** Unix seconds */
  time: number;
  value: number;
}

export type ProposalKind =
  | "event"
  | "question"
  | "summary"
  | "event-pin"
  | "expiry";

export interface AgentProposal {
  id: string;
  agent: string;
  kind: ProposalKind;
  title: string;
  payload: string;
  questionSlug?: string;
  confidence: number;
  model: string;
  provider: string;
  costUsd: number;
  priority: 1 | 2 | 3;
  status: "pending" | "approved" | "edited" | "rejected";
  minutesAgo: number;
}

export interface DecisionLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  minutesAgo: number;
}

export interface AnomalyFlag {
  id: string;
  scope: "הצבעה" | "משתמש" | "שאלה";
  rule: string;
  severity: "נמוכה" | "בינונית" | "גבוהה";
  action: string;
  questionSlug: string;
  minutesAgo: number;
}

export interface SuspiciousUser {
  id: string;
  handle: string;
  signal: string;
  votes: number;
  ageDays: number;
  weight: number;
}

export interface AgentOps {
  agent: string;
  tier: string;
  lastRunMinutesAgo: number;
  runsToday: number;
  errorRatePct: number;
  costTodayUsd: number;
  approvalRatePct: number;
  enabled: boolean;
}

export interface ContentItem {
  id: string;
  kind: "שאלה" | "אירוע" | "תקציר" | "כתבה";
  title: string;
  status: "טיוטה" | "בבדיקה" | "פורסם" | "הוסר";
  updatedMinutesAgo: number;
}

export interface SourceItem {
  id: string;
  name: string;
  lean: "ימין" | "מרכז" | "שמאל";
  kind: "חדשות" | "דעה";
  itemsToday: number;
}
