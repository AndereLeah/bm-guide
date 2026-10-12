/**
 * Demo mode: rule-based, deterministic responses built only from the curated dataset.
 * Every response produced here is labelled "Demo" in the UI; nothing here calls a model.
 */
import { OBJECTS, ON_DISPLAY, OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { listJoin, tagList, translate, type Lang } from "./i18n";
import { TAGS, TAG_LABEL } from "./tags";
import type { DetailLevel, Fact, GuideStyle, MuseumObject, TagId } from "./types";

export interface ChatTurn {
  role: "user" | "guide";
  text: string;
  factIds?: string[];
}

export type SuggestedAction =
  | { type: "more-like" | "less-like"; label: string }
  | { type: "more-detail" | "less-detail"; label: string }
  | { type: "more-tags" | "less-tags"; tags: TagId[]; label: string };

export interface AnswerResult {
  answer: string;
  factIds: string[];
  outOfScope: boolean;
  actions: SuggestedAction[];
}

const STOP = new Set(
  "a an the is are was were be been of to in on for and or but with this that these those it its it's what which who whom whose why how when where do does did can could would should i you me my your about tell more please there any from by as at have has had so if than then very much many some into also just really they them their he she his her we our us not no yes ok okay".split(
    " ",
  ),
);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9ʻ'\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.endsWith("s") && !w.endsWith("ss") && w.length > 3 ? w.slice(0, -1) : w));
}

// ───────────────────────── Free-text interests ─────────────────────────

export function interpretInterestsDemo(text: string): { tags: TagId[]; objectIds: string[]; note: string } {
  const lower = ` ${text.toLowerCase()} `;
  const tags = new Set<TagId>();
  for (const t of TAGS) {
    for (const k of t.keywords) {
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
      if (re.test(lower)) tags.add(t.id);
    }
  }
  const objectIds = new Set<string>();
  const words = new Set(tokenize(text));
  const GENERIC = new Set(["relief", "statue", "head", "figure", "colossal", "the", "from", "panel", "royal", "winged", "bronze", "parthenon", "frieze"]);
  for (const o of ON_DISPLAY) {
    const titleWords = tokenize(`${o.shortTitle}`).filter((w) => w.length > 2 && !GENERIC.has(w));
    if (titleWords.some((w) => words.has(w))) objectIds.add(o.id);
  }
  const parts: string[] = [];
  if (tags.size) parts.push(`themes: ${[...tags].map((t) => TAG_LABEL[t]).join(", ")}`);
  if (objectIds.size) parts.push(`objects: ${[...objectIds].map((id) => OBJECTS_BY_ID[id].shortTitle).join(", ")}`);
  return {
    tags: [...tags],
    objectIds: [...objectIds],
    note: parts.length ? `Demo rules matched ${parts.join("; ")}.` : "Demo rules didn't recognise specific themes in your note; your selected categories are used.",
  };
}

// ───────────────────────── Explanations ─────────────────────────

const KIND_ORDER: Fact["kind"][] = ["overview", "look", "context", "detail", "provenance", "material"];

