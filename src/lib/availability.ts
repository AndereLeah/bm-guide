import { ROOMS } from "@/data/rooms";
import type { RoomId } from "./types";

/** Parse "YYYY-MM-DDTHH:mm" (museum local time) into parts without timezone conversion. */
export function parseLocal(visitStart: string): { date: string; minutes: number; weekday: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(visitStart);
  if (!m) throw new Error(`Invalid visit start: ${visitStart}`);
  const [, y, mo, d, h, mi] = m;
  const weekday = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay(); // 0 Sun … 6 Sat
  return { date: `${y}-${mo}-${d}`, minutes: +h * 60 + +mi, weekday };
}

export function toHHMM(totalMinutes: number): string {
  const m = Math.round(totalMinutes);
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function hhmm(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

/** Galleries open 10.00–17.00 (Fridays 20.30); galleries are cleared 10 minutes before closing. */
export function museumHours(weekday: number): { open: number; close: number } {
  return { open: 10 * 60, close: (weekday === 5 ? 20 * 60 + 30 : 17 * 60) - 10 };
}

export function museumClosedOn(date: string): boolean {
  const md = date.slice(5);
  return md === "12-24" || md === "12-25" || md === "12-26";
}

export interface RoomCheck {
  open: boolean;
  reason?: string;
  warning?: string;
}

/** Is the room closed all day on this date (planned closure that is not partial)? */
export function roomClosedOnDate(roomId: RoomId, date: string): RoomCheck {
  const room = ROOMS[roomId];
  if (museumClosedOn(date)) return { open: false, reason: "The Museum is closed 24–26 December." };
  for (const c of room.availability.plannedClosures) {
    if (date >= c.from && date <= c.to) {
      if (c.partial) return { open: true, warning: `${room.shortName}: ${c.note} (${c.from} to ${c.to}).` };
      return { open: false, reason: `${room.shortName} is scheduled to be closed ${c.from} to ${c.to} (${c.note}).` };
    }
  }
  return { open: true };
}

/**
 * Check whether a visitor arriving at `arriveClock` (minutes after midnight) and staying `stay`
 * minutes can see something in this room.
 */
export function roomOpenAt(roomId: RoomId, date: string, weekday: number, arriveClock: number, stay: number): RoomCheck {
  const day = roomClosedOnDate(roomId, date);
  if (!day.open) return day;
  const { open, close } = museumHours(weekday);
  if (arriveClock < open) return { open: false, reason: `Galleries open at ${toHHMM(open)}.` };
  if (arriveClock + stay > close) return { open: false, reason: `Galleries begin clearing at ${toHHMM(close)}.` };
  const r = ROOMS[roomId].availability.restrictedHours;
  if (r) {
    const o = hhmm(r.open);
    const c = hhmm(r.close);
    if (arriveClock < o || arriveClock + stay > c) {
      return { open: false, reason: `${ROOMS[roomId].shortName} is listed as open ${r.open}–${r.close} only.` };
    }
  }
  return day;
}
