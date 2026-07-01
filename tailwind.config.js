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
        cream: {
          50: '#FFFBF0',
          100: '#FFF5E0',
          200: '#FFE8A3',
          300: '#FFD76E',
          400: '#FFC730',
        },
        mint: {
          50: '#F0FFF7',
          100: '#D4F7E3',
          200: '#A8E6CF',
          300: '#6DD3A8',
          400: '#3CC080',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#B8E0F2',
          300: '#7CC6E8',
          400: '#38A8D8',
        },
        peach: {
          50: '#FFF5F3',
          100: '#FFE4E0',
          200: '#FFB7B2',
          300: '#FF8A80',
          400: '#FF5D4F',
        },
        lavender: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E0BBE4',
          300: '#C88CD0',
          400: '#AE5DB8',
        },
        carrot: {
          50: '#FFF8F0',
          100: '#FFEDD5',
          200: '#FFDAC1',
          300: '#FFB980',
          400: '#FF9940',
        },
      },
      fontFamily: {
        cute: ['"Comic Sans MS"', '"Yuanti SC"', '"Hiragino Sans GB"', 'sans-serif'],
        round: ['"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '20px',
        'xl3': '24px',
        'xl4': '28px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(255, 215, 100, 0.4)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
};
