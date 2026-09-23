// Footer: banda oscura para cerrar la pieza con contraste fuerte en vez de
// diluirse en el mismo fondo del resto del sitio.
//
// Colores FIJOS, no los tokens hueso/tinta: esos se invierten con el modo, y
// en oscuro el footer pasaba a ser una banda casi blanca — con los logos
// institucionales (dibujados en claro, fill #F7F5F0) invisibles encima. La
// banda queda oscura en los dos modos; en oscuro la separa el borde superior.
// Sobre #1A1A1A: white/65 da 7.3:1 y azul base 5.1:1.

import Image from "next/image";
import Link from "next/link";
import { footer } from "@/lib/content";
import { equipo } from "@/lib/team";

export function Footer() {
  return (
    <footer className="margen-editorial border-t border-white/10 bg-[#1A1A1A] py-16 text-white">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {footer.logos.map((logo) => (
          <Image key={logo.src} src={logo.src} alt={logo.alt} width={140} height={32} />
        ))}
      </div>

      <div className="mt-14 flex flex-col gap-6 border-t border-white/20 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-white/65">Créditos</p>
          <p className="mt-1 font-sans text-sm text-white/80">
            {equipo.map((miembro) => miembro.nombre).join(" · ")}
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-white/65">Contacto</p>
          <Link
            href="/contacto"
            className="mt-1 inline-block font-sans text-sm underline decoration-azul underline-offset-4 hover:text-azul"
          >
            Escríbenos
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <p className="font-mono text-xs text-white/65">Licencia {footer.licencia}</p>
          {/* Mismo tratamiento visual que "Licencia": discreto, sin destacar, pero con
              texto legible — un link sin texto reconocible es un problema de accesibilidad,
              no solo de diseño. */}
          <Link href="/admin/login" className="font-mono text-xs text-white/65 hover:text-azul">
            Equipo
          </Link>
        </div>
      </div>
    </footer>
  );
}
