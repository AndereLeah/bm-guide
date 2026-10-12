"use client";

import { OBJECTS_BY_ID } from "@/data/objects";
import { listJoin, renderCode } from "@/lib/i18n";
import { useVisit } from "@/lib/store";
import type { ChangeNote } from "@/lib/visit";

/** Localised "what changed" line: cause + added/removed objects. */
export function changeText(note: ChangeNote, lang: Parameters<typeof renderCode>[0], t: (k: string, v?: Record<string, string | number>) => string): string {
  const name = (id: string) => OBJECTS_BY_ID[id]?.shortTitle ?? id;
  const parts = [note.cause ? renderCode(lang, note.cause) : note.message];
  if (note.added.length) parts.push(t("change.addedList", { list: listJoin(lang, note.added.map(name)) }));
  if (note.removed.length) parts.push(t("change.removedList", { list: listJoin(lang, note.removed.map(name)) }));
  if (!note.added.length && !note.removed.length && note.cause && note.cause.k !== "change.regenSame") parts.push(t("change.same"));
  return parts.join(" ");
}

export function ChangeText({ note }: { note: ChangeNote }) {
  const { lang, t } = useVisit();
  return <>{changeText(note, lang, t)}</>;
}
