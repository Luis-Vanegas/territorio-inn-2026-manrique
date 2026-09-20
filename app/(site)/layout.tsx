import { SiteHeader } from "@/components/SiteHeader";
import { ContadorVisitas } from "@/components/ContadorVisitas";
import { verificarSesion } from "@/lib/auth/admin";
import { sesionActual } from "@/lib/auth/usuario";

/**
 * Layout del sitio público: home, Empleo, Inventario predictivo, Aliados y
 * legal. El route group "(site)" no aparece en la URL — sirve para darle
 * header propio a estas rutas sin tocar /admin, que ya tiene el suyo en
 * app/admin/(panel)/layout.tsx.
 *
 * La sesión se lee acá, una vez, y baja al header: `sesionActual` necesita la
 * cookie y node:crypto, y SiteHeader es 'use client' por usePathname.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();

  return (
    <>
      <ContadorVisitas />

      {/* Saltar al contenido (WCAG 2.4.1). Sin esto, quien navega con teclado
          o con lector de pantalla tiene que recorrer el logo y los cinco ítems
          del menú EN CADA PÁGINA antes de llegar a lo que vino a leer.
          Invisible hasta que recibe foco, y entonces se muestra arriba de todo.

          El destino es este envoltorio y no el <main> de cada página: así el
          enlace funciona en las diez rutas sin tener que acordarse de ponerle
          un id al <main> cada vez que se crea una. tabIndex={-1} es lo que
          permite que el foco aterrice acá — un div no es enfocable por
          defecto, y sin eso el salto mueve el scroll pero no el foco, que es
          justo lo que necesita el lector de pantalla. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-tinta focus:bg-hueso focus:px-4 focus:py-3 focus:font-mono focus:text-base focus:text-tinta"
      >
        Saltar al contenido
      </a>

      {/* Se manda SOLO lo que el encabezado pinta: nombre y avatar. NO el
          identificador, que `sesion` también trae — todo lo que se le pasa a un
          componente de cliente termina serializado en el HTML de la página.

          No sería una filtración —es el propio id, en la propia página de esa
          persona, y la autenticación va por cookie firmada— pero la regla es no
          exponer lo que no hace falta. */}
      <SiteHeader
        sesion={
          sesion
            ? {
                nombre: sesion.nombre,
                foto: sesion.foto,
                // Solo se mira si hay sesión de vecino: quien no entró no paga la
                // verificación, y un moderador sin sesión de vecino entra por
                // /admin/login como siempre.
                moderador: (await verificarSesion()) !== null,
              }
            : null
        }
      />

      <div id="contenido" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}
