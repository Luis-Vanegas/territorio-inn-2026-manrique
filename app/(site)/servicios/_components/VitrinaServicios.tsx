'use client';

import { useMemo, useState } from 'react';

import type { Servicio } from '@/lib/db/servicios.repo';
import { enlaceWhatsapp } from '@/lib/contacto';

/**
 * Vitrina de servicios: filtro por oficio y por barrio, en el cliente.
 *
 * El filtrado es en memoria a propósito. A escala barrial son decenas de
 * fichas: traerlas una vez y filtrar acá cuesta un render, mientras que
 * filtrar en el servidor cuesta un request y una query por cada clic. La
 * primera carga ya paga el total.
 */

/**
 * Lo que se muestra NO es una verificación: el proyecto no comprueba identidad
 * ni antecedentes de nadie, y decirlo sería mentir. Lo que sí es cierto, y lo
 * único que se afirma, es que esta persona entregó sus datos a conciencia y
 * aceptó por escrito un compromiso de conducta en una fecha concreta.
 *
 * Esa es la señal honesta: no "este señor es de fiar", sino "este señor puso
 * su nombre y su palabra".
 */
function Compromiso({ fecha }: { fecha: string }) {
  return (
    <span
      title="Entregó sus datos y aceptó el compromiso de conducta. El proyecto no verifica identidad ni antecedentes."
      className="inline-flex items-center gap-1.5 border border-terracota/40 px-2 py-1 font-mono text-[11px] text-terracota"
    >
      ✓ Aceptó el compromiso · {fecha}
    </span>
  );
}

/**
 * El teléfono se revela con un clic en vez de ir como texto plano en el HTML.
 * No impide que una persona lo copie —ni pretende hacerlo—, pero corta el
 * scraping automatizado, que es el vector real de abuso cuando lo que se
 * publica es el celular de una persona natural y no la línea de un local.
 */
function Contacto({ telefono, nombre }: { telefono: string; nombre: string }) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="min-h-11 border border-tinta/25 px-4 py-2 font-mono text-xs text-tinta transition-colors hover:border-terracota hover:text-terracota"
      >
        Mostrar teléfono
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={enlaceWhatsapp(telefono)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-11 border border-terracota px-4 py-2 font-mono text-xs text-terracota transition-colors hover:bg-terracota hover:text-hueso"
      >
        WhatsApp a {nombre.split(' ')[0]}
      </a>
      <a href={`tel:${telefono.replace(/\s/g, '')}`} className="font-mono text-xs text-tinta/70">
        {telefono}
      </a>
    </div>
  );
}

function Ficha({ servicio }: { servicio: Servicio }) {
  const oficio =
    servicio.categoria_id === 'otros' && servicio.categoria_otra
      ? servicio.categoria_otra
      : servicio.categoria_nombre;

  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="flex gap-5">
        {/* Sin foto acá a propósito: la persona sube una al registrarse, pero
            es un dato reservado para identificarla si hace falta, no un
            elemento de la vitrina. Ver lib/db/serviciosPrivado.repo.ts. */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-tinta/5 font-display text-2xl text-tinta/40">
          {servicio.nombre.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <h3 className="font-display text-2xl font-medium leading-tight text-tinta">
              {servicio.nombre}
            </h3>
            <Compromiso fecha={servicio.creado_en} />
          </div>

          <p className="mt-1 font-mono text-xs text-terracota">
            {oficio}
            <span className="text-tinta/45">
              {' · '}
              {servicio.anos_experiencia === 0
                ? 'empezando'
                : `${servicio.anos_experiencia} ${servicio.anos_experiencia === 1 ? 'año' : 'años'} de experiencia`}
            </span>
          </p>

          <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-tinta/75">
            {servicio.descripcion}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-tinta/45">
              Atiende en
            </span>
            {servicio.cobertura.map((b) => (
              <span key={b} className="font-mono text-[11px] text-tinta/65">
                {b}
              </span>
            ))}
          </div>

          <div className="mt-5">
            <Contacto telefono={servicio.telefono} nombre={servicio.nombre} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function VitrinaServicios({ servicios }: { servicios: Servicio[] }) {
  const [oficio, setOficio] = useState('');
  const [barrio, setBarrio] = useState('');

  const oficios = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const s of servicios) mapa.set(s.categoria_id, s.categoria_nombre);
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [servicios]);

  const barrios = useMemo(
    () => [...new Set(servicios.flatMap((s) => s.cobertura))].sort((a, b) => a.localeCompare(b, 'es')),
    [servicios],
  );

  const visibles = useMemo(
    () =>
      servicios.filter(
        (s) =>
          (!oficio || s.categoria_id === oficio) &&
          (!barrio || s.cobertura.includes(barrio)),
      ),
    [servicios, oficio, barrio],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            Oficio
          </span>
          <select
            value={oficio}
            onChange={(e) => setOficio(e.target.value)}
            className="border-0 border-b border-tinta/25 bg-transparent py-1.5 pr-6 font-sans text-sm text-tinta focus:border-terracota focus:outline-none"
          >
            <option value="">Todos</option>
            {oficios.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            Que venga a
          </span>
          <select
            value={barrio}
            onChange={(e) => setBarrio(e.target.value)}
            className="border-0 border-b border-tinta/25 bg-transparent py-1.5 pr-6 font-sans text-sm text-tinta focus:border-terracota focus:outline-none"
          >
            <option value="">Cualquier barrio</option>
            {barrios.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 font-mono text-xs text-tinta/50" aria-live="polite">
        {visibles.length} {visibles.length === 1 ? 'persona' : 'personas'}
      </p>

      <div className="mt-4">
        {visibles.length === 0 ? (
          <p className="border-t border-tinta/12 py-10 font-sans text-sm text-tinta/60">
            Todavía no hay nadie con ese oficio en ese barrio.
          </p>
        ) : (
          visibles.map((s) => <Ficha key={s.id} servicio={s} />)
        )}
      </div>
    </div>
  );
}
