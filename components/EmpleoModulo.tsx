// Primer módulo con datos reales del sitio (los otros 2 siguen en ModuloProximamente).
// Mismo lenguaje visual que el resto: título Fraunces, números en JetBrains Mono/terracota,
// grid asimétrico. Las tablas y la ficha metodológica quedan expuestas a propósito — son datos
// públicos que van a una propuesta de política, tienen que poder auditarse a simple vista.

import Link from "next/link";
import { comuna, empleo } from "@/lib/content";
import daneGeih from "@/lib/data/dane-geih.json";
import camaraComercio from "@/lib/data/camara-comercio-manrique.json";
import { ScrollReveal } from "./ScrollReveal";

const kpis = comuna.kpis;

function millones(pesos: number) {
  return `$${Math.round(pesos / 1_000_000).toLocaleString("es-CO")} M`;
}

function Tabla({
  titulo,
  columnas,
  filas,
}: {
  titulo: string;
  columnas: string[];
  filas: (string | number)[][];
}) {
  return (
    <div>
      <h3 className="font-display text-2xl font-medium text-tinta">{titulo}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left">
          <thead>
            <tr className="border-b border-tinta/15 font-mono text-xs uppercase tracking-wide text-tinta/50">
              {columnas.map((col, i) => (
                <th key={col} className={`py-2 font-normal ${i > 0 ? "text-right" : ""}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono text-sm text-tinta">
            {filas.map((fila, indice) => (
              <tr key={indice} className="border-b border-tinta/10">
                {fila.map((celda, i) => (
                  <td
                    key={i}
                    className={`py-2 ${i === 0 ? "font-sans" : "text-right"} ${
                      i === 0 && fila[0] === "Manrique" ? "font-medium text-terracota" : ""
                    }`}
                  >
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmpleoModulo() {
  return (
    <main className="margen-editorial py-24 sm:py-32">
      <span className="font-mono text-xs text-tinta/50">{empleo.numero} · {empleo.nombre}</span>

      <ScrollReveal>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          {empleo.titular}
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <p className="mt-6 max-w-lg font-sans text-lg leading-relaxed text-tinta/70">
          {empleo.intro}
        </p>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 border-t border-tinta/15 pt-16 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, indice) => (
          <ScrollReveal key={kpi.etiqueta} delay={0.1 + indice * 0.1}>
            <p className="font-mono text-4xl font-medium text-terracota sm:text-5xl">
              {kpi.valor}
            </p>
            <p className="mt-3 font-sans text-base font-medium text-tinta">{kpi.etiqueta}</p>
            <p className="mt-1 font-mono text-xs text-tinta/50">{kpi.contexto}</p>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.2} className="mt-16 max-w-2xl border-l-2 border-terracota pl-6">
        <p className="font-display text-2xl italic leading-snug text-terracota sm:text-3xl">
          {empleo.brecha}
        </p>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-1 gap-16 border-t border-tinta/15 pt-16 lg:grid-cols-2">
        <ScrollReveal delay={0.1}>
          <Tabla
            titulo="Empresas de Manrique por tamaño"
            columnas={["Tamaño", "Empresas", "Activos"]}
            filas={camaraComercio.porTamanoActivos.map((r) => [
              r.tamano,
              r.empresas.toLocaleString("es-CO"),
              millones(r.activos),
            ])}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <Tabla
            titulo="Manrique frente a sus comunas vecinas"
            columnas={["Comuna", "Empresas", "Activos"]}
            filas={camaraComercio.comparacionComunas.map((r) => [
              r.comuna,
              r.empresas.toLocaleString("es-CO"),
              millones(r.activos),
            ])}
          />
        </ScrollReveal>
      </div>

      <div className="mt-16 border-t border-tinta/15 pt-16">
        <ScrollReveal delay={0.1}>
          <Tabla
            titulo="Principales sectores económicos en Manrique"
            columnas={["CIIU", "Sector", "Empresas"]}
            filas={camaraComercio.sectores.map((s) => [s.ciiu, s.descripcion, s.empresas])}
          />
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.1} className="mt-16 max-w-2xl border border-tinta/15 p-6">
        <p className="font-mono text-xs uppercase tracking-wide text-tinta/50">
          Ficha metodológica
        </p>
        <dl className="mt-4 space-y-3 font-mono text-xs leading-relaxed text-tinta/70">
          <div>
            <dt className="text-tinta">Desempleo e informalidad (DANE)</dt>
            <dd>{daneGeih.metodologia.desempleo}</dd>
            <dd className="mt-1">{daneGeih.metodologia.informalidad}</dd>
            <dd className="mt-1">
              Muestra: {daneGeih.muestra.registrosOcupados.toLocaleString("es-CO")} ocupados ·{" "}
              {daneGeih.muestra.registrosDesocupados.toLocaleString("es-CO")} desocupados ·{" "}
              {daneGeih.fuente} · Procesado el {daneGeih.fechaProceso}
            </dd>
          </div>
          <div>
            <dt className="text-tinta">Unidades productivas (Cámara de Comercio)</dt>
            <dd>{camaraComercio.metodologia}</dd>
          </div>
        </dl>
      </ScrollReveal>

      <Link
        href="/#enfoque"
        className="mt-16 inline-block w-fit font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota"
      >
        ← Volver a Territorio INN 2026
      </Link>
    </main>
  );
}
