/**
 * Pure visit-state transitions (no React). Persisted to localStorage by the client store.
 * Keeping them pure makes the adaptive behaviour testable.
 */
import { OBJECTS_BY_ID } from "@/data/objects";
import type { ChatTurn, SuggestedAction } from "./demo";
import { applySimilarity, applyTagFeedback, changeDetail, DETAIL_LABEL } from "./feedback";
import type { Lang } from "./i18n";
import { DEFAULT_FEEDBACK, describeChange, diffPlans, planTour, scheduleExisting, viewTime } from "./planner";
import { travelBetween } from "./routing";
import { TAG_LABEL } from "./tags";
import type { Code, FeedbackState, PlanResult, Preferences, RoomId, TagId } from "./types";

export type AiMode = "live" | "demo";
export type ResponseSource = "live" | "demo" | "fallback";

export interface Message extends ChatTurn {
  id: string;
  at: number;
  source?: ResponseSource;
  notice?: string;
  actions?: SuggestedAction[];
  outOfScope?: boolean;
  applied?: boolean;
}

export interface CompletedStop {
  objectId: string;
  roomId: RoomId;
  minutesSpent: number;
  at: number;
}

export interface ChangeNote {
  at: number;
  /** English text (downloads, tests). */
  message: string;
  /** Translatable cause. */
  cause: Code;
  added: string[];
  removed: string[];
  /** True when stops were actually added or removed. */
  changed: boolean;
}

type Cause = { text: string; code: Code };
const cause = (text: string, k: string, v?: Code["v"]): Cause => ({ text, code: { k, v } });

export interface VisitState {
  v: 1;
  prefs: Preferences | null;
  plan: PlanResult | null;
  started: boolean;
  completed: CompletedStop[];
  skipped: string[];
  feedback: FeedbackState;
  conversations: Record<string, Message[]>;
  usedMinutes: number;
  remainingMinutes: number;
  currentRoom: RoomId;
  changes: ChangeNote[];
  reasons: Record<string, { text: string; source: ResponseSource; base: string; lang?: Lang }>;
  aiMode: AiMode;
  language?: Lang;
  finished: boolean;
}

export function emptyVisit(aiMode: AiMode = "demo"): VisitState {
  return {
    v: 1,
    prefs: null,
    plan: null,
    started: false,
    completed: [],
    skipped: [],
    feedback: DEFAULT_FEEDBACK,
    conversations: {},
    usedMinutes: 0,
    remainingMinutes: 0,
    currentRoom: "GC",
    changes: [],
    reasons: {},
    aiMode,
    finished: false,
  };
}

/** Start (or restart) a visit from preferences. Conversations and AI mode are kept. */
export function createVisit(prev: VisitState, prefs: Preferences): VisitState {
  const feedback = { ...DEFAULT_FEEDBACK, detail: prefs.style === "in-depth" ? 3 : prefs.style === "family" ? 1 : 2 } as FeedbackState;
  const plan = planTour({ prefs, feedback });
  return {
    ...emptyVisit(prev.aiMode),
    language: prev.language,
    conversations: prev.conversations,
    prefs,
    plan,
    feedback,
    remainingMinutes: prefs.minutes,
    currentRoom: prefs.startRoom,
  };
}

export function plannedIds(s: VisitState): string[] {
  return s.plan?.stops.map((x) => x.objectId) ?? [];
}

/**
 * Re-plan the remaining tour, preserving completed stops and excluding skipped objects.
 * `actedOn` (the object just completed/skipped) is not reported as "removed".
 * With `quiet`, no change note is recorded unless other stops were added or removed.
 */
export function replan(s: VisitState, why: Cause, opts: { actedOn?: string; quiet?: boolean } = {}): VisitState {
  if (!s.prefs) return s;
  const before = plannedIds(s).filter((id) => id !== opts.actedOn);
  const plan = planTour({
    prefs: s.prefs,
    feedback: s.feedback,
    completed: s.completed.map((c) => c.objectId),
    skipped: s.skipped,
    fromRoom: s.currentRoom,
    budgetMinutes: s.remainingMinutes,
    elapsedMinutes: s.usedMinutes,
    previous: before,
  });
  const after = plan.stops.map((x) => x.objectId);
  const diff = diffPlans(before, after);
  const changed = diff.added.length + diff.removed.length > 0;
  if (opts.quiet && !changed) return { ...s, plan };
  const note: ChangeNote = { at: Date.now(), message: describeChange(diff, why.text), cause: why.code, added: diff.added, removed: diff.removed, changed };
  return { ...s, plan, changes: [note, ...s.changes].slice(0, 30) };
}

