"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Infinity as InfinityIcon,
  LayoutDashboard,
  Newspaper,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "הבורסה", icon: Activity },
  { href: "/feed", label: "הפיד", icon: InfinityIcon },
  { href: "/politicians", label: "נבחרים", icon: Users },
  { href: "/dashboard", label: "שלי", icon: LayoutDashboard },
  { href: "/admin", label: "עריכה", icon: Newspaper },
] as const;

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/q/")
              : tab.href === "/politicians"
                ? pathname.startsWith("/politicians") || pathname.startsWith("/p/")
                : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
