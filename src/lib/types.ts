// Shared domain types for the AI Museum Guide prototype.

export type TagId =
  | "egypt"
  | "mesopotamia"
  | "greece-rome"
  | "world"
  | "writing"
  | "power"
  | "religion"
  | "afterlife"
  | "animals"
  | "conflict"
  | "sculpture"
  | "science"
  | "collecting"
  | "colossal"
  | "craft"
  | "women";

export type RoomId = "GC" | "1" | "4" | "6" | "7" | "8" | "9" | "10" | "17" | "18" | "23" | "24";

export type FactKind = "overview" | "look" | "context" | "detail" | "provenance" | "material";

export interface Fact {
  id: string;
  kind: FactKind;
  text: string;
  /** Which source the fact was paraphrased from. */
  source: "record" | "gallery";
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface ObjectImage {
  url: string | null;
  assetId: string | null;
  credit: string;
  license: "CC BY-NC-SA 4.0" | null;
  licenseUrl: string | null;
  /** True only when the image's own "Use this image" page states the CC licence. */
  usePermitted: boolean;
  permissionPage: string | null;
  note?: string;
}

export interface MuseumObject {
  id: string; // Collection online URL id, e.g. "Y_EA24"
  museumNumber: string;
  registrationNumber?: string;
  title: string;
  shortTitle: string;
  objectType: string;
  date: string;
  culture: string;
  materials: string[];
  findspot?: string;
  dimensions?: string;
  acquisition?: string;
  /** Original summary written for this prototype, paraphrasing the official record. */
  summary: string;
  facts: Fact[];
  tags: TagId[];
  highlight: boolean;
  display: {
    status: "on-display" | "not-on-display";
    roomId: RoomId | null;
    /** Location string exactly as given by Collection online on the verification date. */
    recordLocation: string;
    placement?: string;
    note?: string;
  };
  viewMinutes: number;
  image: ObjectImage;
  sources: SourceLink[];
  verifiedOn: string;
}

export interface PlannedClosure {
  from: string; // ISO date inclusive
  to: string; // ISO date inclusive
  note: string;
  partial?: boolean;
}

export interface Room {
  id: RoomId;
  name: string;
  shortName: string;
  galleryUrl: string;
  floor: string;
  /** Minutes allowed for walking between two stops inside the same room. */
  internalMinutes: number;
  availability: {
    listedOnVisitPage: boolean;
    restrictedHours?: { open: string; close: string; source: string };
    plannedClosures: PlannedClosure[];
    note?: string;
  };
  schematic: { x: number; y: number; w: number; h: number };
}

export interface Edge {
  a: RoomId;
  b: RoomId;
  minutes: number;
  note: string;
  /** Optional polyline for the schematic (when a straight centre-to-centre line would mislead). */
  draw?: [number, number][];
}

export type GuideStyle = "approachable" | "in-depth" | "playful" | "family";
export type DetailLevel = 1 | 2 | 3; // 1 brief, 2 standard, 3 deep

export interface Preferences {
  minutes: number;
  interests: TagId[];
  freeText: string;
  /** Tags/objects derived from the free text (by the LLM or demo rules). */
  derivedTags: TagId[];
  derivedObjectIds: string[];
  interpretationNote?: string;
  style: GuideStyle;
  mustSee: string[];
  startRoom: RoomId;
  /** Local museum date/time of the start of the visit, "YYYY-MM-DDTHH:mm" (Europe/London). */
  visitStart: string;
}

/** A translatable message: key + variables (rendered by i18n on the client). */
export interface Code {
  k: string;
  v?: Record<string, string | number>;
}

/** Structured "why this stop" so it can be shown in any language. */
export interface Why {
  must: boolean;
  note: boolean;
  matched: TagId[];
  liked: TagId[];
  filler: "highlight" | "fit" | null;
}

export interface Stop {
  objectId: string;
  roomId: RoomId;
  /** Walking minutes from the previous stop (or start). */
  travelMinutes: number;
  viewMinutes: number;
  /** Rooms walked through from previous stop to this stop, inclusive. */
  path: RoomId[];
  /** Minutes after visit start when the visitor arrives at this stop. */
  arriveAt: number;
  reason: string;
  why: Why;
  matchedTags: TagId[];
  mustSee: boolean;
}

export interface PlanResult {
  stops: Stop[];
  totalMinutes: number;
  viewingMinutes: number;
  travelMinutes: number;
  budgetMinutes: number;
  warnings: string[];
  /** Same warnings as translatable codes (same order). */
  notes: Code[];
  excluded: { objectId: string; reason: string }[];
}

export interface FeedbackState {
  tagWeights: Partial<Record<TagId, number>>;
  objectPenalty: Record<string, number>;
  detail: DetailLevel;
}
