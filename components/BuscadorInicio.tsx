import { listarAprobados } from '@/lib/db/portafolios.repo';
import type { NegocioBuscable } from '@/lib/busqueda';
import { BuscadorNegocios } from './BuscadorNegocios';

/**
 * Trae los negocios para el buscador de la portada. `listarAprobados` sale de
 * la caché de la vitrina, que la portada ya pide: no suma consultas a la base.
 *
 * Sin aliados el buscador igual se muestra: los comercios de OpenStreetMap
 * entran a la misma búsqueda, como en /aliados.
 *
 * Al navegador baja solo lo que la búsqueda usa, no la ficha completa
 * (teléfonos, redes, campos extra): esos viajan recién en /aliados.
 */
export async function BuscadorInicio() {
  const aprobados = await listarAprobados();

  const negocios: NegocioBuscable[] = aprobados.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    categoria_id: p.categoria_id,
    categoria_nombre: p.categoria_nombre,
    categoria_otra: p.categoria_otra,
    barrio: p.barrio,
    productos: p.productos.map((prod) => ({ nombre: prod.nombre, precio: null })),
  }));

  // Las categorías con más negocios: sugerir algo que no existe en el barrio
  // sería invitar a una búsqueda vacía.
  const porCategoria = new Map<string, number>();
  for (const n of negocios) {
    if (n.categoria_id === 'otros') continue;
    porCategoria.set(n.categoria_nombre, (porCategoria.get(n.categoria_nombre) ?? 0) + 1);
  }
  const sugerencias = [...porCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nombre]) => nombre.split(' y ')[0]!);

  return <BuscadorNegocios negocios={negocios} sugerencias={sugerencias} />;
}
