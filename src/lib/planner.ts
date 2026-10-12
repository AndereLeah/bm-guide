import { ON_DISPLAY, OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS, ROOM_IDS } from "@/data/rooms";
import { parseLocal, roomClosedOnDate, roomOpenAt, toHHMM } from "./availability";
import { shortestRoute, travelBetween } from "./routing";
import { TAG_LABEL } from "./tags";
import type { Code, DetailLevel, FeedbackState, MuseumObject, PlanResult, Preferences, RoomId, Stop, TagId, Why } from "./types";

export const DETAIL_FACTOR: Record<DetailLevel, number> = { 1: 0.75, 2: 1, 3: 1.35 };

export function viewTime(o: MuseumObject, detail: DetailLevel): number {
  return Math.max(2, Math.round(o.viewMinutes * DETAIL_FACTOR[detail]));
}

export const DEFAULT_FEEDBACK: FeedbackState = { tagWeights: {}, objectPenalty: {}, detail: 2 };

export interface PlanInput {
  prefs: Preferences;
  feedback?: FeedbackState;
  /** Objects already seen; never re-planned. */
  completed?: string[];
  /** Objects the visitor skipped; never re-planned automatically. */
  skipped?: string[];
  /** Where the visitor currently is (defaults to prefs.startRoom). */
  fromRoom?: RoomId;
  /** Minutes available for the (remaining) plan. Defaults to prefs.minutes. */
  budgetMinutes?: number;
  /** Minutes already elapsed since the visit started (for opening-hour checks). */
  elapsedMinutes?: number;
  /** Object ids in the previous plan; they get a small stability bonus to avoid churn. */
  previous?: string[];
}

export interface Scored {
  object: MuseumObject;
  score: number;
  matched: TagId[];
  liked: TagId[];
  fromNote: boolean;
}

export function scoreObject(o: MuseumObject, prefs: Preferences, fb: FeedbackState, previous: Set<string>): Scored {
  let score = o.highlight ? 0.5 : 0;
  const matched: TagId[] = [];
  const liked: TagId[] = [];
  for (const t of o.tags) {
    let hit = false;
    if (prefs.interests.includes(t)) {
      score += 3;
      hit = true;
    }
    if (prefs.derivedTags.includes(t)) {
      score += 2;
      hit = true;
    }
    if (hit) matched.push(t);
    const w = fb.tagWeights[t] ?? 0;
    score += w;
    if (w > 0) liked.push(t);
  }
  const fromNote = prefs.derivedObjectIds.includes(o.id);
  if (fromNote) score += 4;
  score -= fb.objectPenalty[o.id] ?? 0;
  if (previous.has(o.id) && score > 0) score += 1;
  return { object: o, score, matched, liked, fromNote };
}

interface Leg {
  id: string;
  room: RoomId;
  travel: number;
  path: RoomId[];
  view: number;
  arriveAt: number; // minutes from the start of this plan
}

interface Evaluation {
  feasible: boolean;
  total: number;
  /** total + a small penalty for re-entering a room already visited (keeps rooms together). */
  cost: number;
  legs: Leg[];
  problem?: string;
}

/** Compute walking/viewing times for an ordered list of objects and check opening rules. */
function evaluate(
  order: string[],
  from: RoomId,
  detail: DetailLevel,
  visit: { date: string; weekday: number; clock0: number },
): Evaluation {
  let t = 0;
  let room = from;
  let penalty = 0;
  const seenRooms = new Set<RoomId>();
  const legs: Leg[] = [];
  for (const id of order) {
    const o = OBJECTS_BY_ID[id];
    const target = o.display.roomId!;
    // Rooms that are not open at the current clock cannot be used as corridors.
    const clock = visit.clock0 + t;
    const blocked = new Set<RoomId>(ROOM_IDS.filter((r) => !roomOpenAt(r, visit.date, visit.weekday, clock, 0).open));
    const route = legs.length === 0 && room === target ? { minutes: 0, path: [room] } : travelBetween(room, target, blocked);
    if (!Number.isFinite(route.minutes)) return { feasible: false, total: Infinity, cost: Infinity, legs, problem: `No open route to ${ROOMS[target].shortName}` };
    t += route.minutes;
    const view = viewTime(o, detail);
    const check = roomOpenAt(target, visit.date, visit.weekday, visit.clock0 + t, view);
    if (!check.open) return { feasible: false, total: Infinity, cost: Infinity, legs, problem: check.reason };
    if (target !== room && seenRooms.has(target)) penalty += 1.5;
    seenRooms.add(target);
    legs.push({ id, room: target, travel: route.minutes, path: route.path, view, arriveAt: t });
    t += view;
    room = target;
  }
  return { feasible: true, total: t, cost: t + penalty, legs };
}

