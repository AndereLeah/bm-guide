import type { Edge, Room, RoomId } from "@/lib/types";

/**
 * Ground-floor rooms used by the prototype, with walkable doorway connections.
 *
 * Verification (12 October 2026):
 *  - Room list and gallery names: https://www.britishmuseum.org/visit ("List of available galleries")
 *    and https://www.britishmuseum.org/collection/galleries
 *  - Doorways: read visually from the official Museum map PDF (Ground floor, edition dated 03/2026,
 *    served at https://www.britishmuseum.org/files/museum-map.pdf). Only connections where a
 *    gap in the wall was visible on the map are included. Consecutive room numbers are NOT
 *    assumed to be connected (e.g. no 9–10 or 4–7 doorway is shown on the map, so none is modelled).
 *  - Restricted hours: map footnote "*Rooms 7, 9, 10, 19, and 20 are open 11.00–15.00 each day."
 *    The individual gallery pages still list 10.00–17.00, so the app treats the stricter map note
 *    as the constraint and tells visitors to check on the day.
 *  - Planned closures: "Planned gallery closures" section of https://www.britishmuseum.org/visit
 *
 * Travel minutes are estimates for an unhurried walk; they are not measured.
 */

export const LOCATION_VERIFIED_ON = "2026-10-12";
export const MAP_EDITION = "Ground floor map, edition 03/2026";
export const OFFICIAL_MAP_URL = "https://www.britishmuseum.org/visit/museum-map";
export const OFFICIAL_MAP_PDF = "https://www.britishmuseum.org/files/museum-map.pdf";
export const VISIT_PAGE_URL = "https://www.britishmuseum.org/visit";

const MAP_NOTE = "Museum map PDF (03/2026) footnote: *Rooms 7, 9, 10, 19, and 20 are open 11.00–15.00 each day.";
const G = "https://www.britishmuseum.org/collection/galleries/";

