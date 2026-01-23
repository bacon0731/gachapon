/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
        },
        accent: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#B91C1C',
        },
        neutral: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#CCCCCC',
          500: '#777777',
          700: '#333333',
          900: '#111111',
        },
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

