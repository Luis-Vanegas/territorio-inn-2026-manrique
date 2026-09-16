'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

import { ScrollReveal } from '@/components/ScrollReveal';
import { ETIQUETA_TIPO, type PasoFormalizacion, type TipoRuta } from '@/lib/formalizacion';

const ORDEN_TIPOS: TipoRuta[] = ['tramite', 'fondo', 'formacion'];

const INTRO_TIPO: Record<TipoRuta, string> = {
  tramite: 'Lo que tienes que hacer para que tu negocio sea formal.',
  fondo: 'Dónde pedir plata o apoyo para crecer.',
  formacion: 'Dónde aprender, sin pagar nada.',
};

/**
 * Lista de trámites de /formalizacion, con dos capas:
 *
 * 1. Filtrada según la respuesta de la persona a "¿Tienes RUT o Cámara de
 *    Comercio?" en el registro (`pasosPara`, en lib/formalizacion.ts) — antes
 *    calculada y nunca mostrada: la página traía el catálogo completo a todo
 *    el mundo.
 * 2. Un toggle para ver el catálogo completo. Sin esto, alguien que sí quiere
 *    mirar los pasos que "ya hizo" no tiene cómo — y el conteo total que
 *    promete la vista previa a quien no se registró dejaría de cuadrar con
 *    lo que ve al entrar.
 *
 * Solo se monta cuando SÍ hay personalización (ver page.tsx): sin negocio, o
 * con más de uno, o sin respuesta registrada, no hay nada que alternar.
 */
export function RutasPersonalizadas({
  propios,
  todos,
  etiquetaFormalidad,
}: {
  propios: PasoFormalizacion[];
  todos: PasoFormalizacion[];
  etiquetaFormalidad: string;
}) {
  const [verTodos, setVerTodos] = useState(false);
  const prefiereMenosMovimiento = useReducedMotion();
  const activos = verTodos ? todos : propios;

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center gap-4 border border-terracota/30 bg-terracota/5 px-5 py-4">
        <p className="font-sans text-sm leading-relaxed text-tinta/70">
          <span className="font-mono text-xs uppercase tracking-wider text-terracota-texto">
            Según tu negocio
          </span>{' '}
          — respondiste «{etiquetaFormalidad}», así que estos son los que te aplican.
        </p>

        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          className="ml-auto shrink-0 font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4"
        >
          {verTodos ? `Ver solo los míos (${propios.length})` : `Ver los ${todos.length} completos`}
        </button>
      </div>

      {/* Lo visual ya lo dice; quien usa lector de pantalla necesita el mismo
          aviso en texto cuando el conteo cambia con el toggle. */}
      <p className="sr-only" aria-live="polite">
        Mostrando {activos.length} de {todos.length} rutas.
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={verTodos ? 'todos' : 'propios'}
          initial={prefiereMenosMovimiento ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefiereMenosMovimiento ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {ORDEN_TIPOS.map((tipo) => {
            const pasos = activos.filter((p) => p.tipo === tipo);
            if (pasos.length === 0) return null;

            return (
              <section key={tipo} className="mt-20 border-t border-tinta/12 pt-10">
                <h2 className="font-display text-3xl font-medium text-tinta">
                  {ETIQUETA_TIPO[tipo]}
                </h2>
                <p className="mt-2 font-sans text-tinta/60">{INTRO_TIPO[tipo]}</p>

                <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                  {pasos.map((paso, i) => (
                    <ScrollReveal key={paso.id} delay={Math.min(i, 5) * 0.06}>
                      <li className="flex h-full flex-col border border-tinta/12 p-6 transition-colors hover:border-terracota">
                        <h3 className="font-display text-xl font-medium text-tinta">
                          {paso.titulo}
                        </h3>

                        <p className="mt-1 font-mono text-xs text-tinta/45">{paso.entidad}</p>

                        <p className="mt-3 font-sans leading-relaxed text-tinta/70">
                          {paso.resumen}
                        </p>

                        <div className="mt-4">
                          <p className="font-mono text-xs text-tinta/45">Necesitas tener:</p>
                          <ul className="mt-2 space-y-1">
                            {paso.requisitos.map((requisito) => (
                              <li key={requisito} className="font-sans text-sm text-tinta/70">
                                · {requisito}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto pt-6">
                          <a
                            href={paso.fuente}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4"
                          >
                            Ver en la página oficial ↗
                          </a>
                          <p className="mt-2 font-mono text-xs text-tinta/35">
                            Enlace verificado el {paso.verificadoEn}
                          </p>
                        </div>
                      </li>
                    </ScrollReveal>
                  ))}
                </ul>
              </section>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
