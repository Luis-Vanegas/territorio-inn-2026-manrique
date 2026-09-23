'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Segundo camino de acceso: el enlace de quien registramos en campo.
 *
 * ── Por qué no hay server action ni consulta ──
 *
 * El token ES la credencial. /aliados/estado/[token] ya valida el formato,
 * busca la fila y devuelve 404 si no existe, y tiene su propio cupo de
 * intentos (migración 017). Verificarlo acá antes de redirigir agregaría una
 * consulta y una action para llegar al mismo lugar, con el error repartido en
 * dos pantallas según dónde falle.
 *
 * ── Por qué va plegado ──
 *
 * Le sirve a una minoría —los que registramos en persona— y ocupaba media
 * pantalla con tres textos que decían lo mismo sobre el enlace. Plegado, la
 * página respira y el camino principal queda solo; abierto, tiene todo lo que
 * esa persona necesita. <details> es nativo: teclado, Escape y cero JS para
 * abrir y cerrar.
 */

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function AccesoPorEnlace() {
  const router = useRouter();
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);

  function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const encontrado = valor.match(UUID);
    if (!encontrado) {
      setError('Ese enlace no tiene el código que esperamos. Cópialo completo, tal como te llegó.');
      return;
    }

    router.push(`/aliados/estado/${encontrado[0].toLowerCase()}`);
  }

  return (
    <details className="group border border-tinta/15">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between px-5 font-mono text-sm text-tinta transition-colors hover:text-azul-texto [&::-webkit-details-marker]:hidden">
        <span>El equipo registró mi negocio en persona</span>
        {/* aria-hidden: <details> ya anuncia su estado al lector de pantalla.
            El signo es refuerzo visual, no información. */}
        <span className="font-mono text-lg text-tinta/60" aria-hidden="true">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>

      <form onSubmit={alEnviar} className="border-t border-tinta/12 px-5 py-6" noValidate>
        <label htmlFor="enlace" className="block font-sans text-sm leading-relaxed text-tinta/70">
          Pega el enlace que te dimos. Sirve completo o solo el código del final.
        </label>

        <input
          id="enlace"
          name="enlace"
          type="text"
          inputMode="url"
          autoComplete="off"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'enlace-error' : undefined}
          placeholder="https://… /aliados/estado/…"
          className="mt-3 w-full border border-tinta/20 bg-transparent px-4 py-3 font-mono text-sm text-tinta placeholder:text-tinta/30 focus:border-azul focus:outline-none"
        />

        {error && (
          <p id="enlace-error" role="alert" className="mt-3 font-sans text-sm text-azul-texto">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 min-h-[48px] w-full border border-tinta/25 px-6 font-mono text-sm text-tinta transition-colors hover:border-azul hover:text-azul-texto sm:w-auto"
        >
          Entrar
        </button>

        <p className="mt-5 font-sans text-sm leading-relaxed text-tinta/65">
          ¿Lo perdiste?{' '}
          <a
            href="/contacto"
            className="underline decoration-azul underline-offset-4 hover:text-azul-texto"
          >
            Escríbenos
          </a>{' '}
          con el nombre de tu negocio y te lo enviamos otra vez.
        </p>
      </form>
    </details>
  );
}
