import { describe, expect, it } from "vitest";
import { OBJECTS_BY_ID, ON_DISPLAY } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { parseLocal, roomOpenAt } from "@/lib/availability";
import { planTour, viewTime } from "@/lib/planner";
import { shortestRoute, travelBetween } from "@/lib/routing";
import type { PlanResult } from "@/lib/types";
import { prefs } from "./helpers";

const ids = (p: PlanResult) => p.stops.map((s) => s.objectId);

/** Recompute the plan's timing independently from its legs to check internal consistency. */
function checkTiming(p: PlanResult, startRoom = "GC" as const) {
  let t = 0;
  let room: string = startRoom;
  p.stops.forEach((s, i) => {
    const expected = i === 0 && room === s.roomId ? 0 : travelBetween(room as never, s.roomId).minutes;
    // Travel may be longer than the unconstrained shortest path if a closed room had to be avoided.
    expect(s.travelMinutes).toBeGreaterThanOrEqual(expected);
    expect(s.path[0]).toBe(room);
    expect(s.path[s.path.length - 1]).toBe(s.roomId);
    t += s.travelMinutes;
    expect(s.arriveAt).toBe(t);
    t += s.viewMinutes;
    room = s.roomId;
  });
  expect(p.totalMinutes).toBe(t);
  expect(p.viewingMinutes + p.travelMinutes).toBe(t);
}

