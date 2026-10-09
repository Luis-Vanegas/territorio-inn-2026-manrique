import { z } from 'zod';

import { opcional, telefonoColombiano } from './portafolio.schema';

export const ETAPAS = ['interesado', 'seguimiento', 'compro', 'no_compro'] as const;

export const ETIQUETA_ETAPA: Record<(typeof ETAPAS)[number], string> = {
  interesado: 'Interesado',
  seguimiento: 'En seguimiento',
  compro: 'Compró',
  no_compro: 'No compró',
};

/** Ya no hay venta en juego: ni se le avisa como atrasado ni se le pone fecha. */
export const ETAPAS_CERRADAS: readonly (typeof ETAPAS)[number][] = ['compro', 'no_compro'];

const uuid = z.string().uuid('Dato inválido. Recarga la página e intenta de nuevo.');

// El input date del navegador no deja escribir un 31 de febrero, pero la action
// se puede llamar sin él y Postgres rechazaría la fecha con un error 500.
function fechaExiste(iso: string): boolean {
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(a!, m! - 1, d!));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m! - 1 && fecha.getUTCDate() === d;
}

export const clienteSchema = z.object({
  /** Vacío = cliente nuevo. */
  id: opcional(uuid),
  portafolio_id: uuid,
  nombre: z.string().trim().min(1, 'Escribe cómo se llama tu cliente').max(80, 'Máximo 80 caracteres'),
  telefono: opcional(telefonoColombiano),
  nota: opcional(z.string().trim().max(500, 'Máximo 500 caracteres')),
  etapa: z.enum(ETAPAS),
  proximo_contacto: opcional(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
      .refine(fechaExiste, 'Esa fecha no existe. Revisa el día y el mes.'),
  ),
});

export type ValoresCliente = ReturnType<typeof desdeFormData>;

export type EstadoCliente =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | {
      estado: 'error';
      mensaje?: string;
      errores?: Record<string, string[] | undefined>;
      /** Lo que la persona escribió, para no borrárselo cuando algo falla. */
      valores: ValoresCliente;
    };

export type EstadoBorrarCliente =
  | { estado: 'inicial' }
  | { estado: 'ok' }
  | { estado: 'error'; mensaje: string };

export function desdeFormData(formData: FormData) {
  const campo = (nombre: string) => (formData.get(nombre) ?? '').toString();
  return {
    id: campo('id'),
    portafolio_id: campo('portafolio_id'),
    nombre: campo('nombre'),
    telefono: campo('telefono'),
    nota: campo('nota'),
    etapa: campo('etapa'),
    proximo_contacto: campo('proximo_contacto'),
  };
}
