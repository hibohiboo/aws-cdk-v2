// eslint-disable-next-line no-undef
module.exports = {
  env: {
    node: true,
    commonjs: true,
    browser: false,
  },
  root: true,
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
};
