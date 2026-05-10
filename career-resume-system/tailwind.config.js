/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          50: '#e8edf4',
          100: '#c5d1e3',
          200: '#9fb3d0',
          300: '#7995bd',
          400: '#5c7eaf',
          500: '#3f67a1',
          600: '#355993',
          700: '#294983',
          800: '#1e3a5f',
          900: '#132640',
        },
        accent: {
          DEFAULT: '#ff6b35',
          50: '#fff1eb',
          100: '#ffdcc6',
          200: '#ffc49c',
          300: '#ffac72',
          400: '#ff9652',
          500: '#ff6b35',
          600: '#e5551f',
          700: '#bf4116',
          800: '#993210',
          900: '#73240b',
        },
        background: '#f8f9fc',
        card: '#ffffff',
        success: '#10b981',
        text: {
          primary: '#1a1a2e',
          secondary: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
