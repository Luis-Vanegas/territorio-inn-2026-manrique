'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

import {
  actualizarPortafolio,
  borrarPortafolio,
  type EstadoEdicion,
} from '@/lib/actions/gestionarEstado';
import type { Categoria, PortafolioAdmin } from '@/lib/db/portafolios.repo';
import { Asesor } from '@/components/Asesor';
import { FormularioEdicionPortafolio } from '@/components/FormularioEdicionPortafolio';

const ESTADO_INICIAL: EstadoEdicion = { estado: 'inicial' };

// ─── encabezado de estado ───────────────────────────────────────────────

function EncabezadoEstado({ portafolio }: { portafolio: PortafolioAdmin }) {
  if (portafolio.estado === 'archivado') {
    return (
      <div className="border-l-2 border-tinta/20 bg-tinta/[0.03] px-5 py-4">
        <p className="font-sans text-sm text-tinta/70">Este registro está borrado.</p>
        <p className="mt-1 font-sans text-sm text-tinta/65">
          Si te equivocaste o quieres volver a aparecer en el mapa, registra tu negocio de nuevo.
        </p>
        <Link
          href="/aliados/registro"
          className="mt-3 inline-block font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4 hover:text-azul-texto/80"
        >
          Registrar de nuevo →
        </Link>
      </div>
    );
  }

  if (portafolio.estado === 'aprobado') {
    return (
      <div className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4">
        <p className="font-sans text-sm text-azul-texto">¡Publicado!</p>
        <p className="mt-1 font-sans text-sm text-tinta/70">
          Tu negocio ya está en el mapa de Aliados.
        </p>
        <Link
          href="/aliados"
          className="mt-3 inline-block font-sans text-sm text-tinta/60 underline decoration-azul underline-offset-4 hover:text-azul-texto"
        >
          Verlo en el mapa →
        </Link>
      </div>
    );
  }

  if (portafolio.estado === 'rechazado') {
    return (
      <div className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4">
        <p className="font-sans text-sm text-azul-texto">No lo pudimos publicar todavía</p>
        {portafolio.motivo_rechazo && (
          <p className="mt-2 font-sans text-sm leading-relaxed text-tinta">
            {portafolio.motivo_rechazo}
          </p>
        )}
        <p className="mt-2 font-sans text-sm text-tinta/60">
          Corrige lo que haga falta en el formulario de abajo y guarda — lo volvemos a revisar.
        </p>
      </div>
    );
  }

  // pendiente
  return (
    <div className="border-l-2 border-tinta/20 bg-tinta/[0.02] px-5 py-4">
      <p className="font-sans text-sm text-tinta">Lo estamos revisando</p>
      <p className="mt-1 font-sans text-sm text-tinta/60">
        Tu negocio va a aparecer en el mapa apenas lo aprobemos.
      </p>
    </div>
  );
}

// ─── guardar enlace por WhatsApp ────────────────────────────────────────

function GuardarEnlace({ nombre }: { nombre: string }) {
  const [url] = useState(() => (typeof window !== 'undefined' ? window.location.href : ''));

  if (!url) return null;

  const mensaje = `Guarda este enlace para ver o corregir el registro de ${nombre}: ${url}`;
  const href = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 self-start border border-tinta/20 px-4 py-2.5 font-sans text-sm text-tinta/70 transition-colors hover:border-azul-texto hover:text-azul-texto"
    >
      <span aria-hidden="true">↗</span>
      Guardar este enlace por WhatsApp
    </a>
  );
}

// ─── borrar mi negocio ───────────────────────────────────────────────────

