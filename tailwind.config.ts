import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EcoPye Sea Green — couleur principale du site
        brand: {
          50:  '#E8FBF4',
          100: '#C2F5E2',
          200: '#85EBC5',
          300: '#3DD9A2',
          400: '#1CC48A',
          500: '#0FAF78',
          600: '#0A9465', // Principal
          700: '#077850',
          800: '#055C3D',
          900: '#03402A',
        },
        // Or saharien — accent chaleureux
        gold: {
          50:  '#fff8ea',
          100: '#ffebc2',
          200: '#ffd98a',
          300: '#f5c569',
          400: '#ebb24a',
          500: '#E8A838', // Or Sahara principal
          600: '#c98d23',
          700: '#a26e18',
        },
        // Vert succès (argent reçu)
        success: {
          50:  '#e8f7ef',
          100: '#c6ebd4',
          500: '#00A550',
          600: '#008a42',
          700: '#006b33',
        },
        // Surface neutre
        surface: {
          50:  '#FAFAFA',
          100: '#F2F4F8',
          200: '#E0E4EC',
          300: '#c7ccd6',
          700: '#3f4552',
          800: '#1e293b',
          900: '#0f172a',
        },
        ink: {
          primary: '#1A1C22',
          secondary: '#5C6270',
          muted: '#8A8F98',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0A9465 0%, #077850 100%)',
        'gradient-gold': 'linear-gradient(135deg, #E8A838 0%, #f5c569 100%)',
        'gradient-card': 'linear-gradient(140deg, #0A1F15 0%, #0A9465 60%, #077850 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0A9465 0%, #1CC48A 100%)',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(10, 148, 101, 0.12)',
        'card-hover': '0 8px 30px rgba(10, 148, 101, 0.22)',
        'wallet': '0 20px 50px -12px rgba(7, 120, 80, 0.40)',
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-brand': 'pulseBrand 2s infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(10, 148, 101, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(10, 148, 101, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}

export default config
