import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { AliadosDestacado } from "@/components/AliadosDestacado";
import { GaleriaAliados } from "@/components/GaleriaAliados";
import { RetoSection } from "@/components/RetoSection";
import { MetricasSection } from "@/components/MetricasSection";
import { EquipoSection } from "@/components/EquipoSection";
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
      {/* Va inmediatamente después del Hero, antes que las secciones
          institucionales: es el punto de conversión del sitio, tiene que ser
          lo primero que alguien ve al bajar. */}
      <AliadosDestacado />
      <GaleriaAliados />
      <RetoSection />
      <MetricasSection />
      <EquipoSection />
      <EnfoqueSection />
      <Footer />
    </main>
  );
}
