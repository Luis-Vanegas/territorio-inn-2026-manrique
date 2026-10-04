import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { AliadosDestacado } from "@/components/AliadosDestacado";
import { GaleriaAliados } from "@/components/GaleriaAliados";
import { MetricasSection } from "@/components/MetricasSection";
import { EnfoqueSection } from "@/components/EnfoqueSection";
import { Footer } from "@/components/Footer";
import { ModalRegistroExitoso } from "@/components/ModalRegistroExitoso";

// AliadosDestacado consulta la base (negocios aprobados) en cada carga: es la
// misma razón que /aliados es force-dynamic — un negocio recién aprobado debe
// verse ya, no cinco minutos después por un cache de ruta.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      {/* Suspense: useSearchParams() adentro requiere un boundary de cliente,
          o el build falla — el modal solo se llena cuando llega ?registrado=. */}
      <Suspense fallback={null}>
        <ModalRegistroExitoso />
      </Suspense>
      <Hero />
      {/* Orden: Hero → mapa de Aliados (el ÚNICO mapa y el único botón de
          registro) → números del territorio → qué ofrecemos → galería. Sin banda
          de noche: Firmamento va aparte (/firmamento) y la Constelación viva solo
          está en la puerta (/firmamento/entrar). */}
      <AliadosDestacado />
      <MetricasSection />
      <EnfoqueSection />
      <GaleriaAliados />
      <Footer />
    </main>
  );
}
