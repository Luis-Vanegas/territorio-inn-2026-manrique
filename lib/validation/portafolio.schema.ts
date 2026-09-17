import { z } from 'zod';

/**
 * Schema compartido entre el formulario (cliente) y la server action.
 * Una sola definición: si el cliente y el server validan distinto, el usuario
 * llena el formulario, pasa la validación y el server se lo rechaza igual.
 *
 * Este es el piso de validación, no el techo: la base tiene sus propios CHECK
 * de rango real (-90..90 / -180..180) como última línea de defensa.
 */

/** Se sube cuando cambie el texto legal. Queda grabado en cada registro. */
// v2: se saca la mención al ITM como responsable del tratamiento y se abre
// la ubicación a cualquier punto del mundo (antes limitada a Manrique).
// v3: se agrega la cláusula de transferencia internacional de datos (Decreto
// 1377 de 2013, art. 26) — la base y el Blob viven fuera de Colombia.
export const VERSION_TERMINOS = '2026-09-v3';

export const TIPOS_FOTO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const TAMANO_MAX_FOTO = 5 * 1024 * 1024;

export const OPCIONES_HORARIO = [
  'mananas',
  'tardes',
  'noches',
  'fines_semana',
  'bajo_pedido',
] as const;
export const OPCIONES_MEDIOS_PAGO = [
  'efectivo',
  'nequi',
  'daviplata',
  'transferencia',
  'datafono',
] as const;

// ─── Investigación (privado — nunca se publica, va a aliados_investigacion) ───
// Recortada a los dos campos que alimentan código vivo (029): `formalidad`
// personaliza /formalizacion, `mayor_dolor` es contexto del asesor de IA.
// El resto (nombre del dueño, tipo_negocio viejo, necesidad_crecer) se sacó
// del formulario y de la base — no tenía ningún consumidor fuera de esta
// sección.

export const OPCIONES_FORMALIDAD = [
  'rut_camara',
  'en_tramite',
  'no_tengo',
  'prefiero_no_decir',
] as const;
// v2 (redacción del cliente, 2026-08-17): se acorta de 10 opciones a 5 —
// el cliente había preguntado si la lista original era muy larga.
/**
 * Cinco opciones, no las diez originales: el cliente reescribió la pregunta 6 con
 * su propio texto y la acortó (commit 78710f9). No es una lista a medio terminar.
 *
 * ── Por qué el CHECK de la base admite más valores que esta lista ──
 *
 * La migración 019 acepta nueve (`costos_arriendo`, `proveedores`,
 * `acceso_credito`, `atender_solo`, `otro` además de estos cinco) y eso es
 * correcto: hay respuestas reales guardadas con las opciones viejas —dos vecinos
 * eligieron `proveedores` antes del recorte— y una restricción no puede dejar de
 * admitir lo que la tabla ya contiene.
 *
 * **No escribas una migración que angoste ese CHECK a estos cinco valores.** Falla
 * contra esas filas, y "arreglarlo" borrando respuestas de una investigación no es
 * una opción. La base es el límite exterior; esta lista es lo que la app ofrece hoy.
 * Que sean distintos es el diseño, no un bug.
 *
 * `mayor_dolor_otro` quedó sin usar por el mismo recorte (cero filas la tienen).
 * Se deja: es una columna vacía y nullable, y borrarla obliga a tocar producción
 * para ganar nada.
 */
export const OPCIONES_MAYOR_DOLOR = [
  'cuentas_ganancia',
  'inventario_vencimientos',
  'clientes_redes',
  'cobros_facturas',
  'todo_bajo_control',
] as const;

/**
 * Acepta formatos colombianos: "3001234567", "300 123 4567", "+57 300 1234567",
 * "604 1234567". Se guarda como lo escribió la persona; normalizar acá haría
 * que el número mostrado no coincida con el que dictó.
 */
const telefonoColombiano = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,14}$/, 'Número inválido. Ej: 300 123 4567');

/** Campo opcional que llega como "" desde un input vacío. */
const opcional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal('')]).transform((v) => (v === '' ? null : v));

/**
 * "@usuario", "usuario", "instagram.com/usuario" o una URL completa: todo
 * termina en una URL usable en un href. Si ya parece una URL, se respeta tal
 * cual (evita convertir un link a una publicación puntual en el perfil).
 */
