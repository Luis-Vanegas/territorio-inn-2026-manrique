import type { Metadata } from 'next';

import { CLASE_BOTON_PANEL, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { obtenerDatosAbiertos, type DatosAbiertos } from '@/lib/db/datos.repo';

export const metadata: Metadata = { title: 'Datos abiertos' };

export const dynamic = 'force-dynamic';

// En tercera persona: las etiquetas del registro hablan como el negocio.
const FORMALIDAD: Record<string, string> = {
  rut_camara: 'Con RUT o Cámara de Comercio',
  en_tramite: 'En trámite',
  no_tengo: 'Sin formalizar',
  prefiero_no_decir: 'Prefirió no decir',
};

const DOLOR: Record<string, string> = {
  cuentas_ganancia: 'Llevar las cuentas y saber la ganancia',
  inventario_vencimientos: 'Controlar inventario y vencimientos',
  clientes_redes: 'Conseguir clientes y manejar redes',
  cobros_facturas: 'Cobrar y facturar',
  todo_bajo_control: 'Dice tener todo bajo control',
  otro: 'Otras respuestas (opciones viejas del formulario)',
};

function TablaCeldas({
  titulo,
  id,
  filas,
  nota,
}: {
  titulo: string;
  id: string;
  filas: { clave: string; nombre: string; negocios: number | string }[];
  nota?: string;
}) {
  return (
    <Tarjeta titulo={titulo} id={id}>
      <table className="w-full border-collapse">
        <caption className="sr-only">{titulo}: negocios aprobados por opción</caption>
        <thead>
          <tr>
            <th scope="col" className="py-2 pr-3 text-left font-sans text-xs font-medium text-tinta/70">Opción</th>
            <th scope="col" className="py-2 text-right font-sans text-xs font-medium text-tinta/70">Negocios</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.clave}>
              <th scope="row" className="border-t border-tinta/12 py-2 pr-3 text-left font-sans text-sm font-normal text-tinta">
                {f.nombre}
              </th>
              <td className="border-t border-tinta/12 py-2 text-right font-sans text-sm text-tinta tabular-nums">{f.negocios}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {nota && <p className="mt-3 font-sans text-sm text-tinta/70">{nota}</p>}
    </Tarjeta>
  );
}

/**
 * Vista previa de lo que publica `GET /api/datos`: se lee del mismo repo
 * (`obtenerDatosAbiertos`, regla k = 5), no con un fetch a nuestra propia API,
 * así que lo que ve el equipo es exactamente lo que sale.
 */
export default async function DatosAbiertosPage() {
  await exigirEquipo();

  let datos: DatosAbiertos | null = null;
  try {
    datos = await obtenerDatosAbiertos();
  } catch (e) {
    console.error('[equipo/datos] datos abiertos', e instanceof Error ? e.message : e);
  }

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta titulo="Qué publica /api/datos" id="titulo-que">
        <p className="max-w-prose font-sans text-base leading-relaxed text-tinta/70">
          Conteos de negocios <strong className="font-medium text-tinta">aprobados</strong>, por
          categoría, barrio, formalidad y mayor dificultad. Toda celda con menos de 5
          negocios sale como «&lt;5», también los ceros; en categorías y barrios, si
          queda una sola celda escondida se esconde también la menor visible, para que
          no se pueda deducir restando del total. Lo usan /firmamento, el panel de las
          entidades y cualquiera desde afuera (CORS abierto, caché de 1 hora).
        </p>
        <p className="mt-3 max-w-prose font-sans text-base leading-relaxed text-tinta/70">
          Nunca salen: nombres de negocios, WhatsApp, teléfonos, correos, redes,
          direcciones, coordenadas, fotos, enlaces de edición, IP ni la respuesta de
          ninguna persona (Ley 1581 de 2012).
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/api/datos" target="_blank" rel="noopener noreferrer" className={CLASE_BOTON_PANEL}>
            Ver el JSON (se abre en otra pestaña)
          </a>
          <a href="/api/admin/exportar?conjunto=datos" download className={CLASE_BOTON_PANEL}>
            Descargar CSV
          </a>
        </div>
      </Tarjeta>

      {!datos ? (
        <p role="alert" className="font-sans text-base text-tinta/70">
          No pudimos consultar la base para la vista previa. El JSON de arriba lo
          intenta de nuevo.
        </p>
      ) : (
        <>
          <p className="font-sans text-base text-tinta/70">
            Negocios aprobados:{' '}
            <span className="font-cifra text-2xl text-azul-texto">{datos.negocios_aprobados}</span>
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <TablaCeldas
              titulo="Por categoría"
              id="titulo-cat"
              filas={datos.por_categoria.map((c) => ({ clave: c.id, nombre: c.nombre, negocios: c.negocios }))}
            />
            <TablaCeldas
              titulo="Por barrio"
              id="titulo-barrio"
              filas={datos.por_barrio.map((b) => ({ clave: b.nombre, nombre: b.nombre, negocios: b.negocios }))}
              nota="El barrio que escribió cada negocio; lo que no es uno de los 15 se agrupa en «Otro barrio»."
            />
            <TablaCeldas
              titulo="Por formalidad"
              id="titulo-formalidad"
              filas={datos.por_formalidad.map((f) => ({ clave: f.id, nombre: FORMALIDAD[f.id] ?? f.id, negocios: f.negocios }))}
              nota="No es una partición: hay quien no responde."
            />
            <TablaCeldas
              titulo="Por mayor dificultad"
              id="titulo-dolor"
              filas={datos.por_mayor_dolor.map((f) => ({ clave: f.id, nombre: DOLOR[f.id] ?? f.id, negocios: f.negocios }))}
              nota="Cada negocio puede elegir hasta dos: las celdas no suman el total."
            />
          </div>
          <LineaFuente>
            Fuente: {datos.fuente} · generado {datos.generado_en.slice(0, 16).replace('T', ' ')} UTC
          </LineaFuente>
        </>
      )}
    </div>
  );
}
