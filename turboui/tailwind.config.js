/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    ".storybook/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent-1': 'var(--color-accent-1)',
        'accent-1-light': 'var(--color-accent-1-light)',
        'surface-base': 'var(--color-surface-base)',
        'surface-accent': 'var(--color-surface-accent)',
        'surface-outline': 'var(--color-surface-outline)',
        'content-base': 'var(--color-content-base)',
        'content-dimmed': 'var(--color-content-dimmed)',
        'content-subtle': 'var(--color-content-subtle)',
        'white-1': 'var(--color-white-1)',
      },
    },
  },
  plugins: [],
}