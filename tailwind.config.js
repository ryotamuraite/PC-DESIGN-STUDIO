/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 PC DESIGN STUDIO ブランドカラーパレット
        brand: {
          // メインカラー: 浅葱色 (Asagi)
          primary: {
            50: '#f0fdff',
            100: '#ccf7fe', 
            200: '#9aefff',
            300: '#58e3ff',
            400: '#22d3ee',
            500: '#00a3af', // メインブランドカラー
            600: '#0891a3',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63'
          },
          // サブカラー: 深い浅葱
          secondary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd', 
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#005a63', // 深い浅葱色
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e'
          },
          // アクセントカラー: 淡い浅葱
          accent: {
            50: '#f0fdff',
            100: '#ccf7fe',
            200: '#9aefff', 
            300: '#7dd3db', // 淡い浅葱色
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63'
          }
        },
        // 既存のprimaryは維持（互換性のため）
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}