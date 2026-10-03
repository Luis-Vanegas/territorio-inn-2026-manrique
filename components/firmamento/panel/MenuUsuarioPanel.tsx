'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { salirDeFirmamento } from '@/lib/actions/sesionFirmamento';
import { ROL_TEXTO, type RolFirmamento } from '@/lib/firmamento/navegacion';

/**
 * Menú de la persona conectada: quién es, el Firmamento público y «Salir».
 *
 * Es un botón con `aria-expanded` y `aria-controls`, como el «Aprende» del
 * encabezado (DESIGN.md › Navegación): abre con Enter o Espacio, cierra con
 * `Esc` (devolviendo el foco al botón), con un toque afuera y al salir con Tab.
 * No depende del hover. No lleva animación: aparece y desaparece al instante.
 */
function iniciales(nombre: string): string {
  // De un correo («equipo@…») se toma lo de antes de la arroba.
  const base = nombre.split('@')[0]!.trim();
  const letras = base.split(/[\s._-]+/).filter(Boolean);
  const dos = letras.length > 1 ? letras[0]![0]! + letras[1]![0]! : (letras[0] ?? '?').slice(0, 2);
  return dos.toUpperCase();
}

export function MenuUsuarioPanel({
  rol,
  nombre,
  foto,
}: {
  rol: RolFirmamento;
  nombre: string;
  foto: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;

    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    }
    function alTocarAfuera(e: PointerEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }

    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alTocarAfuera);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alTocarAfuera);
    };
  }, [abierto]);

  return (
    <div
      ref={contenedor}
      className="relative"
      // Tab que sale del menú lo cierra: no queda un panel abierto tapando contenido.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-label={`Menú de ${nombre}`}
        onClick={() => setAbierto((v) => !v)}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-sodio font-sans text-sm font-medium text-noche"
      >
        {foto ? (
          // <img> y no next/image: es el avatar de Google (dominio externo, 44 px);
          // `referrerPolicy` evita contarle a Google desde qué página se pidió.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" width={44} height={44} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          iniciales(nombre)
        )}
      </button>

      {abierto && (
        <div
          id={idPanel}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-trazo-2 bg-noche-2 p-2"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="break-words font-sans text-sm font-medium text-estrella">{nombre}</p>
            <p className="font-sans text-sm text-tenue">{ROL_TEXTO[rol]}</p>
          </div>

          <Link
            href="/firmamento"
            className="flex min-h-[44px] items-center rounded-lg px-3 font-sans text-sm text-estrella hover:bg-noche-3"
          >
            Firmamento público
          </Link>

          <form action={salirDeFirmamento}>
            <input type="hidden" name="rol" value={rol} />
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left font-sans text-sm text-estrella hover:bg-noche-3"
            >
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
