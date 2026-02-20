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
          DEFAULT: '#4A6C56', // Sage/Forest Green
          hover: '#3B5544',   // Darker sage
          light: '#E9F0EC',   // Very light sage
          50: '#F4F7F5',
          100: '#E9F0EC',
          200: '#CADBD1',
          300: '#A3C2AF',
          400: '#7FA88E',
          500: '#4A6C56', // Base Sage
          600: '#3B5544',
          700: '#2C4033',
          800: '#1D2A22',
          900: '#0E1511',
        },
        neutral: {
          0: '#FFFFFF',
          25: '#FCFCFC',
          50: '#F3F1EA',  // Warm Neutral (Sand/Beige)
          100: '#FFFFFF', // Card Bg (White)
          150: '#F0EFE9',
          200: '#E5E4DE', // Borders
          300: '#D1D0C9', // Icons
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Semantic aliases
        sidebar: {
          bg: '#F3F1EA',       // Matches page bg for Rail style
          border: 'transparent', // No border for rail
          text: '#6B7280',
          activeBg: '#4A6C56', // Primary Sage for active circle
          activeText: '#FFFFFF' // White text on active
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',    // Card radius
        'pill': '9999px',   // Buttons, Badges
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)', // Very subtle ambient shadow
        'card': '0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.04)', // Border + Shadow hybrid
        'float': '0 10px 30px rgba(0, 0, 0, 0.08)', // Dropdowns/Modals
      }
    },
  },
  plugins: [],
}
