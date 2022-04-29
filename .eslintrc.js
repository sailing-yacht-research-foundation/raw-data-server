module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  ignorePatterns: ["world.js"],
  rules: {
    'no-fallthrough': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};
