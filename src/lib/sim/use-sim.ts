"use client";

import * as React from "react";
import { getEngine, type SimSnapshot, type SimEngine } from "@/lib/sim/engine";

/**
 * Client-only subscription to the sim engine.
 * Returns null until mounted — render skeletons in that state
 * (this drives the intentional skeleton→live streaming feel).
 */
export function useSim(): { snap: SimSnapshot; engine: SimEngine } | null {
  const [state, setState] = React.useState<{
    snap: SimSnapshot;
    engine: SimEngine;
  } | null>(null);

  React.useEffect(() => {
    const engine = getEngine();
    setState({ snap: engine.getSnapshot(), engine });
    return engine.subscribe(() => {
      setState({ snap: engine.getSnapshot(), engine });
    });
  }, []);

  return state;
}
