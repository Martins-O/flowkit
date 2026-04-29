import type { Config } from 'tailwindcss';

export default {
  content: ['./entrypoints/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEEDFE',
          100: '#CECBF6',
          400: '#7F77DD',
          600: '#534AB7',
          800: '#3C3489',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
