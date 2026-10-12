import { EDGES, ROOMS, ROOM_IDS } from "@/data/rooms";
import type { Edge, RoomId } from "./types";

export interface Route {
  minutes: number;
  path: RoomId[];
}

type Graph = Map<RoomId, { to: RoomId; minutes: number }[]>;

export function buildGraph(edges: Edge[] = EDGES): Graph {
  const g: Graph = new Map();
  for (const id of ROOM_IDS) g.set(id, []);
  for (const e of edges) {
    g.get(e.a)!.push({ to: e.b, minutes: e.minutes });
    g.get(e.b)!.push({ to: e.a, minutes: e.minutes });
  }
  // Deterministic neighbour order.
  for (const list of g.values()) list.sort((x, y) => x.minutes - y.minutes || x.to.localeCompare(y.to));
  return g;
}

const GRAPH = buildGraph();
const cache = new Map<string, Route>();

/**
 * Deterministic Dijkstra shortest path between rooms over the explicit doorway graph.
 * Ties are broken by room id so the same inputs always give the same route.
 */
export function shortestRoute(
  from: RoomId,
  to: RoomId,
  blocked: ReadonlySet<RoomId> = new Set(),
  graph: Graph = GRAPH,
): Route {
  const key = `${from}>${to}|${[...blocked].sort().join(",")}`;
  if (graph === GRAPH && cache.has(key)) return cache.get(key)!;
  if (from === to) return { minutes: 0, path: [from] };
  const dist = new Map<RoomId, number>();
  const prev = new Map<RoomId, RoomId>();
  const done = new Set<RoomId>();
  for (const id of graph.keys()) dist.set(id, Infinity);
  dist.set(from, 0);
  while (done.size < graph.size) {
    let u: RoomId | null = null;
    for (const [id, d] of dist) {
      if (done.has(id) || d === Infinity) continue;
      if (u === null || d < dist.get(u)! || (d === dist.get(u)! && id.localeCompare(u) < 0)) u = id;
    }
    if (u === null) break;
    if (u === to) break;
    done.add(u);
    for (const { to: v, minutes } of graph.get(u)!) {
      // Closed rooms can be a destination check elsewhere, but never a corridor.
      if (blocked.has(v) && v !== to) continue;
      const nd = dist.get(u)! + minutes;
      if (nd < dist.get(v)!) {
        dist.set(v, nd);
        prev.set(v, u);
      }
    }
  }
  if (dist.get(to) === Infinity) {
    const r = { minutes: Infinity, path: [] as RoomId[] };
    return r;
  }
  const path: RoomId[] = [to];
  let cur = to;
  while (cur !== from) {
    cur = prev.get(cur)!;
    path.unshift(cur);
  }
  const r = { minutes: dist.get(to)!, path };
  if (graph === GRAPH) cache.set(key, r);
  return r;
}

/** Minutes to walk from one stop to the next. Same-room moves use the room's internal estimate. */
export function travelBetween(from: RoomId, to: RoomId, blocked: ReadonlySet<RoomId> = new Set()): Route {
  if (from === to) return { minutes: ROOMS[from].internalMinutes, path: [from] };
  return shortestRoute(from, to, blocked);
}

export function areAdjacent(a: RoomId, b: RoomId): boolean {
  return EDGES.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
}
