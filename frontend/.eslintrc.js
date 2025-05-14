module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'eslint-config-prettier',
  ],
  plugins: [
    'react',
    'jsx-a11y',
  ],
  rules: {
    // React specific rules
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    
    // Accessibility rules
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    
    // General rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline']
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
}; 