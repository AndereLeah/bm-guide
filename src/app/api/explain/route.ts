export const maxDuration = 30;

import { z } from "zod";
import { OBJECTS_BY_ID } from "@/data/objects";
import { explainObject } from "@/lib/ai";
import { bad, detail, mode, readJson, style, tagList, language } from "../_shared";

const Body = z.object({ objectId: z.string().max(64), style, detail, interests: tagList.default([]), mode, language });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad("Invalid request");
  const b = parsed.data;
  if (!OBJECTS_BY_ID[b.objectId]) return bad("Unknown object", 404);
  return Response.json(await explainObject(b.objectId, b.style, b.detail, b.interests, b.mode === "live", b.language));
}
