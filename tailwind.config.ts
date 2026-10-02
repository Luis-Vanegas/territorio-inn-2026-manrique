import type { Config } from "tailwindcss";
import { PALETA_NOCHE } from "./lib/paleta";

// hueso/tinta invierten de valor según el modo (ver styles/globals.css).
// azul/morado/amarillo son la paleta de marca del equipo Constelaciones, cada
// uno con una función fija — ver docs/decisiones-diseno.md.
// Todos los colores leen de variables --*-rgb para que un solo cambio en
// styles/globals.css baste para los dos modos, y para que los modificadores
// de opacidad de Tailwind (text-tinta/70) sigan funcionando.
// Breakpoints pedidos por el brief: mobile-first con quiebres en 640 / 1024 / 1440.
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      lg: "1024px",
      xl: "1440px",
    },
    extend: {
      // Tailwind solo genera alphas de la escala (5, 10, 15…): `border-tinta/12`
      // y `bg-tinta/8` no existían y el borde caía en el gris por defecto
      // (#E5E7EB), clarísimo sobre el hueso oscuro. Ver DESIGN.md › Color.
      opacity: { 8: "0.08", 12: "0.12" },
      colors: {
        hueso: "rgb(var(--hueso-rgb) / <alpha-value>)",
        tinta: "rgb(var(--tinta-rgb) / <alpha-value>)",
        // Base = bordes, iconos, fills decorativos. -texto = texto o fill con
        // texto encima, calibrado a 4.5:1 en cada modo. amarillo nunca es
        // texto, solo fill con tinta encima.
        morado: "rgb(var(--morado-rgb) / <alpha-value>)",
        "morado-texto": "rgb(var(--morado-texto-rgb) / <alpha-value>)",
        azul: "rgb(var(--azul-rgb) / <alpha-value>)",
        "azul-texto": "rgb(var(--azul-texto-rgb) / <alpha-value>)",
        amarillo: "rgb(var(--amarillo-rgb) / <alpha-value>)",

        // Firmamento (DESIGN.md › Firmamento): la paleta de noche NO cambia con
        // el tema claro/oscuro, por eso son hex fijos y no variables (viven en lib/paleta.ts). Ningún
        // nombre pisa a los de arriba: el morado y el azul de noche son tonos
        // más claros del mismo acento y se llaman noche-morado / noche-azul.
        // Contrastes medidos (fórmula WCAG) en DESIGN.md.
        ...PALETA_NOCHE,
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        // Cifras, fuentes (créditos de un dato) y fechas, y nada más. Ver DESIGN.md.
        cifra: ["var(--font-dm-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        // `mono` queda apuntando a la del sistema, sin descargar ninguna: no se
        // usa en el cromo (ver DESIGN.md), pero un <code> o una columna de
        // números que tenga que cuadrar todavía tiene a dónde ir.
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
