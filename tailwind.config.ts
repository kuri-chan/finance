import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          400: '#3b82f6',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        ink: '#0f172a',
      },
      boxShadow: {
        // 面を浮かせる汎用シャドウ（カード）と、CTAの強調用
        card: '0 1px 2px 0 rgba(15,23,42,0.04), 0 10px 30px -15px rgba(15,23,42,0.15)',
        lift: '0 12px 30px -12px rgba(29,78,216,0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        // 手描き線が“描かれる”（pathLength=1 前提で dashoffset を 1→0）
        draw: {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
        draw: 'draw 0.9s ease-out 0.35s both',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
