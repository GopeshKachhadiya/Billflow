function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--bg-color-rgb'),
        'on-surface': withOpacity('--on-surface-rgb'),
        'on-surface-variant': withOpacity('--on-surface-variant-rgb'),
        'surface-container-lowest': withOpacity('--surface-container-lowest-rgb'),
        'surface-container-low': withOpacity('--surface-container-low-rgb'),
        'surface-container': withOpacity('--surface-container-rgb'),
        'surface-container-high': withOpacity('--surface-container-high-rgb'),
        'surface-container-highest': withOpacity('--surface-container-highest-rgb'),
        'surface-dim': withOpacity('--bg-color-rgb'),
        'outline-variant': withOpacity('--outline-variant-rgb'),
        'input-bg': withOpacity('--input-bg-rgb'),
        obsidian: {
          bg: '#090514',
          card: '#140f2a',
          hover: '#1e183a',
          border: '#2d2450',
        },
        primary: {
          DEFAULT: '#a78bfa', // violet-400
          dark: '#7c3aed',    // violet-600
          light: '#c084fc',   // purple-400
        },
        secondary: {
          DEFAULT: '#f472b6', // pink-400
          dark: '#db2777',    // pink-600
          light: '#fbcfe8',   // pink-200
        },
        tertiary: {
          DEFAULT: '#fb923c', // orange-400
          dark: '#ea580c',    // orange-600
          light: '#fed7aa',   // orange-200
        },
        'tertiary-container': '#432100',
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        }
      },
      animation: {
        grid: "grid 15s linear infinite",
      },
      keyframes: {
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
