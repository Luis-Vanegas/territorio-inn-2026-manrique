// sitemap.xml generado por Next (convención de archivo, sin dependencias).
//
// La lista es explícita y no derivada de un recorrido del filesystem: las
// rutas que hay que excluir (/admin, /aliados/estado/[token], /api) son
// justamente las sensibles, y una lista negra se olvida de actualizar cuando
// aparece una ruta nueva. Enumerar lo público falla del lado seguro: si alguien
// suma una página y no la agrega acá, el costo es que tarde en indexarse — no
// que se filtre un panel.
//
// Los negocios no llevan URL propia: /aliados los muestra a todos en una sola
// página y el detalle es un ancla (#id). No hay nada por negocio que listar.

import type { MetadataRoute } from 'next';
import { urlSitio } from '@/lib/sitio';

// Mismos flags que usa lib/content.ts. Con el flag apagado la ruta devuelve un
// 404 real, así que listarla sería mandar al buscador contra una página muerta.
const SERVICIOS_ACTIVO = process.env.NEXT_PUBLIC_MODULO_SERVICIOS === 'true';
const INVENTARIO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_INVENTARIO === 'true';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlSitio();
  const ahora = new Date();

  const rutas: { ruta: string; prioridad: number }[] = [
    { ruta: '', prioridad: 1 },
    { ruta: '/aliados', prioridad: 0.9 },
    { ruta: '/aliados/registro', prioridad: 0.8 },
    { ruta: '/contacto', prioridad: 0.5 },
    { ruta: '/legal/terminos', prioridad: 0.3 },
    { ruta: '/legal/politica-datos', prioridad: 0.3 },
    ...(SERVICIOS_ACTIVO
      ? [
          { ruta: '/servicios', prioridad: 0.9 },
          { ruta: '/servicios/registro', prioridad: 0.8 },
          { ruta: '/legal/servicios', prioridad: 0.3 },
        ]
      : []),
    ...(INVENTARIO_ACTIVO ? [{ ruta: '/inventario-predictivo', prioridad: 0.4 }] : []),
  ];

  return rutas.map(({ ruta, prioridad }) => ({
    url: `${base}${ruta}`,
    lastModified: ahora,
    priority: prioridad,
  }));
}
