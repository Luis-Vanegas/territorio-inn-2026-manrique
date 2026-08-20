import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuloProximamente } from "@/components/ModuloProximamente";
import { enfoque } from "@/lib/content";

// Ruta apagada por NEXT_PUBLIC_MODULO_INVENTARIO: mientras el módulo no tiene
// datos reales detrás, la página ni se indexa ni resuelve — 404 real, no un
// stub disfrazado de contenido.
const INVENTARIO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_INVENTARIO === "true";

export const metadata: Metadata = INVENTARIO_ACTIVO
  ? { title: "Inventario predictivo · Constelaciones" }
  : { title: "Constelaciones", robots: { index: false, follow: false } };

export default function InventarioPredictivoPage() {
  if (!INVENTARIO_ACTIVO) notFound();

  const modulo = enfoque.modulos.find((m) => m.slug === "inventario-predictivo")!;
  return <ModuloProximamente modulo={modulo} />;
}
