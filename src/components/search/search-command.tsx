"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Flag, HelpCircle, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { QUESTIONS } from "@/lib/data/questions";
import { EVENTS } from "@/lib/data/events";
import { POLITICIANS } from "@/lib/data/politicians";

/** Free-text search over questions, politicians, and events (⌘K). */
export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const questionById = new Map(QUESTIONS.map((q) => [q.id, q]));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="חיפוש (⌘K)"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4.5" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="חיפוש"
        description="חיפוש שאלות, נבחרים ואירועים"
      >
        <CommandInput placeholder="חפש שאלה, נבחר ציבור או אירוע..." />
        <CommandList dir="rtl">
          <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
          <CommandGroup heading="שאלות">
            {QUESTIONS.map((q) => (
              <CommandItem
                key={q.slug}
                value={`${q.title} ${q.short} ${q.topic}`}
                onSelect={() => go(`/q/${q.slug}`)}
                className="gap-2"
              >
                <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{q.title}</span>
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                  {q.topic}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="נבחרי ציבור">
            {POLITICIANS.map((p) => (
              <CommandItem
                key={p.slug}
                value={`${p.name} ${p.role} ${p.party}`}
                onSelect={() => go(`/p/${p.slug}`)}
                className="gap-2"
              >
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {p.role} · {p.party}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="אירועים">
            {EVENTS.slice(0, 40).map((e) => {
              const q = questionById.get(e.questionId);
              if (!q) return null;
              return (
                <CommandItem
                  key={e.id}
                  value={`${e.title} ${q.short}`}
                  onSelect={() => go(`/q/${q.slug}`)}
                  className="gap-2"
                >
                  <Flag className="size-4 shrink-0 text-live" />
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                    {q.short}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
