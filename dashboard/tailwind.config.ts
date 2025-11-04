/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d4a373',
          light: '#e6c9a8',
          dark: '#b8875d',
        },
        secondary: {
          DEFAULT: '#eebd2b',
          light: '#f5d875',
          dark: '#d4a515',
        },
        accent: {
          DEFAULT: '#E87A5D',
          light: '#f0a894',
          dark: '#d55838',
        },
        info: {
          DEFAULT: '#A0DDE6',
          light: '#c8edf2',
          dark: '#7bc9d6',
        },
      },
    },
  },
  plugins: [],
};
