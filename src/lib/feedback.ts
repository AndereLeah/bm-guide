import { TAG_LABEL } from "./tags";
import type { DetailLevel, FeedbackState, MuseumObject, TagId } from "./types";

const STEP = 2;
const CLAMP = 6;

export function applySimilarity(fb: FeedbackState, o: MuseumObject, direction: "more" | "less"): { feedback: FeedbackState; message: string } {
  const tagWeights = { ...fb.tagWeights };
  for (const t of o.tags) {
    const next = (tagWeights[t] ?? 0) + (direction === "more" ? STEP : -STEP);
    tagWeights[t] = Math.max(-CLAMP, Math.min(CLAMP, next));
  }
  const objectPenalty = { ...fb.objectPenalty };
  if (direction === "less") objectPenalty[o.id] = (objectPenalty[o.id] ?? 0) + 5;
  const labels = o.tags.map((t) => TAG_LABEL[t]).join(", ");
  const message =
    direction === "more"
      ? `You asked for more like ${o.shortTitle}, so objects about ${labels} now rank higher.`
      : `You asked for less like ${o.shortTitle}, so objects about ${labels} now rank lower.`;
  return { feedback: { ...fb, tagWeights, objectPenalty }, message };
}

export function applyTagFeedback(fb: FeedbackState, tags: TagId[], direction: "more" | "less"): FeedbackState {
  const tagWeights = { ...fb.tagWeights };
  for (const t of tags) {
    const next = (tagWeights[t] ?? 0) + (direction === "more" ? STEP : -STEP);
    tagWeights[t] = Math.max(-CLAMP, Math.min(CLAMP, next));
  }
  return { ...fb, tagWeights };
}

export function changeDetail(fb: FeedbackState, delta: 1 | -1): { feedback: FeedbackState; changed: boolean } {
  const next = Math.max(1, Math.min(3, fb.detail + delta)) as DetailLevel;
  return { feedback: { ...fb, detail: next }, changed: next !== fb.detail };
}

export const DETAIL_LABEL: Record<DetailLevel, string> = { 1: "Brief", 2: "Standard", 3: "In depth" };
