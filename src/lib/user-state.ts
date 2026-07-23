"use client";

/** Local demo user state: votes, follow-ups, civic points. */

export interface VoteRecord {
  choice: string;
  at: number;
  followUps: Record<string, string>;
}

const VOTES_KEY = "poliranks-votes";
const POINTS_KEY = "poliranks-points";

type VotesMap = Record<string, VoteRecord>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("poliranks-user-state"));
  } catch {}
}

export function getVotes(): VotesMap {
  return read<VotesMap>(VOTES_KEY, {});
}

export function getVote(slug: string): VoteRecord | undefined {
  return getVotes()[slug];
}

export function castVote(slug: string, choice: string): VoteRecord {
  const votes = getVotes();
  const rec: VoteRecord = {
    choice,
    at: Date.now(),
    followUps: votes[slug]?.followUps ?? {},
  };
  votes[slug] = rec;
  write(VOTES_KEY, votes);
  addPoints(votes[slug] ? 10 : 10);
  return rec;
}

export function answerFollowUp(slug: string, fuId: string, answer: string) {
  const votes = getVotes();
  const rec = votes[slug];
  if (!rec) return;
  if (!rec.followUps[fuId]) addPoints(5);
  rec.followUps[fuId] = answer;
  write(VOTES_KEY, votes);
}

export function getPoints(): number {
  return read<number>(POINTS_KEY, 0);
}

export function addPoints(n: number) {
  write(POINTS_KEY, getPoints() + n);
}

export interface Tier {
  name: string;
  min: number;
}

export const TIERS: Tier[] = [
  { name: "אזרח חדש", min: 0 },
  { name: "משתתף פעיל", min: 50 },
  { name: "אזרח מעורב", min: 150 },
];

export function currentTier(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

/** Subscribe to user-state changes (same-tab custom event). */
export function onUserState(cb: () => void): () => void {
  window.addEventListener("poliranks-user-state", cb);
  return () => window.removeEventListener("poliranks-user-state", cb);
}
