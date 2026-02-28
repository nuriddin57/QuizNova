import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', '"Sora"', ...defaultTheme.fontFamily.sans],
        body: ['"Rajdhani"', '"Sora"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          50: '#ece8ff',
          100: '#d9d1ff',
          200: '#b7a4ff',
          300: '#9d7bff',
          400: '#8b5cf6',
          500: '#6d4af2',
          600: '#5737d5',
          700: '#3f26ac',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#22d3ee',
          teal: '#2dd4bf',
          pink: '#f472b6',
          yellow: '#facc15',
        },
        surface: {
          base: '#060914',
          card: 'rgba(12, 20, 42, 0.78)',
          soft: 'rgba(29, 42, 74, 0.48)',
          dark: '#040711',
        },
      },
      boxShadow: {
        card: '0 16px 48px rgba(0, 0, 0, 0.42), 0 0 32px rgba(59, 130, 246, 0.18)',
        glow: '0 0 36px rgba(34, 211, 238, 0.45), 0 0 72px rgba(139, 92, 246, 0.25)',
        soft: '0 8px 24px rgba(4, 7, 17, 0.45)',
      },
      borderRadius: {
        xl2: '1.6rem',
        pill: '999px',
      },
      backgroundImage: {
        'blooket-splash': 'radial-gradient(circle at 18% 20%, rgba(139, 92, 246, 0.32), transparent 45%), radial-gradient(circle at 80% 0%, rgba(34, 211, 238, 0.25), transparent 45%), linear-gradient(135deg, #0b1128 0%, #111a3b 45%, #0a243d 100%)',
        'soft-grid': 'linear-gradient(120deg, rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatySlow: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-14px) translateX(4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.45)' },
          '50%': { boxShadow: '0 0 0 14px rgba(34, 211, 238, 0)' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        floatySlow: 'floatySlow 7s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
        borderFlow: 'borderFlow 5s linear infinite',
      },
    },
  },
  plugins: [],
}
