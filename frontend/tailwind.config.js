/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cfddcf',
          300: '#acc4ac',
          400: '#84a584',
          500: '#668a66',
          600: '#506e50',
          700: '#415841',
          800: '#354735',
          900: '#2d3b2d',
        },
        mint: {
          50: '#f0fdf7',
          100: '#dbfbe9',
          200: '#bbf5d5',
          300: '#86eab7',
          400: '#49d492',
          500: '#22b874',
          600: '#14965c',
          700: '#12764b',
          800: '#135d3d',
          900: '#124c33',
        }
      },
      boxShadow: {
        'soft-green': '0 4px 20px -2px rgba(16, 185, 129, 0.08)',
        'card-hover': '0 10px 25px -3px rgba(16, 185, 129, 0.12)',
      }
    },
  },
  plugins: [],
}
