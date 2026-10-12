import { describe, expect, it } from "vitest";
import { OBJECTS_BY_ID } from "@/data/objects";
import { itineraryText, summaryText } from "@/lib/export";
import {
  addToPlan,
  completeStop,
  createVisit,
  detailFeedback,
  emptyVisit,
  isVisitState,
  regenerate,
  setRemainingMinutes,
  similarityFeedback,
  skipStop,
  tagFeedback,
  unskip,
  type VisitState,
} from "@/lib/visit";
import { prefs } from "./helpers";

const planIds = (s: VisitState) => s.plan!.stops.map((x) => x.objectId);

function start(over = {}) {
  return createVisit(emptyVisit(), prefs({ minutes: 60, interests: ["egypt", "animals"], ...over }));
}

describe("adaptive replanning", () => {
  it("completing a stop preserves it, moves the visitor and charges its time", () => {
    const s0 = start();
    const first = s0.plan!.stops[0];
    const s1 = completeStop(s0, first.objectId);
    expect(s1.completed.map((c) => c.objectId)).toEqual([first.objectId]);
    expect(s1.currentRoom).toBe(first.roomId);
    expect(s1.usedMinutes).toBe(first.travelMinutes + first.viewMinutes);
    expect(s1.remainingMinutes).toBe(60 - s1.usedMinutes);
    expect(planIds(s1)).not.toContain(first.objectId);
    expect(s1.plan!.totalMinutes).toBeLessThanOrEqual(s1.remainingMinutes);

    // Completed stops survive any later replanning.
    const s2 = setRemainingMinutes(similarityFeedback(s1, planIds(s1)[0], "less"), 15);
    expect(s2.completed.map((c) => c.objectId)).toEqual([first.objectId]);
    expect(planIds(s2)).not.toContain(first.objectId);
  });

  it("skipping advances without marking complete and excludes the object from automatic replanning", () => {
    const s0 = start();
    const target = s0.plan!.stops[0].objectId;
    const s1 = skipStop(s0, target);
    expect(s1.completed).toHaveLength(0);
    expect(s1.skipped).toEqual([target]);
    expect(s1.usedMinutes).toBe(0); // no time charged, no movement
    expect(s1.currentRoom).toBe(s0.currentRoom);
    expect(planIds(s1)).not.toContain(target);
    // Even after more time and positive feedback on the same themes, it stays out.
    const s2 = setRemainingMinutes(tagFeedback(s1, OBJECTS_BY_ID[target].tags, "more"), 180);
    expect(planIds(s2)).not.toContain(target);
    // The change explanation mentions the skip.
    // The skipped object itself is never reported as "removed".
    for (const c of s1.changes) expect(c.removed).not.toContain(target);
    // Only an explicit visitor action brings it back.
    expect(planIds(unskip(s2, target))).toContain(target);
  });

  it("'More like this' raises similar objects; 'Less like this' lowers them", () => {
    const base = createVisit(emptyVisit(), prefs({ minutes: 40, interests: ["greece-rome"] }));
    const before = planIds(base);
    expect(before.some((id) => OBJECTS_BY_ID[id].tags.includes("mesopotamia"))).toBe(false);
    // Visitor likes an Assyrian lion hunt relief seen in passing.
    const liked = similarityFeedback(base, "W_1856-0909-15", "more");
    const after = planIds(liked);
    expect(after).not.toEqual(before);
    expect(after.some((id) => OBJECTS_BY_ID[id].tags.includes("mesopotamia") || OBJECTS_BY_ID[id].tags.includes("animals"))).toBe(true);
    expect(liked.changes[0].message).toMatch(/more like Royal lion hunt/);
    expect(liked.changes[0].added.length).toBeGreaterThan(0);

    const disliked = similarityFeedback(base, before[0], "less");
    expect(planIds(disliked)).not.toContain(before[0]);
    expect(disliked.changes[0].removed).toContain(before[0]);
  });

  it("detail feedback changes the detail level (explanation length) and per-stop viewing time", () => {
    const s0 = start();
    expect(s0.feedback.detail).toBe(2);
    const less = detailFeedback(s0, -1);
    const more = detailFeedback(s0, 1);
    expect(less.feedback.detail).toBe(1);
    expect(more.feedback.detail).toBe(3);
    const view = (s: VisitState, id: string) => s.plan!.stops.find((x) => x.objectId === id)?.viewMinutes;
    const id = "Y_EA24";
    const withRosetta = (s: VisitState) => addToPlan(s, id);
    expect(view(withRosetta(less), id)!).toBeLessThan(view(withRosetta(s0), id)!);
    expect(view(withRosetta(more), id)!).toBeGreaterThan(view(withRosetta(s0), id)!);
    // Clamped at the ends.
    expect(detailFeedback(less, -1)).toBe(less);
  });

  it("changing remaining time recalculates the remaining itinerary to fit", () => {
    const s0 = start({ minutes: 90 });
    const shorter = setRemainingMinutes(s0, 25);
    expect(shorter.plan!.totalMinutes).toBeLessThanOrEqual(25);
    expect(shorter.plan!.stops.length).toBeLessThan(s0.plan!.stops.length);
    expect(shorter.changes[0].message).toMatch(/reduced to 25 min/);
    const longer = setRemainingMinutes(shorter, 120);
    expect(longer.plan!.stops.length).toBeGreaterThan(shorter.plan!.stops.length);
    expect(longer.plan!.totalMinutes).toBeLessThanOrEqual(120);
  });

  it("completing the next stop keeps the remaining order (stable stop numbers) and adds no change note", () => {
    const s0 = start({ minutes: 90 });
    const ids = planIds(s0);
    const s1 = completeStop(s0, ids[0]);
    expect(planIds(s1)).toEqual(ids.slice(1));
    expect(s1.changes).toHaveLength(s0.changes.length);
    const s2 = completeStop(s1, ids[1]);
    expect(planIds(s2)).toEqual(ids.slice(2));
  });

  it("replans from the visitor's current room", () => {
    let s = createVisit(emptyVisit(), prefs({ minutes: 60, interests: ["greece-rome"] }));
    const inRoom18 = s.plan!.stops.find((x) => x.roomId === "18")!;
    s = completeStop(s, inRoom18.objectId);
    expect(s.currentRoom).toBe("18");
    const firstLeg = s.plan!.stops[0];
    expect(firstLeg.path[0]).toBe("18");
  });

  it("regenerate offers a different selection", () => {
    const s0 = start();
    const s1 = regenerate(s0);
    expect(planIds(s1)).not.toEqual(planIds(s0));
  });

  it("a whole visit end-to-end stays consistent", () => {
    let s = start({ minutes: 50 });
    let guard = 0;
    while (s.plan!.stops.length && guard++ < 30) {
      const next = s.plan!.stops[0].objectId;
      s = guard % 3 === 0 ? skipStop(s, next) : completeStop(s, next);
      expect(s.usedMinutes + s.remainingMinutes).toBe(50);
      const done = new Set(s.completed.map((c) => c.objectId));
      for (const id of planIds(s)) {
        expect(done.has(id)).toBe(false);
        expect(s.skipped.includes(id)).toBe(false);
      }
    }
    expect(s.completed.length).toBeGreaterThan(2);
    expect(s.usedMinutes).toBeLessThanOrEqual(50);
  });
});

