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
          primary: '#10b981',
          lime: '#84cc16',
          cyan: '#06b6d4',
          light: '#22d3ee',
          dark: '#059669',
          muted: '#64748b',
          border: '#e2e8f0',
        },
        brand: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
      },
      backgroundImage: {
        'voney-gradient': 'linear-gradient(135deg, #84cc16 0%, #10b981 45%, #06b6d4 100%)',
        'voney-gradient-hover': 'linear-gradient(135deg, #65a30d 0%, #059669 45%, #0891b2 100%)',
        'voney-subtle': 'linear-gradient(135deg, rgba(132, 204, 22, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
        'voney-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
