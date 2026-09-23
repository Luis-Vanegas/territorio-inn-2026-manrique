'use client';

import { useActionState, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

import {
  actualizarPortafolio,
  borrarPortafolio,
  type EstadoEdicion,
} from '@/lib/actions/gestionarEstado';
import { manejarSeleccionFoto } from '@/lib/imagen/comprimir';
import { serializarProductos } from '@/lib/validation/portafolio.schema';
import type { Categoria, PortafolioAdmin } from '@/lib/db/portafolios.repo';
import type { Posicion } from '@/app/(site)/aliados/registro/_components/SelectorUbicacionClient';
import { ChipsMultiple } from '@/app/(site)/aliados/registro/_components/Chips';
import { SelectConOtro } from '@/app/(site)/aliados/registro/_components/SelectConOtro';
import { CampoFormulario } from '@/components/CampoFormulario';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import { Asesor } from '@/components/Asesor';

// Misma lista que FormularioRegistro.tsx — copiada, no importada, para no
// acoplar dos rutas hermanas que solo comparten estos 15 nombres por
// coincidencia geográfica, no por dependencia real.
const OPCIONES_HORARIO_UI = [
  { valor: 'mananas', etiqueta: 'Mañanas' },
  { valor: 'tardes', etiqueta: 'Tardes' },
  { valor: 'noches', etiqueta: 'Noches' },
  { valor: 'fines_semana', etiqueta: 'Fines de semana' },
  { valor: 'bajo_pedido', etiqueta: 'Bajo pedido o cita' },
];

const OPCIONES_MEDIOS_PAGO_UI = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'nequi', etiqueta: 'Nequi' },
  { valor: 'daviplata', etiqueta: 'Daviplata' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'datafono', etiqueta: 'Datáfono' },
];

const SelectorUbicacion = dynamic(
  () => import('@/app/(site)/aliados/registro/_components/SelectorUbicacionClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[440px] w-full items-center justify-center border border-tinta/15 bg-tinta/[0.02] sm:h-[580px]">
        <span className="font-mono text-xs text-tinta/60">cargando mapa…</span>
      </div>
    ),
  },
);

const ESTADO_INICIAL: EstadoEdicion = { estado: 'inicial' };

// ─── piezas — copiadas de FormularioRegistro.tsx a propósito: son estilo,
// no lógica, y ese archivo es de solo lectura acá. ──────────────────────

function Seccion({
  numero,
  titulo,
  ayuda,
  ancho = 'angosto',
  children,
}: {
  numero: string;
  titulo: string;
  ayuda?: string;
  ancho?: 'angosto' | 'completo';
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-tinta/12 pt-8">
      <legend className="sr-only">{titulo}</legend>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-tinta/60">{numero}</span>
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/60">
          {titulo}
        </h2>
      </div>

      {ayuda && (
        <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
          {ayuda}
        </p>
      )}

      <div
        className={`mt-6 flex flex-col gap-6 ${ancho === 'angosto' ? 'max-w-xl' : ''}`}
      >
        {children}
      </div>
    </fieldset>
  );
}


const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-azul focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-azul';

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 border border-azul-texto bg-azul-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  );
}

// ─── encabezado de estado ───────────────────────────────────────────────

