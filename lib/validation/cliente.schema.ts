import { z } from 'zod';

import { opcional, telefonoColombiano } from './portafolio.schema';

export const ETAPAS = ['interesado', 'seguimiento', 'compro', 'no_compro'] as const;

export const ETIQUETA_ETAPA: Record<(typeof ETAPAS)[number], string> = {
  interesado: 'Interesado',
  seguimiento: 'En seguimiento',
  compro: 'Compró',
  no_compro: 'No compró',
};

const uuid = z.string().uuid('Dato inválido. Recarga la página e intenta de nuevo.');

export const clienteSchema = z.object({
  /** Vacío = cliente nuevo. */
  id: opcional(uuid),
  portafolio_id: uuid,
  nombre: z.string().trim().min(1, 'Escribe cómo se llama tu cliente').max(80, 'Máximo 80 caracteres'),
  telefono: opcional(telefonoColombiano),
  nota: opcional(z.string().trim().max(500, 'Máximo 500 caracteres')),
  etapa: z.enum(ETAPAS),
  proximo_contacto: opcional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')),
});

export type EstadoCliente =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[] | undefined> };

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