describe("persistence and downloads", () => {
  it("visit state round-trips through JSON (refresh-safe)", () => {
    const s = completeStop(start(), start().plan!.stops[0].objectId);
    const restored = JSON.parse(JSON.stringify(s));
    expect(isVisitState(restored)).toBe(true);
    expect(restored).toEqual(s);
    expect(isVisitState({ v: 2 })).toBe(false);
    expect(isVisitState(null)).toBe(false);
  });

  it("itinerary download contains the actual current remaining stops", () => {
    let s = start();
    s = completeStop(s, s.plan!.stops[0].objectId);
    s = setRemainingMinutes(s, 20);
    const text = itineraryText(s);
    for (const st of s.plan!.stops) expect(text).toContain(OBJECTS_BY_ID[st.objectId].title);
    expect(text).toContain("## Already seen");
    expect(text).toContain(OBJECTS_BY_ID[s.completed[0].objectId].title);
    expect(text).toContain(`Estimated total: ${s.plan!.totalMinutes} min`);
    expect(text).toMatch(/Independent educational prototype/);
  });

  it("summary download lists explored objects, questions asked and the recap", () => {
    let s = start();
    const id = s.plan!.stops[0].objectId;
    s = {
      ...s,
      conversations: { [id]: [{ id: "1", role: "user", text: "How old is it?", at: 0 }] },
    };
    s = completeStop(s, id);
    const text = summaryText(s, "A lovely visit.");
    expect(text).toContain(OBJECTS_BY_ID[id].title);
    expect(text).toContain("A lovely visit.");
    expect(text).toContain("“How old is it?”");
  });
});
