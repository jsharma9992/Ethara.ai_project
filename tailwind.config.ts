import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ethara: {
          ink:      "#17202a",
          teal:     "#0f766e",
          tealDark: "#0a5c55",
          tealLight:"#ccfbf1",
          mint:     "#d9f99d",
          line:     "#e2e8f0",
          soft:     "#f4f6fa",
          muted:    "#64748b"
        }
      },
      boxShadow: {
        card:    "0 1px 4px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 6px 20px -4px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.07)",
        modal:   "0 20px 60px -8px rgb(0 0 0 / 0.22), 0 8px 20px -4px rgb(0 0 0 / 0.10)"
      },
      borderRadius: {
        DEFAULT: "10px"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
