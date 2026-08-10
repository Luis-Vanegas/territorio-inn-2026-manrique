import 'server-only';
import { sql } from './neon';

export type EstadoPeticion = 'nueva' | 'atendida';

export type Peticion = {
  id: string;
  nombre: string;
  contacto: string;
  mensaje: string;
  estado: EstadoPeticion;
  atendido_por: string | null;
  atendido_en: string | null;
  creado_en: string;
};

export type NuevaPeticion = {
  nombre: string;
  contacto: string;
  mensaje: string;
  ip_registro: string | null;
};

export async function crearPeticion(datos: NuevaPeticion): Promise<string> {
  const rows = await sql`
    insert into peticiones (nombre, contacto, mensaje, ip_registro)
    values (${datos.nombre}, ${datos.contacto}, ${datos.mensaje}, ${datos.ip_registro})
    returning id
  `;
  return (rows[0] as { id: string }).id;
}

export async function listarPeticiones(
  estado: EstadoPeticion = 'nueva',
): Promise<Peticion[]> {
  const rows = await sql`
    select id, nombre, contacto, mensaje, estado, atendido_por, atendido_en, creado_en
    from peticiones
    where estado = ${estado}
    order by creado_en asc
  `;
  return rows as Peticion[];
}

export async function contarPorEstado(): Promise<Record<EstadoPeticion, number>> {
  const rows = (await sql`
    select estado, count(*)::int as total
    from peticiones
    group by estado
  `) as { estado: EstadoPeticion; total: number }[];

  const base: Record<EstadoPeticion, number> = { nueva: 0, atendida: 0 };
  for (const r of rows) base[r.estado] = r.total;
  return base;
}

/** Mismo criterio que moderar() en portafolios.repo: el where evita que dos
 * admins con la pestaña abierta se pisen. */
export async function marcarAtendida(
  id: string,
  adminEmail: string,
): Promise<boolean> {
  const rows = await sql`
    update peticiones
    set estado = 'atendida', atendido_por = ${adminEmail}, atendido_en = now()
    where id = ${id} and estado <> 'atendida'
    returning id
  `;
  return rows.length > 0;
}
