// Footer: banda oscura para cerrar la pieza con contraste fuerte en vez de
// diluirse en el mismo fondo del resto del sitio.
//
// Colores FIJOS, no los tokens hueso/tinta: esos se invierten con el modo, y
// en oscuro el footer pasaba a ser una banda casi blanca. La banda queda oscura
// en los dos modos; en oscuro la separa el borde superior.
// Sobre #1A1A1A: white/65 da 7.3:1 y azul base 5.1:1.
//
// Las instituciones van en texto DM Sans: no hay logos oficiales con permiso de
// uso (los SVG que solo dibujaban el nombre en monoespaciada se borraron, D3).

import Link from "next/link";
import { footer } from "@/lib/content";
import { equipo } from "@/lib/team";

export function Footer() {
  return (
    <footer className="margen-editorial border-t border-white/10 bg-[#1A1A1A] py-16 text-white">
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.15em] text-white/65">Instituciones del reto</p>
        <ul className="mt-3 flex flex-col gap-x-10 gap-y-2 sm:flex-row sm:flex-wrap">
          {footer.instituciones.map((nombre) => (
            <li key={nombre} className="font-sans text-lg text-white/90">
              {nombre}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 flex flex-col gap-6 border-t border-white/20 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.15em] text-white/65">Créditos</p>
          <p className="mt-1 font-sans text-sm text-white/80">
            {equipo.map((miembro) => miembro.nombre).join(" · ")}
          </p>
        </div>

        <div>
          <p className="font-sans text-xs uppercase tracking-[0.15em] text-white/65">Contacto</p>
          <Link
            href="/contacto"
            className="mt-1 inline-flex min-h-[44px] items-center font-sans text-sm underline decoration-azul underline-offset-4 hover:text-azul"
          >
            Escríbenos
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <p className="font-sans text-xs text-white/65">Licencia {footer.licencia}</p>
          {/* Mismo tratamiento visual que "Licencia": discreto, sin destacar, pero con
              texto legible — un link sin texto reconocible es un problema de accesibilidad,
              no solo de diseño. */}
          <Link href="/firmamento/entrar?rol=equipo" className="inline-flex min-h-[44px] min-w-[44px] items-center font-sans text-xs text-white/65 hover:text-azul">
            Equipo
          </Link>
        </div>
      </div>
    </footer>
  );
}
