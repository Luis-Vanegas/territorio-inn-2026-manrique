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

        // Firmamento (DESIGN.md › Firmamento): la paleta de noche NO cambia con
        // el tema claro/oscuro, por eso son hex fijos y no variables. Ningún
        // nombre pisa a los de arriba: el morado y el azul de noche son tonos
        // más claros del mismo acento y se llaman noche-morado / noche-azul.
        // Contrastes medidos (fórmula WCAG) en DESIGN.md.
        noche: "#0B1026",
        "noche-2": "#121A3A",
        "noche-3": "#1A2450",
        "noche-activa": "#202C62", // fila activa de las tablas; el #23306A del prototipo dejaba tenue-2 y ladrillo en 4,3:1
        trazo: "#2C3A72", // solo decorativo: líneas, rejillas (1,6:1, no sirve de borde de control)
        "trazo-2": "#6573B0", // bordes de chips, botones e inputs: 3,75:1 sobre noche-2
        estrella: "#F3EFE4",
        tenue: "#B7BEDC",
        "tenue-2": "#8E97C2", // no usar sobre noche-activa (4,3:1)
        sodio: "#F4CC48",
        ladrillo: "#D9825B",
        "noche-morado": "#E07AD8",
        "noche-azul": "#7FB0FF",
        menta: "#5EEAD4",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
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
