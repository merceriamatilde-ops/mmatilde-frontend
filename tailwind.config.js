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
          50: '#fdf3f8',
          100: '#fae4f0',
          200: '#f5cae1',
          300: '#efa2cc',
          400: '#e46eb0',
          500: '#d54293',
          600: '#b72773',
          700: '#9b1e5d',
          800: '#81194d', // Main Logo Color
          900: '#6d1844',
          950: '#420a26',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