function BorrarNegocio({
  token,
  alBorrar,
}: {
  token: string;
  alBorrar: () => void;
}) {
  const [estado, setEstado] = useState<EstadoEdicion>(ESTADO_INICIAL);
  const [borrando, setBorrando] = useState(false);

  const handleBorrar = useCallback(async () => {
    if (!window.confirm('¿Seguro que quieres borrar tu negocio del directorio?')) return;

    setBorrando(true);
    const resultado = await borrarPortafolio(token);
    setBorrando(false);
    setEstado(resultado);
    if (resultado.estado === 'ok') alBorrar();
  }, [token, alBorrar]);

  return (
    <div className="border-t border-tinta/12 pt-8">
      <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/60">
        Borrar mi negocio
      </h2>
      <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
        Esto saca tu negocio del directorio y del mapa. No se puede deshacer — si más adelante
        quieres volver a aparecer, tienes que registrarte de nuevo.
      </p>

      {estado.estado === 'error' && (
        <p role="alert" className="mt-3 font-sans text-sm text-azul-texto">
          {estado.mensaje}
        </p>
      )}

      <button
        type="button"
        onClick={handleBorrar}
        disabled={borrando}
        className="mt-4 min-h-11 border border-azul-texto px-5 py-2.5 font-sans text-sm text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso disabled:cursor-not-allowed disabled:opacity-50"
      >
        {borrando ? 'Borrando…' : 'Borrar mi negocio'}
      </button>
    </div>
  );
}

// ─── componente principal ────────────────────────────────────────────────

export function EstadoAliado({
  portafolio,
  token,
  categorias,
  fotoFallo,
  menuFallo,
  asesorActivo,
}: {
  portafolio: PortafolioAdmin;
  token: string;
  categorias: Categoria[];
  /** Viene de ?foto=error en la URL: la foto del registro original no se pudo subir. */
  fotoFallo?: boolean;
  /** Viene de ?menu=error en la URL: el menú del registro original no se pudo subir. */
  menuFallo?: boolean;
  /**
   * Si hay credencial del modelo configurada. Lo resuelve la página (Server
   * Component) porque `asesorConfigurado()` es server-only: este componente
   * corre en el cliente y no puede leer process.env.
   *
   * Sin credencial no se muestra la sección: ofrecer un formulario que siempre
   * devuelve "no está disponible" es peor que no ofrecerlo.
   */
  asesorActivo: boolean;
}) {
  const [borrado, setBorrado] = useState(false);

  const mostrarFormulario = portafolio.estado !== 'archivado' && !borrado;

  return (
    <div className="max-w-3xl">
      <span className="font-sans text-xs text-tinta/65">Aliados · Tu registro</span>

      <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-5xl">
        {portafolio.nombre}
      </h1>

      <div className="mt-8 flex flex-col gap-4">
        {fotoFallo && !borrado && (
          <p role="alert" className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4 font-sans text-sm leading-relaxed text-tinta">
            Tu negocio quedó guardado, pero la foto no se pudo subir. Subila de nuevo más abajo, en la sección Una foto.
          </p>
        )}

        {menuFallo && !borrado && (
          <p role="alert" className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4 font-sans text-sm leading-relaxed text-tinta">
            Tu negocio quedó guardado, pero el menú no se pudo subir. Subilo de nuevo más abajo, en la sección Menú o flyer.
          </p>
        )}

        {borrado ? (
          <div className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4">
            <p className="font-sans text-sm text-azul-texto">Tu negocio se borró del directorio.</p>
            <Link
              href="/aliados"
              className="mt-3 inline-block font-sans text-sm text-tinta/60 underline decoration-azul underline-offset-4 hover:text-azul-texto"
            >
              Volver al mapa →
            </Link>
          </div>
        ) : (
          <EncabezadoEstado portafolio={portafolio} />
        )}

        {!borrado && <GuardarEnlace nombre={portafolio.nombre} />}
      </div>

      {/* El asesor va antes del formulario: es lo que la persona vino a buscar.
          Corregir la dirección es mantenimiento; esto es el beneficio de estar
          registrado. Se muestra incluso con el registro pendiente de moderación
          — que su ficha todavía no esté pública no le quita el derecho a
          preguntar cómo formalizarse. */}
      {mostrarFormulario && asesorActivo && <Asesor token={token} />}

      {mostrarFormulario && (
        <>
          <FormularioEdicionPortafolio
            portafolio={portafolio}
            categorias={categorias}
            accion={actualizarPortafolio.bind(null, token)}
          />
          <BorrarNegocio token={token} alBorrar={() => setBorrado(true)} />
        </>
      )}

      <Link
        href="/aliados"
        className="mt-16 inline-block font-sans text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
      >
        ← Volver al mapa
      </Link>
    </div>
  );
}
