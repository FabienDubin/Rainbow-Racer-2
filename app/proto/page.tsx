import type { Metadata } from "next";
import ProtoShell from "@/components/v3/ProtoShell";
import "./proto.css";

export const metadata: Metadata = {
  title: "Phase 0 — L'Arc",
  description: "Prototype du verbe central de Rainbow Racer V3.",
};

export default function ProtoPage() {
  return <ProtoShell />;
}
