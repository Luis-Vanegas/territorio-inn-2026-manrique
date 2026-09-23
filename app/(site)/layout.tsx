import { SiteHeader } from "@/components/SiteHeader";
import { ContadorVisitas } from "@/components/ContadorVisitas";
import { AsesorFlotante } from "@/components/AsesorFlotante";
import { consultarAsesorAdmin } from "@/lib/actions/consultarAsesorAdmin";
import { consultarAsesorUsuario } from "@/lib/actions/consultarAsesorUsuario";
import { asesorConfigurado } from "@/lib/agente/asesor";
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
  // Se consulta una sola vez y se reusa abajo. Sin vecino hay que mirarla igual:
  // el asesor flotante también es para el moderador que entró con contraseña.
  const moderador = (await verificarSesion()) !== null;

  // El asesor flotante es solo para quien tiene sesión: gasta cupo de un modelo
  // y no se abre al público anónimo. El vecino va primero porque su action
  // lleva los datos de su negocio; el moderador pregunta en general.
  const accionAsesor = !asesorConfigurado()
    ? null
    : sesion
      ? consultarAsesorUsuario
      : moderador
        ? consultarAsesorAdmin
        : null;

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
                moderador,
              }
            : null
        }
      />

      <div id="contenido" tabIndex={-1}>
        {children}
      </div>

      {accionAsesor && (
        <AsesorFlotante
          accion={accionAsesor}
          descripcion={
            sesion
              ? "Pregunta lo que necesites sobre trámites, cámara de comercio, apoyos económicos o formación. Si registraste tu negocio, ya conozco sus datos."
              : "Vista de moderación: la consulta es general, sin los datos de ningún negocio."
          }
        />
      )}
    </>
  );
}
