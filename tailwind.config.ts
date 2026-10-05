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
        // Bintang Review Signature Palette (Extracted from Logo)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00a3dc', // Logo 'BINTANG' electric blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          cyan: '#06b6d4',
          glow: '#a4e4e4',
        },
        voney: {
          primary: '#00a3dc',
          lime: '#38bdf8',
          cyan: '#06b6d4',
          light: '#7dd3fc',
          dark: '#0284c7',
          muted: '#64748b',
          border: '#e2e8f0',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #00a3dc 0%, #0284c7 50%, #0369a1 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
        'brand-glow': 'linear-gradient(135deg, rgba(0, 163, 220, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        'brand-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 100%)',
        'voney-gradient': 'linear-gradient(135deg, #00a3dc 0%, #0284c7 50%, #06b6d4 100%)',
        'voney-gradient-hover': 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0891b2 100%)',
        'voney-subtle': 'linear-gradient(135deg, rgba(0, 163, 220, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
        'voney-sheen': 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
