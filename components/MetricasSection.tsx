// «El proyecto, en números»: sección normal de la portada, con los tokens del
// tema (hueso/tinta) — alterna sola con el modo claro/oscuro. Ya no es una banda
// de noche: Firmamento va aparte (/firmamento).
//
// Datos del TERRITORIO, cada cifra con su fuente y su fecha debajo, en DM Sans
// pequeña (DESIGN.md › Reglas de cifras). Ninguna es simulada:
//   - comercios y constelaciones salen de public/firmamento/constelaciones.json
//     (se importa en el servidor, como /aliados; el navegador no lo descarga);
//   - las empresas de Cámara son una cifra publicada, con su cita.
// Los aliados NO se repiten acá: su cifra ya va junto al mapa (AliadosDestacado).

import Link from "next/link";
import { aplanarComercios } from "@/lib/geo/comerciosOsm";
import { CAMARA_EMPRESAS } from "@/lib/cifras";
import { fechaLarga, type DatosConstelaciones } from "@/lib/geo/constelaciones";
import datosOsmJson from "@/public/firmamento/constelaciones.json";
import { Kpi } from "./firmamento/Kpi";
import { ScrollReveal } from "./ScrollReveal";

// La cifra de Cámara vive en lib/cifras.ts (la comparte /firmamento): Tabla 16
// de la Estructura Empresarial 2025, matriculadas o renovadas en 2025.

const datosOsm = datosOsmJson as unknown as DatosConstelaciones;

export function MetricasSection() {
  const comercios = aplanarComercios(datosOsm).length;
  const fechaOsm = fechaLarga(datosOsm.osm_base);

  return (
    <section aria-labelledby="titulo-numeros" className="seccion border-t border-tinta/12">
      <ScrollReveal>
        <h2
          id="titulo-numeros"
          className="max-w-3xl font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl"
        >
          El proyecto, en números
        </h2>
        <p className="mt-6 max-w-2xl font-display text-2xl font-light italic leading-snug text-morado-texto sm:text-3xl">
          La brecha es nuestra línea base.
        </p>
        <p className="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-tinta/70">
          El registro mercantil, el mapa abierto y nuestra red son tres miradas distintas al mismo
          barrio. La distancia entre ellas es el punto de partida para medir cuánto avanzamos.
        </p>
      </ScrollReveal>

      <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <li className="min-w-0">
          <ScrollReveal className="h-full">
            <Kpi
              valor={String(comercios)}
              numero={comercios}
              etiqueta="Comercios mapeados en OpenStreetMap"
              aclaracion="El mapa abierto del barrio. No todos son aliados."
              fuente="© colaboradores de OpenStreetMap (ODbL)"
              fecha={`datos al ${fechaOsm}`}
            />
          </ScrollReveal>
        </li>
        <li className="min-w-0">
          <ScrollReveal delay={0.1} className="h-full">
            <Kpi
              valor={String(datosOsm.constelaciones.length)}
              numero={datosOsm.constelaciones.length}
              etiqueta="Constelaciones"
              aclaracion="Grupos de comercios que quedan cerca unos de otros."
              fuente="agrupación de los comercios de OpenStreetMap (HDBSCAN)"
              fecha={`corrida del ${fechaLarga(datosOsm.fecha_corrida)}`}
            />
          </ScrollReveal>
        </li>
        <li className="min-w-0">
          <ScrollReveal delay={0.2} className="h-full">
            <Kpi
              valor={String(CAMARA_EMPRESAS.numero)}
              numero={CAMARA_EMPRESAS.numero}
              etiqueta="Empresas registradas en Cámara de Comercio, en Manrique"
              aclaracion="Lo que ve el registro mercantil: solo lo formal."
              fuente={CAMARA_EMPRESAS.fuente}
              fecha={`matriculadas o renovadas en ${CAMARA_EMPRESAS.fecha} · consultada el 1 de octubre de 2026`}
            />
          </ScrollReveal>
        </li>
      </ul>

      <ScrollReveal delay={0.2}>
        <Link
          href="/firmamento"
          className="mt-8 inline-flex min-h-[44px] items-center font-sans text-base text-azul-texto underline underline-offset-4 hover:no-underline"
        >
          Ver más datos en Firmamento →
        </Link>
      </ScrollReveal>
    </section>
  );
}
