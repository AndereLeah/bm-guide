export const maxDuration = 30;

import { z } from "zod";
import { explainRecommendations } from "@/lib/ai";
import { bad, mode, readJson, style, tagList, language } from "../_shared";

const Body = z.object({
  interests: tagList,
  freeText: z.string().max(1000).default(""),
  style,
  stops: z.array(z.object({ id: z.string().max(64), reason: z.string().max(500) })).max(40),
  mode,
  language,
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad("Invalid request");
  const { mode: m, language: l, ...rest } = parsed.data;
  return Response.json(await explainRecommendations(rest, m === "live", l));
}
