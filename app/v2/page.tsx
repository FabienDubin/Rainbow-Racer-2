import type { Metadata } from "next";
import GameShell from "@/components/GameShell";

export const metadata: Metadata = {
  title: "Rainbow Racer V2 — Prism Rush (archive)",
  description: "La version horizontale, gardée comme point de comparaison.",
};

export default function V2Page() {
  return <GameShell />;
}
