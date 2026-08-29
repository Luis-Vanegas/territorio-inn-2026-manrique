'use client';

// Modal de confirmación que aparece en el inicio justo después de un
// registro exitoso (ver redirect en lib/actions/registrarPortafolio.ts).
//
// El token en la URL (?registrado=...) sigue siendo la única credencial
// para /aliados/estado/[token] — no hay login. Por eso el modal no es solo
// un "gracias": tiene que entregarle ese link antes de limpiar la URL, o la
// persona pierde la única forma de editar o borrar su registro después.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export function ModalRegistroExitoso() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Se captura una sola vez al montar: searchParams se lee acá, y después
  // se limpia la URL con replace, así un F5 no vuelve a abrir el modal.
  const [datos] = useState(() => {
    const token = searchParams.get('registrado');
    if (!token) return null;
    return { token, fotoFallo: searchParams.get('foto') === 'error' };
  });

  const [abierto, setAbierto] = useState(Boolean(datos));
  const [copiado, setCopiado] = useState(false);

  // El origin se resuelve después de montar, no en el render: si se lee
  // `window.location.origin` directo en el cuerpo del componente, el SSR
  // (sin `window`) y el cliente calculan hrefs distintos y React se queda
  // con el valor viejo del server — mismatch de hidratación silencioso.
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (!datos) return;
    // window solo existe tras montar; leerlo en el cuerpo del componente da
    // mismatch de hidratación (ver comentario de `origin` más arriba).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    router.replace('/', { scroll: false });
  }, [datos, router]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  if (!datos || !abierto) return null;

  const urlEstado = `${origin}/aliados/estado/${datos.token}`;
  const mensajeWhatsapp = `Guarda este enlace para ver o corregir su registro: ${urlEstado}`;
  const hrefWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensajeWhatsapp)}`;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlEstado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el link ya está visible en el <input>
      // de abajo para copiarlo a mano.
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-registro-titulo"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-tinta/40 px-4 backdrop-blur-sm"
      onClick={() => setAbierto(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-tinta/15 bg-hueso p-6 shadow-[0_8px_40px_rgb(26_26_26/0.15)] sm:p-8"
      >
        <span className="font-mono text-xs text-terracota-texto">✓ Registro guardado</span>

        <h2 id="modal-registro-titulo" className="mt-2 font-display text-2xl font-medium text-tinta">
          ¡Listo! Tu negocio quedó registrado.
        </h2>

        <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
          Lo vamos a revisar y va a aparecer en el mapa de Aliados apenas lo aprobemos.
        </p>

        {datos.fotoFallo && (
          <p role="alert" className="mt-3 border-l-2 border-terracota bg-terracota/[0.04] px-3 py-2.5 font-sans text-sm leading-relaxed text-tinta">
            La foto no se pudo subir — puedes agregarla más tarde desde el link de abajo.
          </p>
        )}

        <p className="mt-5 font-mono text-xs uppercase tracking-wide text-tinta/65">
          Guarda este link — es la única forma de editarlo o borrarlo después
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={urlEstado}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 border border-tinta/55 bg-transparent px-3 py-2 font-mono text-xs text-tinta"
          />
          <button
            type="button"
            onClick={copiarLink}
            className="shrink-0 border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            {copiado ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>

        <a
          href={hrefWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-2 self-start border border-tinta/20 px-4 py-2.5 font-mono text-sm text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
        >
          <span aria-hidden="true">↗</span>
          Guardar este enlace por WhatsApp
        </a>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-tinta/12 pt-5">
          <Link
            href={`/aliados/estado/${datos.token}`}
            className="font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4 hover:text-terracota-texto/80"
          >
            Ver mi registro →
          </Link>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="font-mono text-sm text-tinta/65 hover:text-tinta"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
