"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { OBJECTS_BY_ID, ON_DISPLAY } from "@/data/objects";
import { EDGES, LOCATION_VERIFIED_ON, OFFICIAL_MAP_URL, ROOMS, ROOM_IDS } from "@/data/rooms";
import { listJoin } from "@/lib/i18n";
import { shortestRoute } from "@/lib/routing";
import { useVisit } from "@/lib/store";
import type { RoomId, Stop } from "@/lib/types";
import type { VisitState } from "@/lib/visit";

const BASE = { x: 0, y: 0, w: 370, h: 280 };
type Pt = [number, number];

function center(r: RoomId): Pt {
  const s = ROOMS[r].schematic;
  return [s.x + s.w / 2, s.y + s.h / 2];
}

/** Polyline through a sequence of rooms, following each doorway (including drawn detours). */
function pathPoints(path: RoomId[]): Pt[] {
  const pts: Pt[] = [];
  path.forEach((r, i) => {
    if (i > 0) {
      const a = path[i - 1];
      const e = EDGES.find((x) => (x.a === a && x.b === r) || (x.a === r && x.b === a));
      if (e?.draw) pts.push(...(e.a === a ? e.draw : [...e.draw].reverse()));
    }
    pts.push(center(r));
  });
  return pts;
}

export interface VisitStop {
  n: number;
  objectId: string;
  roomId: RoomId;
  done: boolean;
  path: RoomId[];
  stop?: Stop;
}

/** Whole-visit sequence: completed stops first (numbers never change), then the remaining plan. */
export function visitSequence(state: VisitState): VisitStop[] {
  const seq: VisitStop[] = [];
  let prev: RoomId = state.prefs?.startRoom ?? "GC";
  for (const c of state.completed) {
    seq.push({ n: seq.length + 1, objectId: c.objectId, roomId: c.roomId, done: true, path: shortestRoute(prev, c.roomId).path });
    prev = c.roomId;
  }
  for (const s of state.plan?.stops ?? []) {
    seq.push({ n: seq.length + 1, objectId: s.objectId, roomId: s.roomId, done: false, path: s.path, stop: s });
  }
  return seq;
}

type Sel = { kind: "room"; id: RoomId } | { kind: "stop"; n: number } | null;