function EncabezadoEstado({ portafolio }: { portafolio: PortafolioAdmin }) {
  if (portafolio.estado === 'archivado') {
    return (
      <div className="border-l-2 border-tinta/20 bg-tinta/[0.03] px-5 py-4">
        <p className="font-mono text-sm text-tinta/70">Este registro está borrado.</p>
        <p className="mt-1 font-sans text-sm text-tinta/65">
          Si te equivocaste o quieres volver a aparecer en el mapa, registra tu negocio de nuevo.
        </p>
        <Link
          href="/aliados/registro"
          className="mt-3 inline-block font-mono text-sm text-azul-texto underline decoration-azul underline-offset-4 hover:text-azul-texto/80"
        >
          Registrar de nuevo →
        </Link>
      </div>
    );
  }

  if (portafolio.estado === 'aprobado') {
    return (
      <div className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4">
        <p className="font-mono text-sm text-azul-texto">¡Publicado!</p>
        <p className="mt-1 font-sans text-sm text-tinta/70">
          Tu negocio ya está en el mapa de Aliados.
        </p>
        <Link
          href="/aliados"
          className="mt-3 inline-block font-mono text-sm text-tinta/60 underline decoration-azul underline-offset-4 hover:text-azul-texto"
        >
          Verlo en el mapa →
        </Link>
      </div>
    );
  }

  if (portafolio.estado === 'rechazado') {
    return (
      <div className="border-l-2 border-azul bg-azul/[0.04] px-5 py-4">
        <p className="font-mono text-sm text-azul-texto">No lo pudimos publicar todavía</p>
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
      <p className="font-mono text-sm text-tinta">Lo estamos revisando</p>
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
      className="inline-flex min-h-11 items-center gap-2 self-start border border-tinta/20 px-4 py-2.5 font-mono text-sm text-tinta/70 transition-colors hover:border-azul-texto hover:text-azul-texto"
    >
      <span aria-hidden="true">↗</span>
      Guardar este enlace por WhatsApp
    </a>
  );
}

// ─── formulario de edición ──────────────────────────────────────────────

function FormularioEdicion({
  portafolio,
  token,
  categorias,
}: {
  portafolio: PortafolioAdmin;
  token: string;
  categorias: Categoria[];
}) {
  const [estado, accion] = useActionState(actualizarPortafolio.bind(null, token), ESTADO_INICIAL);

  const [coords, setCoords] = useState<Posicion | null>({
    lat: portafolio.latitud,
    lng: portafolio.longitud,
  });
  const [categoriaId, setCategoriaId] = useState(portafolio.categoria_id);

  const barrioConocido = BARRIOS_COMUNA_3.includes(portafolio.barrio);
  const [barrio, setBarrio] = useState(portafolio.barrio);
  const [barrioEsOtro, setBarrioEsOtro] = useState(!barrioConocido);

  const [horario, setHorario] = useState<string[]>(portafolio.horario);
  const [mediosPago, setMediosPago] = useState<string[]>(portafolio.medios_pago);

  const [mostrarOtraRed, setMostrarOtraRed] = useState(Boolean(portafolio.facebook));
  const [nombreFoto, setNombreFoto] = useState<string | null>(null);
  const [nombreMenu, setNombreMenu] = useState<string | null>(null);
  const [productosTexto] = useState(() => serializarProductos(portafolio.productos));

  const alCambiarUbicacion = useCallback((p: Posicion | null) => setCoords(p), []);
  const alCambiarBarrio = useCallback((v: string, esOtro: boolean) => {
    setBarrio(v);
    setBarrioEsOtro(esOtro);
  }, []);

  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const err = (campo: string): string[] | undefined => errores[campo];

  return (
    <form action={accion} className="mt-10 flex flex-col gap-12">
      {estado.estado !== 'inicial' && estado.mensaje && (
        <p
          role="alert"
          className="max-w-xl border border-amarillo bg-amarillo/15 px-4 py-3 font-sans text-sm text-azul-texto"
        >
          {estado.mensaje}
        </p>
      )}

      <Seccion
        numero="01"
        titulo="¿Dónde queda tu negocio?"
        ayuda="Toca el botón para usar el GPS de tu celular, o marca el punto en el mapa."
        ancho="completo"
      >
        <SelectorUbicacion valorInicial={coords} alCambiar={alCambiarUbicacion} />

        <input type="hidden" name="latitud" value={coords?.lat ?? ''} />
        <input type="hidden" name="longitud" value={coords?.lng ?? ''} />

        {(err('latitud') || err('longitud')) && (
          <p className="font-mono text-xs text-azul-texto">
            {err('latitud')?.[0] ?? err('longitud')?.[0]}
          </p>
        )}

        <div className="grid max-w-xl grid-cols-1 gap-6">
          <CampoFormulario id="direccion" etiqueta="Dirección" requerido errores={err('direccion')}>
            {(p) => (
              <input
                {...p}
                name="direccion"
                type="text"
                required
                maxLength={200}
                defaultValue={portafolio.direccion}
                placeholder="Calle 70 #45-12"
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <CampoFormulario id="barrio" etiqueta="Barrio" requerido errores={err('barrio')}>
            {(p) => (
              <SelectConOtro
                {...p}
                name="barrio"
                opciones={BARRIOS_COMUNA_3}
                valor={barrio}
                esOtro={barrioEsOtro}
                alCambiar={alCambiarBarrio}
                placeholderOtro="Escribe el barrio"
              />
            )}
          </CampoFormulario>
        </div>
      </Seccion>

      <Seccion numero="02" titulo="Tu negocio">
        <CampoFormulario id="nombre" etiqueta="Nombre del negocio" requerido errores={err('nombre')}>
          {(p) => (
            <input
              {...p}
              name="nombre"
              type="text"
              required
              maxLength={80}
              defaultValue={portafolio.nombre}
              placeholder="Panadería La Esperanza"
              className={claseInput}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="categoria_id"
          etiqueta="¿Qué tipo de negocio eres?"
          ayuda="Opcional — ayuda a que te encuentren por rubro."
          errores={err('categoria_id')}
        >
          {(p) => (
            <select
              {...p}
              name="categoria_id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={claseInput}
            >
              <option value="">Prefiero no elegir</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
        </CampoFormulario>

        {categoriaId === 'otros' && (
          <CampoFormulario id="categoria_otra" etiqueta="¿Qué tipo de negocio es?" requerido errores={err('categoria_otra')}>
            {(p) => (
              <input
                {...p}
                name="categoria_otra"
                type="text"
                required
                maxLength={60}
                defaultValue={portafolio.categoria_otra ?? ''}
                placeholder="Ej: taller de bicicletas"
                className={claseInput}
              />
            )}
          </CampoFormulario>
        )}

        <CampoFormulario
          id="descripcion"
          etiqueta="¿Qué haces?"
          ayuda="Cuenta en pocas líneas qué vendes o qué servicio prestas. Hasta 400 caracteres."
          errores={err('descripcion')}
        >
          {(p) => (
            <textarea
              {...p}
              name="descripcion"
              rows={4}
              maxLength={400}
              defaultValue={portafolio.descripcion ?? ''}
              placeholder="Pan artesanal y pasteles por encargo. Atendemos de lunes a sábado desde las 5 de la mañana."
              className={`${claseInput} resize-y`}
            />
          )}
        </CampoFormulario>
      </Seccion>

      <Seccion
        numero="03"
        titulo="Productos y servicios"
        ayuda="Un producto por línea, en formato PRODUCTO - PRECIO (el precio es opcional)."
      >
        <CampoFormulario
          id="productos"
          etiqueta="¿Qué productos o servicios ofreces?"
          errores={err('productos')}
        >
          {(p) => (
            <textarea
              {...p}
              name="productos"
              rows={5}
              maxLength={2000}
              defaultValue={productosTexto}
              placeholder={'Empanadas - $2000\nJugo natural - $3000\nAsesoría contable'}
              className={`${claseInput} resize-y`}
            />
          )}
        </CampoFormulario>
      </Seccion>

      <Seccion
        numero="04"
        titulo="¿Cómo te contactan?"
        ayuda="El WhatsApp es obligatorio — es el canal que usa la gente para escribirte. Los demás son opcionales."
      >
        <div className="flex flex-col gap-6">
          <CampoFormulario id="whatsapp" etiqueta="WhatsApp" requerido errores={err('whatsapp')}>
            {(p) => (
              <input
                {...p}
                name="whatsapp"
                type="tel"
                inputMode="tel"
                required
                defaultValue={portafolio.whatsapp ?? ''}
                placeholder="300 123 4567"
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <CampoFormulario id="correo" etiqueta="Correo" errores={err('correo')}>
            {(p) => (
              <input
                {...p}
                name="correo"
                type="email"
                defaultValue={portafolio.correo ?? ''}
                placeholder="contacto@ejemplo.com"
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <CampoFormulario
            id="instagram"
            etiqueta="Instagram"
            ayuda="Usuario, @usuario o el link — como te resulte más fácil."
            errores={err('instagram')}
          >
            {(p) => (
              <input
                {...p}
                name="instagram"
                type="text"
                defaultValue={portafolio.instagram ?? ''}
                placeholder="@minegocio"
                className={claseInput}
              />
            )}
          </CampoFormulario>

          <button
            type="button"
            onClick={() => setMostrarOtraRed((v) => !v)}
            className="self-start font-mono text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
          >
            {mostrarOtraRed ? '− Ocultar' : '+ Agregar otra red o página'}
          </button>

          {mostrarOtraRed && (
            <CampoFormulario
              id="facebook"
              etiqueta="Otra red o página"
              ayuda="Facebook, TikTok, sitio web — usuario, @usuario o el link."
              errores={err('facebook')}
            >
              {(p) => (
                <input
                  {...p}
                  name="facebook"
                  type="text"
                  defaultValue={portafolio.facebook ?? ''}
                  placeholder="facebook.com/minegocio"
                  className={claseInput}
                />
              )}
            </CampoFormulario>
          )}
        </div>
      </Seccion>

      <Seccion
        numero="05"
        titulo="Horario y medios de pago"
        ayuda="Opcional, pero ayuda a que la gente sepa qué esperar antes de escribirte."
      >
        <CampoFormulario id="horario" etiqueta="¿Cuándo atiendes?">
          {(p) => (
            <ChipsMultiple
              {...p}
              name="horario"
              opciones={OPCIONES_HORARIO_UI}
              valores={horario}
              alCambiar={setHorario}
            />
          )}
        </CampoFormulario>

        <CampoFormulario id="medios_pago" etiqueta="¿Cómo te pagan?">
          {(p) => (
            <ChipsMultiple
              {...p}
              name="medios_pago"
              opciones={OPCIONES_MEDIOS_PAGO_UI}
              valores={mediosPago}
              alCambiar={setMediosPago}
            />
          )}
        </CampoFormulario>

        <CampoFormulario
          id="punto_referencia"
          etiqueta="Punto de referencia"
          ayuda="Algo fácil de reconocer cerca del lugar."
          errores={err('punto_referencia')}
        >
          {(p) => (
            <input
              {...p}
              name="punto_referencia"
              type="text"
              maxLength={120}
              defaultValue={portafolio.punto_referencia ?? ''}
              placeholder="Frente a la cancha de La Cruz"
              className={claseInput}
            />
          )}
        </CampoFormulario>
      </Seccion>

      <Seccion numero="06" titulo="Una foto" ayuda="JPG, PNG o WebP, hasta 5 MB.">
        {portafolio.foto_url && (
          // eslint-disable-next-line @next/next/no-img-element -- foto chica de referencia, no vale la pena next/image acá.
          <img
            src={portafolio.foto_url}
            alt={`Foto actual de ${portafolio.nombre}`}
            className="h-32 w-32 border border-tinta/15 object-cover"
          />
        )}

        <CampoFormulario
          id="foto"
          etiqueta={portafolio.foto_url ? 'Reemplazar foto' : 'Fotografía del negocio'}
          errores={err('foto')}
        >
          {(p) => (
            <input
              {...p}
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => manejarSeleccionFoto(e.target, setNombreFoto)}
              className="w-full font-sans text-sm text-tinta/70 file:mr-4 file:border file:border-tinta/20 file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-xs file:text-tinta hover:file:border-azul hover:file:text-azul-texto"
            />
          )}
        </CampoFormulario>

        {nombreFoto && <p className="font-mono text-xs text-tinta/65">{nombreFoto}</p>}
      </Seccion>

      <Seccion numero="07" titulo="Menú o flyer" ayuda="JPG, PNG o WebP, hasta 5 MB.">
        {portafolio.menu_url && (
          // eslint-disable-next-line @next/next/no-img-element -- imagen chica de referencia, no vale la pena next/image acá.
          <img
            src={portafolio.menu_url}
            alt={`Menú actual de ${portafolio.nombre}`}
            className="h-32 w-32 border border-tinta/15 object-cover"
          />
        )}

        <CampoFormulario
          id="menu"
          etiqueta={portafolio.menu_url ? 'Reemplazar menú' : 'Menú o flyer'}
          errores={err('menu')}
        >
          {(p) => (
            <input
              {...p}
              name="menu"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => manejarSeleccionFoto(e.target, setNombreMenu)}
              className="w-full font-sans text-sm text-tinta/70 file:mr-4 file:border file:border-tinta/20 file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-xs file:text-tinta hover:file:border-azul hover:file:text-azul-texto"
            />
          )}
        </CampoFormulario>

        {nombreMenu && <p className="font-mono text-xs text-tinta/65">{nombreMenu}</p>}
      </Seccion>

      <div className="sticky bottom-0 -mx-[clamp(1.5rem,5vw,6rem)] border-t border-tinta/12 bg-hueso/95 px-[clamp(1.5rem,5vw,6rem)] py-4 backdrop-blur">
        <BotonGuardar />
      </div>
    </form>
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
      <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/60">
        Borrar mi negocio
      </h2>
      <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
        Esto saca tu negocio del directorio y del mapa. No se puede deshacer — si más adelante
        quieres volver a aparecer, tienes que registrarte de nuevo.
      </p>

      {estado.estado === 'error' && (
        <p role="alert" className="mt-3 font-mono text-sm text-azul-texto">
          {estado.mensaje}
        </p>
      )}

      <button
        type="button"
        onClick={handleBorrar}
        disabled={borrando}
        className="mt-4 min-h-11 border border-azul-texto px-5 py-2.5 font-mono text-sm text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso disabled:cursor-not-allowed disabled:opacity-50"
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
      <span className="font-mono text-xs text-tinta/65">Aliados · Tu registro</span>

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
            <p className="font-mono text-sm text-azul-texto">Tu negocio se borró del directorio.</p>
            <Link
              href="/aliados"
              className="mt-3 inline-block font-mono text-sm text-tinta/60 underline decoration-azul underline-offset-4 hover:text-azul-texto"
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
          <FormularioEdicion portafolio={portafolio} token={token} categorias={categorias} />
          <BorrarNegocio token={token} alBorrar={() => setBorrado(true)} />
        </>
      )}

      <Link
        href="/aliados"
        className="mt-16 inline-block font-mono text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
      >
        ← Volver al mapa
      </Link>
    </div>
  );
}
