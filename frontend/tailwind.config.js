/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Electric Indigo
          600: '#4f46e5', // Primary Action Indigo
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        slate: {
          850: '#0f172a',
          900: '#0b1120',
          950: '#070b14', // Ultra-deep Obsidian Midnight
        },
        surface: {
          card: 'rgba(15, 23, 42, 0.75)',
          hover: 'rgba(30, 41, 59, 0.8)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        overdue: {
          orange: '#f97316',
          red: '#ef4444',
          darkRed: '#991b1b',
        },
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-brand': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.35)',
        'glow-orange': '0 0 25px -5px rgba(249, 115, 22, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
