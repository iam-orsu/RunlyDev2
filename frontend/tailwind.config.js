/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'runly-bg': '#0e1117',
        'runly-panel': '#161b22',
        'runly-border': '#30363d',
        'runly-accent': '#58a6ff',
        'runly-text': '#e6edf3',
        'runly-muted': '#8b949e',
        'runly-success': '#3fb950',
        'runly-error': '#ff7b72',
        'runly-warning': '#ffa657',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
