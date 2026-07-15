import type { Metadata } from "next";
import { ModuloProximamente } from "@/components/ModuloProximamente";
import { enfoque } from "@/lib/content";

const modulo = enfoque.modulos.find((m) => m.slug === "empleo")!;

export const metadata: Metadata = {
  title: `${modulo.nombre} · Territorio INN 2026`,
};

export default function EmpleoPage() {
  return <ModuloProximamente modulo={modulo} />;
}
