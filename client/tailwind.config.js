/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        // Ember: a warm vermilion used as the primary brand colour.
        brand: {
          50: '#fff2ec',
          100: '#ffe1d4',
          200: '#ffc3a9',
          300: '#ff9c76',
          400: '#f87349',
          500: '#ea552b',
          600: '#d4421c',
          700: '#b03317',
          800: '#8d2b19',
          900: '#722718',
        },
        // Marigold: warm gold paired with ember in gradients and highlights.
        accent: {
          50: '#fff9eb',
          100: '#ffefc7',
          200: '#ffdf8d',
          300: '#ffca52',
          400: '#f9b02a',
          500: '#e8920e',
          600: '#c97109',
          700: '#a6530c',
          800: '#86410f',
          900: '#6d3610',
        },
        // Warm "espresso" neutrals replace the default cool greys everywhere.
        slate: {
          50: '#faf6f1',
          100: '#f3ece4',
          200: '#e7dcd0',
          300: '#d3c4b5',
          400: '#a89988',
          500: '#7e6f62',
          600: '#5f5249',
          700: '#463b35',
          800: '#2e2623',
          900: '#1f1917',
          950: '#14100f',
        },
      },
      boxShadow: {
        soft: '0 2px 14px -4px rgba(60, 35, 20, 0.12)',
        lift: '0 18px 40px -14px rgba(212, 66, 28, 0.35)',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-24px, 24px) scale(0.95)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        blob: 'blob 14s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
