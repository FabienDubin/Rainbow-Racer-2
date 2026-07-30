import type { Metadata } from "next";
import ProtoShell from "@/components/v3/ProtoShell";
import "./proto.css";

export const metadata: Metadata = {
  title: "Phase 1 — L'Ascension",
  description: "Prototype jouable de Rainbow Racer V3 : l'Arc, les paliers, les éclairs.",
};

export default function ProtoPage() {
  return <ProtoShell />;
}
