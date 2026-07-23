"use client";

import * as React from "react";
import { toast } from "sonner";
import { getEngine } from "@/lib/sim/engine";

/**
 * Hidden presenter mode: pressing "." advances the scripted story
 * (breaking news → chart reacts → trust system responds).
 */
export function PresenterHotkeys() {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ".") return;
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      const t = getEngine().advanceStory();
      toast(t.title, { description: t.body });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
