/**
 * Cuentas del panel del negocio, puras (sin base ni `server-only`): qué tan
 * completa está una ficha y cómo van las últimas 8 semanas. Todo sale de datos
 * reales de la ficha y de `interacciones_portafolio`; ninguna cifra se inventa.
 */

import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { SemanaInteraccion } from '@/lib/db/cuenta.repo';

// ── «Tu ficha está al N %» ──────────────────────────────────────────────

export type PasoFicha = {
  id: string;
  etiqueta: string;
  /** Qué gana el negocio con esto, en una frase. */
  ayuda: string;
  hecho: boolean;
};

type DatosFicha = Pick<
  Portafolio,
  | 'foto_url'
  | 'descripcion'
  | 'productos'
  | 'horario'
  | 'medios_pago'
  | 'categoria_id'
  | 'instagram'
  | 'facebook'
  | 'correo'
  | 'punto_referencia'
>;

/**
 * Ocho cosas que ayudan a que te encuentren y te escriban, todas opcionales en
 * el registro. El porcentaje es lo hecho sobre el total, sin pesos: que sea una
 * cuenta que la persona pueda repetir de cabeza. La ubicación y el WhatsApp no
 * entran: el formulario ya los exige.
 */
export function completitudFicha(d: DatosFicha): {
  porcentaje: number;
  pasos: PasoFicha[];
  faltan: PasoFicha[];
} {
  const lleno = (t: string | null) => (t ?? '').trim().length > 0;
  const pasos: PasoFicha[] = [
    {
      id: 'foto',
      etiqueta: 'Una foto del negocio',
      ayuda: 'Con foto te reconocen al llegar y confían más al escribirte.',
      hecho: lleno(d.foto_url),
    },
    {
      id: 'descripcion',
      etiqueta: 'Descripción de lo que haces',
      ayuda: 'Dos líneas bastan para que sepan si eres lo que buscan.',
      hecho: lleno(d.descripcion),
    },
    {
      id: 'productos',
      etiqueta: 'Productos o servicios',
      ayuda: 'Quien ve lo que ofreces te escribe con la pregunta ya hecha.',
      hecho: d.productos.length > 0,
    },
    {
      id: 'horario',
      etiqueta: 'Horario de atención',
      ayuda: 'Evita que te escriban cuando no puedes atender.',
      hecho: d.horario.length > 0,
    },
    {
      id: 'medios_pago',
      etiqueta: 'Medios de pago',
      ayuda: 'Saber que aceptas Nequi o datáfono cierra más ventas.',
      hecho: d.medios_pago.length > 0,
    },
    {
      id: 'categoria',
      etiqueta: 'Categoría precisa',
      ayuda: '«Otros» te esconde en los filtros del mapa: elige el rubro que más se parezca.',
      hecho: d.categoria_id !== 'otros',
    },
    {
      id: 'contacto',
      etiqueta: 'Otra forma de contacto',
      ayuda: 'Instagram, otra red o un correo, por si alguien no usa WhatsApp.',
      hecho: lleno(d.instagram) || lleno(d.facebook) || lleno(d.correo),
    },
    {
      id: 'referencia',
      etiqueta: 'Punto de referencia',
      ayuda: 'Algo fácil de reconocer cerca de ti ayuda a que te encuentren a pie.',
      hecho: lleno(d.punto_referencia),
    },
  ];
  const hechos = pasos.filter((p) => p.hecho).length;
  return {
    porcentaje: Math.round((hechos / pasos.length) * 100),
    pasos,
    faltan: pasos.filter((p) => !p.hecho),
  };
}

// ── Las 8 semanas ───────────────────────────────────────────────────────

export type ResumenSemanas = {
  vistas: number;
  contactos: number;
  vistasAntes: number;
  contactosAntes: number;
  /** % de cambio contra las 4 semanas anteriores; null si antes no hubo nada (dividir por cero no es «+∞ %»). */
  variacionVistas: number | null;
  variacionContactos: number | null;
  /** Contactos por cada 100 vistas, con un decimal; null si no hubo vistas. */
  contactosPor100: number | null;
};

/** `semanas` va de la más vieja a la más nueva: las 4 últimas son «ahora» y las 4 de antes, la base de comparación. */
export function resumenSemanas(semanas: readonly SemanaInteraccion[]): ResumenSemanas {
  const suma = (xs: readonly SemanaInteraccion[], k: keyof SemanaInteraccion) =>
    xs.reduce((t, s) => t + s[k], 0);
  const ahora = semanas.slice(-4);
  const antes = semanas.slice(-8, -4);

  const vistas = suma(ahora, 'vistas');
  const contactos = suma(ahora, 'contactos');
  const vistasAntes = suma(antes, 'vistas');
  const contactosAntes = suma(antes, 'contactos');

  const variacion = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100));
  return {
    vistas,
    contactos,
    vistasAntes,
    contactosAntes,
    variacionVistas: variacion(vistas, vistasAntes),
    variacionContactos: variacion(contactos, contactosAntes),
    contactosPor100: vistas === 0 ? null : Math.round((contactos / vistas) * 1000) / 10,
  };
}