export const ROOMS: Record<RoomId, Room> = {
  GC: {
    id: "GC",
    name: "The Great Court",
    shortName: "Great Court",
    galleryUrl: G + "great-court",
    floor: "Ground floor (Level 0)",
    internalMinutes: 2,
    availability: { listedOnVisitPage: true, plannedClosures: [], note: "Great Court hours 10.00–17.30 (Fridays 20.30). Reading Room closures do not affect the court." },
    schematic: { x: 232, y: 52, w: 98, h: 186 },
  },
  "1": {
    id: "1",
    name: "Room 1: Enlightenment",
    shortName: "Room 1",
    galleryUrl: G + "enlightenment",
    floor: "Ground floor (Level 0)",
    internalMinutes: 2,
    availability: {
      listedOnVisitPage: true,
      plannedClosures: [{ from: "2027-01-25", to: "2027-02-12", note: "Planned maintenance closure" }],
    },
    schematic: { x: 338, y: 40, w: 26, h: 200 },
  },
  "4": {
    id: "4",
    name: "Room 4: Egyptian sculpture",
    shortName: "Room 4",
    galleryUrl: G + "egyptian-sculpture",
    floor: "Ground floor (Level 0)",
    internalMinutes: 2,
    availability: {
      listedOnVisitPage: true,
      plannedClosures: [{ from: "2027-01-11", to: "2027-01-22", note: "Planned maintenance closure" }],
    },
    schematic: { x: 190, y: 20, w: 36, h: 212 },
  },
  "6": {
    id: "6",
    name: "Room 6: Assyrian sculpture and Balawat Gates",
    shortName: "Room 6",
    galleryUrl: G + "assyrian-sculpture-and-balawat-gates",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: {
      listedOnVisitPage: true,
      plannedClosures: [
        { from: "2027-01-11", to: "2027-01-22", note: "Room 6a planned maintenance closure", partial: true },
        { from: "2027-02-08", to: "2027-02-19", note: "Room 6b planned maintenance closure", partial: true },
      ],
    },
    schematic: { x: 150, y: 238, w: 76, h: 36 },
  },
  "7": {
    id: "7",
    name: "Room 7: Assyria: Nimrud",
    shortName: "Room 7",
    galleryUrl: G + "assyria-nimrud",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: {
      listedOnVisitPage: true,
      restrictedHours: { open: "11:00", close: "15:00", source: MAP_NOTE },
      plannedClosures: [{ from: "2027-02-08", to: "2027-02-19", note: "Rooms 7–8 planned maintenance closure" }],
    },
    schematic: { x: 152, y: 162, w: 32, h: 70 },
  },
  "8": {
    id: "8",
    name: "Room 8: Assyria: Nimrud",
    shortName: "Room 8",
    galleryUrl: G + "assyria-nimrud",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: {
      listedOnVisitPage: true,
      plannedClosures: [{ from: "2027-02-08", to: "2027-02-19", note: "Rooms 7–8 planned maintenance closure" }],
    },
    schematic: { x: 152, y: 106, w: 32, h: 50 },
  },
  "9": {
    id: "9",
    name: "Room 9: Assyria: Nineveh",
    shortName: "Room 9",
    galleryUrl: G + "assyria-nineveh",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: {
      listedOnVisitPage: true,
      restrictedHours: { open: "11:00", close: "15:00", source: MAP_NOTE },
      plannedClosures: [{ from: "2027-01-11", to: "2027-01-22", note: "Planned maintenance closure" }],
    },
    schematic: { x: 152, y: 20, w: 32, h: 80 },
  },
  "10": {
    id: "10",
    name: "Room 10: Assyria: Lion hunts, Siege of Lachish and Khorsabad",
    shortName: "Room 10",
    galleryUrl: G + "assyria-lion-hunts",
    floor: "Ground floor (Level 0)",
    internalMinutes: 2,
    availability: {
      listedOnVisitPage: true,
      restrictedHours: { open: "11:00", close: "15:00", source: MAP_NOTE },
      plannedClosures: [],
    },
    schematic: { x: 106, y: 162, w: 40, h: 70 },
  },
  "17": {
    id: "17",
    name: "Room 17: Nereid Monument",
    shortName: "Room 17",
    galleryUrl: G + "nereid-monument",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: { listedOnVisitPage: true, plannedClosures: [] },
    schematic: { x: 62, y: 106, w: 38, h: 50 },
  },
  "18": {
    id: "18",
    name: "Room 18: Greece: Parthenon",
    shortName: "Room 18",
    galleryUrl: G + "greece-parthenon",
    floor: "Ground floor (Level 0)",
    internalMinutes: 2,
    availability: { listedOnVisitPage: true, plannedClosures: [] },
    schematic: { x: 6, y: 50, w: 50, h: 170 },
  },
  "23": {
    id: "23",
    name: "Room 23: Greek and Roman sculpture",
    shortName: "Room 23",
    galleryUrl: G + "greek-and-roman-sculpture",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: {
      listedOnVisitPage: true,
      plannedClosures: [],
      note: "Used as a connecting gallery. The gallery page's highlight, the Townley Venus, is recorded as 'Not on display'.",
    },
    schematic: { x: 106, y: 106, w: 40, h: 50 },
  },
  "24": {
    id: "24",
    name: "Room 24: Living and Dying",
    shortName: "Room 24",
    galleryUrl: G + "living-and-dying",
    floor: "Ground floor (Level 0)",
    internalMinutes: 1,
    availability: {
      listedOnVisitPage: true,
      plannedClosures: [
        { from: "2027-02-22", to: "2027-03-05", note: "Partially closed for maintenance", partial: true },
        { from: "2027-03-08", to: "2027-03-19", note: "Partially closed for maintenance", partial: true },
      ],
    },
    schematic: { x: 254, y: 6, w: 50, h: 36 },
  },
};

/** Walkable connections only. Every edge corresponds to a doorway visible on the official map. */
export const EDGES: Edge[] = [
  { a: "GC", b: "4", minutes: 2, note: "West doorway from the Great Court into Room 4 (near the Rosetta Stone)" },
  { a: "GC", b: "24", minutes: 2, note: "North doorway from the Great Court into Room 24" },
  { a: "GC", b: "1", minutes: 2, note: "East doorway from the Great Court into Room 1" },
  { a: "GC", b: "6", minutes: 3, note: "Via the main entrance hall at the south of the Great Court", draw: [[262, 238], [262, 256], [226, 256]] },
  { a: "4", b: "6", minutes: 2, note: "South end of Room 4 into Room 6" },
  { a: "4", b: "8", minutes: 1, note: "Doorway midway along the west wall of Room 4" },
  { a: "4", b: "9", minutes: 2, note: "Doorway near the north end of Room 4" },
  { a: "8", b: "9", minutes: 1, note: "Room 8 north into Room 9" },
  { a: "8", b: "7", minutes: 1, note: "Room 8 south into Room 7" },
  { a: "7", b: "6", minutes: 1, note: "Room 7 south into Room 6" },
  { a: "7", b: "10", minutes: 1, note: "Doorway near the south end between Rooms 7 and 10" },
  { a: "8", b: "23", minutes: 1, note: "Room 8 west into Room 23" },
  { a: "23", b: "10", minutes: 1, note: "Room 23 south into Room 10" },
  { a: "23", b: "17", minutes: 1, note: "Room 23 west into Room 17" },
  { a: "17", b: "18", minutes: 2, note: "Room 17 west into Room 18 via the 18a/18b passage" },
];

export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];
