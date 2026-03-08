import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Viral Nation Brand Colors
        primary: {
          50: '#fff0f5',
          100: '#ffe0ef',
          200: '#ffc2df',
          300: '#ff94cf',
          400: '#ff47bf',
          500: '#ff005c',
          600: '#e60053',
          700: '#b30041',
          800: '#800030',
          900: '#4d001d',
        },
        secondary: {
          50: '#fff5ed',
          100: '#ffe8d2',
          200: '#ffd4a5',
          300: '#ffb877',
          400: '#ff9749',
          500: '#ff6927',
          600: '#e65c22',
          700: '#b4471a',
          800: '#823613',
          900: '#4f240c',
        },
        tertiary: {
          50: '#fffcf0',
          100: '#fff9e1',
          200: '#fff3c3',
          300: '#ffeba5',
          400: '#ffe087',
          500: '#ffc227',
          600: '#e6ac23',
          700: '#b3871b',
          800: '#806313',
          900: '#4d3f0c',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-proxima-regular)',
          'Proxima Nova',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
