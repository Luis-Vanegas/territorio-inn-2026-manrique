import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { IndicadorEntorno } from "@/components/IndicadorEntorno";
import { TemaInicial } from "@/components/TemaInicial";
import { entornoDesde } from "@/lib/entorno";
import { urlSitio } from "@/lib/sitio";
import "@/styles/globals.css";

// Fraunces variable con optical sizing activo: el mismo archivo se ajusta de titular (140px) a texto de apoyo.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

// DM Sans para TODO lo que no es titular: cuerpo, botones, etiquetas, menú y
// formularios. Reemplaza a dos familias a la vez y el porqué está en DESIGN.md.
//
// Antes acá vivía JetBrains_Mono, que terminó siendo la familia más usada del
// sitio (331 clases `font-mono` contra 171 de `font-sans`). Es una monoespaciada
// para escribir CÓDIGO: nada en este producto es código y el público son
// tenderos de Manrique, no programadores. En cuerpos de 12–16px, en mayúsculas
// y con tracking abierto, se lee más lento y comunica «panel técnico» justo
// donde hacía falta decir «esto es fácil». Las láminas de marca del equipo no
// la usan en ningún lado.
//
// Y reemplaza también a Geist, que funcionaba pero es una grotesca neutra de
// origen técnico. DM Sans es geométrica y redonda: es lo más parecido a la sans
// que el equipo ya usa en las láminas que los vecinos recibieron por WhatsApp.
// Dos familias en vez de tres, y una menos para descargar.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  // Solo los pesos que se usan: 400 cuerpo, 500 etiquetas y controles.
  weight: ["400", "500"],
});

const DESCRIPCION =
  "Propuesta para la Comuna 3 de Medellín — Presupuesto Participativo Comuna 3. Reto: Empleo y Desarrollo Económico.";

export const metadata: Metadata = {
  // Sin metadataBase, Next resuelve las URLs relativas de Open Graph contra
  // localhost y las tarjetas compartidas apuntan a una máquina que no existe.
  metadataBase: new URL(urlSitio()),
  title: "Constelaciones · Manrique",
  description: DESCRIPCION,
  // Se referencia el archivo en public/logos/ en vez de duplicarlo como
  // app/icon.png: un solo origen para el isotipo, acá y en el header.
  icons: { icon: "/logos/isotipo_app.png" },
  // La imagen no se declara acá: `app/opengraph-image.tsx` se engancha solo,
  // y declararla además a mano generaría dos etiquetas og:image compitiendo.
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Constelaciones",
    title: "Constelaciones · Manrique",
    description: DESCRIPCION,
    url: "/",
  },
  // summary_large_image lo respetan también WhatsApp y Telegram, que es donde
  // este link se comparte de verdad.
  twitter: {
    card: "summary_large_image",
    title: "Constelaciones · Manrique",
    description: DESCRIPCION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning va acá y solo acá: extensiones como LanguageTool
    // o Grammarly inyectan atributos en <html> (data-lt-installed, etc.) antes
    // de que React hidrate, y eso dispara un warning que no es del código ni se
    // puede evitar desde el server. Solo silencia los atributos de ESTE nodo —
    // <body> y todo el árbol de adentro se siguen verificando igual.
    <html
      lang="es"
      className={`${fraunces.variable} ${dmSans.variable}`}
      // El scroll suave lo define styles/globals.css. Declararlo acá también es
      // lo que pide Next 16 para no aplicarlo en los cambios de ruta: sin esto,
      // navegar entre páginas anima el salto al tope y se ve como un tirón.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <TemaInicial />
      </head>
      <body>
        {children}

        {/* Va en el layout raíz y no en (site): el panel de moderación es
            justamente donde confundir preproducción con producción hace daño.
            En producción no se renderiza — devuelve null. */}
        <IndicadorEntorno entorno={entornoDesde(process.env.VERCEL_ENV)} />

        {/* Analítica sin cookies ni identificadores persistentes: cuenta visitas
            y páginas, no personas. Por eso no requiere banner de consentimiento
            y no entra en conflicto con la política de habeas data del proyecto.
            Ver docs/analitica.md. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
