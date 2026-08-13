/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        dreamBackground: '#FFFDFB',
        dreamSurface: '#FFFFFF',
        dreamAccent: {
          DEFAULT: '#FF7A3D',
          dark: '#E85D25'
        },
        dreamNavy: '#1D2A3A',
        dreamGreen: '#1FA96B',
        dreamGold: '#FFB020',
        dreamRed: '#E4453A',
        dreamMuted: '#8A8F98',
        dreamBlush: '#FFF1EA',
        dreamBorder: '#F1EEE8'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif']
      },
      borderRadius: {
        premium: '12px',
        premiumLarge: '16px'
      }
    },
  },
  plugins: [],
}
