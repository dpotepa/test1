/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        hand: ['Caveat', 'cursive'],
      },
      colors: {
        paper: {
          DEFAULT: '#1e1b18',
          light: '#2a2520',
          dark: '#161310',
          line: '#332e28',
        },
      },
    },
  },
  plugins: [],
}
