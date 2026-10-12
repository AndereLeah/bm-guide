"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import type { SuggestedAction } from "@/lib/demo";
import { detailLabel, LANGS, styleLabel, tagList, type Lang } from "@/lib/i18n";
import { postJson, useVisit } from "@/lib/store";
import type { DetailLevel, GuideStyle, TagId } from "@/lib/types";
import {
  addMessage,
  addToPlan,
  completeStop,
  detailFeedback,
  markActionApplied,
  setStyle,
  similarityFeedback,
  skipStop,
  tagFeedback,
  unskip,
  type Message,
  type ResponseSource,
} from "@/lib/visit";
import { changeText } from "./ChangeText";
import { Credit, Notice, ObjectImage, SourceTag, Spinner } from "./ui";

const STYLES: GuideStyle[] = ["approachable", "in-depth", "playful", "family"];

type Explanation = { text: string; source: ResponseSource; notice?: string };
const explanationCache = new Map<string, Explanation>();

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function ListenButton({ text, lang }: { text: string; lang: Lang }) {
  const { t } = useVisit();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined");
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, []);
  useEffect(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setSpeaking(false);
  }, [text]);
  if (supported === null) return null;
  if (!supported) return <span className="text-xs text-muted">{t("g.noAudio")}</span>;
  return (
    <button
      type="button"
      className="btn-ghost min-h-10 px-3 text-sm"
      aria-pressed={speaking}
      onClick={() => {
        try {
          if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
          }
          const u = new SpeechSynthesisUtterance(text);
          u.lang = LANGS.find((l) => l.id === lang)!.speech;
          u.onend = () => setSpeaking(false);
          u.onerror = () => setSpeaking(false);
          window.speechSynthesis.speak(u);
          setSpeaking(true);
        } catch {
          setSupported(false);
        }
      }}
    >
      {speaking ? t("g.stopAudio") : t("g.listen")}
    </button>
  );
}

