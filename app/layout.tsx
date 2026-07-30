import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "Rainbow Racer — L'Ascension 🦄🌈",
  description:
    "Accroche ton arc-en-ciel aux prismes, balance-toi, lâche au bon moment. Grimpe de l'aube des prairies à la dimension prisme avant que l'orage ne te rattrape. Gratuit, dans ton navigateur.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Rainbow Racer" },
  openGraph: {
    title: "Rainbow Racer — L'Ascension 🦄🌈",
    description: "Bats mon score de la semaine ! Jeu d'ascension gratuit dans le navigateur.",
    images: ["/icon.svg"],
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
