export const maxDuration = 30;

import { z } from "zod";
import { recapVisit } from "@/lib/ai";
import { bad, mode, readJson, style, tagList, language } from "../_shared";

const Body = z.object({
  seen: z.array(z.string().max(64)).max(60),
  liked: tagList.default([]),
  minutes: z.number().min(0).max(1000),
  style,
  demoText: z.string().max(2000),
  mode,
  language,
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad("Invalid request");
  const { mode: m, language: l, ...rest } = parsed.data;
  return Response.json(await recapVisit(rest, m === "live", l));
}
