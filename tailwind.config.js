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
        torn: {
          50: '#fef7ee',
          100: '#fdeed6',
          200: '#f9d9ad',
          300: '#f5be79',
          400: '#ef9543',
          500: '#ea741e',
          600: '#dc5c14',
          700: '#b64713',
          800: '#923817',
          900: '#752f15',
        },
      },
    },
  },
  plugins: [],
} 