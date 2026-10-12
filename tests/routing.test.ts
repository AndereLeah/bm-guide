import { describe, expect, it } from "vitest";
import { OBJECTS } from "@/data/objects";
import { EDGES, ROOMS, ROOM_IDS } from "@/data/rooms";
import { areAdjacent, shortestRoute } from "@/lib/routing";

describe("gallery graph", () => {
  it("every edge refers to known rooms and has a positive estimate", () => {
    for (const e of EDGES) {
      expect(ROOMS[e.a]).toBeDefined();
      expect(ROOMS[e.b]).toBeDefined();
      expect(e.minutes).toBeGreaterThan(0);
      expect(e.note.length).toBeGreaterThan(5);
    }
  });

  it("is connected: every room reachable from the Great Court", () => {
    for (const r of ROOM_IDS) expect(Number.isFinite(shortestRoute("GC", r).minutes)).toBe(true);
  });

  it("does not assume consecutive room numbers are connected", () => {
    // No doorway is shown on the official map between these numerically adjacent rooms.
    expect(areAdjacent("9", "10")).toBe(false);
    expect(areAdjacent("6", "7")).toBe(true); // this one IS on the map
    expect(areAdjacent("17", "18")).toBe(true);
    expect(areAdjacent("4", "7")).toBe(false);
    expect(areAdjacent("1", "4")).toBe(false);
  });

  it("routes are symmetric in time and use only real doorways", () => {
    for (const a of ROOM_IDS) {
      for (const b of ROOM_IDS) {
        const ab = shortestRoute(a, b);
        expect(ab.minutes).toBe(shortestRoute(b, a).minutes);
        for (let i = 0; i < ab.path.length - 1; i++) expect(areAdjacent(ab.path[i], ab.path[i + 1])).toBe(true);
      }
    }
  });

  it("finds the expected route from the Great Court to the Parthenon galleries", () => {
    const r = shortestRoute("GC", "18");
    expect(r.path).toEqual(["GC", "4", "8", "23", "17", "18"]);
    expect(r.minutes).toBe(7);
  });

  it("returns an unreachable route when blocked", () => {
    const r = shortestRoute("GC", "18", new Set(["17"]));
    expect(r.minutes).toBe(Infinity);
  });
});

describe("dataset integrity", () => {
  it("has required fields for every object", () => {
    for (const o of OBJECTS) {
      expect(o.museumNumber).toBeTruthy();
      expect(o.title).toBeTruthy();
      expect(o.date).toBeTruthy();
      expect(o.culture).toBeTruthy();
      expect(o.materials.length).toBeGreaterThan(0);
      expect(o.facts.length).toBeGreaterThan(0);
      expect(o.tags.length).toBeGreaterThan(0);
      expect(o.display.recordLocation).toBeTruthy();
      expect(o.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.sources[0].url).toMatch(/^https:\/\/www\.britishmuseum\.org\/collection\/object\//);
      expect(o.viewMinutes).toBeGreaterThan(0);
    }
  });

  it("display status agrees with the recorded location", () => {
    for (const o of OBJECTS) {
      if (o.display.status === "on-display") {
        expect(o.display.recordLocation.startsWith("On display")).toBe(true);
        expect(o.display.roomId).not.toBeNull();
      } else {
        expect(o.display.recordLocation).toBe("Not on display");
        expect(o.display.roomId).toBeNull();
      }
    }
  });

  it("only shows images with a confirmed CC BY-NC-SA licence and credit", () => {
    for (const o of OBJECTS) {
      if (o.image.usePermitted) {
        expect(o.image.license).toBe("CC BY-NC-SA 4.0");
        expect(o.image.credit).toMatch(/© The Trustees of the British Museum/);
        expect(o.image.url).toMatch(/^https:\/\/media\.britishmuseum\.org\//);
        expect(o.image.permissionPage).toMatch(/collection\/image\/\d+$/);
      }
    }
    expect(OBJECTS.some((o) => !o.image.usePermitted)).toBe(true); // fallback path exercised
  });

  it("unique ids and fact ids", () => {
    const seen = new Set<string>();
    for (const o of OBJECTS) {
      expect(seen.has(o.id)).toBe(false);
      seen.add(o.id);
      for (const f of o.facts) {
        expect(seen.has(f.id)).toBe(false);
        seen.add(f.id);
      }
    }
  });
});
