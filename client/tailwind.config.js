/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#E0F2FE',
          light: '#F0F9FF',
          dark: '#BAE6FD',
        },
        accent: {
          DEFAULT: '#60A5FA',
        },
        healthcareBg: '#F8FCFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(59, 130, 246, 0.1)',
        'premium-hover': '0 20px 40px -15px rgba(59, 130, 246, 0.18)',
      }
    },
  },
  plugins: [],
}