export function GuideView({ id }: { id: string }) {
  const o = OBJECTS_BY_ID[id];
  const { state, hydrated, update, t, lang } = useVisit();
  const router = useRouter();
  const [exp, setExp] = useState<Explanation | null>(null);
  const [expError, setExpError] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const style: GuideStyle = state.prefs?.style ?? "approachable";
  const detail: DetailLevel = state.feedback.detail;
  const interests: TagId[] = state.prefs ? [...state.prefs.interests, ...state.prefs.derivedTags] : [];
  const conversation = state.conversations[id] ?? [];
  const done = state.completed.length;
  const stopIndex = state.plan?.stops.findIndex((s) => s.objectId === id) ?? -1;
  const stop = stopIndex >= 0 ? state.plan!.stops[stopIndex] : null;
  const completedIndex = state.completed.findIndex((c) => c.objectId === id);
  const completed = completedIndex >= 0;
  const skipped = state.skipped.includes(id);
  const onDisplay = o.display.status === "on-display";
  const totalStops = done + (state.plan?.stops.length ?? 0);

  // Load the tailored explanation whenever object, style, detail, language or mode change.
  useEffect(() => {
    if (!hydrated) return;
    const key = `${id}|${style}|${detail}|${state.aiMode}|${lang}|${interests.join(",")}`;
    const cached = explanationCache.get(key);
    if (cached) {
      setExp(cached);
      return;
    }
    let cancelled = false;
    setExp(null);
    setExpError(false);
    postJson<{ text: string; source: ResponseSource; notice?: string }>("/api/explain", { objectId: id, style, detail, interests, mode: state.aiMode, language: lang })
      .then((r) => {
        const e = { text: r.text, source: r.source, notice: r.notice };
        explanationCache.set(key, e);
        if (!cancelled) setExp(e);
      })
      .catch(() => !cancelled && setExpError(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id, style, detail, state.aiMode, lang, interests.join(",")]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation.length]);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || asking) return;
    setQuestion("");
    setAskError(false);
    const userMsg: Message = { id: uid(), role: "user", text, at: Date.now() };
    update((s) => addMessage(s, id, userMsg));
    setAsking(true);
    try {
      const history = conversation.slice(-10).map((m) => ({ role: m.role, text: m.text, factIds: m.factIds }));
      const r = await postJson<{ answer: string; factIds: string[]; outOfScope: boolean; actions: SuggestedAction[]; source: ResponseSource; notice?: string }>(
        "/api/ask",
        { objectId: id, question: text, history, style, detail, mode: state.aiMode, language: lang },
      );
      update((s) =>
        addMessage(s, id, {
          id: uid(),
          role: "guide",
          text: r.answer,
          factIds: r.factIds,
          at: Date.now(),
          source: r.source,
          notice: r.notice,
          actions: r.actions,
          outOfScope: r.outOfScope,
        }),
      );
    } catch {
      setAskError(true);
    } finally {
      setAsking(false);
    }
  }

  const actionLabel = (a: SuggestedAction) =>
    t(`act.${a.type}`, { obj: o.shortTitle, tags: a.type === "more-tags" || a.type === "less-tags" ? tagList(lang, a.tags) : "" });

  function applyAction(m: Message, a: SuggestedAction) {
    update((s) => {
      let n = s;
      if (a.type === "more-like") n = similarityFeedback(n, id, "more");
      else if (a.type === "less-like") n = similarityFeedback(n, id, "less");
      else if (a.type === "more-detail") n = detailFeedback(n, 1);
      else if (a.type === "less-detail") n = detailFeedback(n, -1);
      else if (a.type === "more-tags" || a.type === "less-tags") n = tagFeedback(n, a.tags, a.type === "more-tags" ? "more" : "less");
      return markActionApplied(n, id, m.id);
    });
    setFlash(t("g.applied"));
  }

  function feedback(kind: "more" | "less" | "detail+" | "detail-") {
    update((s) => (kind === "more" || kind === "less" ? similarityFeedback(s, id, kind) : detailFeedback(s, kind === "detail+" ? 1 : -1)));
    setFlash(t({ more: "g.flashMore", less: "g.flashLess", "detail+": "g.flashDetailUp", "detail-": "g.flashDetailDown" }[kind]));
  }

  function goNext(nextState: typeof state) {
    const next = nextState.plan?.stops[0];
    router.push(next ? `/guide/${encodeURIComponent(next.objectId)}` : "/summary");
  }

  if (!hydrated) return <Spinner label={t("common.loading")} />;
  const room = o.display.roomId ? ROOMS[o.display.roomId] : null;
  const lastChange = state.changes[0];
  const status = completed
    ? `${t("g.seen")} · ${t("m.stopN", { n: completedIndex + 1 })}`
    : skipped
      ? t("g.skipped")
      : stop
        ? stopIndex === 0
          ? t("g.next", { n: done + 1 })
          : t("g.stopOf", { n: done + stopIndex + 1, total: totalStops })
        : t("g.notInPlan");

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm">
        <Link href="/tour" className="btn-ghost -ml-3 min-h-10 px-3">
          {t("g.back")}
        </Link>
        <span className="text-muted">{status}</span>
      </div>

      <div className="card overflow-hidden">
        <ObjectImage o={o} sizes="large" className="h-72 w-full sm:h-96" />
        <div className="space-y-1 px-4 pb-3 pt-2">
          <Credit o={o} />
        </div>
      </div>

      <header className="mt-4">
        <h1 className="text-[28px] font-semibold leading-tight">{o.title}</h1>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">{t("g.date")}</dt>
          <dd>{o.date}</dd>
          {o.culture !== o.date && (
            <>
              <dt className="text-muted">{t("g.culture")}</dt>
              <dd>{o.culture}</dd>
            </>
          )}
          <dt className="text-muted">{t("g.materials")}</dt>
          <dd>{o.materials.join(", ")}</dd>
          <dt className="text-muted">{t("g.number")}</dt>
          <dd>
            {o.museumNumber}
            {o.registrationNumber ? ` (reg. ${o.registrationNumber})` : ""}
          </dd>
          <dt className="text-muted">{t("g.where")}</dt>
          <dd>
            {room ? `${room.name}${o.display.placement ? ` · ${o.display.placement}` : ""}` : t("g.notOnDisplay")}
            <span className="block text-xs text-muted">{t("g.record", { loc: o.display.recordLocation, date: o.verifiedOn })}</span>
          </dd>
        </dl>
        {o.display.note && (
          <div className="mt-2">
            <Notice tone="warn">{o.display.note}</Notice>
          </div>
        )}
      </header>

      {/* Explanation */}
      <section aria-labelledby="exp-h" className="card mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="exp-h" className="text-lg font-semibold">
            {t("g.guide")} <span className="text-sm font-normal text-muted">· {detailLabel(lang, detail)}</span>
          </h2>
          {exp && <ListenButton text={exp.text} lang={exp.source === "live" ? lang : "en"} />}
        </div>
        <div role="radiogroup" aria-label={t("w.styleAria")} className="mt-2 flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={style === s} className="chip min-h-9 px-3 py-1 text-sm" onClick={() => update((st) => setStyle(st, s))} disabled={!state.prefs}>
              {s === "family" ? t("style.short.family") : styleLabel(lang, s)}
            </button>
          ))}
        </div>
        <div className="mt-3 min-h-16" aria-live="polite">
          {exp ? (
            <>
              <p className="whitespace-pre-line text-[16px] leading-relaxed">{exp.text}</p>
              <div className="mt-2">
                <SourceTag source={exp.source} notice={exp.notice} />
              </div>
            </>
          ) : expError ? (
            <Notice tone="warn">{t("g.expError")}</Notice>
          ) : (
            <Spinner label={state.aiMode === "live" ? t("g.loadingLive") : t("g.loading")} />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label={t("g.feedbackAria")}>
          <button type="button" className="btn-secondary" onClick={() => feedback("more")} disabled={!state.prefs}>
            {t("g.more")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => feedback("less")} disabled={!state.prefs}>
            {t("g.less")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => feedback("detail-")} disabled={detail === 1}>
            {t("g.lessDetail")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => feedback("detail+")} disabled={detail === 3}>
            {t("g.moreDetail")}
          </button>
        </div>
        {flash && (
          <div className="mt-3" role="status">
            <Notice tone="change">
              {flash}
              {lastChange?.changed && <span className="block text-xs">{changeText(lastChange, lang, t)}</span>}
            </Notice>
          </div>
        )}
        {!state.prefs && <p className="mt-2 text-xs text-muted">{t("g.needPlan")}</p>}
      </section>

      {/* Progress controls */}
      <section className="mt-4 flex flex-wrap gap-2" aria-label={t("g.progressAria")}>
        {onDisplay && state.prefs && !completed && (
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => {
              const n = completeStop(state, id);
              update(() => n);
              goNext(n);
            }}
          >
            {t("g.complete")}
          </button>
        )}
        {state.prefs && !completed && !skipped && onDisplay && (
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => {
              const n = skipStop(state, id);
              update(() => n);
              goNext(n);
            }}
          >
            {t("g.skip")}
          </button>
        )}
        {state.prefs && skipped && (
          <button type="button" className="btn-secondary" onClick={() => update((s) => unskip(s, id))}>
            {t("g.allow")}
          </button>
        )}
        {state.prefs && onDisplay && !stop && !completed && (
          <button type="button" className="btn-secondary" onClick={() => update((s) => addToPlan(s, id))}>
            {t("g.addPlan")}
          </button>
        )}
        {completed && state.plan?.stops[0] && (
          <Link className="btn-primary flex-1" href={`/guide/${encodeURIComponent(state.plan.stops[0].objectId)}`}>
            {t("g.goNext")}
          </Link>
        )}
      </section>

      {/* Q&A */}
      <section aria-labelledby="qa-h" className="card mt-4 p-4">
        <h2 id="qa-h" className="text-lg font-semibold">
          {t("g.ask")}
        </h2>
        {conversation.length > 0 && (
          <ol ref={listRef} className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto" aria-label={t("g.convAria")} aria-live="polite">
            {conversation.map((m) => (
              <li key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-3 py-2 text-white" : "max-w-[92%] rounded-2xl rounded-tl-sm bg-stone-50 px-3 py-2"}>
                  <p className="text-[15px] leading-relaxed">{m.text}</p>
                  {m.role === "guide" && (
                    <div className="mt-1.5 space-y-1.5">
                      <SourceTag source={m.source} notice={m.notice} />
                      {m.actions && m.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.actions.map((a) => (
                            <button key={a.type} type="button" className="chip min-h-9 px-3 py-1 text-sm" disabled={m.applied || !state.prefs} onClick={() => applyAction(m, a)}>
                              {m.applied ? `✓ ${actionLabel(a)}` : t("g.apply", { label: actionLabel(a) })}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {asking && (
          <div className="mt-3">
            <Spinner label={t("g.thinking")} />
          </div>
        )}
        {askError && (
          <div className="mt-3">
            <Notice tone="warn">{t("g.askError")}</Notice>
          </div>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <label htmlFor="q" className="sr-only">
            {t("g.yourQ")}
          </label>
          <input
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={600}
            placeholder={t("g.askPh")}
            className="min-h-11 min-w-0 flex-1 rounded-full border border-line px-4 text-[15px]"
          />
          <button type="submit" className="btn-primary" disabled={!question.trim() || asking}>
            {t("g.askBtn")}
          </button>
        </form>
      </section>

      <section className="mt-4 text-sm">
        <h2 className="label">{t("g.sources")}</h2>
        <ul className="mt-1 space-y-1">
          {o.sources.map((s) => (
            <li key={s.url}>
              <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted">{t("g.sourcesNote", { date: o.verifiedOn })}</p>
      </section>
    </article>
  );
}
