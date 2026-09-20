/** Tailwind design tokens for the whole app. Change colours here, not in pages. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
        },
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          500: '#3b6cf6',
          600: '#2554e0',
          700: '#1d44b8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans Bengali"',
          '"Hind Siliguri"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
      },
    },
  },
  plugins: [],
};
