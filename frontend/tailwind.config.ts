import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system EcoPye Pay — Dark fintech green/teal
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // Primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',  // Secondary / accent
        },
        surface: {
          DEFAULT: '#0a0f1a',   // fond principal
          card:    '#111827',   // cartes
          muted:   '#1f2937',   // éléments secondaires
          border:  '#374151',   // bordures
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        }
      },
      animation: {
        shimmer:  'shimmer 2s infinite linear',
        glow:     'glow 2s ease-in-out infinite',
        slideUp:  'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        fadeIn:   'fadeIn 0.2s ease-out',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'gradient-card':  'linear-gradient(145deg, #111827 0%, #1f2937 100%)',
        'gradient-dark':  'linear-gradient(180deg, #0a0f1a 0%, #111827 100%)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
