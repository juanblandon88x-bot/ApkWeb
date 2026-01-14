/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        'sirnet-dark': '#1a1d2e',
        'sirnet-darker': '#2a2d3e',
        'sirnet-border': '#3a3d4e',
        'sirnet-blue': '#4a90e2',
        'sirnet-blue-dark': '#357abd',
        'sirnet-blue-light': '#6bb6ff',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s infinite',
        'scale-pulse': 'scale-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(74, 144, 226, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(74, 144, 226, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'scale-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
};
