import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Outfit"', '"Baloo 2"', ...defaultTheme.fontFamily.sans],
        body: ['"Nunito"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          50: '#f4f2ff',
          100: '#e6e1ff',
          200: '#cabdff',
          300: '#ae99ff',
          400: '#8f6dff',
          500: '#7041ff',
          600: '#5a2bdb',
          700: '#411da3',
        },
        accent: {
          blue: '#4ED4FF',
          teal: '#50F5D5',
          pink: '#FF73D2',
          yellow: '#FFE066',
        },
        surface: {
          base: '#f6f7fe',
          card: '#ffffff',
          soft: '#f0f3ff',
          dark: '#14172b',
        },
      },
      boxShadow: {
        card: '0 14px 30px rgba(47, 64, 130, 0.12)',
        glow: '0 15px 60px rgba(112, 65, 255, 0.35)',
        soft: '0 6px 18px rgba(24, 27, 58, 0.12)',
      },
      borderRadius: {
        xl2: '1.75rem',
        pill: '999px',
      },
      backgroundImage: {
        'blooket-splash': 'radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.65), transparent 45%), radial-gradient(circle at 80% 0%, rgba(126, 203, 255, 0.45), transparent 45%), linear-gradient(135deg, #5D5FEF 0%, #8E72FF 50%, #53E0FF 100%)',
        'soft-grid': 'linear-gradient(120deg, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(83, 224, 255, 0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(83, 224, 255, 0)' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
