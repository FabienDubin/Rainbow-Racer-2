import type { Metadata } from "next";
import PrismSheet from "@/components/v3/PrismSheet";
import "../../proto.css";

export const metadata: Metadata = {
  title: "Prism — planche de personnage",
  description: "Prism dans chacun de ses états, en grand, pour juger le personnage.",
};

export default function PrismSheetPage() {
  return <PrismSheet />;
}
