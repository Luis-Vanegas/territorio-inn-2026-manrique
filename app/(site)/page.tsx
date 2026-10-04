import { listarAprobados } from "@/lib/db/portafolios.repo";
import { BuscadorNegocios } from "@/components/BuscadorNegocios";
import { ID_MAPA_INICIO, ProveedorBusqueda } from "@/components/BusquedaInicio";
import { sugerenciasDeCategorias } from "@/lib/busqueda";
import { MapaAliadosDestacado } from "@/components/MapaAliadosDestacado";
import { CifrasBarrio } from "@/components/CifrasBarrio";
import { GaleriaAliados } from "@/components/GaleriaAliados";
import { EnfoqueSection } from "@/components/EnfoqueSection";
import { Footer } from "@/components/Footer";
import { leerFirmamento } from "./firmamento/datos";

// Lee la base (aliados) en cada carga: un negocio recién aprobado debe verse ya.
// Las lecturas van cacheadas en sus repos (`cachearVitrina`).
export const dynamic = "force-dynamic";

/**
 * Inicio = la parte pública de datos (Luis, 4-oct-2026; reemplaza a la página
 * pública /firmamento). Orden: título + buscador → EL mapa (uno solo) con la
 * lista de constelaciones → el barrio en cifras → guías → galería. Sin hero,
 * sin botones de registro: el registro se alcanza solo desde /firmamento/entrar.
 */
export default async function Home() {
  const [aliados, d] = await Promise.all([listarAprobados(), leerFirmamento()]);

  return (
    <main>
      <ProveedorBusqueda sugerencias={sugerenciasDeCategorias(aliados)}>
        <section className="margen-editorial pt-10 sm:pt-14" aria-labelledby="titulo-inicio">
          <h1
            id="titulo-inicio"
            className="font-display text-3xl font-medium leading-tight text-tinta sm:text-4xl"
          >
            Los negocios de la Comuna 3, Manrique, en un mapa.
          </h1>
          <div className="mt-6 max-w-xl">
            <BuscadorNegocios />
          </div>
        </section>

        <section
          id={ID_MAPA_INICIO}
          className="margen-editorial scroll-mt-4 pb-16 pt-10"
          aria-label="Mapa de los negocios"
        >
          <MapaAliadosDestacado
            portafolios={aliados}
            constelaciones={d.filas.map((f) => ({
              id: f.id,
              codigo: f.codigo,
              nombre: f.nombre,
              tamano: f.tamano,
            }))}
          />
        </section>
      </ProveedorBusqueda>

      <CifrasBarrio d={d} />
      <EnfoqueSection />
      <GaleriaAliados />
      <Footer />
    </main>
  );
}
