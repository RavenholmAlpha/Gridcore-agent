/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a", // Deep Void
        surface: "#141414", // Onyx
        primary: "#EDEDED", // Titanium White
        secondary: "#A1A1AA", // Silver Mist
        border: "#27272a", // Steel
        success: "#10B981", // Neon Green
        danger: "#EF4444", // Crimson
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
