import type { Preferences } from "@/lib/types";

export function prefs(over: Partial<Preferences> = {}): Preferences {
  return {
    minutes: 45,
    interests: [],
    freeText: "",
    derivedTags: [],
    derivedObjectIds: [],
    style: "approachable",
    mustSee: [],
    startRoom: "GC",
    // A Tuesday, inside the 11.00–15.00 window for Rooms 7, 9 and 10.
    visitStart: "2026-10-13T11:30",
    ...over,
  };
}
