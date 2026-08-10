// Footer: fondo invertido (tinta con texto hueso) para cerrar la pieza con contraste fuerte
// en vez de diluirse en el mismo fondo hueso del resto del sitio.

import Image from "next/image";
import Link from "next/link";
import { footer } from "@/lib/content";
import { equipo } from "@/lib/team";

export function Footer() {
  return (
    <footer className="margen-editorial bg-tinta py-16 text-hueso">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {footer.logos.map((logo) => (
          <Image key={logo.src} src={logo.src} alt={logo.alt} width={140} height={32} />
        ))}
      </div>

      <div className="mt-14 flex flex-col gap-6 border-t border-hueso/20 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/50">
            Repositorio
          </p>
          <a
            href={footer.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-sans text-sm underline decoration-terracota underline-offset-4 hover:text-terracota"
          >
            {footer.repo.replace("https://", "")}
          </a>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/50">Créditos</p>
          <p className="mt-1 font-sans text-sm text-hueso/80">
            {equipo.map((miembro) => miembro.nombre).join(" · ")}
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/50">Contacto</p>
          <Link
            href="/contacto"
            className="mt-1 inline-block font-sans text-sm underline decoration-terracota underline-offset-4 hover:text-terracota"
          >
            Escribinos
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <p className="font-mono text-xs text-hueso/50">Licencia {footer.licencia}</p>
          {/* Mismo tratamiento visual que "Licencia": discreto, sin destacar, pero con
              texto legible — un link sin texto reconocible es un problema de accesibilidad,
              no solo de diseño. */}
          <Link href="/admin/login" className="font-mono text-xs text-hueso/50 hover:text-terracota">
            Equipo
          </Link>
        </div>
      </div>
    </footer>
  );
}
