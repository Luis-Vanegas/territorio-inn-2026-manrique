import { ETIQUETA_FORMALIDAD } from '../formalizacion.ts';
import type { DatosAbiertos } from '../db/datos.repo.ts';

/**
 * Lo que el panel de entidad muestra y descarga de los datos abiertos, siempre a
 * partir de `DatosAbiertos` (la salida de `obtenerDatosAbiertos`, que ya pasó por
 * la regla k = 5 y la celda complementaria). Este archivo SOLO reordena y rotula:
 * no consulta la base ni vuelve a contar, así que no puede mostrar un número que
 * `/api/datos` esconda. `scripts/verificar-entidades.mjs` lo comprueba.
 *
 * Puro y sin `server-only`: lo carga el verificador con `--experimental-strip-types`
 * (por eso los imports llevan extensión y los de tipo van con `import type`).
 */

/** Cómo se leen las opciones de «mayor dificultad» (el id es lo que guarda la base). */
export const ETIQUETA_DOLOR: Record<string, string> = {
  cuentas_ganancia: 'Llevar las cuentas y saber la ganancia',
  inventario_vencimientos: 'Controlar el inventario y los vencimientos',
  clientes_redes: 'Conseguir clientes y manejar redes',
  cobros_facturas: 'Cobrar y facturar',
  todo_bajo_control: 'Dice tener todo bajo control',
  otro: 'Otra respuesta',
};

export type DimensionDatos = 'total' | 'categoria' | 'barrio' | 'formalidad' | 'dificultad';

export type FilaPlana = {
  dimension: DimensionDatos;
  id: string;
  nombre: string;
  negocios: number | '<5';
};

export const NOMBRE_DIMENSION: Record<DimensionDatos, string> = {
  total: 'Negocios aprobados',
  categoria: 'Por categoría',
  barrio: 'Por barrio oficial',
  formalidad: 'Por formalidad declarada',
  dificultad: 'Por mayor dificultad',
};

/** Todas las celdas en una sola lista (formato largo: sirve para tabla dinámica y para pandas). */
export function filasPlanas(d: DatosAbiertos): FilaPlana[] {
  return [
    { dimension: 'total', id: 'total', nombre: 'Negocios aprobados', negocios: d.negocios_aprobados },
    ...d.por_categoria.map((f) => ({
      dimension: 'categoria' as const,
      id: f.id,
      nombre: f.nombre,
      negocios: f.negocios,
    })),
    ...d.por_barrio.map((f) => ({
      dimension: 'barrio' as const,
      id: f.nombre,
      nombre: f.nombre,
      negocios: f.negocios,
    })),
    ...d.por_formalidad.map((f) => ({
      dimension: 'formalidad' as const,
      id: f.id,
      nombre: ETIQUETA_FORMALIDAD[f.id] ?? f.id,
      negocios: f.negocios,
    })),
    ...d.por_mayor_dolor.map((f) => ({
      dimension: 'dificultad' as const,
      id: f.id,
      nombre: ETIQUETA_DOLOR[f.id] ?? f.id,
      negocios: f.negocios,
    })),
  ];
}

function celdaCsv(valor: string | number): string {
  const texto = String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * CSV con BOM (Excel abre las tildes bien) y fin de línea CRLF. «<5» sale como
 * texto, igual que en el JSON: nunca se cambia por un número ni por un vacío.
 */
export function datosACsv(d: DatosAbiertos): string {
  const encabezado = ['dimension', 'id', 'nombre', 'negocios'].join(',');
  const lineas = filasPlanas(d).map((f) =>
    [f.dimension, f.id, f.nombre, f.negocios].map(celdaCsv).join(','),
  );
  return `﻿${[encabezado, ...lineas].join('\r\n')}\r\n`;
}
