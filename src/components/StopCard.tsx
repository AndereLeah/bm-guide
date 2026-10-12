"use client";

import Link from "next/link";
import { OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { toHHMM } from "@/lib/availability";
import { listJoin, renderWhy, tagLabel } from "@/lib/i18n";
import { useVisit } from "@/lib/store";
import type { Stop } from "@/lib/types";
import { aiReason } from "@/lib/visit";
import { ObjectImage, SourceTag } from "./ui";

/** `number` is the stop's position in the whole visit (completed stops keep their numbers). */
export function StopCard({ stop, number, clockStart, highlight }: { stop: Stop; number: number; clockStart: number; highlight?: boolean }) {
  const { state, t, lang } = useVisit();
  const o = OBJECTS_BY_ID[stop.objectId];
  const ai = aiReason(state, stop.objectId, stop.reason);
  const why = ai?.text ?? (stop.why ? renderWhy(lang, stop.why) : stop.reason);
  const via = stop.path.length > 2 ? listJoin(lang, stop.path.slice(1, -1).map((r) => ROOMS[r].shortName)) : null;
  return (
    <li>
      <Link
        href={`/guide/${encodeURIComponent(o.id)}`}
        className={`card flex gap-3 p-3 transition-shadow hover:shadow-md ${highlight ? "ring-2 ring-accent/60" : ""}`}
        aria-label={t("card.aria", { n: number, title: o.title, room: ROOMS[stop.roomId].shortName })}
      >
        <div className="relative shrink-0">
          <ObjectImage o={o} className="h-24 w-20 rounded-xl sm:h-28 sm:w-24" />
          <span className="absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{number}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-snug">{o.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {ROOMS[stop.roomId].shortName}
            {o.display.placement ? ` · ${o.display.placement}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            ~{toHHMM(clockStart + stop.arriveAt)} · {stop.travelMinutes ? `${t("card.walk", { n: stop.travelMinutes })}${via ? ` ${t("card.via", { rooms: via })}` : ""}` : t("card.here")} ·{" "}
            {t("card.view", { n: stop.viewMinutes })}
          </p>
          <p className="mt-1.5 text-sm leading-snug">{why}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {stop.mustSee && <span className="rounded-full bg-oxblood px-2 py-0.5 text-[11px] font-semibold text-white">{t("card.must")}</span>}
            {stop.matchedTags.slice(0, 3).map((tg) => (
              <span key={tg} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                {tagLabel(lang, tg)}
              </span>
            ))}
            {ai && <SourceTag source={ai.source} />}
          </div>
        </div>
      </Link>
    </li>
  );
}
