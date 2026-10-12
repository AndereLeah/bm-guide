// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { installApiFetch, router, setPath } from "./setup";
import { AppShell } from "@/components/AppShell";
import { GuideView } from "@/components/GuideView";
import WelcomePage from "@/app/plan/page";
import FrontPage from "@/app/page";
import ItineraryPage from "@/app/itinerary/page";
import TourPage from "@/app/tour/page";
import SummaryPage from "@/app/summary/page";
import { OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { VisitProvider } from "@/lib/store";
import type { VisitState } from "@/lib/visit";

const KEY = "bm-ai-guide-visit-v1";
const saved = (): VisitState => JSON.parse(window.localStorage.getItem(KEY)!);

/** Optional: write a self-contained HTML snapshot (with the built Tailwind CSS) for visual review. */
function snapshot(name: string) {
  const dir = process.env.SNAPSHOT_DIR;
  if (!dir) return;
  const cssDir = path.resolve(".next/static/chunks");
  const css = fs.existsSync(cssDir)
    ? fs
        .readdirSync(cssDir, { recursive: true })
        .map(String)
        .filter((f) => f.endsWith(".css"))
        .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
        .join("\n")
    : "";
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${name}.html`),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="min-h-dvh antialiased">${document.body.innerHTML}</body></html>`,
  );
}

function mount(node: React.ReactNode, p = "/") {
  setPath(p);
  return render(
    <VisitProvider>
      <AppShell>{node}</AppShell>
    </VisitProvider>,
  );
}

let downloads: string[] = [];
beforeAll(async () => {
  window.localStorage.clear();
  await installApiFetch();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  // Capture downloaded files.
  URL.createObjectURL = vi.fn((b: Blob) => {
    (b as Blob).text().then((t) => downloads.push(t));
    return "blob:test";
  });
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
});
afterEach(() => cleanup());

