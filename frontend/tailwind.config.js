/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#faf8ff',
          100: '#f1ebff',
          200: '#e2d6ff',
          300: '#cbb3fd',
          400: '#a97cf7',
          500: '#8b5cf6',
          600: '#7440d8',
          700: '#5f2fb3',
        },
        // Deep purple-tinted surfaces for dark mode
        surface: {
          DEFAULT: '#0D0A16',
          raised: '#15101F',
          card: '#181228',
          border: '#2B2140',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139,92,246,0.15), 0 8px 24px -8px rgba(139,92,246,0.45)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)', opacity: '0.6' },
          '100%': { transform: 'rotate(360deg)', opacity: '0.6' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        radar: 'radar 4s linear infinite',
      },
    },
  },
  plugins: [],
};