describe("timing and budget", () => {
  for (const minutes of [20, 30, 45, 60, 90, 120]) {
    for (const interests of [["egypt"], ["mesopotamia", "conflict"], ["greece-rome"], ["animals", "science"], []] as const) {
      it(`fits ${minutes} min for [${interests.join(",")}]`, () => {
        const p = planTour({ prefs: prefs({ minutes, interests: [...interests] }) });
        expect(p.stops.length).toBeGreaterThan(0);
        expect(p.totalMinutes).toBeLessThanOrEqual(minutes);
        checkTiming(p);
      });
    }
  }

  it("fills a long visit even when few objects match the chosen themes", () => {
    for (const interests of [[], ["world"], ["women"]] as const) {
      for (const visitStart of ["2026-10-13T10:00", "2026-10-13T11:30"]) {
        const p = planTour({ prefs: prefs({ minutes: 120, interests: [...interests], visitStart }) });
        expect(p.totalMinutes).toBeGreaterThanOrEqual(105);
        expect(p.totalMinutes).toBeLessThanOrEqual(120);
      }
    }
  });

  it("explains when the guide runs out of objects before the time budget", () => {
    const p = planTour({ prefs: prefs({ minutes: 600, interests: ["egypt"], visitStart: "2026-10-16T10:00" }) });
    // Nearly everything fits; Rooms 7, 9 and 10 are only open 11.00–15.00, which caps a few stops.
    expect(p.stops.length).toBeGreaterThanOrEqual(Math.floor(ON_DISPLAY.length * 0.85));
    expect(p.notes.some((n) => n.k === "warn.underfilled")).toBe(true);
  });

  it("uses a long budget fully and explains when closing time cuts it short", () => {
    const full = planTour({ prefs: prefs({ minutes: 420, interests: ["egypt", "animals"], visitStart: "2026-10-13T10:00" }) });
    expect(full.totalMinutes).toBeGreaterThanOrEqual(380);
    const late = planTour({ prefs: prefs({ minutes: 420, interests: ["egypt"], visitStart: "2026-10-13T14:00" }) });
    expect(late.totalMinutes).toBeLessThanOrEqual(170);
    expect(late.notes.some((n) => n.k === "warn.closing")).toBe(true);
    expect(late.notes.some((n) => n.k === "warn.underfilled")).toBe(false);
  });

  it("uses more of a bigger budget", () => {
    const short = planTour({ prefs: prefs({ minutes: 30, interests: ["animals"] }) });
    const long = planTour({ prefs: prefs({ minutes: 120, interests: ["animals"] }) });
    expect(long.stops.length).toBeGreaterThan(short.stops.length);
    expect(long.totalMinutes).toBeGreaterThan(short.totalMinutes);
  });

  it("explains when must-see objects alone exceed the budget instead of silently dropping them", () => {
    const must = ["G_1816-0610-98", "E_Oc1869-1005-1", "Y_EA24"]; // Room 18, Room 24, Room 4
    const p = planTour({ prefs: prefs({ minutes: 15, mustSee: must }) });
    expect(ids(p)).toEqual(expect.arrayContaining(must));
    expect(p.totalMinutes).toBeGreaterThan(15);
    expect(p.warnings.join(" ")).toMatch(/must-see objects alone need about \d+ min/);
  });

  it("refuses must-see objects that are not on display, with a reason", () => {
    const p = planTour({ prefs: prefs({ mustSee: ["G_1805-0703-15"] }) });
    expect(ids(p)).not.toContain("G_1805-0703-15");
    expect(p.warnings.join(" ")).toMatch(/Townley Venus is recorded as not on display/);
  });

  it("returns an explained empty plan when there is no time", () => {
    const p = planTour({ prefs: prefs({ interests: ["egypt"] }), budgetMinutes: 1 });
    expect(p.stops).toHaveLength(0);
    expect(p.warnings.join(" ")).toMatch(/isn't enough time/);
  });

  it("detail level changes viewing time", () => {
    const o = OBJECTS_BY_ID["Y_EA24"];
    expect(viewTime(o, 1)).toBeLessThan(viewTime(o, 2));
    expect(viewTime(o, 3)).toBeGreaterThan(viewTime(o, 2));
  });
});

describe("personalisation", () => {
  it("different interests produce meaningfully different itineraries", () => {
    const egypt = planTour({ prefs: prefs({ interests: ["egypt", "writing"] }) });
    const assyria = planTour({ prefs: prefs({ interests: ["mesopotamia", "conflict"] }) });
    const greece = planTour({ prefs: prefs({ interests: ["greece-rome", "sculpture"] }) });
    const overlap = (a: PlanResult, b: PlanResult) => ids(a).filter((x) => ids(b).includes(x)).length;
    expect(overlap(egypt, assyria)).toBeLessThanOrEqual(1);
    expect(overlap(egypt, greece)).toBeLessThanOrEqual(1);
    expect(overlap(assyria, greece)).toBe(0);
    // Most stops match the chosen theme.
    const share = (p: PlanResult, tag: string) => p.stops.filter((s) => OBJECTS_BY_ID[s.objectId].tags.includes(tag as never)).length / p.stops.length;
    expect(share(egypt, "egypt")).toBeGreaterThanOrEqual(0.7);
    expect(share(assyria, "mesopotamia")).toBeGreaterThanOrEqual(0.7);
    expect(share(greece, "greece-rome")).toBeGreaterThanOrEqual(0.7);
  });

  it("free-text derived objects get priority", () => {
    const p = planTour({ prefs: prefs({ minutes: 30, derivedObjectIds: ["Y_EA64391"] }) });
    expect(ids(p)).toContain("Y_EA64391");
    expect(p.stops.find((s) => s.objectId === "Y_EA64391")!.reason).toMatch(/fits what you wrote/);
  });

  it("every stop explains why it was chosen", () => {
    const p = planTour({ prefs: prefs({ interests: ["animals"], mustSee: ["Y_EA24"] }) });
    for (const s of p.stops) expect(s.reason.length).toBeGreaterThan(10);
    expect(p.stops.find((s) => s.objectId === "Y_EA24")!.reason).toMatch(/You asked to include this/);
    expect(p.stops.some((s) => /Animals/.test(s.reason))).toBe(true);
  });

  it("is deterministic", () => {
    const a = planTour({ prefs: prefs({ interests: ["religion"], minutes: 75 }) });
    const b = planTour({ prefs: prefs({ interests: ["religion"], minutes: 75 }) });
    expect(a).toEqual(b);
  });

  it("only ever plans existing, on-display objects", () => {
    const onDisplay = new Set(ON_DISPLAY.map((o) => o.id));
    for (const interests of [["women"], ["collecting"], ["afterlife"]] as const) {
      const p = planTour({ prefs: prefs({ interests: [...interests], minutes: 120, derivedObjectIds: ["NOT_A_REAL_ID"] }) });
      for (const s of p.stops) expect(onDisplay.has(s.objectId)).toBe(true);
    }
  });
});

describe("opening hours and closures", () => {
  it("keeps Rooms 7, 9 and 10 inside the listed 11.00–15.00 window", () => {
    const p = planTour({ prefs: prefs({ interests: ["mesopotamia"], minutes: 90, visitStart: "2026-10-13T10:15" }) });
    const { minutes: start } = parseLocal("2026-10-13T10:15");
    for (const s of p.stops) {
      if (ROOMS[s.roomId].availability.restrictedHours) {
        expect(start + s.arriveAt).toBeGreaterThanOrEqual(11 * 60);
        expect(start + s.arriveAt + s.viewMinutes).toBeLessThanOrEqual(15 * 60);
      }
    }
    // With 90 minutes from 10:15, the restricted rooms only become reachable after 11:00.
    expect(p.stops.some((s) => s.roomId === "10")).toBe(true);
  });

  it("explains when restricted rooms can't be fitted (early, short visit)", () => {
    const p = planTour({ prefs: prefs({ interests: ["mesopotamia"], minutes: 40, visitStart: "2026-10-13T10:00" }) });
    expect(p.stops.every((s) => !["7", "9", "10"].includes(s.roomId))).toBe(true);
    expect(p.warnings.join(" ")).toMatch(/11\.00–15\.00 only/);
  });

  it("does not route through a room that is closed at that time", () => {
    // Room 10 is closed before 11:00; walking 23 → 7 must not cut through it.
    const open = roomOpenAt("10", "2026-10-13", 2, 10 * 60 + 30, 0);
    expect(open.open).toBe(false);
    const r = shortestRoute("23", "6", new Set(["10", "7"]));
    expect(r.path).not.toContain("10");
    expect(r.path).not.toContain("7");
  });

  it("excludes rooms on planned closure dates", () => {
    // Room 4 planned closure 11–22 January 2027.
    const p = planTour({ prefs: prefs({ interests: ["egypt"], visitStart: "2027-01-14T12:00" }) });
    expect(p.stops.some((s) => s.roomId === "4")).toBe(false);
    expect(p.excluded.some((e) => /Room 4 is scheduled to be closed/.test(e.reason))).toBe(true);
  });

  it("respects museum closing time", () => {
    const p = planTour({ prefs: prefs({ interests: ["egypt"], minutes: 120, visitStart: "2026-10-13T16:20" }) });
    const { minutes: start } = parseLocal("2026-10-13T16:20");
    for (const s of p.stops) expect(start + s.arriveAt + s.viewMinutes).toBeLessThanOrEqual(16 * 60 + 50);
  });
});
