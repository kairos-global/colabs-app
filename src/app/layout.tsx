import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "CoLabs – Collaborate with others",
  description: "CoLabs is an app for collaborating with other people in shared work spaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <ClerkProvider>
          <div className="flex min-h-screen bg-background text-foreground">
            <aside className="hidden w-64 border-r border-[color:var(--border-subtle)] bg-sidebar px-6 py-8 md:flex md:flex-col md:gap-8">
              <div className="text-base font-semibold tracking-tight">
                CoLabs
              </div>

              <nav className="flex flex-1 flex-col gap-4 text-base">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Workspace
                </span>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/"
                    className="flex items-center rounded-full px-3 py-1.5 hover:bg-zinc-100"
                  >
                    Home
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center rounded-full px-3 py-1.5 hover:bg-zinc-100"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/community"
                    className="flex items-center rounded-full px-3 py-1.5 hover:bg-zinc-100"
                  >
                    Community
                  </Link>
                  <Link
                    href="/search"
                    className="flex items-center rounded-full px-3 py-1.5 hover:bg-zinc-100"
                  >
                    Search
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center rounded-full px-3 py-1.5 hover:bg-zinc-100"
                  >
                    Dashboard
                  </Link>
                </div>
              </nav>
            </aside>

            <main className="flex flex-1 flex-col bg-background">
              {children}
            </main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
