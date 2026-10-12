import { vi } from "vitest";
import type { ReactNode } from "react";

/** Shared mocks for rendering App Router client pages in jsdom. */
export const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), forward: vi.fn() };
export let pathname = "/";
export function setPath(p: string) {
  pathname = p;
}

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname,
  notFound: () => {
    throw new Error("notFound");
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/** Route fetch() calls from the client straight into the real route handlers (demo mode, no network). */
export async function installApiFetch() {
  const routes: Record<string, (req: Request) => Promise<Response>> = {
    "/api/ask": (await import("@/app/api/ask/route")).POST,
    "/api/explain": (await import("@/app/api/explain/route")).POST,
    "/api/interpret": (await import("@/app/api/interpret/route")).POST,
    "/api/reasons": (await import("@/app/api/reasons/route")).POST,
    "/api/recap": (await import("@/app/api/recap/route")).POST,
  };
  const status = (await import("@/app/api/status/route")).GET;
  const calls: { url: string; body: unknown }[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/status") return status();
    const h = routes[url];
    if (!h) return new Response("not found", { status: 404 });
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    return h(new Request(`http://localhost${url}`, init));
  }) as typeof fetch;
  return calls;
}
