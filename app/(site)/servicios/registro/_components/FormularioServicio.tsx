'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';

import { Stepper, type Paso } from '@/components/Stepper';
import { ConfirmarEnvio } from './ConfirmarEnvio';
import {
  registrarServicio,
  type EstadoRegistroServicio,
} from '@/lib/actions/registrarServicio';
import {
  OPCIONES_COMO_CONSIGUE,
  OPCIONES_FORMACION,
  OPCIONES_NECESITA,
} from '@/lib/validation/servicio.schema';

const ESTADO_INICIAL: EstadoRegistroServicio = { estado: 'inicial' };

const BARRIOS_COMUNA_3 = [
  'El Raizal',
  'El Pomar',
  'La Salle',
  'Las Granjas',
  'Santa Inés',
  'Campo Valdés No. 1',
  'San José de la Cima No. 1',
  'San José de la Cima No. 2',
  'La Cruz',
  'Oriente',
  'Versalles No. 1',
  'Versalles No. 2',
  'Manrique Oriental',
  'Manrique Central No. 2',
  'María Cano - Carambolas',
];

const ETIQUETAS_COMO_CONSIGUE: Record<(typeof OPCIONES_COMO_CONSIGUE)[number], string> = {
  voz_a_voz: 'De boca en boca',
  redes: 'Por redes sociales',
  volantes: 'Volantes o carteles',
  ninguno: 'Todavía no consigo',
  otro: 'De otra forma',
};

const ETIQUETAS_FORMACION: Record<(typeof OPCIONES_FORMACION)[number], string> = {
  sena: 'SENA',
  tecnico: 'Técnico o tecnólogo',
  empirico: 'Aprendí trabajando',
  ninguna: 'Ninguna',
};

const ETIQUETAS_NECESITA: Record<(typeof OPCIONES_NECESITA)[number], string> = {
  herramientas: 'Herramientas',
  capacitacion: 'Capacitación',
  transporte: 'Transporte',
  capital: 'Capital',
  clientes: 'Más clientes',
};

// Qué campo pertenece a qué paso. Sirve para saltar al paso correcto cuando el
// servidor devuelve un error: hacerle buscar a la persona en cuál de los
// cuatro pasos está el problema sería trasladarle nuestro trabajo.
const PASO_DE_CAMPO: Record<string, number> = {
  nombre: 0,
  categoria_id: 0,
  categoria_otra: 0,
  descripcion: 0,
  anos_experiencia: 0,
  cobertura: 1,
  telefono: 2,
  foto: 2,
  correo: 2,
  mayor_dificultad: 3,
  acepto_terminos: 3,
  acepto_habeas_data: 3,
  acepto_codigo_conducta: 3,
  acepto_investigacion: 3,
};

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

const claseEtiqueta = 'block font-mono text-xs uppercase tracking-wider text-tinta/65';