describe("full visitor workflow (demo mode, no credentials)", () => {
  it("0. front page: photo, plan button, and the title links home", async () => {
    mount(<FrontPage />);
    expect(screen.getByRole("img", { name: /front of the British Museum/ })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Plan my visit" })[0].getAttribute("href")).toBe("/plan");
    expect(screen.getByText(/CC BY-SA 3.0/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /front page/ }).getAttribute("href")).toBe("/");
    snapshot("00-front");
  });

  it("1. preferences chat → plan my visit", async () => {
    mount(<WelcomePage />, "/plan");
    expect(await screen.findByText(/how much time do you have/i)).toBeTruthy();
    expect(screen.getByRole("switch").textContent).toMatch(/Demo mode/);
    fireEvent.click(screen.getByRole("radio", { name: "45 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // Interests
    fireEvent.click(screen.getByRole("button", { name: "Ancient Egypt" }));
    fireEvent.click(screen.getByRole("button", { name: "Animals" }));
    fireEvent.change(screen.getByPlaceholderText(/I love cats/), { target: { value: "I love cats and secret codes" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // Style
    fireEvent.click(screen.getByRole("radio", { name: /Playful/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // Must-see: search and add the Horse of Selene (Room 18)
    fireEvent.change(screen.getByPlaceholderText(/Rosetta, cat/), { target: { value: "selene" } });
    fireEvent.click(await screen.findByRole("button", { name: /Horse of Selene/ }));
    expect(screen.getByRole("button", { name: /Remove Horse of Selene/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    snapshot("01-welcome");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Plan my visit" }));
    });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/itinerary"));
    const s = saved();
    expect(s.prefs!.minutes).toBe(45);
    expect(s.prefs!.style).toBe("playful");
    expect(s.prefs!.derivedTags).toEqual(expect.arrayContaining(["animals", "writing"]));
    expect(s.prefs!.derivedObjectIds).toContain("Y_EA64391");
    expect(s.plan!.stops.map((x) => x.objectId)).toContain("G_1816-0610-98");
    expect(s.plan!.totalMinutes).toBeLessThanOrEqual(45);
  });

  it("1b. re-planning starts a new preferences chat instead of editing old answers", async () => {
    mount(<WelcomePage />);
    expect(await screen.findByRole("heading", { name: "Your current plan" })).toBeTruthy();
    expect(screen.queryByText(/how much time do you have/i)).toBeNull(); // no prefilled chat
    const before = saved();
    fireEvent.click(screen.getByRole("button", { name: "Re-plan with a new chat" }));
    expect(await screen.findByText(/how much time do you have/i)).toBeTruthy();
    expect(screen.getByText(/New chat started/)).toBeTruthy();
    expect(screen.getByRole("radio", { name: "1 hour" }).getAttribute("aria-checked")).toBe("true"); // fresh defaults
    // "Keep current plan" returns to the summary without changing anything.
    fireEvent.click(screen.getByRole("button", { name: "Keep current plan" }));
    expect(screen.getByRole("heading", { name: "Your current plan" })).toBeTruthy();
    expect(saved().prefs).toEqual(before.prefs);
    // New chat → quick answers → re-plan.
    fireEvent.click(screen.getByRole("button", { name: "Re-plan with a new chat" }));
    fireEvent.click(screen.getByRole("radio", { name: "45 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Ancient Egypt" }));
    fireEvent.click(screen.getByRole("button", { name: "Animals" }));
    fireEvent.change(screen.getByPlaceholderText(/I love cats/), { target: { value: "I love cats and secret codes" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("radio", { name: /Playful/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByPlaceholderText(/Rosetta, cat/), { target: { value: "selene" } });
    fireEvent.click(await screen.findByRole("button", { name: /Horse of Selene/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Re-plan my visit" }));
    });
    await waitFor(() => expect(router.push).toHaveBeenLastCalledWith("/itinerary"));
    expect(saved().prefs!.style).toBe("playful");
  });

  it("2. itinerary survives a refresh and downloads the current plan", async () => {
    mount(<ItineraryPage />, "/itinerary");
    expect(await screen.findByRole("heading", { name: /personalised itinerary/i })).toBeTruthy();
    const list = screen.getByRole("list", { name: "Itinerary stops" });
    const s = saved();
    expect(within(list).getAllByRole("listitem")).toHaveLength(s.plan!.stops.length);
    expect(screen.getAllByText(/Gayer-Anderson Cat/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Must-see/).length).toBeGreaterThan(0);
    snapshot("02-itinerary");
    downloads = [];
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => expect(downloads.length).toBe(1));
    for (const st of s.plan!.stops) expect(downloads[0]).toContain(OBJECTS_BY_ID[st.objectId].title);

    // Regenerate changes the selection and explains it.
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(await screen.findByText(/Regenerated/)).toBeTruthy();
    // Start tour → first stop's guide
    fireEvent.click(screen.getByRole("button", { name: /Start tour/ }));
    expect(router.push).toHaveBeenLastCalledWith(`/guide/${encodeURIComponent(saved().plan!.stops[0].objectId)}`);
    expect(saved().started).toBe(true);
  });

  it("3. object guide: tailored explanation, detail feedback, Q&A with context, complete", async () => {
    const id = "Y_EA64391";
    mount(<GuideView id={id} />, `/guide/${id}`);
    expect(await screen.findByRole("heading", { name: "The Gayer-Anderson Cat" })).toBeTruthy();
    const playful = await screen.findByText(/Quick challenge/);
    expect(screen.getAllByText(/Demo response · rule-based/).length).toBeGreaterThan(0);
    const before = playful.textContent!.length;

    // Less detail → shorter explanation
    fireEvent.click(screen.getByRole("button", { name: "Less detail" }));
    await waitFor(() => expect(screen.getByText(/Quick challenge/).textContent!.length).toBeLessThan(before));
    expect(screen.getByText(/Less detail: explanation shortened/)).toBeTruthy();
    expect(saved().feedback.detail).toBe(1);

    // Switch style → different framing
    fireEvent.click(screen.getByRole("radio", { name: "In-depth" }));
    expect(await screen.findByText(/Museum number EA64391/)).toBeTruthy();

    // Ask with an example chip, then a free-text follow-up
    expect(screen.queryByRole("button", { name: "What should I look for?" })).toBeNull(); // no example chips
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "What should I look for?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/gold earrings/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Who made it?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/doesn't name a maker for the Gayer-Anderson Cat/)).toBeTruthy();

    // Feedback inside the chat proposes an action that changes the tour
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "I'm bored of war and battles" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    const apply = await screen.findByRole("button", { name: /Apply: Fewer stops about War & hunting/ });
    fireEvent.click(apply);
    expect(saved().feedback.tagWeights.conflict).toBeLessThan(0);
    expect(await screen.findByRole("button", { name: /✓ Fewer stops about War/ })).toBeTruthy();
    snapshot("03-guide");

    // Conversation history persists and is sent with the next question
    expect(saved().conversations[id].filter((m) => m.role === "user")).toHaveLength(3);

    // Complete and continue
    fireEvent.click(screen.getByRole("button", { name: "Complete and continue" }));
    const s = saved();
    expect(s.completed.map((c) => c.objectId)).toContain(id);
    expect(router.push).toHaveBeenLastCalledWith(s.plan!.stops[0] ? `/guide/${encodeURIComponent(s.plan!.stops[0].objectId)}` : "/summary");
  });

  it("4. skip advances without completing; more-like-this changes recommendations", async () => {
    const next = saved().plan!.stops[0].objectId;
    mount(<GuideView id={next} />, `/guide/${next}`);
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    let s = saved();
    expect(s.skipped).toContain(next);
    expect(s.completed.map((c) => c.objectId)).not.toContain(next);
    expect(s.plan!.stops.map((x) => x.objectId)).not.toContain(next);
    cleanup();

    // Like an Assyrian object seen off-plan → Assyrian objects enter the plan.
    const hunt = "W_1856-0909-15";
    mount(<GuideView id={hunt} />, `/guide/${hunt}`);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Not in your plan")).toBeTruthy();
    const beforeIds = saved().plan!.stops.map((x) => x.objectId);
    fireEvent.click(screen.getByRole("button", { name: /More like this/ }));
    s = saved();
    expect(s.plan!.stops.map((x) => x.objectId)).not.toEqual(beforeIds);
    expect(s.plan!.stops.some((x) => OBJECTS_BY_ID[x.objectId].tags.includes("mesopotamia"))).toBe(true);
    expect(screen.getAllByText(/More like Royal lion hunt/).length).toBeGreaterThan(0);
  });

  it("5. tour & map: progress, remaining-time changes, room selection opens stops", async () => {
    mount(<TourPage />, "/tour");
    expect(await screen.findByRole("heading", { name: "Tour & map" })).toBeTruthy();
    expect(screen.getByRole("progressbar")).toBeTruthy();
    const s0 = saved();
    expect(screen.getByText(/Tour updated:/)).toBeTruthy();
    // Completion alone is not reported as a change ("Completed X. Removed: X").
    expect(screen.queryByText(/Removed: Gayer-Anderson Cat/)).toBeNull();

    // Reduce time → fewer stops and an explanation
    fireEvent.click(screen.getByRole("button", { name: "−10" }));
    const s1 = saved();
    expect(s1.remainingMinutes).toBe(s0.remainingMinutes - 10);
    expect(s1.plan!.totalMinutes).toBeLessThanOrEqual(s1.remainingMinutes);
    expect(screen.getByText(/Remaining time reduced to/)).toBeTruthy();
    // Set an exact value
    fireEvent.change(screen.getByLabelText("Minutes left"), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Set" }));
    expect(saved().remainingMinutes).toBe(60);
    expect(screen.getByText(/Remaining time increased to 60 min/)).toBeTruthy();

    // Map: stop numbers continue after completed stops (the completed one keeps number 1).
    const st = saved();
    const done = st.completed.length;
    const first = st.plan!.stops[0];
    expect(screen.getByRole("button", { name: `Stop 1: ${OBJECTS_BY_ID[st.completed[0].objectId].shortTitle} (Completed)` })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Stop ${done + 1}: ${OBJECTS_BY_ID[first.objectId].shortTitle}` }));
    expect(screen.getByRole("link", { name: "Open guide" }).getAttribute("href")).toBe(`/guide/${encodeURIComponent(first.objectId)}`);
    // Step through the route.
    fireEvent.click(screen.getByRole("button", { name: "Next stop" }));
    const second = st.plan!.stops[1];
    expect(screen.getByRole("link", { name: "Open guide" }).getAttribute("href")).toBe(`/guide/${encodeURIComponent(second.objectId)}`);
    // Zoom controls.
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByRole("button", { name: "Reset view" })).toBeTruthy();
    // Select a room → its stops are listed and link to the guide.
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${ROOMS[first.roomId].name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`) }));
    expect(await screen.findByRole("heading", { name: ROOMS[first.roomId].name })).toBeTruthy();
    // Completed and skipped sections are shown
    expect(screen.getByText(/Skipped \(left out of re-planning\)/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Allow again" })).toBeTruthy();
    snapshot("04-tour");
  });

  it("6. summary: recap, download, start over", async () => {
    mount(<SummaryPage />, "/summary");
    expect(await screen.findByRole("heading", { name: "Your visit" })).toBeTruthy();
    expect(await screen.findByText(/you saw 1 object/)).toBeTruthy();
    downloads = [];
    fireEvent.click(screen.getByRole("button", { name: "Download summary" }));
    await waitFor(() => expect(downloads.length).toBe(1));
    expect(downloads[0]).toContain("The Gayer-Anderson Cat");
    expect(downloads[0]).toContain("“Who made it?”");
    snapshot("05-summary");
    fireEvent.click(screen.getByRole("button", { name: "Start a new visit" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, start over" }));
    await waitFor(() => expect(saved().prefs).toBeNull());
    expect(router.push).toHaveBeenLastCalledWith("/plan");
  });

  it("7. language selection translates the interface and is sent to the AI routes", async () => {
    const calls = await installApiFetch();
    mount(<WelcomePage />);
    await screen.findByText(/how much time do you have/i);
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "zh" } });
    expect(await screen.findByText("规划一次适合你的参观")).toBeTruthy();
    expect(screen.getAllByText("导览与地图").length).toBeGreaterThan(0);
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(screen.getByText(/演示模式下展品文字为英文/)).toBeTruthy();
    expect(saved().language).toBe("zh");
    cleanup();
    mount(<GuideView id="Y_EA24" />, "/guide/Y_EA24");
    expect(await screen.findByRole("heading", { name: "关于这件展品提问" })).toBeTruthy();
    await waitFor(() => expect(calls.some((c) => c.url === "/api/explain" && (c.body as { language: string }).language === "zh")).toBe(true));
    snapshot("06-zh-guide");
    // Back to English for the remaining tests.
    fireEvent.change(screen.getByLabelText("语言"), { target: { value: "en" } });
    expect(await screen.findByRole("heading", { name: "Ask about this object" })).toBeTruthy();
  });

  it("8. empty states render helpful actions", async () => {
    mount(<TourPage />, "/tour");
    expect(await screen.findByText("No tour yet")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Set preferences" }).getAttribute("href")).toBe("/plan");
  });
});
