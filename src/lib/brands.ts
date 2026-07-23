export type BrandId =
  | "terminal-amber"
  | "civic-blue"
  | "market-mint"
  | "editorial-contrast"
  | "violet-pulse";

export interface BrandDef {
  id: BrandId;
  /** Hebrew label shown in the selector */
  label: string;
  /** Short vibe line shown in the selector */
  vibe: string;
  /** Swatch color used in the selector UI */
  swatch: string;
}

export const BRANDS: BrandDef[] = [
  {
    id: "terminal-amber",
    label: "טרמינל ענבר",
    vibe: "מורשת בלומברג — תשתית שוק רצינית",
    swatch: "#F5A623",
  },
  {
    id: "civic-blue",
    label: "כחול אזרחי",
    vibe: "אמון מוסדי — יציב ורגוע",
    swatch: "#4D9FFF",
  },
  {
    id: "market-mint",
    label: "מנטה שוקית",
    vibe: "פינטק צרכני מודרני",
    swatch: "#2EE6A8",
  },
  {
    id: "editorial-contrast",
    label: "קונטרסט מערכתי",
    vibe: "סמכות עיתונאית — דפוס פוגש טרמינל",
    swatch: "#E03A4E",
  },
  {
    id: "violet-pulse",
    label: "פולס סגול",
    vibe: "עידן הסוכנים — עתידני",
    swatch: "#A78BFA",
  },
];

export const DEFAULT_BRAND: BrandId = "terminal-amber";
export const BRAND_STORAGE_KEY = "poliranks-brand";

export function isBrandId(v: string | null): v is BrandId {
  return !!v && BRANDS.some((b) => b.id === v);
}
