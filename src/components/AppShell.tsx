"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/community", label: "Community" },
  { href: "/search", label: "Search" },
  { href: "/dashboard", label: "Dashboard" },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClasses = (href: string) => {
    const active = pathname === href;
    return [
      "flex items-center rounded-full px-3 py-1.5 text-sm md:text-base",
      active ? "bg-black text-white" : "hover:bg-zinc-100",
    ].join(" ");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 border-r border-[color:var(--border-subtle)] bg-sidebar px-6 py-8 md:flex md:flex-col md:gap-8">
        <div className="text-base font-semibold tracking-tight">CoLabs</div>

        <nav className="flex flex-1 flex-col gap-4 text-base">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Workspace
          </span>
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col md:hidden">
        <header className="flex items-center justify-between border-b border-[color:var(--border-subtle)] bg-sidebar px-4 py-3">
          <div className="text-sm font-semibold tracking-tight">CoLabs</div>
          <button
            type="button"
            aria-label="Toggle navigation"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black bg-background"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="h-[1px] w-4 bg-black" />
            <span className="mt-[5px] h-[1px] w-4 bg-black" />
            <span className="mt-[5px] h-[1px] w-4 bg-black" />
          </button>
        </header>

        {mobileOpen && (
          <nav className="border-b border-[color:var(--border-subtle)] bg-background px-4 py-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClasses(item.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <main className="flex flex-1 flex-col bg-background">{children}</main>
      </div>

      {/* Main content for desktop */}
      <main className="hidden flex-1 flex-col bg-background md:flex">{children}</main>
    </div>
  );
}

