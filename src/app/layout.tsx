import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/great-vibes/400.css";
import "@/styles/tokens.css";
import "@/styles/ui.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Lavena | Saboaria Artesanal — ${SITE_TAGLINE}`, template: "%s | Lavena" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `Lavena | Saboaria Artesanal`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Lavena", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fbf8f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