function bestInsertion(order: string[], id: string, from: RoomId, detail: DetailLevel, visit: Parameters<typeof evaluate>[3]) {
  let best: { order: string[]; ev: Evaluation } | null = null;
  let lastProblem: string | undefined;
  for (let i = 0; i <= order.length; i++) {
    const cand = [...order.slice(0, i), id, ...order.slice(i)];
    const ev = evaluate(cand, from, detail, visit);
    if (!ev.feasible) {
      lastProblem = ev.problem;
      continue;
    }
    if (!best || ev.cost < best.ev.cost) best = { order: cand, ev };
  }
  return { best, problem: lastProblem };
}

/** 2-opt improvement on total time, keeping feasibility. Deterministic. */
function improve(order: string[], from: RoomId, detail: DetailLevel, visit: Parameters<typeof evaluate>[3]): string[] {
  let bestOrder = order;
  let bestEv = evaluate(order, from, detail, visit);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 0; i < bestOrder.length - 1; i++) {
      for (let j = i + 1; j < bestOrder.length; j++) {
        const cand = [...bestOrder.slice(0, i), ...bestOrder.slice(i, j + 1).reverse(), ...bestOrder.slice(j + 1)];
        const ev = evaluate(cand, from, detail, visit);
        if (ev.feasible && ev.cost < bestEv.cost - 1e-9) {
          bestOrder = cand;
          bestEv = ev;
          improved = true;
        }
      }
    }
  }
  return bestOrder;
}

export function whyFor(s: Scored, mustSee: boolean): Why {
  const filler = s.matched.length || s.liked.length || mustSee || s.fromNote ? null : s.object.highlight ? "highlight" : "fit";
  return { must: mustSee, note: s.fromNote, matched: s.matched, liked: s.liked, filler };
}

/** English rendering of a Why (used for downloads, tests and as the base text for AI rephrasing). */
export function reasonFor(s: Scored, mustSee: boolean, freeText: string): string {
  const parts: string[] = [];
  if (mustSee) parts.push("You asked to include this.");
  if (s.fromNote) parts.push(`It fits what you wrote${freeText ? `: “${freeText.slice(0, 60)}${freeText.length > 60 ? "…" : ""}”` : ""}.`);
  if (s.matched.length) parts.push(`Matches your interest in ${s.matched.map((t) => TAG_LABEL[t]).join(", ")}.`);
  if (s.liked.length) parts.push(`Similar to things you liked (${s.liked.map((t) => TAG_LABEL[t]).join(", ")}).`);
  if (!parts.length && s.object.highlight) parts.push("A Museum highlight on your route.");
  if (!parts.length) parts.push("Fits the time you have left on your route.");
  return parts.join(" ");
}

class Notes {
  text: string[] = [];
  codes: Code[] = [];
  add(text: string, k: string, v?: Code["v"]) {
    if (this.text.includes(text)) return;
    this.text.push(text);
    this.codes.push({ k, v });
  }
}

interface Ctx {
  prefs: Preferences;
  fb: FeedbackState;
  detail: DetailLevel;
  from: RoomId;
  budget: number;
  visit: { date: string; weekday: number; clock0: number };
  mustIds: string[];
  byId: Map<string, Scored>;
}

