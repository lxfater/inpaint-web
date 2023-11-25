const tailwindScrollbar = require('tailwind-scrollbar')

module.exports = {
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        primary: '#BDFF01',
      },
    },
  },
  variants: {},
  plugins: [tailwindScrollbar],
  purge: {
    // Filenames to scan for classes
    content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
    // Options passed to PurgeCSS
    options: {
      // Whitelist specific selectors by name
      // safelist: [],
    },
  },
}
