import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { VisitProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Museum Companion – AI guide prototype for the British Museum",
  description:
    "An independent educational prototype that plans a personalised, time-bounded route through British Museum ground-floor galleries and answers questions using curated source material.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f4d45" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-dvh antialiased">
        <VisitProvider>
          <AppShell>{children}</AppShell>
        </VisitProvider>
      </body>
    </html>
  );
}
