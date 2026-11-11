/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        court: {
          navy: '#0d1b2a',
          dark: '#1b263b',
          wood: '#412211',
          gold: '#c59b27',
          'gold-light': '#e0b84c',
          parchment: '#f8f5ee',
          border: '#e2d9c8',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
};

