/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0eeff',
          100: '#e0ddff',
          200: '#c2baff',
          300: '#a397ff',
          400: '#8574ff',
          500: '#6c63ff',
          600: '#5850e8',
          700: '#4640c4',
          800: '#3530a0',
          900: '#24207c',
        },
        ink: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          deep: '#0f3460',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
