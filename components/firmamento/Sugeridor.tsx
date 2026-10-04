'use client';

import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { svgForma } from '@/components/mapa/formas';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import {
  cargarModelo,
  sugerirCategoria,
  type ModeloCategoria,
  type Sugerencia,
} from '@/lib/ml/categoria';

/**
 * Caja del sugeridor: la persona escribe un nombre y el modelo responde en
 * vivo. El modelo (~420 KB) se pide al primer toque en la caja y corre en el
 * navegador: lo que se escribe no sale de la pantalla, no se envía ni se guarda.
 *
 * Misma regla que el registro (`sugerirCategoria`): con confianza >= umbral se
 * sugiere una; si no, las 3 más probables. Nunca elige sola. Cada categoría
 * lleva la forma de su grupo, no solo el color.
 */

type Carga = 'espera' | 'cargando' | 'listo' | 'error';

const porcentaje = (p: number) => `${Math.round(p * 100)} %`;

function Medidor({ valor, sinMovimiento }: { valor: number; sinMovimiento: boolean | null }) {
  return (
    <div className="mt-2 h-2 w-full bg-noche-3" aria-hidden="true">
      <motion.div
        className="h-full origin-left bg-sodio"
        style={{ scaleX: valor }}
        initial={sinMovimiento ? false : { scaleX: 0 }}
        animate={{ scaleX: valor }}
        transition={sinMovimiento ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

function Forma({ id }: { id: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0"
      dangerouslySetInnerHTML={{ __html: svgForma(grupoDeCategoria(id), 20) }}
    />
  );
}

function Opcion({ s, sinMovimiento }: { s: Sugerencia; sinMovimiento: boolean | null }) {
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3 font-sans text-base text-estrella">
        <span className="flex min-w-0 items-center gap-2">
          <Forma id={s.id} />
          <span className="min-w-0 break-words">{s.nombre}</span>
        </span>
        <span className="shrink-0 font-sans tabular-nums">{porcentaje(s.probabilidad)}</span>
      </div>
      <Medidor valor={s.probabilidad} sinMovimiento={sinMovimiento} />
    </li>
  );
}

export function Sugeridor({ umbralPorcentaje }: { umbralPorcentaje: number }) {
  const idCampo = useId();
  const [texto, setTexto] = useState('');
  const [modelo, setModelo] = useState<ModeloCategoria | null>(null);
  const [carga, setCarga] = useState<Carga>('espera');
  const sinMovimiento = useReducedMotion();

  function pedirModelo() {
    if (carga !== 'espera' && carga !== 'error') return;
    setCarga('cargando');
    cargarModelo()
      .then((m) => {
        setModelo(m);
        setCarga('listo');
      })
      .catch(() => setCarga('error'));
  }

  const resultado = useMemo(
    () => (modelo && texto.trim().length >= 2 ? sugerirCategoria(modelo, texto) : null),
    [modelo, texto],
  );

  // La clave cambia con lo que se muestra: así la entrada anima solo al cambiar de caso.
  const clave =
    resultado?.tipo === 'una'
      ? `una-${resultado.sugerida.id}`
      : resultado?.tipo === 'varias'
        ? `varias-${resultado.opciones.map((o) => o.id).join('-')}`
        : (resultado?.tipo ?? 'vacio');

  let cuerpo: React.ReactNode;
  if (carga === 'error') {
    cuerpo = (
      <p className="font-sans text-base text-estrella">
        No pudimos cargar el modelo. Revisa tu conexión y vuelve a tocar la caja.
      </p>
    );
  } else if (carga === 'cargando' && !modelo) {
    cuerpo = <p className="font-sans text-base text-tenue">Cargando el modelo…</p>;
  } else if (!resultado) {
    cuerpo = (
      <p className="font-sans text-base text-tenue">
        Escribe el nombre de un negocio y aquí aparece la categoría que sugiere.
      </p>
    );
  } else if (resultado.tipo === 'nada') {
    cuerpo = (
      <p className="font-sans text-base text-estrella">
        Con ese nombre no encuentro pistas. Prueba con más letras o con otra palabra.
      </p>
    );
  } else if (resultado.tipo === 'una') {
    cuerpo = (
      <>
        <p className="font-sans text-sm text-tenue">Te sugerimos</p>
        <p className="mt-1 flex items-center gap-2 font-display text-2xl font-medium leading-tight text-estrella">
          <Forma id={resultado.sugerida.id} />
          <span className="min-w-0 break-words">{resultado.sugerida.nombre}</span>
        </p>
        <p className="mt-1 font-sans text-sm text-sodio">
          Confianza {porcentaje(resultado.sugerida.probabilidad)}
        </p>
        <Medidor valor={resultado.sugerida.probabilidad} sinMovimiento={sinMovimiento} />
        {resultado.alternativas.length > 0 && (
          <p className="mt-3 font-sans text-sm leading-relaxed text-tenue">
            También podría ser:{' '}
            {resultado.alternativas
              .map((a) => `${a.nombre} (${porcentaje(a.probabilidad)})`)
              .join(' · ')}
            .
          </p>
        )}
      </>
    );
  } else {
    cuerpo = (
      <>
        <p className="font-sans text-base leading-relaxed text-estrella">
          Con menos de {umbralPorcentaje} % de confianza no sugerimos una sola. Estas son las tres más
          probables; tú decides.
        </p>
        <ul className="mt-2 divide-y divide-trazo">
          {resultado.opciones.map((o) => (
            <Opcion key={o.id} s={o} sinMovimiento={sinMovimiento} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <div className="border border-trazo bg-noche-2 p-5">
      <label htmlFor={idCampo} className="font-sans text-lg font-medium text-estrella">
        Pruébalo con el nombre de un negocio
      </label>
      <input
        id={idCampo}
        type="text"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          pedirModelo();
        }}
        onFocus={pedirModelo}
        autoComplete="off"
        spellCheck={false}
        maxLength={80}
        placeholder="Ej.: Variedades la 45"
        className="mt-3 min-h-[48px] w-full border border-trazo-2 bg-noche px-4 font-sans text-lg text-estrella placeholder:text-tenue-2"
      />

      <div
        aria-live="polite"
        className="mt-4 min-h-[132px] border border-dashed border-trazo-2 p-4"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={clave}
            initial={sinMovimiento ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={sinMovimiento ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {cuerpo}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-3 font-sans text-sm leading-relaxed text-tenue">
        Lo que escribes no sale de tu pantalla: el modelo corre en tu navegador, no se envía ni se
        guarda nada. Es solo una sugerencia; la decides tú.
      </p>
    </div>
  );
}