const normalizarRedSocial = (dominio: string) => (valor: string) => {
  const limpio = valor.trim();
  if (!limpio || /^https?:\/\//i.test(limpio)) return limpio;
  const sinArroba = limpio.replace(/^@/, '').replace(/^\/+/, '');
  if (sinArroba.toLowerCase().startsWith(dominio)) return `https://${sinArroba}`;
  return `https://${dominio}/${sinArroba}`;
};

export type ProductoInput = { nombre: string; precio: string | null };

/**
 * "Empanadas - $2000" → { nombre: 'Empanadas', precio: '$2000' }.
 * Split en el primer guion rodeado de espacios: un nombre con guion propio
 * ("Combo 2 - para 3 - $15000") cae completo del lado del precio, que es el
 * error más inofensivo posible acá — no vale un parser real para una
 * textarea de formato libre.
 */
function parseLineaProducto(linea: string): ProductoInput {
  const [nombre, ...resto] = linea.split(/\s*-\s*/);
  return { nombre: (nombre ?? '').trim(), precio: resto.join(' - ').trim() || null };
}

/** Tope de 20 líneas: ni un negocio real tiene una carta de 40 productos, y sin tope un textarea es un vector de payload gigante. */
export function parseProductos(texto: string): ProductoInput[] {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map(parseLineaProducto)
    .filter((p) => p.nombre.length > 0);
}

/** Inverso de `parseProductos`, para precargar el textarea al editar. */
export function serializarProductos(productos: ProductoInput[]): string {
  return productos.map((p) => (p.precio ? `${p.nombre} - ${p.precio}` : p.nombre)).join('\n');
}

// Objeto base, separado del `.refine()` de abajo: así `actualizarPortafolioSchema`
// puede hacer `.omit()` sobre los campos que no aplican a una edición (nada de
// investigación, nada de re-aceptar consentimiento) sin duplicar cada campo.
const camposPortafolio = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'Máximo 80 caracteres'),

    descripcion: opcional(z.string().trim().max(400, 'Máximo 400 caracteres')),

    categoria_id: z.string().min(1, 'Elige una categoría'),
    // Solo se usa cuando categoria_id = 'otros'. Separado de descripcion:
    // un "qué categoría sos" corto, no un texto libre largo.
    categoria_otra: opcional(z.string().trim().max(60, 'Máximo 60 caracteres')),

    direccion: z
      .string()
      .trim()
      .min(5, 'Escribe la dirección completa')
      .max(200, 'Máximo 200 caracteres'),
    barrio: z
      .string()
      .trim()
      .min(2, 'Indica el barrio')
      .max(80, 'Máximo 80 caracteres'),
    punto_referencia: opcional(z.string().trim().max(120, 'Máximo 120 caracteres')),

    // Rango real de coordenadas válidas, no acotado a Manrique: el registro
    // acepta cualquier punto del mundo mientras se junta volumen de prueba.
    latitud: z
      .number({ error: 'Marca la ubicación en el mapa' })
      .min(-90, 'Latitud inválida')
      .max(90, 'Latitud inválida'),
    longitud: z
      .number({ error: 'Marca la ubicación en el mapa' })
      .min(-180, 'Longitud inválida')
      .max(180, 'Longitud inválida'),

    // El canal real de contacto: obligatorio, no "uno de cinco". Sin teléfono
    // fijo: a pedido explícito, nadie en Manrique lo usa como canal real.
    whatsapp: telefonoColombiano,
    correo: opcional(z.email('Correo inválido')),
    instagram: opcional(z.string().trim().max(80).transform(normalizarRedSocial('instagram.com'))),
    // Genérico a propósito: reemplaza el campo fijo de Facebook — cualquier
    // otra red o página, oculta en la UI hasta que la persona la pida.
    facebook: opcional(z.string().trim().max(120).transform(normalizarRedSocial('facebook.com'))),

    horario: z.array(z.enum(OPCIONES_HORARIO)).optional().default([]),
    medios_pago: z.array(z.enum(OPCIONES_MEDIOS_PAGO)).optional().default([]),

    // Texto libre "PRODUCTO - $PRECIO" por línea, parseado a estructura acá
    // mismo — el resto de la app (repo, formulario de edición) solo ve el
    // array ya armado, nunca el texto crudo.
    productos: z.string().trim().max(2000, 'Máximo 2000 caracteres').transform(parseProductos),

    // Investigación — nunca se publica (va a aliados_investigacion, no a
    // portafolios). Recortada a los dos campos con consumidor real: ambos
    // opcionales, a pedido del cliente (antes tipo_negocio y mayor_dolor
    // eran obligatorios).
    formalidad: opcional(z.enum(OPCIONES_FORMALIDAD)),
    mayor_dolor: z.array(z.enum(OPCIONES_MAYOR_DOLOR)).optional().default([]),

    acepto_terminos: z.literal(true, {
      error: 'Debes aceptar los términos y condiciones',
    }),
    acepto_habeas_data: z.literal(true, {
      error: 'Debes autorizar el tratamiento de datos',
    }),
  });

