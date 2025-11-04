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
        primary: '#d4a373',
        secondary: '#eebd2b',
        accent: '#E87A5D',
        info: '#A0DDE6',
      },
    },
  },
  plugins: [],
}
