import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  // metadataBase makes every og:image and canonical URL absolute. Without it a shared link
  // resolves the card against localhost and previews with nothing.
  metadataBase: new URL("https://rainbow-racer.themarcelle.com"),
  title: "Rainbow Racer — L'Ascension 🦄🌈",
  description:
    "Accroche ton arc-en-ciel aux prismes, balance-toi, lâche au bon moment. Grimpe de l'aube des prairies à la dimension prisme avant que l'orage ne te rattrape. Gratuit, sans installation, dans ton navigateur.",
  applicationName: "Rainbow Racer",
  authors: [{ name: "Fabien Dubin", url: "https://github.com/FabienDubin" }],
  keywords: ["jeu", "arcade", "grappin", "arc-en-ciel", "licorne", "classement", "mobile"],
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Rainbow Racer" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Rainbow Racer",
    title: "Rainbow Racer — L'Ascension 🦄🌈",
    description:
      "Grimpe le plus haut possible avant que l'orage ne te rattrape. Bats mon score de la semaine !",
    // No `images` here on purpose: app/opengraph-image.tsx generates a real 1200x630 PNG and
    // Next wires it automatically. It used to point at /icon.svg, and LinkedIn, Slack and
    // iMessage all refuse SVG — the link previewed with no image at all.
  },
  twitter: {
    card: "summary_large_image",
    title: "Rainbow Racer — L'Ascension 🦄🌈",
    description: "Grimpe avant l'orage. Bats mon score de la semaine !",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0b1c",
  // The play area must be able to reach under the notch and the home indicator
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={baloo.className}>{children}</body>
    </html>
  );
}
