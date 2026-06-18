export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./*.css"
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xl: '1280px',
      'sidebar-sm': '640px'
    },
    extend: {
      colors: {
        sidebar: {
          bg: '#0b1120',
          hover: '#1a2332',
          active: '#253147',
          muted: '#9ca3af'
        },
        accent: {
          primary: 'rgba(20, 184, 166, 0.1)'
        }
      },
      boxShadow: {
        sidebar: '4px 0 24px rgba(0, 0, 0, 0.3)'
      }
    }
  }
}
