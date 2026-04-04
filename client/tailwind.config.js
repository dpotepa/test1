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
          DEFAULT: '#faf7f2',
          card: '#ffffff',
          border: '#e8e2da',
          line: '#d4cdc4',
        },
        sage: {
          50: '#f3f7f3',
          100: '#e4ede4',
          200: '#c9dbc9',
          300: '#a3c4a3',
          400: '#7cab7c',
          500: '#5a8f5a',
          600: '#477347',
          700: '#3a5d3a',
          800: '#314c31',
          900: '#2a3f2a',
        },
        warm: {
          50: '#faf7f2',
          100: '#f3ede4',
          200: '#e8e2da',
          300: '#d4cdc4',
          400: '#b5aca0',
          500: '#8b8580',
          600: '#6b6560',
          700: '#524e4a',
          800: '#3a3530',
          900: '#2a2520',
        },
      },
    },
  },
  plugins: [],
}
