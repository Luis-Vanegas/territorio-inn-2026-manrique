'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { verificarSesion } from '@/lib/auth/admin';
import { guardarRegistro } from '@/lib/registro/guardar';
import { origenDe } from '@/lib/sitio';
import type { EstadoRegistro } from './registrarPortafolio';

const constancia = z.enum(['verbal_presencial', 'firma_papel'], {
  error: 'Indica cómo autorizó la persona el tratamiento de sus datos.',
});

/**
 * Registro asistido: el equipo registra en campo a quien no tiene Google, con
 * la persona presente. `origen_registro = 'asistido'`; `capturado_por` es el
 * correo de `admin_session` (jamás un campo del formulario) y
 * `consentimiento_asistido` dice cómo autorizó el titular: la base rechaza un
 * asistido sin ambos (`portafolios_asistido_exige_constancia`, 027).
 *
 * Queda sin cuenta y 'pendiente'. Devuelve el enlace personal (token) para
 * «Enviar acceso» por WhatsApp, el mismo de «Cuenta y acceso»: al abrirlo y
 * entrar con Google, el negocio queda en la cuenta de la persona.
 */
export async function registrarAsistido(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión del equipo se cerró. Entra de nuevo.' };

  const consentimiento = constancia.safeParse(formData.get('consentimiento_asistido'));
  if (!consentimiento.success) {
    return { estado: 'error', errores: { consentimiento_asistido: [consentimiento.error.issues[0]!.message] } };
  }

  const r = await guardarRegistro(formData, {
    usuario_id: null,
    origen_registro: 'asistido',
    capturado_por: sesion.email,
    consentimiento_asistido: consentimiento.data,
    limitar: false,
    bitacora: { actor_tipo: 'equipo', actor: sesion.email },
  });
  if (r.estado === 'error') return r;

  revalidatePath('/firmamento/equipo', 'layout');

  return {
    estado: 'ok',
    nombre: r.nombre,
    enlace: `${origenDe(await headers())}/aliados/estado/${r.token_publico}`,
    whatsapp: r.whatsapp,
    fotoFallo: r.fotoFallo,
    menuFallo: r.menuFallo,
  };
}
