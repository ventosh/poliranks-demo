"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { BrandSelector } from "@/components/brand/brand-selector";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { SearchCommand } from "@/components/search/search-command";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/", label: "הבורסה" },
  { href: "/feed", label: "הפיד" },
  { href: "/politicians", label: "פוליטיקאים" },
  { href: "/dashboard", label: "הדשבורד שלי" },
  { href: "/admin", label: "חדר עריכה" },
] as const;

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-live/30 bg-live/10 px-2.5 py-0.5 text-[11px] font-semibold text-live">
      <span className="live-dot size-1.5 rounded-full bg-live" />
      שידור חי
    </span>
  );
}

export function AppHeader({ ticker }: { ticker?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <LiveBadge />
        <nav className="ms-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/q/")
                : item.href === "/politicians"
                  ? pathname.startsWith("/politicians") || pathname.startsWith("/p/")
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <Link
            href="/onboarding"
            className="me-1 hidden rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:block"
          >
            הצטרפות
          </Link>
          <SearchCommand />
          <BrandSelector />
          <ThemeToggle />
        </div>
      </div>
      {ticker}
    </header>
  );
}