function pickFacts(o: MuseumObject, detail: DetailLevel): Fact[] {
  const byKind = (k: Fact["kind"]) => o.facts.filter((f) => f.kind === k);
  if (detail === 1) return [...byKind("overview").slice(0, 1), ...byKind("look").slice(0, 1)];
  if (detail === 2) return [...byKind("overview").slice(0, 1), ...byKind("look").slice(0, 2), ...byKind("context").slice(0, 1)];
  return KIND_ORDER.flatMap(byKind);
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function familyPrompt(o: MuseumObject): string {
  if (o.tags.includes("animals")) return "Ask each other: which animal here would you most like to meet, and what sound would it make?";
  if (o.tags.includes("writing")) return "Try this: can you invent a symbol for your own name, like a cartouche?";
  if (o.tags.includes("colossal")) return "Guess together: how many of you, standing on each other's shoulders, would it take to be this tall?";
  if (o.tags.includes("conflict")) return "Talk about it: who do you think the artist wanted us to cheer for?";
  return "Ask each other: if this object could speak, what would its first sentence be?";
}

export function explainDemo(
  o: MuseumObject,
  style: GuideStyle,
  detail: DetailLevel,
  interests: TagId[] = [],
): { text: string; factIds: string[] } {
  const facts = pickFacts(o, detail);
  const over = facts.find((f) => f.kind === "overview");
  const looks = facts.filter((f) => f.kind === "look");
  const rest = facts.filter((f) => f.kind !== "overview" && f.kind !== "look");
  const hits = o.tags.filter((t) => interests.includes(t)).map((t) => TAG_LABEL[t]);
  const hook = hits.length ? `Since you're interested in ${hits.join(" and ")}, this one is for you. ` : "";
  const room = o.display.roomId ? ROOMS[o.display.roomId].shortName : "";
  let text = "";
  switch (style) {
    case "approachable":
      text = [hook + (over?.text ?? o.summary), ...looks.map((f) => f.text), ...rest.map((f) => f.text)].join(" ");
      break;
    case "in-depth": {
      const when = o.culture && o.culture !== o.date ? `${o.date}; ${o.culture}` : o.date;
      const head = `${o.title}. ${when}; ${o.materials.join(", ")}. Museum number ${o.museumNumber}.`;
      const body = [over?.text, ...rest.map((f) => f.text), ...looks.map((f) => `Observation: ${lowerFirst(f.text)}`)].filter(Boolean);
      text = [hook.trim(), head, ...body].filter(Boolean).join(" ");
      break;
    }
    case "playful": {
      const q = looks[0] ? `Quick challenge before you read on: ${lowerFirst(looks[0].text)}` : "Take ten seconds to look before reading on.";
      const fun = rest.length ? ` Bonus fact: ${lowerFirst(rest[0].text)}` : "";
      const more = rest.slice(1).map((f) => f.text).join(" ");
      text = `${hook}${q} Got it? Here's the story: ${over?.text ?? o.summary}${looks.slice(1).map((f) => " " + f.text).join("")}${fun}${more ? " " + more : ""}`;
      break;
    }
    case "family": {
      const l = looks[0] ? `Look closely! ${looks[0].text}` : "Look closely at the shapes and surfaces.";
      text = [l, over?.text ?? o.summary, ...rest.slice(0, detail === 1 ? 0 : detail).map((f) => f.text), familyPrompt(o)].join(" ");
      break;
    }
  }
  if (detail === 3 && room) text += ` You'll find it in ${room}${o.display.placement ? ` (${o.display.placement})` : ""}.`;
  return { text: text.replace(/\s+/g, " ").trim(), factIds: facts.map((f) => f.id) };
}

// ───────────────────────── Feedback in free text ─────────────────────────

export function detectFeedback(text: string, o: MuseumObject): SuggestedAction[] {
  const t = text.toLowerCase();
  const actions: SuggestedAction[] = [];
  if (/\b(shorter|too long|less detail|tl;?dr|briefer|simpler|summari[sz]e)\b/.test(t)) actions.push({ type: "less-detail", label: "Use less detail" });
  if (/\b(more detail|longer|go deeper|in depth|in-depth|more depth)\b/.test(t)) actions.push({ type: "more-detail", label: "Use more detail" });
  const mentioned = TAGS.filter((tg) => tg.keywords.some((k) => new RegExp(`\\b${k}`).test(t))).map((tg) => tg.id);
  const negative = /\b(bored|boring|not interested|no more|less|enough|don'?t like|dislike|skip)\b/.test(t);
  const positive = /\b(love|loved|like this|more like|more of|fascinating|amazing|interesting|favourite|favorite|want more)\b/.test(t);
  if (negative && mentioned.length) actions.push({ type: "less-tags", tags: mentioned, label: `Fewer stops about ${mentioned.map((x) => TAG_LABEL[x]).join(", ")}` });
  else if (positive && mentioned.length) actions.push({ type: "more-tags", tags: mentioned, label: `More stops about ${mentioned.map((x) => TAG_LABEL[x]).join(", ")}` });
  else if (negative && /\b(this|it|these|that)\b/.test(t)) actions.push({ type: "less-like", label: `Less like ${o.shortTitle}` });
  else if (positive) actions.push({ type: "more-like", label: `More like ${o.shortTitle}` });
  return actions;
}

// ───────────────────────── Question answering ─────────────────────────

type Intent = "date" | "material" | "origin" | "acquisition" | "size" | "location" | "maker" | "meaning" | "look" | "image" | "number" | "more" | "similar" | "kids" | "none";

const INTENTS: [Intent, RegExp][] = [
  ["similar", /\b(similar|like this|compare|related|else should i see|what next|nearby)\b/],
  ["image", /\b(image|photo|picture|licen[cs]e|copyright|credit)\b/],
  ["number", /\b(museum number|registration|accession|catalogue number)\b/],
  ["acquisition", /\b(how did .*(museum|british)|acquire|acquired|got here|get here|come to (the )?(museum|london|britain)|who gave|donat|bought|purchas|collect(ed|or)|own(ed|er)|return|loot|stolen|elgin|belzoni|salt)\b/],
  ["origin", /\b(where .*(found|from|discover|excavat)|found|discovered|excavated|origin|come from|findspot)\b/],
  ["location", /\b(where is it(?! from)|where'?s it(?! from)|which room|what room|find it|located|case|bay|on display|displayed)\b/],
  ["date", /\b(when|how old|date|dated|century|age|year|period)\b/],
  ["size", /\b(how (big|tall|large|heavy|long|wide)|size|weigh|weight|height|dimension|metres|meters)\b/],
  ["material", /\b(made of|made from|material|stone|metal|what is it made|granite|marble|bronze)\b/],
  ["maker", /\b(who made|who carved|artist|sculptor|maker|craftsm)\b/],
  ["meaning", /\b(why|mean|meaning|significan|important|purpose|used for|what was it for|matter|story)\b/],
  ["look", /\b(look for|notice|see|detail|spot|show|depict|scene|carv)\b/],
  ["kids", /\b(kid|kids|child|children|family)\b/],
  ["more", /^(more|go on|and\??|tell me more|continue|what else|anything else|keep going)\W*$/],
];

function detectIntent(q: string): Intent {
  const t = q.toLowerCase().trim();
  for (const [intent, re] of INTENTS) if (re.test(t)) return intent;
  return "none";
}

function firstUnused(facts: Fact[], used: Set<string>): Fact | undefined {
  return facts.find((f) => !used.has(f.id));
}

function similarObjects(o: MuseumObject, n = 3): MuseumObject[] {
  return ON_DISPLAY.filter((x) => x.id !== o.id)
    .map((x) => ({ x, s: x.tags.filter((t) => o.tags.includes(t)).length + (x.display.roomId === o.display.roomId ? 0.5 : 0) }))
    .filter((r) => r.s >= 2)
    .sort((a, b) => b.s - a.s || a.x.id.localeCompare(b.x.id))
    .slice(0, n)
    .map((r) => r.x);
}

const NOT_COVERED = (o: MuseumObject) =>
  `My curated sources for the ${o.shortTitle} don't cover that, so I won't guess. The full Collection online record (linked below the description) or a member of Museum staff may be able to help.`;

export function answerDemo(question: string, o: MuseumObject, history: ChatTurn[] = []): AnswerResult {
  const used = new Set(history.flatMap((h) => h.factIds ?? []));
  let intent = detectIntent(question);
  const actions = detectFeedback(question, o);
  // Follow-ups like "why?" or "how?" refer to the most recent answer about this object.
  if (intent === "none" && /^\s*(why|how|really|what)\s*\??\s*$/i.test(question)) intent = "meaning";
  const ofKind = (...k: Fact["kind"][]) => o.facts.filter((f) => k.includes(f.kind));
  const reply = (answer: string, facts: Fact[] = []): AnswerResult => ({ answer, factIds: facts.map((f) => f.id), outOfScope: false, actions });

  switch (intent) {
    case "date":
      return reply(`The record dates it to ${o.date}${o.culture && o.culture !== o.date ? ` (${o.culture})` : ""}.`);
    case "material": {
      const f = ofKind("material").slice(0, 1);
      return reply(`It's made of ${o.materials.join(", ")}.${f.length ? " " + f[0].text : ""}`, f);
    }
    case "origin": {
      const f = ofKind("provenance").slice(0, 1);
      if (!o.findspot && !f.length) return { answer: NOT_COVERED(o), factIds: [], outOfScope: true, actions };
      return reply([o.findspot ? `The record gives its findspot as ${o.findspot}.` : "", f[0]?.text ?? ""].filter(Boolean).join(" "), f);
    }
    case "acquisition": {
      const f = ofKind("provenance");
      const parts = [o.acquisition ? `Acquisition: ${o.acquisition}.` : "", ...f.map((x) => x.text)].filter(Boolean);
      if (!parts.length) return { answer: NOT_COVERED(o), factIds: [], outOfScope: true, actions };
      return reply(
        parts.join(" ") + " I can only report what the record says; for questions about ownership debates or return requests, the Museum's own published statements are the best source.",
        f,
      );
    }
    case "size": {
      const f = ofKind("material");
      if (!o.dimensions && !f.length) return { answer: NOT_COVERED(o), factIds: [], outOfScope: true, actions };
      return reply(o.dimensions ? `Recorded dimensions: ${o.dimensions}.` : f[0].text, f.slice(0, 1));
    }
    case "location": {
      const room = o.display.roomId ? ROOMS[o.display.roomId] : null;
      if (!room) return reply(`On the verification date (${o.verifiedOn}) the record said "${o.display.recordLocation}", so it isn't part of any tour.`);
      return reply(
        `It's in ${room.name}${o.display.placement ? `, ${o.display.placement}` : ""}. The record reads "${o.display.recordLocation}" (checked ${o.verifiedOn}). I can't see your exact position, so use the gallery signs.${o.display.note ? " " + o.display.note : ""}`,
      );
    }
    case "maker": {
      const hit = o.facts.filter((f) => /\b(sculptor|made by|artist|carved by)\b/i.test(f.text));
      if (hit.length) return reply(hit[0].text, hit.slice(0, 1));
      return { answer: `The record I'm using doesn't name a maker for the ${o.shortTitle}. It gives the culture as ${o.culture}.`, factIds: [], outOfScope: true, actions };
    }
    case "meaning": {
      const f = firstUnused(ofKind("context"), used) ?? firstUnused(ofKind("detail"), used) ?? ofKind("context")[0] ?? ofKind("overview")[0];
      return reply(f ? f.text : o.summary, f ? [f] : []);
    }
    case "look": {
      const f = ofKind("look").filter((x) => !used.has(x.id));
      const pick = f.length ? f.slice(0, 2) : ofKind("look").slice(0, 1);
      if (!pick.length) return reply(`My sources don't list specific details to look for, but here's the overview: ${o.summary}`);
      return reply(pick.map((x) => x.text).join(" "), pick);
    }
    case "image":
      return reply(
        o.image.usePermitted
          ? `The photo is from Collection online. Credit: ${o.image.credit}`
          : `No image is shown for this object because its licence couldn't be confirmed. ${o.image.note ?? ""}`.trim(),
      );
    case "number":
      return reply(`Museum number ${o.museumNumber}${o.registrationNumber ? ` (registration number ${o.registrationNumber})` : ""}.`);
    case "similar": {
      const sims = similarObjects(o);
      if (!sims.length) return reply("I couldn't find a close match among the objects in this prototype's dataset.");
      return reply(
        `Related objects in this guide: ${sims.map((s) => `${s.shortTitle} (${ROOMS[s.display.roomId!].shortName})`).join("; ")}. Tap “More like this” if you'd like the tour to favour them.`,
      );
    }
    case "kids": {
      const f = ofKind("look").slice(0, 1);
      return reply(`${f[0]?.text ?? o.summary} ${familyPrompt(o)}`, f);
    }
    case "more": {
      const f = firstUnused(o.facts, used);
      if (!f) return reply(`That's everything my curated sources hold about the ${o.shortTitle}. The full record is linked in the Sources section.`);
      return reply(f.text, [f]);
    }
  }

  // Fallback: keyword overlap with the curated facts and structured fields.
  const q = new Set(tokenize(question));
  if (!q.size) {
    if (actions.length) return { answer: "Got it. Use the button below to apply that to your tour.", factIds: [], outOfScope: false, actions };
    return { answer: `Could you ask that another way? You can ask about when it was made, what to look for, where it was found, or how it came to the Museum.`, factIds: [], outOfScope: true, actions };
  }
  let best: { f: Fact; s: number } | null = null;
  for (const f of o.facts) {
    const words = new Set(tokenize(f.text));
    let s = 0;
    for (const w of q) if (words.has(w)) s += 1;
    if (used.has(f.id)) s -= 0.25;
    if (s > 0 && (!best || s > best.s)) best = { f, s };
  }
  if (best && best.s >= 1) return reply(best.f.text, [best.f]);
  // Maybe the question is about another object in the dataset.
  const other = OBJECTS.find((x) => x.id !== o.id && tokenize(x.shortTitle).some((w) => w.length > 4 && q.has(w)));
  if (other) {
    return {
      answer: `That sounds like a question about the ${other.shortTitle}${other.display.roomId ? ` in ${ROOMS[other.display.roomId].shortName}` : ""}. Open its page to ask about it there. Here I'm answering about the ${o.shortTitle}.`,
      factIds: [],
      outOfScope: true,
      actions,
    };
  }
  if (actions.length) return { answer: "Thanks for the feedback. Use a button below to apply it to your tour.", factIds: [], outOfScope: false, actions };
  return { answer: NOT_COVERED(o), factIds: [], outOfScope: true, actions };
}

export function recapDemo(seen: MuseumObject[], liked: TagId[], minutes: number, lang: Lang = "en"): string {
  if (!seen.length) return translate(lang, "s.recapNone");
  const rooms = [...new Set(seen.map((o) => ROOMS[o.display.roomId!].shortName))];
  const cultures = [...new Set(seen.map((o) => o.culture.split(";")[0].trim()))].slice(0, 4);
  const oldest = [...seen].sort((a, b) => yearOf(a.date) - yearOf(b.date))[0];
  const text = translate(lang, "s.recapText", {
    min: minutes,
    n: seen.length,
    rooms: listJoin(lang, rooms),
    cultures: listJoin(lang, cultures),
    oldest: oldest.shortTitle,
    date: oldest.date,
  });
  return text + (liked.length ? translate(lang, "s.recapLiked", { tags: tagList(lang, liked) }) : "");
}

/** Rough sortable year (negative = BC) from a display date string. */
export function yearOf(date: string): number {
  const m = /(\d[\d,]*)\s*(BC|AD)?/i.exec(date);
  if (!m) {
    if (/dynasty|period/i.test(date)) return -1000;
    return 0;
  }
  const n = parseInt(m[1].replace(/,/g, ""), 10);
  if (/century/i.test(date)) {
    const v = (n - 1) * 100 + 50;
    return /BC/i.test(date) ? -v : v;
  }
  return /BC/i.test(date) ? -n : n;
}
