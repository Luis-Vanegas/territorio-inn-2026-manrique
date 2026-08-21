// Métricas del proyecto — reemplaza a ComunaSection (desempleo/informalidad, datos
// congelados en 2019 y sin nivel de detalle comunal). Estos 2 números son reales,
// del propio sitio, actualizados en cada carga.
//
// Por qué dos y no tres: los contactos iniciados (WhatsApp, correo o red social
// tocados desde una ficha) salieron de acá a propósito. Es una métrica de
// diagnóstico interno, no de vitrina — un "0 contactos" en la portada le dice al
// visitante que el sitio no sirve, y además es información comercial de los
// negocios. Sigue completa en /admin/estadisticas, sección 03.

import { contarAprobadosPorCategoria } from "@/lib/db/portafolios.repo";
import { totalVisitas } from "@/lib/db/visitas.repo";
import type { Kpi } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";
import { NumeroAnimado } from "./NumeroAnimado";

const DESPLAZAMIENTOS = ["lg:mt-0", "lg:mt-10"];
const DIAS = 30;

export async function MetricasSection() {
  const [conteos, visitas] = await Promise.all([
    contarAprobadosPorCategoria(),
    totalVisitas(DIAS),
  ]);

  const negocios = Object.values(conteos).reduce((a, b) => a + b, 0);

  const kpis: Kpi[] = [
    {
      valor: negocios.toLocaleString("es-CO"),
      numero: negocios,
      decimales: 0,
      etiqueta: "Negocios registrados",
      contexto: "Aprobados y visibles en el mapa de Aliados, ahora mismo.",
    },
    {
      valor: visitas.toLocaleString("es-CO"),
      numero: visitas,
      decimales: 0,
      etiqueta: "Visitas al sitio",
      contexto: `Páginas abiertas en los últimos ${DIAS} días · conteo anónimo, sin cookies.`,
    },
  ];

  return (
    // Título y números comparten fila desde lg. Apilados, dos KPIs ocupaban
    // 548px de alto para mostrar dos cifras, con el ancho derecho vacío.
    <section className="seccion">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
        <ScrollReveal className="lg:col-span-4">
          <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
            El proyecto, en números
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
          {kpis.map((kpi, indice) => (
            <ScrollReveal
              key={kpi.etiqueta}
              delay={indice * 0.1}
              className={DESPLAZAMIENTOS[indice]}
            >
              <p
                role="text"
                aria-label={kpi.valor}
                className="font-mono text-5xl font-medium text-terracota sm:text-6xl"
              >
                <NumeroAnimado numero={kpi.numero} decimales={kpi.decimales} sufijo={kpi.sufijo} />
              </p>
              <p className="mt-3 font-sans text-base font-medium text-tinta">
                {kpi.etiqueta}
              </p>
              <p className="mt-1 font-mono text-xs text-tinta/50">{kpi.contexto}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
