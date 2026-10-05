import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter carregada via next/font no layout raiz
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Cor da marca (índigo)
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Cores semânticas dos status das tarefas
        pending: {
          soft: "#fef3c7",
          DEFAULT: "#d97706",
          strong: "#92400e",
        },
        progress: {
          soft: "#e0f2fe",
          DEFAULT: "#0284c7",
          strong: "#075985",
        },
        done: {
          soft: "#d1fae5",
          DEFAULT: "#059669",
          strong: "#065f46",
        },
      },
    },
  },
  plugins: [],
};
export default config;
