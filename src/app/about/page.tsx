import type { Metadata } from "next";
import { DATA_VERIFIED_ON, OBJECTS } from "@/data/objects";
import { EDGES, LOCATION_VERIFIED_ON, MAP_EDITION, OFFICIAL_MAP_URL, ROOMS, ROOM_IDS, VISIT_PAGE_URL } from "@/data/rooms";

export const metadata: Metadata = { title: "Sources, permissions & limitations – Museum Companion" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-[15px] leading-relaxed">
      <header>
        <h1 className="text-3xl font-semibold">Sources, permissions &amp; limitations</h1>
        <p className="mt-2 text-muted">
          Museum Companion is an independent, non-commercial educational prototype (Stanford MS&amp;E 203). It is not affiliated with, approved or endorsed by the British
          Museum.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">How content is used</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <strong>Object images</strong> are loaded from the Museum&apos;s Collection online media server at preview size (≤750px). Each image&apos;s own “Use this image”
            page was checked for the statement that it may be shared under{" "}
            <a className="underline" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
              CC BY-NC-SA 4.0
            </a>{" "}
            with the credit “© The Trustees of the British Museum”. One image without a confirmed licence page is not shown; a placeholder is used instead.
          </li>
          <li>
            <strong>Object text</strong>: Collection online records are not marked with a Creative Commons logo, so this app does not copy them. Summaries and facts are
            original paraphrases grounded in the records and gallery pages, with links back to every source. Factual data (museum numbers, dates, materials) is reproduced.
          </li>
          <li>
            <strong>Map graphics</strong>: the official map is not reproduced. The gallery schematic is an original simplified diagram; only the doorway connections were read
            from the official {MAP_EDITION} (
            <a className="underline" href={OFFICIAL_MAP_URL}>
              museum map
            </a>
            ).
          </li>
          <li>
            The British Museum&apos;s name is used only to identify the subject. No logo or branding is used.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">AI and demo mode</h2>
        <p className="mt-2">
          In <strong>live AI</strong> mode a language model (server-side; the key never reaches the browser) interprets free-text interests, phrases why each stop was chosen,
          tailors explanations, answers questions, interprets feedback and writes the recap. It receives only the curated source record for the object, is told to refuse
          anything not in it, and its output is schema-validated. Any object id it returns that is not in the dataset is discarded. If the model fails or returns invalid output
          the app shows a labelled demo response. Route selection and timing are always computed by deterministic code, never by the model.
        </p>
        <p className="mt-2">
          <strong>Demo mode</strong> works without credentials and uses rule-based keyword matching and templated, context-specific responses built from the same facts. Every
          response is labelled with its source.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Galleries and connections (verified {LOCATION_VERIFIED_ON})</h2>
        <p className="mt-1 text-sm text-muted">
          Availability checked against the{" "}
          <a className="underline" href={VISIT_PAGE_URL}>
            Visit page
          </a>{" "}
          (list of available galleries and planned closures) and the map footnote. Display status of each object is checked separately against its own record.
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1.5 pr-3">Room</th>
                <th className="py-1.5 pr-3">Hours / closures</th>
              </tr>
            </thead>
            <tbody>
              {ROOM_IDS.map((id) => {
                const r = ROOMS[id];
                return (
                  <tr key={id} className="border-b border-line/60 align-top">
                    <td className="py-1.5 pr-3">
                      <a className="underline" href={r.galleryUrl}>
                        {r.name}
                      </a>
                    </td>
                    <td className="py-1.5 pr-3">
                      {r.availability.restrictedHours ? `Listed open ${r.availability.restrictedHours.open}–${r.availability.restrictedHours.close} (map footnote; gallery page says 10.00–17.00). ` : "Museum hours. "}
                      {r.availability.plannedClosures.map((c) => `${c.partial ? "Partial closure" : "Closed"} ${c.from} – ${c.to}. `).join("")}
                      {r.availability.note ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <h3 className="mt-4 font-semibold">Walkable connections used for routing</h3>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {EDGES.map((e) => (
            <li key={`${e.a}-${e.b}`}>
              {ROOMS[e.a].shortName} ↔ {ROOMS[e.b].shortName}: ~{e.minutes} min. {e.note}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted">Consecutive room numbers are not assumed to connect. Travel times are estimates, not measurements.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Object dataset (verified {DATA_VERIFIED_ON})</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1.5 pr-3">Object</th>
                <th className="py-1.5 pr-3">Record location</th>
                <th className="py-1.5">Image</th>
              </tr>
            </thead>
            <tbody>
              {OBJECTS.map((o) => (
                <tr key={o.id} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-3">
                    <a className="underline" href={o.sources[0].url}>
                      {o.shortTitle}
                    </a>{" "}
                    <span className="text-muted">({o.museumNumber})</span>
                  </td>
                  <td className="py-1.5 pr-3">{o.display.recordLocation}</td>
                  <td className="py-1.5">{o.image.usePermitted ? "CC BY-NC-SA 4.0" : "Not shown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-muted">Objects recorded as “Not on display” are kept to demonstrate status checking and are never planned.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Limitations</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Small dataset: {OBJECTS.filter((o) => o.display.status === "on-display").length} objects across 12 ground-floor spaces. Display status and closures can change at short notice.</li>
          <li>No live indoor positioning, crowding or real-time opening data. Exact object positions within rooms are not known beyond the record&apos;s case/bay text.</li>
          <li>Time used is planned time (walking + viewing estimates), not a live clock.</li>
          <li>Audio uses the browser&apos;s built-in speech synthesis where available.</li>
          <li>AI answers are restricted to curated facts but can still be imperfect; verify important details with the Museum.</li>
        </ul>
      </section>
    </div>
  );
}
