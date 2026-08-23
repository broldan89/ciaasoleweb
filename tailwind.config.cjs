/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        // Puedes agregar colores personalizados si quieres
        stone: {
          50: "#f8f7f4",
          100: "#f0eeea",
          200: "#d6d2cb",
          300: "#b8b2a8",
          400: "#999185",
          500: "#7b7263",
          600: "#5f574a",
          700: "#463f35",
          800: "#2e2922",
          900: "#191613",
        },
      },
    },
  },
  plugins: [],
};
