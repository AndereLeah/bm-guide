import type { TagId } from "./types";

export const TAGS: { id: TagId; label: string; keywords: string[] }[] = [
  { id: "egypt", label: "Ancient Egypt", keywords: ["egypt", "pharaoh", "hieroglyph", "nile", "mummy", "mummies", "rosetta", "ramesses", "cleopatra"] },
  { id: "mesopotamia", label: "Assyria & Mesopotamia", keywords: ["assyria", "assyrian", "mesopotamia", "iraq", "nineveh", "nimrud", "babylon", "cuneiform", "near east", "middle east", "bible", "biblical"] },
  { id: "greece-rome", label: "Greece & Rome", keywords: ["greek", "greece", "rome", "roman", "parthenon", "athens", "classical", "athena", "marble"] },
  { id: "world", label: "Pacific & Americas", keywords: ["pacific", "easter island", "rapa nui", "oceania", "americas", "indigenous", "canada", "totem", "first nations"] },
  { id: "writing", label: "Writing & decipherment", keywords: ["writing", "script", "language", "languages", "decipher", "inscription", "text", "alphabet", "reading", "codes", "linguistics"] },
  { id: "power", label: "Kings & power", keywords: ["king", "kings", "queen", "ruler", "royal", "power", "empire", "politics", "propaganda", "pharaoh"] },
  { id: "religion", label: "Gods, myth & belief", keywords: ["god", "gods", "goddess", "myth", "mythology", "religion", "ritual", "spirit", "belief", "sacred", "temple", "legend"] },
  { id: "afterlife", label: "Death & the afterlife", keywords: ["death", "afterlife", "tomb", "burial", "coffin", "mummy", "sarcophagus", "funeral"] },
  { id: "animals", label: "Animals", keywords: ["animal", "animals", "cat", "cats", "lion", "lions", "horse", "horses", "bull", "beetle", "dog", "birds", "creature", "zoo"] },
  { id: "conflict", label: "War & hunting", keywords: ["war", "battle", "army", "military", "siege", "soldier", "hunt", "hunting", "weapon", "conflict", "fight"] },
  { id: "sculpture", label: "Sculpture & the body", keywords: ["sculpture", "statue", "statues", "body", "art", "artist", "carving", "figure", "anatomy"] },
  { id: "science", label: "Science & discovery", keywords: ["science", "astronomy", "stars", "engineering", "technology", "discovery", "archaeology", "instrument", "ship", "invention", "how things were made", "transport"] },
  { id: "collecting", label: "Collecting & empire", keywords: ["collecting", "collector", "colonial", "colonialism", "empire", "provenance", "museum history", "restitution", "acquired", "looted"] },
  { id: "colossal", label: "Colossal & monumental", keywords: ["huge", "giant", "colossal", "big", "massive", "monumental", "biggest", "large"] },
  { id: "craft", label: "Craft & materials", keywords: ["craft", "metal", "bronze", "gold", "materials", "design", "jewellery", "jewelry", "making", "wood", "flint"] },
  { id: "women", label: "Women in history", keywords: ["women", "woman", "female", "queen", "goddess", "priestess", "nymph", "gender"] },
];

export const TAG_LABEL: Record<TagId, string> = Object.fromEntries(TAGS.map((t) => [t.id, t.label])) as Record<TagId, string>;
export const TAG_IDS = new Set<TagId>(TAGS.map((t) => t.id));

export function isTagId(x: unknown): x is TagId {
  return typeof x === "string" && TAG_IDS.has(x as TagId);
}