function finalize(order: string[], ctx: Ctx, notes: Notes, excluded: { objectId: string; reason: string }[], hasInterestSignal: boolean): PlanResult {
  const ev = evaluate(order, ctx.from, ctx.detail, ctx.visit);
  const stops: Stop[] = ev.legs.map((l) => {
    const s = ctx.byId.get(l.id)!;
    const must = ctx.mustIds.includes(l.id);
    return {
      objectId: l.id,
      roomId: l.room,
      travelMinutes: l.travel,
      viewMinutes: l.view,
      path: l.path,
      arriveAt: l.arriveAt,
      reason: reasonFor(s, must, ctx.prefs.freeText),
      why: whyFor(s, must),
      matchedTags: [...new Set([...s.matched, ...s.liked])],
      mustSee: must,
    };
  });
  if (!hasInterestSignal) notes.add("No interests selected, so the plan uses Museum highlights.", "warn.noInterests");
  if (!stops.length) {
    if (ctx.budget < 5) notes.add("There isn't enough time left for another stop.", "warn.noTime");
    else notes.add("No objects could be fitted with these settings. Try adding time, changing the start time, or choosing other interests.", "warn.noFit");
  }
  if (stops.some((s) => ROOMS[s.roomId].availability.restrictedHours)) {
    notes.add("Rooms 7, 9 and 10 are listed on the official map as open 11.00–15.00 only; stops there are timed inside that window. Check on the day.", "warn.restricted");
  }
  const hoursBlocked = excluded.filter((e) => /listed as open/.test(e.reason) && !stops.some((s) => s.objectId === e.objectId));
  if (hoursBlocked.length) {
    const time = toHHMM(ctx.visit.clock0);
    notes.add(
      `${hoursBlocked.length} matching object${hoursBlocked.length > 1 ? "s are" : " is"} in rooms listed as open 11.00–15.00 only and couldn't be timed in that window for a ${time} start.`,
      "warn.hoursBlocked",
      { n: hoursBlocked.length, time },
    );
  }
  for (const r of ROOM_IDS) {
    const c = roomClosedOnDate(r, ctx.visit.date);
    if (c.warning) notes.add(c.warning, "warn.partial", { room: ROOMS[r].shortName, text: c.warning });
  }
  return {
    stops,
    totalMinutes: ev.total,
    viewingMinutes: stops.reduce((a, s) => a + s.viewMinutes, 0),
    travelMinutes: stops.reduce((a, s) => a + s.travelMinutes, 0),
    budgetMinutes: ctx.budget,
    warnings: notes.text,
    notes: notes.codes,
    excluded,
  };
}

function setup(input: PlanInput) {
  const prefs = input.prefs;
  const fb = input.feedback ?? DEFAULT_FEEDBACK;
  const completed = new Set(input.completed ?? []);
  const skipped = new Set(input.skipped ?? []);
  const previous = new Set(input.previous ?? []);
  const { date, minutes: startClock, weekday } = parseLocal(prefs.visitStart);
  const visit = { date, weekday, clock0: startClock + (input.elapsedMinutes ?? 0) };
  const excluded: { objectId: string; reason: string }[] = [];
  const candidates: Scored[] = [];
  for (const o of ON_DISPLAY) {
    if (completed.has(o.id) || skipped.has(o.id)) continue;
    const c = roomClosedOnDate(o.display.roomId!, date);
    if (!c.open) {
      excluded.push({ objectId: o.id, reason: c.reason! });
      continue;
    }
    candidates.push(scoreObject(o, prefs, fb, previous));
  }
  const ctx: Ctx = {
    prefs,
    fb,
    detail: fb.detail,
    from: input.fromRoom ?? prefs.startRoom,
    budget: Math.max(0, Math.round(input.budgetMinutes ?? prefs.minutes)),
    visit,
    mustIds: prefs.mustSee.filter((id) => !completed.has(id) && !skipped.has(id)),
    byId: new Map(candidates.map((c) => [c.object.id, c])),
  };
  const hasInterestSignal = prefs.interests.length + prefs.derivedTags.length + prefs.derivedObjectIds.length > 0;
  return { ctx, candidates, excluded, hasInterestSignal };
}

/**
 * Build a personalised, time-bounded route. Deterministic for the same input.
 *
 * Steps: filter candidates (on display, room open that day, not completed/skipped) → score →
 * insert must-sees → greedily insert the best-scoring objects at their cheapest feasible position
 * while the total (walking + viewing) stays within budget → 2-opt reorder.
 */
