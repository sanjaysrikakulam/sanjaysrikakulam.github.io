export default [
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', 'coverage/**'] },
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
    },
  },
];