export function startTour(s: VisitState): VisitState {
  return { ...s, started: true };
}

export function completeStop(s: VisitState, objectId: string): VisitState {
  const o = OBJECTS_BY_ID[objectId];
  if (!o || !o.display.roomId || s.completed.some((c) => c.objectId === objectId)) return s;
  const planned = s.plan?.stops.find((x) => x.objectId === objectId);
  const spent = planned
    ? planned.travelMinutes + planned.viewMinutes
    : travelBetween(s.currentRoom, o.display.roomId).minutes + viewTime(o, s.feedback.detail);
  const next: VisitState = {
    ...s,
    started: true,
    completed: [...s.completed, { objectId, roomId: o.display.roomId, minutesSpent: spent, at: Date.now() }],
    skipped: s.skipped.filter((x) => x !== objectId),
    usedMinutes: s.usedMinutes + spent,
    remainingMinutes: Math.max(0, s.remainingMinutes - spent),
    currentRoom: o.display.roomId,
  };
  // Completing the next planned stop keeps the remaining order (and stop numbers) if it still works.
  if (s.plan?.stops[0]?.objectId === objectId && next.prefs) {
    const rest = s.plan.stops.slice(1).map((x) => x.objectId);
    const kept = scheduleExisting(
      {
        prefs: next.prefs,
        feedback: next.feedback,
        completed: next.completed.map((c) => c.objectId),
        skipped: next.skipped,
        fromRoom: next.currentRoom,
        budgetMinutes: next.remainingMinutes,
        elapsedMinutes: next.usedMinutes,
      },
      rest,
    );
    if (kept) return { ...next, plan: kept };
  }
  return replan(next, cause(`Completed ${o.shortTitle}.`, "change.completed", { obj: o.shortTitle }), { actedOn: objectId, quiet: true });
}

export function skipStop(s: VisitState, objectId: string): VisitState {
  const o = OBJECTS_BY_ID[objectId];
  if (!o || s.skipped.includes(objectId) || s.completed.some((c) => c.objectId === objectId)) return s;
  // Skipping costs no time and does not move the visitor; the object is excluded from automatic replanning.
  return replan({ ...s, started: true, skipped: [...s.skipped, objectId] }, cause(`Skipped ${o.shortTitle} (not marked as seen).`, "change.skipped", { obj: o.shortTitle }), {
    actedOn: objectId,
    quiet: true,
  });
}

/** Put a skipped object back into consideration (the visitor's explicit choice). */
export function unskip(s: VisitState, objectId: string): VisitState {
  if (!s.skipped.includes(objectId)) return s;
  const o = OBJECTS_BY_ID[objectId];
  const name = o?.shortTitle ?? objectId;
  return replan({ ...s, skipped: s.skipped.filter((x) => x !== objectId) }, cause(`${name} can be planned again.`, "change.unskip", { obj: name }));
}

export function similarityFeedback(s: VisitState, objectId: string, direction: "more" | "less"): VisitState {
  const o = OBJECTS_BY_ID[objectId];
  if (!o) return s;
  const { feedback, message } = applySimilarity(s.feedback, o, direction);
  return replan({ ...s, feedback }, cause(message, direction === "more" ? "change.more" : "change.less", { obj: o.shortTitle, tags: o.tags.join(",") }));
}

export function tagFeedback(s: VisitState, tags: TagId[], direction: "more" | "less"): VisitState {
  if (!tags.length) return s;
  const feedback = applyTagFeedback(s.feedback, tags, direction);
  const labels = tags.map((t) => TAG_LABEL[t]).join(", ");
  return replan(
    { ...s, feedback },
    cause(direction === "more" ? `Prioritising ${labels}.` : `De-prioritising ${labels}.`, direction === "more" ? "change.tagsMore" : "change.tagsLess", { tags: tags.join(",") }),
  );
}

