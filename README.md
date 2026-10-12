# Museum Companion

**An AI museum guide prototype for the British Museum's ground floor.**

Tell it how much time you have and what you're curious about. It plans a walkable route, explains each object in the style you like, answers your questions, and adjusts the rest of the tour as you give feedback.

> Independent educational prototype (Stanford MS&E 203). Not affiliated with, approved or endorsed by the British Museum.

---

## What it does

0. **Front page** – a welcome page with a photo of the Museum; the *Museum Companion* title in the header always returns here.
1. **Plan** – a short chat asks for your time, interests, guide style and must-see objects.
2. **Itinerary** – an ordered list of stops with photos, rooms, walking/viewing times and *why each stop suits you*.
3. **Object guide** – a tailored explanation (Approachable · In-depth · Playful · Family), a Listen button, and a chat for questions.
4. **Adapt** – *More / Less like this*, *More / Less detail*, *Skip*, *Complete*, or change your remaining time — the tour re-plans and tells you what changed.
5. **Tour & map** – an interactive gallery map with your numbered route; tap a stop or a room.
6. **Summary** – a recap of what you saw, downloadable.

Also: 4 languages (English, 中文, Español, Français), works on phones, and your visit survives a page refresh.

**Two modes**

| | Demo mode | Live AI |
|---|---|---|
| Needs an API key? | No | Yes (server-side only) |
| Explanations & answers | Rule-based, from curated facts | Written by an LLM, restricted to the same curated facts |
| Route planning | Same deterministic planner in both modes | |

Every response is labelled *Demo* or *Live AI*. If the AI fails or runs out of budget, the app falls back to Demo automatically.

---

## Quick start

Requires **Node.js 20.9+** (22 recommended).

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. It runs in Demo mode with no setup.

### Turn on Live AI (Stanford AI API Gateway)

1. Copy the template and add your key:
   ```bash
   cp .env.example .env.local
   ```
   ```
   STANFORD_AI_API_KEY=your-key-from-the-secure-email
   STANFORD_AI_MODEL=claude-haiku-4-5
   ```
   `.env.local` is git-ignored — never commit it or paste the key anywhere else.
2. Check the key: `npm run check:ai` (lists the models on your key and sends one tiny test request).
3. Restart `npm run dev` and switch the header toggle to **Live AI**.

Other providers also work: `ANTHROPIC_API_KEY` or any OpenAI-compatible `OPENAI_API_KEY` (see `.env.example`).

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally |
| `npm test` | Run the 95 automated tests |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Production build / server |
| `npm run check:ai` | Verify the AI key and model (never prints the key) |

---

## Costs and usage limits

A 60-minute visit in Live AI mode uses about **31 requests ≈ 39k input + 6k output tokens** — roughly **$0.07** with `claude-haiku-4-5` at list price (Stanford's discounted rates are lower).

- **Hard limit:** the *maximum monthly budget* set on your Stanford gateway key. When reached, the key stops until its 30-day reset.
- **Soft limit (optional):** add `AI_DAILY_REQUEST_LIMIT` and/or `AI_DAILY_TOKEN_LIMIT` to `.env.local` (or your host's environment variables).
- **Check usage:** open `/api/status` for this server's counts; official spend is in UIT's *Retrieve Usage by API Key* guide and the UIT Billing Dashboard.

Suggested for a class prototype: **$10–20/month** budget, ~**300** requests/day.

---

## Codebase overview

```
bm-guide/
├── src/
│   ├── app/                 Pages (Next.js App Router) and API routes
│   │   ├── page.tsx         Front page
│   │   ├── plan/            Preferences chat
│   │   ├── itinerary/       Personalised itinerary
│   │   ├── guide/[id]/      Object guide + Q&A
│   │   ├── tour/            Progress, time controls, map
│   │   ├── summary/         Recap + download
│   │   ├── about/           Sources, permissions, limitations
│   │   └── api/             Server routes: status, interpret, reasons, explain, ask, recap
│   ├── components/          UI pieces: AppShell (header/nav), GuideView, GalleryMap, StopCard …
│   ├── data/
│   │   ├── objects.ts       34 curated objects (30 on display) with sources and image licences
│   │   └── rooms.ts         12 rooms, opening hours, closures, doorway connections
│   └── lib/
│       ├── planner.ts       Picks and orders stops within your time budget
│       ├── routing.ts       Shortest walking routes between rooms
│       ├── availability.ts  Museum hours, restricted rooms, planned closures
│       ├── visit.ts         Visit state changes: complete, skip, feedback, re-plan
│       ├── ai.ts / llm.ts   AI prompts, provider calls, validation, fallbacks, usage limits
│       ├── demo.ts          Demo-mode explanations and answers
│       ├── i18n.ts          Translations
│       ├── store.tsx        App state, saved in the browser
│       └── export.ts        Itinerary / summary downloads
├── tests/                   Planner, routing, re-planning, AI and full-workflow tests
├── scripts/check-ai.mjs     AI key check
└── .env.example             Template for environment variables
```

**How it fits together:** the planner and routing are plain, deterministic code — the AI never decides the route or timing. The AI (when on) only interprets free text, writes explanations and answers, phrases "why this stop", and writes the recap, using only the curated facts for each object. Its output is validated, and anything invalid falls back to Demo.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zod and Vitest. No database or accounts.

---

## Data, sources and permissions

- **Objects** – checked against each object's [British Museum Collection online](https://www.britishmuseum.org/collection) record on 12 Oct 2026 (number, date, materials, display location). Objects recorded as *not on display* are never planned.
- **Rooms & routes** – doorways read from the [official Museum map](https://www.britishmuseum.org/visit/museum-map); opening hours and planned closures from the [Visit page](https://www.britishmuseum.org/visit). Walking times are estimates.
- **Images** – shown only where the image's own page confirms **CC BY-NC-SA 4.0**, with the credit *© The Trustees of the British Museum*; otherwise a placeholder.
- **Front-page photo** – [“British Museum from NE”](https://commons.wikimedia.org/wiki/File:British_Museum_from_NE_2.JPG) by Ham, Wikimedia Commons, CC BY-SA 3.0 (credited on the page).
- **Text** – original paraphrases (record text isn't openly licensed). The map is an original schematic, not the official map.

Full details are on the in-app **About** page (`/about`).

---

## Limitations

- Small dataset (30 objects, 12 ground-floor spaces); display status and closures can change — re-check before real use.
- No live positioning; times are planned estimates, not a live clock.
- In Demo mode, object texts are English only.
- AI answers are restricted to curated facts but can still be imperfect.

To update museum data, edit `src/data/objects.ts` or `src/data/rooms.ts` and run `npm test`.