export function GalleryMap({ state }: { state: VisitState }) {
  const { t, lang } = useVisit();
  const seq = useMemo(() => visitSequence(state), [state]);
  const nextN = seq.find((s) => !s.done)?.n ?? null;
  const [sel, setSel] = useState<Sel>(nextN ? { kind: "stop", n: nextN } : null);
  const [vb, setVb] = useState(BASE);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; vb: typeof BASE; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  // Keep the selection valid when the plan changes.
  useEffect(() => {
    if (sel?.kind === "stop" && !seq.some((s) => s.n === sel.n)) setSel(nextN ? { kind: "stop", n: nextN } : null);
  }, [seq, sel, nextN]);

  const zoom = BASE.w / vb.w;
  const clampVb = (v: typeof BASE) => ({
    ...v,
    x: Math.min(Math.max(v.x, BASE.x - 20), BASE.x + BASE.w - v.w + 20),
    y: Math.min(Math.max(v.y, BASE.y - 20), BASE.y + BASE.h - v.h + 20),
  });
  const zoomTo = (z: number, focus?: Pt) => {
    const nz = Math.min(3, Math.max(1, z));
    const w = BASE.w / nz;
    const h = BASE.h / nz;
    const [cx, cy] = focus ?? [vb.x + vb.w / 2, vb.y + vb.h / 2];
    setVb(nz === 1 ? BASE : clampVb({ x: cx - w / 2, y: cy - h / 2, w, h }));
  };

  const selectStop = (n: number) => {
    setSel({ kind: "stop", n });
    const s = seq.find((x) => x.n === n);
    if (s && zoom > 1) zoomTo(zoom, center(s.roomId));
  };
  const click = (fn: () => void) => () => {
    if (suppressClick.current) return;
    fn();
  };

  const selStop = sel?.kind === "stop" ? seq.find((s) => s.n === sel.n) ?? null : null;
  const selRoom = sel?.kind === "room" ? sel.id : null;
  const focusN = selStop?.n ?? nextN;

  const byRoom = new Map<RoomId, VisitStop[]>();
  for (const s of seq) byRoom.set(s.roomId, [...(byRoom.get(s.roomId) ?? []), s]);

  const room = selRoom ? ROOMS[selRoom] : null;
  const roomStops = selRoom ? byRoom.get(selRoom) ?? [] : [];
  const others = selRoom ? ON_DISPLAY.filter((o) => o.display.roomId === selRoom && !roomStops.some((s) => s.objectId === o.id)) : [];
  const prevOf = (n: number) => (n > 1 ? seq[n - 2].roomId : state.prefs?.startRoom ?? "GC");

  return (
    <div>
      <div className="card relative overflow-hidden p-2">
        <div className="mb-1 flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] text-muted">{t("m.hint")}</span>
          <div className="flex gap-1">
            <button type="button" className="btn-secondary h-9 min-h-9 w-9 p-0 text-lg" aria-label={t("m.zoomOut")} onClick={() => zoomTo(zoom / 1.5)} disabled={zoom <= 1}>
              −
            </button>
            <button type="button" className="btn-secondary h-9 min-h-9 w-9 p-0 text-lg" aria-label={t("m.zoomIn")} onClick={() => zoomTo(zoom * 1.5, selStop ? center(selStop.roomId) : undefined)} disabled={zoom >= 3}>
              +
            </button>
            {zoom > 1 && (
              <button type="button" className="btn-secondary h-9 min-h-9 px-2.5 text-xs" aria-label={t("m.reset")} onClick={() => setVb(BASE)}>
                ⤢
              </button>
            )}
          </div>
        </div>
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className={`h-auto w-full touch-none select-none ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          role="group"
          aria-label={t("m.aria")}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY, vb, moved: false };
            suppressClick.current = false;
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || zoom === 1) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (!d.moved && Math.hypot(dx, dy) < 5) return;
            d.moved = true;
            suppressClick.current = true;
            const scale = d.vb.w / (svgRef.current?.clientWidth || BASE.w);
            setVb(clampVb({ ...d.vb, x: d.vb.x - dx * scale, y: d.vb.y - dy * scale }));
          }}
          onPointerUp={() => {
            drag.current = null;
            setTimeout(() => (suppressClick.current = false), 0);
          }}
          onPointerLeave={() => (drag.current = null)}
        >
          {/* Doorways: drawn under rooms so they show as links in the gaps. */}
          {EDGES.map((e) => (
            <polyline
              key={`${e.a}-${e.b}`}
              points={(e.draw ? [center(e.a), ...e.draw, center(e.b)] : [center(e.a), center(e.b)]).map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke="#c9c1b3"
              strokeWidth={5}
              strokeLinecap="round"
            />
          ))}
          <text x={262} y={268} fontSize={7} fill="#5a554d" textAnchor="middle">
            {t("m.entrance")}
          </text>

          {ROOM_IDS.map((id) => {
            const r = ROOMS[id];
            const s = r.schematic;
            const list = byRoom.get(id) ?? [];
            const planned = list.filter((x) => !x.done).map((x) => x.n);
            const isSel = selRoom === id;
            const fill = planned.length ? "#e3ece8" : list.length ? "#ece6db" : "#ffffff";
            return (
              <g
                key={id}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={t("m.roomAria", { room: r.name, stops: list.length ? t("m.roomStops", { list: listJoin(lang, list.map((x) => String(x.n))) }) : t("m.roomNone") })}
                onClick={click(() => setSel(isSel ? null : { kind: "room", id }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel(isSel ? null : { kind: "room", id });
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={4} fill={fill} stroke={isSel ? "#a5761f" : planned.length ? "#1f4d45" : "#b9b0a2"} strokeWidth={isSel ? 3 : 1.5} />
                {id === "GC" && <ellipse cx={s.x + s.w / 2} cy={s.y + s.h / 2 + 6} rx={30} ry={34} fill="none" stroke="#d6cdbf" strokeDasharray="3 3" />}
                <text x={s.x + s.w / 2} y={s.y + 10} fontSize={8} fontWeight={700} textAnchor="middle" fill="#1d1b18">
                  {id === "GC" ? "Great Court" : id}
                </text>
                {r.availability.restrictedHours && (
                  <text x={s.x + s.w / 2} y={s.y + s.h - 3} fontSize={6} textAnchor="middle" fill="#8a4b0c">
                    11–15
                  </text>
                )}
              </g>
            );
          })}

          {/* Route: completed legs grey, planned legs green, the focused leg gold. */}
          {seq.map((s) => {
            if (s.path.length < 2) return null;
            const focused = s.n === focusN;
            return (
              <polyline
                key={`leg-${s.n}`}
                points={pathPoints(s.path).map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke={focused ? "#a5761f" : s.done ? "#9b9387" : "#1f4d45"}
                strokeWidth={focused ? 4 : 2.5}
                strokeOpacity={focused ? 0.95 : s.done ? 0.6 : 0.55}
                strokeDasharray={s.done ? "3 3" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />
            );
          })}
          {state.prefs && (
            <g pointerEvents="none">
              <circle cx={center(state.prefs.startRoom)[0]} cy={center(state.prefs.startRoom)[1]} r={5} fill="#fff" stroke="#1d1b18" strokeWidth={2} />
            </g>
          )}

          {/* Numbered stops, laid out in a grid inside each room. */}
          {ROOM_IDS.map((id) => {
            const list = byRoom.get(id) ?? [];
            if (!list.length) return null;
            const s = ROOMS[id].schematic;
            const cols = Math.max(1, Math.min(4, Math.floor((s.w - 4) / 15)));
            const rows = Math.max(1, Math.floor((s.h - 24) / 14));
            const cap = cols * rows;
            const shown = list.length > cap ? list.slice(0, cap - 1) : list;
            const gridW = Math.min(cols, list.length) * 15;
            const x0 = s.x + s.w / 2 - gridW / 2 + 7.5;
            const y0 = s.y + 22;
            return (
              <g key={`b-${id}`}>
                {shown.map((v, k) => {
                  const cx = x0 + (k % cols) * 15;
                  const cy = y0 + Math.floor(k / cols) * 14;
                  const isNext = v.n === nextN;
                  const isSel = selStop?.n === v.n;
                  const o = OBJECTS_BY_ID[v.objectId];
                  return (
                    <g
                      key={v.n}
                      role="button"
                      tabIndex={0}
                      aria-label={`${t("m.stopN", { n: v.n })}: ${o.shortTitle}${v.done ? ` (${t("m.done")})` : ""}`}
                      aria-pressed={isSel}
                      className="cursor-pointer focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!suppressClick.current) selectStop(v.n);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          selectStop(v.n);
                        }
                      }}
                    >
                      <circle cx={cx} cy={cy} r={9} fill="transparent" />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6.5}
                        fill={v.done ? "#9b9387" : isNext ? "#a5761f" : "#1f4d45"}
                        stroke={isSel ? "#1d1b18" : "#fff"}
                        strokeWidth={isSel ? 2 : 1}
                      />
                      <text x={cx} y={cy + 2.6} fontSize={7} fontWeight={700} textAnchor="middle" fill="#fff" pointerEvents="none">
                        {v.n}
                      </text>
                    </g>
                  );
                })}
                {list.length > cap && (
                  <text x={x0 + ((cap - 1) % cols) * 15} y={y0 + Math.floor((cap - 1) / cols) * 14 + 2.5} fontSize={7} textAnchor="middle" fill="#1f4d45">
                    +{list.length - cap + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[11px] text-muted">
          <li>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-gold align-middle" />
            {t("m.legendNext")}
          </li>
          <li>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-accent align-middle" />
            {t("m.legendPlanned")}
          </li>
          <li>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#9b9387] align-middle" />
            {t("m.legendDone")}
          </li>
          <li>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-ink bg-white align-middle" />
            {t("m.start")}
          </li>
          <li className="text-warn">{t("m.legendHours")}</li>
        </ul>
        <p className="mt-1 px-1 text-[11px] text-muted">
          {t("m.footnote", { date: LOCATION_VERIFIED_ON })}{" "}
          <a href={OFFICIAL_MAP_URL} className="underline" target="_blank" rel="noreferrer">
            {t("m.official")}
          </a>
        </p>
      </div>

      <div className="mt-3" aria-live="polite">
        {selStop ? (
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-secondary h-10 min-h-10 w-10 p-0"
                aria-label={t("m.prev")}
                disabled={selStop.n <= 1}
                onClick={() => selectStop(selStop.n - 1)}
              >
                ‹
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="label">
                  {t("m.stopN", { n: selStop.n })}
                  {selStop.done ? ` · ${t("m.done")}` : selStop.n === nextN ? ` · ${t("m.legendNext")}` : ""}
                </p>
                <p className="truncate font-semibold">{OBJECTS_BY_ID[selStop.objectId].title}</p>
                <p className="text-xs text-muted">
                  {ROOMS[selStop.roomId].shortName}
                  {selStop.stop
                    ? ` · ${
                        selStop.stop.travelMinutes && prevOf(selStop.n) !== selStop.roomId
                          ? t("m.walkFrom", { n: selStop.stop.travelMinutes, room: ROOMS[prevOf(selStop.n)].shortName })
                          : t("m.inRoom")
                      } · ${t("m.viewing", { n: selStop.stop.viewMinutes })}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary h-10 min-h-10 w-10 p-0"
                aria-label={t("m.nextStop")}
                disabled={selStop.n >= seq.length}
                onClick={() => selectStop(selStop.n + 1)}
              >
                ›
              </button>
            </div>
            <Link href={`/guide/${encodeURIComponent(selStop.objectId)}`} className="btn-primary mt-3 w-full">
              {t("m.open")}
            </Link>
          </div>
        ) : room ? (
          <div className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className="text-xs text-muted">
                  {room.availability.restrictedHours ? `${t("m.listedOpen", { open: room.availability.restrictedHours.open, close: room.availability.restrictedHours.close })} ` : ""}
                  <a href={room.galleryUrl} className="underline" target="_blank" rel="noreferrer">
                    {t("m.gallery")}
                  </a>
                </p>
              </div>
              <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => setSel(null)}>
                {t("common.close")}
              </button>
            </div>
            {roomStops.length ? (
              <ul className="mt-2 space-y-1">
                {roomStops.map((v) => (
                  <li key={v.n}>
                    <Link className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-stone-50" href={`/guide/${encodeURIComponent(v.objectId)}`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${v.done ? "bg-[#9b9387]" : v.n === nextN ? "bg-gold" : "bg-accent"}`}>
                        {v.n}
                      </span>
                      <span className="font-medium">{OBJECTS_BY_ID[v.objectId].shortTitle}</span>
                      <span className="ml-auto text-xs text-muted">{v.done ? "✓" : t("m.viewing", { n: v.stop?.viewMinutes ?? 0 })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {t("m.noStops")} {room.id === "23" ? t("m.connecting") : ""}
              </p>
            )}
            {others.length > 0 && (
              <div className="mt-2">
                <p className="label">{t("m.also")}</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {others.map((o) => (
                    <li key={o.id}>
                      <Link href={`/guide/${encodeURIComponent(o.id)}`} className="chip min-h-9 px-3 py-1 text-sm">
                        {o.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