export function detailFeedback(s: VisitState, delta: 1 | -1): VisitState {
  const { feedback, changed } = changeDetail(s.feedback, delta);
  if (!changed) return s;
  const msg =
    delta > 0
      ? `Detail set to ${DETAIL_LABEL[feedback.detail]}: longer explanations and a little more viewing time per stop.`
      : `Detail set to ${DETAIL_LABEL[feedback.detail]}: shorter explanations and less viewing time per stop.`;
  return replan({ ...s, feedback }, cause(msg, delta > 0 ? "change.detailUp" : "change.detailDown", { level: feedback.detail }));
}

export function setRemainingMinutes(s: VisitState, minutes: number): VisitState {
  const m = Math.max(0, Math.min(620, Math.round(minutes)));
  if (m === s.remainingMinutes) return s;
  const up = m > s.remainingMinutes;
  return replan(
    { ...s, remainingMinutes: m },
    cause(up ? `Remaining time increased to ${m} min.` : `Remaining time reduced to ${m} min.`, up ? "change.timeUp" : "change.timeDown", { n: m }),
  );
}

export function addMessage(s: VisitState, objectId: string, m: Message): VisitState {
  const list = s.conversations[objectId] ?? [];
  return { ...s, conversations: { ...s.conversations, [objectId]: [...list, m].slice(-60) } };
}

export function markActionApplied(s: VisitState, objectId: string, messageId: string): VisitState {
  const list = s.conversations[objectId] ?? [];
  return { ...s, conversations: { ...s.conversations, [objectId]: list.map((m) => (m.id === messageId ? { ...m, applied: true } : m)) } };
}

export function likedTags(s: VisitState): TagId[] {
  return (Object.entries(s.feedback.tagWeights) as [TagId, number][])
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
}

/** Basic shape check for data loaded from localStorage. */
export function isVisitState(x: unknown): x is VisitState {
  const s = x as VisitState;
  return !!s && s.v === 1 && Array.isArray(s.completed) && Array.isArray(s.skipped) && typeof s.feedback === "object";
}

/** Ask for a different selection: current non-must-see stops are de-prioritised a little. */
export function regenerate(s: VisitState): VisitState {
  if (!s.prefs || !s.plan) return s;
  const objectPenalty = { ...s.feedback.objectPenalty };
  for (const st of s.plan.stops) if (!st.mustSee) objectPenalty[st.objectId] = (objectPenalty[st.objectId] ?? 0) + 2.5;
  const before = plannedIds(s);
  const next = replan({ ...s, feedback: { ...s.feedback, objectPenalty } }, cause("Regenerated with a different selection.", "change.regen"));
  if (before.join() !== plannedIds(next).join()) return next;
  const same: ChangeNote = { ...next.changes[0], message: "Regenerated: these are still the best matches for your choices.", cause: { k: "change.regenSame" }, changed: true };
  return { ...next, changes: [same, ...next.changes.slice(1)] };
}

/** Reason to display for a stop: AI-polished text if it was generated for the current planner reason. */
export function aiReason(s: VisitState, objectId: string, base: string): { text: string; source: ResponseSource } | null {
  const r = s.reasons[objectId];
  if (r && r.base === base && (r.lang ?? "en") === (s.language ?? "en")) return { text: r.text, source: r.source };
  return null;
}

/** Visitor explicitly adds an object to the plan from its guide page. */
export function addToPlan(s: VisitState, objectId: string): VisitState {
  const o = OBJECTS_BY_ID[objectId];
  if (!s.prefs || !o || s.prefs.mustSee.includes(objectId)) return s;
  const prefs = { ...s.prefs, mustSee: [...s.prefs.mustSee, objectId] };
  return replan({ ...s, prefs, skipped: s.skipped.filter((x) => x !== objectId) }, cause(`Added ${o.shortTitle} at your request.`, "change.added", { obj: o.shortTitle }));
}

export function setStyle(s: VisitState, style: Preferences["style"]): VisitState {
  if (!s.prefs) return s;
  return { ...s, prefs: { ...s.prefs, style } };
}

export function setLanguage(s: VisitState, language: Lang): VisitState {
  return { ...s, language };
}
