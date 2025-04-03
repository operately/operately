module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Add custom rules here
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Often too verbose
    '@typescript-eslint/no-explicit-any': 'warn', // Warn, don't error
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignore variables starting with _
  },
  overrides: [
    {
      // Apply to .js/.jsx files
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off', // Allow require in JS files
      },
    },
    {
      // Apply to .astro files
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
  ],
};
