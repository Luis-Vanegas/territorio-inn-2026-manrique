// «El proyecto, en números», ahora como la banda Firmamento (noche) de la portada.
//
// Antes mostraba negocios y visitas al sitio. Las visitas salieron (D4 del plan
// de diseño): las infla el propio equipo y dicen más del equipo que del barrio;
// siguen completas en /admin/estadisticas. Ahora son datos del TERRITORIO y cada
// cifra lleva su fuente y su fecha debajo, en font-cifra (DESIGN.md › Reglas de
// cifras). Ninguna es simulada:
//   - comercios y constelaciones salen de public/firmamento/constelaciones.json
//     (se importa en el servidor, como /aliados; el navegador no lo descarga);
//   - los aliados salen de la base, en cada carga;
//   - las empresas de Cámara son una cifra publicada, con su cita.
//
// Los colores son los hex fijos de noche: la banda no cambia con el tema
// claro/oscuro (DESIGN.md › Firmamento). El borde superior es un degradado del
// color del día al de la noche: la transición es CSS, no depende de JS.

import Link from "next/link";
import { contarAprobadosPorCategoria } from "@/lib/db/portafolios.repo";
import { aplanarComercios } from "@/lib/geo/comerciosOsm";
import { CAMARA_EMPRESAS, FUENTE_CAMARA } from "@/lib/cifras";
import { fechaHoyBogota, formatearNumero } from "@/lib/formato";
import { fechaLarga, type DatosConstelaciones } from "@/lib/geo/constelaciones";
import datosOsmJson from "@/public/firmamento/constelaciones.json";
import { Estrella } from "./firmamento/Estrella";
import { ScrollReveal } from "./ScrollReveal";
import { NumeroAnimado } from "./NumeroAnimado";

// La cifra de Cámara vive en lib/cifras.ts (la comparte /firmamento): Tabla 16
// de la Estructura Empresarial 2025, matriculadas o renovadas en 2025.

const datosOsm = datosOsmJson as unknown as DatosConstelaciones;

type Cifra = {
  numero: number;
  etiqueta: string;
  contexto: string;
  fuente: string;
};

export async function MetricasSection() {
  const conteos = await contarAprobadosPorCategoria();
  const aliados = Object.values(conteos).reduce((a, b) => a + b, 0);
  const hoy = fechaHoyBogota();

  const comercios = aplanarComercios(datosOsm).length;
  const fechaOsm = fechaLarga(datosOsm.osm_base);

  const cifras: Cifra[] = [
    {
      numero: comercios,
      etiqueta: "Comercios mapeados en OpenStreetMap",
      contexto: "El mapa abierto del barrio. No todos son aliados.",
      fuente: `Fuente: © colaboradores de OpenStreetMap (ODbL) · datos al ${fechaOsm}`,
    },
    {
      numero: datosOsm.constelaciones.length,
      etiqueta: "Constelaciones",
      contexto: "Grupos de comercios que quedan cerca unos de otros.",
      fuente: `Fuente: agrupación de los comercios de OpenStreetMap (HDBSCAN) · corrida del ${fechaLarga(datosOsm.fecha_corrida)}`,
    },
    {
      numero: aliados,
      etiqueta: aliados === 1 ? "Aliado en la red" : "Aliados en la red",
      contexto: "Negocios que se registraron y ya están en el mapa.",
      fuente: `Fuente: base de datos de Constelaciones · al ${hoy}`,
    },
    {
      numero: CAMARA_EMPRESAS.numero ?? 0,
      etiqueta: "Empresas registradas en Cámara de Comercio, en Manrique",
      contexto: "Lo que ve el registro mercantil: solo lo formal.",
      fuente: `Fuente: ${FUENTE_CAMARA} · matriculadas o renovadas en ${CAMARA_EMPRESAS.fecha} · consultada el 1 de octubre de 2026`,
    },
  ];

  return (
    <section aria-labelledby="titulo-numeros" className="bg-noche text-estrella">
      {/* Día → noche: sin saltos de layout y sin JS. */}
      <div aria-hidden="true" className="h-16 bg-gradient-to-b from-hueso to-noche sm:h-24" />

      <div className="margen-editorial pb-16 sm:pb-24">
        <ScrollReveal>
          <h2
            id="titulo-numeros"
            className="max-w-3xl font-display text-5xl font-medium leading-[0.95] text-estrella sm:text-7xl"
          >
            El proyecto, en números
          </h2>
          <p className="mt-6 max-w-2xl font-display text-2xl font-light italic leading-snug text-sodio sm:text-3xl">
            La brecha es nuestra línea base.
          </p>
          <p className="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-tenue">
            El registro mercantil, el mapa abierto y nuestra red son tres miradas distintas al mismo
            barrio. La distancia entre ellas es el punto de partida para medir cuánto avanzamos.
          </p>
        </ScrollReveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cifras.map((c, indice) => (
            <li key={c.etiqueta}>
              <ScrollReveal delay={indice * 0.1} className="h-full">
                <div className="flex h-full flex-col border border-trazo bg-noche-2 p-5">
                  <p className="flex items-center gap-3 font-cifra text-5xl font-medium text-sodio">
                    <Estrella tamano={20} color="currentColor" className="shrink-0 text-sodio" />
                    {/* El conteo animado es aria-hidden: el lector de pantalla lee el valor final. */}
                    <span className="sr-only">{formatearNumero(c.numero)}</span>
                    <NumeroAnimado numero={c.numero} decimales={0} />
                  </p>
                  <p className="mt-4 font-sans text-base font-medium text-estrella">{c.etiqueta}</p>
                  <p className="mt-1 font-sans text-sm text-tenue">{c.contexto}</p>
                  <p className="mt-auto break-words pt-4 font-cifra text-xs leading-relaxed text-tenue">
                    {c.fuente}
                  </p>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ul>

        <ScrollReveal delay={0.2}>
          <Link
            href="/firmamento"
            className="mt-10 inline-flex min-h-[44px] items-center border border-sodio bg-sodio px-6 py-3 font-sans text-base font-medium text-noche transition-colors hover:bg-transparent hover:text-sodio focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estrella"
          >
            Ver el firmamento →
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
