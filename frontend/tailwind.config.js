/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ghost: {
          dark: '#0a0a0b',
          accent: '#7c3aed',
          border: '#27272a',
          text: '#e4e4e7',
          muted: '#a1a1aa',
        }
      }
    },
  },
  plugins: [],
}
