import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "Rainbow Racer — Prism Rush 🦄🌈",
  description:
    "Vole avec Prism la licorne, enchaîne les combos, déclenche des Rainbow Rush et grimpe au classement mondial. Jeu gratuit, direct dans ton navigateur.",
  openGraph: {
    title: "Rainbow Racer — Prism Rush 🦄🌈",
    description: "Bats mon record ! Jeu de vol arcade gratuit dans le navigateur.",
    images: ["/img/Logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
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
