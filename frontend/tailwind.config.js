/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        console: {
          bg: '#070B14',
          panel: '#0F1729',
          raised: '#161F36',
          border: '#232E4A',
          text: '#E6ECF8',
          muted: '#7C8AA8',
        },
        risk: {
          low: '#2FD480',
          moderate: '#F5B83D',
          high: '#FF7A45',
          critical: '#FF4D5E',
        },
        signal: {
          DEFAULT: '#4C8DFF',
          dim: '#2A4D8F',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(76,141,255,0.25), 0 0 24px rgba(76,141,255,0.15)',
        'glow-critical': '0 0 0 1px rgba(255,77,94,0.35), 0 0 24px rgba(255,77,94,0.25)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '80%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'scan-sweep': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'gauge-in': {
          '0%': { strokeDashoffset: 'var(--gauge-empty)' },
          '100%': { strokeDashoffset: 'var(--gauge-fill)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.2,0.6,0.4,1) infinite',
        'scan-sweep': 'scan-sweep 6s linear infinite',
        'gauge-in': 'gauge-in 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
      },
    },
  },
  plugins: [],
};
