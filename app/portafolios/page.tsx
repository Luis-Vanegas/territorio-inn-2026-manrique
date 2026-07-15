import type { Metadata } from "next";
import { ModuloProximamente } from "@/components/ModuloProximamente";
import { enfoque } from "@/lib/content";

const modulo = enfoque.modulos.find((m) => m.slug === "portafolios")!;

export const metadata: Metadata = {
  title: `${modulo.nombre} · Territorio INN 2026`,
};

export default function PortafoliosPage() {
  return <ModuloProximamente modulo={modulo} />;
}
