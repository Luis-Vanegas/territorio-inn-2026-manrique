import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";

// Fraunces variable con optical sizing activo: el mismo archivo se ajusta de titular (140px) a texto de apoyo.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Territorio INN 2026 · Manrique",
  description:
    "Propuesta para la Comuna 3 de Medellín — Presupuesto Participativo Comuna 3. Reto: Empleo y Desarrollo Económico.",
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
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${GeistSans.variable}`}
      // El scroll suave lo define styles/globals.css. Declararlo acá también es
      // lo que pide Next 16 para no aplicarlo en los cambios de ruta: sin esto,
      // navegar entre páginas anima el salto al tope y se ve como un tirón.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        {children}

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
