import { PASOS, VIDEOS } from '@/lib/formalizacion';
import { GUIAS, MARCA, guiaPorSlug, type Coleccion } from '@/lib/marca';
import { VENTAS } from '@/lib/ventas';

/**
 * Guías de «Para ti» según lo que ESE negocio marcó como su mayor dificultad en el
 * registro (`aliados_investigacion.mayor_dolor`, lo lee `dificultadesDeNegocio`).
 * Solo enlaza a rutas que existen: las guías salen de las colecciones por `slug`
 * (si una guía se renombra o se quita, desaparece de aquí en vez de dar 404).
 * Sin respuesta, «prefiero no decir» u opciones viejas del CHECK (`proveedores`,
 * `otro`…): las guías generales de siempre.
 */

export type GuiaSugerida = { titulo: string; texto: string; href: string; accion: string };

export type DificultadConGuias = { id: string; etiqueta: string; guias: GuiaSugerida[] };

const FORMALIZACION: GuiaSugerida = {
  titulo: 'Rutas de formalización',
  texto: `${PASOS.length} trámites, apoyos económicos y formación gratuita, con el enlace oficial de cada uno.`,
  href: '/formalizacion',
  accion: 'Ver las rutas',
};

const VIDEOS_GUIA: GuiaSugerida = {
  titulo: 'Videos y tutoriales',
  texto: `${VIDEOS.length} canales oficiales donde explican los trámites paso a paso.`,
  href: '/formalizacion#videos',
  accion: 'Ver los videos',
};

const MARCA_INDICE: GuiaSugerida = {
  titulo: 'Marca',
  texto: `${GUIAS.length} guías del equipo: fotos, redes, contenido y cómo presentar tu negocio.`,
  href: '/marca',
  accion: 'Ver las guías de marca',
};

const VENTAS_INDICE: GuiaSugerida = {
  titulo: 'Ventas',
  texto: `${VENTAS.guias.length} guías para vender mejor: mensajes, seguimiento y cómo atender a quien te escribe.`,
  href: '/ventas',
  accion: 'Ver las guías de ventas',
};

const MIS_CLIENTES: GuiaSugerida = {
  titulo: 'Mis clientes',
  texto: 'Anota a quién le vendiste o quién te debe, con una nota, y escríbele por WhatsApp desde aquí.',
  href: '/firmamento/negocio/clientes',
  accion: 'Abrir mis clientes',
};

export const GUIAS_GENERALES: GuiaSugerida[] = [FORMALIZACION, VIDEOS_GUIA, MARCA_INDICE, VENTAS_INDICE];

function guia(coleccion: Coleccion, base: string, slug: string): GuiaSugerida | null {
  const g = guiaPorSlug(coleccion, slug);
  return g ? { titulo: g.titulo, texto: g.resumen, href: `${base}/${g.slug}`, accion: 'Leer la guía' } : null;
}

/** En segunda persona: la lee el dueño que lo respondió. */
const POR_DIFICULTAD: Record<string, { etiqueta: string; guias: () => (GuiaSugerida | null)[] }> = {
  cuentas_ganancia: {
    etiqueta: 'Llevar las cuentas y saber cuánto ganas',
    guias: () => [guia(VENTAS, '/ventas', 'mide-para-crecer'), FORMALIZACION],
  },
  inventario_vencimientos: {
    etiqueta: 'Controlar el inventario y los vencimientos',
    guias: () => [guia(VENTAS, '/ventas', 'mide-para-crecer'), guia(VENTAS, '/ventas', 'crm-y-embudo')],
  },
  clientes_redes: {
    etiqueta: 'Conseguir clientes y manejar tus redes',
    guias: () => [
      guia(VENTAS, '/ventas', 'identifica-a-tu-cliente'),
      guia(MARCA, '/marca', 'whatsapp'),
      guia(MARCA, '/marca', 'instagram'),
    ],
  },
  cobros_facturas: {
    etiqueta: 'Cobrar y facturar',
    guias: () => [MIS_CLIENTES, FORMALIZACION],
  },
  todo_bajo_control: {
    etiqueta: 'Dijiste que tienes todo bajo control: para crecer',
    guias: () => [guia(VENTAS, '/ventas', 'mide-para-crecer'), guia(MARCA, '/marca', 'tu-pitch')],
  },
};

export function guiasParaTi(dificultades: readonly string[]): {
  dificultades: DificultadConGuias[];
  generales: GuiaSugerida[];
} {
  const vistas = new Set<string>();
  const propias: DificultadConGuias[] = [];

  for (const id of dificultades) {
    const regla = POR_DIFICULTAD[id];
    if (!regla) continue;
    const guias = regla.guias().filter((g): g is GuiaSugerida => g !== null && !vistas.has(g.href));
    guias.forEach((g) => vistas.add(g.href));
    if (guias.length > 0) propias.push({ id, etiqueta: regla.etiqueta, guias });
  }

  return { dificultades: propias, generales: GUIAS_GENERALES.filter((g) => !vistas.has(g.href)) };
}
