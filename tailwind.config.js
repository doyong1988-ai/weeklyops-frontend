/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: {
        primary: {
          50: '#F5F4FF', 100: '#EDEBFE', 200: '#DDD9FD', 300: '#C4BEFB',
          400: '#A599F8', 500: '#4F46E5', 600: '#4338CA', 700: '#3730A3',
        },
        navy: { 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
        surface: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0' },
      },
    },
  },
  plugins: [],
};
