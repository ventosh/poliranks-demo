"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import {
  BRAND_STORAGE_KEY,
  DEFAULT_BRAND,
  isBrandId,
  type BrandId,
} from "@/lib/brands";

interface BrandContextValue {
  brand: BrandId;
  setBrand: (b: BrandId) => void;
}

const BrandContext = React.createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
  setBrand: () => {},
});

export function useBrand() {
  return React.useContext(BrandContext);
}

function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = React.useState<BrandId>(DEFAULT_BRAND);

  React.useEffect(() => {
    const stored = localStorage.getItem(BRAND_STORAGE_KEY);
    if (isBrandId(stored)) setBrandState(stored);
  }, []);

  const setBrand = React.useCallback((b: BrandId) => {
    setBrandState(b);
    document.documentElement.dataset.brand = b;
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, b);
    } catch {}
  }, []);

  const value = React.useMemo(() => ({ brand, setBrand }), [brand, setBrand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <BrandProvider>{children}</BrandProvider>
    </ThemeProvider>
  );
}
