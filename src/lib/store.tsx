"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isLang, LANGS, makeT, type Lang, type T } from "./i18n";
import { emptyVisit, isVisitState, type AiMode, type VisitState } from "./visit";

const KEY = "bm-ai-guide-visit-v1";

interface AiStatus {
  live: boolean;
  provider: string | null;
  model: string | null;
  checked: boolean;
}

interface Ctx {
  state: VisitState;
  hydrated: boolean;
  storageOk: boolean;
  ai: AiStatus;
  update: (fn: (s: VisitState) => VisitState) => void;
  setMode: (m: AiMode) => void;
  setLang: (l: Lang) => void;
  reset: () => void;
  lang: Lang;
  t: T;
}

const VisitContext = createContext<Ctx | null>(null);

export function VisitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisitState>(() => emptyVisit());
  const [hydrated, setHydrated] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [ai, setAi] = useState<AiStatus>({ live: false, provider: null, model: null, checked: false });
  const loadedMode = useRef<AiMode | null>(null);

  // Load persisted visit once on the client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isVisitState(parsed)) {
          setState(parsed);
          loadedMode.current = parsed.aiMode;
        }
      }
    } catch {
      setStorageOk(false);
    }
    setHydrated(true);
  }, []);

  // Ask the server whether live AI is configured.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("status failed"))))
      .then((d: Omit<AiStatus, "checked">) => {
        if (cancelled) return;
        setAi({ ...d, checked: true });
        // First visit with a configured model → default to live; respect a stored choice otherwise.
        if (loadedMode.current === null) setState((s) => ({ ...s, aiMode: d.live ? "live" : "demo" }));
        else if (!d.live) setState((s) => ({ ...s, aiMode: "demo" }));
      })
      .catch(() => !cancelled && setAi({ live: false, provider: null, model: null, checked: true }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setStorageOk(false);
    }
  }, [state, hydrated]);

  const update = useCallback((fn: (s: VisitState) => VisitState) => setState((s) => fn(s)), []);
  const setMode = useCallback((m: AiMode) => setState((s) => ({ ...s, aiMode: m })), []);
  const setLang = useCallback((l: Lang) => setState((s) => ({ ...s, language: l })), []);
  const reset = useCallback(() => setState((s) => ({ ...emptyVisit(s.aiMode), language: s.language })), []);
  const lang: Lang = isLang(state.language) ? state.language : "en";
  const t = useMemo(() => makeT(lang), [lang]);

  useEffect(() => {
    document.documentElement.lang = LANGS.find((x) => x.id === lang)!.htmlLang;
  }, [lang]);

  const value = useMemo(
    () => ({ state, hydrated, storageOk, ai, update, setMode, setLang, reset, lang, t }),
    [state, hydrated, storageOk, ai, update, setMode, setLang, reset, lang, t],
  );
  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit(): Ctx {
  const c = useContext(VisitContext);
  if (!c) throw new Error("useVisit must be used inside VisitProvider");
  return c;
}

/** POST JSON helper with error handling. */
export async function postJson<T>(url: string, body: unknown, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}
