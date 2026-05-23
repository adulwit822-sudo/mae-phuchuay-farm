import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dce8ff',
          200: '#b3ceff',
          300: '#7aa8ff',
          400: '#3d7fff',
          500: '#1458dc',
          600: '#0d3fa8',
          700: '#0b2f7c',
          800: '#0c2660',
          900: '#0d1f4c',
          950: '#07122d',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#c9a227',
          600: '#a07a1e',
        },
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
