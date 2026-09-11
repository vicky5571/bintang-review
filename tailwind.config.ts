import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Voney Money Manager Signature Palette
        voney: {
          primary: '#00c48c',
          light: '#44ebcf',
          dark: '#00a877',
          muted: '#6b7280',
          border: '#e5e7eb',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#00c48c', // Voney signature primary
          600: '#00a877', // Voney primary-dark
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      backgroundImage: {
        'voney-gradient': 'linear-gradient(135deg, #00c48c 0%, #10b981 50%, #44ebcf 100%)',
        'voney-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