function Error({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null;
  return (
    <p role="alert" className="mt-2 font-sans text-xs text-terracota">
      {mensajes[0]}
    </p>
  );
}

function Campo({
  etiqueta,
  ayuda,
  children,
  errores,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
  errores?: string[];
}) {
  return (
    <div>
      <label className={claseEtiqueta}>{etiqueta}</label>
      {ayuda && <p className="mt-1 font-sans text-xs text-tinta/50">{ayuda}</p>}
      <div className="mt-2">{children}</div>
      <Error mensajes={errores} />
    </div>
  );
}

/** Sí / No / prefiero no decir. Un booleano no alcanza: "no contestó" es un dato. */
function TriEstado({ nombre, etiqueta }: { nombre: string; etiqueta: string }) {
  return (
    <fieldset>
      <legend className={claseEtiqueta}>{etiqueta}</legend>
      <div className="mt-2 flex gap-5">
        {[
          { v: 'si', t: 'Sí' },
          { v: 'no', t: 'No' },
        ].map(({ v, t }) => (
          <label key={v} className="flex items-center gap-2 font-sans text-sm text-tinta/80">
            <input type="radio" name={nombre} value={v} className="accent-terracota" />
            {t}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormularioServicio({
  categorias,
}: {
  categorias: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(registrarServicio, ESTADO_INICIAL);
  const [paso, setPaso] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [iniciadoEn] = useState(() => Date.now());

  const errores = useMemo(
    () => (estado.estado === 'error' ? (estado.errores ?? {}) : {}),
    [estado],
  );

  // Al volver con errores, saltar al primer paso que tenga uno: hacerle buscar
  // a la persona en cuál de los cuatro pasos está el problema sería pasarle
  // nuestro trabajo.
  //
  // Se ajusta DURANTE el render y no en un efecto. Un efecto acá dispararía un
  // segundo render en cascada —y el linter lo marca con razón—; comparar la
  // respuesta anterior con la nueva en el cuerpo del componente es el patrón
  // que React documenta para derivar estado de un cambio de props.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    const primero = Object.keys(errores)[0];
    const destino = primero === undefined ? undefined : PASO_DE_CAMPO[primero];
    if (destino !== undefined) setPaso(destino);
  }

  const pasos: Paso[] = useMemo(
    () => [
      {
        titulo: 'Qué sabés hacer',
        ayuda: 'Esto es lo que va a leer quien necesita tu servicio.',
        contenido: (
          <div className="flex flex-col gap-8">
            <Campo etiqueta="Tu nombre" errores={errores.nombre}>
              <input name="nombre" className={claseInput} placeholder="Como te conocen" />
            </Campo>

            <Campo etiqueta="Tu oficio" errores={errores.categoria_id}>
              <select
                name="categoria_id"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={claseInput}
              >
                <option value="">Elegí uno…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            {categoria === 'otros' && (
              <Campo etiqueta="¿Cuál?" errores={errores.categoria_otra}>
                <input name="categoria_otra" className={claseInput} placeholder="Escribilo" />
              </Campo>
            )}

            <Campo
              etiqueta="¿Qué hacés exactamente?"
              ayuda="Mientras más concreto, más confianza genera. Ej: “Reparo lavadoras y neveras, hago diagnóstico a domicilio sin costo.”"
              errores={errores.descripcion}
            >
              <textarea name="descripcion" rows={4} className={claseInput} maxLength={400} />
            </Campo>

            <Campo etiqueta="Años de experiencia" errores={errores.anos_experiencia}>
              <input
                name="anos_experiencia"
                type="number"
                min={0}
                max={70}
                className={claseInput}
                placeholder="5"
              />
            </Campo>
          </div>
        ),
      },
      {
        titulo: 'Dónde atendés',
        ayuda:
          'Elegí los barrios a los que podés ir. No te pedimos tu dirección: no la guardamos ni la publicamos.',
        contenido: (
          <div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {BARRIOS_COMUNA_3.map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-2.5 font-sans text-sm text-tinta/80"
                >
                  <input
                    type="checkbox"
                    name="cobertura"
                    value={b}
                    className="accent-terracota"
                  />
                  {b}
                </label>
              ))}
            </div>
            <Error mensajes={errores.cobertura} />
          </div>
        ),
      },
      {
        titulo: 'Cómo te contactan',
        ayuda: 'El teléfono es lo único de este paso que se publica.',
        contenido: (
          <div className="flex flex-col gap-8">
            <Campo
              etiqueta="Teléfono o WhatsApp"
              ayuda="Se publica. Es la única forma que va a tener la gente de escribirte."
              errores={errores.telefono}
            >
              <input name="telefono" className={claseInput} placeholder="300 123 4567" />
            </Campo>

            <Campo
              etiqueta="Correo (opcional)"
              ayuda="NO se publica. Lo usamos solo para avisarte del estado de tu registro."
              errores={errores.correo}
            >
              <input name="correo" type="email" className={claseInput} />
            </Campo>

            <Campo
              etiqueta="Una foto tuya (opcional, privada)"
              ayuda="No se publica en ningún lado ni se muestra en tu ficha. La guardamos solo para poder identificarte si llega a haber un problema — es lo que respalda el compromiso que aceptás en el último paso. JPG, PNG o WebP, hasta 5 MB."
              errores={errores.foto}
            >
              <input
                name="foto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="font-sans text-sm text-tinta/70 file:mr-3 file:border file:border-tinta/20 file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-tinta/70"
              />
            </Campo>
          </div>
        ),
      },
      {
        titulo: 'Para el proyecto',
        ayuda:
          'Estas respuestas NO se publican. Son para entender qué necesita quien trabaja por su cuenta en Manrique.',
        contenido: (
          <div className="flex flex-col gap-8">
            <Campo
              etiqueta="¿Qué es lo que más te dificulta conseguir trabajo?"
              errores={errores.mayor_dificultad}
            >
              <textarea name="mayor_dificultad" rows={3} className={claseInput} maxLength={300} />
            </Campo>

            <Campo etiqueta="¿Cómo conseguís clientes hoy?">
              <select name="como_consigue_clientes" className={claseInput}>
                <option value="">Prefiero no decir</option>
                {OPCIONES_COMO_CONSIGUE.map((o) => (
                  <option key={o} value={o}>
                    {ETIQUETAS_COMO_CONSIGUE[o]}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="¿Formación en el oficio?">
              <select name="formacion" className={claseInput}>
                <option value="">Prefiero no decir</option>
                {OPCIONES_FORMACION.map((o) => (
                  <option key={o} value={o}>
                    {ETIQUETAS_FORMACION[o]}
                  </option>
                ))}
              </select>
            </Campo>

            <TriEstado nombre="ingreso_principal" etiqueta="¿De esto vivís principalmente?" />
            <TriEstado nombre="herramientas_propias" etiqueta="¿Tenés herramientas propias?" />
            <TriEstado nombre="tiene_arl" etiqueta="¿Tenés ARL o seguridad social?" />
            <TriEstado nombre="sale_de_comuna" etiqueta="¿Podés salir de la Comuna 3?" />

            <fieldset>
              <legend className={claseEtiqueta}>¿Qué necesitás para trabajar mejor?</legend>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                {OPCIONES_NECESITA.map((o) => (
                  <label
                    key={o}
                    className="flex items-center gap-2 font-sans text-sm text-tinta/80"
                  >
                    <input
                      type="checkbox"
                      name="necesita"
                      value={o}
                      className="accent-terracota"
                    />
                    {ETIQUETAS_NECESITA[o]}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Código de conducta: no es un checkbox más. Es el compromiso que
                queda registrado con fecha, versión e IP. */}
            <div className="border-l-2 border-terracota bg-terracota/[0.04] px-4 py-4">
              <p className="font-mono text-xs uppercase tracking-wider text-tinta/65">
                Compromiso
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 font-sans text-sm leading-relaxed text-tinta/80">
                <li>Me identifico al llegar donde el cliente.</li>
                <li>Acuerdo el precio y el alcance antes de empezar.</li>
                <li>No ingreso a áreas de la casa que no me autorizaron.</li>
                <li>Respeto la propiedad de quien me contrata.</li>
              </ul>
              <label className="mt-4 flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input
                  type="checkbox"
                  name="acepto_codigo_conducta"
                  className="mt-1 accent-terracota"
                />
                Me comprometo a cumplirlo.
              </label>
              <Error mensajes={errores.acepto_codigo_conducta} />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input type="checkbox" name="acepto_terminos" className="mt-1 accent-terracota" />
                <span>
                  Leí y acepto los{' '}
                  <Link
                    href="/legal/servicios"
                    target="_blank"
                    className="text-terracota underline underline-offset-2"
                  >
                    términos del módulo Servicios
                  </Link>{' '}
                  — qué es este proyecto, qué se publica y qué no.
                </span>
              </label>
              <Error mensajes={errores.acepto_terminos} />

              <label className="flex items-start gap-2.5 font-sans text-sm text-tinta">
                <input
                  type="checkbox"
                  name="acepto_habeas_data"
                  className="mt-1 accent-terracota"
                />
                <span>
                  Autorizo que guarden y traten mis datos, y entiendo que mi
                  nombre, mi foto, mi oficio y mi teléfono quedan{' '}
                  <strong className="font-medium">públicos en internet</strong>.
                </span>
              </label>
              <Error mensajes={errores.acepto_habeas_data} />
            </div>
          </div>
        ),
      },
    ],
    [categorias, categoria, errores],
  );

  const ultimo = paso === pasos.length - 1;

  return (
    <form action={accion} noValidate>
      <input type="hidden" name="iniciado_en" value={iniciadoEn} />
      {/* Trampa para bots. Oculta visualmente, no con `hidden`: un bot que
          parsea el HTML la llena igual, una persona nunca la ve. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <input name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      {estado.estado === 'error' && estado.mensaje && (
        <p
          role="alert"
          className="mb-8 border-l-2 border-terracota bg-terracota/[0.04] px-4 py-3 font-sans text-sm text-tinta"
        >
          {estado.mensaje}
        </p>
      )}

      <Stepper
        pasos={pasos}
        actual={paso}
        onCambiar={setPaso}
        pie={
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setPaso((p) => Math.max(0, p - 1))}
              disabled={paso === 0}
              className="min-h-11 font-mono text-sm text-tinta/65 hover:text-tinta disabled:opacity-30"
            >
              ← Atrás
            </button>

            {ultimo ? (
              <ConfirmarEnvio />
            ) : (
              <button
                type="button"
                onClick={() => setPaso((p) => Math.min(pasos.length - 1, p + 1))}
                className="min-h-11 border border-tinta/25 px-6 py-2.5 font-mono text-sm text-tinta transition-colors hover:border-terracota hover:text-terracota"
              >
                Siguiente →
              </button>
            )}
          </div>
        }
      />
    </form>
  );
}