export function planTour(input: PlanInput): PlanResult {
  const { ctx, candidates, excluded, hasInterestSignal } = setup(input);
  const { prefs, from, detail, visit, budget, byId, mustIds } = ctx;
  const notes = new Notes();

  for (const id of prefs.mustSee) {
    const o = OBJECTS_BY_ID[id];
    if (o && o.display.status !== "on-display") notes.add(`${o.shortTitle} is recorded as not on display, so it can't be included.`, "warn.notOnDisplay", { obj: o.shortTitle });
  }

  let order: string[] = [];
  for (const id of mustIds) {
    const name = OBJECTS_BY_ID[id]?.shortTitle ?? id;
    if (!byId.has(id)) {
      const ex = excluded.find((e) => e.objectId === id);
      if (ex) notes.add(`${name}: ${ex.reason}`, "warn.unavailable", { obj: name, reason: ex.reason });
      continue;
    }
    const { best, problem } = bestInsertion(order, id, from, detail, visit);
    if (best) order = best.order;
    else {
      const reason = problem ?? "not reachable at this time";
      notes.add(`${name} can't be fitted in: ${reason}.`, "warn.cantFit", { obj: name, reason });
    }
  }
  const mustTotal = evaluate(order, from, detail, visit).total;
  if (order.length && mustTotal > budget) {
    const need = Math.round(mustTotal);
    notes.add(
      `Your must-see objects alone need about ${need} min (walking + viewing), more than the ${budget} min available. They are kept, but the tour will run over. Consider removing one or adding time.`,
      "warn.mustOver",
      { need, budget },
    );
  }

  // Greedy fill by score (ties: shorter view time, then id) at cheapest feasible insertion.
  const ranked = candidates
    .filter((c) => !order.includes(c.object.id) && c.score > 0)
    .sort((a, b) => b.score - a.score || a.object.viewMinutes - b.object.viewMinutes || a.object.id.localeCompare(b.object.id));
  // Several passes: an object in a room with restricted hours may only become feasible once
  // earlier stops have filled the time before the room opens.
  const lastReason = new Map<string, string>();
  for (let pass = 0; pass < 4; pass++) {
    let inserted = false;
    for (const c of ranked) {
      if (order.includes(c.object.id)) continue;
      const { best, problem } = bestInsertion(order, c.object.id, from, detail, visit);
      if (!best) {
        if (problem) lastReason.set(c.object.id, problem);
        continue;
      }
      if (best.ev.total <= budget) {
        order = best.order;
        inserted = true;
        lastReason.delete(c.object.id);
      } else lastReason.set(c.object.id, "Did not fit in the time available.");
    }
    if (!inserted) break;
  }
  for (const c of ranked) {
    const r = lastReason.get(c.object.id);
    if (r && c.score >= 3 && !order.includes(c.object.id)) excluded.push({ objectId: c.object.id, reason: r });
  }

  order = improve(order, from, detail, visit);
  return finalize(order, ctx, notes, excluded, hasInterestSignal);
}

/**
 * Re-time an existing order from a new position without re-selecting or re-ordering.
 * Returns null if that order no longer works (closed room, over budget).
 */
export function scheduleExisting(input: PlanInput, order: string[]): PlanResult | null {
  const { ctx, excluded, hasInterestSignal } = setup(input);
  if (order.some((id) => !ctx.byId.has(id))) return null;
  const ev = evaluate(order, ctx.from, ctx.detail, ctx.visit);
  if (!ev.feasible || ev.total > ctx.budget) return null;
  return finalize(order, ctx, new Notes(), excluded, hasInterestSignal);
}

/** Minutes to walk from a room back to the Great Court (shown as optional info). */
export function minutesToGreatCourt(room: RoomId): number {
  return shortestRoute(room, "GC").minutes;
}

export interface PlanDiff {
  added: string[];
  removed: string[];
  reordered: boolean;
}

export function diffPlans(before: string[], after: string[]): PlanDiff {
  const a = new Set(before);
  const b = new Set(after);
  const added = after.filter((x) => !a.has(x));
  const removed = before.filter((x) => !b.has(x));
  const commonBefore = before.filter((x) => b.has(x));
  const commonAfter = after.filter((x) => a.has(x));
  return { added, removed, reordered: commonBefore.join() !== commonAfter.join() };
}

export function describeChange(diff: PlanDiff, cause: string): string {
  const name = (id: string) => OBJECTS_BY_ID[id]?.shortTitle ?? id;
  const bits: string[] = [cause];
  if (diff.added.length) bits.push(`Added: ${diff.added.map(name).join(", ")}.`);
  if (diff.removed.length) bits.push(`Removed: ${diff.removed.map(name).join(", ")}.`);
  if (!diff.added.length && !diff.removed.length) bits.push(diff.reordered ? "Same stops, new order." : "Your remaining stops stay the same.");
  return bits.join(" ");
}
