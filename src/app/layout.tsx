import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Sans_Hebrew,
  IBM_Plex_Mono,
  Heebo,
  Assistant,
  Frank_Ruhl_Libre,
  Roboto_Mono,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { DEFAULT_BRAND, BRAND_STORAGE_KEY } from "@/lib/brands";

const plexHebrew = IBM_Plex_Sans_Hebrew({
  variable: "--font-plex-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});
const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
});
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
});
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoliRanks — מדד דעת הקהל בזמן אמת",
  description: "הבלומברג של דעת הקהל: גרפים חיים של מה שהמדינה חושבת, עכשיו.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** Applies the persisted brand before first paint to avoid a flash. */
const brandInitScript = `try{var b=localStorage.getItem(${JSON.stringify(
  BRAND_STORAGE_KEY
)});if(b&&["terminal-amber","civic-blue","market-mint","editorial-contrast","violet-pulse"].includes(b)){document.documentElement.dataset.brand=b}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-brand={DEFAULT_BRAND}
      suppressHydrationWarning
      className={`${plexHebrew.variable} ${plexMono.variable} ${heebo.variable} ${assistant.variable} ${frankRuhl.variable} ${robotoMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: brandInitScript }} />
        <Providers>
          <DirectionProvider dir="rtl">
            <TooltipProvider>{children}</TooltipProvider>
          </DirectionProvider>
        </Providers>
      </body>
    </html>
  );
}
