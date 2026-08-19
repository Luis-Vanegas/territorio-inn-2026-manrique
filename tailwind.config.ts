import type { Config } from "tailwindcss";

// Paleta editorial: hueso de fondo, tinta como texto, terracota como único acento (tejas de Manrique).
// Breakpoints pedidos por el brief: mobile-first con quiebres en 640 / 1024 / 1440.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      lg: "1024px",
      xl: "1440px",
    },
    extend: {
      colors: {
        hueso: "#F7F5F0",
        tinta: "#1A1A1A",
        terracota: "#C55A3C",
        // Misma terracota, luminancia bajada hasta cruzar 4.5:1 sobre hueso (WCAG AA).
        // Ver docs/sistema-diseno-a11y.md sección 0. Uso: texto/fills con texto encima,
        // nunca bordes o iconos sueltos (ahí terracota sola ya cumple 3:1).
        "terracota-texto": "#A34B33",
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