export const portafolioSchema = camposPortafolio
  .refine((d) => d.mayor_dolor.length <= 2, {
    message: 'Elige como máximo 2',
    path: ['mayor_dolor'],
  })
  .refine(
    (d) => !(d.mayor_dolor.includes('todo_bajo_control') && d.mayor_dolor.length > 1),
    {
      message: '"Todo bajo control" no se combina con otra opción',
      path: ['mayor_dolor'],
    },
  );

export type PortafolioInput = z.infer<typeof portafolioSchema>;

/**
 * Para /aliados/estado/[token]: la persona corrige los datos de su propio
 * negocio, ya publicado o pendiente. Sin campos de investigación (esos no se
 * vuelven a preguntar) ni de consentimiento (ya lo dio al registrarse; volver
 * a pedirlo en cada corrección de una coma sería fricción sin sentido legal
 * — el consentimiento cubre el tratamiento de los datos, no cada valor puntual).
 */
export const actualizarPortafolioSchema = camposPortafolio.omit({
  formalidad: true,
  mayor_dolor: true,
  acepto_terminos: true,
  acepto_habeas_data: true,
});

export type ActualizarPortafolioInput = z.infer<typeof actualizarPortafolioSchema>;

/**
 * Arma el objeto a validar desde el FormData de la server action.
 * Vive acá, al lado del schema, para que agregar un campo sea un solo archivo.
 */
export function desdeFormData(formData: FormData) {
  const texto = (k: string) => (formData.get(k) ?? '').toString();
  const numero = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === '') return undefined; // undefined dispara invalid_type_error
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    nombre: texto('nombre'),
    descripcion: texto('descripcion'),
    // Categoría opcional a nivel app (029): en blanco cae a 'otros', la
    // categoría "sin especificar" que ya existe desde la migración 001 —
    // así la columna sigue not null y ningún JOIN de lectura pública cambia.
    categoria_id: texto('categoria_id') || 'otros',
    categoria_otra: texto('categoria_otra'),
    direccion: texto('direccion'),
    barrio: texto('barrio'),
    punto_referencia: texto('punto_referencia'),
    latitud: numero('latitud'),
    longitud: numero('longitud'),
    whatsapp: texto('whatsapp'),
    correo: texto('correo'),
    instagram: texto('instagram'),
    facebook: texto('facebook'),
    horario: formData.getAll('horario').map(String),
    medios_pago: formData.getAll('medios_pago').map(String),
    productos: texto('productos'),
    formalidad: texto('formalidad'),
    mayor_dolor: formData.getAll('mayor_dolor').map(String),
    acepto_terminos: formData.get('acepto_terminos') === 'on',
    acepto_habeas_data: formData.get('acepto_habeas_data') === 'on',
  };
}

/** Igual que `desdeFormData`, pero solo los campos que `actualizarPortafolioSchema` valida. */
export function desdeFormDataEdicion(formData: FormData) {
  const texto = (k: string) => (formData.get(k) ?? '').toString();
  const numero = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    nombre: texto('nombre'),
    descripcion: texto('descripcion'),
    categoria_id: texto('categoria_id') || 'otros',
    categoria_otra: texto('categoria_otra'),
    direccion: texto('direccion'),
    barrio: texto('barrio'),
    punto_referencia: texto('punto_referencia'),
    latitud: numero('latitud'),
    longitud: numero('longitud'),
    whatsapp: texto('whatsapp'),
    correo: texto('correo'),
    instagram: texto('instagram'),
    facebook: texto('facebook'),
    horario: formData.getAll('horario').map(String),
    medios_pago: formData.getAll('medios_pago').map(String),
    productos: texto('productos'),
  };
}
