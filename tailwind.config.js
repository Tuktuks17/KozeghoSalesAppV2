/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#52B55A', // Kozegho Green
          hover: '#419949',
          light: '#E7EAE5',
        },
        secondary: {
          DEFAULT: '#858579', // Kozegho Gray
          light: '#A3AA9C', 
        },
        neutral: {
          100: '#E7EAE5',
          200: '#C8CDC3',
          300: '#A3AA9C',
          900: '#1a1a1a', 
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
