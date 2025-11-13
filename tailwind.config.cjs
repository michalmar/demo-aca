module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        background: '#0f1115',
        surface: '#1a1f24',
      },
      borderRadius: {
        'lg': '0.75rem',
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(0,0,0,0.4)'
      }
    },
  },
  plugins: [],
};
