export const maxDuration = 30;

import { z } from "zod";
import { OBJECTS_BY_ID } from "@/data/objects";
import { answerQuestion } from "@/lib/ai";
import { bad, detail, mode, readJson, style, language } from "../_shared";

const Body = z.object({
  objectId: z.string().max(64),
  question: z.string().min(1).max(600),
  history: z
    .array(z.object({ role: z.enum(["user", "guide"]), text: z.string().max(4000), factIds: z.array(z.string()).max(30).optional() }))
    .max(40)
    .default([]),
  style,
  detail,
  mode,
  language,
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad("Invalid request");
  const b = parsed.data;
  if (!OBJECTS_BY_ID[b.objectId]) return bad("Unknown object", 404);
  return Response.json(await answerQuestion(b.objectId, b.question, b.history, b.style, b.detail, b.mode === "live", b.language));
}
