// Métricas del proyecto — reemplaza a ComunaSection (desempleo/informalidad, datos
// congelados en 2019 y sin nivel de detalle comunal). Estos 3 números son reales,
// del propio sitio, actualizados en cada carga: negocios registrados y el
// contador de interacciones anónimas que ya existía para el panel de admin
// (lib/db/interacciones.repo.ts). Mismo lenguaje visual que tenía la sección
// anterior — JetBrains Mono gigante, terracota, altura escalonada — para no
// romper el ritmo del home.

import { contarAprobadosPorCategoria } from "@/lib/db/portafolios.repo";
import { totalesInteracciones } from "@/lib/db/interacciones.repo";
import type { Kpi } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";
import { NumeroAnimado } from "./NumeroAnimado";

const DESPLAZAMIENTOS = ["lg:mt-0", "lg:mt-10", "lg:mt-4"];
const DIAS = 30;

export async function MetricasSection() {
  const [conteos, interacciones] = await Promise.all([
    contarAprobadosPorCategoria(),
    totalesInteracciones(DIAS),
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
      valor: interacciones.vistas.toLocaleString("es-CO"),
      numero: interacciones.vistas,
      decimales: 0,
      etiqueta: "Fichas de negocio vistas",
      contexto: `Últimos ${DIAS} días · conteo anónimo, sin cookies.`,
    },
    {
      valor: interacciones.contactos.toLocaleString("es-CO"),
      numero: interacciones.contactos,
      decimales: 0,
      etiqueta: "Contactos iniciados",
      contexto: `Últimos ${DIAS} días · WhatsApp, correo o red social tocados desde una ficha.`,
    },
  ];

  return (
    <section className="margen-editorial py-24 sm:py-32">
      <ScrollReveal>
        <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          El proyecto, en números
        </h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-3">
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
    </section>
  );
}
