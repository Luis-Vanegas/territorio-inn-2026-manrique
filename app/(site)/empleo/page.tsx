import type { Metadata } from "next";
import { EmpleoModulo } from "@/components/EmpleoModulo";

export const metadata: Metadata = {
  title: "Empleo · Territorio INN 2026",
};

export default function EmpleoPage() {
  return <EmpleoModulo />;
}
