/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070B14",
          900: "#0B1220",
          800: "#121A2B",
          700: "#1A2438",
          600: "#28344C",
        },
        ash: {
          400: "#8B96AC",
          300: "#A9B2C4",
          200: "#C7CEDC",
        },
        signal: {
          indigo: "#6366F1",
          emerald: "#34D399",
          amber: "#F5B94D",
          rose: "#F87171",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
