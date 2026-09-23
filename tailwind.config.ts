import type { Config } from "tailwindcss";

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
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
